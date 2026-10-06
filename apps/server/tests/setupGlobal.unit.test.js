import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dotenv to prevent loading the actual .env.test file
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

// Mock child_process to prevent actually spawning `node prisma/seed.js`
vi.mock('child_process', () => ({
  spawnSync: vi.fn(),
}));

import { config } from 'dotenv';
import { spawnSync } from 'child_process';
import globalSetup from './setupGlobal.js';

describe('globalSetup', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for dotenv.config — return empty parsed result
    config.mockReturnValue({ parsed: {} });
  });

  afterEach(() => {
    // Restore env vars
    if (originalDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  it('should load .env.test via dotenv.config with correct path', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    spawnSync.mockReturnValue({ status: 0 });

    await globalSetup();

    expect(config).toHaveBeenCalledTimes(1);
    expect(config).toHaveBeenCalledWith({
      path: expect.stringContaining('.env.test'),
    });
  });

  it('should spawn seed script when DATABASE_URL is set', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    spawnSync.mockReturnValue({ status: 0 });

    await globalSetup();

    expect(spawnSync).toHaveBeenCalledTimes(1);
    expect(spawnSync).toHaveBeenCalledWith(
      'node',
      ['prisma/seed.js'],
      expect.objectContaining({
        stdio: 'inherit',
        cwd: expect.stringContaining('server'),
        env: expect.objectContaining({
          NODE_ENV: 'test',
        }),
      })
    );
  });

  it('should pass NODE_ENV=test to the seed child process env', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    spawnSync.mockReturnValue({ status: 0 });
    process.env.NODE_ENV = 'production'; // ensure it gets overridden

    await globalSetup();

    const callOptions = spawnSync.mock.calls[0][2];
    expect(callOptions.env.NODE_ENV).toBe('test');
  });

  it('should skip seeding and warn when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await globalSetup();

    expect(spawnSync).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('DATABASE_URL is not set')
    );
    warnSpy.mockRestore();
  });

  it('should warn when seed script exits with non-zero status', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    spawnSync.mockReturnValue({ status: 2 });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await globalSetup();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Seed script exited with code 2')
    );
    warnSpy.mockRestore();
  });

  it('should log success when seed script exits with code 0', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    spawnSync.mockReturnValue({ status: 0 });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await globalSetup();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database seeded successfully')
    );
    logSpy.mockRestore();
  });

  it('should use stdio inherit to pipe child output to parent', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    spawnSync.mockReturnValue({ status: 0 });

    await globalSetup();

    expect(spawnSync.mock.calls[0][2].stdio).toBe('inherit');
  });
});
