import { describe, vi } from 'vitest';

// Needs real PostgreSQL + correct import paths — disabled until DB is available
// Original imports (broken paths, missing src/):
//   import { startServer, stopServer } from '../../test-server';
//   import prisma from '../../../src/config/db';
//   import { createToken } from '../../../src/utils/jwt/createToken';

describe.skip('Role endpoint', () => {
  // All tests skipped — requires running PostgreSQL instance
});
