import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: {
      usePolling: false, // Use native events for faster FS tracking
    },
    hmr: {
      overlay: false, // Reduce UI jitter
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    target: 'esnext', // Faster build target
    minify: 'esbuild', // Fastest minifier
    cssMinify: true,
    reportCompressedSize: false, // Save time on build stats
  }
})