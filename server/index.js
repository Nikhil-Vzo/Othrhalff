import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from client directory since that's where the user keeps their environment variables
dotenv.config({ path: path.resolve(__dirname, '../client/.env.local') });
dotenv.config(); // Fallback to root .env if it exists

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// ─── Supabase (anon client for JWT verification only) ────────────────────────
const supabaseAuthClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
);

/**
 * JWT Authentication Middleware
 * Verifies the Supabase access token from the Authorization header.
 * Attaches the verified user ID to req.userId.
 */
async function verifySupabaseToken(req, res, next) {
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

// CORS Configuration - Allow both production and development origins
const corsOptions = {
  origin: [
    'http://localhost:5173', // Local Vite dev server
    'http://localhost:3000', // Alternative local port
    'https://testing-of-client.vercel.app', // Old Production frontend
    'https://othrhalff.in', // New Domain
    'https://www.othrhalff.in', // New Domain (www)
    'https://othrhalff.vercel.app', // New Vercel Domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Agora: Generate RTC Token for Video/Audio Call
app.post('/api/agora-token', verifySupabaseToken, async (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    // Generate a unique channel name for this call
    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use a simple uid (0 means auto-assign)
    const uid = 0;

    // Token valid for 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token with publisher role (can send and receive)
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({
      token,
      channelName,
      appId,
      uid: uid.toString()
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agora: Initiate Call with Database Session
app.post('/api/initiate-call', verifySupabaseToken, async (req, res) => {
  try {
    const { receiverId, matchId } = req.body;

    if (!receiverId || !matchId) {
      return res.status(400).json({ error: 'receiverId and matchId are required' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    // Generate unique channel name
    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uid = 0;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    // Return call session info (caller will insert into Supabase)
    res.json({
      channelName,
      token,
      appId,
      uid: uid.toString()
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept Match API (for Service Worker)
app.post('/api/accept-match', verifySupabaseToken, async (req, res) => {
  try {
    const { myId, targetId } = req.body;

    // Security: ensure the requesting user is acting as themselves
    if (!myId || !targetId) {
      return res.status(400).json({ error: 'Missing myId or targetId' });
    }
    if (req.userId !== myId) {
      return res.status(403).json({ error: 'Forbidden: You cannot act as another user' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    // FIX: Use the Service Role Key to bypass RLS for background actions
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing in server env (Check SUPABASE_SERVICE_ROLE_KEY)');
    }

    // Initialize with Service Role Key
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Insert 'like' swipe
    const { error: swipeError } = await supabase.from('swipes').upsert({
      liker_id: myId,
      target_id: targetId,
      action: 'like'
    });

    if (swipeError) throw swipeError;

    // 2. Wait a moment not needed here as triggers handle it, but we can verify match creation if we want.
    // We just return success.

    res.json({ success: true, message: 'Match accepted' });

  } catch (error) {
    console.error('Error accepting match:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post Guest Confession API (Service role key bypasses RLS)
app.post('/api/post-guest-confession', verifySupabaseToken, async (req, res) => {
  try {
    const { college, branch, text, imageUrl, type, pollOptions } = req.body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing in server env (Check SUPABASE_SERVICE_ROLE_KEY)');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const userId = 'a3e96230-6a78-4215-bcd0-882e1af61127'; // Guest proxy profile ID (Ram)

    const { data: post, error } = await supabase
      .from('confessions')
      .insert({
        user_id: userId,
        university: `${college}|${branch}`,
        text: text,
        image_url: imageUrl,
        type: type
      })
      .select().single();

    if (error) throw error;

    if (type === 'poll' && post && pollOptions && Array.isArray(pollOptions)) {
      const optionsToInsert = pollOptions.filter(o => o.trim()).map(optText => ({
        confession_id: post.id,
        text: optText
      }));
      if (optionsToInsert.length > 0) {
        const { error: pollError } = await supabase.from('poll_options').insert(optionsToInsert);
        if (pollError) throw pollError;
      }
    }

    const { data: finalPost, error: fetchError } = await supabase
      .from('confessions')
      .select('*, poll_options(*)')
      .eq('id', post.id)
      .single();

    if (fetchError) throw fetchError;

    res.json({ success: true, post: finalPost });

  } catch (error) {
    console.error('Error posting guest confession:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Backend API is running. Use the Vercel Frontend to interact.');
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
