import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';
import i18n from '@/config/i18n';

// Shared mock for @tanstack/react-table - provides realistic flexRender
// that calls the cell function with context, avoiding conflicts between
// DataTable.unit.test.jsx and CellWithTooltip.unit.test.jsx when isolate: false
vi.mock('@tanstack/react-table', () => ({
  flexRender: (cellFn, context) => cellFn(context),
  getCoreRowModel: vi.fn(() => ({})),
  useReactTable: vi.fn(() => ({
    getHeaderGroups: vi.fn(() => []),
    getRowModel: vi.fn(() => ({ rows: [] })),
    getState: vi.fn(() => ({ pagination: { pageIndex: 0, pageSize: 10 } })),
    getPageCount: vi.fn(() => 0),
    setPageIndex: vi.fn(),
    setPageSize: vi.fn(),
    firstPage: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    lastPage: vi.fn(),
    getCanPreviousPage: vi.fn(() => false),
    getCanNextPage: vi.fn(() => false),
    getRowCount: vi.fn(() => 0),
  })),
  getFilteredRowModel: vi.fn(() => ({})),
  getSortedRowModel: vi.fn(() => ({})),
}));

// Explicitly extend expect with jest-dom matchers at runtime
// This ensures matchers are registered on the correct expect instance
// when using pool: 'forks' with isolate: false (CI mode)
expect.extend(matchers);

// MSW lifecycle
// Ciclo de vida oficial de MSW:
// listen() → inicia servidor
// resetHandlers() → evita contaminación entre tests
// close() → limpia recursos
beforeAll(() => {
  server.listen();
});

// cleanup should run after each tes
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());

// Set up i18n for testing
beforeAll(() => {
  // Initialize i18n for tests
  if (i18n) {
    i18n.init({
      lng: 'en', // Set to English for tests
      fallbackLng: 'en',
    });
  }
});
