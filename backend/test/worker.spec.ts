import { SELF } from 'cloudflare:test'
import { describe, it, expect } from 'vitest'

async function registerUser(emailPrefix: string) {
  const email = `${emailPrefix}-${crypto.randomUUID()}@example.com`
  const res = await SELF.fetch('https://worker.test/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'correcthorsebatterystaple' }),
  })
  const body = await res.json() as any
  return { res, body, email, userId: body.user?.user_id as string, token: body.token as string }
}

describe('POST /listings', () => {
  it('persists a rental category on its own column, not aliased into room_type', async () => {
    const { token } = await registerUser('lister')
    const res = await SELF.fetch('https://worker.test/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        kind: 'rental',
        title: 'Sunny room near campus',
        city: 'austin',
        category: 'room',
        rent: 900,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as any

    const getRes = await SELF.fetch(`https://worker.test/listings/${body.listing_id}`)
    const listing = await getRes.json() as any
    expect(listing.category).toBe('room')
    expect(listing.room_type).toBeNull()
  })
})

describe('JWT verify path', () => {
  it('accepts a token issued at registration on a protected route', async () => {
    const { token, userId } = await registerUser('jwtuser')
    const res = await SELF.fetch(`https://worker.test/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ display_name: 'Updated Name' }),
    })
    expect(res.status).toBe(200)
  })

  it('rejects a request with no bearer token on a protected route', async () => {
    const res = await SELF.fetch('https://worker.test/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'no auth' }),
    })
    expect(res.status).toBe(401)
  })

  it('rejects a token signed with the wrong secret', async () => {
    const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const res = await SELF.fetch('https://worker.test/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${forged}` },
      body: JSON.stringify({ title: 'forged' }),
    })
    expect(res.status).toBe(401)
  })
})

describe('requireAdmin', () => {
  it('rejects a non-admin user hitting an admin-only route', async () => {
    const { token } = await registerUser('regular')
    const res = await SELF.fetch('https://worker.test/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request to an admin-only route', async () => {
    const res = await SELF.fetch('https://worker.test/users')
    expect(res.status).toBe(401)
  })
})

describe('GET /listings category filter', () => {
  it('only returns listings within the requested category', async () => {
    const { token } = await registerUser('searcher')
    const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

    await SELF.fetch('https://worker.test/listings', {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ kind: 'rental', title: 'Room A', city: 'austin', category: 'room', rent: 800 }),
    })
    await SELF.fetch('https://worker.test/listings', {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ kind: 'rental', title: 'Apartment B', city: 'austin', category: 'apartment', rent: 1500 }),
    })

    const res = await SELF.fetch('https://worker.test/listings?category=room')
    const body = await res.json() as any
    expect(res.status).toBe(200)
    expect(body.results.length).toBeGreaterThan(0)
    expect(body.results.every((l: any) => l.category === 'room')).toBe(true)
  })
})
