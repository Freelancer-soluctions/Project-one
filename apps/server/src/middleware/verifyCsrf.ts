import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const verifyCsrfOld = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const csrfCookie = req.cookies.csrfToken;
  const csrfHeader = req.headers['csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF validation failed' });
  }
  next();
};

export const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
  try {
    const csrfCookie = req.cookies?.csrfToken;
    const csrfHeader = req.headers['csrf-token']; // express siempre los pasa en minúscula

    // `typeof` además de la comprobación de existencia: el header puede llegar
    // repetido (string[]) y el código original terminaba en el catch → 403.
    if (!csrfCookie || typeof csrfHeader !== 'string') {
      return res
        .status(403)
        .json({ message: 'CSRF validation failed (missing tokens)' });
    }

    const cookieBuf = Buffer.from(csrfCookie, 'utf8');
    const headerBuf = Buffer.from(csrfHeader, 'utf8');

    if (cookieBuf.length !== headerBuf.length) {
      return res
        .status(403)
        .json({ message: 'CSRF validation failed (invalid length)' });
    }

    if (!crypto.timingSafeEqual(cookieBuf, headerBuf)) {
      return res
        .status(403)
        .json({ message: 'CSRF validation failed (invalid token)' });
    }

    next();
  } catch (err) {
    console.error('CSRF ERROR:', err);
    return res
      .status(403)
      .json({ message: 'CSRF validation failed (exception)' });
  }
};
// rutas excluidas
const csrfExcludedRoutes = ['/auth/signin', '/auth/signup', '/auth/logout'];

export const csrfConditional = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isGet = req.method === 'GET';
  const isExcluded = csrfExcludedRoutes.includes(req.path);
  console.log('entre aqui estoy bien csrf token');
  if (isGet || isExcluded) {
    return next(); // no aplicar CSRF
  }

  // Aplicar el middleware real de csrf
  return verifyCsrf(req, res, next);
};
