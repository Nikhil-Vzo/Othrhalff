import { checkRateLimit } from '../lib/redis.js';

/**
 * Express Middleware for Rate Limiting using Redis
 */
export function rateLimiter({ limit = 20, windowSeconds = 60, keyPrefix = 'api' } = {}) {
  return async (req, res, next) => {
    // Identify request by user IP or user ID if authenticated
    const identifier = `${keyPrefix}:${req.ip || req.headers['x-forwarded-for'] || 'anonymous'}`;
    
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
  };
}
