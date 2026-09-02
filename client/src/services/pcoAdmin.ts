import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { curatedRomanticTracks } from '../data/pcoRomanticTracks';

export interface PcoSongRequest {
  id: string;
  requester_id?: string | null;
  requester_name: string;
  track_id: string;
  track_name: string;
  track_artist?: string;
  track_image?: string;
  track_url?: string;
  track_duration?: string;
  status: 'pending' | 'approved' | 'declined' | 'played';
  requested_at: string;
  played_at?: string | null;
  approved_by?: string | null;
}

export interface PcoTrack {
  id: string;
  song: string;
  singers: string;
  image: string;
  media_url: string;
  media_preview_url?: string;
  duration: string;
  is_drm?: boolean;
}

export type PcoRadioMode = 'auto' | 'manual';

export interface PcoRadioState {
  room_id: string;
  mode: PcoRadioMode;
  current_track: PcoTrack | null;
  started_at_ms: number;
  paused: boolean;
  queue: PcoTrack[];
  version: number;
  updated_at: string;
}

export interface PcoLiveSchedule {
  currentTrack: PcoTrack;
  offsetSec: number;
  remainingSec: number;
  durationSec: number;
  upcomingTracks: PcoTrack[];
}

const KNOWN_ADMIN_EMAILS = [
  'nikhilyadav200530@gmail.com',
  'avneeshkumarjha1506@gmail.com',
  'avneeshjha1506@gmail.com',
  'dpursuit14@gmail.com',
  'lachavzo11@gmail.com'
];

// NOTE (security): this allowlist is ONLY ever compared against the verified
// Supabase auth email — never against user-editable profile fields like
// profiles.university_email. Prefer the is_pco_admin RPC / admin_users RLS
// checks below; the allowlist exists purely as a lockout safety net.

// Seeded PRNG identical to MusicDate.tsx
function seededShuffleList<T>(array: T[], seed: number = 789456): T[] {
  const arr = [...array];
  let m = arr.length;
  let t: T;
  let i: number;
  let s = seed;

  const random = () => {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  while (m) {
    i = Math.floor(random() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

/**
 * Calculates current playing track and next 20 scheduled songs deterministically.
 * Uses a daily date-based seed (e.g. UTC YYYY-MM-DD hash) so every single day
 * has a fresh, completely reshuffled song queue, while remaining 100% synchronized
 * down to the exact second across all listeners worldwide.
 */
export function getPcoLiveSchedule(customTimestampSec?: number): PcoLiveSchedule {
  const nowMs = customTimestampSec !== undefined ? customTimestampSec * 1000 : Date.now();
  const d = new Date(nowMs);
  const dateKey = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  const dailySeed = ((dateKey * 2654435761) ^ 789456) >>> 0;

  const allTracks = seededShuffleList(curatedRomanticTracks as PcoTrack[], dailySeed);
  const totalDuration = allTracks.reduce((acc, t) => acc + (parseInt(t.duration, 10) || 240), 0);
  const nowSec = customTimestampSec !== undefined ? customTimestampSec : Math.floor(nowMs / 1000);
  let cycleTime = nowSec % (totalDuration || 1);

  let currentIndex = 0;
  let currentOffset = 0;
  let dur = 240;

  for (let i = 0; i < allTracks.length; i++) {
    dur = parseInt(allTracks[i].duration, 10) || 240;
    if (cycleTime < dur) {
      currentIndex = i;
      currentOffset = cycleTime;
      break;
    }
    cycleTime -= dur;
  }

  const currentTrack = allTracks[currentIndex] || allTracks[0];
  const remainingSec = Math.max(0, dur - currentOffset);

  // Next 20 upcoming tracks in scheduled order
  const upcomingTracks: PcoTrack[] = [];
  for (let j = 1; j <= 20; j++) {
    const nextIdx = (currentIndex + j) % allTracks.length;
    upcomingTracks.push(allTracks[nextIdx]);
  }

  return {
    currentTrack,
    offsetSec: currentOffset,
    remainingSec,
    durationSec: dur,
    upcomingTracks
  };
}

/**
 * Broadcasts a live action to all Campus PCO radio listeners.
 */
export function broadcastPcoAction(
  event: 'PCO_PLAY_IMMEDIATELY' | 'PCO_PLAY_NEXT' | 'PCO_ADD_QUEUE' | 'PCO_ADMIN_SKIP' | 'LIVE_CHAT_MSG',
  payload: any
) {
  if (!supabase) return;
  try {
    supabase.channel('campus_pco_live_chat').send({
      type: 'broadcast',
      event,
      payload
    });
  } catch (err) {
    console.warn('[PCO Admin] Broadcast error:', err);
  }
}

/**
 * Checks if the current user is an authorized Campus PCO admin.
 * Checks Supabase `admin_users` table first, then `profiles.is_admin`,
 * and falls back safely to known emails/handles so admins are never locked out.
 */
export async function checkIsPcoAdmin(
  currentUser: UserProfile | null,
  authEmail?: string | null
): Promise<boolean> {
  // SECURITY: only the VERIFIED Supabase auth email may match the allowlist.
  // Never trust user-editable profile fields (e.g. universityEmail) for authz.
  const verifiedEmail = (authEmail || '').toLowerCase().trim();

  if (supabase && !authEmail) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        return checkIsPcoAdmin(currentUser, data.user.email);
      }
    } catch (_) {}
  }

  // 1. Instant fallback for primary developer/admin emails
  if (verifiedEmail && KNOWN_ADMIN_EMAILS.includes(verifiedEmail)) return true;

  if (!supabase) return false;

  try {
    // 2. Check admin_users table in Supabase (verified email only)
    if (verifiedEmail) {
      const { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('email', verifiedEmail)
        .maybeSingle();

      if (!adminErr && adminUser) {
        return true;
      }
    }

    // 3. Server-side RPC is the authoritative check when available.
    if (currentUser?.id) {
      try {
        const { data: rpcResult, error: rpcErr } = await supabase.rpc('is_pco_admin');
        if (!rpcErr && rpcResult === true) {
          return true;
        }
      } catch (_) {
        // RPC not deployed yet — fall through to profiles check below.
      }

      // 4. Check server-protected is_admin flag on profiles (RLS should gate writes)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('is_admin, university_email')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!profileErr && profile?.is_admin === true) {
        return true;
      }
    }
  } catch (err) {
    console.warn('[PCO Admin] Error verifying admin permissions from database:', err);
  }

  return false;
}

/**
 * Submits a song request to the database and broadcasts over Supabase realtime channel.
 */
export async function submitPcoSongRequest(
  track: PcoTrack,
  currentUser: UserProfile | null,
  displayName: string
): Promise<{ success: boolean; data?: PcoSongRequest; error?: string }> {
  const payload = {
    requester_id: currentUser?.id || null,
    requester_name: displayName || 'Anonymous Listener',
    track_id: track.id,
    track_name: track.song,
    track_artist: track.singers,
    track_image: track.image,
    track_url: track.media_url,
    track_duration: track.duration,
    status: 'pending' as const,
    requested_at: new Date().toISOString()
  };

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('pco_song_requests')
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        // Broadcast to live DJ console in real-time
        try {
          supabase.channel('pco_quick_panel_requests').send({
            type: 'broadcast',
            event: 'PCO_SONG_REQUEST',
            payload: data
          });
          supabase.channel('campus_pco_live_chat').send({
            type: 'broadcast',
            event: 'PCO_SONG_REQUEST',
            payload: data
          });
        } catch (bErr) {
          console.debug('[PCO Admin] Broadcast notice:', bErr);
        }
        return { success: true, data: data as PcoSongRequest };
      }
    }
  } catch (err: any) {
    console.warn('[PCO Admin] Failed to persist song request to database:', err);
    return { success: false, error: err.message || 'Failed to submit song request.' };
  }

  // Fallback only if supabase is not initialized — be honest with the caller
  // that this request was NOT persisted to the DJ console.
  return {
    success: false,
    error: 'Could not reach the request service. Please try again.',
    data: {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...payload
    }
  };
}

/**
 * Fetches recent song requests from the database.
 */
export async function fetchPcoRequests(
  statusFilter?: 'pending' | 'approved' | 'declined' | 'played' | 'all',
  limit: number = 50
): Promise<PcoSongRequest[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('pco_song_requests')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === '42P01' || error.message?.includes('404') || error.code === 'PGRST204' || error.code === 'PGRST205') {
        console.debug('[PCO Admin] pco_song_requests table not yet created in Supabase. Run scripts/pco_admin_schema.sql to enable.');
      } else {
        console.warn('[PCO Admin] Query error on pco_song_requests:', error.message);
      }
      return [];
    }

    if (data) {
      return data as PcoSongRequest[];
    }
  } catch (err) {
    console.debug('[PCO Admin] Error querying pco_song_requests:', err);
  }

  return [];
}

/**
 * Updates status of a song request (approve, decline, played, etc.).
 */
export async function updatePcoSongRequestStatus(
  requestId: string,
  status: 'pending' | 'approved' | 'declined' | 'played',
  adminUserId?: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const updatePayload: any = {
      status,
      approved_by: adminUserId || null
    };

    if (status === 'played' || status === 'approved') {
      updatePayload.played_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('pco_song_requests')
      .update(updatePayload)
      .eq('id', requestId);

    return !error;
  } catch (err) {
    console.warn('[PCO Admin] Error updating song request status:', err);
    return false;
  }
}

/**
 * Gets analytics statistics for Campus PCO Radio.
 */
export async function getPcoAnalytics(): Promise<{
  totalRequests: number;
  pendingRequests: number;
  todayRequests: number;
  topTracks: { name: string; artist: string; count: number; image?: string }[];
}> {
  if (!supabase) {
    return { totalRequests: 0, pendingRequests: 0, todayRequests: 0, topTracks: [] };
  }

  try {
    // SCALING FIX (IST): toISOString() is UTC — for Indian users the "day"
    // boundary was off by 5.5 hours. Compute the IST calendar day explicitly.
    const istNow = new Date(Date.now() + 5.5 * 3600 * 1000);
    const todayStr = istNow.toISOString().split('T')[0];

    // Count queries run entirely in Postgres (no full-table client scan)
    const [totalRes, pendingRes, todayRes] = await Promise.all([
      supabase.from('pco_song_requests').select('id', { count: 'exact', head: true }),
      supabase.from('pco_song_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('pco_song_requests').select('id', { count: 'exact', head: true })
        .gte('requested_at', `${todayStr}T00:00:00+05:30`)
    ]);

    // Top tracks: only fetch a bounded recent window instead of every row
    const { data } = await supabase
      .from('pco_song_requests')
      .select('track_name, track_artist, track_image')
      .order('requested_at', { ascending: false })
      .limit(500);

    const trackMap = new Map<string, { name: string; artist: string; count: number; image?: string }>();
    (data || []).forEach((r: any) => {
      if (!r.track_name) return;
      const key = `${r.track_name}_${r.track_artist || ''}`;
      const existing = trackMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        trackMap.set(key, {
          name: r.track_name,
          artist: r.track_artist || 'Unknown',
          count: 1,
          image: r.track_image
        });
      }
    });

    return {
      totalRequests: totalRes.count || 0,
      pendingRequests: pendingRes.count || 0,
      todayRequests: todayRes.count || 0,
      topTracks: Array.from(trackMap.values()).sort((a, b) => b.count - a.count).slice(0, 10)
    };
  } catch (err) {
    console.warn('[PCO Admin] Failed to fetch analytics:', err);
    return { totalRequests: 0, pendingRequests: 0, todayRequests: 0, topTracks: [] };
  }
}

export interface AdminUserRecord {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

/**
 * Fetches all registered admin users from Supabase admin_users table.
 */
export async function fetchAdminUsers(): Promise<AdminUserRecord[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as AdminUserRecord[];
    }
  } catch (err) {
    console.warn('[PCO Admin] Error querying admin_users:', err);
  }

  // Fallback with default hardcoded admins if table is unpopulated
  return KNOWN_ADMIN_EMAILS.map((email, i) => ({
    id: `hardcoded-${i}`,
    email,
    role: 'super_admin',
    created_at: new Date().toISOString()
  }));
}

/**
 * Adds a new admin user to the Supabase admin_users table.
 */
export async function addAdminUser(
  email: string,
  role: 'pco_admin' | 'super_admin' = 'pco_admin',
  addedByUserId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const { error } = await supabase
      .from('admin_users')
      .upsert({
        email: cleanEmail,
        role,
        added_by: addedByUserId || null
      }, { onConflict: 'email' });

    if (error) throw error;

    // Also update profiles table if matching user exists
    await supabase
      .from('profiles')
      .update({ is_admin: true })
      .or(`university_email.eq.${cleanEmail},admin_email.eq.${cleanEmail}`);

    return { success: true };
  } catch (err: any) {
    console.error('[PCO Admin] Error inserting new admin user:', err);
    return { success: false, error: err.message || 'Failed to add admin user' };
  }
}

/**
 * Removes an admin user from the admin_users table.
 */
export async function removeAdminUser(email: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  const cleanEmail = email.toLowerCase().trim();

  // Prevent deleting primary super admins
  if (KNOWN_ADMIN_EMAILS.includes(cleanEmail)) {
    return { success: false, error: 'Cannot remove primary platform owner.' };
  }

  try {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('email', cleanEmail);

    if (error) throw error;

    await supabase
      .from('profiles')
      .update({ is_admin: false })
      .or(`university_email.eq.${cleanEmail},admin_email.eq.${cleanEmail}`);

    return { success: true };
  } catch (err: any) {
    console.error('[PCO Admin] Error removing admin user:', err);
    return { success: false, error: err.message || 'Failed to remove admin user' };
  }
}

/**
 * Fetches the authoritative radio state row from Supabase.
 * Returns null if table is not created yet or on fetch error.
 */
export async function fetchPcoRadioState(roomId: string = 'Campus_PCO_247'): Promise<PcoRadioState | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('pco_radio_state')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('404') || error.code === 'PGRST204' || error.code === 'PGRST205') {
        console.debug('[PCO Admin] pco_radio_state table not created yet. Operating in deterministic auto mode.');
      } else {
        console.warn('[PCO Admin] Failed to fetch pco_radio_state:', error.message);
      }
      return null;
    }

    if (data) {
      return {
        room_id: data.room_id || roomId,
        mode: data.mode || 'auto',
        current_track: data.current_track || null,
        started_at_ms: Number(data.started_at_ms || 0),
        paused: Boolean(data.paused),
        queue: Array.isArray(data.queue) ? data.queue : [],
        version: Number(data.version || 1),
        updated_at: data.updated_at || new Date().toISOString()
      };
    }
  } catch (err) {
    console.debug('[PCO Admin] Error fetching radio state:', err);
  }

  return null;
}

/**
 * Updates the authoritative radio state in Supabase and broadcasts change.
 */
export async function updatePcoRadioState(
  patch: Partial<PcoRadioState>,
  roomId: string = 'Campus_PCO_247'
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // ATOMIC: let Postgres bump the version server-side so concurrent admin
    // actions can't clobber each other via a read-increment-write race.
    const { data: rpcData, error: rpcErr } = await supabase.rpc('bump_pco_radio_state', {
      p_room_id: roomId,
      p_mode: patch.mode !== undefined ? patch.mode : null,
      p_current_track: patch.current_track !== undefined ? patch.current_track : null,
      p_started_at_ms: patch.started_at_ms !== undefined ? patch.started_at_ms : null,
      p_paused: patch.paused !== undefined ? patch.paused : null,
      p_queue: patch.queue !== undefined ? patch.queue : null
    });

    if (!rpcErr && rpcData === true) {
      // Broadcast state update immediately for sub-millisecond sync
      try {
        const broadcastPayload = {
          room_id: roomId,
          ...patch,
          mode: patch.mode !== undefined ? patch.mode : 'auto'
        };
        supabase.channel(`pco_radio_state_sync_${roomId}`).send({
          type: 'broadcast',
          event: 'PCO_STATE_UPDATED',
          payload: broadcastPayload
        });
        supabase.channel('campus_pco_live_chat').send({
          type: 'broadcast',
          event: 'PCO_STATE_UPDATED',
          payload: broadcastPayload
        });
      } catch (_) {}
      return true;
    }

    // Fallback path when the RPC isn't deployed yet: last-writer-wins upsert.
    const currentState = await fetchPcoRadioState(roomId);
    const nextVersion = (currentState?.version || 1) + 1;

    const payload = {
      room_id: roomId,
      mode: patch.mode !== undefined ? patch.mode : (currentState?.mode || 'auto'),
      current_track: patch.current_track !== undefined ? patch.current_track : (currentState?.current_track || null),
      started_at_ms: patch.started_at_ms !== undefined ? patch.started_at_ms : (currentState?.started_at_ms || Date.now()),
      paused: patch.paused !== undefined ? patch.paused : (currentState?.paused || false),
      queue: patch.queue !== undefined ? patch.queue : (currentState?.queue || []),
      version: nextVersion,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('pco_radio_state')
      .upsert(payload, { onConflict: 'room_id' });

    if (error) {
      console.warn('[PCO Admin] Failed to update pco_radio_state:', error.message);
      return false;
    }

    // Broadcast state update immediately for sub-millisecond sync
    try {
      supabase.channel(`pco_radio_state_sync_${roomId}`).send({
        type: 'broadcast',
        event: 'PCO_STATE_UPDATED',
        payload
      });
      supabase.channel('campus_pco_live_chat').send({
        type: 'broadcast',
        event: 'PCO_STATE_UPDATED',
        payload
      });
    } catch (_) {}

    return true;
  } catch (err) {
    console.warn('[PCO Admin] Error updating radio state:', err);
    return false;
  }
}

/**
 * Fetches server timestamp in milliseconds via Supabase RPC to prevent client clock skew.
 * Falls back to local Date.now() if RPC is unreachable.
 */
export async function getServerTimeMs(): Promise<number> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('get_server_time_ms');
      if (!error && typeof data === 'number' && data > 0) {
        return data;
      }
    } catch (_) {}
  }
  return Date.now();
}

/**
 * Sets manual override mode with a specific track and authoritative server timestamp.
 * Optionally takes a customStartedAtMs (e.g. on manual seek).
 */
export async function setManualRadioOverride(
  track: PcoTrack,
  queue?: PcoTrack[],
  roomId: string = 'Campus_PCO_247',
  customStartedAtMs?: number
): Promise<boolean> {
  const serverTimeMs = customStartedAtMs !== undefined ? customStartedAtMs : await getServerTimeMs();
  const safeQueue = queue ? queue.slice(0, 50) : undefined;

  return updatePcoRadioState({
    mode: 'manual',
    current_track: track,
    started_at_ms: serverTimeMs,
    paused: false,
    ...(safeQueue !== undefined ? { queue: safeQueue } : {})
  }, roomId);
}

/**
 * Returns station to 24/7 deterministic auto schedule.
 */
export async function returnToAutoRadioSchedule(
  roomId: string = 'Campus_PCO_247'
): Promise<boolean> {
  return updatePcoRadioState({
    mode: 'auto',
    current_track: null,
    started_at_ms: 0,
    paused: false
  }, roomId);
}

/**
 * Updates only the radio queue with a safety cap of 50 songs.
 */
export async function updateRadioQueue(
  queue: PcoTrack[],
  roomId: string = 'Campus_PCO_247'
): Promise<boolean> {
  const safeQueue = queue.slice(0, 50);
  return updatePcoRadioState({
    queue: safeQueue
  }, roomId);
}
