/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';

import { getGoogle, loadGoogleMaps } from '../lib/google-maps';

export interface SelectedPlace {
    address: string;
    lat: number;
    lng: number;
    city: string | null;
    postcode: string | null;
}

interface AddressAutocompleteProps {
    apiKey: string | null;
    value: string;
    onChange: (value: string) => void;
    onSelect: (place: SelectedPlace) => void;
    placeholder?: string;
    invalid?: boolean;
}

/**
 * Full-address input wired to Google Places Autocomplete. Typing shows a
 * suggestion dropdown; picking one fires `onSelect` with the formatted address,
 * coordinates and parsed city/postcode — the caller uses that to move the map
 * pin. Falls back to a plain controlled input when no API key is configured.
 */
export function AddressAutocomplete({
    apiKey,
    value,
    onChange,
    onSelect,
    placeholder,
    invalid,
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<any>(null);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    useEffect(() => {
        if (!apiKey || !inputRef.current) return;
        let cancelled = false;

        loadGoogleMaps(apiKey)
            .then(() => {
                if (cancelled || !inputRef.current) return;
                const g = getGoogle();
                if (!g?.maps?.places?.Autocomplete) return;

                const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
                    fields: ['formatted_address', 'geometry', 'address_components'],
                    types: ['geocode'],
                });
                autocompleteRef.current = autocomplete;

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place?.geometry?.location) return;

                    const components: any[] = place.address_components ?? [];
                    const part = (type: string) =>
                        components.find((c) => c.types?.includes(type))?.long_name ?? null;

                    onSelectRef.current({
                        address: place.formatted_address ?? inputRef.current!.value,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        city:
                            part('locality') ??
                            part('postal_town') ??
                            part('administrative_area_level_2'),
                        postcode: part('postal_code'),
                    });
                });
            })
            .catch(() => {
                /* No autocomplete — the plain input still works. */
            });

        return () => {
            cancelled = true;
            const g = getGoogle();
            if (autocompleteRef.current && g?.maps?.event) {
                g.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey]);

    return (
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-invalid={invalid || undefined}
            className={
                'w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ' +
                (invalid
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-input focus:border-primary focus:ring-primary/30')
            }
        />
    );
}
