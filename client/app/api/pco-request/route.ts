import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with available environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
}) : null;

const KNOWN_ADMIN_EMAILS = [
  'nikhilyadav200530@gmail.com',
  'avneeshkumarjha1506@gmail.com',
  'avneeshjha1506@gmail.com',
  'dpursuit14@gmail.com',
  'lachavzo11@gmail.com'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { track, currentUser, displayName } = body;

    if (!track || !track.id || !track.song) {
      return NextResponse.json({ success: false, error: 'Invalid track data' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database service unavailable' }, { status: 503 });
    }

    // Validate if currentUser.id is a standard UUID (prevent 22P02 PostgreSQL error)
    const isUuid = (id?: string | null): boolean => {
      if (!id) return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    };

    const requesterId = isUuid(currentUser?.id) ? currentUser.id : null;
    const requesterName = displayName || currentUser?.realName || currentUser?.anonymousId || 'Campus Listener';

    const payload = {
      requester_id: requesterId,
      requester_name: requesterName,
      track_id: String(track.id),
      track_name: String(track.song),
      track_artist: track.singers || 'Unknown Artist',
      track_image: track.image || null,
      track_url: track.media_url || null,
      track_duration: track.duration ? String(track.duration) : '240',
      status: 'pending',
      requested_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('pco_song_requests')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[PCO Request API] DB insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Attempt to notify admins via notifications table
    try {
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id')
        .or(`is_admin.eq.true,university_email.in.(${KNOWN_ADMIN_EMAILS.map(e => `"${e}"`).join(',')})`);

      if (adminProfiles && adminProfiles.length > 0) {
        const notifs = adminProfiles.map((adm: any) => ({
          user_id: adm.id,
          from_user_id: requesterId,
          type: 'song_request',
          title: '🎵 New Song Request!',
          message: `${requesterName} requested "${track.song}" by ${track.singers || 'Unknown'}`,
          action_url: '/sparx/music?room=Campus_PCO_247',
          data: {
            type: 'song_request',
            track_name: track.song,
            track_artist: track.singers,
            track_image: track.image,
            requester: requesterName
          },
          read: false,
          created_at: new Date().toISOString()
        }));
        await supabase.from('notifications').insert(notifs);
      }
    } catch (nErr) {
      console.debug('[PCO Request API] Admin notification insert error (non-fatal):', nErr);
    }

    // Broadcast Realtime events to live DJ console
    try {
      supabase.channel('pco_quick_panel_requests').send({
        type: 'broadcast',
        event: 'PCO_SONG_REQUEST',
        payload: data
      });
      supabase.channel('pco_quick_panel_requests').send({
        type: 'broadcast',
        event: 'PCO_REQUEST_NOTIFICATION',
        payload: {
          requester: requesterName,
          track,
          requestId: data?.id
        }
      });
      supabase.channel('campus_pco_live_chat').send({
        type: 'broadcast',
        event: 'PCO_SONG_REQUEST',
        payload: data
      });
    } catch (_) {}

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error('[PCO Request API] Unexpected error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
