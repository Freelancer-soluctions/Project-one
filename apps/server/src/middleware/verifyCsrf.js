import crypto from 'crypto';
export const verifyCsrfOld = (req, res, next) => {
  const csrfCookie = req.cookies.csrfToken;
  const csrfHeader = req.headers['csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF validation failed' });
  }
  next();
};

export const verifyCsrf = (req, res, next) => {
  try {
    const csrfCookie = req.cookies?.csrfToken;
    const csrfHeader = req.headers['csrf-token']; // express siempre los pasa en minúscula

    if (!csrfCookie || !csrfHeader) {
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

export const csrfConditional = (req, res, next) => {
  const isGet = req.method === 'GET';
  const isExcluded = csrfExcludedRoutes.includes(req.path);
  console.log('entre aqui estoy bien csrf token');
  if (isGet || isExcluded) {
    return next(); // no aplicar CSRF
  }

  // Aplicar el middleware real de csrf
  return verifyCsrf(req, res, next);
};
