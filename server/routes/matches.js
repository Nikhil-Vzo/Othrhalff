import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseToken } from '../middleware/auth.js';

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// SCALING FIX: module-level singleton instead of per-request createClient()
// (per-request construction + service-key parsing burned ~0.5-2ms CPU/request).
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing in server env (Check SUPABASE_SERVICE_ROLE_KEY)');
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseAdmin;
}

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

    // SECURITY FIX: validate ids as UUIDs — previously arbitrary strings were
    // upserted into swipes, polluting matching data (spam/harassment vector).
    if (!UUID_RE.test(myId) || !UUID_RE.test(targetId)) {
      return res.status(400).json({ error: 'Invalid user id format' });
    }

    // SECURITY FIX: a user can only "accept" a match that actually exists in
    // the matches table with them as a participant. Previously this endpoint
    // fabricated 'like' swipes against ANY target with zero consent flow.
    const supabase = getSupabaseAdmin();

    // 0. SECURITY FIX: the caller may only "accept" when a real mutual basis
    // exists — either (a) a match row already exists (trigger-created after
    // both liked), or (b) the TARGET genuinely liked the caller already
    // (reciprocal swipe), which is the "someone liked you → accept" flow from
    // the service-worker notification button. Previously this endpoint
    // fabricated 'like' swipes against ANY target with zero consent flow.
    const { data: existingMatch, error: matchErr } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user_a.eq.${myId},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${myId})`)
      .limit(1)
      .maybeSingle();

    if (matchErr) {
      console.error('Error verifying match:', matchErr);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!existingMatch) {
      const { data: reciprocal, error: recErr } = await supabase
        .from('swipes')
        .select('id')
        .eq('liker_id', targetId)
        .eq('target_id', myId)
        .eq('action', 'like')
        .limit(1)
        .maybeSingle();

      if (recErr) {
        console.error('Error verifying reciprocal swipe:', recErr);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!reciprocal) {
        return res.status(403).json({ error: 'No match exists between these users' });
      }
    }

    // 1. Insert 'like' swipe
    const { error: swipeError } = await supabase.from('swipes').upsert({
      liker_id: myId,
      target_id: targetId,
      action: 'like'
    }, { onConflict: 'liker_id,target_id' });

    if (swipeError) throw swipeError;

    res.json({ success: true, message: 'Match accepted' });

  } catch (error) {
    console.error('Error accepting match:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
