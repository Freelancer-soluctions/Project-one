/// <reference types="vitest"/>
/// <reference types="vite/client"/>
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.ts', '.js', '.json', '.css', '.tsx']
  },
  // base:"/",
  test: {
    globals: true,
    environment: 'jsdom',
    root:'test/',
    // include: ['./test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./vitest-setup.ts']
  },
});
