import Redis from 'ioredis';

// Fetch Redis URL from Environment Variable (Render provides REDIS_URL)
const REDIS_URL = process.env.REDIS_URL;

let redis = null;
let isConnected = false;

if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      // SECURITY FIX: removed rejectUnauthorized:false — certificate
      // verification is now enforced on the credential-bearing Redis link.
      // (ioredis enables TLS automatically for rediss:// URLs.)
      tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    });

    redis.on('connect', () => {
      isConnected = true;
      console.log('[Redis] Successfully connected to Redis instance');
    });

    redis.on('error', (err) => {
      isConnected = false;
      console.warn('[Redis] Connection warning/error:', err.message);
    });
  } catch (err) {
    console.error('[Redis] Initialization error:', err);
  }
} else {
  console.log('[Redis] REDIS_URL not provided. Server running without active Redis instance.');
}

/**
 * Get value from Redis cache
 */
export async function cacheGet(key) {
  if (!redis || !isConnected) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Set value in Redis cache with TTL in seconds
 */
export async function cacheSet(key, value, ttlSeconds = 300) {
  if (!redis || !isConnected) return false;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Set value only when the key does not already exist.
 */
export async function cacheSetOnce(key, value, ttlSeconds = 300) {
  if (!redis || !isConnected) return false;
  try {
    const result = await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (e) {
    return false;
  }
}

/**
 * Delete a Redis key. Used to release short-lived locks on failed work.
 */
export async function cacheDelete(key) {
  if (!redis || !isConnected) return false;
  try {
    await redis.del(key);
    return true;
  } catch (e) {
    return false;
  }
}
/**
 * Sliding Window Rate Limiter using Redis
 * returns { allowed: boolean, remaining: number, resetInSeconds: number }
 */
export async function checkRateLimit(identifier, limit = 20, windowSeconds = 60) {
  if (!redis || !isConnected) {
    // If Redis is not connected, default to allowing requests
    return { allowed: true, remaining: limit, resetInSeconds: 0 };
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  try {
    // COUNT-THEN-RECORD: read the current usage first and only record THIS
    // request if it's allowed. Previously rejected requests were also added
    // to the set, so once a caller crossed the limit every retry extended
    // its own lockout — a polling client could stay throttled indefinitely.
    // Prune expired entries first so the count reflects the true window.
    await redis.zremrangebyscore(key, 0, windowStart);
    const countResult = await redis.zcard(key);
    const requestCount = Number(countResult) || 0;

    if (requestCount >= limit) {
      return { allowed: false, remaining: 0, resetInSeconds: windowSeconds };
    }

    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, windowSeconds);

    const remaining = Math.max(0, limit - requestCount - 1);
    return { allowed: true, remaining, resetInSeconds: windowSeconds };
  } catch (e) {
    console.warn('[Redis RateLimiter] Error:', e.message);
    return { allowed: true, remaining: limit, resetInSeconds: 0 };
  }
}

/**
 * Speed Dating Queue Helpers (ZSET)
 */
export async function addToSpeedDatingQueue(gender, userId) {
  if (!redis || !isConnected) return false;
  try {
    const key = `speed_queue:${gender}`;
    await redis.zadd(key, Date.now(), userId);
    return true;
  } catch (e) {
    return false;
  }
}

export async function removeFromSpeedDatingQueue(gender, userId) {
  if (!redis || !isConnected) return false;
  try {
    const key = `speed_queue:${gender}`;
    await redis.zrem(key, userId);
    return true;
  } catch (e) {
    return false;
  }
}

export { redis, isConnected };
