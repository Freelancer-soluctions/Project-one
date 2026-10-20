import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import dontenv from '../config/dotenv.js';
import logger from '../logger/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Tipado estructural del namespace Express (Fase 3 — design decisión 2/5).
//
// ÚNICA declaración global del proyecto. `verifyToken` es quien ESCRIBE
// `user`/`userId` y `validateQueryParams` escribe `safeQuery`, así que aquí
// vive el contrato que consumen los 95 accesos de los controllers (Fase 2,
// verificados sin casts en task 5.2).
//
// El tipo del payload es el que REALMENTE firma `utils/jwt/createToken.ts`:
// `createToken({ id, rol? })` y el refresh solo `{ id }` → `rol` opcional.
// `user`/`userId`/`safeQuery` son opcionales porque solo existen DESPUÉS del
// middleware correspondiente.
// ─────────────────────────────────────────────────────────────────────────────
declare global {
  // El tipado estructural de `Express.Request` pasa por la augmentación del
  // namespace oficial de @types/express (patrón documentado por DefinitelyTyped);
  // no es un namespace declarativo de la app.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Payload JWT verificado (`createToken({ id, rol? })`). Set por `verifyToken`. */
      user?: JwtPayload;
      /** `user.id` en cortocircuito: es el acceso usado por los controllers. */
      userId?: number;
      /** Código de rol verificado (C01/C02/...). Set por `verifyRole`. */
      userRole?: string;
      /** Query ya validada/normalizada por Joi. Set por `validateQueryParams`. */
      safeQuery?: Record<string, unknown>;
    }
  }
}

/**
 * Verifies JWT token from Authorization header and attaches user data to request.
 * This middleware extracts the JWT from the 'Bearer {token}' format in the Authorization header,
 * validates the token signature and expiration, and attaches the decoded user
 * information to the request object for downstream middleware and routes.
 *
 * @param req - Express request object containing Authorization header
 * @param res - Express response object for error responses
 * @param next - Express next middleware function
 * @returns Calls next() with user data attached, or sends 401/403 response
 * @throws {Error} When JWT verification fails due to invalid signature or expired token
 * @throws {Error} When Authorization header is missing or malformed
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Get the token from the headers
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      // `typeof` defensivo: los headers pueden repetirse (string[]), caso que
      // el código original trataba igual que "sin token" (undefined).
      logger.warn('⚠️ INTENTO DE ACCESO SIN TOKEN', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    // if does not exists a token
    if (!token) {
      logger.warn('⚠️ HEADER DE AUTORIZACIÓN MALFORMADO', {
        ip: req.ip,
        authHeader: authHeader.substring(0, 20) + '...',
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({ message: 'Sorry, you must log in.' });
    }

    // decode the token and verify the time
    const decoded = jwt.verify(token, dontenv('SECRETKEY'), {
      algorithms: ['HS256'],
      issuer: 'mi-api',
      audience: 'mi-front',
    });

    // `verify` devuelve `string` solo si el emisor firma claims escalares; esta
    // API firma siempre payload-objeto, así que se responde 401 (defensa).
    if (typeof decoded === 'string' || decoded === null) {
      logger.warn('⚠️ TOKEN CON PAYLOAD NO OBJETO', {
        ip: req.ip,
        path: req.path,
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // save the token on request object to using on routes
    req.userId = decoded.id as number;
    req.user = decoded;
    // continue with the next function
    next();
  } catch (error) {
    // `jwt.verify` lanza `TokenExpiredError` (con `expiredAt`) u otros
    // `JsonWebTokenError`; se normaliza el mensaje sin asumir `Error`.
    const message = error instanceof Error ? error.message : String(error);
    const expiredAt =
      typeof error === 'object' && error !== null && 'expiredAt' in error
        ? (error as { expiredAt?: Date }).expiredAt
        : undefined;
    logger.warn(message, {
      ip: req.ip,
      expiredAt,
      path: req.path,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
    return res.status(401).json({ error: message });
  }
};
