"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ghost, ShieldAlert, ArrowRight, EyeOff } from 'lucide-react';
import { StarField } from './StarField';
import { useToast } from '../context/ToastContext';

interface ScreenshotProtectionProps {
  currentUser?: {
    id?: string;
    anonymousId?: string;
    realName?: string | null;
    university?: string;
  } | null;
  enableAutoBlur?: boolean;
  enableWatermark?: boolean;
  enableShortcutBlock?: boolean;
}

export const ScreenshotProtection: React.FC<ScreenshotProtectionProps> = ({
  currentUser,
  enableAutoBlur = true,
  enableWatermark = true,
  enableShortcutBlock = true,
}) => {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [isScreenFlash, setIsScreenFlash] = useState(false);
  const { showToast } = useToast();
  
  const fileInputOpenTimeRef = useRef<number>(0);
  const lastToastTimeRef = useRef<number>(0);

  const triggerSecurityWarning = useCallback((message = 'Screenshots are restricted to safeguard student privacy.') => {
    const now = Date.now();
    if (now - lastToastTimeRef.current > 3000) {
      lastToastTimeRef.current = now;
      showToast(message, 'warning');
    }
  }, [showToast]);

  const wipeClipboard = useCallback(() => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('[Othrhalff Privacy Shield] Screenshots are restricted to safeguard student profiles and confidential messages.').catch(() => {});
      }
    } catch {
      // Ignore clipboard write failures
    }
  }, []);

  const flashPrivacyShield = useCallback(() => {
    setIsScreenFlash(true);
    wipeClipboard();
    triggerSecurityWarning();
    setTimeout(() => {
      setIsScreenFlash(false);
    }, 1200);
  }, [wipeClipboard, triggerSecurityWarning]);

  // 1. Detect file picker clicks to avoid triggering blur on legitimate photo uploads
  useEffect(() => {
    const handleFileInputClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'file') {
        fileInputOpenTimeRef.current = Date.now();
      }
    };

    document.addEventListener('click', handleFileInputClick, true);
    return () => {
      document.removeEventListener('click', handleFileInputClick, true);
    };
  }, []);

  // 2. AutoBlur: Obscure screen when window loses focus (e.g. Snipping Tool, Win+Shift+S, macOS capture tool)
  useEffect(() => {
    if (!enableAutoBlur) return;

    const handleWindowBlur = () => {
      // Don't blur if user just clicked a file upload input within the last 60 seconds
      if (Date.now() - fileInputOpenTimeRef.current < 60000) {
        return;
      }
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (Date.now() - fileInputOpenTimeRef.current >= 60000) {
          setIsWindowBlurred(true);
        }
      } else {
        setIsWindowBlurred(false);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableAutoBlur]);

  // 3. Keyboard Shortcut Interception (PrintScreen, Snipping Tool, Save, Print, DevTools)
  useEffect(() => {
    if (!enableShortcutBlock) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // PrintScreen / Screenshot Keys
      if (
        key === 'PrintScreen' ||
        e.keyCode === 44 ||
        (isCtrlOrMeta && e.shiftKey && (key === '3' || key === '4' || key === '5' || key === 's' || key === 'S')) ||
        (e.shiftKey && (key === 's' || key === 'S') && isCtrlOrMeta)
      ) {
        e.preventDefault();
        e.stopPropagation();
        flashPrivacyShield();
        return false;
      }

      // Print Prevention (Ctrl+P / Cmd+P)
      if (isCtrlOrMeta && (key === 'p' || key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning('Printing student profiles or messages is disabled.');
        return false;
      }

      // Save Page Prevention (Ctrl+S / Cmd+S)
      if (isCtrlOrMeta && (key === 's' || key === 'S') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning('Saving page source is restricted.');
        return false;
      }

      // View Source (Ctrl+U / Cmd+Option+U)
      if (isCtrlOrMeta && (key === 'u' || key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Inspect Element / DevTools (F12, Ctrl+Shift+I / J / C in production)
      if (
        key === 'F12' ||
        (isCtrlOrMeta && e.shiftKey && (key === 'i' || key === 'I' || key === 'j' || key === 'J' || key === 'c' || key === 'C'))
      ) {
        if (process.env.NODE_ENV === 'production') {
          e.preventDefault();
          e.stopPropagation();
          triggerSecurityWarning('Developer tools inspection is disabled.');
          return false;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        flashPrivacyShield();
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [enableShortcutBlock, flashPrivacyShield, triggerSecurityWarning]);

  // 4. Prevent Context Menu & Image Dragging
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;

      e.preventDefault();
      triggerSecurityWarning('Right-click saving is disabled for privacy.');
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO')) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('dragstart', handleDragStart, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('dragstart', handleDragStart, true);
    };
  }, [triggerSecurityWarning]);

  // User Identifier for Forensic Watermark
  const watermarkText = currentUser?.anonymousId
    ? `OTHRHALFF // ${currentUser.anonymousId} // ${currentUser.university ? currentUser.university.slice(0, 20) : 'CAMPUS'} // CONFIDENTIAL`
    : `OTHRHALFF // STUDENT COMMUNITY // STRICTLY CONFIDENTIAL`;

  return (
    <>
      {/* Dynamic Forensic Watermark Layer (Optical camera/phone leak deterrent) */}
      {enableWatermark && (
        <div 
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[85] select-none overflow-hidden opacity-[0.032]"
        >
          <div 
            className="w-[200vw] h-[200vh] -top-[50vh] -left-[50vw] absolute flex flex-wrap gap-x-16 gap-y-16 rotate-[-22deg] justify-center items-center font-mono font-black text-[11px] text-white tracking-[0.25em]"
          >
            {Array.from({ length: 64 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap select-none">
                {watermarkText}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Screen Capture Flash Shield (Fires on PrintScreen keyup/keydown) */}
      {isScreenFlash && (
        <div 
          className="fixed inset-0 bg-black z-[99999] flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-100"
        >
          <div className="w-16 h-16 rounded-full bg-neon/20 border border-neon flex items-center justify-center text-neon mb-4 shadow-[0_0_30px_#ff007f]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2">
            SCREENSHOT RESTRICTED
          </h2>
          <p className="text-xs text-gray-400 max-w-xs font-mono tracking-wider">
            Student privacy protection active. Clipboard cleared.
          </p>
        </div>
      )}

      {/* AutoBlur Focus Loss Shield (Fires when Snipping Tool or OS Capture steals focus) */}
      {isWindowBlurred && (
        <div 
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 bg-black z-[99990] flex flex-col items-center justify-center text-center p-6 select-none cursor-pointer transition-all duration-200 animate-in fade-in"
        >
          {/* Live Starfield Canvas in Background */}
          <StarField />

          {/* Ambient Neon Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-neon/15 blur-[160px] pointer-events-none" />

          {/* Foreground Privacy Screen */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
            
            {/* Subtle Glowing Ghost Mascot */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-neon/25 blur-2xl pointer-events-none scale-125" />
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neon/15 border border-neon/40 flex items-center justify-center text-neon shadow-[0_0_30px_rgba(255,0,127,0.5)]">
                <EyeOff className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-[0_0_15px_#ff007f]" />
              </div>
            </div>

            {/* Minimal Monospace Status Tag */}
            <p className="text-[11px] sm:text-xs font-mono tracking-[0.3em] uppercase text-pink-400 mb-2">
              [ PRIVACY // SHIELD ACTIVE ]
            </p>

            {/* Simple Bold Coloured Typography */}
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase text-white mb-2">
              SCREEN <span className="text-neon drop-shadow-[0_0_20px_#ff007f]">PROTECTED</span>
            </h2>

            <p className="text-sm sm:text-base font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-300 mb-3">
              DISPLAY OBSCURED DURING SCREEN CAPTURE
            </p>

            {/* Clean Message */}
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed mb-8">
              Window is inactive or capture tool was detected. Content is obscured to safeguard student profiles and messages.
            </p>

            {/* Resume Button */}
            <button
              onClick={() => setIsWindowBlurred(false)}
              className="px-8 py-3.5 bg-neon hover:bg-pink-600 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-[0_0_25px_rgba(255,0,127,0.55)] hover:shadow-[0_0_35px_rgba(255,0,127,0.8)] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Resume Viewing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
