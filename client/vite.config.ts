import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from 'path'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }, 
    extensions: ['.ts', '.js', '.json', '.css', '.tsx']
  }
})
