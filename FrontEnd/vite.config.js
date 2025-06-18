import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // 👈 important for proper asset path resolution on Vercel
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
})
