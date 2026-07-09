import { env } from 'cloudflare:test'
// @ts-expect-error - Vite raw import, resolved at bundle time inside the worker isolate.
import schemaSql from './schema.sql?raw'

const withoutComments = schemaSql
  .split('\n')
  .filter((line: string) => !line.trim().startsWith('--'))
  .join('\n')

// D1's exec() treats each newline as a statement boundary, so every
// (possibly multi-line) CREATE TABLE must be flattened to one line first.
for (const statement of withoutComments.split(';').map((s: string) => s.replace(/\s+/g, ' ').trim()).filter(Boolean)) {
  await env.DB.exec(statement)
}
