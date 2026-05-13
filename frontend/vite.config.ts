import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This lets your mobile phone see the server
    allowedHosts: ["seducing-snooper-handwash.ngrok-free.dev"], // Add your ngrok address here
    proxy: {
      // This tells Vite: "If you see a request for /api, send it to port 3000"
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // This handles your Socket.io traffic
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
})