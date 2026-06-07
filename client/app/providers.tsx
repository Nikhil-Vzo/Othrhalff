"use client";

import React from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { PresenceProvider } from '../src/context/PresenceContext';
import { CallProvider } from '../src/context/CallContext';
import { ToastProvider } from '../src/context/ToastContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PresenceProvider>
          <CallProvider>
            <ToastProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </ToastProvider>
          </CallProvider>
        </PresenceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
