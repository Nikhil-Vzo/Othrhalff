"use client";

import React, { useEffect, useRef } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  height?: string;
  zIndex?: number;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  height = '80dvh',
  zIndex = 190,
  children
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Touch drag-down to dismiss on mobile
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || !open) return;

    let startY = 0;
    let curDy = 0;
    let dragging = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      curDy = 0;
      dragging = false;
    };

    const onMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dy = y - startY;
      const scroller = el.querySelector('[data-sheet-scroll]') as HTMLElement | null;
      const atTop = !scroller || scroller.scrollTop <= 5;

      if (dy > 0 && atTop) {
        dragging = true;
        el.style.transform = `translateY(${dy}px)`;
        el.style.transition = 'none';
        if (e.cancelable) e.preventDefault();
      }
    };

    const onEnd = () => {
      if (dragging) {
        el.style.transition = 'transform 0.2s ease-out';
        if (curDy > 120) {
          el.style.transform = 'translateY(100%)';
          setTimeout(onClose, 200);
        } else {
          el.style.transform = 'translateY(0)';
        }
      }
      dragging = false;
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 select-auto" style={{ zIndex }}>
      {/* 1. Backdrop (Dim overlay, click anywhere to close) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
      />

      {/* 2. Responsive Panel: Bottom Sheet on Mobile | Floating Right Drawer on Desktop */}
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:top-20 md:right-6 md:w-[440px] md:max-w-[calc(100vw-2rem)] h-[80dvh] md:h-[78vh] max-h-[82vh] bg-[#0d0716] border-t md:border border-purple-500/30 rounded-t-3xl md:rounded-3xl flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-slide-up md:animate-fade-in-down"
      >
        {/* Mobile drag handle bar */}
        <div className="flex md:hidden justify-center pt-2.5 pb-1 shrink-0 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
