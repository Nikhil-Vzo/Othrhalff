import { supabase } from '../lib/supabase';
import { db, LocalProfile } from '../lib/db';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache expiration time

/**
 * Retrieves a single profile, checking the local IndexedDB cache first.
 * If the profile is cached and not stale, returns it immediately.
 * Otherwise, fetches from Supabase and updates the cache.
 */
export async function getCachedProfile(userId: string): Promise<LocalProfile | null> {
  try {
    const cached = await db.profiles.get(userId);
    const now = Date.now();

    if (cached && now - cached.last_fetched < CACHE_TTL) {
      return cached;
    }

    // Cache miss or stale data, query Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('id, real_name, anonymous_id, avatar, is_verified, university')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // If error occurs but we have stale cache, fallback to stale cache
      if (cached) return cached;
      return null;
    }

    const updatedProfile: LocalProfile = {
      id: data.id,
      real_name: data.real_name,
      anonymous_id: data.anonymous_id,
      avatar: data.avatar,
      is_verified: data.is_verified,
      university: data.university,
      last_fetched: now
    };

    // Update local database cache
    await db.profiles.put(updatedProfile);
    return updatedProfile;
  } catch (err) {
    console.error('Failed to get cached profile:', err);
    return null;
  }
}

/**
 * Retrieves multiple profiles in bulk, checking local cache first.
 * Missing or stale profiles are fetched in a single Supabase query,
 * written to the cache, and returned along with the fresh data.
 */
export async function getCachedProfilesBulk(userIds: string[]): Promise<Map<string, LocalProfile>> {
  const result = new Map<string, LocalProfile>();
  if (!userIds || userIds.length === 0) return result;

  try {
    const now = Date.now();
    // 1. Query local database cache for all requested user IDs
    const cachedList = await db.profiles.bulkGet(userIds);
    const staleOrMissingIds: string[] = [];

    cachedList.forEach((profile, index) => {
      const requestedId = userIds[index];
      if (profile && now - profile.last_fetched < CACHE_TTL) {
        result.set(profile.id, profile);
      } else {
        staleOrMissingIds.push(requestedId);
      }
    });

    // 2. Fetch any missing or stale profiles from Supabase in a single batch query
    if (staleOrMissingIds.length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, real_name, anonymous_id, avatar, is_verified, university')
        .in('id', staleOrMissingIds);

      if (data && !error) {
        const profilesToUpsert: LocalProfile[] = data.map(item => ({
          id: item.id,
          real_name: item.real_name,
          anonymous_id: item.anonymous_id,
          avatar: item.avatar,
          is_verified: item.is_verified,
          university: item.university,
          last_fetched: now
        }));

        // Batch put into IndexedDB
        if (profilesToUpsert.length > 0) {
          await db.profiles.bulkPut(profilesToUpsert);
          profilesToUpsert.forEach(p => result.set(p.id, p));
        }
      } else {
        // Fallback: If network query failed, keep using stale cached items
        cachedList.forEach(p => {
          if (p && staleOrMissingIds.includes(p.id)) {
            result.set(p.id, p);
          }
        });
      }
    }
  } catch (err) {
    console.error('Failed to get cached profiles bulk:', err);
  }

  return result;
}
