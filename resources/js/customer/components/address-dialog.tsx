import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, Briefcase, Clock, Home, Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
    interface Window {
        google?: any;
    }
}

const MAPS_KEY = (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const RECENTS_KEY = 'swiftdrop:recent-addresses';

let mapsPromise: Promise<any> | null = null;

/** Inject the Google Maps JS API (with Places) once and resolve `window.google`. */
function loadGoogleMaps(): Promise<any> {
    if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
    // Require `.places` (not just `.maps`) — that's the library we actually use.
    if (window.google?.maps?.places) return Promise.resolve(window.google);
    if (!MAPS_KEY) return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'));
    if (!mapsPromise) {
        mapsPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            // Classic (non-async) load: onload guarantees google.maps.places,
            // Geocoder, Map and Marker are all available synchronously. The
            // async bootstrap (loading=async) would defer the Places library and
            // leave AutocompleteService undefined at onload.
            script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.google?.maps?.places) resolve(window.google);
                else reject(new Error('Places library failed to load'));
            };
            script.onerror = () => reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
        });
    }
    return mapsPromise;
}

interface Selection {
    lat: number;
    lng: number;
    formatted: string;
    address_line_1: string;
    city: string;
    county: string;
    postcode: string;
}

interface SavedAddress {
    id: number;
    label: string | null;
    address_line_1: string | null;
    city: string | null;
    postcode: string | null;
    is_selected: boolean;
}

function component(components: any[], type: string): string {
    return components?.find((c: any) => c.types?.includes(type))?.long_name ?? '';
}

const len = (s: string) => s.replace(/\s/g, '').length;

/** Map a Geocoder/Place result into our address fields. */
function parseResult(result: any): Selection {
    const c = result.address_components ?? [];
    const formatted: string = result.formatted_address ?? '';
    const city =
        component(c, 'postal_town') ||
        component(c, 'locality') ||
        component(c, 'administrative_area_level_3') ||
        component(c, 'administrative_area_level_2');
    const county = component(c, 'administrative_area_level_2') || component(c, 'administrative_area_level_1') || city;

    // Street line from components; geocodes often return only a house number
    // (e.g. "1200") with no route, which fails the min:5 rule — so layer in the
    // sublocality, then the formatted address up to the city, then the whole
    // formatted address.
    const street = [component(c, 'street_number'), component(c, 'route')].filter(Boolean).join(' ');
    const sublocality =
        component(c, 'sublocality') ||
        component(c, 'sublocality_level_1') ||
        component(c, 'neighborhood') ||
        component(c, 'premise');

    let line1 = street;
    if (len(line1) < 5) line1 = [street, sublocality].filter(Boolean).join(', ') || sublocality;
    if (len(line1) < 5 && formatted) {
        const parts = formatted.split(',').map((p: string) => p.trim()).filter(Boolean);
        const cityIdx = city ? parts.findIndex((p: string) => p === city) : -1;
        const head = (cityIdx > 0 ? parts.slice(0, cityIdx) : parts.slice(0, 2)).join(', ');
        if (head.length > line1.length) line1 = head;
    }
    if (len(line1) < 5) line1 = formatted;

    const loc = result.geometry?.location;
    const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
    const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;

    return {
        lat,
        lng,
        formatted: formatted || line1,
        address_line_1: line1,
        city,
        county: county || city,
        postcode: component(c, 'postal_code'),
    };
}

function readRecents(): Selection[] {
    try {
        return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]');
    } catch {
        return [];
    }
}

function pushRecent(sel: Selection): void {
    try {
        const list = readRecents().filter((r) => r.formatted !== sel.formatted);
        localStorage.setItem(RECENTS_KEY, JSON.stringify([sel, ...list].slice(0, 4)));
    } catch {
        /* ignore */
    }
}

type Step = 'search' | 'map' | 'details';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Map-based add/change delivery address flow, shared by the header, checkout
 * and profile. Steps: search (autocomplete + saved + recent) → confirm on map
 * → address details → save via the existing customer.addresses.store route.
 */
export function AddressDialog({ open, onOpenChange }: Props) {
    const saved = (usePage().props.customer_addresses as SavedAddress[] | undefined) ?? [];

    const [step, setStep] = useState<Step>('search');
    const [mapsReady, setMapsReady] = useState(false);
    const [mapsError, setMapsError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [predictions, setPredictions] = useState<{ id: string; primary: string; secondary: string }[]>([]);
    const [selection, setSelection] = useState<Selection | null>(null);
    const [locating, setLocating] = useState(false);

    const acService = useRef<any>(null);
    const geocoder = useRef<any>(null);
    const mapEl = useRef<HTMLDivElement | null>(null);
    const mapObj = useRef<any>(null);
    const markerObj = useRef<any>(null);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load Maps + init services when the dialog opens.
    useEffect(() => {
        if (!open) return;
        setStep('search');
        setQuery('');
        setPredictions([]);
        setSelection(null);
        loadGoogleMaps()
            .then((g) => {
                acService.current = new g.maps.places.AutocompleteService();
                geocoder.current = new g.maps.Geocoder();
                setMapsReady(true);
                setMapsError(null);
            })
            .catch((e) => setMapsError(e.message ?? 'Maps unavailable'));
    }, [open]);

    const geocode = useCallback(
        (request: any): Promise<Selection | null> =>
            new Promise((resolve) => {
                if (!geocoder.current) return resolve(null);
                geocoder.current.geocode(request, (results: any[], status: string) => {
                    resolve(status === 'OK' && results?.[0] ? parseResult(results[0]) : null);
                });
            }),
        [],
    );

    // Autocomplete predictions as the customer types.
    useEffect(() => {
        if (!mapsReady || !acService.current) return;
        if (debounce.current) clearTimeout(debounce.current);
        if (query.trim().length < 3) {
            setPredictions([]);
            return;
        }
        debounce.current = setTimeout(() => {
            acService.current.getPlacePredictions({ input: query }, (res: any[]) => {
                setPredictions(
                    (res ?? []).map((p) => ({
                        id: p.place_id,
                        primary: p.structured_formatting?.main_text ?? p.description,
                        secondary: p.structured_formatting?.secondary_text ?? '',
                    })),
                );
            });
        }, 250);
    }, [query, mapsReady]);

    // (Re)build the map when we reach the confirm step.
    useEffect(() => {
        if (step !== 'map' || !selection || !mapEl.current || !window.google) return;
        const g = window.google;
        const center = { lat: selection.lat, lng: selection.lng };
        if (!mapObj.current) {
            mapObj.current = new g.maps.Map(mapEl.current, { center, zoom: 16, disableDefaultUI: true, zoomControl: true });
            markerObj.current = new g.maps.Marker({ map: mapObj.current, position: center, draggable: true });
            markerObj.current.addListener('dragend', async (e: any) => {
                const next = await geocode({ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } });
                if (next) setSelection(next);
            });
            mapObj.current.addListener('click', async (e: any) => {
                markerObj.current.setPosition(e.latLng);
                const next = await geocode({ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } });
                if (next) setSelection(next);
            });
        } else {
            mapObj.current.setCenter(center);
            markerObj.current.setPosition(center);
        }
    }, [step, selection, geocode]);

    const chooseFromPrediction = async (placeId: string) => {
        const sel = await geocode({ placeId });
        if (sel) {
            setSelection(sel);
            setStep('map');
        }
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Location is not available on this device.');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const sel = await geocode({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
                setLocating(false);
                if (sel) {
                    setSelection(sel);
                    setStep('map');
                } else {
                    toast.error('Could not resolve your current location.');
                }
            },
            () => {
                setLocating(false);
                toast.error('Permission denied for location.');
            },
        );
    };

    const selectSaved = (id: number) => {
        router.post(
            route('customer.addresses.select', id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Delivery address updated.');
                    onOpenChange(false);
                },
                onError: () => toast.error('Could not switch address.'),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="block gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[480px]">
                {step === 'search' && (
                    <SearchStep
                        query={query}
                        setQuery={setQuery}
                        predictions={predictions}
                        saved={saved}
                        recents={readRecents()}
                        locating={locating}
                        mapsError={mapsError}
                        onUseCurrent={useCurrentLocation}
                        onPick={chooseFromPrediction}
                        onPickRecent={(sel) => {
                            setSelection(sel);
                            setStep('map');
                        }}
                        onSelectSaved={selectSaved}
                    />
                )}

                {step === 'map' && selection && (
                    <MapStep
                        mapEl={mapEl}
                        selection={selection}
                        onBack={() => setStep('search')}
                        onConfirm={() => {
                            pushRecent(selection);
                            setStep('details');
                        }}
                        onManual={() => setStep('details')}
                    />
                )}

                {step === 'details' && selection && (
                    <DetailsStep selection={selection} onBack={() => setStep('map')} onClose={() => onOpenChange(false)} />
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Step 1: Search ─────────────────────────────────────────────────────────

function SearchStep({
    query,
    setQuery,
    predictions,
    saved,
    recents,
    locating,
    mapsError,
    onUseCurrent,
    onPick,
    onPickRecent,
    onSelectSaved,
}: {
    query: string;
    setQuery: (v: string) => void;
    predictions: { id: string; primary: string; secondary: string }[];
    saved: SavedAddress[];
    recents: Selection[];
    locating: boolean;
    mapsError: string | null;
    onUseCurrent: () => void;
    onPick: (placeId: string) => void;
    onPickRecent: (sel: Selection) => void;
    onSelectSaved: (id: number) => void;
}) {
    return (
        <div className="flex max-h-[85vh] w-full min-w-0 flex-col overflow-hidden">
            <header className="border-b border-zinc-100 px-5 py-4">
                <h2 className="text-foreground text-center text-base font-bold">Search Location</h2>
            </header>

            <div className="px-5 py-3">
                <div className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 px-3 focus-within:border-emerald-500">
                    <Search className="size-4 text-zinc-400" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for area, street name…"
                        className="h-full flex-1 bg-transparent text-sm outline-none"
                    />
                </div>
                {mapsError ? <p className="mt-2 text-xs text-rose-600">Map search unavailable: {mapsError}</p> : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                <button
                    type="button"
                    onClick={onUseCurrent}
                    className="flex w-full items-center gap-3 border-b border-zinc-100 py-3 text-left text-sm font-medium text-emerald-600"
                >
                    {locating ? <Loader2 className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}
                    Use current location
                </button>

                {predictions.length > 0 ? (
                    <div className="divide-y divide-zinc-50">
                        {predictions.map((p) => (
                            <button key={p.id} type="button" onClick={() => onPick(p.id)} className="flex w-full items-start gap-3 py-3 text-left">
                                <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                                <span className="min-w-0 flex-1">
                                    <span className="text-foreground block truncate text-sm font-medium">{p.primary}</span>
                                    {p.secondary ? <span className="text-muted-foreground block truncate text-xs">{p.secondary}</span> : null}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <>
                        {saved.length > 0 ? (
                            <Section title="Saved Addresses">
                                {saved.map((a) => (
                                    <button
                                        key={a.id}
                                        type="button"
                                        onClick={() => onSelectSaved(a.id)}
                                        className="flex w-full items-start gap-3 py-2.5 text-left"
                                    >
                                        <LabelIcon label={a.label} />
                                        <span className="min-w-0 flex-1">
                                            <span className="text-foreground block truncate text-sm font-medium">{a.label ?? 'Address'}</span>
                                            <span className="text-muted-foreground block truncate text-xs">
                                                {[a.address_line_1, a.city, a.postcode].filter(Boolean).join(', ')}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </Section>
                        ) : null}

                        {recents.length > 0 ? (
                            <Section title="Recent Searches">
                                {recents.map((r, i) => (
                                    <button
                                        key={`${r.formatted}-${i}`}
                                        type="button"
                                        onClick={() => onPickRecent(r)}
                                        className="flex w-full items-start gap-3 py-2.5 text-left"
                                    >
                                        <Clock className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                                        <span className="text-foreground min-w-0 truncate text-sm">{r.formatted}</span>
                                    </button>
                                ))}
                            </Section>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mt-4">
            <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">{title}</p>
            <div className="divide-y divide-zinc-50">{children}</div>
        </div>
    );
}

function LabelIcon({ label }: { label: string | null }) {
    const l = (label ?? '').toLowerCase();
    const Icon = l.includes('work') ? Briefcase : l.includes('home') || l.includes('flat') ? Home : MapPin;
    return <Icon className="mt-0.5 size-4 shrink-0 text-zinc-400" />;
}

// ─── Step 2: Confirm on map ─────────────────────────────────────────────────

function MapStep({
    mapEl,
    selection,
    onBack,
    onConfirm,
    onManual,
}: {
    mapEl: React.RefObject<HTMLDivElement | null>;
    selection: Selection;
    onBack: () => void;
    onConfirm: () => void;
    onManual: () => void;
}) {
    return (
        <div className="flex max-h-[85vh] w-full min-w-0 flex-col overflow-hidden">
            <header className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
                <button type="button" onClick={onBack} aria-label="Back" className="text-foreground">
                    <ArrowLeft className="size-5" />
                </button>
                <h2 className="text-foreground text-base font-bold">Set Delivery Location</h2>
            </header>

            <div ref={mapEl} className="h-56 w-full bg-zinc-100" />

            <div className="px-5 py-4">
                <div className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                        <p className="text-foreground text-sm font-semibold">Delivering your order to</p>
                        <p className="text-muted-foreground text-xs">{selection.formatted}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onConfirm}
                    className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                    Confirm Location
                </button>
                <button
                    type="button"
                    onClick={onManual}
                    className="text-muted-foreground mt-2 w-full text-center text-xs font-medium hover:text-emerald-600"
                >
                    Can’t find your location? Add address details manually
                </button>
            </div>
        </div>
    );
}

// ─── Step 3: Address details ────────────────────────────────────────────────

const LABEL_PRESETS: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'Home', label: 'Set home', icon: Home },
    { key: 'Work', label: 'Work', icon: Briefcase },
    { key: 'Other', label: 'Others', icon: MapPin },
];

function DetailsStep({ selection, onBack, onClose }: { selection: Selection; onBack: () => void; onClose: () => void }) {
    const [additional, setAdditional] = useState('');
    const [postcode, setPostcode] = useState(selection.postcode ?? '');
    const [instructions, setInstructions] = useState('');
    const [preset, setPreset] = useState('Other');
    const [label, setLabel] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const choosePreset = (key: string) => {
        setPreset(key);
        if (key === 'Home') setLabel('Home');
        else if (key === 'Work') setLabel('Work');
        else setLabel('');
    };

    const save = () => {
        const finalLabel = label.trim() || (preset === 'Other' ? '' : preset);
        const next: Record<string, string> = {};
        if (!additional.trim()) next.additional = 'Additional details are required.';
        if (!postcode.trim()) next.postcode = 'Postcode is required.';
        if (!finalLabel) next.label = 'Add a label for this address.';
        setErrors(next);
        if (Object.keys(next).length) return;

        setSaving(true);
        router.post(
            route('customer.addresses.store'),
            {
                label: finalLabel,
                address_line_1: len(selection.address_line_1) >= 5 ? selection.address_line_1 : selection.formatted,
                address_line_2: additional.trim(),
                city: selection.city || selection.county || 'N/A',
                county: selection.county || selection.city || 'N/A',
                postcode: postcode.trim(),
                delivery_instructions: instructions.trim() || null,
                lat: selection.lat,
                lng: selection.lng,
                is_selected: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Address saved.');
                    onClose();
                },
                onError: (e) => setErrors(e as Record<string, string>),
                onFinish: () => setSaving(false),
            },
        );
    };

    const inputCls = 'h-11 w-full rounded-md border border-zinc-200 bg-background px-3 text-sm outline-none focus:border-emerald-500';

    return (
        <div className="flex max-h-[85vh] w-full min-w-0 flex-col overflow-hidden">
            <header className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
                <button type="button" onClick={onBack} aria-label="Back" className="text-foreground">
                    <ArrowLeft className="size-5" />
                </button>
                <div>
                    <h2 className="text-foreground text-base font-bold">Address Details</h2>
                    <p className="text-muted-foreground truncate text-xs">{selection.formatted}</p>
                </div>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Additional details" required error={errors.additional}>
                        <input value={additional} onChange={(e) => setAdditional(e.target.value)} placeholder="Flat 2B, 221B" className={inputCls} />
                    </Field>
                    <Field label="Postcode" required error={errors.postcode}>
                        <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SW1" className={inputCls} />
                    </Field>
                </div>

                <div>
                    <label className="text-foreground mb-1 block text-sm font-semibold">Delivery Instructions (optional)</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value.slice(0, 500))}
                        rows={3}
                        placeholder="Instruction to reach"
                        className="bg-background w-full resize-none rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                    <p className="text-muted-foreground mt-1 text-xs">Example: Take the first left next to red gate</p>
                </div>

                <div className="flex gap-2">
                    {LABEL_PRESETS.map((p) => {
                        const active = preset === p.key;
                        return (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => choosePreset(p.key)}
                                className={
                                    'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ' +
                                    (active ? 'bg-emerald-600 text-white' : 'text-foreground border border-zinc-300 hover:border-emerald-500')
                                }
                            >
                                <p.icon className="size-4" />
                                {p.label}
                            </button>
                        );
                    })}
                </div>

                <Field label="Add a label" required error={errors.label}>
                    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g school" className={inputCls} />
                </Field>
            </div>

            <div className="border-t border-zinc-100 px-5 py-4">
                <button
                    type="button"
                    disabled={saving}
                    onClick={save}
                    className="rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Save Address'}
                </button>
            </div>
        </div>
    );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-foreground mb-1 block text-sm font-semibold">
                {label} {required ? <span className="text-rose-500">*</span> : null}
            </label>
            {children}
            {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
        </div>
    );
}
