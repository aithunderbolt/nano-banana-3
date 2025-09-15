import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on all network interfaces
    allowedHosts: ['srv-hq-ai01'], // allow access by this hostname
    // port can remain default (5173) since you start Vite with that port already
  },
})
