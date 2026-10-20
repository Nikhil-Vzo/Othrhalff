import { NextRequest } from 'next/server';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * In-memory sliding window rate limiter for Next.js API routes.
 * @param req NextRequest
 * @param limit Max requests allowed within the window
 * @param windowSeconds Window length in seconds
 * @param keyPrefix Optional prefix to namespace different endpoints
 * @returns { success: boolean, remaining: number, resetInSeconds: number }
 */
export function checkRateLimit(
  req: NextRequest,
  limit: number = 20,
  windowSeconds: number = 60,
  keyPrefix: string = 'api'
): { success: boolean; remaining: number; resetInSeconds: number } {
  const ip = getClientIp(req);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const current = rateLimitMap.get(key);

  if (!current || now > current.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (current.count >= limit) {
    const resetInSeconds = Math.ceil((current.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  current.count += 1;
  const resetInSeconds = Math.ceil((current.resetAt - now) / 1000);
  return {
    success: true,
    remaining: limit - current.count,
    resetInSeconds: Math.max(1, resetInSeconds),
  };
}
