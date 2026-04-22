import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// ── CORS ─────────────────────────────────────────────────────
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*'
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin
    if (origin.includes('workers.dev') || origin.includes('roommategroups')) return origin
    return null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

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
// POST /upload  → { key, url, size, contentType }
app.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return c.json({ success: false, error: 'No file provided. Send field name: image' }, 400)
    }

    const ext       = file.name.split('.').pop() || 'bin'
    const key       = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const fileData  = await file.arrayBuffer()

    await c.env.BUCKET.put(key, fileData, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    })

    const publicUrl = `https://pub-${c.env.BUCKET.toString()}.r2.dev/${key}`
    // Use a stable CDN-style URL pattern for the roommate-bucket
    const url = `https://roommate-bucket.vibhurastogi98.workers.dev/${key}`

    return c.json({
      success: true,
      key,
      url: `/${key}`,         // relative — served via /assets route below
      filename: file.name,
      size: file.size,
      contentType: file.type,
    }, 201)
  } catch (err) {
    const error = err as Error
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ── R2: Get / serve a file by key ───────────────────────────
// GET /r2/:key*  e.g. /r2/uploads/abc123.webp
app.get('/r2/:key{.+}', async (c) => {
  const key    = c.req.param('key')
  const object = await c.env.BUCKET.get(key)

  if (!object) {
    return c.json({ error: 'Object not found', key }, 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
})

// ── R2: List objects (optional prefix filter) ────────────────
// GET /r2-list?prefix=uploads/
app.get('/r2-list', async (c) => {
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
app.get('/assets/img/:file', async (c) => {
  const file   = c.req.param('file')
  const object = await c.env.BUCKET.get(`uploads/${file}`)

  if (!object) return fetch(c.req.raw)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  return new Response(object.body, { headers })
})

// ── R2: Favicon from bucket ───────────────────────────────────
app.get('/favicon.png', async (c) => {
  const object = await c.env.BUCKET.get('favicon.png')
  if (!object) return fetch(c.req.raw)
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  return new Response(object.body, { headers })
})

// ── D1: Users ────────────────────────────────────────────────
app.get('/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM users LIMIT 100').all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/users', async (c) => {
  try {
    const body = await c.req.json()
    const { user_id, email, display_name, role } = body
    await c.env.DB.prepare(
      'INSERT INTO users (user_id, email, display_name, role) VALUES (?, ?, ?, ?)'
    ).bind(user_id || `usr_${Date.now()}`, email, display_name || '', role || 'user').run()
    return c.json({ success: true }, 201)
  } catch (err) {
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// ── D1: Listings ─────────────────────────────────────────────
app.get('/listings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM listings LIMIT 100').all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// ── D1: Cities ───────────────────────────────────────────────
app.get('/cities', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM cities WHERE is_active = 1').all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// ── D1: Blog Posts ───────────────────────────────────────────
app.get('/posts', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM posts WHERE is_published = 1 ORDER BY published_date DESC'
    ).all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// ── D1: Categories ───────────────────────────────────────────
app.get('/categories', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM categories').all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// ── D1: FB Groups ────────────────────────────────────────────
app.get('/fb-cities', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM fb_cities ORDER BY priority ASC'
    ).all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

export default app
