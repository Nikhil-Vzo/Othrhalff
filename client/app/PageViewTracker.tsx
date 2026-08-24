'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Fires a GA4 page_view on every client-side route change.
 * Mount once in the root layout — the initial page load is already
 * tracked by the gtag config snippet, so this skips the first render.
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;
    if (!window.__pageViewTrackerInitialized) {
      // initial load: the inline gtag('config', ...) in layout.tsx already logged it
      window.__pageViewTrackerInitialized = true;
      return;
    }
    window.gtag('event', 'page_view', {
      page_path: pathname,
      page_title: document.title,
      page_location: window.location.origin + pathname,
    });
  }, [pathname]);

  return null;
}
