import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseToken } from '../middleware/auth.js';

const router = express.Router();

// Accept Match API (uses Service Role Key to bypass RLS)
router.post('/accept-match', verifySupabaseToken, async (req, res) => {
  try {
    const { myId, targetId } = req.body;

    // Security: ensure the requesting user is acting as themselves
    if (!myId || !targetId) {
      return res.status(400).json({ error: 'Missing myId or targetId' });
    }
    if (req.userId !== myId) {
      return res.status(403).json({ error: 'Forbidden: You cannot act as another user' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing in server env (Check SUPABASE_SERVICE_ROLE_KEY)');
    }

    // Initialize with Service Role Key to execute background action bypassing RLS
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Insert 'like' swipe
    const { error: swipeError } = await supabase.from('swipes').upsert({
      liker_id: myId,
      target_id: targetId,
      action: 'like'
    });

    if (swipeError) throw swipeError;

    res.json({ success: true, message: 'Match accepted' });

  } catch (error) {
    console.error('Error accepting match:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
