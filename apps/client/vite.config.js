import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { fileURLToPath } from 'url';

// ✅ Crear __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Source maps "hidden" (PRD §Frontend): se emiten los `.map` en
    // `dist/assets/` pero el bundle NO lleva el comentario `sourceMappingURL`,
    // así el navegador nunca los pide. Se suben al sistema de errores y no se
    // publican en el servidor estático — ver docs/frontend/frontend-sourcemaps-y-cache.md.
    sourcemap: 'hidden',
  },
  server: {
    host: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
