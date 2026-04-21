import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Permet d'appeler l'API sans se battre avec le CORS en dev
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
