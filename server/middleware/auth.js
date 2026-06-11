import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from client directory
dotenv.config({ path: path.resolve(__dirname, '../../client/.env.local') });
dotenv.config();

const supabaseAuthClient = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * JWT Authentication Middleware
 * Verifies the Supabase access token from the Authorization header.
 * Attaches the verified user ID to req.userId.
 */
export async function verifySupabaseToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing Bearer token' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const { data: { user }, error } = await supabaseAuthClient.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
    req.userId = user.id; // attach verified user ID for downstream use
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
}
