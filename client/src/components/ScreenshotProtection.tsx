"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, ShieldAlert, Ghost, Sparkles, EyeOff } from 'lucide-react';
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
    // Throttle toast to once every 3 seconds
    if (now - lastToastTimeRef.current > 3000) {
      lastToastTimeRef.current = now;
      showToast(message, 'warning');
    }
  }, [showToast]);

  const wipeClipboard = useCallback(() => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('🔒 Screenshot Restricted: Othrhalff protects student profiles and confidential messages.').catch(() => {});
      }
    } catch {
      // Ignore clipboard write failures if not permitted
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
        // macOS Cmd + Shift + 3 / 4 / 5 / S
        (isCtrlOrMeta && e.shiftKey && (key === '3' || key === '4' || key === '5' || key === 's' || key === 'S')) ||
        // Windows Win+Shift+S triggers blur or key
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

      // Inspect Element / DevTools (F12, Ctrl+Shift+I / J / C)
      if (
        key === 'F12' ||
        (isCtrlOrMeta && e.shiftKey && (key === 'i' || key === 'I' || key === 'j' || key === 'J' || key === 'c' || key === 'C'))
      ) {
        // Only block in production to avoid hindering developer debugging
        if (process.env.NODE_ENV === 'production') {
          e.preventDefault();
          e.stopPropagation();
          triggerSecurityWarning('Developer tools inspection is disabled.');
          return false;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Windows often dispatches PrintScreen only on keyup
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

  // 4. Prevent Context Menu & Image Dragging (Right Click Protection)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Allow context menu only inside inputs and textareas for normal editing/pasting
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;

      // Block right-click on all images, videos, canvas, and profile cards
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
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
            Screenshots Disabled
          </h2>
          <p className="text-xs text-gray-400 max-w-xs font-mono">
            Student privacy protection active. Clipboard cleared.
          </p>
        </div>
      )}

      {/* AutoBlur Focus Loss Shield (Fires when Snipping Tool or OS Capture steals focus) */}
      {isWindowBlurred && (
        <div 
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 backdrop-blur-3xl bg-black/90 z-[99990] flex flex-col items-center justify-center text-center p-6 select-none cursor-pointer transition-all duration-200 animate-in fade-in"
        >
          {/* Glowing Othrhalff Privacy Shield Card */}
          <div className="max-w-md w-full bg-[#0d0716]/95 border border-pink-500/35 rounded-3xl p-8 shadow-[0_0_60px_rgba(255,0,127,0.3)] text-center relative overflow-hidden">
            
            {/* Top glowing neon accent */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-neon to-transparent" />

            <div className="inline-flex items-center gap-2 justify-center mb-5">
              <div className="relative">
                <Ghost className="w-6 h-6 text-neon drop-shadow-[0_0_10px_rgba(255,0,127,0.7)] rotate-6" />
                <Sparkles className="w-2.5 h-2.5 text-white absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-base font-black text-white tracking-tighter uppercase">
                Othr<span className="text-neon">Halff</span>
              </span>
            </div>

            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-pink-600/30 to-purple-600/30 border border-pink-500/40 flex items-center justify-center text-pink-300 shadow-[0_0_20px_rgba(255,0,127,0.4)]">
              <EyeOff className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
              Privacy Shield Active
            </h3>

            <p className="text-xs text-gray-300 font-medium leading-relaxed mb-6">
              Content is protected while window is inactive or screen capture is detected.
            </p>

            <button
              onClick={() => setIsWindowBlurred(false)}
              className="px-6 py-2.5 bg-neon hover:bg-pink-600 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(255,0,127,0.5)] transition-all active:scale-95 cursor-pointer"
            >
              Resume Viewing
            </button>
          </div>
        </div>
      )}
    </>
  );
};
