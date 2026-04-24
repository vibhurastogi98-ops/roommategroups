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
// POST /upload or POST /r2/upload  → { key, url, size, contentType }
async function handleUpload(c: any) {
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
      url: `/r2/${key}`,         // relative — served via /r2 route
      filename: file.name,
      size: file.size,
      contentType: file.type,
    }, 201)
  } catch (err) {
    const error = err as Error
    return c.json({ success: false, error: error.message }, 500)
  }
}

app.post('/upload', handleUpload)
app.post('/r2/upload', handleUpload)

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
  // ⚠️ Do NOT use 'immutable' for R2 keys that can be overwritten.
  // 'must-revalidate' + short max-age ensures updated images show within 1 hour.
  headers.set('cache-control', 'public, max-age=3600, must-revalidate')

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
  headers.set('cache-control', 'public, max-age=3600, must-revalidate')
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

// Helper: no-store JSON response for all dynamic DB data
function dbJson(c: any, data: any, status = 200) {
  return c.json(data, status, { 'Cache-Control': 'no-store, no-cache, must-revalidate' })
}

// ── D1: Users ────────────────────────────────────────────────
app.get('/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM users LIMIT 100').all()
    // Map D1 snake_case back to camelCase for frontend compatibility
    const mapped = results.map((u: any) => {
      const user = { ...u }
      if ('password_hash' in user) {
        user.passwordHash = user.password_hash
        delete user.password_hash
      }
      // Normalize booleans for SQLite (0/1 -> true/false)
      if ('is_active' in user) user.is_active = !!user.is_active
      if ('profileComplete' in user) user.profileComplete = !!user.profileComplete
      if ('emailVerified' in user) user.emailVerified = !!user.emailVerified
      
      // Parse JSON fields if they are strings
      const jsonFields = ['lifestyle_tags', 'saved_listings', 'saved_searches', 'blocked_users']
      jsonFields.forEach(f => {
        if (typeof user[f] === 'string') {
          try { user[f] = JSON.parse(user[f]); } catch(e) { user[f] = []; }
        }
      })
      return user
    })
    return dbJson(c, mapped)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/users', async (c) => {
  try {
    const body = await c.req.json()
    const id = body.user_id || `usr_${Date.now()}`
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (k === 'passwordHash') {
        mapped['password_hash'] = v
      } else if (['lifestyle_tags', 'saved_listings', 'saved_searches', 'blocked_users'].includes(k)) {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || [])
      } else {
        mapped[k] = v
      }
    }
    const validCols = [
      'user_id', 'email', 'display_name', 'profile_photo', 'bio', 'city', 'age_range', 
      'lifestyle_tags', 'verification_level', 'subscription_tier', 'stripe_customer_id', 
      'saved_listings', 'saved_searches', 'blocked_users', 'password_hash', 'role', 
      'is_active', 'created_at', 'last_active'
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
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (k === 'passwordHash') {
        mapped['password_hash'] = v
      } else if (['lifestyle_tags', 'saved_listings', 'saved_searches', 'blocked_users'].includes(k)) {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || [])
      } else {
        mapped[k] = v
      }
    }
    // Handle booleans mapping for SQLite if needed
    if ('is_active' in mapped) mapped['is_active'] = mapped['is_active'] ? 1 : 0
    
    const validCols = [
      'user_id', 'email', 'display_name', 'profile_photo', 'bio', 'city', 'age_range', 
      'lifestyle_tags', 'verification_level', 'subscription_tier', 'stripe_customer_id', 
      'saved_listings', 'saved_searches', 'blocked_users', 'password_hash', 'role', 
      'is_active', 'created_at', 'last_active'
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
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM users WHERE user_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── D1: Listings ─────────────────────────────────────────────
app.get('/listings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM listings LIMIT 500').all()
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/listings', async (c) => {
  try {
    const body = await c.req.json()
    const id = body.listing_id || `list_${Date.now()}`
    // Schema columns: rent (not price), images (not photos)
    const rent = body.rent ?? body.price ?? 0
    const images = body.images || body.photos || []
    const imagesVal = typeof images === 'string' ? images : JSON.stringify(images)
    const validCols = [
      'listing_id', 'user_id', 'title', 'description', 'city', 'neighborhood_id', 
      'address', 'latitude', 'longitude', 'rent', 'rent_type', 'room_type', 
      'bathrooms', 'available_from', 'lease_term', 'amenities', 'tags', 'images', 
      'status', 'is_featured', 'view_count', 'created_at', 'updated_at'
    ]
    const mapped: Record<string, any> = {
      listing_id: id,
      user_id: body.user_id || '',
      title: body.title || '',
      description: body.description || '',
      city: body.city || '',
      room_type: body.room_type || body.category || '',
      status: body.status || 'active',
      rent: rent,
      images: imagesVal,
      created_at: body.created_at || new Date().toISOString(),
      updated_at: body.updated_at || new Date().toISOString()
    }
    // Add any other valid cols from body
    validCols.forEach(col => {
      if (body[col] !== undefined && mapped[col] === undefined) {
        if (['amenities', 'tags'].includes(col)) {
          mapped[col] = typeof body[col] === 'string' ? body[col] : JSON.stringify(body[col] || [])
        } else {
          mapped[col] = body[col]
        }
      }
    })

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

app.put('/listings/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    // Serialize JSON array fields and normalize column name aliases
    const jsonFields = ['images', 'photos', 'amenities', 'tags', 'lifestyle_tags']
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (jsonFields.includes(k)) {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || [])
      } else {
        mapped[k] = v
      }
    }
    // Normalize price → rent alias if frontend sends old field name
    if ('price' in mapped && !('rent' in mapped)) {
      mapped['rent'] = mapped['price']
      delete mapped['price']
    }
    if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    await c.env.DB.prepare(`UPDATE listings SET ${sets} WHERE listing_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.delete('/listings/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM listings WHERE listing_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── D1: Cities ───────────────────────────────────────────────
app.get('/cities', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM cities').all()
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/cities', async (c) => {
  try {
    const body = await c.req.json()
    const id = body.city_id || `city_${Date.now()}`
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO cities
       (city_id, name, slug, country, state_province, hero_image, description,
        avg_rent, listing_count, member_count, is_active, show_in_popular, show_in_popular_section,
        show_in_footer, meta_title, meta_description, latitude, longitude,
        faq_items, reviews)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
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
      typeof body.reviews === 'string' ? body.reviews : JSON.stringify(body.reviews || [])
    ).run()
    return dbJson(c, { success: true, city_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.put('/cities/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    // Map boolean fields to integers for SQLite; serialize JSON fields
    const boolFields = ['is_active', 'show_in_popular', 'show_in_popular_section', 'show_in_footer']
    const jsonFields = ['faq_items', 'reviews']
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (boolFields.includes(k)) {
        mapped[k] = v ? 1 : 0
      } else if (jsonFields.includes(k)) {
        mapped[k] = typeof v === 'string' ? v : JSON.stringify(v || [])
      } else {
        mapped[k] = v
      }
    }
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
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/posts', async (c) => {
  try {
    const body = await c.req.json()
    const id = body.post_id || `post_${Date.now()}`
    // Schema uses author_name/author_avatar/author_bio (not a JSON author blob)
    // and date_label (not date). Handle both flat and nested author formats.
    const author = body.author || {}
    const authorName   = body.author_name   || (typeof author === 'object' ? author.name   : '') || ''
    const authorAvatar = body.author_avatar  || (typeof author === 'object' ? author.avatar : '') || ''
    const authorBio    = body.author_bio     || (typeof author === 'object' ? author.bio    : '') || ''
    const dateLabel    = body.date_label || body.date || ''
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO posts
       (post_id, slug, title, excerpt, category, author_name, author_avatar, author_bio,
        date_label, read_time, image, content, published_date, is_published)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id, body.slug || '', body.title || '', body.excerpt || '',
      body.category || '', authorName, authorAvatar, authorBio,
      dateLabel, body.readTime || body.read_time || '',
      body.image || '', body.content || '',
      body.published_date || new Date().toISOString(),
      body.is_published ? 1 : 0
    ).run()
    return dbJson(c, { success: true, post_id: id }, 201)
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.put('/posts/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      if (k === 'is_published') {
        mapped[k] = v ? 1 : 0
      } else if (k === 'author' && typeof v === 'object' && v !== null) {
        // Flatten nested author object into schema columns
        const a = v as any
        mapped['author_name']   = a.name   || ''
        mapped['author_avatar'] = a.avatar || ''
        mapped['author_bio']    = a.bio    || ''
      } else if (k === 'date') {
        // Alias date → date_label
        mapped['date_label'] = v
      } else {
        mapped[k] = v
      }
    }
    if (Object.keys(mapped).length === 0) return dbJson(c, { success: true })
    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ')
    const vals = [...Object.values(mapped), id]
    await c.env.DB.prepare(`UPDATE posts SET ${sets} WHERE post_id = ?`).bind(...vals).run()
    return dbJson(c, { success: true })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

app.delete('/posts/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM posts WHERE post_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── D1: Categories ───────────────────────────────────────────
app.get('/categories', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM categories').all()
    return dbJson(c, results)
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

// ── D1: FB Groups ─────────────────────────────────────────────
app.get('/fb-cities', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM fb_cities ORDER BY priority ASC'
    ).all()
    return dbJson(c, results)
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
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
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
  try {
    await c.env.DB.prepare('DELETE FROM fb_countries WHERE fb_country_id = ?').bind(c.req.param('id')).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Database error' }, 500)
  }
})

app.post('/fb-cities', async (c) => {
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
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const mapped: Record<string, any> = {}
    for (const [k, v] of Object.entries(body)) {
      mapped[k] = (k === 'is_popular' || k === 'is_footer') ? (v ? 1 : 0)
                : (k === 'faqs' && typeof v === 'object') ? JSON.stringify(v)
                : v
    }
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
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM fb_cities WHERE fb_city_id = ?').bind(id).run()
    return dbJson(c, { success: true })
  } catch (err) {
    return dbJson(c, { error: 'Delete failed' }, 500)
  }
})

// ── D1: Bulk sync — admin pushes entire localStorage collection to D1 ─
// POST /sync  { collection: 'cities'|'listings'|'posts'|'fb_cities', items: [...] }
app.post('/sync', async (c) => {
  try {
    const { collection, items } = await c.req.json() as { collection: string, items: any[] }
    if (!collection || !Array.isArray(items)) {
      return dbJson(c, { error: 'collection and items[] required' }, 400)
    }
    // Map collection name → route
    const routeMap: Record<string, string> = {
      cities: '/cities', listings: '/listings',
      posts: '/posts', fb_cities: '/fb-cities'
    }
    if (!routeMap[collection]) return dbJson(c, { error: 'Unknown collection' }, 400)

    // Use individual POST for each item (INSERT OR REPLACE)
    const path = routeMap[collection]
    let saved = 0
    for (const item of items) {
      await fetch(new Request(
        `${new URL(c.req.url).origin}${path}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }
      ))
      saved++
    }
    return dbJson(c, { success: true, saved })
  } catch (err) {
    const error = err as Error
    return dbJson(c, { error: error.message }, 500)
  }
})

export default app
