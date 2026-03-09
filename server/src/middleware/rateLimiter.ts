/**
 * Rate limiting to prevent abuse.
 * - generalLimiter: 100 requests per 15-minute window (all routes)
 * - authLimiter: 5 requests per 15-minute window (login/register only)
 *
 * Both are disabled in development and test environments.
 *
 * @todo (scalability): Advanced caching — use Redis store (rate-limit-redis) for multi-instance deployments.
 */
import rateLimit from 'express-rate-limit'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const GENERAL_MAX_REQUESTS = 100
const AUTH_MAX_REQUESTS = 5

export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: GENERAL_MAX_REQUESTS,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
})

export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_MAX_REQUESTS,
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
})
