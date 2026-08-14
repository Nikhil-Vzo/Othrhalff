import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

let supabaseAuthClient;

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

/**
 * JWT Authentication Middleware
 * High-performance dual-mode authentication:
 * 1. Fast path: Instant local cryptographic verification using SUPABASE_JWT_SECRET (<0.2ms latency, zero network calls).
 * 2. Fallback path: Network verification via Supabase GoTrue API if secret is not provided.
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

  // 3. Fast Path: Local JWT verification via jose (No outbound HTTP call)
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (jwtSecret) {
    try {
      const secretKey = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secretKey);

      const userId = payload.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Token missing subject claim' });
      }

      req.userId = userId;
      req.user = {
        id: userId,
        email: payload.email,
        user_metadata: payload.user_metadata || {},
        app_metadata: payload.app_metadata || {},
      };

      return next();
    } catch (jwtErr) {
      console.warn('[Local JWT Verification Failed - Token expired or invalid]:', jwtErr.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
  }

  // 4. Fallback Path: Supabase GoTrue Auth API (Used if SUPABASE_JWT_SECRET is not configured)
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
