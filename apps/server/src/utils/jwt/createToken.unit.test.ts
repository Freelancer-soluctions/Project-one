/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dotenv
vi.mock('../../config/dotenv.js', () => ({
  requireEnv: (key: string) => {
    if (key === 'SECRETKEY') return 'test-secret-key';
    if (key === 'REFRESHSECRETKEY') return 'test-refresh-secret-key';
    if (key === 'ALGORITHM') return 'aes-256-gcm';
    return 'test-value';
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => {
  const sign = vi.fn((payload, secret, options, cb) => {
    cb(null, 'mocked-token');
  });
  return {
    default: { sign },
    sign,
  };
});

describe('createToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createToken resolves with a token', async () => {
    const { createToken } = await import('./createToken.js');
    const result = await createToken({ id: 1, rol: { id: 1, code: 'ADMIN' } });
    expect(result).toBe('mocked-token');
  });

  it('createRefreshToken resolves with a token', async () => {
    const { createRefreshToken } = await import('./createToken.js');
    const result = await createRefreshToken({ id: 1 });
    expect(result).toBe('mocked-token');
  });

  it('createRefreshTokenOpaque resolves with a 128-char hex string', async () => {
    const { createRefreshTokenOpaque } = await import('./createToken.js');
    const result = await createRefreshTokenOpaque();
    expect(typeof result).toBe('string');
    expect(result.length).toBe(128);
    expect(/^[0-9a-f]+$/.test(result)).toBe(true);
  });

  it('createToken rejects with empty payload', async () => {
    const { createToken } = await import('./createToken.js');
    await expect(createToken({} as any)).rejects.toThrow();
  });

  it('createToken rejects when jwt.sign errors', async () => {
    const jwt = await import('jsonwebtoken');
    (jwt.default.sign as any).mockImplementationOnce(
      (payload, secret, options, cb) => {
        cb(new Error('sign error'), undefined);
      }
    );

    const { createToken } = await import('./createToken.js');
    await expect(createToken({ id: 1 })).rejects.toBe(
      'Error generating token.'
    );
  });

  it('createTokenOld resolves with a token', async () => {
    const { createTokenOld } = await import('./createToken.js');
    const result = await createTokenOld({ id: 1 });
    expect(result).toBe('mocked-token');
  });

  it('createRefreshTokenOld resolves with a token', async () => {
    const { createRefreshTokenOld } = await import('./createToken.js');
    const result = await createRefreshTokenOld({ id: 1 });
    expect(result).toBe('mocked-token');
  });
});
