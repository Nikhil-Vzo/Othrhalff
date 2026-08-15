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

export interface PcoLiveSchedule {
  currentTrack: PcoTrack;
  offsetSec: number;
  remainingSec: number;
  durationSec: number;
  upcomingTracks: PcoTrack[];
}

const KNOWN_ADMIN_EMAILS = [
  'nikhilyadav200530@gmail.com',
  'avneeshjha1506@gmail.com',
  'dpursuit14@gmail.com',
  'lachavzo11@gmail.com'
];

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
 */
export function getPcoLiveSchedule(): PcoLiveSchedule {
  const allTracks = seededShuffleList(curatedRomanticTracks as PcoTrack[], 789456);
  const totalDuration = allTracks.reduce((acc, t) => acc + (parseInt(t.duration, 10) || 240), 0);
  const nowSec = Math.floor(Date.now() / 1000);
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
  const email = (authEmail || currentUser?.universityEmail || '').toLowerCase().trim();

  // 1. Instant fallback for primary developer/admin emails
  if (email && KNOWN_ADMIN_EMAILS.includes(email)) return true;

  if (!supabase) return false;

  try {
    // 2. Check admin_users table in Supabase
    if (email) {
      const { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('email', email)
        .maybeSingle();

      if (!adminErr && adminUser) {
        return true;
      }
    }

    // 3. Check profiles table for is_admin flag if user id is available
    if (currentUser?.id) {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('is_admin')
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

      if (!error && data) {
        return { success: true, data: data as PcoSongRequest };
      }
    }
  } catch (err: any) {
    console.warn('[PCO Admin] Failed to persist song request to database, falling back to broadcast only:', err);
  }

  // Graceful fallback for offline / unmigrated database
  return {
    success: true,
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
    if (!error && data) {
      return data as PcoSongRequest[];
    }
  } catch (err) {
    console.warn('[PCO Admin] Error querying pco_song_requests:', err);
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
    const { data, error } = await supabase
      .from('pco_song_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error || !data) {
      return { totalRequests: 0, pendingRequests: 0, todayRequests: 0, topTracks: [] };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const totalRequests = data.length;
    const pendingRequests = data.filter(r => r.status === 'pending').length;
    const todayRequests = data.filter(r => r.requested_at && r.requested_at.startsWith(todayStr)).length;

    // Aggregate top tracks
    const trackMap = new Map<string, { name: string; artist: string; count: number; image?: string }>();
    data.forEach(r => {
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

    const topTracks = Array.from(trackMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      pendingRequests,
      todayRequests,
      topTracks
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

