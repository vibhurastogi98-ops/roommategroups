import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

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
    return c.json({
      success: false,
      message: 'R2 Connection failed',
      error: error.message
    }, 500)
  }
})

// User API Routes
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
    const { name, email } = body
    await c.env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      .bind(name, email)
      .run()
    return c.json({ success: true }, 201)
  } catch (err) {
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// Listing API Routes
app.get('/listings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM listings LIMIT 100').all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// City API Routes
app.get('/cities', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM cities').all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Proxy assets to R2 if needed
app.get('/assets/img/:file', async (c) => {
  const file = c.req.param('file')
  const object = await c.env.BUCKET.get(file)
  
  if (!object) {
    // If not in R2, let the normal asset serving handle it (from dist)
    return fetch(c.req.raw)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  
  return new Response(object.body, {
    headers,
  })
})

app.get('/favicon.png', async (c) => {
  const object = await c.env.BUCKET.get('favicon.png')
  if (!object) return fetch(c.req.raw)
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  return new Response(object.body, { headers })
})

// The static assets will be served by the Cloudflare Assets feature automatically
// as long as we don't handle the routes here.
// However, for the SPA to work correctly, we usually let Assets handle everything else.

export default app
