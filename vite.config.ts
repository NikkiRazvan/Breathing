import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Relative paths, so the built app works from any folder or sub-path
  // (e.g. https://<user>.github.io/Breathing/).
  base: './',
  plugins: [
    react(),
    // Makes the app installable and work offline:
    // - writes manifest.webmanifest (name, colours, icons)
    // - generates a service worker that caches all app files on first visit
    VitePWA({
      registerType: 'autoUpdate', // new versions install themselves in the background
      manifest: {
        name: 'Box Breathing',
        short_name: 'Breathe',
        description: 'A calm box breathing (4-4-4-4) exercise that works offline.',
        theme_color: '#f3f6f5',
        background_color: '#f3f6f5',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache everything the app needs, so it runs with no internet at all.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
  ],
  test: {
    // The core logic is plain TypeScript, so tests run in Node (no browser needed).
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
