import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const uiSource = fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url))

// Two pages, each the production build of one example screen, as an application would ship it.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@veljaos/ui': uiSource }, dedupe: ['react', 'react-dom'] },
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        list: fileURLToPath(new URL('list.html', import.meta.url)),
        document: fileURLToPath(new URL('document.html', import.meta.url)),
      },
    },
  },
})
