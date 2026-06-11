import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Guest proxy profile ID (representing a placeholder "Guest" user profile)
 * This static UUID is used to satisfy the database foreign key constraint
 * in confessions.user_id referencing profiles.id for unlogged users.
 */
const GUEST_PROXY_PROFILE_ID = 'a3e96230-6a78-4215-bcd0-882e1af61127';

// Post Guest Confession API (uses Service Role Key to bypass RLS)
router.post('/post-guest-confession', verifySupabaseToken, async (req, res) => {
  try {
    const { college, branch, text, imageUrl, type, pollOptions } = req.body;

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing in server env (Check SUPABASE_SERVICE_ROLE_KEY)');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Attribute the guest confession to the shared proxy guest profile
    const { data: post, error } = await supabase
      .from('confessions')
      .insert({
        user_id: GUEST_PROXY_PROFILE_ID,
        university: `${college}|${branch}`,
        text: text,
        image_url: imageUrl,
        type: type
      })
      .select().single();

    if (error) throw error;

    // Handle nested poll options if creating a poll confession
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

    // Fetch the final merged post including poll options
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

export default router;
