// Helper to safely store in sessionStorage with quota handling
export const safeSetItem = (key: string, value: string) => {
    try {
        sessionStorage.setItem(key, value);
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            console.warn('Session storage quota exceeded. Clearing old cache.');
            // Strategy: Clear EVERYTHING from session storage as a fallback, 
            // or just don't cache this item. 
            // For now, let's try clearing everything and retrying once.
            try {
                sessionStorage.clear();
                sessionStorage.setItem(key, value);
            } catch (retryError) {
                console.error('Failed to cache data even after clearing storage:', retryError);
            }
        }
    }
};
export const deferSafeSetItem = (key: string, getValue: () => string) => {
    if (typeof window === 'undefined') return;

    const write = () => {
        try {
            safeSetItem(key, getValue());
        } catch (e) {
            console.warn('Failed to prepare deferred session storage value:', e);
        }
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(write, { timeout: 1000 });
        return;
    }

    globalThis.setTimeout(write, 0);
};
