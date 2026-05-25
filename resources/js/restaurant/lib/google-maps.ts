/* eslint-disable @typescript-eslint/no-explicit-any */

// Shared Google Maps JS loader. The script can only be injected once with a
// fixed library set, so we always request `places` (needed for address
// autocomplete) and reuse the single in-flight promise across components.
let mapsPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    const w = window as unknown as { google?: { maps?: unknown } };
    if (w.google?.maps) return Promise.resolve();
    if (mapsPromise) return mapsPromise;

    mapsPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'google-maps-js';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
            mapsPromise = null; // allow a retry on next mount
            reject(new Error('Failed to load Google Maps'));
        };
        document.head.appendChild(script);
    });

    return mapsPromise;
}

export function getGoogle(): any {
    return (window as any).google;
}
