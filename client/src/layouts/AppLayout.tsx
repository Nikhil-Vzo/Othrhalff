"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useNotifications } from '../context/NotificationContext';
import { Ghost, Search, MessageCircle, Bell, CalendarHeart, User, MessageSquarePlus, Sparkles, MoreHorizontal, Zap, Gamepad2, Home, Lock, Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StarField } from '../components/StarField';
import { supabase } from '../lib/supabase';
import { AuthPromptModal } from '../components/AuthPromptModal';
import { getOptimizedUrl, handleImageError } from '../utils/image';
import { PLAYGROUND_CONFIG } from '../constants';

const VideoCall = dynamic(() => import('../components/VideoCall').then(mod => mod.VideoCall), {
  ssr: false
});

import { IncomingCallModal } from '../components/IncomingCallModal';
import { OutgoingCallModal } from '../components/OutgoingCallModal';
import { PushNotificationModal } from '../components/PushNotificationModal';
import { ScreenshotProtection } from '../components/ScreenshotProtection';
import { FloatingMusicMiniPlayer } from '../components/FloatingMusicMiniPlayer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentUser, needsOnboarding, isLoading } = useAuth();
  const { 
    isCallActive, 
    appId, 
    channelName, 
    token, 
    partnerName, 
    partnerAvatar, 
    callType, 
    callSessionId, 
    endCall,
    incomingCall,
    outgoingCall,
    acceptCall,
    rejectCall,
    cancelOutgoingCall
  } = useCall();
  const { unreadCount, unreadMessageCount } = useNotifications();
  const pathname = usePathname() || '';
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDiscoverMatchmaking, setIsDiscoverMatchmaking] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleDiscoverMatchmaking = (e: any) => {
      setIsDiscoverMatchmaking(!!e.detail?.active);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('discover-matchmaking', handleDiscoverMatchmaking);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('discover-matchmaking', handleDiscoverMatchmaking);
    };
  }, []);

  useEffect(() => {
    if (pathname !== '/discover') {
      setIsDiscoverMatchmaking(false);
    }
  }, [pathname]);

  // Enforce auth & onboarding routing
  useEffect(() => {
    if (!mounted || isLoading) return;

    const PUBLIC_ROUTES = ['/', '/login', '/confessions', '/about', '/privacy', '/terms', '/guidelines', '/contact', '/safety', '/maintenance', '/blog', '/vs-omegle', '/careers', '/reddit', '/developers'];
    // SEO-01: blog article URLs (/blog/<slug>) are public, same as the /blog
    // index. PUBLIC_ROUTES only exact-matches, so without this prefix check
    // guests were redirected to /login even though the sitemap lists the posts.
    // SEO-02: same for compatibility pages (/compatibility/<type>-and-<type>).
    // They are generic, precomputed pair results; the only login-gated action
    // is the "find your match" CTA, which stays a link to /login.
    const isPublicSEOPath = pathname.startsWith('/vs/') || pathname.startsWith('/campus/') || pathname.startsWith('/tea/') || pathname.startsWith('/blog/') || pathname.startsWith('/compatibility/');

    // If unauthenticated and accessing a protected view, send to login
    if (!currentUser && !PUBLIC_ROUTES.includes(pathname) && !isPublicSEOPath && pathname !== '/onboarding') {
      router.replace('/login');
      return;
    }

    // If authenticated and visiting login page, redirect to home or onboarding
    if (currentUser && pathname === '/login') {
      const target = needsOnboarding ? '/onboarding' : '/home';
      router.replace(target);
      return;
    }

    // If authenticated and visiting onboarding page when already completed onboarding, redirect to home
    if (currentUser && !needsOnboarding && pathname === '/onboarding') {
      router.replace('/home');
      return;
    }

    // If needs onboarding and attempting to access a protected route, redirect to onboarding
    if (currentUser && needsOnboarding && !PUBLIC_ROUTES.includes(pathname) && !isPublicSEOPath && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [mounted, isLoading, currentUser, needsOnboarding, pathname, router]);

  const [showAuthModal, setShowAuthModal] = useState(false);

  const isActive = (path: string) => {
    if (pathname === path) return true;
    if (path !== '/' && pathname.startsWith(path + '/')) return true;
    if (path === '/matches' && pathname.startsWith('/chat/')) return true;
    return false;
  };

  // Paths that should display the sidebar and bottom navigation
  const isAuthenticatedPath =
    pathname === '/home' ||
    pathname === '/discover' ||
    pathname === '/matches' ||
    pathname === '/confessions' ||
    pathname === '/notifications' ||
    pathname === '/playground' ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/sparx');

  const isPublicConfessions = pathname === '/confessions' && !currentUser;

  // Determine if we should show the StarField background animation
  const showStars =
    ['/home', '/matches', '/notifications', '/confessions', '/discover', '/vs-omegle'].includes(pathname) ||
    pathname.startsWith('/campus') ||
    pathname.startsWith('/vs');

  if (!mounted || (!currentUser && !isPublicConfessions) || !isAuthenticatedPath) {
    return <>{children}</>;
  }

  const handleNavClick = (path: string) => {
    if (!currentUser && path !== '/confessions') {
      setShowAuthModal(true);
    } else {
      router.push(path);
    }
  };

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/discover', icon: Search, label: 'Discover' },
    { 
      path: '/playground', 
      icon: PLAYGROUND_CONFIG.isLocked ? Lock : Gamepad2, 
      label: 'Playground' 
    },
    { path: '/matches', icon: MessageCircle, label: 'Messages', badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { path: '/notifications', icon: Bell, label: 'Notifications', isPulse: unreadCount > 0 },
    { path: '/confessions', icon: MessageSquarePlus, label: 'Confessions' },
    { path: '/sparx', icon: Zap, label: 'Sparx' },
    { path: '/profile', icon: User, label: 'Profile', isProfile: true },
  ];

  const isHome = pathname === '/home';

  return (
    <div className="flex h-[100dvh] bg-black text-white font-sans overflow-hidden selection:bg-neon selection:text-white">
      {/* Global Screenshot Protection Shield */}
      <ScreenshotProtection currentUser={currentUser} />

      {/* Desktop Sidebar Placeholder to prevent layout shift */}
      {!isFullscreen && (
        <div className="hidden md:block shrink-0 h-full bg-black z-10 w-[245px]" />
      )}

      {/* Desktop Sidebar (Instagram Web Style) */}
      {!isFullscreen && (
        <aside className="hidden md:flex flex-col bg-black z-50 absolute left-0 top-0 bottom-0 w-[245px] border-r border-[#262626]">
        <div className="w-full flex flex-col h-full">
          {/* Brand Header */}
          <div className="px-6 pt-9 pb-6 flex justify-start">
            <div
              role="button"
              tabIndex={0}
              className="group flex items-center cursor-pointer select-none gap-3"
              onClick={() => handleNavClick('/home')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavClick('/home'); } }}
              aria-label="Go to home"
            >
              <div className="relative shrink-0">
                <Ghost className="w-7 h-7 text-neon drop-shadow-[0_0_8px_rgba(255,0,127,0.5)] group-hover:scale-105 transition-transform duration-200" />
                <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="flex flex-col overflow-hidden whitespace-nowrap">
                <h1 className="text-2xl font-bold text-white tracking-tight leading-none flex gap-1">
                  <span>Othr</span>
                  <span className="text-neon">Halff</span>
                </h1>
                <span className="text-[8.5px] font-semibold text-neutral-500 tracking-[0.25em] uppercase pt-0.5">
                  Campus Connect
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items (Instagram Style) */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
            {navItems.map((item: any) => {
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full h-12 px-3.5 my-0.5 rounded-xl flex items-center gap-4 text-[15px] transition-all duration-150 select-none group active:scale-[0.98] ${
                    active
                      ? 'text-white font-bold bg-white/[0.08]'
                      : 'text-neutral-200 font-normal hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    {item.isProfile ? (
                      <div className={`w-6 h-6 rounded-full overflow-hidden transition-all duration-150 ${
                        active ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'border border-neutral-700'
                      }`}>
                        {currentUser?.avatar ? (
                          <img src={getOptimizedUrl(currentUser.avatar, 64)} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white">
                            {currentUser?.anonymousId ? currentUser.anonymousId.slice(-2) : '??'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <item.icon
                        className={`w-6 h-6 transition-transform duration-200 group-hover:scale-105 ${
                          active ? 'stroke-[2.5] text-white' : 'stroke-[1.75] text-neutral-200 group-hover:text-white'
                        }`}
                      />
                    )}

                    {/* Instagram-style badge directly on the icon */}
                    {item.badge ? (
                      <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-[#ff007f] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                        {item.badge}
                      </span>
                    ) : item.isPulse ? (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#ff007f] ring-2 ring-black" />
                    ) : null}
                  </div>

                  <span className={`truncate tracking-normal ${active ? 'font-bold text-white' : 'font-normal text-neutral-200'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Instagram-style Bottom "More" Button */}
          <div className="p-3 border-t border-[#262626]">
            <button
              onClick={() => handleNavClick('/profile')}
              className="w-full h-12 px-3.5 rounded-xl flex items-center gap-4 text-[15px] font-normal text-neutral-200 hover:text-white hover:bg-white/[0.05] transition-all duration-150 select-none group active:scale-[0.98]"
            >
              <Menu className="w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-105 stroke-[1.75] text-white" />
              <span>More</span>
            </button>
          </div>
        </div>
      </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-black">
        {showStars && <StarField />}
        
        {/* Mobile Top-Left Profile Picture */}
        {isHome && currentUser && (
          <div className="md:hidden absolute top-4 left-4 z-50">
            <button 
              onClick={() => handleNavClick('/profile')} 
              className="relative block rounded-full shadow-lg"
              aria-label="Go to your profile"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700 active:scale-95 transition-transform duration-200 bg-gray-900">
                {currentUser?.avatar ? (
                  <img src={getOptimizedUrl(currentUser.avatar, 64)} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{currentUser?.anonymousId ? currentUser.anonymousId.slice(-2) : '??'}</span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-md"></div>
            </button>
          </div>
        )}

        <div className={`flex-1 relative w-full h-full z-10 bg-transparent layout-content-wrapper ${
          (pathname.startsWith('/sparx/music/admin') || !isAuthenticatedPath) ? 'overflow-y-auto' : 'overflow-hidden'
        }`}>
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        {!isFullscreen && !(
          pathname.startsWith('/chat') ||
          (pathname === '/discover' && isDiscoverMatchmaking) ||
          pathname.startsWith('/sparx/cinema') ||
          pathname.startsWith('/sparx/music')
        ) && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-[#262626] pb-safe h-14 flex items-center justify-around px-2">
            {/* 1. Home */}
            <button
              onClick={() => handleNavClick('/home')}
              className="flex items-center justify-center p-2 text-white active:scale-90 transition-transform"
              aria-label="Home"
            >
              <Home className={`w-6 h-6 ${isActive('/home') ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            </button>

            {/* 2. Discover */}
            <button
              onClick={() => handleNavClick('/discover')}
              className="flex items-center justify-center p-2 text-white active:scale-90 transition-transform"
              aria-label="Discover"
            >
              <Search className={`w-6 h-6 ${isActive('/discover') ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            </button>

            {/* 3. Confessions (Create) */}
            <button
              onClick={() => handleNavClick('/confessions')}
              className="flex items-center justify-center p-2 text-white active:scale-90 transition-transform"
              aria-label="Confessions"
            >
              <MessageSquarePlus className={`w-6 h-6 ${isActive('/confessions') ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            </button>

            {/* 4. Messages (DMs) */}
            <button
              onClick={() => handleNavClick('/matches')}
              className="relative flex items-center justify-center p-2 text-white active:scale-90 transition-transform"
              aria-label="Messages"
            >
              <MessageCircle className={`w-6 h-6 ${isActive('/matches') ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              {unreadMessageCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-[#ff007f] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
                  {unreadMessageCount}
                </span>
              )}
            </button>

            {/* 5. Profile */}
            <button
              onClick={() => handleNavClick('/profile')}
              className="flex items-center justify-center p-2 active:scale-90 transition-transform"
              aria-label="Profile"
            >
              <div className={`w-6 h-6 rounded-full overflow-hidden transition-all duration-150 ${
                isActive('/profile') ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'border border-neutral-700'
              }`}>
                {currentUser?.avatar ? (
                  <img src={getOptimizedUrl(currentUser.avatar, 64)} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[9px] font-bold text-white">
                    {currentUser?.anonymousId ? currentUser.anonymousId.slice(-2) : '??'}
                  </div>
                )}
              </div>
            </button>
          </nav>
        )}
      </main>

      {/* Global Video Call Overlay */}
      {isCallActive && (
        <VideoCall
          appId={appId}
          channelName={channelName}
          token={token}
          onLeave={endCall}
          partnerName={partnerName}
          partnerAvatar={partnerAvatar || ''}
          callType={callType}
          callSessionId={callSessionId}
        />
      )}

      {/* Incoming Call Modal Overlay */}
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          onAccept={acceptCall}
          onReject={rejectCall}
          isVideoCall={incomingCall.callType === 'video'}
        />
      )}

      {/* Outgoing Call Modal Overlay */}
      {outgoingCall && (
        <OutgoingCallModal
          receiverName={outgoingCall.receiverName}
          receiverAvatar={outgoingCall.receiverAvatar}
          onCancel={cancelOutgoingCall}
          isVideoCall={outgoingCall.callType === 'video'}
        />
      )}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <PushNotificationModal />
      <FloatingMusicMiniPlayer />
    </div>
  );
};

export default AppLayout;