import { rateLimit } from 'express-rate-limit';

/**
 * General purpose rate limiter for API endpoints.
 * Protects API endpoints from abuse by limiting request rate per IP address.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Processes request or responds with 429 if rate limit exceeded
 * @throws {Error} When rate limiting configuration is invalid
 *
 * @example
 * // Apply to all routes
 * app.use('/api/', limiter);
 *
 * // Apply to specific routes
 * app.post('/login', loginLimiter, loginController);
 */
export const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // Limit each IP to 500 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  message: 'too many requests from this IP, please try again in an hour.',
});

/**
 * Login-specific rate limiter to prevent brute force attacks.
 * Implements stricter rate limiting for authentication endpoints to prevent
 * credential stuffing and password guessing attacks.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Limits failed login attempts to 5 per 15 minutes per IP
 * @throws {Error} When rate limit is exceeded for login attempts
 *
 * @example
 * // Apply to login endpoint
 * router.post('/login', loginLimiter, loginController);
 * // Responds with 429 Too Many Requests after 5 failed attempts
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  skipSuccessfulRequests: true, // Only count failed attempts
  message:
    'too many login attempts from this IP, please try again in 15 minutes.',
});

/**
 * Enhanced login rate limiter that only counts failed attempts.
 * Ignores successful login attempts to prevent legitimate users from being blocked.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Limits failed login attempts to 5 per 15 minutes per IP
 * @throws {Error} When rate limit is exceeded for login attempts
 *
 * @example
 * // Apply to login endpoint
 * router.post('/login', loginLimiterEnhanced, loginController);
 */
export const loginLimiterEnhanced = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  skipSuccessfulRequests: true, // Only count failed attempts
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter SPECIFIC for refresh token
/**
 * Refresh token rate limiter for token rotation endpoints.
 * Limits token refresh requests to prevent abuse and protect against
 * refresh token enumeration or brute force attacks.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Processes refresh request or responds with 429 if limit exceeded
 * @throws {Error} When rate limiting configuration is invalid
 *
 * @example
 * // Apply to refresh token endpoint
 * router.post('/refresh-token', refreshTokenLimiter, refreshController);
 */
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  skipSuccessfulRequests: false, // Count all attempts
  message: 'Too many refresh attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  // Limit by IP AND by cookie
  keyGenerator: (req) => {
    const token = req.cookies?.jwt;

    if (!token) {
      return req.ip;
    }

    // Secure derivation of user-controlled input
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')
      .substring(0, 16); // sufficient entropy for rate limiting

    return `${req.ip}-${tokenHash}`;
  },
});

export const changePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per IP
  skipSuccessfulRequests: true,
  message: 'Too many password change attempts. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per IP
  skipSuccessfulRequests: false,
  message: 'Too many recovery attempts. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
});
