import { rateLimit } from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // Limit each IP to 100 requests per `window` (here, per 1 hour)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  message: 'too many requests from this IP, please try again in an hour.',
});

// Rate limiter ESPECÍFICO para login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  skipSuccessfulRequests: true, // Solo cuenta fallos
  message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter ESPECÍFICO para refresh token
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por IP
  skipSuccessfulRequests: false, // Cuenta todos los intentos
  message: 'Demasiados intentos de refresh. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  // Limitar por IP Y por cookie
  keyGenerator: (req) => {
    return `${req.ip}-${req.cookies?.jwt?.substring(0, 10) || 'no-token'}`;
  },
});

export const changePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos por IP
  skipSuccessfulRequests: true,
  message:
    'Demasiados intentos de cambio de contraseña. Intenta de nuevo en 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos por IP
  skipSuccessfulRequests: false,
  message: 'Demasiados intentos de recuperación. Intenta de nuevo en 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});
