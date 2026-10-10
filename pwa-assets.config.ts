import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates the app icons in public/ from public/favicon.svg.
// Run `npm run generate-icons` after changing the SVG.
const background = '#2f7069' // same teal as the icon, so padded icons look seamless

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { sizes: [512], padding: 0.2, resizeOptions: { background } },
    apple: { sizes: [180], padding: 0.2, resizeOptions: { background } },
  },
  images: ['public/favicon.svg'],
})
