import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { MatchProfile } from '../types';
import { useRouter as useNavigate } from 'next/navigation';
import { Heart, X, MapPin, GraduationCap, Ghost, BadgeCheck, School, Globe, Bell, Hand } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { analytics } from '../utils/analytics';
import { getOptimizedUrl } from '../utils/image';
import { calculateMatchPercentage } from '../utils/matchingAlgorithm';

import { getRandomQuote } from '../data/loadingQuotes';
import { safeSetItem } from '../utils/storage';


// Cache key for session storage — keyed by filter mode so campus/global don't bleed into each other
const getCacheKey = (mode: string) => `otherhalf_discover_cache_cupid_${mode}`;
const getCacheExpiryKey = (mode: string) => `otherhalf_discover_cache_cupid_expiry_${mode}`;
const getSkippedCacheKey = (mode: string) => `otherhalf_skipped_cache_cupid_${mode}`;
const getSkippedCacheExpiryKey = (mode: string) => `otherhalf_skipped_cache_cupid_expiry_${mode}`;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Calculate age from DOB string
const getAge = (dob?: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

export const Home: React.FC = () => {
    const { currentUser } = useAuth();
    const [queue, setQueue] = useState<MatchProfile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [quote] = useState(getRandomQuote());
    const dragXRef = useRef(0);
    const dragYRef = useRef(0);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const isDraggingRef = useRef(false);
    const updateScheduledRef = useRef(false);

    // Element refs
    const cardGlowRef = useRef<HTMLDivElement>(null);
    const likeStampRef = useRef<HTMLDivElement>(null);
    const nopeStampRef = useRef<HTMLDivElement>(null);
    const bgBlob1Ref = useRef<HTMLDivElement>(null);
    const bgBlob2Ref = useRef<HTMLDivElement>(null);

    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const pullStartY = useRef<number | null>(null);

    const [filterMode, setFilterMode] = useState<'campus' | 'global'>('campus');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const { unreadCount } = useNotifications();
    const preloadedImages = useRef<Set<string>>(new Set());


    const [showSuccessBurst, setShowSuccessBurst] = useState(false);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isRecycleMode, setIsRecycleMode] = useState(false);
    const [recycleMessage, setRecycleMessage] = useState<string | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        try {
            const hasSeen = localStorage.getItem('hasSeenSwipeTutorial');
            if (!hasSeen) {
                setShowTutorial(true);
            }
        } catch (e) {
            console.warn('Failed to access localStorage:', e);
            setShowTutorial(true);
        }
    }, []);

    const dismissTutorial = () => {
        try {
            localStorage.setItem('hasSeenSwipeTutorial', 'true');
        } catch (e) {
            console.warn('Failed to write to localStorage:', e);
        }
        setShowTutorial(false);
    };

    const preloadImages = useCallback((profiles: MatchProfile[]) => {

        profiles.forEach(profile => {
            if (profile.avatar && !preloadedImages.current.has(profile.avatar)) {
                const img = new Image();
                img.src = profile.avatar;
                preloadedImages.current.add(profile.avatar);
            }
        });
    }, []);



    const fetchFreshSkippedProfiles = useCallback(async (showLoading: boolean) => {
        if (!currentUser || !supabase) return;
        if (showLoading) setIsLoading(true);
        setRecycleMessage(null);
        try {
            const { data, error } = await supabase.rpc('get_skipped_profiles', {
                current_user_id: currentUser.id,
                match_mode: filterMode,
                user_university: currentUser.university,
                limit_count: 20,
                offset_count: 0
            });

            if (error) throw error;

            if (data && data.length > 0) {
                const mappedProfiles: MatchProfile[] = data.map((p: any) => ({
                    id: p.id,
                    anonymousId: p.anonymous_id,
                    realName: p.real_name,
                    gender: p.gender,
                    university: p.university,
                    branch: p.branch,
                    year: p.year,
                    interests: p.interests || [],
                    bio: p.bio,
                    dob: p.dob,
                    isVerified: p.is_verified,
                    avatar: p.avatar,
                    lookingFor: p.looking_for || [],
                    matchPercentage: calculateMatchPercentage(currentUser, {
                        id: p.id,
                        anonymousId: p.anonymous_id,
                        realName: p.real_name,
                        gender: p.gender,
                        university: p.university,
                        branch: p.branch,
                        year: p.year,
                        interests: p.interests || [],
                        bio: p.bio,
                        dob: p.dob,
                        isVerified: p.is_verified,
                        avatar: p.avatar,
                        lookingFor: p.looking_for || [],
                        matchPercentage: 0,
                        distance: ''
                    }),
                    distance: 'Recycled'
                }));
                setQueue(mappedProfiles);
                setIsRecycleMode(true);
                preloadImages(mappedProfiles.slice(0, 5));

                // Cache the data safely
                try {
                    sessionStorage.setItem(getSkippedCacheKey(filterMode), JSON.stringify(mappedProfiles));
                    sessionStorage.setItem(getSkippedCacheExpiryKey(filterMode), (Date.now() + CACHE_DURATION).toString());
                } catch (e) {
                    console.warn('Failed to cache skipped profiles:', e);
                }
            } else {
                setQueue([]);
                setRecycleMessage('No skipped profiles yet. Pass on someone first and they will show up here.');
                // Clear cache if empty
                try {
                    sessionStorage.removeItem(getSkippedCacheKey(filterMode));
                    sessionStorage.removeItem(getSkippedCacheExpiryKey(filterMode));
                } catch (e) {}
            }
        } catch (err) {
            console.error('Error fetching skipped profiles:', err);
            setRecycleMessage('Could not load skipped profiles. Try again.');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [currentUser, filterMode, preloadImages]);

    const fetchSkippedProfiles = useCallback(async (showLoading = true) => {
        if (!currentUser || !supabase) return;
        if (showLoading) setIsLoading(true);
        setRecycleMessage(null);

        // 1. Try cache first
        try {
            const cachedData = sessionStorage.getItem(getSkippedCacheKey(filterMode));
            const cachedExpiry = sessionStorage.getItem(getSkippedCacheExpiryKey(filterMode));

            if (cachedData && cachedExpiry && Date.now() < Number(cachedExpiry)) {
                const cached = JSON.parse(cachedData);
                if (cached.length > 0) {
                    setQueue(cached);
                    setIsRecycleMode(true);
                    if (showLoading) setIsLoading(false);
                    preloadImages(cached.slice(0, 5));
                    // Background refresh
                    fetchFreshSkippedProfiles(false);
                    return;
                }
            }
        } catch (e) {
            console.warn('Skipped cache read failed:', e);
        }

        fetchFreshSkippedProfiles(showLoading);
    }, [currentUser, filterMode, fetchFreshSkippedProfiles, preloadImages]);

    // Load users from Supabase (with caching)
    const fetchFreshData = useCallback(async (showLoading: boolean) => {
        if (!currentUser || !supabase) return;

        if (showLoading) setIsLoading(true);

        try {
            // Fetch new matches with server-side filtering
            let { data, error } = await supabase.rpc('get_potential_matches', {
                user_id: currentUser.id,
                match_mode: filterMode,
                user_university: currentUser.university
            });

            if (error) {
                console.error('Error fetching matches:', error);
                if (showLoading) setIsLoading(false);
                return;
            }

            if (data) {
                const mappedProfiles: MatchProfile[] = data.map((p: any) => ({
                    id: p.id,
                    anonymousId: p.anonymous_id,
                    realName: p.real_name,
                    gender: p.gender,
                    university: p.university,
                    branch: p.branch,
                    year: p.year,
                    interests: p.interests || [],
                    bio: p.bio,
                    dob: p.dob,
                    isVerified: p.is_verified,
                    avatar: p.avatar,
                    lookingFor: p.looking_for || [],
                    matchPercentage: calculateMatchPercentage(currentUser, {
                        id: p.id,
                        anonymousId: p.anonymous_id,
                        realName: p.real_name,
                        gender: p.gender,
                        university: p.university,
                        branch: p.branch,
                        year: p.year,
                        interests: p.interests || [],
                        bio: p.bio,
                        dob: p.dob,
                        isVerified: p.is_verified,
                        avatar: p.avatar,
                        lookingFor: p.looking_for || [],
                        matchPercentage: 0,
                        distance: ''
                    }),
                    distance: filterMode === 'campus' ? 'On Campus' : 'Global'
                }));

                // Update state
                setQueue(mappedProfiles);
                setIsRecycleMode(false);
                preloadImages(mappedProfiles.slice(0, 5));

                // Cache the data safely
                try {
                    sessionStorage.setItem(getCacheKey(filterMode), JSON.stringify(mappedProfiles));
                    sessionStorage.setItem(getCacheExpiryKey(filterMode), (Date.now() + CACHE_DURATION).toString());
                } catch (e) {
                    console.warn('Failed to cache profiles:', e);
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [currentUser, filterMode, preloadImages]);

    const loadDiscoverProfiles = useCallback(async (showLoading = true) => {
        if (!currentUser || !supabase) {
            setIsLoading(false);
            return;
        }

        setIsRecycleMode(false);

        // 1. Try cache first for instant load (stale-while-revalidate)
        try {
            const cachedData = sessionStorage.getItem(getCacheKey(filterMode));
            const cachedExpiry = sessionStorage.getItem(getCacheExpiryKey(filterMode));

            if (cachedData && cachedExpiry && Date.now() < Number(cachedExpiry)) {
                const cached = JSON.parse(cachedData);
                if (cached.length > 0) {
                    setQueue(cached);
                    setIsLoading(false);
                    preloadImages(cached.slice(0, 5));
                    // Background refresh — no loading spinner
                    fetchFreshData(false);
                    return;
                }
            }
        } catch (e) {
            console.warn('Cache read failed:', e);
        }

        // 2. No valid cache — fetch with loading spinner
        fetchFreshData(showLoading);
    }, [currentUser, filterMode, fetchFreshData, preloadImages]);

    // Load users from Supabase (with caching)
    useEffect(() => {
        loadDiscoverProfiles(true);
    }, [loadDiscoverProfiles]);

    // Fetch and subscribe to notifications - Handled by Context now
    // useEffect(() => { ... }, [currentUser]);

    // No more client-side filtering needed!
    const filteredQueue = queue;

    const currentProfile = filteredQueue[currentIndex];
    const nextProfile = filteredQueue[currentIndex + 1];
    const thirdProfile = filteredQueue[currentIndex + 2];

    // Preload upcoming images when current index changes
    useEffect(() => {
        const upcomingProfiles = filteredQueue.slice(currentIndex, currentIndex + 4);
        preloadImages(upcomingProfiles);
    }, [currentIndex, filteredQueue, preloadImages]);

    // Attach non-passive touchmove to card for reliable preventDefault on mobile
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        const onTouchMove = (e: TouchEvent) => {
            if (isDraggingRef.current) {
                e.preventDefault();
            }
        };
        card.addEventListener('touchmove', onTouchMove, { passive: false });
        return () => card.removeEventListener('touchmove', onTouchMove);
    }, [currentProfile]);

    const handleGlobalTouchStart = (e: React.TouchEvent) => {
        pullStartY.current = e.touches[0].clientY;
    };

    const handleGlobalTouchMove = (e: React.TouchEvent) => {
        if (!pullStartY.current) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - pullStartY.current;
        
        if (deltaY > 0 && !isRefreshing) {
            setPullDistance(Math.min(deltaY * 0.5, 90));
        }
    };

    const handleGlobalTouchEnd = async () => {
        if (!pullStartY.current) return;
        if (pullDistance > 60 && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(60); 
            if (isRecycleMode) {
                await Promise.all([
                    fetchFreshSkippedProfiles(false),
                    new Promise(resolve => setTimeout(resolve, 1000))
                ]);
            } else {
                await Promise.all([
                    fetchFreshData(false),
                    new Promise(resolve => setTimeout(resolve, 1000))
                ]);
            }
            setIsRefreshing(false);
            setPullDistance(0);
        } else {
            setPullDistance(0);
        }
        pullStartY.current = null;
    };

    const updateDOM = () => {
        updateScheduledRef.current = false;
        
        const dragX = dragXRef.current;
        const dragY = dragYRef.current;
        const isDragging = isDraggingRef.current;

        const rotateY = typeof window !== 'undefined' ? (dragX / window.innerWidth) * 25 : 0;
        const rotateZ = typeof window !== 'undefined' ? (dragX / window.innerWidth) * 15 : 0;
        const scale = isDragging ? 1.02 : 1;
        const likeOpacity = Math.max(0, Math.min((dragX - 30) / 80, 1));
        const nopeOpacity = Math.max(0, Math.min((-dragX - 30) / 80, 1));

        // Apply transformations to Active Card
        if (cardRef.current) {
            cardRef.current.style.transform = `translateX(${dragX}px) translateY(${dragY}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`;
            cardRef.current.style.transition = isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            cardRef.current.style.cursor = isDragging ? 'grabbing' : 'grab';
        }

        // Apply box shadow to Card Glow
        if (cardGlowRef.current) {
            cardGlowRef.current.style.boxShadow = dragX > 50
                ? 'inset 0 0 80px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.3)'
                : dragX < -50
                    ? 'inset 0 0 80px rgba(239,68,68,0.4), 0 0 60px rgba(239,68,68,0.3)'
                    : 'none';
        }

        // Apply stamps opacity & scale
        if (likeStampRef.current) {
            likeStampRef.current.style.opacity = String(likeOpacity);
            likeStampRef.current.style.transform = `scale(${0.8 + likeOpacity * 0.4}) rotate(-12deg)`;
        }
        if (nopeStampRef.current) {
            nopeStampRef.current.style.opacity = String(nopeOpacity);
            nopeStampRef.current.style.transform = `scale(${0.8 + nopeOpacity * 0.4}) rotate(12deg)`;
        }

        // Apply transformations to Background Blobs
        if (bgBlob1Ref.current) {
            bgBlob1Ref.current.style.background = dragX > 50
                ? 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)'
                : dragX < -50
                    ? 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(255,0,127,0.08) 0%, transparent 70%)';
            bgBlob1Ref.current.style.transform = `translate(${dragX * 0.1}px, ${dragY * 0.1}px)`;
        }
        if (bgBlob2Ref.current) {
            bgBlob2Ref.current.style.transform = `translate(${-dragX * 0.05}px, ${-dragY * 0.05}px)`;
        }
    };

    const scheduleUpdate = () => {
        if (updateScheduledRef.current) return;
        updateScheduledRef.current = true;
        requestAnimationFrame(updateDOM);
    };

    // Enhanced touch handlers with spring physics feel
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        if ('touches' in e) e.stopPropagation();
        isDraggingRef.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        startXRef.current = clientX;
        startYRef.current = clientY;
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if ('touches' in e) e.stopPropagation();
        if (!isDraggingRef.current) return;
        // Prevent browser scroll/refresh while swiping
        if ('touches' in e) {
            e.preventDefault();
        }
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const deltaX = clientX - startXRef.current;
        const deltaY = clientY - startYRef.current;

        // Spring-like resistance at edges
        const resistance = 0.8;
        dragXRef.current = deltaX * resistance;
        dragYRef.current = deltaY * 0.3;

        scheduleUpdate();
    };

    const endSwipe = (e?: React.TouchEvent | React.MouseEvent) => {
        if (e && 'touches' in e) e.stopPropagation();
        isDraggingRef.current = false;
        const threshold = window.innerWidth * 0.2;
        const dragX = dragXRef.current;

        if (dragX > threshold) {
            handleSwipe('right');
        } else if (dragX < -threshold) {
            handleSwipe('left');
        } else {
            // Spring back animation
            dragXRef.current = 0;
            dragYRef.current = 0;
            
            if (cardRef.current) {
                cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                cardRef.current.style.transform = 'translateX(0px) translateY(0px) rotateY(0deg) rotateZ(0deg) scale(1)';
                cardRef.current.style.cursor = 'grab';
            }
            if (bgBlob1Ref.current) {
                bgBlob1Ref.current.style.transform = 'translate(0px, 0px)';
                bgBlob1Ref.current.style.background = 'radial-gradient(circle, rgba(255,0,127,0.08) 0%, transparent 70%)';
            }
            if (bgBlob2Ref.current) {
                bgBlob2Ref.current.style.transform = 'translate(0px, 0px)';
            }
            if (likeStampRef.current) {
                likeStampRef.current.style.opacity = '0';
                likeStampRef.current.style.transform = 'scale(0.8) rotate(-12deg)';
            }
            if (nopeStampRef.current) {
                nopeStampRef.current.style.opacity = '0';
                nopeStampRef.current.style.transform = 'scale(0.8) rotate(12deg)';
            }
            if (cardGlowRef.current) {
                cardGlowRef.current.style.boxShadow = 'none';
            }
        }
    };

    const handleSwipe = async (direction: 'left' | 'right') => {
        if (!currentProfile || !currentUser || !supabase || isSwiping) return;

        setIsSwiping(true); // Lock to prevent double-taps

        const targetId = currentProfile.id;
        const action = direction === 'right' ? 'like' : 'pass';

        // Cinematic exit animation
        const offScreenX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
        const offScreenY = direction === 'right' ? -100 : 100;
        
        dragXRef.current = offScreenX;
        dragYRef.current = offScreenY;
        isDraggingRef.current = false;
        
        if (cardRef.current) {
            const rotateY = (offScreenX / window.innerWidth) * 25;
            const rotateZ = (offScreenX / window.innerWidth) * 15;
            cardRef.current.style.transition = 'transform 0.3s ease-in';
            cardRef.current.style.transform = `translateX(${offScreenX}px) translateY(${offScreenY}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(1)`;
        }
        
        if (bgBlob1Ref.current) {
            bgBlob1Ref.current.style.transform = 'translate(0px, 0px)';
        }
        if (bgBlob2Ref.current) {
            bgBlob2Ref.current.style.transform = 'translate(0px, 0px)';
        }
        if (likeStampRef.current) likeStampRef.current.style.opacity = '0';
        if (nopeStampRef.current) nopeStampRef.current.style.opacity = '0';
        if (cardGlowRef.current) cardGlowRef.current.style.boxShadow = 'none';

        // Show success burst for likes
        if (direction === 'right') {
            analytics.swipeRight();
            setShowSuccessBurst(true);
            setTimeout(() => setShowSuccessBurst(false), 600);
        } else {
            analytics.swipeLeft();
        }

        setTimeout(async () => {
            dragXRef.current = 0;
            dragYRef.current = 0;
            
            if (cardRef.current) {
                cardRef.current.style.transition = 'none';
                cardRef.current.style.transform = 'translateX(0px) translateY(0px) rotateY(0deg) rotateZ(0deg) scale(1)';
            }

            // 1. UPDATE STATE & CACHE (Optimistic)
            const nextQueue = queue.filter(p => p.id !== targetId);
            setQueue(nextQueue);

            // USE SAFE SET ITEM HERE to prevent crash if storage is full
            const cacheKeyToUpdate = isRecycleMode 
                ? getSkippedCacheKey(filterMode)
                : getCacheKey(filterMode);
            safeSetItem(cacheKeyToUpdate, JSON.stringify(nextQueue));

            // 2. UNLOCK UI IMMEDIATELY
            setIsSwiping(false);

            // 3. SEND TO DB (Background)
            try {
                // Use UPSERT to handle recycling (re-swiping on previously passed users)
                const { error: swipeError } = await supabase
                    .from('swipes')
                    .upsert({
                        liker_id: currentUser.id,
                        target_id: targetId,
                        action: action,
                        created_at: new Date().toISOString()
                    }, { onConflict: 'liker_id, target_id' });

                if (swipeError) console.error('Swipe error:', swipeError);
            } catch (err) {
                console.error('Swipe logic error:', err);
            }
        }, 200);
    };

    if (!currentUser) return null;

    return (
        <div 
            className="h-full w-full bg-transparent flex flex-col relative overflow-hidden select-none touch-none"
            onTouchStart={handleGlobalTouchStart}
            onTouchMove={handleGlobalTouchMove}
            onTouchEnd={handleGlobalTouchEnd}
        >
            {isRecycleMode && !isLoading && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-yellow-500/10 backdrop-blur-md rounded-full border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)] text-yellow-400 text-[11px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                        Reviewing Skipped
                        <button
                            onClick={() => loadDiscoverProfiles(true)}
                            className="ml-2 px-3 py-0.5 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black rounded-full transition-all active:scale-95 uppercase tracking-normal"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            )}

            {/* === REACTIVE BACKGROUND === */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Reactive blob - shifts with swipe direction */}
                <div
                    ref={bgBlob1Ref}
                    className="absolute top-[-30%] left-[-30%] w-[80%] h-[80%] rounded-full blur-[120px] transition-all duration-500 ease-out"
                    style={{
                        background: 'radial-gradient(circle, rgba(255,0,127,0.08) 0%, transparent 70%)'
                    }}
                />

                {/* Secondary ambient blob */}
                <div
                    ref={bgBlob2Ref}
                    className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[100px] bg-gradient-to-t from-purple-900/10 to-transparent transition-transform duration-700"
                />

                {/* Floating particles */}
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-neon/40 rounded-full animate-float-up" style={{ animationDelay: '0s' }} />
                <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-purple-400/40 rounded-full animate-float-up" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-400/30 rounded-full animate-float-up" style={{ animationDelay: '4s' }} />
            </div>

            {/* === SUCCESS BURST EFFECT === */}
            {showSuccessBurst && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                    <div className="relative">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-3 h-3 bg-neon rounded-full animate-burst-out"
                                style={{
                                    transform: `rotate(${i * 30}deg) translateY(-20px)`,
                                    animationDelay: `${i * 30}ms`
                                }}
                            />
                        ))}
                        <Heart className="w-16 h-16 text-neon fill-neon animate-pulse-fast drop-shadow-[0_0_30px_rgba(255,0,127,0.8)]" />
                    </div>
                </div>
            )}

            {/* === TOP HEADER === */}
            <div className="w-full px-5 py-4 flex items-center justify-end gap-3 z-30 relative">

                <div className="flex items-center gap-3">
                    {/* Premium Filter Toggle */}
                    <div className="flex bg-black/60 backdrop-blur-2xl rounded-full p-1 border border-white/10 shadow-2xl">
                        <button
                            onClick={() => setFilterMode('campus')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase transition-all duration-300 ${filterMode === 'campus'
                                ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <School className="w-3.5 h-3.5" />
                            Campus
                        </button>
                        <button
                            onClick={() => setFilterMode('global')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase transition-all duration-300 ${filterMode === 'global'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            Global
                        </button>
                    </div>

                    {/* Notification Button */}
                    <button
                        onClick={() => navigate.push('/notifications')}
                        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
                        className="relative p-2.5 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 text-gray-400 hover:text-neon transition-all hover:border-neon/30 hover:scale-105 active:scale-95"
                    >
                        <Bell className="w-5 h-5" aria-hidden="true" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-neon text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* === MAIN CONTENT === */}
            <div 
                className="flex-1 flex flex-col items-center justify-center relative w-full px-4 min-h-0 pb-20 md:pb-0"
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: pullDistance === 0 || isRefreshing ? 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                }}
            >
                {/* Pull-to-refresh Loader */}
                <div 
                    className="absolute top-[-36px] left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center justify-center transition-all duration-200"
                    style={{
                        opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
                    }}
                >
                    <div className="w-8 h-8 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-full border border-white/10 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className={`w-5 h-5 transition-colors duration-300 ${isRecycleMode 
                                ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' 
                                : 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' 
                            } ${isRefreshing ? 'animate-draw-loop' : ''}`}
                        >
                            <path pathLength="100" style={{ strokeDasharray: 100, strokeDashoffset: isRefreshing ? undefined : Math.max(0, 100 - (pullDistance / 60) * 100), transition: !isRefreshing ? 'stroke-dashoffset 0.1s linear' : 'none' }} d="M9 10h.01"/>
                            <path pathLength="100" style={{ strokeDasharray: 100, strokeDashoffset: isRefreshing ? undefined : Math.max(0, 100 - (pullDistance / 60) * 100), transition: !isRefreshing ? 'stroke-dashoffset 0.1s linear' : 'none' }} d="M15 10h.01"/>
                            <path pathLength="100" style={{ strokeDasharray: 100, strokeDashoffset: isRefreshing ? undefined : Math.max(0, 100 - (pullDistance / 60) * 100), transition: !isRefreshing ? 'stroke-dashoffset 0.1s linear' : 'none' }} d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>
                        </svg>
                    </div>
                </div>

                {/* LOADING STATE - Skeleton Card */}
                {isLoading ? (
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        style={{ perspective: '1200px' }}
                    >
                        <div className="relative w-full max-w-[360px] md:max-w-[420px] h-full max-h-[580px] md:max-h-[620px]">
                            {/* Skeleton Card */}
                            <div className="absolute top-0 bottom-24 inset-x-0 rounded-[28px] overflow-hidden z-10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)] bg-gray-900 border border-gray-800">
                                {/* Skeleton Image */}
                                <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 animate-pulse" />

                                {/* Skeleton Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-40% to-black pointer-events-none" />

                                {/* Loading Quote */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6 text-center z-20">
                                    <p className="text-white/70 font-serif italic text-lg animate-pulse bg-black/60 px-6 py-3 rounded-full backdrop-blur-md shadow-2xl border border-white/10">“{quote}”</p>
                                </div>

                                {/* Skeleton Text at Bottom */}
                                <div className="absolute bottom-0 inset-x-0 p-5 space-y-3">
                                    {/* Name skeleton */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-32 bg-gray-700 rounded-lg animate-pulse" />
                                        <div className="h-6 w-10 bg-gray-700 rounded-lg animate-pulse" />
                                    </div>
                                    {/* University skeleton */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
                                        <div className="h-4 w-48 bg-gray-700 rounded animate-pulse" />
                                    </div>
                                    {/* Distance skeleton */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
                                        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            {/* Skeleton Action Buttons */}
                            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-6 z-20 h-20 items-center">
                                <div className="w-16 h-16 bg-gray-800 rounded-full animate-pulse border border-gray-700" />
                                <div className="w-16 h-16 bg-gray-800 rounded-full animate-pulse border border-gray-700" />
                            </div>
                        </div>
                    </div>
                ) : !currentProfile ? (
                    /* EMPTY STATE - Only shown when NOT loading */
                    <div className="text-center animate-fade-in z-20">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-700 mx-auto shadow-2xl">
                            <Ghost className="w-10 h-10 text-gray-600" />
                        </div>
                        <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
                            {filterMode === 'campus' ? 'Campus Quiet' : 'Zone Empty'}
                        </h2>
                        <p className="text-gray-500 text-sm max-w-xs mb-8 mx-auto leading-relaxed">
                            {filterMode === 'campus'
                                ? 'No more students from your university. Try Global or review who you skipped!'
                                : 'No more profiles available right now.'}
                        </p>
                        <div className="flex flex-col gap-3">
                            {filterMode === 'campus' && (
                                <button
                                    onClick={() => setFilterMode('global')}
                                    className="px-6 py-3 bg-gradient-to-r from-neon to-purple-600 text-white rounded-full font-bold text-sm transition-all hover:shadow-[0_0_30px_rgba(255,0,127,0.4)] hover:scale-105 active:scale-95"
                                >
                                    Switch to Global
                                </button>
                            )}

                            <button
                                onClick={() => fetchSkippedProfiles(true)}
                                className="px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-full font-bold text-sm transition-all hover:bg-gray-700 hover:text-white hover:border-gray-500 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Ghost className="w-4 h-4" /> Review Skipped Profiles
                            </button>
                            {recycleMessage && (
                                <p className="text-gray-500 text-xs text-center px-4 mt-1 leading-relaxed">
                                    {recycleMessage}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    /* === CARD CONTAINER === */
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        style={{ perspective: '1200px' }}
                    >
                        {/* Main Card Area */}
                        <div className="relative w-full max-w-[360px] md:max-w-[420px] h-full max-h-[580px] md:max-h-[620px]">

                            {/* Background card stack */}
                            {thirdProfile && (
                                <div className="absolute top-6 bottom-20 inset-x-0 bg-gray-900/50 rounded-[28px] transform scale-[0.88] translate-y-6 opacity-30 border border-gray-800/50 pointer-events-none overflow-hidden blur-[1px]">
                                    <img src={getOptimizedUrl(thirdProfile.avatar, 1024)} className="w-full h-full object-cover opacity-40 grayscale" alt="" aria-hidden="true" referrerPolicy="no-referrer" />
                                </div>
                            )}
                            {nextProfile && (
                                <div className="absolute top-3 bottom-16 inset-x-0 bg-gray-900/80 rounded-[28px] transform scale-[0.94] translate-y-3 opacity-50 border border-gray-800 pointer-events-none overflow-hidden">
                                    <img src={getOptimizedUrl(nextProfile.avatar, 1024)} className="w-full h-full object-cover opacity-60 grayscale-[50%]" alt="" aria-hidden="true" referrerPolicy="no-referrer" />
                                </div>
                            )}

                            {/* === ACTIVE CARD === */}
                            <div
                                ref={cardRef}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={endSwipe}
                                onMouseDown={handleTouchStart}
                                onMouseMove={handleTouchMove}
                                onMouseUp={endSwipe}
                                onMouseLeave={() => isDraggingRef.current && endSwipe()}
                                style={{
                                    transformStyle: 'preserve-3d',
                                    transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    cursor: 'grab'
                                }}
                                className="absolute top-0 bottom-24 inset-x-0 rounded-[28px] overflow-hidden z-10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)]"
                            >
                                {/* Card glow */}
                                <div
                                    ref={cardGlowRef}
                                    className="absolute inset-0 z-20 pointer-events-none rounded-[28px] transition-all duration-200"
                                />

                                {/* Image */}
                                <img
                                    src={getOptimizedUrl(currentProfile.avatar, 1024)}
                                    alt="Profile"
                                    className="w-full h-full object-cover pointer-events-none"
                                    draggable={false}
                                    referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent via-40% to-black pointer-events-none" />

                                {/* LIKE Stamp */}
                                <div
                                    ref={likeStampRef}
                                    className="absolute top-8 left-6 z-30 opacity-0 transition-all duration-200"
                                    style={{ transform: 'scale(0.8) rotate(-12deg)' }}
                                >
                                    <div className="border-[5px] border-green-400 text-green-400 font-black text-3xl px-3 py-1.5 rounded-lg bg-green-400/10 backdrop-blur-sm shadow-[0_0_40px_rgba(34,197,94,0.6)]">LIKE</div>
                                </div>

                                {/* NOPE Stamp */}
                                <div
                                    ref={nopeStampRef}
                                    className="absolute top-8 right-6 z-30 opacity-0 transition-all duration-200"
                                    style={{ transform: 'scale(0.8) rotate(12deg)' }}
                                >
                                    <div className="border-[5px] border-red-400 text-red-400 font-black text-3xl px-3 py-1.5 rounded-lg bg-red-400/10 backdrop-blur-sm shadow-[0_0_40px_rgba(239,68,68,0.6)]">NOPE</div>
                                </div>

                                {/* === TINDER-STYLE BOTTOM TEXT === */}
                                <div className="absolute bottom-0 inset-x-0 p-5 text-white pointer-events-none">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                                            {currentProfile.realName ? currentProfile.realName.split(' ')[0] : currentProfile.anonymousId}
                                        </h1>
                                        {getAge(currentProfile.dob) && (
                                            <span className="text-xl md:text-2xl font-normal text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                                {getAge(currentProfile.dob)}
                                            </span>
                                        )}
                                        {currentProfile.gender && (
                                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 drop-shadow-lg">
                                                {currentProfile.gender}
                                            </span>
                                        )}
                                        {currentProfile.isVerified && (
                                            <BadgeCheck className="w-5 h-5 drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]" style={{ color: '#60a5fa' }} />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-200">
                                        <GraduationCap className="w-4 h-4 drop-shadow-lg" />
                                        <span className="drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">{currentProfile.university}</span>
                                    </div>
                                    {(currentProfile.branch || currentProfile.year) && (
                                        <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-300">
                                            <School className="w-4 h-4 drop-shadow-lg" />
                                            <span className="drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                                                {[currentProfile.branch, currentProfile.year].filter(Boolean).join(' • ')}
                                            </span>
                                        </div>
                                    )}
                                    {currentProfile.lookingFor && currentProfile.lookingFor.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {currentProfile.lookingFor.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neon/20 text-neon border border-neon/30 backdrop-blur-sm drop-shadow-lg">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* === ACTION BUTTONS REMOVED === */}
                            
                            {/* SWIPE TUTORIAL OVERLAY */}
                            {showTutorial && currentProfile && (
                                <div 
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-[28px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    onClick={dismissTutorial}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            dismissTutorial();
                                        }
                                    }}
                                    tabIndex={0}
                                    role="button"
                                    aria-label="Dismiss swipe tutorial. Tap anywhere or press space or enter to start."
                                >
                                    <div className="flex items-center gap-12 w-full px-8 justify-center">
                                        <div className="flex flex-col items-center gap-3 animate-swipe-left opacity-80">
                                            <div className="p-3 rounded-full bg-red-500/20 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                                <X className="w-8 h-8 text-red-500" />
                                            </div>
                                            <span className="font-black text-red-400 text-lg uppercase tracking-wider drop-shadow-md">Pass</span>
                                        </div>
                                        
                                        <div className="flex flex-col items-center gap-3 animate-swipe-right opacity-80">
                                            <div className="p-3 rounded-full bg-green-500/20 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                                <Heart className="w-8 h-8 text-green-500" />
                                            </div>
                                            <span className="font-black text-green-400 text-lg uppercase tracking-wider drop-shadow-md">Like</span>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute bottom-16 flex flex-col items-center gap-2">
                                        <Hand className="w-10 h-10 text-white/80 animate-swipe-hand" />
                                        <p className="text-white/90 font-bold bg-black/40 px-5 py-2.5 rounded-full border border-white/10 mt-2 backdrop-blur-md shadow-xl text-sm">
                                            Tap anywhere to start
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>

            {/* CSS for custom animations */}
            <style>{`
                @keyframes draw-loop {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: 100; }
                }
                .animate-draw-loop path {
                    stroke-dasharray: 100;
                    animation: draw-loop 1.5s ease-in-out infinite alternate;
                }
                @keyframes burst-out {
                    0% { transform: rotate(var(--rotation)) translateY(-20px) scale(1); opacity: 1; }
                    100% { transform: rotate(var(--rotation)) translateY(-80px) scale(0); opacity: 0; }
                }
                .animate-burst-out {
                    animation: burst-out 0.6s ease-out forwards;
                }
                @keyframes pulse-fast {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                .animate-pulse-fast {
                    animation: pulse-fast 0.3s ease-in-out 2;
                }
                @keyframes swipe-hand {
                    0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
                    25% { transform: translateX(-40px) translateY(10px) rotate(-15deg); }
                    50% { transform: translateX(0) translateY(0) rotate(0deg); }
                    75% { transform: translateX(40px) translateY(10px) rotate(15deg); }
                }
                .animate-swipe-hand {
                    animation: swipe-hand 3s ease-in-out infinite;
                }
                @keyframes swipe-left {
                    0%, 100% { transform: translateX(0); opacity: 0.5; }
                    25% { transform: translateX(-15px); opacity: 1; }
                    50% { transform: translateX(0); opacity: 0.5; }
                }
                @keyframes swipe-right {
                    0%, 100% { transform: translateX(0); opacity: 0.5; }
                    50% { transform: translateX(0); opacity: 0.5; }
                    75% { transform: translateX(15px); opacity: 1; }
                }
                .animate-swipe-left {
                    animation: swipe-left 3s ease-in-out infinite;
                }
                .animate-swipe-right {
                    animation: swipe-right 3s ease-in-out infinite;
                }
            `}</style>
            

        </div >
    );
};