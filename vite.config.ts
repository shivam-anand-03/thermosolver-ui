import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Pages: landing at /, solver app at /solver/, and the legal pages at /terms/ and /privacy/
      input: {
        home: path.resolve(import.meta.dirname, 'index.html'),
        solver: path.resolve(import.meta.dirname, 'solver/index.html'),
        terms: path.resolve(import.meta.dirname, 'terms/index.html'),
        privacy: path.resolve(import.meta.dirname, 'privacy/index.html'),
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
