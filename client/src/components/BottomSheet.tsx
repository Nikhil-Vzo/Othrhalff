"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

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
  height = '75dvh',
  zIndex = 190,
  children
}) => {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<any>(null);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    const el = sheetRef.current;
    if (el) {
      el.style.transition = '';
      el.style.transform = '';
    }
    if (backdropRef.current) backdropRef.current.style.opacity = '';
    closeTimer.current = setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onClose();
    }, 210);
  }, [closing, onClose]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      requestClose();
    }
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };

    const mq = window.matchMedia('(min-width: 768px)');
    const onMq = () => {
      if (mq.matches) requestClose();
    };

    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      clearTimeout(closeTimer.current);
    };
  }, [visible, requestClose]);

  // Native (non-passive) drag listener
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || !visible) return;

    let startY = 0;
    let curDy = 0;
    let lastY = 0;
    let lastT = 0;
    let vel = 0;
    let active = false;
    let dragging = false;

    const onStart = (e: TouchEvent) => {
      startY = lastY = e.touches[0].clientY;
      lastT = Date.now();
      vel = 0;
      curDy = 0;
      active = true;
      dragging = false;
    };

    const onMove = (e: TouchEvent) => {
      if (!active) return;
      const y = e.touches[0].clientY;
      const dy = y - startY;
      const scroller = el.querySelector('[data-sheet-scroll]') as HTMLElement | null;
      const atTop = !scroller || scroller.scrollTop <= 0;

      if (dy > 0 && atTop) {
        if (!dragging) {
          dragging = true;
          el.style.transition = 'none';
        }
        curDy = dy;
        el.style.transform = `translateY(${dy}px)`;
        if (backdropRef.current) {
          backdropRef.current.style.opacity = String(Math.max(0, 1 - dy / 400));
        }
        const now = Date.now();
        vel = (y - lastY) / Math.max(1, now - lastT);
        lastY = y;
        lastT = now;
        e.preventDefault();
      } else if (dy < 0) {
        active = false;
      }
    };

    const onEnd = () => {
      if (dragging) {
        dragging = false;
        active = false;
        el.style.transition = '';
        if (curDy > 140 || vel > 0.5) {
          requestClose();
        } else {
          el.style.transform = '';
          if (backdropRef.current) backdropRef.current.style.opacity = '';
        }
      }
      active = false;
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
  }, [visible, requestClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 md:hidden" style={{ zIndex }}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={requestClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          closing ? 'opacity-0' : ''
        }`}
      />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        className={`absolute inset-x-0 bottom-0 bg-[#07050d] border-t border-purple-500/30 rounded-t-3xl flex flex-col shadow-2xl ${
          closing ? 'animate-slide-down' : 'animate-slide-up'
        }`}
        style={{
          height,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Drag pill handle */}
        <div className="flex justify-center pt-2.5 pb-1.5 shrink-0 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
