"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useNotifications } from '../context/NotificationContext';
import { Ghost, Search, MessageCircle, Bell, CalendarHeart, User, MessageSquarePlus, Sparkles, MoreHorizontal, Zap, Gamepad2, Home } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StarField } from '../components/StarField';
import { supabase } from '../lib/supabase';
import { AuthPromptModal } from '../components/AuthPromptModal';
import { getOptimizedUrl, handleImageError } from '../utils/image';

const VideoCall = dynamic(() => import('../components/VideoCall').then(mod => mod.VideoCall), {
  ssr: false
});

import { IncomingCallModal } from '../components/IncomingCallModal';
import { OutgoingCallModal } from '../components/OutgoingCallModal';
import { PushNotificationModal } from '../components/PushNotificationModal';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enforce auth & onboarding routing
  useEffect(() => {
    if (!mounted || isLoading) return;

    const PUBLIC_ROUTES = ['/', '/login', '/about', '/privacy', '/terms', '/developers', '/guidelines', '/contact', '/safety', '/maintenance', '/blog', '/vs-omegle', '/careers', '/reddit'];
    const isPublicSEOPath = pathname.startsWith('/vs/') || pathname.startsWith('/campus/') || pathname.startsWith('/tea/');

    // If unauthenticated and accessing a protected view, send to login
    if (!currentUser && !PUBLIC_ROUTES.includes(pathname) && !isPublicSEOPath && pathname !== '/onboarding') {
      router.push('/login');
      return;
    }

    // If authenticated and visiting login page, redirect to home or onboarding
    if (currentUser && pathname === '/login') {
      const target = needsOnboarding ? '/onboarding' : '/home';
      router.replace(target);
      return;
    }

    // If needs onboarding and attempting to access a protected route, redirect to onboarding
    if (currentUser && needsOnboarding && !PUBLIC_ROUTES.includes(pathname) && pathname !== '/onboarding') {
      router.push('/onboarding');
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
    { path: '/matches', icon: MessageCircle, label: 'Messages', badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { path: '/notifications', icon: Bell, label: 'Notifications', isPulse: unreadCount > 0 },
    { path: '/confessions', icon: MessageSquarePlus, label: 'Confessions' },
    { path: '/sparx', icon: Zap, label: 'Sparx' },
    { path: '/profile', icon: User, label: 'My Profile' },
  ];

  const isHome = pathname === '/home';

  return (
    <div className="flex h-[100dvh] bg-black text-white font-sans overflow-hidden selection:bg-neon selection:text-white">
      {/* Desktop Sidebar Placeholder to prevent layout shift */}
      <div className="hidden md:block shrink-0 h-full bg-black z-10 w-[280px]" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col bg-black z-50 absolute left-0 top-0 bottom-0 w-[280px] shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="w-full flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-8 pb-4 flex justify-start">
            <div
              role="button"
              tabIndex={0}
              className="group flex items-center cursor-pointer select-none gap-3"
              onClick={() => handleNavClick('/home')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavClick('/home'); } }}
              aria-label="Go to home"
            >
              <div className="relative shrink-0">
                <Ghost className="w-8 h-8 text-neon drop-shadow-[0_0_8px_rgba(255,0,127,0.5)] group-hover:rotate-12 transition-transform duration-300" />
                <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="flex flex-col overflow-hidden whitespace-nowrap max-w-[200px] opacity-100">
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none flex gap-1">
                  <span>Othr</span>
                  <span className="text-neon">Halff</span>
                </h1>
                <span className="text-[9px] font-bold text-gray-500 tracking-[0.3em] uppercase pl-0.5 group-hover:text-neon transition-colors duration-300">
                  Campus Dating
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-4">
              Menu
            </div>

            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full relative group flex items-center justify-start gap-4 p-3 px-5 py-3.5 rounded-2xl transition-all duration-300 ease-out border overflow-hidden
                    ${active
                      ? 'bg-gray-900/80 border-neon/30 text-white shadow-[0_0_20px_rgba(255,0,127,0.1)]'
                      : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-900/50 hover:text-gray-200 hover:border-gray-800'
                    }`}
                >
                  {/* Active Indicator Line */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon rounded-r-full shadow-[0_0_10px_#ff007f]" />
                  )}

                  {/* Hover Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-neon/10 to-transparent opacity-0 transition-opacity duration-300 ${active ? 'opacity-100' : 'group-hover:opacity-30'}`} />

                  {/* Icon */}
                  <item.icon
                    className={`w-5 h-5 shrink-0 relative z-10 transition-transform duration-300 ${active ? 'text-neon scale-110 drop-shadow-[0_0_5px_rgba(255,0,127,0.5)]' : 'group-hover:scale-110 group-hover:text-gray-300'}`}
                    strokeWidth={active ? 2.5 : 2}
                  />

                  {/* Label */}
                  <span className={`text-sm font-bold tracking-wide relative z-10 whitespace-nowrap max-w-[200px] opacity-100 transition-all duration-300 ${active ? 'text-white' : ''}`}>
                    {item.label}
                  </span>

                  {/* Badges/Indicators */}
                  <div className="ml-auto relative z-10 flex items-center gap-2 max-w-[50px] opacity-100">
                    {item.badge && (
                      <span className="bg-neon text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,0,127,0.4)]">
                        {item.badge}
                      </span>
                    )}
                    {item.isPulse && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon"></span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* User Profile Card */}
          <div className="p-4 border-t border-gray-900/50 bg-black/50">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleNavClick('/profile')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavClick('/profile'); } }}
              aria-label="Go to your profile"
              className="relative group rounded-2xl bg-gradient-to-b from-black to-black border border-gray-800 hover:border-neon/30 transition-all duration-300 cursor-pointer overflow-hidden flex items-center p-3 justify-start"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-neon/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-center gap-3 relative z-10 w-full">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-neon transition-colors duration-300">
                    {currentUser?.avatar ? (
                      <img src={getOptimizedUrl(currentUser.avatar, 64)} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{currentUser?.anonymousId ? currentUser.anonymousId.slice(-2) : '??'}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse shadow-md"></div>
                </div>

                {/* Info */}
                <div className="overflow-hidden whitespace-nowrap max-w-[150px] opacity-100 transition-all duration-300">
                  <p className="text-sm font-bold text-white truncate group-hover:text-neon transition-colors">
                    {currentUser?.realName || 'Anonymous'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon/50"></div>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider truncate">
                      {currentUser?.anonymousId || 'GUEST'}
                    </p>
                  </div>
                </div>

                {/* Options Icon */}
                <div className="text-gray-600 hover:text-white transition-colors duration-300 shrink-0 max-w-[20px] opacity-100 ml-auto">
                  <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-black">
        {currentUser && !currentUser.username && (
          <div className="bg-gradient-to-r from-purple-950/80 via-gray-900 to-pink-950/80 border-b border-neon/30 px-4 py-2 flex items-center justify-between text-xs text-gray-200 z-50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
              <span>Add a <strong className="text-white">@username</strong> to enable direct login!</span>
            </div>
            <button 
              onClick={() => router.push('/profile')}
              className="bg-neon/20 hover:bg-neon/30 border border-neon/50 text-neon px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95"
            >
              Set Up Now
            </button>
          </div>
        )}
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
        {!(pathname.startsWith('/chat') || pathname === '/discover' || pathname.startsWith('/sparx/cinema') || pathname.startsWith('/sparx/music')) && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none">
            {/* The main bar background */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-md border-t-[1.5px] border-gray-800 pointer-events-auto" />
            
            {/* The center bump */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-20 bg-black/95 backdrop-blur-md rounded-full border-t-[1.5px] border-gray-800 pointer-events-auto flex items-center justify-center overflow-hidden">
               {/* Inner glow for the bump */}
               <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-30" />
            </div>

            {/* Glowing arc line over the bump */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-t-2 border-neon/50 shadow-[0_-5px_15px_rgba(255,0,127,0.3)] pointer-events-none" />
            
            {/* Nav Items Container */}
            <div className="relative z-10 grid grid-cols-5 h-16 w-full items-center pointer-events-auto">
              
              {/* 1. Confess */}
              <button
                onClick={() => handleNavClick('/confessions')}
                className={`flex flex-col items-center justify-center gap-1 ${isActive('/confessions') ? 'text-white' : 'text-gray-500'}`}
              >
                <MessageSquarePlus className={`w-5 h-5 transition-transform ${isActive('/confessions') ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} strokeWidth={isActive('/confessions') ? 2.5 : 2} />
                <span className="text-[9px] font-bold tracking-wider">CONFESS</span>
              </button>

              {/* 2. Playground */}
              <button
                onClick={() => handleNavClick('/playground')}
                className={`flex flex-col items-center justify-center gap-1 relative ${isActive('/playground') ? 'text-white' : 'text-gray-500'}`}
              >
                <Gamepad2 className={`w-5 h-5 transition-transform ${isActive('/playground') ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} strokeWidth={isActive('/playground') ? 2.5 : 2} />
                <span className="text-[9px] font-bold tracking-wider uppercase">PLAYGROUND</span>
              </button>

              {/* 3. Center Spacer */}
              <div className="w-full h-full" />

              {/* 4. Sparx */}
              <button
                onClick={() => handleNavClick('/sparx')}
                className={`flex flex-col items-center justify-center gap-1 ${isActive('/sparx') ? 'text-white' : 'text-gray-500'}`}
              >
                <Zap className={`w-5 h-5 transition-transform ${isActive('/sparx') ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} strokeWidth={isActive('/sparx') ? 2.5 : 2} />
                <span className="text-[9px] font-bold tracking-wider">SPARX</span>
              </button>

              {/* 5. Chats */}
              <button
                onClick={() => handleNavClick('/matches')}
                className={`flex flex-col items-center justify-center gap-1 relative ${isActive('/matches') ? 'text-white' : 'text-gray-500'}`}
              >
                <div className="relative">
                  <MessageCircle className={`w-5 h-5 transition-transform ${isActive('/matches') ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} strokeWidth={isActive('/matches') ? 2.5 : 2} />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] flex items-center justify-center bg-neon text-white text-[8px] font-bold rounded-full px-1 shadow-[0_0_5px_rgba(255,0,127,0.5)]">
                      {unreadMessageCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold tracking-wider">CHATS</span>
              </button>
            </div>

            {/* Center Floating Button (Discover/Home) */}
            <button
              onClick={() => handleNavClick('/home')}
              className="absolute left-1/2 -translate-x-1/2 bottom-8 w-14 h-14 flex flex-col items-center justify-center rounded-full z-20 transition-transform active:scale-95 pointer-events-auto"
            >
              <div className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr ${isActive('/home') ? 'from-neon to-purple-600 shadow-[0_0_20px_rgba(255,0,127,0.8)]' : 'from-gray-800 to-gray-700 shadow-[0_4px_10px_rgba(0,0,0,0.5)]'}`}>
                <Home className={`w-6 h-6 ${isActive('/home') ? 'text-white' : 'text-gray-300'}`} strokeWidth={2.5} />
              </div>
              {isActive('/home') && <span className="absolute -bottom-5 text-[10px] font-bold text-neon tracking-wider drop-shadow-[0_0_4px_rgba(255,0,127,0.8)]">HOME</span>}
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
    </div>
  );
};

export default AppLayout;