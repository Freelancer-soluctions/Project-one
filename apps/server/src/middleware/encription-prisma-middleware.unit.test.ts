/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';

// Mock dotenv
vi.mock('../config/dotenv.js', () => ({
  requireEnv: (key: string) => {
    if (key === 'ALGORITHM') return 'aes-256-gcm';
    if (key === 'AES_GCM_KEY')
      return Buffer.from('a'.repeat(32)).toString('base64');
    return 'test-value';
  },
}));

describe('encription-prisma-middleware', () => {
  it('module loads without error', async () => {
    const mod = await import('./encription-prisma-middleware.js');
    expect(mod).toBeDefined();
    expect(typeof mod.encryptionMiddleware).toBe('function');
    expect(typeof mod.migrateExistingData).toBe('function');
    expect(typeof mod.testEncryption).toBe('function');
  });

  it('testEncryption runs without error', async () => {
    const { testEncryption } =
      await import('./encription-prisma-middleware.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    testEncryption();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('migrateExistingData throws for unknown model', async () => {
    const { migrateExistingData } =
      await import('./encription-prisma-middleware.js');
    const mockPrisma = {} as any;
    await expect(
      migrateExistingData(mockPrisma, 'NonExistentModel')
    ).rejects.toThrow('Modelo NonExistentModel no encontrado');
  });

  it('migrateExistingData returns early for model without encrypted fields', async () => {
    const { migrateExistingData } =
      await import('./encription-prisma-middleware.js');
    const mockModel = {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    };
    const mockPrisma = {
      unknownmodel: mockModel,
    } as any;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await migrateExistingData(mockPrisma, 'UnknownModel');
    expect(mockModel.findMany).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('migrateExistingData migrates unencrypted fields', async () => {
    const { migrateExistingData } =
      await import('./encription-prisma-middleware.js');
    const mockModel = {
      findMany: vi
        .fn()
        .mockResolvedValue([{ id: 1, baseSalary: '1000', extraHours: '5' }]),
      update: vi.fn().mockResolvedValue({}),
    };
    const mockPrisma = {
      payroll: mockModel,
    } as any;

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await migrateExistingData(mockPrisma, 'Payroll');
    consoleSpy.mockRestore();

    expect(mockModel.findMany).toHaveBeenCalled();
    expect(mockModel.update).toHaveBeenCalled();
  });

  it('migrateExistingData skips already encrypted fields', async () => {
    const { migrateExistingData } =
      await import('./encription-prisma-middleware.js');
    const longEncrypted = 'A'.repeat(50);
    const mockModel = {
      findMany: vi
        .fn()
        .mockResolvedValue([{ id: 1, baseSalary: longEncrypted }]),
      update: vi.fn().mockResolvedValue({}),
    };
    const mockPrisma = {
      payroll: mockModel,
    } as any;

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await migrateExistingData(mockPrisma, 'Payroll');
    consoleSpy.mockRestore();

    expect(mockModel.update).not.toHaveBeenCalled();
  });

  it('migrateExistingData handles errors gracefully', async () => {
    const { migrateExistingData } =
      await import('./encription-prisma-middleware.js');
    const mockModel = {
      findMany: vi.fn().mockResolvedValue([{ id: 1, baseSalary: '1000' }]),
      update: vi.fn().mockRejectedValue(new Error('Update failed')),
    };
    const mockPrisma = {
      payroll: mockModel,
    } as any;

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await migrateExistingData(mockPrisma, 'Payroll');
    consoleSpy.mockRestore();
    errorSpy.mockRestore();

    expect(mockModel.update).toHaveBeenCalled();
  });

  it('encryptionMiddleware creates middleware function', async () => {
    const { encryptionMiddleware } =
      await import('./encription-prisma-middleware.js');
    let capturedMiddleware: unknown = null;
    const mockPrisma = {
      $use: vi.fn((fn: unknown) => {
        capturedMiddleware = fn;
      }),
    } as any;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    encryptionMiddleware(mockPrisma);

    expect(mockPrisma.$use).toHaveBeenCalled();
    expect(capturedMiddleware).toBeInstanceOf(Function);
    consoleSpy.mockRestore();
  });

  it('encryptionMiddleware handles create action', async () => {
    const { encryptionMiddleware } =
      await import('./encription-prisma-middleware.js');
    let capturedMiddleware: unknown = null;
    const mockPrisma = {
      $use: vi.fn((fn: unknown) => {
        capturedMiddleware = fn;
      }),
    } as any;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    encryptionMiddleware(mockPrisma);

    const params = {
      model: 'Payroll',
      action: 'create',
      args: { data: { baseSalary: '1000', name: 'test' } },
    };
    const next = vi.fn().mockResolvedValue({ id: 1, baseSalary: 'encrypted' });
    await capturedMiddleware(params, next);

    expect(next).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('encryptionMiddleware handles findMany action', async () => {
    const { encryptionMiddleware } =
      await import('./encription-prisma-middleware.js');
    let capturedMiddleware: unknown = null;
    const mockPrisma = {
      $use: vi.fn((fn: unknown) => {
        capturedMiddleware = fn;
      }),
    } as any;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    encryptionMiddleware(mockPrisma);

    const params = {
      model: 'Payroll',
      action: 'findMany',
      args: {},
    };
    const next = vi
      .fn()
      .mockResolvedValue([{ id: 1, baseSalary: 'encrypted-value' }]);
    await capturedMiddleware(params, next);

    expect(next).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('encryptionMiddleware handles model without encrypted fields', async () => {
    const { encryptionMiddleware } =
      await import('./encription-prisma-middleware.js');
    let capturedMiddleware: unknown = null;
    const mockPrisma = {
      $use: vi.fn((fn: unknown) => {
        capturedMiddleware = fn;
      }),
    } as any;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    encryptionMiddleware(mockPrisma);

    const params = {
      model: 'UnknownModel',
      action: 'findMany',
      args: {},
    };
    const next = vi.fn().mockResolvedValue([{ id: 1, name: 'test' }]);
    await capturedMiddleware(params, next);

    expect(next).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
