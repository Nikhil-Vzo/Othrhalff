import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '../types';
import { authService } from '../services/auth';
import { supabase } from '../lib/supabase';
import ForceLogoutCountdown from '../components/ForceLogoutCountdown';
import { db } from '../lib/db';
import { subscribeToPushNotifications } from '../services/pushNotifications';

interface AuthContextType {
  currentUser: UserProfile | null;
  login: (user: UserProfile) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_SELECT_FIELDS = `
  id, username, anonymous_id, real_name, gender,
  university, university_email, branch, year, batch,
  interests, looking_for, bio, dob, is_verified,
  avatar, is_premium
`;

const mapProfileToAppUser = (profile: any, sessionUser?: any): UserProfile => ({
  id: profile?.id || sessionUser?.id || '',
  username: profile?.username || undefined,
  anonymousId: profile?.anonymous_id || '',
  realName: profile?.real_name || sessionUser?.user_metadata?.full_name || sessionUser?.user_metadata?.name || '',
  gender: profile?.gender || 'Male',
  university: profile?.university || '',
  universityEmail: profile?.university_email || sessionUser?.email || '',
  branch: profile?.branch || '',
  year: profile?.year || '1st Year',
  batch: profile?.batch,
  interests: profile?.interests || [],
  lookingFor: profile?.looking_for || [],
  bio: profile?.bio || '',
  dob: profile?.dob || '',
  isVerified: !!profile?.is_verified,
  avatar: profile?.avatar || sessionUser?.user_metadata?.avatar_url || sessionUser?.user_metadata?.picture || '',
  isPremium: !!profile?.is_premium
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      return authService.getCurrentUser();
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const isOAuthCallback =
        window.location.hash.includes('access_token=') ||
        window.location.hash.includes('error=') ||
        window.location.search.includes('code=');
      if (isOAuthCallback) return true;
      return !authService.getCurrentUser();
    }
    return true;
  });
  const [showLogoutCountdown, setShowLogoutCountdown] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const initRef = useRef(false);

  // Load from DB on mount (Optimized: Cache-First) & Listen for Auth State Changes
  useEffect(() => {
    if (!supabase) return;

    // Listen for real-time Auth State changes (OAuth redirects, token refresh, login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Auth event: ${event}`);

      const isOAuthRedirect = typeof window !== 'undefined' && 
        (window.location.hash.includes('access_token=') || window.location.search.includes('code='));

      // Only show loading for first-time / blocking auth transitions (INITIAL_SESSION or SIGNED_IN without a cached user, or active OAuth redirect)
      // NEVER set isLoading = true during background TOKEN_REFRESHED, USER_UPDATED, or if user is already loaded!
      const shouldShowLoading = (!authService.getCurrentUser() && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) || isOAuthRedirect;

      try {
        if (session?.user) {
          if (shouldShowLoading) {
            setIsLoading(true);
          }

          if (session.access_token) {
            subscribeToPushNotifications(session.access_token).catch(() => {});
          }

          if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }

          const { data: profile, error } = await supabase
            .from('profiles')
            .select(PROFILE_SELECT_FIELDS)
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile && !error) {
            const appUser = mapProfileToAppUser(profile, session.user);
            setCurrentUser(appUser);
            localStorage.setItem('otherhalf_session', JSON.stringify(appUser));
            
            const needsOnboard = !profile.username || !profile.real_name || !profile.dob;
            setNeedsOnboarding(needsOnboard);
          } else {
            // Profile does not exist yet in DB for new user -> create temporary session & flag for onboarding
            const newAppUser = mapProfileToAppUser({}, session.user);
            setCurrentUser(newAppUser);
            localStorage.setItem('otherhalf_session', JSON.stringify(newAppUser));
            setNeedsOnboarding(true);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem('otherhalf_session');
          setNeedsOnboarding(false);
        }
      } catch (err) {
        console.error('[AuthContext] Error loading user profile on auth change:', err);
      } finally {
        if (shouldShowLoading) {
          setIsLoading(false);
        }
      }
    });

    if (!initRef.current) {
      initRef.current = true;

      const initializeAuth = async () => {
        const localUser = authService.getCurrentUser();
        const isOAuthCallback = typeof window !== 'undefined' && 
          (window.location.hash.includes('access_token=') || 
           window.location.hash.includes('error=') || 
           window.location.search.includes('code='));

        try {
          let isAborted = false;
          const { data: { session } } = await supabase.auth.getSession().catch(err => {
            if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
              isAborted = true;
            } else {
              throw err;
            }
            return { data: { session: null } };
          });

          let activeSession = session;
          if (!activeSession && localUser && !isAborted && !isOAuthCallback) {
            const { data: refreshData } = await supabase.auth.refreshSession().catch(err => {
              if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
                isAborted = true;
              } else {
                throw err;
              }
              return { data: { session: null } };
            });
            activeSession = refreshData?.session ?? null;
          }

          if (isAborted) return;

          if (activeSession?.user) {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select(PROFILE_SELECT_FIELDS)
              .eq('id', activeSession.user.id)
              .maybeSingle();

            if (profile && !error) {
              const appUser = mapProfileToAppUser(profile, activeSession.user);
              setCurrentUser(appUser);
              localStorage.setItem('otherhalf_session', JSON.stringify(appUser));
              const needsOnboard = !profile.username || !profile.real_name || !profile.dob;
              setNeedsOnboarding(needsOnboard);
            } else if (!localUser) {
              const newAppUser = mapProfileToAppUser({}, activeSession.user);
              setCurrentUser(newAppUser);
              localStorage.setItem('otherhalf_session', JSON.stringify(newAppUser));
              setNeedsOnboarding(true);
            }
          } else if (localUser && !isOAuthCallback) {
            console.warn('Session expired and refresh failed, showing logout countdown...');
            setShowLogoutCountdown(true);
          }
        } catch (err) {
          console.error('Background auth check failed:', err);
        } finally {
          setIsLoading(false);
        }
      };

      initializeAuth();
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync Supabase access token to the service worker's IndexedDB
  // so background push notification handlers can authenticate API calls
  const syncTokenToSW = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && reg.active) {
        reg.active.postMessage({ type: 'SET_AUTH_TOKEN', token: session.access_token });
      }
    } catch (e) {
      console.warn('[Auth] Failed to sync token to SW:', e);
    }
  }, []);

  const clearSWToken = useCallback(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(reg => {
      if (reg.active) reg.active.postMessage({ type: 'CLEAR_AUTH_TOKEN' });
    }).catch(() => {});
  }, []);

  const clearAllCaches = useCallback(() => {
    if (typeof window !== 'undefined') {
      // 1. Clear session storage completely (safe for transient caches)
      sessionStorage.clear();

      // 2. Clear specific user/session-scoped keys from localStorage
      const prefixesToRemove = ['otherhalf_', 'othrhalff_', 'deleted_messages_', 'cleared_chat_'];
      const specificKeysToRemove = ['viewed_glimpse_ids'];

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key) {
          const shouldRemove = prefixesToRemove.some(prefix => key.startsWith(prefix)) ||
                              specificKeysToRemove.includes(key);
          if (shouldRemove) {
            localStorage.removeItem(key);
          }
        }
      }

      // 3. Clear IndexedDB tables
      try {
        db.messages.clear();
        db.profiles.clear();
      } catch (e) {
        console.error('Failed to clear IndexedDB:', e);
      }
    }
  }, []);

  const login = useCallback(async (user: UserProfile) => {
    clearAllCaches();
    setCurrentUser(user);
    setNeedsOnboarding(false);
    // Non-blocking sync
    authService.login(user).catch(err => console.error("Background sync error:", err));
    // Sync token to SW for background push notification handling
    syncTokenToSW();
  }, [clearAllCaches, syncTokenToSW]);

  const handleCountdownComplete = useCallback(() => {
    setShowLogoutCountdown(false);
    setCurrentUser(null);
    clearAllCaches();
    clearSWToken();
    authService.logout();
    router.push('/login');
  }, [clearAllCaches, clearSWToken, router]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    clearAllCaches();
    clearSWToken();
    authService.logout();
  }, [clearAllCaches, clearSWToken]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, ...updates };
      // Non-blocking update
      authService.login(updatedUser).catch(err => console.error("Profile update sync error:", err));
      return updatedUser;
    });
  }, []);

  const authContextValue = useMemo(() => ({
    currentUser,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!currentUser,
    isLoading,
    needsOnboarding
  }), [currentUser, login, logout, updateProfile, isLoading, needsOnboarding]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      {showLogoutCountdown && (
        <ForceLogoutCountdown onComplete={handleCountdownComplete} />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};