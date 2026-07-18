import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  test: {
    // Permite usar: test() y expect()
    globals: true,
    // Simula navegador → necesario para React.
    environment: 'jsdom',

    // setupFiles run before each test file
    // Punto central para:
    // matchers globales
    // mocks globales
    // configuración base
    setupFiles: ['./tests/setup/setupTest.js'],

    // Evita errores al importar estilos (muy común en React).
    css: true,

    // usa motor nativo (v8 → más rápido)
    // excluye tests y config
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.config.js'],
    },

    // Evita que Vitest escanee todo el repo (performance + control)
    include: ['src/**/*.test.{js,jsx}', 'tests/**/*.test.{js,jsx}'],

    // 🔥 optimización avanzada (docs vitest optimizer)
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/react', '@testing-library/jest-dom'],
        },
      },
    },
  },
});
