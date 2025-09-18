import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // listen on all network interfaces
    port: 5173,
    strictPort: true,
    allowedHosts: ['srv-hq-ai01', 'localhost', '127.0.0.1'],
    cors: {
      origin: ['http://srv-hq-ai01:5200', 'http://localhost:5200'],
      credentials: true
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
})
