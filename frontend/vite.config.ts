import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 7500,
    allowedHosts: ['ehs.com4in.com', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:7501',
        changeOrigin: true,
      },
    },
  },
})
