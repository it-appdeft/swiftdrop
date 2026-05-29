/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getGoogle, loadGoogleMaps } from '../lib/google-maps';

// Default map center (Bengaluru) used until the partner drops a pin.
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

interface LocationMapPickerProps {
    apiKey: string | null;
    lat: number | null;
    lng: number | null;
    /** Used by the "Locate from address" geocode button. */
    address?: string;
    onChange: (lat: number, lng: number) => void;
}

export function LocationMapPicker({ apiKey, lat, lng, address, onChange }: LocationMapPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const geocoderRef = useRef<any>(null);
    // Keep the latest onChange without re-initialising the map.
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    // Last coordinate we emitted, so the external-sync effect can tell our own
    // drag/click echo apart from a change coming from address autocomplete.
    const lastEmittedRef = useRef<{ lat: number; lng: number } | null>(null);

    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [locating, setLocating] = useState(false);

    useEffect(() => {
        if (!apiKey) {
            setStatus('error');
            return;
        }

        let cancelled = false;
        setStatus('loading');

        loadGoogleMaps(apiKey)
            .then(() => {
                if (cancelled || !containerRef.current) return;
                const g = getGoogle();
                const hasPin = lat != null && lng != null;
                const center = hasPin ? { lat: lat as number, lng: lng as number } : DEFAULT_CENTER;

                const map = new g.maps.Map(containerRef.current, {
                    center,
                    zoom: hasPin ? 16 : 12,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    clickableIcons: false,
                });

                const marker = new g.maps.Marker({
                    position: center,
                    map,
                    draggable: true,
                });

                const commit = (pos: any) => {
                    const la = pos.lat();
                    const ln = pos.lng();
                    lastEmittedRef.current = { lat: la, lng: ln };
                    onChangeRef.current(la, ln);
                };
                marker.addListener('dragend', () => commit(marker.getPosition()));
                map.addListener('click', (e: any) => {
                    marker.setPosition(e.latLng);
                    commit(e.latLng);
                });

                mapRef.current = map;
                markerRef.current = marker;
                geocoderRef.current = new g.maps.Geocoder();
                setStatus('ready');
            })
            .catch(() => {
                if (!cancelled) setStatus('error');
            });

        return () => {
            cancelled = true;
        };
        // Re-init only if the key changes; pin/onChange handled via refs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey]);

    // Move the pin when coordinates change from outside (address autocomplete /
    // "Locate from address"). Skips our own drag/click echo via lastEmittedRef.
    useEffect(() => {
        if (status !== 'ready' || lat == null || lng == null) return;
        const last = lastEmittedRef.current;
        const isEcho =
            last && Math.abs(last.lat - lat) < 1e-7 && Math.abs(last.lng - lng) < 1e-7;
        if (isEcho) return;
        markerRef.current?.setPosition({ lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(16);
    }, [lat, lng, status]);

    const locateFromAddress = () => {
        const query = (address ?? '').trim();
        if (!query || !geocoderRef.current || !mapRef.current) return;
        setLocating(true);
        geocoderRef.current.geocode({ address: query }, (results: any, gStatus: string) => {
            setLocating(false);
            if (gStatus !== 'OK' || !results?.[0]) return;
            const loc = results[0].geometry.location;
            mapRef.current.setCenter(loc);
            mapRef.current.setZoom(16);
            markerRef.current.setPosition(loc);
            lastEmittedRef.current = { lat: loc.lat(), lng: loc.lng() };
            onChangeRef.current(loc.lat(), loc.lng());
        });
    };

    if (!apiKey || status === 'error') {
        return (
            <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-input bg-muted/30 text-sm text-muted-foreground">
                <MapPin className="mr-2 size-4 text-primary" />
                Map unavailable — your typed address will still be used.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="relative overflow-hidden rounded-lg border border-input">
                <div ref={containerRef} className="h-64 w-full bg-muted/30" />
                {status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/40 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Loading map…
                    </div>
                )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                    {lat != null && lng != null
                        ? `Pin: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
                        : 'Click the map or drag the pin to set your exact location.'}
                </p>
                <button
                    type="button"
                    onClick={locateFromAddress}
                    disabled={!address?.trim() || locating}
                    className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {locating ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                        <LocateFixed className="size-3.5" />
                    )}
                    Locate from address
                </button>
            </div>
        </div>
    );
}
