import { defineConfig } from 'vitest/config'
import { cloudflareTest } from '@cloudflare/vitest-pool-workers'

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: './worker.ts',
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        bindings: { JWT_SECRET: 'test-secret-do-not-use-in-prod' },
      },
    }),
  ],
  test: {
    setupFiles: ['./test/setup.ts'],
  },
})
