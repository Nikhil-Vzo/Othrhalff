import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/auth';
import { supabase } from '../lib/supabase';
import ForceLogoutCountdown from '../components/ForceLogoutCountdown';

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

  // Load from DB on mount (Optimized: Cache-First)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeAuth = async () => {
      // 1. FAST: Load from LocalStorage immediately to unblock UI
      const localUser = authService.getCurrentUser();
      if (localUser) {
        setCurrentUser(localUser);
        setIsLoading(false); // <--- The App loads instantly here
      }

      // 2. SLOW (Background): Verify with Supabase for updates/security
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(err => {
            if (err.name === 'AbortError' || err.message.includes('AbortError')) {
                console.log('Ignored AbortError during getSession');
            } else {
                throw err;
            }
            return { data: { session: null } };
          });

          // If no session, try refreshing (mobile browsers often lose the access token
          // while backgrounded, but the refresh token is still valid)
          let activeSession = session;
          if (!activeSession && localUser) {
            console.log('No session found, attempting token refresh...');
            const { data: refreshData } = await supabase.auth.refreshSession().catch(err => {
                if (err.name === 'AbortError' || err.message.includes('AbortError')) {
                    console.log('Ignored AbortError during refreshSession');
                } else {
                    throw err;
                }
                return { data: { session: null } };
            });
            activeSession = refreshData?.session ?? null;
          }

          if (activeSession?.user) {
            // Fetch fresh profile
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', activeSession.user.id)
              .single();

            if (profile && !error) {
              if (!profile.real_name || !profile.university) {
                setNeedsOnboarding(true);
              }

              const appUser: UserProfile = {
                id: profile.id,
                username: profile.username,
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

              // Only update state if data actually changed (prevents re-renders)
              if (JSON.stringify(appUser) !== JSON.stringify(localUser)) {
                console.log('Profile updated from server');
                setCurrentUser(appUser);
                localStorage.setItem('otherhalf_session', JSON.stringify(appUser));
              }
            } else {
              // Profile does not exist - new user needs onboarding
              setNeedsOnboarding(true);
            }
          } else if (localUser) {
            // Both getSession AND refreshSession failed — session is truly dead.
            // Show a countdown so users know why they're being logged out.
            console.warn('Session expired and refresh failed, showing logout countdown...');
            setShowLogoutCountdown(true);
          }
        } catch (err) {
          console.error('Background auth check failed:', err);
        }
      }

      // If we didn't have a local user, we had to wait for Supabase. Now we stop loading.
      if (!localUser) setIsLoading(false);
    };

    initializeAuth();
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

  const login = async (user: UserProfile) => {
    setCurrentUser(user);
    setNeedsOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('otherhalf_confessions_campus_v4');
      localStorage.removeItem('otherhalf_confessions_global_v4');
      localStorage.removeItem('otherhalf_confessions_expiry_campus_v4');
      localStorage.removeItem('otherhalf_confessions_expiry_global_v4');
    }
    // Non-blocking sync
    authService.login(user).catch(err => console.error("Background sync error:", err));
    // Sync token to SW for background push notification handling
    syncTokenToSW();
  };

  const clearAllCaches = useCallback(() => {
    // Session storage caches
    sessionStorage.removeItem('otherhalf_discover_cache_v3');
    sessionStorage.removeItem('otherhalf_discover_cache_expiry_v3');
    // Matches cache (localStorage, persists across tabs)
    localStorage.removeItem('otherhalf_matches_cache_v6');
    localStorage.removeItem('otherhalf_matches_expiry_v6');
    // Confessions caches
    localStorage.removeItem('otherhalf_confessions_campus_v4');
    localStorage.removeItem('otherhalf_confessions_global_v4');
    localStorage.removeItem('otherhalf_confessions_expiry_campus_v4');
    localStorage.removeItem('otherhalf_confessions_expiry_global_v4');
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setShowLogoutCountdown(false);
    setCurrentUser(null);
    clearAllCaches();
    clearSWToken();
    authService.logout();
  }, [clearAllCaches, clearSWToken]);

  const logout = () => {
    setCurrentUser(null);
    clearAllCaches();
    clearSWToken();
    authService.logout();
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    // Non-blocking update
    authService.login(updatedUser).catch(err => console.error("Profile update sync error:", err));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      updateProfile,
      isAuthenticated: !!currentUser,
      isLoading,
      needsOnboarding
    }}>
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