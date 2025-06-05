import { rateLimit } from 'express-rate-limit'

export const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // Limit each IP to 100 requests per `window` (here, per 1 hour)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  message: 'too many requests from this IP, please try again in an hour.'
})
