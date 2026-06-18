import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface PresenceContextType {
    onlineUsers: Map<string, boolean>;
    lastSeenMap: Map<string, Date>;
    subscribeToUser: (userId: string) => void;
    subscribeToUsers: (userIds: string[]) => void;
    unsubscribeFromUser: (userId: string) => void;
    isUserOnline: (userId: string) => boolean;
    getLastSeen: (userId: string) => Date | null;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());
    const [lastSeenMap, setLastSeenMap] = useState<Map<string, Date>>(new Map());
    const trackedUsersRef = useRef<Set<string>>(new Set());
    const globalChannelRef = useRef<any>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tokenRef = useRef<string | null>(null);

    const lastWriteTimeRef = useRef<number>(0);
    const lastOnlineStateRef = useRef<boolean | null>(null);

    // Keep active session token updated in a ref for synchronous unload authorization
    useEffect(() => {
        if (!supabase) return;
        
        supabase.auth.getSession().then(({ data: { session } }) => {
            tokenRef.current = session?.access_token || null;
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            tokenRef.current = session?.access_token || null;
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Update user's own presence with throttling to prevent API spam
    const updatePresence = useCallback(async (isOnline: boolean, force = false) => {
        if (!currentUser || !supabase) return;

        const now = Date.now();
        const timeSinceLastWrite = now - lastWriteTimeRef.current;

        // Write immediately if:
        // 1. We are forcing the write (e.g. visibility changes, tab closures, unmounts).
        // 2. The online state actually changes (e.g. going offline or coming back online).
        // 3. Or at least 30 seconds have passed since the last write.
        const shouldWrite = force || 
                           lastOnlineStateRef.current !== isOnline || 
                           timeSinceLastWrite > 30000;

        if (!shouldWrite) return;

        lastWriteTimeRef.current = now;
        lastOnlineStateRef.current = isOnline;

        try {
            const { error } = await supabase
                .from('user_presence')
                .upsert({
                    user_id: currentUser.id,
                    is_online: isOnline,
                    last_seen: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) console.error('Error updating presence:', error);
        } catch (err) {
            console.error('Failed to update presence:', err);
        }
    }, [currentUser]);

    // Heartbeat and Activity Detection - Throttled to save database bandwidth
    useEffect(() => {
        if (!currentUser) return;

        // Set online immediately (forced)
        updatePresence(true, true);

        // Start heartbeat - 30 seconds is industry standard (up from 10)
        heartbeatIntervalRef.current = setInterval(() => {
            updatePresence(true);
        }, 30000);

        // Activity detection - reset heartbeat on user activity
        const resetActivity = () => {
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            
            // Mark online (throttled - does not hit database if already online within 30s)
            updatePresence(true);

            // Set idle/offline timeout (e.g., mark offline after 3 minutes of inactivity)
            activityTimeoutRef.current = setTimeout(() => {
                updatePresence(false, true); // Forced offline write
            }, 180000);
        };

        window.addEventListener('mousemove', resetActivity);
        window.addEventListener('keydown', resetActivity);
        window.addEventListener('focus', resetActivity);

        // Page Visibility API - detect tab changes (minimize/maximize)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User switched tab/minimized - mark offline immediately (forced)
                updatePresence(false, true);
            } else {
                // User returned - mark online immediately (forced)
                updatePresence(true, true);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Use fetch with keepalive for reliable authenticated cleanup on page close
        const handleBeforeUnload = () => {
            if (!currentUser || !supabase) return;

            // Try regular update first (forced)
            updatePresence(false, true);

            // Keepalive fetch as backup - browser queues this during page unload
            try {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
                const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

                if (!supabaseUrl || !supabaseKey) return;

                const url = `${supabaseUrl}/rest/v1/user_presence?user_id=eq.${currentUser.id}`;
                const data = JSON.stringify({
                    user_id: currentUser.id,
                    is_online: false,
                    last_seen: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

                const storageKey = 'sb-htepqqigtzmllailykas-auth-token';
                const token = tokenRef.current || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(storageKey) || '{}')?.access_token : null);

                const headers: Record<string, string> = {
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                fetch(url, {
                    method: 'POST',
                    headers,
                    body: data,
                    keepalive: true
                }).catch(err => console.error('keepalive update failed:', err));
            } catch (err) {
                console.error('keepalive backup failed:', err);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup on unmount
        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            window.removeEventListener('mousemove', resetActivity);
            window.removeEventListener('keydown', resetActivity);
            window.removeEventListener('focus', resetActivity);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);

            // Set offline when component unmounts (forced)
            updatePresence(false, true);
        };
    }, [currentUser, updatePresence]);

    // Single global Realtime subscription for all presence updates
    useEffect(() => {
        if (!supabase) return;

        const channel = supabase
            .channel('global-presence-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_presence'
                },
                (payload) => {
                    const data = payload.new as any;
                    if (data) {
                        setOnlineUsers(prev => {
                            const m = new Map(prev);
                            m.set(data.user_id, data.is_online);
                            return m;
                        });
                        setLastSeenMap(prev => {
                            const m = new Map(prev);
                            m.set(data.user_id, new Date(data.last_seen));
                            return m;
                        });
                    }
                }
            )
            .subscribe();

        globalChannelRef.current = channel;

        return () => {
            if (globalChannelRef.current) {
                supabase.removeChannel(globalChannelRef.current);
            }
        };
    }, []);

    // CLIENT-SIDE STALE PRESENCE DETECTION
    // Mark users offline if their last_seen is > 60 seconds old (heartbeat is 30s)
    useEffect(() => {
        const checkStalePresence = () => {
            const now = Date.now();
            setOnlineUsers(prev => {
                const updated = new Map(prev);
                let hasChanges = false;

                lastSeenMap.forEach((lastSeen, userId) => {
                    const timeSinceLastSeen = now - lastSeen.getTime();
                    // If last seen > 60 seconds ago and currently marked online, mark offline
                    if (timeSinceLastSeen > 60000 && updated.get(userId)) {
                        updated.set(userId, false);
                        hasChanges = true;
                    }
                });

                return hasChanges ? updated : prev;
            });
        };

        // Check every 10 seconds for stale presence
        const interval = setInterval(checkStalePresence, 10000);
        return () => clearInterval(interval);
    }, [lastSeenMap]);

    // Track a single user and fetch initial presence
    const subscribeToUser = useCallback((userId: string) => {
        if (!supabase) return;
        
        if (trackedUsersRef.current.has(userId)) return;
        trackedUsersRef.current.add(userId);

        supabase
            .from('user_presence')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()
            .then(({ data, error }) => {
                if (data && !error) {
                    setOnlineUsers(prev => {
                        const m = new Map(prev);
                        m.set(userId, data.is_online);
                        return m;
                    });
                    setLastSeenMap(prev => {
                        const m = new Map(prev);
                        m.set(userId, new Date(data.last_seen));
                        return m;
                    });
                }
            });
    }, []);

    // Batch track users and batch fetch initial presence
    const subscribeToUsers = useCallback((userIds: string[]) => {
        if (!supabase || userIds.length === 0) return;

        const newIds = userIds.filter(id => !trackedUsersRef.current.has(id));
        if (newIds.length === 0) return;

        newIds.forEach(id => trackedUsersRef.current.add(id));

        supabase
            .from('user_presence')
            .select('*')
            .in('user_id', newIds)
            .then(({ data, error }) => {
                if (data && !error) {
                    setOnlineUsers(prev => {
                        const m = new Map(prev);
                        data.forEach((row: any) => {
                            m.set(row.user_id, row.is_online);
                        });
                        return m;
                    });
                    setLastSeenMap(prev => {
                        const m = new Map(prev);
                        data.forEach((row: any) => {
                            m.set(row.user_id, new Date(row.last_seen));
                        });
                        return m;
                    });
                }
            });
    }, []);

    const unsubscribeFromUser = useCallback((userId: string) => {
        trackedUsersRef.current.delete(userId);
    }, []);

    const isUserOnline = useCallback((userId: string): boolean => {
        return onlineUsers.get(userId) || false;
    }, [onlineUsers]);

    const getLastSeen = useCallback((userId: string): Date | null => {
        return lastSeenMap.get(userId) || null;
    }, [lastSeenMap]);

    return (
        <PresenceContext.Provider
            value={{
                onlineUsers,
                lastSeenMap,
                subscribeToUser,
                subscribeToUsers,
                unsubscribeFromUser,
                isUserOnline,
                getLastSeen
            }}
        >
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => {
    const context = useContext(PresenceContext);
    if (context === undefined) {
        throw new Error('usePresence must be used within a PresenceProvider');
    }
    return context;
};
