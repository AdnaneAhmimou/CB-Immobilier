import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Keeps dev same-origin with the API so the session cookie behaves exactly as it
    // does in production (a cross-origin cookie would need SameSite=None; Secure,
    // which plain-http localhost cannot set).
    proxy: {
      // VITE_API_PROXY overrides the target when the backend runs on another port.
      '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:3001', changeOrigin: true },
    },
  },
})
