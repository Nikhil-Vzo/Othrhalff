"use client";

import React, { useEffect } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { PresenceProvider } from '../src/context/PresenceContext';
import { CallProvider } from '../src/context/CallContext';
import { ToastProvider } from '../src/context/ToastContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { MusicPlayerProvider } from '../src/context/MusicPlayerContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
    }
  }, []);
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PresenceProvider>
          <CallProvider>
            <ToastProvider>
              <NotificationProvider>
                <MusicPlayerProvider>
                  {children}
                </MusicPlayerProvider>
              </NotificationProvider>
            </ToastProvider>
          </CallProvider>
        </PresenceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
