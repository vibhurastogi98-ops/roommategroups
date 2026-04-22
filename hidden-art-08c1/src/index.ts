import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/', (c) => {
  return c.json({ message: 'API running 🚀' })
})

app.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM users').all()
  return c.json(results)
})

app.post('/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body['image'] as File
  
  if (!file) {
    return c.json({ success: false, error: 'No image provided' }, 400)
  }

  const filename = `${Date.now()}-${file.name}`
  await c.env.BUCKET.put(filename, file)
  
  // Return absolute URL so frontend can always find it
  const url = `${new URL(c.req.url).origin}/files/${filename}`
  
  return c.json({
    success: true,
    url: url,
    filename: filename
  })
})

app.get('/files/:name', async (c) => {
  const name = c.req.param('name')
  const object = await c.env.BUCKET.get(name)
  
  if (!object) {
    return c.text('File not found', 404)
  }
  
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  
  return new Response(object.body, { headers })
})

export default app
