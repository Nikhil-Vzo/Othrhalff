import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

let supabaseAuthClient;
let jwksClient;

function getSupabaseAuthClient() {
  if (!supabaseAuthClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials missing in server env (Check SUPABASE_URL / SUPABASE_ANON_KEY)');
    }
    supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseAuthClient;
}

function getJWKSClient() {
  if (!jwksClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        jwksClient = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
      } catch (err) {
        console.warn('[Auth] Failed to initialize Supabase JWKS client:', err.message);
      }
    }
  }
  return jwksClient;
}

/**
 * JWT Authentication Middleware
 * High-performance triple-tier authentication:
 * 1. Fast Path A (Asymmetric ECC P-256 / ES256): Instant local verification via Supabase JWKS (<0.1ms).
 * 2. Fast Path B (Symmetric HS256): Instant local HMAC verification if SUPABASE_JWT_SECRET is set.
 * 3. Robust Fallback: Network verification via Supabase GoTrue API (guarantees 100% compatibility).
 *
 * Attaches both req.userId and req.user for full backward compatibility across all routes.
 */
export async function verifySupabaseToken(req, res, next) {
  // 1. Admin Secret Bypass
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret && process.env.ADMIN_SECRET_KEY && adminSecret === process.env.ADMIN_SECRET_KEY) {
    req.isAdmin = true;
    req.userId = 'ADMIN_USER';
    req.user = { id: 'ADMIN_USER', role: 'admin' };
    return next();
  }

  // 2. Extract Bearer Token
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing Bearer token or Admin Secret Key' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  // 3. Fast Path A: Local JWKS verification for ECC P-256 / ES256 tokens
  const jwks = getJWKSClient();
  if (jwks) {
    try {
      const { payload } = await jwtVerify(token, jwks);
      const userId = payload.sub;
      if (userId) {
        req.userId = userId;
        req.user = {
          id: userId,
          email: payload.email,
          user_metadata: payload.user_metadata || {},
          app_metadata: payload.app_metadata || {},
        };
        return next();
      }
    } catch (_) {
      // If JWKS verification fails (e.g. legacy HS256 token), continue to Path B
    }
  }

  // 3. Fast Path B: Local HMAC verification if SUPABASE_JWT_SECRET is set (Legacy HS256)
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (jwtSecret) {
    try {
      const secretKey = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secretKey);

      const userId = payload.sub;
      if (userId) {
        req.userId = userId;
        req.user = {
          id: userId,
          email: payload.email,
          user_metadata: payload.user_metadata || {},
          app_metadata: payload.app_metadata || {},
        };
        return next();
      }
    } catch (_) {
      // Continue to Supabase GoTrue fallback
    }
  }

  // 4. Fallback Path: Supabase GoTrue Auth API (Guaranteed fallback)
  try {
    const client = getSupabaseAuthClient();
    const { data: { user }, error } = await client.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    req.userId = user.id;
    req.user = user;
    return next();
  } catch (err) {
    console.error('[Supabase Auth Network Error]:', err);
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
}
