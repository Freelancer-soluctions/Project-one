import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Higher-order function that wraps async route handlers to catch errors automatically.
 *
 * Firma tipada: por contextual typing, TODOS los handlers envueltos reciben
 * `req: Request` / `res: Response` sin tocar sus cuerpos (el `declare global`
 * completo vive en `middleware/verifyToken.ts` — change `server-ts-express-contracts`).
 *
 * @param fn - Async Express route handler (retorna Promise — síncronos lanzan y
 *             Express 4 los captura por sí mismo).
 * @returns RequestHandler que maneja errores y los pasa a `next(err)` (`err: unknown`,
 *          alineado con `useUnknownInCatchVariables` — Fase 4, task 6.5).
 */
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

const handleCatchErrorAsync = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch((err: unknown) => {
      next(err);
    });
  };
};
export default handleCatchErrorAsync;
