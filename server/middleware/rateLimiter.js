import { checkRateLimit } from '../lib/redis.js';

/**
 * Express Middleware for Rate Limiting using Redis
 */
export function rateLimiter({ limit = 20, windowSeconds = 60, keyPrefix = 'api' } = {}) {
  return async (req, res, next) => {
    try {
      // Identify request by user IP or user ID if authenticated
      // (trust proxy is set in index.js so req.ip is the real client IP)
      const identifier = `${keyPrefix}:${req.ip || 'anonymous'}`;

      const { allowed, remaining, resetInSeconds } = await checkRateLimit(identifier, limit, windowSeconds);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetInSeconds);

      if (!allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please try again in ${windowSeconds} seconds.`
        });
      }

      next();
    } catch (err) {
      // SCALING: fail OPEN on limiter errors so a limiter bug can never take
      // down the whole API — abuse controls degrade instead of the product.
      console.error('[RateLimiter] error (failing open):', err);
      next();
    }
  };
}
