import { Prisma } from '../config/db.js';
import ClientError from '../utils/responses&Errors/errors.js';
import logger from '../logger/index.js';
import { sanitizePrismaMessage } from '../utils/prisma/sanitizePrismaMessage.js';
import type { NextFunction, Request, Response } from 'express';

// Prisma error code → HTTP status mapping
const PRISMA_CODE_HTTP_MAP: Record<string, number> = {
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
 * Forma estructural mínima que el handler lee de un error desconocido.
 * El primer dispatch es por `instanceof`, así que el único bloque que la
 * necesita es el de errores genéricos — de ahí `unknown` en la firma.
 */
type ErrorLike = Error & { statusCode?: number };

/**
 * Global error handling middleware for Express applications.
 * Dispatches Prisma errors by type, maps error codes to HTTP statuses,
 * sanitizes messages for production safety, and preserves full detail in development.
 *
 * @param err - Error thrown during request processing (`unknown` para pre-adaptar
 *   `useUnknownInCatchVariables` de Fase 4: toda lectura pasa por narrowing)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // El 4º parámetro es obligatorio para que Express reconozca un
  // ErrorRequestHandler; no se usa.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  const isDev = process.env.NODE_ENV === 'development';

  // Campos de soporte leídos SOLO después del dispatch por tipo.
  const errorLike = err as ErrorLike;
  const { name, stack } = errorLike;

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
    // `ClientError` (ClientError.ts) solo declara `statusCode`; `code` no existe en
    // la clase, así que el fallback 'CLIENT_ERROR' es el camino real hoy.
    code = (err as ClientError & { code?: string }).code || 'CLIENT_ERROR';
    message = err.message;
  } else {
    // Generic / unknown errors — never leak system codes to API response
    message = errorLike.message || message;
    code = 'INTERNAL_ERROR';
    if (errorLike.statusCode) statusCode = errorLike.statusCode;
  }

  // ── Single unified log entry ──
  logger.error({
    code,
    statusCode,
    message,
    name,
    originalMessage: errorLike.message,
    stack,
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
    ...(isDev && stack && { details: stack }),
  };

  res.status(statusCode).json(response);
};
