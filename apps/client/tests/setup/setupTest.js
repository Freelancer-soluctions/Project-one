import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

// MSW lifecycle
// Ciclo de vida oficial de MSW:
// listen() → inicia servidor
// resetHandlers() → evita contaminación entre tests
// close() → limpia recursos
beforeAll(() => server.listen());

// cleanup should run after each tes
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());
