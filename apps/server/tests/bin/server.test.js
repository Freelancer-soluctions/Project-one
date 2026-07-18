import { describe, vi } from 'vitest';

// Mockeamos app.listen con export default
vi.mock('./app', () => ({
  default: {
    listen: vi.fn(),
  },
}));

describe.todo('Appplication should start with port');
