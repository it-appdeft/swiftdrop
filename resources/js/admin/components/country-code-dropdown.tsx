import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { COUNTRIES, type Country, findCountry } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { CountryFlag } from './country-flag';

interface CountryCodeDropdownProps {
    /** Stored dialling prefix, e.g. "+44". */
    dial: string;
    /** Stored ISO 3166-1 alpha-2 code, e.g. "GB". Disambiguates shared prefixes. */
    iso?: string | null;
    /** Fires with the full picked country so callers can store dial + iso together. */
    onChange: (country: Country) => void;
    disabled?: boolean;
    /** Visual height — match the sibling input's height (default h-10). */
    className?: string;
}

/**
 * Searchable country picker. Emits the full {@link Country} so the caller can
 * persist both the dialling prefix (country_code) and the ISO code (country_iso)
 * — the ISO is what lets the rest of the app render one exact flag for a shared
 * prefix (+44 → GB/JE/GG/IM, +1 → US/CA).
 */
export function CountryCodeDropdown({ dial, iso, onChange, disabled, className }: CountryCodeDropdownProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selected = findCountry(iso, dial) ?? COUNTRIES[0];

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return COUNTRIES;
        return COUNTRIES.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.dial.includes(q) ||
                c.iso.toLowerCase() === q,
        );
    }, [query]);

    // Close on outside click.
    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    // Reset + focus the search box each time the panel opens.
    useEffect(() => {
        if (open) {
            setQuery('');
            requestAnimationFrame(() => searchRef.current?.focus());
        }
    }, [open]);

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground',
                    className ?? 'h-10',
                )}
            >
                <span className="flex h-3.5 w-5 shrink-0 items-center overflow-hidden rounded-sm ring-1 ring-zinc-200">
                    <CountryFlag iso={selected.iso} className="h-full w-full object-cover" />
                </span>
                <span className="font-medium">{selected.dial}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>

            {open && !disabled && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-72 overflow-hidden rounded-md border border-input bg-background shadow-lg">
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                        <Search className="size-3.5 shrink-0 text-muted-foreground" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search country or code…"
                            className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                        />
                    </div>
                    <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
                        {results.length === 0 && (
                            <li className="px-3 py-2 text-sm text-muted-foreground">No matches.</li>
                        )}
                        {results.map((country) => {
                            const isSelected = country.iso === selected.iso;
                            return (
                                <li key={country.iso}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => {
                                            onChange(country);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            'flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted',
                                            isSelected && 'bg-primary/10 font-semibold text-primary',
                                        )}
                                    >
                                        <span className="flex h-3.5 w-5 shrink-0 items-center overflow-hidden rounded-sm ring-1 ring-zinc-200">
                                            <CountryFlag iso={country.iso} className="h-full w-full object-cover" />
                                        </span>
                                        <span className="flex-1 truncate text-left">{country.name}</span>
                                        <span className="shrink-0 text-muted-foreground">{country.dial}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
