import { supabase } from './supabase';
import { UserProfile } from '../types';

/**
 * Ensures a valid row exists in public.profiles for the given userId.
 * This prevents foreign key constraint violations (e.g. confessions_users_id_fkey,
 * glimpses_user_id_fkey, poll_votes_user_id_fkey, etc.) for new accounts.
 */
export async function ensureProfileExists(
  userId: string,
  userProfile?: Partial<UserProfile> | null
): Promise<string> {
  if (!supabase || !userId) return userId;

  try {
    const { data: authData } = await supabase.auth.getUser();
    const activeUserId = authData?.user?.id || userId;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', activeUserId)
      .maybeSingle();

    if (!existingProfile) {
      const authUser = authData?.user;
      const baselineProfile = {
        id: activeUserId,
        username: userProfile?.username?.trim() || null,
        anonymous_id: userProfile?.anonymousId || `User#${activeUserId.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
        real_name: userProfile?.realName?.trim() || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || 'Campus User',
        gender: userProfile?.gender || 'Male',
        university: userProfile?.university || 'Global',
        university_email: userProfile?.universityEmail?.trim() || authUser?.email || null,
        branch: userProfile?.branch || 'General',
        year: userProfile?.year || '1st Year',
        interests: userProfile?.interests || [],
        looking_for: userProfile?.lookingFor || [],
        bio: userProfile?.bio || '',
        dob: userProfile?.dob || '2000-01-01',
        avatar: userProfile?.avatar || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || '/auth-mascot.webp',
        updated_at: new Date().toISOString()
      };

      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(baselineProfile, { onConflict: 'id' });

      if (upsertErr) {
        console.error('[ensureProfileExists] Error creating baseline profile:', upsertErr);
      }
    }

    return activeUserId;
  } catch (err) {
    console.error('[ensureProfileExists] Unexpected error:', err);
    return userId;
  }
}

/**
 * Determines whether a profile has truly completed the onboarding process,
 * as opposed to just having the initial automated database trigger defaults.
 */
export function isProfileComplete(profile: any): boolean {
  if (!profile) return false;
  const realName = (profile.real_name || profile.realName || '').trim();
  const dob = (profile.dob || '').trim();
  const university = (profile.university || '').trim();
  const branch = (profile.branch || '').trim();

  // Basic required fields
  if (!realName || !dob || !university || !branch) return false;

  // Placeholder values from trigger / baseline bootstrap
  if (realName === 'Campus Student' || realName === 'Campus User') return false;
  if (university === 'Global') return false;
  if (branch === 'General') return false;
  if (dob === '2000-01-01' || dob === '2002-01-01') return false;

  return true;
}
