import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // The core logic is plain TypeScript, so tests run in Node (no browser needed).
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
