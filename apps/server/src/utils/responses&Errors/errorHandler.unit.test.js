import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger BEFORE importing errorHandler
vi.mock('../../logger/index.js', () => ({
  default: { error: vi.fn(), warn: vi.fn() },
}));

import { Prisma } from '../../config/db.js';
import ClientError from './errors.js';
const { errorHandler } = await import('../../middleware/errorHandler.js');

describe('errorHandler', () => {
  let req, res, next;
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('should return 409 for P2002 unique constraint violation', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on email',
      { code: 'P2002', clientVersion: '5.22.0' }
    );
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, code: 'P2002' })
    );
  });

  it('should return 404 for P2025 record not found', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Record to delete does not exist',
      { code: 'P2025', clientVersion: '5.22.0' }
    );
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 409 for P2003 foreign key violation', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed',
      { code: 'P2003', clientVersion: '5.22.0' }
    );
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should return 503 for P2024 pool timeout', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Connection pool timeout',
      { code: 'P2024', clientVersion: '5.22.0' }
    );
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('should return 400 for PrismaClientValidationError', () => {
    const err = new Prisma.PrismaClientValidationError('Invalid query', {
      clientVersion: '5.22.0',
    });
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
  });

  it('should return 503 for PrismaClientInitializationError', () => {
    const err = new Prisma.PrismaClientInitializationError(
      'Cannot connect to database',
      { clientVersion: '5.22.0' }
    );
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'DATABASE_INIT_ERROR' })
    );
  });

  it('should return 500 for PrismaClientRustPanicError and set exitCode', () => {
    const originalExitCode = process.exitCode;
    const err = new Prisma.PrismaClientRustPanicError('Engine crashed', {
      clientVersion: '5.22.0',
    });
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'DATABASE_ENGINE_CRASH' })
    );
    expect(process.exitCode).toBe(1);
    process.exitCode = originalExitCode;
  });

  it('should use custom statusCode for ClientError', () => {
    const err = new ClientError('Custom bad request', 422);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CLIENT_ERROR' })
    );
  });

  it('should return 500 for generic Error', () => {
    const err = new Error('Something broke');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR' })
    );
  });

  it('should sanitize error message in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (email)',
      { code: 'P2002', clientVersion: '5.22.0' }
    );
    errorHandler(err, req, res, next);
    const callArgs = res.json.mock.calls[0][0];
    expect(callArgs.message).not.toContain('email');
    expect(callArgs.message).not.toContain('Unique constraint');
    expect(callArgs.details).toBeUndefined();
  });

  it('should include stack in development mode', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('test error');
    errorHandler(err, req, res, next);
    const callArgs = res.json.mock.calls[0][0];
    expect(callArgs.details).toEqual(err.stack);
  });

  it('should return 500 for unknown Prisma error code', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unknown error', {
      code: 'P9999',
      clientVersion: '5.22.0',
    });
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
