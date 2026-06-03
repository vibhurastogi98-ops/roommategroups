import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { GoogleGenerativeAI } from "@google/generative-ai";

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  ASSETS: { fetch: typeof fetch }
  GEMINI_API_KEY: string
  JWT_SECRET?: string
  FCM_PROJECT_ID?: string
  FCM_CLIENT_EMAIL?: string
  FCM_PRIVATE_KEY?: string
  FCM_SERVER_KEY?: string
}

type JwtPayload = {
  uid: string
  role: string
  exp: number
}

type Variables = {
  jwtPayload: JwtPayload | null
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ── CORS ─────────────────────────────────────────────────────
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null  // Reject requests with no Origin (non-browser server-to-server)
    // Allow localhost, local IP (for emulators), and capacitor origins
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('10.0.2.2') || origin.startsWith('capacitor://')) return origin
    if (origin.includes('workers.dev') || origin.includes('roommategroups')) return origin
    return null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.use('*', async (c, next) => {
  c.set('jwtPayload', await getVerifiedJwtPayload(c))
  await next()
})

// ── Global Error Handler ──────────────────────────────────────
app.onError((err, c) => {
  console.error('[WORKER ERROR]', err)
  return c.json({
    success: false,
    error: err.message,
    stack: c.env.GEMINI_API_KEY ? undefined : err.stack // Only show stack if not in prod (heuristic)
  }, 500)
})

// ── R2 Health Check ──────────────────────────────────────────
app.get('/r2-check', async (c) => {
  try {
    const list = await c.env.BUCKET.list({ limit: 1 })
    return c.json({
      success: true,
      message: 'R2 Bucket is connected and working! 🚀',
      bucket: 'roommate-bucket',
      objects_found: list.objects.length > 0 ? 'Yes' : 'None yet'
    })
  } catch (err) {
    const error = err as Error
    return c.json({ success: false, message: 'R2 Connection failed', error: error.message }, 500)
  }
})

// ── R2: Upload a file (multipart/form-data) ──────────────────
// POST /upload or POST /r2/upload  → { key, url, size, contentType }
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5 MB

async function handleUpload(c: any) {
  const uploaderId = await requireAuth(c)
  if (!uploaderId) return c.res
  try {
    const formData = await c.req.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return c.json({ success: false, error: 'No file provided. Send field name: image' }, 400)
    }

    // Validate MIME type against allowlist — never trust file.name extension
    const mime = file.type.toLowerCase()
    const ext = ALLOWED_MIME_TO_EXT[mime]
    if (!ext) {
      return c.json({ success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }, 415)
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return c.json({ success: false, error: 'File too large. Maximum size is 5 MB.' }, 413)
    }

    // Random UUID filename — never use original filename
    const key      = `uploads/${crypto.randomUUID()}.${ext}`
    const fileData = await file.arrayBuffer()

    await c.env.BUCKET.put(key, fileData, {
      httpMetadata: { contentType: mime },
    })

    return c.json({
      success: true,
      key,
      url: `/r2/${key}`,
      size: file.size,
      contentType: mime,
    }, 201)
  } catch (err) {
    const error = err as Error
    return c.json({ success: false, error: error.message }, 500)
  }
}

app.post('/upload', handleUpload)
app.post('/r2/upload', handleUpload)

// GET /r2/*  e.g. /r2/uploads/abc123.webp
app.get('/r2/*', async (c) => {
  // Use c.req.path directly and strip the '/r2/' prefix for maximum reliability
  const path = c.req.path
  const key = path.startsWith('/r2/') ? path.slice(4) : path
  
  if (!key) return c.json({ error: 'Missing key', path }, 400)

  const object = await c.env.BUCKET.get(key)

  if (!object) {
    return c.json({ error: 'Object not found', key, bucket: 'BUCKET' }, 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  // ⚠️ Do NOT use 'immutable' for R2 keys that can be overwritten.
  // 'must-revalidate' + short max-age ensures updated images show within 1 hour.
  headers.set('cache-control', 'public, max-age=3600, must-revalidate')

  return new Response(object.body, { headers })
})

// ── R2: List objects (optional prefix filter) ────────────────
// GET /r2-list?prefix=uploads/
app.get('/r2-list', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const prefix  = c.req.query('prefix') || ''
    const cursor  = c.req.query('cursor')
    const options: R2ListOptions = { limit: 50, prefix }
    if (cursor) options.cursor = cursor

    const list = await c.env.BUCKET.list(options)

    return c.json({
      success: true,
      objects: list.objects.map(o => ({
        key:          o.key,
        size:         o.size,
        uploaded:     o.uploaded,
        etag:         o.etag,
        contentType:  o.httpMetadata?.contentType,
      })),
      truncated: list.truncated,
      cursor:    list.truncated ? list.cursor : null,
    })
  } catch (err) {
    const error = err as Error
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ── R2: Delete a file by key ─────────────────────────────────
// DELETE /r2/:key*
app.delete('/r2/:key{.+}', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const key = c.req.param('key')
    await c.env.BUCKET.delete(key)
    return c.json({ success: true, key, deleted: true })
  } catch (err) {
    const error = err as Error
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ── R2: Proxy legacy /assets/img/:file route ─────────────────
// REMOVED to allow Cloudflare Assets to serve static images from /assets/img/
// Use /r2/uploads/filename for R2 images.

// ── R2: Favicon from bucket ───────────────────────────────────
app.get('/favicon.png', async (c) => {
  const object = await c.env.BUCKET.get('favicon.png')
  if (!object) return fetch(c.req.raw)
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  return new Response(object.body, { headers })
})

app.get('/favicon.svg', async (c) => {
  const object = await c.env.BUCKET.get('favicon.svg')
  if (!object) return fetch(c.req.raw)
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  return new Response(object.body, { headers })
})

app.get('/favicon.ico', async (c) => {
  const object = await c.env.BUCKET.get('favicon.ico')
  if (!object) return fetch(c.req.raw)
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  return new Response(object.body, { headers })
})

// Helper: JSON response for DB-backed endpoints.
function dbJson(c: any, data: any, status = 200, headers: Record<string, string> = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }) {
  return c.json(data, status, headers)
}

// ── Auth helpers ─────────────────────────────────────────────
const JWT_TTL_SECONDS = 30 * 24 * 60 * 60
const PBKDF2_ITERATIONS = 100_000
const AUTH_RATE_LIMIT_WINDOW_MS = 60 * 1000
const AUTH_RATE_LIMIT_MAX = 5
const loginRateLimits = new Map<string, { count: number; resetAt: number }>()
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
let fcmAccessTokenCache: { token: string; expiresAt: number } | null = null

function base64UrlEncode(input: string | ArrayBuffer | Uint8Array): string {
  const bytes = typeof input === 'string'
    ? textEncoder.encode(input)
    : input instanceof Uint8Array
      ? input
      : new Uint8Array(input)

  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(segment: string): Uint8Array | null {
  try {
    let input = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padding = input.length % 4
    if (padding) input += '='.repeat(4 - padding)
    const binary = atob(input)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

function base64UrlJson(data: unknown): string {
  return base64UrlEncode(JSON.stringify(data))
}

function parseBase64UrlJson<T>(segment: string): T | null {
  const bytes = base64UrlDecode(segment)
  if (!bytes) return null
  try {
    return JSON.parse(textDecoder.decode(bytes)) as T
  } catch {
    return null
  }
}

async function getJwtKey(secret: string, usages: Array<'sign' | 'verify'>): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages
  )
}

async function signJwt(payload: { uid: string; role?: string; exp?: number }, secret: string): Promise<string> {
  if (!secret) throw new Error('JWT_SECRET is not configured')
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JwtPayload = {
    uid: payload.uid,
    role: payload.role || 'user',
    exp: payload.exp || now + JWT_TTL_SECONDS,
  }
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(fullPayload)}`
  const key = await getJwtKey(secret, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(signingInput))
  return `${signingInput}.${base64UrlEncode(signature)}`
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  if (!token || !secret) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const header = parseBase64UrlJson<{ alg?: string; typ?: string }>(parts[0])
  if (!header || header.alg !== 'HS256' || header.typ !== 'JWT') return null

  const signature = base64UrlDecode(parts[2])
  if (!signature) return null

  const key = await getJwtKey(secret, ['verify'])
  const signingInput = `${parts[0]}.${parts[1]}`
  const valid = await crypto.subtle.verify('HMAC', key, signature, textEncoder.encode(signingInput))
  if (!valid) return null

  const payload = parseBase64UrlJson<JwtPayload>(parts[1])
  if (!payload || typeof payload.uid !== 'string' || typeof payload.exp !== 'number') return null
  if (Math.floor(Date.now() / 1000) >= payload.exp) return null

  return {
    uid: payload.uid,
    role: typeof payload.role === 'string' && payload.role ? payload.role : 'user',
    exp: payload.exp,
  }
}

function getAuthSecret(c: any): string {
  return c.env.JWT_SECRET || c.env.GEMINI_API_KEY || ''
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function derivePasswordHash(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    key,
    256
  )
  return bytesToHex(new Uint8Array(bits))
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hashHex = await derivePasswordHash(password, salt)
  return `pbkdf2:${bytesToHex(salt)}:${hashHex}`
}

function isLegacyHash(stored: string): boolean {
  return stored.startsWith('h_') && stored.length < 20
}

function legacyHash(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i)
    hash |= 0
  }
  return `h_${Math.abs(hash).toString(36)}`
}

async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false
  if (isLegacyHash(stored)) return constantTimeEqual(legacyHash(password), stored)
  if (!stored.startsWith('pbkdf2:')) return false

  const parts = stored.split(':')
  if (parts.length !== 3) return false
  const salt = hexToBytes(parts[1])
  if (!salt) return false

  const actualHex = await derivePasswordHash(password, salt)
  if (constantTimeEqual(actualHex, parts[2])) return true

  // Browser-created local accounts used 200k iterations before server auth
  // moved hashing into the Worker. Accept them so synced local accounts keep
  // working, then the login route rehashes them with the Worker format.
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const legacyBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 200_000 },
    key,
    256
  )
  const legacyHex = bytesToHex(new Uint8Array(legacyBits))
  return constantTimeEqual(legacyHex, parts[2])
}

function shouldRehashPassword(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && isLegacyHash(stored)
}

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function generateUserId(): string {
  return `user_${crypto.randomUUID()}`
}

function generateStripeCustomerId(): string {
  return `cus_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`
}

function getClientIp(c: any): string {
  const forwardedFor = c.req.header('X-Forwarded-For') || ''
  return c.req.header('CF-Connecting-IP') || forwardedFor.split(',')[0].trim() || 'unknown'
}

function consumeLoginRateLimit(c: any): { allowed: boolean; retryAfter: number } {
  const key = getClientIp(c)
  const now = Date.now()
  const current = loginRateLimits.get(key)

  if (!current || current.resetAt <= now) {
    loginRateLimits.set(key, { count: 1, resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  if (current.count >= AUTH_RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
  }

  current.count += 1
  return { allowed: true, retryAfter: 0 }
}

function isLocalRequest(c: any): boolean {
  try {
    const url = new URL(c.req.url)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

async function getVerifiedJwtPayload(c: any): Promise<JwtPayload | null> {
  const auth = c.req.header('Authorization') || ''
  const match = auth.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  return verifyJwt(match[1].trim(), getAuthSecret(c))
}

function getRequestJwtPayload(c: any): JwtPayload | null {
  return c.get('jwtPayload') || null
}

// The bearer token must be a signed JWT verified by the auth middleware.
function getRequestUserId(c: any): string | null {
  return getRequestJwtPayload(c)?.uid || null
}

function getRequestRole(c: any): string {
  return getRequestJwtPayload(c)?.role || ''
}

function toPublicUser(row: any): Record<string, any> {
  const user = { ...row }
  delete user.password_hash
  delete user.passwordHash

  if ('is_active' in user) user.is_active = !!user.is_active
  if ('profileComplete' in user) user.profileComplete = !!user.profileComplete
  if ('emailVerified' in user) user.emailVerified = !!user.emailVerified
  if ('id_verified' in user) user.id_verified = !!user.id_verified
  if ('phone_verified' in user) user.phone_verified = !!user.phone_verified
  if ('show_phone' in user) user.show_phone = !!user.show_phone
  if ('is_dealer' in user) user.is_dealer = !!user.is_dealer

  const jsonFields = ['lifestyle_tags', 'saved_listings', 'saved_searches', 'blocked_users', 'push_tokens', 'notification_prefs']
  jsonFields.forEach((field) => {
    if (typeof user[field] === 'string') {
      try { user[field] = JSON.parse(user[field]) } catch { user[field] = field === 'notification_prefs' ? {} : [] }
    }
  })

  return user
}

function parseJsonArrayValue(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string' || raw.trim() === '') return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function isRawPhoneField(key: string): boolean {
  const normalized = String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return [
    'phone', 'phonenumber', 'mobile', 'mobilenumber', 'telephone', 'tel',
    'contactphone', 'contactnumber', 'whatsapp', 'whatsappnumber',
  ].includes(normalized)
}

function shouldMaskPhoneTextField(key: string): boolean {
  const normalized = String(key || '').toLowerCase()
  if (!normalized) return false
  if (/(^|_)(id|slug|url|image|photo|icon|schema|currency|status|role|kind|created|updated|rowid|lat|lng|longitude|latitude)($|_)/.test(normalized)) return false
  return [
    'title', 'description', 'displayname', 'name', 'bio', 'brand', 'address',
    'preferredarea', 'comment', 'body', 'message', 'location_note',
  ].includes(normalized.replace(/[^a-z0-9]/g, '')) || normalized.includes('title') || normalized.includes('description') || normalized.includes('bio')
}

function maskPhoneNumbers(value: string): string {
  return String(value || '').replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, (candidate) => {
    const digits = candidate.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 16 ? '[contact via chat]' : candidate
  })
}

function scrubRawContactFields<T = any>(value: T, key = ''): T {
  if (Array.isArray(value)) return value.map(item => scrubRawContactFields(item, key)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [childKey, childValue] of Object.entries(value as Record<string, any>)) {
      if (isRawPhoneField(childKey)) continue
      out[childKey] = scrubRawContactFields(childValue, childKey)
    }
    return out as T
  }
  if (typeof value === 'string' && shouldMaskPhoneTextField(key)) return maskPhoneNumbers(value) as T
  return value
}

function setJsonResponse(c: any, data: any, status = 200): Response {
  const response = dbJson(c, data, status)
  c.res = response
  return response
}

async function requireAuth(c: any): Promise<string | null> {
  const userId = getRequestUserId(c)
  if (!userId) {
    setJsonResponse(c, { error: 'Authentication required' }, 401)
    return null
  }
  return userId
}

async function requireAdmin(c: any): Promise<boolean> {
  const userId = getRequestUserId(c)
  if (!userId) { setJsonResponse(c, { error: 'Authentication required' }, 401); return false }
  if (getRequestRole(c) !== 'admin') {
    setJsonResponse(c, { error: 'Forbidden' }, 403)
    return false
  }
  return true
}

function requestIsAdmin(c: any): boolean {
  return getRequestRole(c) === 'admin'
}

function collectR2KeysFromValue(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value) return keys
  if (Array.isArray(value)) {
    value.forEach(item => collectR2KeysFromValue(item, keys))
    return keys
  }
  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(item => collectR2KeysFromValue(item, keys))
    return keys
  }
  if (typeof value !== 'string') return keys

  const rawValues = [value]
  try {
    const parsed = JSON.parse(value)
    if (parsed !== value) collectR2KeysFromValue(parsed, keys)
  } catch {}

  for (const raw of rawValues) {
    const text = raw.trim()
    if (!text || text.startsWith('data:')) continue
    const marker = '/r2/'
    if (text.includes(marker)) {
      const key = text.slice(text.indexOf(marker) + marker.length).split(/[?#]/)[0]
      if (key) keys.add(key)
      continue
    }
    if (text.startsWith('uploads/')) keys.add(text.split(/[?#]/)[0])
  }
  return keys
}

async function deleteR2Keys(env: Bindings, keys: Set<string>): Promise<void> {
  if (!env.BUCKET || !keys.size) return
  await Promise.all(Array.from(keys).map(async key => {
    try { await env.BUCKET.delete(key) } catch {}
  }))
}

// ── AI Assist: Description Generator ────────────────────────
app.get('/api/ai-assist', (c) => {
  return c.json({ 
    success: true, 
    message: 'AI Assist API is active and ready for POST requests.',
    has_api_key: !!c.env.GEMINI_API_KEY
  })
})

app.post('/api/ai-assist', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const { category, title, amenities, lifestyleTags, draft } = await c.req.json()
    const apiKey = c.env.GEMINI_API_KEY

    if (!apiKey) {
      return c.json({ success: false, error: 'GEMINI_API_KEY not configured in Worker environment' }, 500)
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Use specific version for stability
      generationConfig: { maxOutputTokens: 1000 }
    })
    
    const prompt = `
      You are an expert real estate and roommate matching copywriter. 
      Generate a compelling, friendly, and professional description for a listing with the following details:
      - Listing Category: ${category || 'Room for Rent'}
      - Title: ${title || 'Available Space'}
      - Amenities: ${(amenities || []).join(', ')}
      - Lifestyle/Preferences: ${(lifestyleTags || []).join(', ')}
      - Additional context: ${JSON.stringify(draft || {})}
      
      The description should be between 100 and 300 words. 
      Focus on making it sound attractive to potential roommates or tenants.
      Include information about the atmosphere, neighborhood perks, and house rules if applicable.
      Format it with clean paragraphs. Do not use markdown headers, just plain text with newlines.
      Respond ONLY with the description text.
    `;

    const result = await model.generateContent(prompt)
    if (!result.response) {
      throw new Error('No response from AI model')
    }
    const text = result.response.text()
    
    if (!text) {
      throw new Error('AI generated an empty response')
    }
    
    return c.json({ success: true, text: text.trim() })
  } catch (err) {
    console.error('AI Assist error:', err)
    const error = err as Error
    return c.json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred during AI generation' 
    }, 500)
  }
})

// ── Auth: server-side registration and login ─────────────────
app.post('/auth/register', async (c) => {
  try {
    const body = await c.req.json()
    const email = normalizeEmail(body.email)
    const password = String(body.password || '')
    const displayName = String(body.display_name || body.fullName || body.name || '').trim()

    if (!isValidEmail(email)) return dbJson(c, { error: 'A valid email is required.' }, 400)
    if (password.length < 8) return dbJson(c, { error: 'Password must be at least 8 characters.' }, 400)

    const existing = await c.env.DB.prepare('SELECT user_id FROM users WHERE LOWER(email) = ?')
      .bind(email)
      .first()
    if (existing) return dbJson(c, { error: 'An account with this email already exists.' }, 409)

    const now = new Date().toISOString()
    const user = {
      user_id: generateUserId(),
      email,
      display_name: displayName || email.split('@')[0],
      profile_photo: '',
      bio: '',
      city: '',
      country: '',
      age_range: '',
      occupation: '',
      lifestyle_tags: '[]',
      verification_level: 'basic',
      subscription_tier: 'free',
      stripe_customer_id: generateStripeCustomerId(),
      saved_listings: '[]',
      saved_searches: '[]',
      blocked_users: '[]',
      notification_prefs: JSON.stringify({
        messages: true,
        matches: true,
        price_drops: true,
        digest: false,
        offers: true,
        offer_updates: true,
        reviews: true,
        saved_search: true,
      }),
      password_hash: await hashPassword(password),
      role: 'user',
      is_active: 1,
      profileComplete: 0,
      emailVerified: 1,
      budgetMin: 500,
      budgetMax: 2500,
      moveInTimeline: '',
      seller_default_country: '',
      seller_default_city: '',
      seller_payment_note: '',
      phone: '',
      show_phone: 0,
      is_dealer: 0,
      business_name: '',
      seller_rating_avg: 0,
      seller_rating_count: 0,
      response_time_mins: null,
      created_at: now,
      last_active: now,
      push_tokens: '[]',
    }

    const cols = Object.keys(user)
    const placeholders = cols.map(() => '?').join(', ')
    await c.env.DB.prepare(
      `INSERT INTO users (${cols.join(', ')}) VALUES (${placeholders})`
    ).bind(...Object.values(user)).run()

    const token = await signJwt({ uid: user.user_id, role: user.role }, getAuthSecret(c))
    return dbJson(c, { success: true, user: toPublicUser(user), token }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.post('/auth/login', async (c) => {
  const rateLimit = consumeLoginRateLimit(c)
  if (!rateLimit.allowed) {
    return c.json(
      { error: 'Too many login attempts. Please try again later.' },
      429,
      { 'Retry-After': String(rateLimit.retryAfter), 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    )
  }

  try {
    const body = await c.req.json()
    const email = normalizeEmail(body.email)
    const password = String(body.password || '')

    if (!isValidEmail(email) || !password) return dbJson(c, { error: 'Invalid email or password.' }, 401)

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE LOWER(email) = ?')
      .bind(email)
      .first()
    const storedHash = (user as any)?.password_hash
    let passwordOk = await verifyPassword(password, storedHash)

    if (user && !storedHash && isLocalRequest(c)) {
      await c.env.DB.prepare('UPDATE users SET password_hash = ?, last_active = ? WHERE user_id = ?')
        .bind(await hashPassword(password), new Date().toISOString(), (user as any).user_id)
        .run()
      passwordOk = true
    }

    if (!user || !passwordOk) return dbJson(c, { error: 'Invalid email or password.' }, 401)

    const now = new Date().toISOString()
    if (shouldRehashPassword(storedHash)) {
      await c.env.DB.prepare('UPDATE users SET password_hash = ?, last_active = ? WHERE user_id = ?')
        .bind(await hashPassword(password), now, (user as any).user_id)
        .run()
    } else {
      await c.env.DB.prepare('UPDATE users SET last_active = ? WHERE user_id = ?')
        .bind(now, (user as any).user_id)
        .run()
    }

    const publicUser = toPublicUser({ ...(user as any), last_active: now })
    const token = await signJwt({ uid: publicUser.user_id, role: publicUser.role || 'user' }, getAuthSecret(c))
    return dbJson(c, { success: true, user: publicUser, token })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.post('/auth/change-password', async (c) => {
  const userId = await requireAuth(c)
  if (!userId) return c.res

  try {
    const body = await c.req.json()
    const currentPassword = String(body.currentPassword || body.current_password || '')
    const newPassword = String(body.newPassword || body.new_password || '')

    if (newPassword.length < 8) return dbJson(c, { error: 'New password must be at least 8 characters.' }, 400)

    const user = await c.env.DB.prepare('SELECT password_hash FROM users WHERE user_id = ?')
      .bind(userId)
      .first()
    const storedHash = (user as any)?.password_hash
    const passwordOk = await verifyPassword(currentPassword, storedHash)
    if (!user || !passwordOk) return dbJson(c, { error: 'Current password is incorrect.' }, 401)

    await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE user_id = ?')
      .bind(await hashPassword(newPassword), userId)
      .run()

    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

// ── D1: Users ────────────────────────────────────────────────
app.get('/users', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM users LIMIT 1000').all()
    const mapped = results.map(toPublicUser)
    return dbJson(c, mapped)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/users', async (c) => {
  const callerId = getRequestUserId(c)
  if (!callerId) return dbJson(c, { error: 'Authentication required' }, 401)
  try {
    const body = await c.req.json()
    const id = body.user_id || `usr_${Date.now()}`
    // Caller may only create their own user record (registration sync) unless admin
    const isAdmin = getRequestRole(c) === 'admin'
    if (!isAdmin && id !== callerId) return dbJson(c, { error: 'Forbidden' }, 403)
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (!isAdmin && ['passwordHash', 'password_hash', 'role'].includes(k)) continue
      if (k === 'passwordHash') {
        mapped['password_hash'] = v
      } else if (['lifestyle_tags', 'saved_listings', 'saved_searches', 'blocked_users', 'push_tokens'].includes(k)) {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || [])
      } else if (k === 'notification_prefs') {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || {})
      } else {
        mapped[k] = v
      }
    }
    if ('show_phone' in mapped) mapped['show_phone'] = mapped['show_phone'] ? 1 : 0
    if ('is_dealer' in mapped) mapped['is_dealer'] = mapped['is_dealer'] ? 1 : 0
    const validCols = [
      'user_id', 'email', 'display_name', 'profile_photo', 'bio', 'city', 'age_range', 
      'lifestyle_tags', 'verification_level', 'subscription_tier', 'stripe_customer_id', 
      'saved_listings', 'saved_searches', 'blocked_users', 'notification_prefs', 'password_hash', 'role', 
      'is_active', 'profileComplete', 'emailVerified', 'created_at', 'last_active',
      'occupation', 'country', 'budgetMin', 'budgetMax', 'moveInTimeline',
      'id_verified', 'id_status', 'id_reject_reason', 'verification_id_photo', 'verification_selfie', 'phone_verified', 'push_tokens',
      'seller_default_country', 'seller_default_city', 'seller_payment_note', 'phone',
      'show_phone', 'is_dealer', 'business_name', 'seller_rating_avg', 'seller_rating_count',
      'response_time_mins', 'promote_credits'
    ]

    const filtered: Record<string, any> = {}
    for (const col of validCols) {
      if (mapped[col] !== undefined) filtered[col] = mapped[col]
    }

    const cols = Object.keys(filtered)
    const placeholders = cols.map(() => '?').join(', ')
    const vals = Object.values(filtered)
    
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO users (${cols.join(', ')}) VALUES (${placeholders})`
    ).bind(...vals).run()
    return dbJson(c, { success: true, user_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.put('/users/:id', async (c) => {
  const callerId = getRequestUserId(c)
  if (!callerId) return dbJson(c, { error: 'Authentication required' }, 401)
  const id = c.req.param('id')
  const isAdmin = requestIsAdmin(c)
  try {
    const body = await c.req.json()
    const adminOnlyUserFields = new Set([
      'role', 'is_active', 'subscription_tier', 'stripe_customer_id',
      'id_verified', 'id_reject_reason', 'promote_credits',
      'seller_rating_avg', 'seller_rating_count', 'response_time_mins',
    ])
    const updatesAdminOnlyField = Object.entries(body).some(([k, v]) => {
      if (adminOnlyUserFields.has(k)) return true
      if (k === 'id_status') return !['pending', 'none', '', null].includes(v as any)
      if (k === 'verification_level') return !['basic', 'phone', '', null].includes(v as any)
      return false
    })
    if ((callerId !== id || updatesAdminOnlyField) && !isAdmin) return dbJson(c, { error: 'Forbidden' }, 403)

    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (!isAdmin && ['passwordHash', 'password_hash', 'role'].includes(k)) continue
      if (k === 'passwordHash') {
        mapped['password_hash'] = v
      } else if (['lifestyle_tags', 'saved_listings', 'saved_searches', 'blocked_users', 'push_tokens'].includes(k)) {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || [])
      } else if (k === 'notification_prefs') {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || {})
      } else {
        mapped[k] = v
      }
    }
    // Handle booleans mapping for SQLite if needed
    if ('is_active' in mapped) mapped['is_active'] = mapped['is_active'] ? 1 : 0
    if ('profileComplete' in mapped) mapped['profileComplete'] = mapped['profileComplete'] ? 1 : 0
    if ('emailVerified' in mapped) mapped['emailVerified'] = mapped['emailVerified'] ? 1 : 0
    if ('show_phone' in mapped) mapped['show_phone'] = mapped['show_phone'] ? 1 : 0
    if ('is_dealer' in mapped) mapped['is_dealer'] = mapped['is_dealer'] ? 1 : 0
    
    const validCols = [
      'user_id', 'email', 'display_name', 'profile_photo', 'bio', 'city', 'age_range', 
      'lifestyle_tags', 'verification_level', 'subscription_tier', 'stripe_customer_id', 
      'saved_listings', 'saved_searches', 'blocked_users', 'notification_prefs', 'password_hash', 'role', 
      'is_active', 'profileComplete', 'emailVerified', 'created_at', 'last_active',
      'occupation', 'country', 'budgetMin', 'budgetMax', 'moveInTimeline', 'push_tokens',
      'id_verified', 'id_status', 'id_reject_reason', 'verification_id_photo', 'verification_selfie', 'phone_verified',
      'seller_default_country', 'seller_default_city', 'seller_payment_note', 'phone',
      'show_phone', 'is_dealer', 'business_name', 'seller_rating_avg', 'seller_rating_count',
      'response_time_mins', 'promote_credits'
    ]
    const filtered: Record<string, any> = {}
    for (const col of validCols) {
      if (mapped[col] !== undefined) filtered[col] = mapped[col]
    }

    if (Object.keys(filtered).length === 0) return dbJson(c, { success: true })
    const sets = Object.keys(filtered).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(filtered), id]
    await c.env.DB.prepare(`UPDATE users SET ${sets} WHERE user_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.delete('/users/:id', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const isAdmin = requestIsAdmin(c)
    if (!isAdmin && callerId !== id) return dbJson(c, { error: 'Forbidden' }, 403)

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(id).first()
    if (!user) return dbJson(c, { error: 'User not found' }, 404)

    const r2Keys = new Set<string>()
    collectR2KeysFromValue((user as any).profile_photo, r2Keys)
    collectR2KeysFromValue((user as any).verification_id_photo, r2Keys)
    collectR2KeysFromValue((user as any).verification_selfie, r2Keys)

    const { results: userListings } = await c.env.DB.prepare('SELECT * FROM listings WHERE user_id = ?').bind(id).all()
    const listingIds = (userListings as any[]).map(l => String(l.listing_id || '')).filter(Boolean)
    for (const listing of userListings as any[]) {
      collectR2KeysFromValue((listing as any).images, r2Keys)
      collectR2KeysFromValue((listing as any).image_url, r2Keys)
      collectR2KeysFromValue((listing as any).cover_image, r2Keys)
      collectR2KeysFromValue((listing as any).featured_image, r2Keys)
    }

    const { results: participantThreads } = await c.env.DB.prepare(
      `SELECT thread_id FROM threads WHERE participants LIKE ?`
    ).bind(`%${id}%`).all()
    const threadIds = new Set<string>((participantThreads as any[]).map(t => String(t.thread_id || '')).filter(Boolean))

    for (const listingId of listingIds) {
      const { results: listingThreads } = await c.env.DB.prepare('SELECT thread_id FROM threads WHERE listing_id = ?').bind(listingId).all()
      ;(listingThreads as any[]).forEach(t => {
        if (t.thread_id) threadIds.add(String(t.thread_id))
      })
    }

    for (const threadId of threadIds) {
      const { results: threadMessages } = await c.env.DB.prepare('SELECT photo_url FROM messages WHERE thread_id = ?').bind(threadId).all()
      ;(threadMessages as any[]).forEach(message => collectR2KeysFromValue((message as any).photo_url, r2Keys))
      await c.env.DB.prepare('DELETE FROM messages WHERE thread_id = ?').bind(threadId).run()
      await c.env.DB.prepare('DELETE FROM threads WHERE thread_id = ?').bind(threadId).run()
    }

    const { results: sentMessagePhotos } = await c.env.DB.prepare('SELECT photo_url FROM messages WHERE sender_id = ?').bind(id).all()
    ;(sentMessagePhotos as any[]).forEach(message => collectR2KeysFromValue((message as any).photo_url, r2Keys))
    await c.env.DB.prepare('DELETE FROM messages WHERE sender_id = ?').bind(id).run()

    await c.env.DB.prepare('DELETE FROM mp_offers WHERE buyer_id = ?').bind(id).run()
    for (const listingId of listingIds) {
      await c.env.DB.prepare('DELETE FROM mp_offers WHERE listing_id = ?').bind(listingId).run()
      await c.env.DB.prepare('DELETE FROM mp_reviews WHERE listing_id = ?').bind(listingId).run()
    }
    await c.env.DB.prepare('DELETE FROM mp_reviews WHERE reviewer_id = ? OR reviewee_id = ?').bind(id, id).run()
    await c.env.DB.prepare('DELETE FROM notifications WHERE user_id = ?').bind(id).run()
    await c.env.DB.prepare('DELETE FROM reports WHERE reporter_id = ? OR target_user_id = ?').bind(id, id).run().catch(() => null)
    await c.env.DB.prepare('DELETE FROM listings WHERE user_id = ?').bind(id).run()
    await c.env.DB.prepare('DELETE FROM users WHERE user_id = ?').bind(id).run()
    await deleteR2Keys(c.env, r2Keys)
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message || 'Delete failed' }, 500)
  }
})

app.post('/users/:id/block', async (c) => {
  const blockerId = await requireAuth(c)
  if (!blockerId) return c.res
  try {
    const blockedId = c.req.param('id')
    
    const user = await c.env.DB.prepare('SELECT blocked_users FROM users WHERE user_id = ?').bind(blockerId).first()
    let blocked: string[] = []
    if (user && user.blocked_users) {
      try { 
        blocked = typeof user.blocked_users === 'string' ? JSON.parse(user.blocked_users) : (user.blocked_users || [])
      } catch(e) {}
    }
    if (!blocked.includes(blockedId)) {
      blocked.push(blockedId)
      await c.env.DB.prepare('UPDATE users SET blocked_users = ? WHERE user_id = ?')
        .bind(JSON.stringify(blocked), blockerId).run()
    }
    
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Block failed' }, 500)
  }
})

// ── D1: Listings ─────────────────────────────────────────────
function mapListingRow(l: any) {
  const listing = { ...l }
  delete listing.is_promoted
  delete listing.promo_rank
  delete listing.promo_slot

  const jsonFields = ['images', 'photos', 'amenities', 'tags', 'lifestyle_tags', 'roommate_prefs', 'attributes']
  jsonFields.forEach(f => {
    if (typeof listing[f] === 'string') {
      try { listing[f] = JSON.parse(listing[f]); } catch(e) { listing[f] = (f === 'roommate_prefs' || f === 'attributes') ? {} : []; }
    }
  })
  if ('is_featured' in listing) listing.is_featured = !!listing.is_featured
  if ('utilities_included' in listing) listing.utilities_included = !!listing.utilities_included
  if ('negotiable' in listing) listing.negotiable = !!listing.negotiable
  return scrubRawContactFields(listing)
}

function buildFtsQuery(input: string): string {
  return String(input || '')
    .toLowerCase()
    .match(/[a-z0-9]+/gi)
    ?.slice(0, 8)
    .map((token) => `${token}*`)
    .join(' AND ') || ''
}

app.get('/listings', async (c) => {
  try {
    const parseNumberParam = (value: string | undefined): number | null => {
      if (value === undefined || value.trim() === '') return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    const parseBooleanParam = (value: string | undefined): boolean | null => {
      if (value === undefined) return null
      const normalized = value.trim().toLowerCase()
      if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
      if (['0', 'false', 'no', 'off'].includes(normalized)) return false
      return null
    }
    const parsePositiveInt = (value: string | undefined, fallback: number): number => {
      const parsed = Number.parseInt(value || '', 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
    }
    const page = parsePositiveInt(c.req.query('page'), 1)
    const limit = Math.min(parsePositiveInt(c.req.query('limit'), 24), 100)
    const offset = (page - 1) * limit
    const now = new Date().toISOString()

    const kind = (c.req.query('kind') || '').trim()
    const country = (c.req.query('country') || '').trim()
    const city = (c.req.query('city') || '').trim()
    const category = (c.req.query('category') || '').trim()
    const condition = (c.req.query('condition') || '').trim()
    const q = (c.req.query('q') || '').trim()
    const ftsQuery = buildFtsQuery(q)
    const ftsAvailable = ftsQuery
      ? !!(await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE name = 'listings_fts' LIMIT 1").first())
      : false
    const minPrice = parseNumberParam(c.req.query('min'))
    const maxPrice = parseNumberParam(c.req.query('max'))
    const negotiable = parseBooleanParam(c.req.query('negotiable'))
    const verified = parseBooleanParam(c.req.query('verified'))
    const lat = parseNumberParam(c.req.query('lat'))
    const lng = parseNumberParam(c.req.query('lng'))
    const radius = parseNumberParam(c.req.query('radius'))
    const hasGeo = lat !== null && lng !== null
    const hasRadius = hasGeo && radius !== null && radius > 0
    const requestedSort = (c.req.query('sort') || (q ? 'relevance' : 'newest')).trim().toLowerCase()
    const sort = ['relevance', 'newest', 'price_asc', 'price_desc', 'distance'].includes(requestedSort)
      ? requestedSort
      : 'newest'

    const cteParts: string[] = []
    const cteParams: any[] = []
    if (ftsQuery && ftsAvailable) {
      cteParts.push(`fts_matches AS (
        SELECT rowid, bm25(listings_fts) AS fts_rank
        FROM listings_fts
        WHERE listings_fts MATCH ?
      )`)
      cteParams.push(ftsQuery)
    }
    if (category) {
      cteParts.push(`category_tree(category_id) AS (
        SELECT category_id FROM mp_categories WHERE category_id = ? OR slug = ?
        UNION ALL
        SELECT child.category_id
        FROM mp_categories child
        JOIN category_tree parent ON child.parent_id = parent.category_id
      )`)
      cteParams.push(category, category)
    }

    const where: string[] = ['l.status = ?']
    const whereParams: any[] = ['active']

    if (kind) {
      where.push('l.kind = ?')
      whereParams.push(kind)
    }
    if (country) {
      where.push(`(
        l.city IN (SELECT city_id FROM cities WHERE country = ?)
        OR l.city IN (SELECT slug FROM cities WHERE country = ?)
      )`)
      whereParams.push(country, country)
    }
    if (city) {
      where.push('(l.city = ? OR l.city IN (SELECT city_id FROM cities WHERE slug = ? OR city_id = ?))')
      whereParams.push(city, city, city)
    }
    if (category) {
      where.push('l.category_id IN (SELECT category_id FROM category_tree)')
    }
    if (minPrice !== null) {
      where.push('l.price >= ?')
      whereParams.push(minPrice)
    }
    if (maxPrice !== null) {
      where.push('l.price <= ?')
      whereParams.push(maxPrice)
    }
    if (condition) {
      where.push('l.condition = ?')
      whereParams.push(condition)
    }
    if (q && !ftsQuery) where.push('1 = 0')
    if (q && ftsQuery && !ftsAvailable) {
      const tokens = q.toLowerCase().match(/[a-z0-9]+/gi)?.slice(0, 8) || []
      for (const token of tokens) {
        where.push(`LOWER(COALESCE(l.title, '') || ' ' || COALESCE(l.description, '') || ' ' || COALESCE(l.brand, '')) LIKE ?`)
        whereParams.push(`%${token}%`)
      }
    }
    if (negotiable !== null) {
      where.push('l.negotiable = ?')
      whereParams.push(negotiable ? 1 : 0)
    }
    if (verified === true) {
      where.push(`EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = l.user_id AND COALESCE(u.verification_level, 'none') != 'none'
      )`)
    } else if (verified === false) {
      where.push(`NOT EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = l.user_id AND COALESCE(u.verification_level, 'none') != 'none'
      )`)
    }

    const distanceExpression = `(
      3958.8 * 2.0 * asin(min(1.0, sqrt(
        pow(sin(((l.latitude - ?) * 0.017453292519943295) / 2.0), 2)
        + cos(? * 0.017453292519943295)
        * cos(l.latitude * 0.017453292519943295)
        * pow(sin(((l.longitude - ?) * 0.017453292519943295) / 2.0), 2)
      )))
    )`
    const distanceSelect = hasGeo
      ? `, CASE WHEN l.latitude IS NOT NULL AND l.longitude IS NOT NULL THEN ${distanceExpression} ELSE NULL END AS distance`
      : ''
    const ftsSelect = ftsQuery && ftsAvailable ? ', fts_matches.fts_rank AS fts_rank' : ', NULL AS fts_rank'
    const ftsJoin = ftsQuery && ftsAvailable ? 'JOIN fts_matches ON fts_matches.rowid = l.rowid' : ''
    const baseRawParams: any[] = [
      ...(hasGeo ? [lat, lat, lng] : []),
      now,
      ...whereParams,
    ]
    const baseRawSql = `base_raw AS (
      SELECT l.*${distanceSelect}${ftsSelect},
        CASE
          WHEN l.promoted_until IS NOT NULL AND datetime(l.promoted_until) > datetime(?) THEN 1
          ELSE 0
        END AS is_promoted
      FROM listings l
      ${ftsJoin}
      WHERE ${where.join(' AND ')}
    )`
    cteParts.push(baseRawSql)

    const baseParams: any[] = []
    const baseSql = hasRadius
      ? 'base AS (SELECT * FROM base_raw WHERE distance IS NOT NULL AND distance <= ?)'
      : 'base AS (SELECT * FROM base_raw)'
    if (hasRadius) baseParams.push(radius)
    cteParts.push(baseSql)

    const newestOrder = 'datetime(COALESCE(created_at, updated_at)) DESC, listing_id DESC'
    let orderSql = newestOrder
    const orderParams: any[] = []
	    if (sort === 'relevance' && q && ftsAvailable) {
	      orderSql = `fts_rank ASC, ${newestOrder}`
    } else if (sort === 'price_asc') {
      orderSql = 'price IS NULL ASC, price ASC, datetime(COALESCE(created_at, updated_at)) DESC, listing_id DESC'
    } else if (sort === 'price_desc') {
      orderSql = 'price IS NULL ASC, price DESC, datetime(COALESCE(created_at, updated_at)) DESC, listing_id DESC'
    } else if (sort === 'distance' && hasGeo) {
      orderSql = 'distance IS NULL ASC, distance ASC, datetime(COALESCE(created_at, updated_at)) DESC, listing_id DESC'
    }

    const withSql = `WITH RECURSIVE ${cteParts.join(', ')}`
    const commonParams = [...cteParams, ...baseRawParams, ...baseParams]
    const countRow = await c.env.DB.prepare(
      `${withSql} SELECT COUNT(*) AS total FROM base`
    ).bind(...commonParams).first()
    const total = Number((countRow as any)?.total || 0)

    let rows: any[] = []
    if (total > 0) {
      const { results } = await c.env.DB.prepare(
        `${withSql},
        ranked AS (
          SELECT base.*,
            ROW_NUMBER() OVER (PARTITION BY is_promoted ORDER BY ${orderSql}) AS promo_rank
          FROM base
        ),
        interleaved AS (
          SELECT *,
            CASE
              WHEN is_promoted = 1 THEN (promo_rank - 1) * 4
              ELSE promo_rank + CAST((promo_rank - 1) / 3 AS INTEGER)
            END AS promo_slot
          FROM ranked
        )
        SELECT * FROM interleaved
        ORDER BY promo_slot ASC, is_promoted DESC
        LIMIT ? OFFSET ?`
      ).bind(...commonParams, ...orderParams, limit, offset).all()
      rows = results as any[]
    }

    return dbJson(c, {
      results: rows.map(mapListingRow),
      total,
      page,
      limit,
    })
  } catch (err) {
    const error = err as Error
    console.error('[API] GET /listings failed:', error.message)
    return dbJson(c, { error: error.message || 'Database error' }, 500)
  }
})

app.get('/search/suggest', async (c) => {
  try {
    const q = (c.req.query('q') || '').trim()
    const ftsQuery = buildFtsQuery(q)
    if (!ftsQuery) return dbJson(c, { suggestions: [] })

    const { results } = await c.env.DB.prepare(
      `SELECT l.title
       FROM listings_fts
       JOIN listings l ON l.rowid = listings_fts.rowid
       WHERE listings_fts MATCH ?
         AND l.status = 'active'
         AND COALESCE(l.title, '') != ''
       ORDER BY bm25(listings_fts) ASC, datetime(COALESCE(l.created_at, l.updated_at)) DESC
       LIMIT 24`
    ).bind(ftsQuery).all()

    const seen = new Set<string>()
    const suggestions = []
    for (const row of results as any[]) {
      const title = row.title
      if (!title || seen.has(title)) continue
      seen.add(title)
      suggestions.push(maskPhoneNumbers(title))
      if (suggestions.length >= 8) break
    }

    return dbJson(c, {
      suggestions,
    })
  } catch (err) {
    const error = err as Error
    console.error('[API] GET /search/suggest failed:', error.message)
    return dbJson(c, { suggestions: [] })
  }
})

app.get('/listings/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const row = await c.env.DB.prepare('SELECT * FROM listings WHERE listing_id = ? LIMIT 1').bind(id).first()
    if (!row) return dbJson(c, { error: 'Listing not found' }, 404)
    return dbJson(c, mapListingRow(row))
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message || 'Database error' }, 500)
  }
})

const PROHIBITED_LISTING_TERMS = [
  'weapon', 'weapons', 'firearm', 'firearms', 'gun', 'guns', 'pistol', 'rifle',
  'ammunition', 'ammo', 'explosive', 'explosives', 'fireworks',
  'drug', 'drugs', 'narcotic', 'narcotics', 'cocaine', 'heroin', 'fentanyl',
  'meth', 'marijuana', 'cannabis', 'weed', 'lsd', 'ecstasy',
  'counterfeit', 'counterfeits', 'fake designer', 'replica designer',
  'stolen', 'controlled substance', 'tobacco', 'vape', 'vapes',
]

function findProhibitedListingTerm(title: any, description: any): string | null {
  const haystack = `${title || ''} ${description || ''}`.toLowerCase()
  return PROHIBITED_LISTING_TERMS.find((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack)
  }) || null
}

app.post('/listings', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const body = await c.req.json()
    const isAdmin = requestIsAdmin(c)
    const id = body.listing_id || `list_${Date.now()}`
    const kind = body.kind || 'rental'
    const now = new Date().toISOString()
    // Schema column is images; clients may still send photos.
    const rent = kind === 'sale' ? (body.rent ?? null) : (body.rent ?? 0)
    const images = body.images || body.photos || []
    const imagesVal = typeof images === 'string' ? images : JSON.stringify(images)
    const validCols = [
      'listing_id', 'user_id', 'title', 'description', 'city', 'neighborhood_id',
      'address', 'latitude', 'longitude', 'rent', 'rent_type', 'room_type',
      'bathrooms', 'available_from', 'lease_term', 'amenities', 'tags', 'images',
      'status', 'is_featured', 'view_count', 'created_at', 'updated_at',
      'moderation_status', 'rejection_reason', 'bedrooms', 'size_sqft', 'preferredArea',
      'moveInTimeline', 'budgetMin', 'budgetMax',
      'currency', 'deposit', 'min_stay', 'utilities_included', 'furnished', 'country', 'roommate_prefs',
      'kind', 'category_id', 'price', 'condition', 'negotiable', 'brand', 'attributes',
      'sold_at', 'promoted_until'
    ]
    const mapped: Record<string, any> = {
      listing_id: id,
      user_id: isAdmin && body.user_id ? body.user_id : callerId,
      title: body.title || '',
      description: body.description || '',
      city: body.city || '',
      // Compatibility aliases where the schema still uses a different name.
      neighborhood_id: body.neighborhood_id || body.neighborhood || '',
      lease_term: body.lease_term || body.lease_duration || '',
      room_type: body.room_type || '',
      status: 'active',
      rent: rent,
      kind,
      images: imagesVal,
      is_featured: 0,
      view_count: 0,
      created_at: now,
      updated_at: now,
      moderation_status: 'approved',
      rejection_reason: null,
      sold_at: null,
      promoted_until: null,
    }
    const serverOnlyCreateFields = new Set([
      'user_id',
      'is_featured',
      'view_count',
      'created_at',
      'updated_at',
      'moderation_status',
      'rejection_reason',
      'sold_at',
      'promoted_until',
    ])
    // Add any other valid cols from body
    validCols.forEach(col => {
      if (serverOnlyCreateFields.has(col)) return
      if (body[col] !== undefined && mapped[col] === undefined) {
        if (['amenities', 'tags', 'roommate_prefs', 'attributes'].includes(col)) {
          mapped[col] = typeof body[col] === 'string' ? body[col] : JSON.stringify(body[col] ?? ((col === 'roommate_prefs' || col === 'attributes') ? {} : []))
        } else if (col === 'utilities_included' || col === 'negotiable') {
          mapped[col] = body[col] ? 1 : 0
        } else {
          mapped[col] = body[col]
        }
      }
    })
    const blockedTerm = findProhibitedListingTerm(mapped.title, mapped.description)
    if (blockedTerm) {
      mapped.moderation_status = 'pending'
      mapped.status = 'pending'
      mapped.rejection_reason = mapped.rejection_reason || `Auto-queued for prohibited item review: ${blockedTerm}`
    }

    const cols = Object.keys(mapped)
    const placeholders = cols.map(() => '?').join(', ')
    const vals = Object.values(mapped)

    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO listings (${cols.join(', ')}) VALUES (${placeholders})`
    ).bind(...vals).run()
    return dbJson(c, { success: true, listing_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

const LISTING_COLUMNS = new Set([
  'user_id', 'title', 'description', 'city', 'neighborhood_id', 'address',
  'latitude', 'longitude', 'rent', 'rent_type', 'room_type', 'bathrooms',
  'available_from', 'lease_term', 'amenities', 'tags', 'images', 'status',
  'is_featured', 'view_count', 'updated_at', 'moderation_status',
  'rejection_reason', 'bedrooms', 'size_sqft', 'preferredArea',
  'moveInTimeline', 'budgetMin', 'budgetMax',
  'currency', 'deposit', 'min_stay', 'utilities_included', 'furnished', 'country', 'roommate_prefs',
  'kind', 'category_id', 'price', 'condition', 'negotiable', 'brand', 'attributes',
  'sold_at', 'promoted_until',
])
const LISTING_JSON_FIELDS = new Set(['images', 'amenities', 'tags', 'roommate_prefs', 'attributes'])

app.put('/listings/:id', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const listing = await c.env.DB.prepare('SELECT user_id FROM listings WHERE listing_id = ?').bind(id).first()
    if (!listing) return dbJson(c, { error: 'Listing not found' }, 404)
    const isAdmin = requestIsAdmin(c)
    if (!isAdmin && (listing as any).user_id !== callerId) return dbJson(c, { error: 'Forbidden' }, 403)

    const body = await c.req.json()
    const adminOnlyListingFields = new Set(['moderation_status', 'rejection_reason', 'is_featured', 'promoted_until'])
    const touchesAdminOnlyField = Object.keys(body).some(k => adminOnlyListingFields.has(k))
    if (touchesAdminOnlyField && !isAdmin) return dbJson(c, { error: 'Forbidden' }, 403)

    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      const col = k === 'lease_duration' ? 'lease_term'
                : k === 'neighborhood' ? 'neighborhood_id'
                : k
      if (!LISTING_COLUMNS.has(col)) continue
      if (!isAdmin && col === 'user_id') continue
      if (LISTING_JSON_FIELDS.has(col)) {
        const empty = (col === 'roommate_prefs' || col === 'attributes') ? {} : []
        mapped[col] = typeof v === 'string' ? v : JSON.stringify(v ?? empty)
      } else if (col === 'utilities_included' || col === 'negotiable') {
        mapped[col] = v ? 1 : 0
      } else {
        mapped[col] = v
      }
    }
    mapped['updated_at'] = new Date().toISOString()
    if (Object.keys(mapped).length <= 1) return dbJson(c, { success: true })
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    await c.env.DB.prepare(`UPDATE listings SET ${sets} WHERE listing_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[API] PUT /listings/:id failed:', msg)
    return dbJson(c, { error: msg || 'Unknown error' }, 500)
  }
})

app.delete('/listings/:id', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const listing = await c.env.DB.prepare('SELECT user_id FROM listings WHERE listing_id = ?').bind(id).first()
    if (!listing) return dbJson(c, { error: 'Listing not found' }, 404)
    if (!requestIsAdmin(c) && (listing as any).user_id !== callerId) return dbJson(c, { error: 'Forbidden' }, 403)
    await c.env.DB.prepare('DELETE FROM listings WHERE listing_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── Marketplace: sellers, reviews, offers ───────────────────
function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

function parseParticipants(raw: unknown): string[] {
  return parseJsonArrayValue(raw).map(String)
}

async function getThreadParticipants(c: any, threadId: string): Promise<string[] | null> {
  const thread = await c.env.DB.prepare('SELECT participants FROM threads WHERE thread_id = ?').bind(threadId).first()
  if (!thread) return null
  return parseParticipants((thread as any).participants)
}

async function requireThreadParticipantOrAdmin(c: any, threadId: string, userId: string): Promise<string[] | null> {
  const participants = await getThreadParticipants(c, threadId)
  if (!participants) {
    setJsonResponse(c, { error: 'Thread not found' }, 404)
    return null
  }
  if (!requestIsAdmin(c) && !participants.includes(userId)) {
    setJsonResponse(c, { error: 'Forbidden' }, 403)
    return null
  }
  return participants
}

async function findThreadBetween(c: any, listingId: string, userA: string, userB: string): Promise<any | null> {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM threads WHERE listing_id = ? ORDER BY created_at DESC'
  ).bind(listingId).all()

  for (const thread of results as any[]) {
    const participants = parseParticipants(thread.participants)
    if (participants.includes(userA) && participants.includes(userB)) return thread
  }
  return null
}

function normalizePushTokens(raw: unknown): string[] {
  const tokens = parseJsonArrayValue(raw)
    .map((token) => {
      if (typeof token === 'string') return token
      if (token && typeof token === 'object') {
        const item = token as Record<string, unknown>
        return item.token || item.fcmToken || item.value || item.id
      }
      return ''
    })
    .map((token) => String(token || '').trim())
    .filter(Boolean)
  return [...new Set(tokens)]
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem.replace(/\\n/g, '\n')
  const b64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function getFcmAccessToken(env: Bindings): Promise<string | null> {
  if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) return null
  const now = Math.floor(Date.now() / 1000)
  if (fcmAccessTokenCache && fcmAccessTokenCache.expiresAt - 60 > now) return fcmAccessTokenCache.token

  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: env.FCM_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(claim)}`
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(env.FCM_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, textEncoder.encode(signingInput))
  const assertion = `${signingInput}.${base64UrlEncode(signature)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) {
    console.warn('[Push] FCM OAuth token request failed:', await res.text())
    return null
  }
  const data = await res.json() as { access_token?: string; expires_in?: number }
  if (!data.access_token) return null
  fcmAccessTokenCache = {
    token: data.access_token,
    expiresAt: now + Number(data.expires_in || 3600),
  }
  return data.access_token
}

async function sendFcmToToken(
  env: Bindings,
  token: string,
  payload: { notification_id: string; type: string; title: string; body: string; link: string }
): Promise<void> {
  const data = {
    notification_id: payload.notification_id,
    type: payload.type,
    link: payload.link || '',
    url: payload.link || '',
  }

  try {
    const accessToken = await getFcmAccessToken(env)
    if (accessToken && env.FCM_PROJECT_ID) {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: payload.title, body: payload.body },
            data,
          },
        }),
      })
      if (!res.ok) console.warn('[Push] FCM v1 send failed:', await res.text())
      return
    }

    if (env.FCM_SERVER_KEY) {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${env.FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          notification: { title: payload.title, body: payload.body },
          data,
        }),
      })
      if (!res.ok) console.warn('[Push] FCM legacy send failed:', await res.text())
    }
  } catch (err) {
    console.warn('[Push] FCM send skipped:', err instanceof Error ? err.message : err)
  }
}

async function sendPushToUser(
  env: Bindings,
  userId: string,
  payload: { notification_id: string; type: string; title: string; body: string; link: string }
): Promise<void> {
  if (!env.FCM_SERVER_KEY && !(env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY)) return
  const user = await env.DB.prepare('SELECT push_tokens FROM users WHERE user_id = ?').bind(userId).first()
  const tokens = normalizePushTokens((user as any)?.push_tokens)
  if (!tokens.length) return
  await Promise.all(tokens.map(token => sendFcmToToken(env, token, payload)))
}

const NOTIFICATION_PREF_BY_TYPE: Record<string, string> = {
  new_message: 'messages',
  message: 'messages',
  new_offer: 'offers',
  offer_accepted: 'offer_updates',
  offer_declined: 'offer_updates',
  review_received: 'reviews',
  saved_search_match: 'saved_search',
  price_drop: 'price_drops',
}

async function notificationPrefEnabled(env: Bindings, userId: string, type: string): Promise<boolean> {
  const prefKey = NOTIFICATION_PREF_BY_TYPE[type]
  if (!prefKey) return true
  const user = await env.DB.prepare('SELECT notification_prefs FROM users WHERE user_id = ?').bind(userId).first()
  const raw = (user as any)?.notification_prefs
  if (!raw) return true
  try {
    const prefs = typeof raw === 'string' ? JSON.parse(raw) : raw
    return prefs?.[prefKey] !== false
  } catch {
    return true
  }
}

async function createNotification(c: any, userId: string, type: string, title: string, body: string, link = ''): Promise<string> {
  if (!await notificationPrefEnabled(c.env, userId, type)) return ''
  const id = newId('notif')
  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO notifications (notification_id, user_id, type, title, body, link, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
  ).bind(id, userId, type, title, body, link, new Date().toISOString()).run()
  await sendPushToUser(c.env, userId, { notification_id: id, type, title, body, link })
  return id
}

async function insertMessage(c: any, threadId: string, senderId: string, content: string, preview?: string): Promise<string> {
  const id = newId('msg')
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO messages (message_id, thread_id, sender_id, content, is_read, read_at, photo_url, created_at)
     VALUES (?, ?, ?, ?, 0, NULL, NULL, ?)`
  ).bind(id, threadId, senderId, content, now).run()

  await c.env.DB.prepare(
    'UPDATE threads SET last_message_at = ?, last_message_preview = ? WHERE thread_id = ?'
  ).bind(now, (preview || content).trim().substring(0, 80), threadId).run()

  return id
}

async function ensureOfferThread(c: any, listingId: string, buyerId: string, ownerId: string): Promise<string> {
  const existing = await findThreadBetween(c, listingId, buyerId, ownerId)
  if (existing?.thread_id) return existing.thread_id

  const threadId = newId('th')
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO threads (thread_id, participants, listing_id, last_message_at, last_message_preview, is_archived, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  ).bind(threadId, JSON.stringify([buyerId, ownerId]), listingId, now, 'Offer conversation started', now).run()
  return threadId
}

async function hasReviewPermission(c: any, listingId: string, reviewerId: string, revieweeId: string): Promise<boolean> {
  const thread = await findThreadBetween(c, listingId, reviewerId, revieweeId)
  if (thread) return true

  const acceptedOffer = await c.env.DB.prepare(
    `SELECT o.offer_id
     FROM mp_offers o
     JOIN listings l ON l.listing_id = o.listing_id
     WHERE o.listing_id = ?
       AND o.status = 'accepted'
       AND (
         (o.buyer_id = ? AND l.user_id = ?)
         OR (o.buyer_id = ? AND l.user_id = ?)
       )
     LIMIT 1`
  ).bind(listingId, reviewerId, revieweeId, revieweeId, reviewerId).first()

  return !!acceptedOffer
}

app.get('/sellers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const seller = await c.env.DB.prepare(
      `SELECT user_id, display_name, profile_photo, bio, verification_level,
              seller_rating_avg, seller_rating_count, response_time_mins,
              is_dealer, created_at
       FROM users
       WHERE user_id = ?`
    ).bind(id).first()

    if (!seller) return dbJson(c, { error: 'Seller not found' }, 404)

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM listings
       WHERE user_id = ? AND status = 'active'
       ORDER BY datetime(COALESCE(created_at, updated_at)) DESC`
    ).bind(id).all()

    const publicSeller = {
      ...(seller as any),
      is_dealer: !!(seller as any).is_dealer,
      listings: (results as any[]).map(mapListingRow),
    }

    return dbJson(c, scrubRawContactFields(publicSeller))
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Database error' }, 500)
  }
})

app.get('/reviews', async (c) => {
  try {
    const reviewee = (c.req.query('reviewee') || '').trim()
    if (!reviewee) return dbJson(c, { error: 'reviewee is required' }, 400)

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM mp_reviews
       WHERE reviewee_id = ?
       ORDER BY datetime(created_at) DESC`
    ).bind(reviewee).all()

    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Database error' }, 500)
  }
})

app.post('/reviews', async (c) => {
  const reviewerId = await requireAuth(c)
  if (!reviewerId) return c.res

  try {
    const body = await c.req.json()
    const listingId = String(body.listing_id || '').trim()
    const revieweeId = String(body.reviewee_id || '').trim()
    const role = String(body.role || '').trim()
    const rating = Number(body.rating)
    const comment = String(body.comment || '').trim()

    if (!listingId || !revieweeId) return dbJson(c, { error: 'listing_id and reviewee_id are required' }, 400)
    if (revieweeId === reviewerId) return dbJson(c, { error: 'You cannot review yourself' }, 400)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return dbJson(c, { error: 'rating must be an integer from 1 to 5' }, 400)

    const allowed = await hasReviewPermission(c, listingId, reviewerId, revieweeId)
    if (!allowed) return dbJson(c, { error: 'Review requires a prior conversation or accepted offer for this listing' }, 403)

    const reviewId = newId('rev')
    const now = new Date().toISOString()
    await c.env.DB.prepare(
      `INSERT INTO mp_reviews (review_id, listing_id, reviewer_id, reviewee_id, role, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(reviewId, listingId, reviewerId, revieweeId, role || null, rating, comment, now).run()

    const stats = await c.env.DB.prepare(
      'SELECT AVG(rating) AS avg_rating, COUNT(*) AS rating_count FROM mp_reviews WHERE reviewee_id = ?'
    ).bind(revieweeId).first()
    await c.env.DB.prepare(
      'UPDATE users SET seller_rating_avg = ?, seller_rating_count = ? WHERE user_id = ?'
    ).bind(Number((stats as any)?.avg_rating || 0), Number((stats as any)?.rating_count || 0), revieweeId).run()

    await createNotification(
      c,
      revieweeId,
      'review_received',
      'New review received',
      `You received a ${rating}-star review${comment ? `: ${comment.substring(0, 90)}` : '.'}`,
      `/dashboard/reviews`
    )

    return dbJson(c, {
      success: true,
      review: { review_id: reviewId, listing_id: listingId, reviewer_id: reviewerId, reviewee_id: revieweeId, role, rating, comment, created_at: now },
    }, 201)
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Error' }, 500)
  }
})

app.post('/offers', async (c) => {
  const buyerId = await requireAuth(c)
  if (!buyerId) return c.res

  try {
    const body = await c.req.json()
    const listingId = String(body.listing_id || '').trim()
    const amount = Number(body.amount)
    if (!listingId || !Number.isFinite(amount) || amount <= 0) return dbJson(c, { error: 'listing_id and positive amount are required' }, 400)

    const listing = await c.env.DB.prepare('SELECT listing_id, user_id, title, status FROM listings WHERE listing_id = ?').bind(listingId).first()
    if (!listing) return dbJson(c, { error: 'Listing not found' }, 404)
    const ownerId = String((listing as any).user_id || '')
    if (!ownerId) return dbJson(c, { error: 'Listing owner missing' }, 500)
    if (ownerId === buyerId) return dbJson(c, { error: 'You cannot make an offer on your own listing' }, 400)
    if ((listing as any).status === 'sold') return dbJson(c, { error: 'Listing is already sold' }, 409)

    const threadId = await ensureOfferThread(c, listingId, buyerId, ownerId)
    const offerId = newId('offer')
    const now = new Date().toISOString()
    await c.env.DB.prepare(
      `INSERT INTO mp_offers (offer_id, listing_id, buyer_id, amount, status, thread_id, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(offerId, listingId, buyerId, amount, threadId, now).run()

    const offer = { offer_id: offerId, listing_id: listingId, buyer_id: buyerId, amount, status: 'pending', thread_id: threadId, created_at: now }
    await insertMessage(
      c,
      threadId,
      buyerId,
      JSON.stringify({ kind: 'offer', ...offer, listing_title: (listing as any).title || '' }),
      `Offer: $${amount}`
    )
    await createNotification(
      c,
      ownerId,
      'new_offer',
      'New offer received',
      `You received an offer of $${amount} for ${(listing as any).title || 'your listing'}.`,
      `/dashboard/messages?thread_id=${encodeURIComponent(threadId)}`
    )

    return dbJson(c, { offer, thread_id: threadId }, 201)
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Error' }, 500)
  }
})

app.get('/offers', async (c) => {
  const userId = await requireAuth(c)
  if (!userId) return c.res

  try {
    const { results } = await c.env.DB.prepare(
      `SELECT o.*, l.user_id AS owner_id, l.title AS listing_title, l.price, l.rent,
              l.images, l.kind, l.status AS listing_status,
              buyer.display_name AS buyer_name, buyer.profile_photo AS buyer_photo,
              seller.display_name AS seller_name, seller.profile_photo AS seller_photo
       FROM mp_offers o
       JOIN listings l ON l.listing_id = o.listing_id
       LEFT JOIN users buyer ON buyer.user_id = o.buyer_id
       LEFT JOIN users seller ON seller.user_id = l.user_id
       WHERE o.buyer_id = ? OR l.user_id = ?
       ORDER BY datetime(o.created_at) DESC`
    ).bind(userId, userId).all()

    const offers = (results as any[]).map(row => ({
      ...row,
      amount: Number(row.amount || 0),
      price: row.price === null || row.price === undefined ? row.price : Number(row.price),
      rent: row.rent === null || row.rent === undefined ? row.rent : Number(row.rent),
      role: row.buyer_id === userId ? 'sent' : 'received',
    }))

    return dbJson(c, {
      sent: offers.filter(o => o.role === 'sent'),
      received: offers.filter(o => o.role === 'received'),
    })
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Error' }, 500)
  }
})

app.put('/offers/:id', async (c) => {
  const ownerId = await requireAuth(c)
  if (!ownerId) return c.res

  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const status = String(body.status || '').trim().toLowerCase()
    if (!['accepted', 'declined'].includes(status)) return dbJson(c, { error: 'status must be accepted or declined' }, 400)

    const offer = await c.env.DB.prepare(
      `SELECT o.*, l.user_id AS owner_id, l.title AS listing_title
       FROM mp_offers o
       JOIN listings l ON l.listing_id = o.listing_id
       WHERE o.offer_id = ?`
    ).bind(id).first()

    if (!offer) return dbJson(c, { error: 'Offer not found' }, 404)
    if ((offer as any).owner_id !== ownerId) return dbJson(c, { error: 'Only the listing owner can update this offer' }, 403)

    await c.env.DB.prepare('UPDATE mp_offers SET status = ? WHERE offer_id = ?').bind(status, id).run()

    const threadId = (offer as any).thread_id
    const buyerId = (offer as any).buyer_id
    if (threadId) {
      await insertMessage(
        c,
        threadId,
        ownerId,
        JSON.stringify({ kind: 'system', event: 'offer_status', offer_id: id, status }),
        `Offer ${status}`
      )
    }
    await createNotification(
      c,
      buyerId,
      status === 'accepted' ? 'offer_accepted' : 'offer_declined',
      status === 'accepted' ? 'Offer accepted' : 'Offer declined',
      `Your offer for ${(offer as any).listing_title || 'a listing'} was ${status}.`,
      threadId ? `/dashboard/messages?thread_id=${encodeURIComponent(threadId)}` : `/listing/${(offer as any).listing_id}`
    )

    return dbJson(c, { success: true, offer: { ...(offer as any), status } })
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Error' }, 500)
  }
})

app.post('/listings/:id/sold', async (c) => {
  const ownerId = await requireAuth(c)
  if (!ownerId) return c.res

  try {
    const id = c.req.param('id')
    const listing = await c.env.DB.prepare('SELECT listing_id, user_id, title FROM listings WHERE listing_id = ?').bind(id).first()
    if (!listing) return dbJson(c, { error: 'Listing not found' }, 404)
    if ((listing as any).user_id !== ownerId) return dbJson(c, { error: 'Only the listing owner can mark it sold' }, 403)

    const now = new Date().toISOString()
    await c.env.DB.prepare('UPDATE listings SET status = ?, sold_at = ?, updated_at = ? WHERE listing_id = ?')
      .bind('sold', now, now, id).run()

    const acceptedOffer = await c.env.DB.prepare(
      `SELECT * FROM mp_offers
       WHERE listing_id = ? AND status = 'accepted'
       ORDER BY datetime(created_at) DESC
       LIMIT 1`
    ).bind(id).first()

    await createNotification(
      c,
      ownerId,
      'review_prompt',
      'Listing marked sold',
      `Your listing ${(listing as any).title || ''} is marked sold. Please review the buyer when the transaction is complete.`,
      `/listing/${id}`
    )

    await createNotification(
      c,
      ownerId,
      'seller_relist_prompt',
      'Ready for the next sale?',
      'Nice sale. Relist a similar item or promote your next marketplace listing to keep buyers coming back.',
      '/post-listing?kind=sale'
    )

    if ((acceptedOffer as any)?.buyer_id) {
      await createNotification(
        c,
        (acceptedOffer as any).buyer_id,
        'review_prompt',
        'How was your purchase?',
        `Please review the seller for ${(listing as any).title || 'your purchase'}.`,
        `/listing/${id}`
      )
    }

    return dbJson(c, { success: true, listing_id: id, status: 'sold', sold_at: now })
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Error' }, 500)
  }
})

async function refreshSellerRating(c: any, userId: string): Promise<void> {
  if (!userId) return
  const stats = await c.env.DB.prepare(
    'SELECT AVG(rating) AS avg_rating, COUNT(*) AS rating_count FROM mp_reviews WHERE reviewee_id = ?'
  ).bind(userId).first()
  await c.env.DB.prepare(
    'UPDATE users SET seller_rating_avg = ?, seller_rating_count = ? WHERE user_id = ?'
  ).bind(Number((stats as any)?.avg_rating || 0), Number((stats as any)?.rating_count || 0), userId).run()
}

// ── Admin Marketplace Oversight ─────────────────────────────
app.get('/admin/marketplace', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const now = new Date().toISOString()
    const [{ results: offers }, { results: reviews }, { results: sold }, { results: promoted }, metrics] = await Promise.all([
      c.env.DB.prepare(
        `SELECT o.*, l.title AS listing_title, l.user_id AS seller_id, l.status AS listing_status,
                buyer.display_name AS buyer_name, seller.display_name AS seller_name
         FROM mp_offers o
         JOIN listings l ON l.listing_id = o.listing_id
         LEFT JOIN users buyer ON buyer.user_id = o.buyer_id
         LEFT JOIN users seller ON seller.user_id = l.user_id
         WHERE COALESCE(l.kind, 'rental') = 'sale'
         ORDER BY datetime(o.created_at) DESC
         LIMIT 100`
      ).all(),
      c.env.DB.prepare(
        `SELECT r.*, l.title AS listing_title,
                reviewer.display_name AS reviewer_name,
                reviewee.display_name AS reviewee_name
         FROM mp_reviews r
         LEFT JOIN listings l ON l.listing_id = r.listing_id
         LEFT JOIN users reviewer ON reviewer.user_id = r.reviewer_id
         LEFT JOIN users reviewee ON reviewee.user_id = r.reviewee_id
         ORDER BY datetime(r.created_at) DESC
         LIMIT 100`
      ).all(),
      c.env.DB.prepare(
        `SELECT l.*, seller.display_name AS seller_name, c.name AS category_name
         FROM listings l
         LEFT JOIN users seller ON seller.user_id = l.user_id
         LEFT JOIN mp_categories c ON c.category_id = l.category_id
         WHERE COALESCE(l.kind, 'rental') = 'sale'
           AND l.status = 'sold'
         ORDER BY datetime(COALESCE(l.sold_at, l.updated_at, l.created_at)) DESC
         LIMIT 100`
      ).all(),
      c.env.DB.prepare(
        `SELECT l.*, seller.display_name AS seller_name, c.name AS category_name
         FROM listings l
         LEFT JOIN users seller ON seller.user_id = l.user_id
         LEFT JOIN mp_categories c ON c.category_id = l.category_id
         WHERE COALESCE(l.kind, 'rental') = 'sale'
           AND l.promoted_until IS NOT NULL
           AND datetime(l.promoted_until) > datetime(?)
         ORDER BY datetime(l.promoted_until) ASC
         LIMIT 100`
      ).bind(now).all(),
      c.env.DB.prepare(
        `SELECT
           (SELECT COUNT(*) FROM listings WHERE COALESCE(kind, 'rental') = 'sale' AND status = 'active') AS items_listed,
           (SELECT COUNT(*) FROM listings WHERE COALESCE(kind, 'rental') = 'sale' AND status = 'sold') AS items_sold,
           (SELECT COUNT(*) FROM mp_offers o JOIN listings l ON l.listing_id = o.listing_id WHERE COALESCE(l.kind, 'rental') = 'sale' AND o.status = 'pending') AS open_offers,
           (SELECT AVG(seller_rating_avg) FROM users WHERE COALESCE(seller_rating_count, 0) > 0) AS avg_seller_rating`
      ).first(),
    ])

    return dbJson(c, {
      offers,
      reviews,
      sold: (sold as any[]).map(mapListingRow),
      promoted: (promoted as any[]).map(mapListingRow),
      metrics: {
        items_listed: Number((metrics as any)?.items_listed || 0),
        items_sold: Number((metrics as any)?.items_sold || 0),
        open_offers: Number((metrics as any)?.open_offers || 0),
        avg_seller_rating: Number((metrics as any)?.avg_seller_rating || 0),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Marketplace admin read failed'
    return dbJson(c, { error: msg }, 500)
  }
})

app.put('/admin/marketplace/offers/:id/void', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    const existing = await c.env.DB.prepare('SELECT offer_id FROM mp_offers WHERE offer_id = ?').bind(id).first()
    if (!existing) return dbJson(c, { error: 'Offer not found' }, 404)
    await c.env.DB.prepare('UPDATE mp_offers SET status = ? WHERE offer_id = ?').bind('voided', id).run()
    return dbJson(c, { success: true, offer_id: id, status: 'voided' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Offer update failed'
    return dbJson(c, { error: msg }, 500)
  }
})

app.delete('/admin/marketplace/reviews/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    const review = await c.env.DB.prepare('SELECT review_id, reviewee_id FROM mp_reviews WHERE review_id = ?').bind(id).first()
    if (!review) return dbJson(c, { error: 'Review not found' }, 404)
    await c.env.DB.prepare('DELETE FROM mp_reviews WHERE review_id = ?').bind(id).run()
    await refreshSellerRating(c, String((review as any).reviewee_id || ''))
    return dbJson(c, { success: true, review_id: id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Review delete failed'
    return dbJson(c, { error: msg }, 500)
  }
})

// ── D1: Cities ───────────────────────────────────────────────
app.get('/cities', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM cities').all()
    const mapped = results.map((c_obj: any) => {
      const city = { ...c_obj }
      const jsonFields = ['faq_items', 'reviews', 'marketplace_faq_items', 'marketplace_reviews']
      jsonFields.forEach(f => {
        if (typeof city[f] === 'string') {
          try { city[f] = JSON.parse(city[f]); } catch(e) { city[f] = []; }
        }
      })
      const boolFields = ['is_active', 'show_in_popular', 'show_in_popular_section', 'show_in_footer', 'marketplace_enabled']
      boolFields.forEach(f => {
        if (f in city) city[f] = !!city[f]
      })
      return city
    })
    return dbJson(c, mapped)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/cities', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const body = await c.req.json()
    const id = body.city_id || `city_${Date.now()}`
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO cities
       (city_id, name, slug, country, state_province, hero_image, description,
        avg_rent, listing_count, member_count, is_active, show_in_popular, show_in_popular_section,
        show_in_footer, meta_title, meta_description, latitude, longitude,
        faq_items, reviews, marketplace_enabled, marketplace_hero_image, marketplace_description,
        marketplace_meta_title, marketplace_meta_description, marketplace_faq_items, marketplace_reviews)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id, body.name || '', body.slug || '', body.country || '',
      body.state_province || '', body.hero_image || '', body.description || '',
      body.avg_rent || 0, body.listing_count || 0, body.member_count || 0,
      body.is_active !== false ? 1 : 0,
      body.show_in_popular ? 1 : 0,
      body.show_in_popular_section ? 1 : 0,
      body.show_in_footer ? 1 : 0,
      body.meta_title || '', body.meta_description || '',
      body.latitude || 0, body.longitude || 0,
      typeof body.faq_items === 'string' ? body.faq_items : JSON.stringify(body.faq_items || []),
      typeof body.reviews === 'string' ? body.reviews : JSON.stringify(body.reviews || []),
      body.marketplace_enabled ? 1 : 0,
      body.marketplace_hero_image || '',
      body.marketplace_description || '',
      body.marketplace_meta_title || '',
      body.marketplace_meta_description || '',
      typeof body.marketplace_faq_items === 'string' ? body.marketplace_faq_items : JSON.stringify(body.marketplace_faq_items || []),
      typeof body.marketplace_reviews === 'string' ? body.marketplace_reviews : JSON.stringify(body.marketplace_reviews || [])
    ).run()
    return dbJson(c, { success: true, city_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

const CITY_COLUMNS = new Set([
  'name', 'slug', 'country', 'state_province', 'hero_image', 'description',
  'avg_rent', 'listing_count', 'member_count', 'is_active', 'show_in_popular',
  'show_in_popular_section', 'show_in_footer', 'meta_title', 'meta_description',
  'latitude', 'longitude', 'faq_items', 'reviews', 'marketplace_enabled',
  'marketplace_hero_image', 'marketplace_description', 'marketplace_meta_title',
  'marketplace_meta_description', 'marketplace_faq_items', 'marketplace_reviews',
])

app.put('/cities/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    // Map boolean fields to integers for SQLite; serialize JSON fields
    const boolFields = ['is_active', 'show_in_popular', 'show_in_popular_section', 'show_in_footer', 'marketplace_enabled']
    const jsonFields = ['faq_items', 'reviews', 'marketplace_faq_items', 'marketplace_reviews']
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (!CITY_COLUMNS.has(k)) continue
      if (boolFields.includes(k)) {
        mapped[k] = v ? 1 : 0
      } else if (jsonFields.includes(k)) {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || [])
      } else {
        mapped[k] = v
      }
    }
    if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    await c.env.DB.prepare(`UPDATE cities SET ${sets} WHERE city_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.delete('/cities/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM cities WHERE city_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── D1: Blog Posts ───────────────────────────────────────────
app.get('/posts', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM posts ORDER BY published_date DESC'
    ).all()
    const mapped = results.map((p: any) => {
      const post = { ...p }
      // Normalize booleans
      if ('is_published' in post) post.is_published = !!post.is_published
      if ('tocEnabled' in post) post.tocEnabled = !!post.tocEnabled
      // Parse JSON fields
      const jsonFields = ['faqs', 'tags']
      jsonFields.forEach(f => {
        if (typeof post[f] === 'string') {
          try { post[f] = JSON.parse(post[f]); } catch(e) { post[f] = []; }
        }
      })
      // Reconstruct author object if needed by frontend
      post.author = {
        name: post.author_name || '',
        avatar: post.author_avatar || '',
        bio: post.author_bio || ''
      }
      return post
    })
    return dbJson(c, mapped)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/posts', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const body = await c.req.json()
    const id = body.post_id || `post_${Date.now()}`
    
    const author = body.author || {}
    const authorName   = body.author_name   || (typeof author === 'object' ? author.name   : '') || ''
    const authorAvatar = body.author_avatar  || (typeof author === 'object' ? author.avatar : '') || ''
    const authorBio    = body.author_bio     || (typeof author === 'object' ? author.bio    : '') || ''
    const dateLabel    = body.date_label || body.date || ''

    const mapped: Record<string, any> = {
      post_id: id,
      slug: body.slug || '',
      title: body.title || '',
      excerpt: body.excerpt || '',
      category: body.category || '',
      author_name: authorName,
      author_avatar: authorAvatar,
      author_bio: authorBio,
      date_label: dateLabel,
      read_time: body.readTime || body.read_time || '',
      image: body.image || '',
      content: body.content || '',
      published_date: body.published_date || new Date().toISOString(),
      is_published: body.is_published ? 1 : 0,
      seoTitle: body.seoTitle || '',
      seoDescription: body.seoDescription || body.seoDesc || '',
      focusKeyword: body.focusKeyword || '',
      canonicalUrl: body.canonicalUrl || '',
      metaRobots: body.metaRobots || 'index,follow',
      ogTitle: body.ogTitle || '',
      ogDescription: body.ogDescription || body.ogDesc || '',
      ogImage: body.ogImage || '',
      imgAlt: body.imgAlt || '',
      imgTitle: body.imgTitle || '',
      imgCaption: body.imgCaption || '',
      tocEnabled: body.tocEnabled ? 1 : 0,
      faqs: typeof body.faqs === 'string' ? body.faqs : JSON.stringify(body.faqs || []),
      tags: typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags || []),
      ctaHeading: body.ctaHeading || '',
      ctaText: body.ctaText || '',
      ctaBtnText: body.ctaBtnText || '',
      ctaBtnLink: body.ctaBtnLink || '',
      ctaPosition: body.ctaPosition || 'bottom',
      schemaType: body.schemaType || 'BlogPosting',
      schemaText: body.schemaText || body.schemaJson || '',
      redirectFrom: body.redirectFrom || '',
      redirectTo: body.redirectTo || ''
    }

    const cols = Object.keys(mapped)
    const placeholders = cols.map(() => '?').join(', ')
    const vals = Object.values(mapped)

    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO posts (${cols.join(', ')}) VALUES (${placeholders})`
    ).bind(...vals).run()
    
    return dbJson(c, { success: true, post_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.put('/posts/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    
    // Valid columns for filtering
    const validCols = [
      'slug', 'title', 'excerpt', 'category', 'author_name', 'author_avatar', 
      'author_bio', 'date_label', 'read_time', 'image', 'content', 'published_date', 
      'is_published', 'seoTitle', 'seoDescription', 'focusKeyword', 'canonicalUrl', 
      'metaRobots', 'ogTitle', 'ogDescription', 'ogImage', 'imgAlt', 'imgTitle', 
      'imgCaption', 'tocEnabled', 'faqs', 'tags', 'ctaHeading', 'ctaText', 
      'ctaBtnText', 'ctaBtnLink', 'ctaPosition', 'schemaType', 'schemaText', 
      'redirectFrom', 'redirectTo'
    ]

    for (const [k, v] of Object.entries(body)) {
      if (k === 'is_published' || k === 'tocEnabled') {
        mapped[k] = v ? 1 : 0
      } else if (k === 'author' && typeof v === 'object' && v !== null) {
        const a = v as any
        mapped['author_name']   = a.name   || ''
        mapped['author_avatar'] = a.avatar || ''
        mapped['author_bio']    = a.bio    || ''
      } else if (k === 'date') {
        mapped['date_label'] = v
      } else if (k === 'readTime') {
        mapped['read_time'] = v
      } else if (k === 'seoDesc') {
        mapped['seoDescription'] = v
      } else if (k === 'schemaJson') {
        mapped['schemaText'] = v
      } else if (k === 'faqs' || k === 'tags') {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || [])
      } else if (validCols.includes(k)) {
        mapped[k] = v
      }
    }

    const filtered: Record<string, any> = {}
    for (const col of validCols) {
      if (mapped[col] !== undefined) filtered[col] = mapped[col]
    }

    if (Object.keys(filtered).length === 0) return dbJson(c, { success: true })
    
    const sets = Object.keys(filtered).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(filtered), id]
    
    await c.env.DB.prepare(`UPDATE posts SET ${sets}, updated_at = datetime('now') WHERE post_id = ?`).bind(...vals).run()
    
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.delete('/posts/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM posts WHERE post_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── D1: Categories ───────────────────────────────────────────
const MP_CATEGORY_COLUMNS = [
  'category_id', 'parent_id', 'name', 'slug', 'icon', 'kind',
  'attributes_schema', 'sort_order', 'is_active', 'meta_title', 'meta_description',
]
const MP_CATEGORY_KINDS = new Set(['sale', 'rental'])

function normalizeMpCategoryKind(kind: unknown): string {
  const normalized = String(kind || '').trim().toLowerCase()
  if (!normalized || normalized === 'product' || normalized === 'vehicle' || normalized === 'item' || normalized === 'items') return 'sale'
  return normalized
}

function mapMpCategory(row: any): Record<string, any> {
  const category = { ...row }
  category.kind = normalizeMpCategoryKind(category.kind)
  if ('is_active' in category) category.is_active = !!category.is_active
  if ('listing_count' in category) category.listing_count = Number(category.listing_count || 0)
  if (typeof category.attributes_schema === 'string' && category.attributes_schema) {
    try { category.attributes_schema = JSON.parse(category.attributes_schema) } catch {}
  }
  return category
}

function normalizeMpCategoryBody(body: Record<string, any>, id?: string): Record<string, any> {
  const mapped: Record<string, any> = {}
  for (const col of MP_CATEGORY_COLUMNS) {
    if (body[col] === undefined) continue
    let value = body[col]
    if (col === 'attributes_schema') {
      value = typeof value === 'string' ? value : JSON.stringify(value || null)
      if (value === '' || value === 'null') value = null
    } else if (col === 'kind') {
      value = normalizeMpCategoryKind(value)
    } else if (col === 'sort_order') {
      value = Number.parseInt(String(value || 0), 10) || 0
    } else if (col === 'is_active') {
      value = value ? 1 : 0
    } else if (col === 'parent_id') {
      value = value || null
    }
    mapped[col] = value
  }
  if (id) mapped.category_id = id
  return mapped
}

function validateMpCategoryKind(c: any, kind: string | undefined) {
  if (!kind) return null
  if (!MP_CATEGORY_KINDS.has(kind)) return dbJson(c, { error: 'Category kind must be sale or rental.' }, 400)
  return null
}

app.get('/categories/tree', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM mp_categories
       WHERE is_active = 1 AND COALESCE(kind, 'sale') != 'service'
       ORDER BY sort_order ASC, name ASC`
    ).all()

    const byId = new Map<string, any>()
    const tree: any[] = []

    for (const row of results as any[]) {
      const category = { ...mapMpCategory(row), children: [] }
      byId.set(category.category_id, category)
    }

    for (const category of byId.values()) {
      if (category.parent_id && byId.has(category.parent_id)) {
        byId.get(category.parent_id).children.push(category)
      } else {
        tree.push(category)
      }
    }

    return dbJson(c, tree, 200, { 'Cache-Control': 'public, max-age=3600' })
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.get('/categories', async (c) => {
  try {
    if ((c.req.query('scope') || '').toLowerCase() === 'marketplace') {
      if (!await requireAdmin(c)) return c.res
      const { results } = await c.env.DB.prepare(
        `SELECT c.*, COUNT(l.listing_id) AS listing_count
         FROM mp_categories c
         LEFT JOIN listings l ON l.category_id = c.category_id
         WHERE COALESCE(c.kind, 'sale') != 'service'
         GROUP BY c.category_id
         ORDER BY c.sort_order ASC, c.name ASC`
      ).all()
      return dbJson(c, (results as any[]).map(mapMpCategory))
    }

    const { results } = await c.env.DB.prepare('SELECT * FROM categories').all()
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/categories', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const body = await c.req.json()
    const id = body.category_id || newId('mpcat')
    const mapped = normalizeMpCategoryBody(body, id)
    mapped.name = String(mapped.name || '').trim()
    mapped.slug = String(mapped.slug || '').trim()
    mapped.kind = mapped.kind || 'sale'
    mapped.is_active = mapped.is_active === undefined ? 1 : mapped.is_active
    mapped.sort_order = mapped.sort_order === undefined ? 0 : mapped.sort_order

    if (!mapped.name || !mapped.slug) return dbJson(c, { error: 'Category name and slug are required.' }, 400)
    const kindError = validateMpCategoryKind(c, mapped.kind)
    if (kindError) return kindError

    const cols = Object.keys(mapped)
    const placeholders = cols.map(() => '?').join(', ')
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO mp_categories (${cols.join(', ')}) VALUES (${placeholders})`
    ).bind(...Object.values(mapped)).run()

    const row = await c.env.DB.prepare('SELECT * FROM mp_categories WHERE category_id = ?').bind(id).first()
    return dbJson(c, mapMpCategory(row), 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Category save failed'
    return dbJson(c, { error: msg }, 500)
  }
})

async function updateMpCategoryFromBody(c: any, id: string, body: Record<string, any>) {
  const mapped = normalizeMpCategoryBody(body)
  delete mapped.category_id
  if ('name' in mapped) mapped.name = String(mapped.name || '').trim()
  if ('slug' in mapped) mapped.slug = String(mapped.slug || '').trim()
  if ('kind' in mapped) {
    const kindError = validateMpCategoryKind(c, mapped.kind)
    if (kindError) return kindError
  }

  if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
  if (mapped.name === '' || mapped.slug === '') return dbJson(c, { error: 'Category name and slug are required.' }, 400)

  const sets = Object.keys(mapped).map(col => `${col} = ?`).join(', ')
  await c.env.DB.prepare(`UPDATE mp_categories SET ${sets} WHERE category_id = ?`)
    .bind(...Object.values(mapped), id)
    .run()

  const row = await c.env.DB.prepare('SELECT * FROM mp_categories WHERE category_id = ?').bind(id).first()
  return dbJson(c, mapMpCategory(row || { category_id: id }))
}

app.put('/categories/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    return await updateMpCategoryFromBody(c, c.req.param('id'), await c.req.json())
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Category update failed'
    return dbJson(c, { error: msg }, 500)
  }
})

app.put('/categories', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const body = await c.req.json()
    const id = body.category_id || c.req.query('id')
    if (!id) return dbJson(c, { error: 'category_id is required.' }, 400)
    return await updateMpCategoryFromBody(c, id, body)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Category update failed'
    return dbJson(c, { error: msg }, 500)
  }
})

async function deleteMpCategory(c: any, id: string) {
  const child = await c.env.DB.prepare('SELECT category_id FROM mp_categories WHERE parent_id = ? LIMIT 1').bind(id).first()
  if (child) return dbJson(c, { error: 'Remove child categories first.' }, 409)
  const listing = await c.env.DB.prepare('SELECT listing_id FROM listings WHERE category_id = ? LIMIT 1').bind(id).first()
  if (listing) return dbJson(c, { error: 'This category is used by listings.' }, 409)
  await c.env.DB.prepare('DELETE FROM mp_categories WHERE category_id = ?').bind(id).run()
  return dbJson(c, { success: true })
}

app.delete('/categories/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    return await deleteMpCategory(c, c.req.param('id'))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Category delete failed'
    return dbJson(c, { error: msg }, 500)
  }
})

app.delete('/categories', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.query('id') || (await c.req.json().catch(() => ({}))).category_id
    if (!id) return dbJson(c, { error: 'category_id is required.' }, 400)
    return await deleteMpCategory(c, id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Category delete failed'
    return dbJson(c, { error: msg }, 500)
  }
})

// ── D1: FB Groups ─────────────────────────────────────────────
app.get('/fb-cities', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM fb_cities ORDER BY priority ASC'
    ).all()
    const mapped = results.map((fbc: any) => {
      const fbCity = { ...fbc }
      if (typeof fbCity.faqs === 'string') {
        try { fbCity.faqs = JSON.parse(fbCity.faqs); } catch(e) { fbCity.faqs = []; }
      }
      const boolFields = ['is_popular', 'is_footer']
      boolFields.forEach(f => {
        if (f in fbCity) fbCity[f] = !!fbCity[f]
      })
      return fbCity
    })
    return dbJson(c, mapped)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.get('/fb-countries', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM fb_countries ORDER BY created_at ASC'
    ).all()
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/fb-countries', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const body = await c.req.json()
    const id = body.fb_country_id || `fbc_${Date.now()}`
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO fb_countries (fb_country_id, country_name, created_at) VALUES (?,?,?)`
    ).bind(id, body.country_name || '', body.created_at || new Date().toISOString()).run()
    return dbJson(c, { success: true, fb_country_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.put('/fb-countries/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validCols = new Set(['country_name'])
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (!validCols.has(k)) continue
      mapped[k] = v
    }
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = Object.values(mapped)
    if (sets.length > 0) {
      await c.env.DB.prepare(`UPDATE fb_countries SET ${sets} WHERE fb_country_id = ?`).bind(...vals, id).run()
    }
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.delete('/fb-countries/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    await c.env.DB.prepare('DELETE FROM fb_countries WHERE fb_country_id = ?').bind(c.req.param('id')).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/fb-cities', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const body = await c.req.json()
    const id = body.fb_city_id || `fbcity_${Date.now()}`
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO fb_cities
       (fb_city_id, country_id, city_name, city_image, fb_group_name, fb_group_link,
        total_members, is_popular, priority, is_footer, description, faqs, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id, body.country_id || '', body.city_name || '', body.city_image || '',
      body.fb_group_name || '', body.fb_group_link || '',
      body.total_members || 0, body.is_popular ? 1 : 0,
      body.priority || 99, body.is_footer ? 1 : 0, body.description || '', 
      typeof body.faqs === 'string' ? body.faqs : JSON.stringify(body.faqs || []),
      body.created_at || new Date().toISOString()
    ).run()
    return dbJson(c, { success: true, fb_city_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.put('/fb-cities/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validCols = new Set([
      'country_id', 'city_name', 'city_image', 'fb_group_name', 'fb_group_link',
      'total_members', 'is_popular', 'priority', 'is_footer', 'description', 'faqs',
    ])
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (!validCols.has(k)) continue
      mapped[k] = (k === 'is_popular' || k === 'is_footer') ? (v ? 1 : 0)
                : (k === 'faqs' && typeof v === 'object') ? JSON.stringify(v)
                : v
    }
    if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    await c.env.DB.prepare(`UPDATE fb_cities SET ${sets} WHERE fb_city_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.delete('/fb-cities/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM fb_cities WHERE fb_city_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── D1: Threads ──────────────────────────────────────────────
app.get('/threads', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM threads').all()
    const mapped = results.map((t: any) => ({
      ...t,
      participants: typeof t.participants === 'string' ? JSON.parse(t.participants) : (t.participants || [])
    }))
    return dbJson(c, mapped)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/threads', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const body = await c.req.json()
    const id = body.thread_id || `th_${Date.now()}`
    const participants = parseParticipants(body.participants || [])
    if (!requestIsAdmin(c) && !participants.includes(callerId)) return dbJson(c, { error: 'Forbidden' }, 403)
    
    await c.env.DB.prepare(`INSERT OR REPLACE INTO threads (thread_id, participants, listing_id, last_message_at, last_message_preview, is_archived, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, 
      JSON.stringify(participants),
      body.listing_id,
      body.last_message_at || new Date().toISOString(),
      body.last_message_preview || '',
      body.is_archived ? 1 : 0,
      body.created_at || new Date().toISOString()
    ).run()

    if (body.listing_id && participants.length) {
      const listing = await c.env.DB.prepare(
        `SELECT l.listing_id, l.user_id, l.title, l.kind, l.city, cities.slug AS city_slug
         FROM listings l
         LEFT JOIN cities ON cities.city_id = l.city OR cities.slug = l.city
         WHERE l.listing_id = ?
         LIMIT 1`
      ).bind(body.listing_id).first()

      const isRentalThread = listing && String((listing as any).kind || 'rental') === 'rental'
      if (isRentalThread) {
        const citySlug = String((listing as any).city_slug || (listing as any).city || '').trim()
        const furnishLink = `/search/rooms?kind=sale&category=furniture${citySlug ? `&city=${encodeURIComponent(citySlug)}` : ''}`
        for (const participantId of participants) {
          if (!participantId || participantId === (listing as any).user_id) continue
          if (await notificationExists(c.env, participantId, 'rental_furnish_prompt', furnishLink)) continue
          await createNotification(
            c,
            participantId,
            'rental_furnish_prompt',
            'Just found a place?',
            'Shop Furniture & Home items from local RoommateGroups members to furnish your next room.',
            furnishLink
          )
        }
      }
    }
    
    return dbJson(c, { success: true, thread_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

const THREAD_COLUMNS = new Set(['participants', 'listing_id', 'last_message_at', 'last_message_preview', 'is_archived'])

app.put('/threads/:id', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const currentParticipants = await requireThreadParticipantOrAdmin(c, id, callerId)
    if (!currentParticipants) return c.res
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (!THREAD_COLUMNS.has(k)) continue
      if (k === 'participants') {
        const participants = parseParticipants(v)
        if (!requestIsAdmin(c) && !participants.includes(callerId)) return dbJson(c, { error: 'Forbidden' }, 403)
        mapped[k] = JSON.stringify(participants)
      } else if (k === 'is_archived') {
        mapped[k] = v ? 1 : 0
      } else {
        mapped[k] = v
      }
    }
    if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    await c.env.DB.prepare(`UPDATE threads SET ${sets} WHERE thread_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[API] PUT /threads/:id failed:', msg)
    return dbJson(c, { error: msg || 'Unknown error' }, 500)
  }
})

app.delete('/threads/:id', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const participants = await requireThreadParticipantOrAdmin(c, id, callerId)
    if (!participants) return c.res
    await c.env.DB.prepare('DELETE FROM threads WHERE thread_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

app.put('/threads/:id/archive', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const participants = await requireThreadParticipantOrAdmin(c, id, callerId)
    if (!participants) return c.res
    await c.env.DB.prepare('UPDATE threads SET is_archived = 1 WHERE thread_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Archive failed' }, 500)
  }
})

// ── D1: Messages ─────────────────────────────────────────────
app.get('/messages', async (c) => {
  try {
    const thread_id = c.req.query('thread_id')
    let query = 'SELECT * FROM messages'
    let args: any[] = []
    if (thread_id) {
      query += ' WHERE thread_id = ?'
      args.push(thread_id)
    }
    const { results } = await c.env.DB.prepare(query).bind(...args).all()
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/messages', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const body = await c.req.json()
    const id = body.message_id || `msg_${Date.now()}`
    const threadId = String(body.thread_id || '')
    const participants = await requireThreadParticipantOrAdmin(c, threadId, callerId)
    if (!participants) return c.res
    const senderId = requestIsAdmin(c) ? (body.sender_id || callerId) : callerId
    if (!requestIsAdmin(c) && body.sender_id && body.sender_id !== callerId) return dbJson(c, { error: 'Forbidden' }, 403)
    
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO messages (message_id, thread_id, sender_id, content, is_read, read_at, photo_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, threadId, senderId, body.content,
      body.is_read ? 1 : 0,
      body.read_at || null,
      body.photo_url || null,
      body.created_at || new Date().toISOString()
    ).run()
    
    // Also update thread last_message_at and preview
    const sets: string[] = ['last_message_at = ?']
    const vals: any[] = [body.created_at || new Date().toISOString()]
    if (body.content) {
      sets.push('last_message_preview = ?')
      vals.push(body.content.trim().substring(0, 80))
    }
    vals.push(threadId)
    await c.env.DB.prepare(`UPDATE threads SET ${sets.join(', ')} WHERE thread_id = ?`)
      .bind(...vals)
      .run()

    return dbJson(c, { success: true, message_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.put('/messages/:id', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const existing = await c.env.DB.prepare('SELECT message_id, thread_id, sender_id FROM messages WHERE message_id = ?').bind(id).first()
    if (!existing) return dbJson(c, { error: 'Message not found' }, 404)
    const participants = await requireThreadParticipantOrAdmin(c, String((existing as any).thread_id || ''), callerId)
    if (!participants) return c.res
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    if ('is_read' in body) mapped['is_read'] = body.is_read ? 1 : 0
    if ('read_at' in body) mapped['read_at'] = body.read_at
    const canEditContent = requestIsAdmin(c) || (existing as any).sender_id === callerId
    if ('photo_url' in body && canEditContent) mapped['photo_url'] = body.photo_url
    if ('content' in body && canEditContent) mapped['content'] = body.content
    
    if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    await c.env.DB.prepare(`UPDATE messages SET ${sets} WHERE message_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.delete('/messages/:id', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const existing = await c.env.DB.prepare('SELECT message_id, sender_id FROM messages WHERE message_id = ?').bind(id).first()
    if (!existing) return dbJson(c, { error: 'Message not found' }, 404)
    if (!requestIsAdmin(c) && (existing as any).sender_id !== callerId) return dbJson(c, { error: 'Forbidden' }, 403)
    await c.env.DB.prepare('DELETE FROM messages WHERE message_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── D1: Reports ─────────────────────────────────────────────
app.get('/reports', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM reports ORDER BY created_at DESC').all()
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/reports', async (c) => {
  const reporterId = await requireAuth(c)
  if (!reporterId) return c.res
  try {
    const body = await c.req.json()
    const id = body.report_id || `rep_${Date.now()}`
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO reports (report_id, reporter_id, target_id, target_type, reason, details, status, resolved_by, resolved_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, reporterId, body.target_id, body.target_type, body.reason, body.details,
      'pending', null, null,
      body.created_at || new Date().toISOString()
    ).run()
    return dbJson(c, { success: true, report_id: id }, 201)
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Error' }, 500)
  }
})

const REPORT_COLUMNS = new Set(['status', 'resolved_by', 'resolved_at', 'details', 'reason'])

app.put('/reports/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (!REPORT_COLUMNS.has(k)) continue
      mapped[k] = v
    }
    if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    await c.env.DB.prepare(`UPDATE reports SET ${sets} WHERE report_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Error' }, 500)
  }
})

app.delete('/reports/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    await c.env.DB.prepare('DELETE FROM reports WHERE report_id = ?').bind(c.req.param('id')).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})


// ── D1: Notifications ───────────────────────────────────────────
app.get('/notifications', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const requestedUserId = c.req.query('user_id')
    const user_id = requestIsAdmin(c) ? requestedUserId : callerId
    let query = 'SELECT * FROM notifications'
    let args: any[] = []
    if (user_id) {
      query += ' WHERE user_id = ?'
      args.push(user_id)
    }
    query += ' ORDER BY created_at DESC'
    const { results } = await c.env.DB.prepare(query).bind(...args).all()
    const mapped = results.map((n: any) => ({ 
      ...n, 
      is_read: !!n.is_read,
      description: n.body,
      website_url: n.link
    }))
    return dbJson(c, mapped)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/notifications', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const body = await c.req.json()
    const id = body.notification_id || `notif_${Date.now()}`
    const userId = requestIsAdmin(c) ? (body.user_id || callerId) : callerId
    
    // Support both frontend (description/website_url) and schema (body/link) naming
    const title = body.title || ''
    const content = body.body || body.description || ''
    const link = body.link || body.website_url || ''
    const type = body.type || 'info'
    const is_read = body.is_read ? 1 : 0
    const created_at = body.created_at || new Date().toISOString()

    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO notifications (notification_id, user_id, type, title, body, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, userId, type, title, content, link, is_read, created_at
    ).run()
    return dbJson(c, { success: true, notification_id: id }, 201)
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Error' }, 500)
  }
})

const NOTIFICATION_COLUMNS = new Set(['type', 'title', 'body', 'link', 'is_read'])

app.put('/notifications/:id', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const existing = await c.env.DB.prepare('SELECT user_id FROM notifications WHERE notification_id = ?').bind(id).first()
    if (!existing) return dbJson(c, { error: 'Notification not found' }, 404)
    if (!requestIsAdmin(c) && (existing as any).user_id !== callerId) return dbJson(c, { error: 'Forbidden' }, 403)
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      const col = k === 'description' ? 'body' : k === 'website_url' ? 'link' : k
      if (!NOTIFICATION_COLUMNS.has(col)) continue
      mapped[col] = col === 'is_read' ? (v ? 1 : 0) : v
    }
    if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    await c.env.DB.prepare(`UPDATE notifications SET ${sets} WHERE notification_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: err instanceof Error ? err.message : 'Error' }, 500)
  }
})

app.delete('/notifications/:id', async (c) => {
  const callerId = await requireAuth(c)
  if (!callerId) return c.res
  try {
    const id = c.req.param('id')
    const existing = await c.env.DB.prepare('SELECT user_id FROM notifications WHERE notification_id = ?').bind(id).first()
    if (!existing) return dbJson(c, { error: 'Notification not found' }, 404)
    if (!requestIsAdmin(c) && (existing as any).user_id !== callerId) return dbJson(c, { error: 'Forbidden' }, 403)
    await c.env.DB.prepare('DELETE FROM notifications WHERE notification_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── Cron: saved-search alerts + price drops ─────────────────
const SAVED_ALERTS_STATE_KEY = 'saved_alerts_last_run'
const SAVED_ALERTS_LOOKBACK_MS = 15 * 60 * 1000

async function ensureCronAlertTables(env: Bindings): Promise<void> {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS rg_cron_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`
  ).run()
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS listing_price_state (
      listing_id TEXT PRIMARY KEY,
      price REAL NOT NULL,
      checked_at TEXT NOT NULL
    )`
  ).run()
}

async function getCronLastRun(env: Bindings, scheduledMs: number): Promise<string> {
  const fallback = new Date(scheduledMs - SAVED_ALERTS_LOOKBACK_MS).toISOString()
  const row = await env.DB.prepare('SELECT value FROM rg_cron_state WHERE key = ?')
    .bind(SAVED_ALERTS_STATE_KEY)
    .first()
  const value = String((row as any)?.value || '')
  return value && !Number.isNaN(Date.parse(value)) ? value : fallback
}

async function setCronLastRun(env: Bindings, iso: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO rg_cron_state (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(SAVED_ALERTS_STATE_KEY, iso, iso).run()
}

function parseSavedSearchParams(search: any): URLSearchParams {
  const raw = String(search?.queryStr || search?.query || search?.url || search?.path || '')
  const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw.replace(/^\?/, '')
  return new URLSearchParams(query)
}

function getSavedSearchValue(search: any, params: URLSearchParams, keys: string[]): string {
  const filters = search?.filters && typeof search.filters === 'object' ? search.filters : {}
  const nestedParams = search?.params && typeof search.params === 'object' ? search.params : {}
  for (const key of keys) {
    for (const source of [search, filters, nestedParams]) {
      const value = source?.[key]
      if (value !== undefined && value !== null && value !== '' && value !== 'all') return String(value)
    }
    const paramValue = params.get(key)
    if (paramValue !== null && paramValue !== '' && paramValue !== 'all') return paramValue
  }
  return ''
}

function parseSearchNumber(value: string): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseSearchBoolean(value: string): boolean | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return null
}

function parseCsvList(value: string): string[] {
  return String(value || '').split(',').map(v => v.trim()).filter(Boolean)
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

function getListingSearchPrice(listing: any): number | null {
  const raw = listing.kind === 'sale' ? (listing.price ?? listing.rent) : (listing.rent ?? listing.price)
  const price = Number(raw)
  return Number.isFinite(price) && price > 0 ? price : null
}

function getSavedListingIds(raw: unknown): string[] {
  return parseJsonArrayValue(raw)
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') return (item as any).listing_id || (item as any).id
      return ''
    })
    .map(id => String(id || '').trim())
    .filter(Boolean)
}

async function loadCityLookup(env: Bindings): Promise<Map<string, any>> {
  const lookup = new Map<string, any>()
  try {
    const { results } = await env.DB.prepare('SELECT city_id, slug, country FROM cities').all()
    for (const row of results as any[]) {
      if (row.city_id) lookup.set(String(row.city_id), row)
      if (row.slug) lookup.set(String(row.slug), row)
    }
  } catch (err) {
    console.warn('[Cron] Could not load city lookup:', err instanceof Error ? err.message : err)
  }
  return lookup
}

async function loadCategoryDescendants(env: Bindings): Promise<Map<string, Set<string>>> {
  const lookup = new Map<string, Set<string>>()
  try {
    const { results } = await env.DB.prepare('SELECT category_id, parent_id, slug FROM mp_categories').all()
    const categories = results as any[]
    const children = new Map<string, string[]>()
    for (const row of categories) {
      const parentId = String(row.parent_id || '')
      if (!parentId) continue
      if (!children.has(parentId)) children.set(parentId, [])
      children.get(parentId)!.push(String(row.category_id))
    }
    const collect = (categoryId: string, out: Set<string>) => {
      for (const childId of children.get(categoryId) || []) {
        if (out.has(childId)) continue
        out.add(childId)
        collect(childId, out)
      }
    }
    for (const row of categories) {
      const categoryId = String(row.category_id || '')
      if (!categoryId) continue
      const set = new Set<string>([categoryId])
      collect(categoryId, set)
      lookup.set(categoryId, set)
      if (row.slug) lookup.set(String(row.slug), set)
    }
  } catch (err) {
    console.warn('[Cron] Could not load category lookup:', err instanceof Error ? err.message : err)
  }
  return lookup
}

function listingMatchesCity(listing: any, cityValue: string, cityLookup: Map<string, any>): boolean {
  if (!cityValue) return true
  const listingCity = String(listing.city || '')
  const city = cityLookup.get(cityValue)
  if (!city) return listingCity === cityValue
  return listingCity === String(city.city_id || '') || listingCity === String(city.slug || '')
}

function listingMatchesCountry(listing: any, countryValue: string, cityLookup: Map<string, any>): boolean {
  if (!countryValue) return true
  if (String(listing.country || '') === countryValue) return true
  const city = cityLookup.get(String(listing.city || ''))
  return String(city?.country || '') === countryValue
}

function savedSearchMatchesListing(search: any, listing: any, cityLookup: Map<string, any>, categoryLookup: Map<string, Set<string>>): boolean {
  if (search?.notify === false) return false
  const params = parseSavedSearchParams(search)
  if (parseSearchBoolean(getSavedSearchValue(search, params, ['notify'])) === false) return false

  const explicitKind = getSavedSearchValue(search, params, ['kind'])
  const kind = explicitKind || 'rental'
  const listingKind = String(listing.kind || 'rental')
  if (kind && kind !== 'all' && listingKind !== kind) return false

  const cityValue = getSavedSearchValue(search, params, ['city'])
  if (!listingMatchesCity(listing, cityValue, cityLookup)) return false

  const countryValue = getSavedSearchValue(search, params, ['country'])
  if (!listingMatchesCountry(listing, countryValue, cityLookup)) return false

  const categoryValue = getSavedSearchValue(search, params, ['category', 'category_id'])
  if (categoryValue) {
    const listingCategory = String(listing.category_id || '')
    const allowed = categoryLookup.get(categoryValue) || new Set([categoryValue])
    if (!listingCategory || !allowed.has(listingCategory)) return false
  }

  const q = getSavedSearchValue(search, params, ['q', 'keyword', 'search'])
  if (q) {
    const haystack = `${listing.title || ''} ${listing.description || ''} ${listing.brand || ''}`.toLowerCase()
    const tokens = q.toLowerCase().match(/[a-z0-9]+/gi) || []
    if (tokens.length && !tokens.every(token => haystack.includes(token))) return false
  }

  const price = getListingSearchPrice(listing)
  const min = parseSearchNumber(getSavedSearchValue(search, params, ['min', 'minPrice', 'priceMin', 'budgetMin']))
  const max = parseSearchNumber(getSavedSearchValue(search, params, ['max', 'maxPrice', 'priceMax', 'budgetMax']))
  if ((min !== null || max !== null) && price === null) return false
  if (min !== null && (price as number) < min) return false
  if (max !== null && (price as number) > max) return false

  const condition = getSavedSearchValue(search, params, ['condition'])
  if (condition && String(listing.condition || '') !== condition) return false

  if (parseSearchBoolean(getSavedSearchValue(search, params, ['negotiable'])) === true && Number(listing.negotiable || 0) !== 1) return false
  if (parseSearchBoolean(getSavedSearchValue(search, params, ['verified'])) === true && String(listing.seller_verification_level || 'none') === 'none') return false

  if (listingKind === 'rental') {
    const type = getSavedSearchValue(search, params, ['type', 'room_type'])
    if (type) {
      const category = String(listing.category || '').toLowerCase()
      const roomType = String(listing.room_type || '').toLowerCase()
      const wanted = type.toLowerCase()
      if (wanted === 'room') {
        if (!(category === 'room' || category === 'room_rental' || roomType.includes('private'))) return false
      } else if (!(category === wanted || roomType === wanted || roomType.includes(wanted))) {
        return false
      }
    }

    const duration = getSavedSearchValue(search, params, ['dur', 'duration', 'lease_term'])
    if (duration && String(listing.duration || listing.lease_term || '') !== duration) return false

    const furnished = getSavedSearchValue(search, params, ['furn', 'furnished'])
    if (furnished && String(listing.furnished || '').toLowerCase() !== furnished.toLowerCase()) return false

    const amenities = parseCsvList(getSavedSearchValue(search, params, ['amenities']))
    if (amenities.length) {
      const listingAmenities = parseJsonArrayValue(listing.amenities)
      if (!amenities.every(amenity => listingAmenities.includes(amenity))) return false
    }
  }

  return true
}

async function notificationExists(env: Bindings, userId: string, type: string, link: string): Promise<boolean> {
  const existing = await env.DB.prepare(
    'SELECT notification_id FROM notifications WHERE user_id = ? AND type = ? AND link = ? LIMIT 1'
  ).bind(userId, type, link).first()
  return !!existing
}

async function notifySavedSearchMatches(env: Bindings, lastRunIso: string, nowIso: string): Promise<number> {
  const [{ results: listingRows }, { results: userRows }, cityLookup, categoryLookup] = await Promise.all([
    env.DB.prepare(
      `SELECT l.*, seller.verification_level AS seller_verification_level
       FROM listings l
       LEFT JOIN users seller ON seller.user_id = l.user_id
       WHERE l.status = 'active'
         AND datetime(COALESCE(l.created_at, l.updated_at)) > datetime(?)
         AND datetime(COALESCE(l.created_at, l.updated_at)) <= datetime(?)
       ORDER BY datetime(COALESCE(l.created_at, l.updated_at)) ASC
       LIMIT 1000`
    ).bind(lastRunIso, nowIso).all(),
    env.DB.prepare(
      `SELECT user_id, saved_searches
       FROM users
       WHERE COALESCE(is_active, 1) != 0
         AND saved_searches IS NOT NULL
         AND saved_searches != ''
         AND saved_searches != '[]'`
    ).all(),
    loadCityLookup(env),
    loadCategoryDescendants(env),
  ])

  let created = 0
  const emitted = new Set<string>()
  for (const user of userRows as any[]) {
    const searches = parseJsonArrayValue(user.saved_searches)
    if (!searches.length) continue
    for (const search of searches) {
      for (const listing of listingRows as any[]) {
        const dedupeKey = `${user.user_id}:${listing.listing_id}`
        if (emitted.has(dedupeKey)) continue
        if (!savedSearchMatchesListing(search, listing, cityLookup, categoryLookup)) continue
        const link = `/listing/${listing.listing_id}`
        if (await notificationExists(env, user.user_id, 'saved_search_match', link)) {
          emitted.add(dedupeKey)
          continue
        }
        const searchName = String(search?.name || 'Saved Search')
        await createNotification(
          { env },
          user.user_id,
          'saved_search_match',
          'New saved-search match',
          `${listing.title || 'A new listing'} matches "${searchName}".`,
          link
        )
        emitted.add(dedupeKey)
        created += 1
      }
    }
  }
  return created
}

async function notifyPriceDrops(env: Bindings, nowIso: string): Promise<number> {
  const [{ results: listingRows }, { results: priceRows }, { results: userRows }] = await Promise.all([
    env.DB.prepare(
      `SELECT listing_id, title, kind, price, rent
       FROM listings
       WHERE status = 'active'`
    ).all(),
    env.DB.prepare('SELECT listing_id, price FROM listing_price_state').all(),
    env.DB.prepare(
      `SELECT user_id, saved_listings
       FROM users
       WHERE COALESCE(is_active, 1) != 0
         AND saved_listings IS NOT NULL
         AND saved_listings != ''
         AND saved_listings != '[]'`
    ).all(),
  ])

  const previousPrices = new Map<string, number>()
  for (const row of priceRows as any[]) {
    const price = Number(row.price)
    if (Number.isFinite(price)) previousPrices.set(String(row.listing_id), price)
  }

  const drops: Array<{ listing: any; previous: number; current: number }> = []
  for (const listing of listingRows as any[]) {
    const current = getListingSearchPrice(listing)
    if (current === null) continue
    const previous = previousPrices.get(String(listing.listing_id))
    if (previous !== undefined && current < previous) drops.push({ listing, previous, current })
  }

  let created = 0
  if (drops.length) {
    for (const user of userRows as any[]) {
      const savedIds = new Set(getSavedListingIds(user.saved_listings))
      if (!savedIds.size) continue
      for (const drop of drops) {
        if (!savedIds.has(String(drop.listing.listing_id))) continue
        await createNotification(
          { env },
          user.user_id,
          'price_drop',
          'Saved listing price dropped',
          `${drop.listing.title || 'A saved listing'} dropped from ${formatCurrency(drop.previous)} to ${formatCurrency(drop.current)}.`,
          `/listing/${drop.listing.listing_id}`
        )
        created += 1
      }
    }
  }

  for (const listing of listingRows as any[]) {
    const current = getListingSearchPrice(listing)
    if (current === null) continue
    await env.DB.prepare(
      `INSERT INTO listing_price_state (listing_id, price, checked_at)
       VALUES (?, ?, ?)
       ON CONFLICT(listing_id) DO UPDATE SET price = excluded.price, checked_at = excluded.checked_at`
    ).bind(listing.listing_id, current, nowIso).run()
  }

  return created
}

async function runSavedSearchAlertCron(env: Bindings, scheduledMs = Date.now()): Promise<void> {
  const nowIso = new Date(scheduledMs).toISOString()
  await ensureCronAlertTables(env)
  const lastRunIso = await getCronLastRun(env, scheduledMs)
  const savedSearchMatches = await notifySavedSearchMatches(env, lastRunIso, nowIso)
  const priceDrops = await notifyPriceDrops(env, nowIso)
  await setCronLastRun(env, nowIso)
  console.log(`[Cron] Saved alerts complete: ${savedSearchMatches} saved-search matches, ${priceDrops} price drops.`)
}

// ── D1: Bulk sync — admin pushes entire localStorage collection to D1 ─
// POST /sync  { collection: 'cities'|'listings'|'posts'|'fb_cities', items: [...] }
app.post('/sync', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const { collection, items } = await c.req.json() as { collection: string, items: any[] }
    if (!collection || !Array.isArray(items)) {
      return dbJson(c, { error: 'collection and items[] required' }, 400)
    }
    // Map collection name → route
    const routeMap: Record<string, string> = {
      cities: '/cities', listings: '/listings',
      posts: '/posts', fb_cities: '/fb-cities',
      threads: '/threads', messages: '/messages', notifications: '/notifications'
    }
    if (!routeMap[collection]) return dbJson(c, { error: 'Unknown collection' }, 400)

    // Use individual POST for each item (INSERT OR REPLACE)
    const path = routeMap[collection]
    const authHeader = c.req.header('Authorization') || ''
    let saved = 0
    for (const item of items) {
      await fetch(new Request(
        `${new URL(c.req.url).origin}${path}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) }, body: JSON.stringify(item) }
      ))
      saved++
    }
    return dbJson(c, { success: true, saved })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

// ── D1: Admin Logs ───────────────────────────────────────────
app.get('/admin_logs', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 1000').all()
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/admin_logs', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const body = await c.req.json()
    const id = body.log_id || `log_${Date.now()}`
    await c.env.DB.prepare(
      `INSERT INTO admin_logs (log_id, admin_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      id, body.admin_id, body.action, body.target_id || null, body.details || null,
      body.created_at || new Date().toISOString()
    ).run()
    return dbJson(c, { success: true, log_id: id }, 201)
  } catch (err) {
    return dbJson(c, { error: 'Insert failed' }, 500)
  }
})

// ── D1: User Queries ──────────────────────────────────────────
app.get('/user_queries', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM user_queries ORDER BY created_at DESC').all()
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/user_queries', async (c) => {
  try {
    const body = await c.req.json()
    const id = body.query_id || `qry_${Date.now()}`
    
    // Filter to valid columns based on the updated contact form requirements
    const validCols = [
      'query_id', 'user_id', 'first_name', 'last_name', 'email', 'topic', 
      'topic_label', 'message', 'status', 'is_read', 'reply', 'replied_at', 'created_at'
    ]
    
    const mapped: Record<string, any> = { query_id: id }
    validCols.forEach(col => {
      if (body[col] !== undefined) mapped[col] = body[col]
    })
    
    if (mapped.is_read !== undefined) mapped.is_read = mapped.is_read ? 1 : 0

    const cols = Object.keys(mapped)
    const placeholders = cols.map(() => '?').join(', ')
    const vals = Object.values(mapped)

    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO user_queries (${cols.join(', ')}) VALUES (${placeholders})`
    ).bind(...vals).run()
    
    return dbJson(c, { success: true, query_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.put('/user_queries/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    
    const validCols = [
      'user_id', 'first_name', 'last_name', 'email', 'topic', 
      'topic_label', 'message', 'status', 'is_read', 'reply', 'replied_at'
    ]
    
    validCols.forEach(col => {
      if (body[col] !== undefined) mapped[col] = body[col]
    })
    
    if (mapped.is_read !== undefined) mapped.is_read = mapped.is_read ? 1 : 0
    
    if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
    
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    
    await c.env.DB.prepare(`UPDATE user_queries SET ${sets} WHERE query_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.delete('/user_queries/:id', async (c) => {
  if (!await requireAdmin(c)) return c.res
  try {
    await c.env.DB.prepare('DELETE FROM user_queries WHERE query_id = ?').bind(c.req.param('id')).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── SPA deep-link fallback ───────────────────────────────────
// Browser routes such as /auth/login are handled by the client router.
// Without this, Hono returns 404 before Cloudflare Assets can serve index.html.
app.get('*', async (c) => c.env.ASSETS.fetch(c.req.raw))

export default {
  fetch: (request: Request, env: Bindings, ctx: ExecutionContext) => app.fetch(request, env, ctx),
  scheduled: (event: ScheduledController, env: Bindings, ctx: ExecutionContext) => {
    ctx.waitUntil(runSavedSearchAlertCron(env, event.scheduledTime))
  },
}
