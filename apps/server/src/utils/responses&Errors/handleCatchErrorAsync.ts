/**
 * Higher-order function that wraps async route handlers to catch errors automatically
 *
 * @param {Function} fn - Async function to wrap (typically an Express route handler).
 *   Deliberadamente sin firma explícita: los handlers leen `req.userId` (inyectado por
 *   `verifyToken`) y `req.safeQuery` (inyectado por `validateQueryParams`), propiedades que
 *   todavía NO están declaradas en el namespace Express — el `declare global` llega en la
 *   Fase 3 (`server-ts-phase3-core`), que tipea este wrapper y los controllers con tipos
 *   Express reales. Tipear `fn` aquí antes de esa declaración obligaría a castear en los 20
 *   controllers sin ganar seguridad.
 * @returns {import('express').RequestHandler} Middleware function that handles errors and passes them to next()
 * @description This eliminates the need for try-catch blocks in async route handlers
 */
const handleCatchErrorAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res).catch((err) => {
      next(err);
    });
  };
};
export default handleCatchErrorAsync;
