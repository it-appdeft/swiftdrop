import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ─── Country list ──────────────────────────────────────────────────────────
//
// Inline SVG flags so the dropdown renders the same across Windows / macOS /
// Linux (Unicode flag emojis don't render on Windows). Each flag uses a 16:12
// viewBox so the rendered <svg className="..."> control aspect-ratio.

interface Country {
    value: string; // dial code, e.g. "+44"
    code: string; // ISO 2-letter for the label, e.g. "GB"
    flag: () => React.ReactNode;
}

function FlagGB() {
    return (
        <svg viewBox="0 0 60 30" className="size-full">
            <clipPath id="cc-gb-mask">
                <path d="M0,0 v30 h60 v-30 z" />
            </clipPath>
            <clipPath id="cc-gb-stripe">
                <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
            </clipPath>
            <g clipPath="url(#cc-gb-mask)">
                <rect width="60" height="30" fill="#012169" />
                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#cc-gb-stripe)" stroke="#C8102E" strokeWidth="4" />
                <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
            </g>
        </svg>
    );
}

function FlagUS() {
    return (
        <svg viewBox="0 0 60 30" className="size-full">
            <rect width="60" height="30" fill="#fff" />
            {[0, 2, 4, 6, 8, 10, 12].map((row) => (
                <rect
                    key={row}
                    y={row * (30 / 13)}
                    width="60"
                    height={30 / 13}
                    fill="#B22234"
                />
            ))}
            <rect width="24" height={(7 * 30) / 13} fill="#3C3B6E" />
        </svg>
    );
}

function FlagIN() {
    return (
        <svg viewBox="0 0 60 30" className="size-full">
            <rect width="60" height="10" y="0" fill="#FF9933" />
            <rect width="60" height="10" y="10" fill="#fff" />
            <rect width="60" height="10" y="20" fill="#138808" />
            <circle cx="30" cy="15" r="3" fill="none" stroke="#000080" strokeWidth="0.6" />
        </svg>
    );
}

function FlagNG() {
    return (
        <svg viewBox="0 0 60 30" className="size-full">
            <rect width="20" height="30" x="0" fill="#008753" />
            <rect width="20" height="30" x="20" fill="#fff" />
            <rect width="20" height="30" x="40" fill="#008753" />
        </svg>
    );
}

const COUNTRIES: Country[] = [
    { value: '+44', code: 'GB', flag: FlagGB },
    { value: '+1', code: 'US', flag: FlagUS },
    { value: '+91', code: 'IN', flag: FlagIN },
    { value: '+234', code: 'NG', flag: FlagNG },
];

// ─── Component ─────────────────────────────────────────────────────────────

interface CountryCodeDropdownProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    /** Visual height — match the sibling input's height (default h-10). */
    className?: string;
}

export function CountryCodeDropdown({
    value,
    onChange,
    disabled,
    className,
}: CountryCodeDropdownProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selected = COUNTRIES.find((c) => c.value === value) ?? COUNTRIES[0];
    const SelectedFlag = selected.flag;

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

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={
                    'inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground ' +
                    (className ?? 'h-10')
                }
            >
                <span className="flex h-3.5 w-5 shrink-0 overflow-hidden rounded-sm ring-1 ring-zinc-200">
                    <SelectedFlag />
                </span>
                <span className="font-medium">{selected.value}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>

            {open && !disabled && (
                <ul
                    role="listbox"
                    className="absolute left-0 top-[calc(100%+4px)] z-30 w-44 overflow-hidden rounded-md border border-input bg-background shadow-lg"
                >
                    {COUNTRIES.map((country) => {
                        const Flag = country.flag;
                        const isSelected = country.value === value;
                        return (
                            <li key={country.value}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                        onChange(country.value);
                                        setOpen(false);
                                    }}
                                    className={
                                        'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted ' +
                                        (isSelected ? 'bg-primary/10 font-semibold text-primary' : '')
                                    }
                                >
                                    <span className="flex h-3.5 w-5 shrink-0 overflow-hidden rounded-sm ring-1 ring-zinc-200">
                                        <Flag />
                                    </span>
                                    <span className="flex-1 text-left">{country.code}</span>
                                    <span className="text-muted-foreground">{country.value}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
