"use client";

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { EyeOff, ArrowRight } from 'lucide-react';
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
  const { showToast } = useToast();
  const fileInputOpenTimeRef = useRef<number>(0);
  const lastToastTimeRef = useRef<number>(0);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Instant zero-latency synchronous DOM class manipulation
  const activateShield = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('privacy-shield-active');
    }
  }, []);

  const deactivateShield = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('privacy-shield-active');
    }
  }, []);

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
    activateShield();
    wipeClipboard();
    triggerSecurityWarning();
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      // Only remove if window is currently focused
      if (document.hasFocus && document.hasFocus()) {
        deactivateShield();
      }
    }, 900);
  }, [activateShield, deactivateShield, wipeClipboard, triggerSecurityWarning]);

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

  // 2. Zero-Latency AutoBlur: Synchronously toggles CSS class on DOM event tick
  useEffect(() => {
    if (!enableAutoBlur) return;

    const handleWindowBlur = () => {
      if (Date.now() - fileInputOpenTimeRef.current < 60000) return;
      activateShield();
    };

    const handleWindowFocus = () => {
      deactivateShield();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (Date.now() - fileInputOpenTimeRef.current >= 60000) {
          activateShield();
        }
      } else {
        deactivateShield();
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      deactivateShield();
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableAutoBlur, activateShield, deactivateShield]);

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

      // Inspect Element / DevTools in production
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
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
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

  // Zero-DOM-Node Watermark: Single CSS Background Texture (0% CPU, GPU Cached)
  const watermarkStyle = useMemo(() => {
    if (!enableWatermark) return null;
    const text = currentUser?.anonymousId
      ? `OTHRHALFF // ${currentUser.anonymousId} // CONFIDENTIAL`
      : `OTHRHALFF // CONFIDENTIAL`;
    
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='120'><text x='50%' y='50%' font-size='9' font-family='monospace' font-weight='700' fill='white' transform='rotate(-20 150 60)' text-anchor='middle' letter-spacing='2'>${text}</text></svg>`;
    
    return {
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
      backgroundRepeat: 'repeat',
    };
  }, [enableWatermark, currentUser?.anonymousId]);

  return (
    <>
      {/* 1. Ultra-Lightweight Watermark Layer: 1 single DOM node, GPU texture */}
      {watermarkStyle && (
        <div 
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[85] opacity-[0.03] select-none"
          style={watermarkStyle}
        />
      )}

      {/* 2. Zero-Latency Hardware-Accelerated Privacy Screen (Managed directly by CSS class) */}
      <div 
        id="privacy-screen-overlay"
        onClick={deactivateShield}
        className="select-none cursor-pointer"
      >
        <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm pointer-events-auto">
          <div className="w-14 h-14 rounded-full bg-neon/15 border border-neon/40 flex items-center justify-center text-neon mb-4 shadow-[0_0_20px_rgba(255,0,127,0.35)]">
            <EyeOff className="w-7 h-7 text-white drop-shadow-[0_0_10px_#ff007f]" />
          </div>

          <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-pink-400 mb-1.5">
            [ SCREEN PROTECTED ]
          </p>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-white mb-2">
            OTHR<span className="text-neon">HALFF</span>
          </h2>

          <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">
            Content hidden for student privacy. Tap anywhere to resume.
          </p>

          <button
            onClick={deactivateShield}
            className="px-6 py-2.5 bg-neon hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>Resume</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
