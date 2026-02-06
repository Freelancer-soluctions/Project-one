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
  esbuild: {
    loader: 'jsx', // Asegura que los archivos .js con JSX sean procesados correctamente
    // include: /src\/.*\.stories\.js$/, // Aplica solo a archivos de Storybook
    include: /src\/.*\.(js|jsx)$/, // Aplica a todos los archivos .js y .jsx en src
  },
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
