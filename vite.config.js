import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // 👇 THIS FIXES THE CORS ERROR
  server: {
    proxy: {
      '/boltic-api': {
        target: 'https://asia-south1.api.boltic.io', // The actual server
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/boltic-api/, ''),
      },
    },
  },
})