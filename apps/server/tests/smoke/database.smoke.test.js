import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../../src/config/db.js';

describe('Smoke Test: Database Connectivity', () => {
  it('should connect to database and execute simple query', async () => {
    // Execute a simple query to verify database connectivity
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('test', 1);
  });

  it('should be able to query a real table (users)', async () => {
    // Try to count users - this verifies the schema is accessible
    const count = await prisma.user.count();

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
