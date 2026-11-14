import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
}) : null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId || !UUID_RE.test(userId)) {
      return NextResponse.json({ success: false, error: 'Valid userId required' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Fetch matches where user is participant
    const { data: matchRows, error: matchError } = await supabase
      .from('matches')
      .select('id, user_a, user_b, created_at')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (matchError) {
      console.error('API /api/matches fetch error:', matchError);
      return NextResponse.json({ success: false, error: matchError.message }, { status: 500 });
    }

    if (!matchRows || matchRows.length === 0) {
      return NextResponse.json({ success: true, matches: [] });
    }

    // 2. Fetch profiles of matched partners
    const partnerIds = Array.from(new Set(matchRows.map(m => m.user_a === userId ? m.user_b : m.user_a)));
    const matchIds = matchRows.map(m => m.id);

    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, anonymous_id, real_name, avatar, university, branch, year, bio, gender, interests, is_verified, is_premium, dob')
      .in('id', partnerIds);

    if (profError) {
      console.warn('API /api/matches profile fetch warning:', profError);
    }

    const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

    // 3. Fetch latest messages for these matches
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, match_id, sender_id, text, created_at, is_read')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false });

    if (msgError) {
      console.warn('API /api/matches messages fetch warning:', msgError);
    }

    // Build latest message and unread count per match
    const lastMsgMap = new Map<string, { text: string; time: number }>();
    const unreadMap = new Map<string, number>();

    (messages || []).forEach(msg => {
      if (!lastMsgMap.has(msg.match_id)) {
        lastMsgMap.set(msg.match_id, {
          text: msg.text || '',
          time: msg.created_at ? new Date(msg.created_at).getTime() : Date.now()
        });
      }
      if (msg.sender_id !== userId && !msg.is_read) {
        unreadMap.set(msg.match_id, (unreadMap.get(msg.match_id) || 0) + 1);
      }
    });

    // 4. Construct ChatPreview response
    const formatted = matchRows.map(m => {
      const partnerId = m.user_a === userId ? m.user_b : m.user_a;
      const p = (profilesMap.get(partnerId) || {}) as any;
      const last = lastMsgMap.get(m.id);

      return {
        id: m.id,
        partner: {
          id: partnerId,
          anonymousId: p.anonymous_id || 'Unknown',
          realName: p.real_name || 'User',
          avatar: p.avatar,
          university: p.university,
          branch: p.branch,
          year: p.year,
          isVerified: !!p.is_verified,
          gender: p.gender || '',
          bio: p.bio || '',
          dob: p.dob || '',
          interests: p.interests || [],
          matchPercentage: 0,
          distance: 'Connected'
        },
        lastMessage: last?.text || null,
        lastMessageTime: last?.time || (m.created_at ? new Date(m.created_at).getTime() : null),
        unreadCount: unreadMap.get(m.id) || 0
      };
    });

    // Deduplicate partners (one conversation preview per partner)
    const uniqueChats: typeof formatted = [];
    const seenPartners = new Set<string>();
    for (const chat of formatted) {
      if (!seenPartners.has(chat.partner.id)) {
        seenPartners.add(chat.partner.id);
        uniqueChats.push(chat);
      }
    }

    uniqueChats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

    return NextResponse.json({ success: true, matches: uniqueChats });
  } catch (err: any) {
    console.error('API /api/matches fatal error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
