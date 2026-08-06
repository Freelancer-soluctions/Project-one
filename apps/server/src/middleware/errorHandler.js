import { Prisma } from '../config/db.js';
import ClientError from '../utils/responses&Errors/errors.js';
import logger from '../logger/index.js';
import { sanitizePrismaMessage } from '../utils/prisma/sanitizePrismaMessage.js';

// Prisma error code → HTTP status mapping
const PRISMA_CODE_HTTP_MAP = {
  // ── 400 Client errors ──
  P2000: 400,
  P2004: 400,
  P2005: 400,
  P2006: 400,
  P2007: 400,
  P2008: 400,
  P2009: 400,
  P2011: 400,
  P2012: 400,
  P2013: 400,
  P2019: 400,
  P2020: 400,
  P2029: 400,
  P2033: 400,
  // ── 404 Not found ──
  P2001: 404,
  P2015: 404,
  P2018: 404,
  P2025: 404,
  // ── 409 Conflict ──
  P2002: 409,
  P2003: 409,
  P2014: 409,
  P2017: 409,
  P2034: 409,
  // ── 500 Server errors ──
  P2010: 500,
  P2016: 500,
  P2021: 500,
  P2022: 500,
  P2023: 500,
  P2026: 500,
  P2027: 500,
  P2028: 500,
  P2030: 500,
  P2035: 500,
  P2036: 500,
  // ── 503 Unavailable ──
  P2024: 503,
  P2037: 503,
};

/**
 * Global error handling middleware for Express applications.
 * Dispatches Prisma errors by type, maps error codes to HTTP statuses,
 * sanitizes messages for production safety, and preserves full detail in development.
 *
 * @param {Error} err - Error object thrown during request processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  const isDev = process.env.NODE_ENV === 'development';

  // ── Type-based dispatch ──
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = PRISMA_CODE_HTTP_MAP[err.code] || 500;
    code = err.code;
    message = sanitizePrismaMessage(err, isDev);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    code = 'DATABASE_INIT_ERROR';
    message = 'Database service unavailable';
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    code = 'DATABASE_ENGINE_CRASH';
    message = 'Database engine crashed';
    process.exitCode = 1; // Signal process restart
  } else if (err instanceof ClientError) {
    statusCode = err.statusCode || 400;
    code = err.code || 'CLIENT_ERROR';
    message = err.message;
  } else {
    // Generic / unknown errors — never leak system codes to API response
    message = err.message || message;
    code = 'INTERNAL_ERROR';
    if (err.statusCode) statusCode = err.statusCode;
  }

  // ── Single unified log entry ──
  logger.error({
    code,
    statusCode,
    message,
    name: err.name,
    originalMessage: err.message,
    stack: err.stack,
    ...(err instanceof Prisma.PrismaClientKnownRequestError && {
      prismaCode: err.code,
      meta: err.meta,
    }),
  });

  // ── NODE_ENV-gated response enrichment ──
  const response = {
    success: false,
    statusCode,
    code,
    message,
    ...(isDev && err.stack && { details: err.stack }),
  };

  res.status(statusCode).json(response);
};
