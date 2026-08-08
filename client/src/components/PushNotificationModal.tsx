"use client";

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Sparkles, X, MessageSquareHeart, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToPushNotifications } from '../services/pushNotifications';
import { supabase } from '../lib/supabase';

const PUSH_COOLDOWN_KEY = 'othrhalff_push_prompt_cooldown';
const PUSH_NEVER_KEY = 'othrhalff_push_prompt_never';
const COOLDOWN_DAYS = 3;

export const PushNotificationModal: React.FC = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser || typeof window === 'undefined') return;

    // 1. Check if browser supports push
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    // 2. Do not show if already granted
    if (Notification.permission === 'granted') return;

    // 3. Do not show if user chose "Never show again"
    if (localStorage.getItem(PUSH_NEVER_KEY) === 'true') return;

    // 4. Check 3-day cooldown
    const cooldown = localStorage.getItem(PUSH_COOLDOWN_KEY);
    if (cooldown && Date.now() < parseInt(cooldown, 10)) return;

    // Show modal after 2 seconds on mount
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentUser]);

  const handleDismiss = (neverAgain = false) => {
    setIsOpen(false);
    if (neverAgain) {
      localStorage.setItem(PUSH_NEVER_KEY, 'true');
    } else {
      // Set 3-day cooldown
      const nextShow = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(PUSH_COOLDOWN_KEY, String(nextShow));
    }
  };

  const handleEnable = async () => {
    setIsSubmitting(true);
    try {
      const sessionRes = await supabase?.auth.getSession();
      const token = sessionRes?.data?.session?.access_token || '';
      const success = await subscribeToPushNotifications(token);
      if (success) {
        setIsOpen(false);
      } else {
        handleDismiss(false);
      }
    } catch (err) {
      console.warn('Failed to enable push:', err);
      handleDismiss(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn"
      onClick={() => handleDismiss(false)} // Tapping anywhere outside closes the modal
    >
      {/* Outer Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neon/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Modal Box */}
      <div 
        className="relative w-full max-w-md bg-[#0e0a16] border border-gray-800 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_60px_rgba(255,0,127,0.3)] text-center overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()} // Prevent inside clicks from closing
      >
        {/* Top Close Button */}
        <button 
          onClick={() => handleDismiss(false)}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing Bell Icon Header */}
        <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-neon to-purple-600 blur-md opacity-70 animate-pulse" />
          <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-tr from-neon to-purple-600 flex items-center justify-center border-2 border-white/20 shadow-lg">
            <BellRing className="w-9 h-9 text-white animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black text-white tracking-tight mb-2 font-geist">
          Never Miss a Campus Spark! ⚡
        </h3>

        {/* Body Text */}
        <p className="text-sm text-gray-300 leading-relaxed mb-6 font-medium">
          Enable notifications to receive personal updates from developers, instant match alerts & speed date invites from your campus.
        </p>

        {/* Benefit Highlights */}
        <div className="space-y-2.5 mb-6 text-left bg-gray-900/50 p-4 rounded-2xl border border-gray-800/60 text-xs">
          <div className="flex items-center gap-2.5 text-gray-200">
            <MessageSquareHeart className="w-4 h-4 text-neon flex-shrink-0" />
            <span>Direct personal updates & event alerts from devs</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-200">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>Instant notification when someone likes your profile</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-200">
            <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>Safe, zero-spam campus notifications</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Main Action Button */}
          <button
            onClick={handleEnable}
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-neon to-purple-600 hover:from-neon-hover hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,0,127,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Enabling...</span>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>Allow Notifications</span>
              </>
            )}
          </button>

          {/* Secondary Dismiss Actions */}
          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <button
              onClick={() => handleDismiss(false)}
              className="text-gray-500 hover:text-gray-300 font-semibold transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={() => handleDismiss(true)}
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
