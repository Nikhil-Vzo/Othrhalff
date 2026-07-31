import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '../types';
import { authService } from '../services/auth';
import { supabase } from '../lib/supabase';
import ForceLogoutCountdown from '../components/ForceLogoutCountdown';
import { db } from '../lib/db';

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

      if (session?.user) {
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile && !error) {
            const appUser: UserProfile = {
              id: profile.id,
              username: profile.username || undefined,
              anonymousId: profile.anonymous_id,
              realName: profile.real_name,
              gender: profile.gender,
              university: profile.university,
              universityEmail: profile.university_email,
              branch: profile.branch,
              year: profile.year,
              interests: profile.interests || [],
              lookingFor: profile.looking_for || [],
              bio: profile.bio,
              dob: profile.dob,
              isVerified: profile.is_verified,
              avatar: profile.avatar,
              isPremium: profile.is_premium
            };

            setCurrentUser(appUser);
            localStorage.setItem('otherhalf_session', JSON.stringify(appUser));
            
            if (!profile.username || !profile.real_name || !profile.dob) {
              setNeedsOnboarding(true);
            } else {
              setNeedsOnboarding(false);
            }
          } else {
            // Profile does not exist yet in DB for new user -> create temporary session & flag for onboarding
            const newAppUser: UserProfile = {
              id: session.user.id,
              universityEmail: session.user.email || '',
              realName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
              avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
              gender: 'Male',
              university: '',
              branch: '',
              year: '1st Year',
              interests: [],
              lookingFor: [],
              dob: ''
            };
            setCurrentUser(newAppUser);
            localStorage.setItem('otherhalf_session', JSON.stringify(newAppUser));
            setNeedsOnboarding(true);
          }
        } catch (err) {
          console.error('[AuthContext] Error loading user profile on auth change:', err);
        } finally {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('otherhalf_session');
        setNeedsOnboarding(false);
        setIsLoading(false);
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

        if (localUser && !isOAuthCallback) {
          setCurrentUser(localUser);
          setIsLoading(false);
        }

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
          if (!activeSession && localUser && !isAborted) {
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
              .select('*')
              .eq('id', activeSession.user.id)
              .maybeSingle();

            if (profile && !error) {
              const appUser: UserProfile = {
                id: profile.id,
                username: profile.username || undefined,
                anonymousId: profile.anonymous_id,
                realName: profile.real_name,
                gender: profile.gender,
                university: profile.university,
                universityEmail: profile.university_email,
                branch: profile.branch,
                year: profile.year,
                interests: profile.interests || [],
                lookingFor: profile.looking_for || [],
                bio: profile.bio,
                dob: profile.dob,
                isVerified: profile.is_verified,
                avatar: profile.avatar,
                isPremium: profile.is_premium
              };

              setCurrentUser(appUser);
              localStorage.setItem('otherhalf_session', JSON.stringify(appUser));
              if (!profile.username || !profile.real_name || !profile.dob) {
                setNeedsOnboarding(true);
              }
            } else {
              const newAppUser: UserProfile = {
                id: activeSession.user.id,
                universityEmail: activeSession.user.email || '',
                realName: activeSession.user.user_metadata?.full_name || activeSession.user.user_metadata?.name || '',
                avatar: activeSession.user.user_metadata?.avatar_url || activeSession.user.user_metadata?.picture || '',
                gender: 'Male',
                university: '',
                branch: '',
                year: '1st Year',
                interests: [],
                lookingFor: [],
                dob: ''
              };
              setCurrentUser(newAppUser);
              localStorage.setItem('otherhalf_session', JSON.stringify(newAppUser));
              setNeedsOnboarding(true);
            }
          } else if (localUser) {
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