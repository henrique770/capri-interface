import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: { lib: { entry: resolve(__dirname, 'electron/main.ts') } },
  },
  preload: {
    build: { lib: { entry: resolve(__dirname, 'electron/preload.ts') } },
  },
  renderer: {
    root: resolve(__dirname, 'src'),
    resolve: { alias: { '@': resolve(__dirname, 'src') } },
    plugins: [react(), tailwindcss()],
    build: {
      rolldownOptions: { input: resolve(__dirname, 'src/index.html') },
    },
  },
})
