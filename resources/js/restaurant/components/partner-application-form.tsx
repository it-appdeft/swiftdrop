/* Shared partner-application form: types, constants, field primitives and the
 * five onboarding step components. Kept OUT of the page module so both the
 * onboarding wizard (pages/partner/apply.tsx) and the Settings → Restaurant
 * tab can import them. Importing these from the page file would make the page
 * a static dependency of another chunk, which drops it from the Vite manifest
 * (pages are dynamic glob entries) and 500s the route. */
import { BadgeCheck, Check, ChevronDown, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

import { AddressAutocomplete } from './address-autocomplete';
import { LocationMapPicker } from './location-map-picker';

// Server caps uploads at 5MB (UploadPartnerDocumentRequest → 'max:5120' in KB).
// Mirrored client-side so partners get instant feedback instead of a 422 after
// a wasted upload. Keep these two values in sync if either side changes.
const MAX_DOC_BYTES = 5 * 1024 * 1024;
const MAX_DOC_LABEL = '5MB';

const RESTAURANT_TYPE_OPTIONS = [
    'Casual Dining',
    'Fine Dining',
    'Cafe',
    'Cloud Kitchen',
    'QSR',
];


const COUNTRY_CODE_OPTIONS: { value: string; label: string }[] = [
    { value: '+44', label: '🇬🇧 +44' },
    { value: '+1', label: '🇺🇸 +1' },
    { value: '+91', label: '🇮🇳 +91' },
    { value: '+234', label: '🇳🇬 +234' },
];

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const DAYS: { key: DayKey; label: string }[] = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

export type DocSlot =
    | 'gstCert'
    | 'fssai'
    | 'pan'
    | 'cancelledCheque'
    | 'ownerId'
    | 'restaurantPhoto';

export const DOC_FIELDS: { key: DocSlot; label: string }[] = [
    { key: 'gstCert', label: 'GST certificate' },
    { key: 'fssai', label: 'FSA license' },
    { key: 'pan', label: 'PAN card' },
    { key: 'cancelledCheque', label: 'Cancelled cheque' },
    { key: 'ownerId', label: 'Owner ID proof' },
    { key: 'restaurantPhoto', label: 'Restaurant photo' },
];

interface DayHours {
    open: boolean;
    from: string;
    to: string;
}

interface CategoryRow {
    name: string;
}

export interface FormState {
    // Step 1
    ownerName: string;
    contactEmail: string;
    contactCountryCode: string;
    contactPhone: string;
    restaurantName: string;
    legalName: string;
    restaurantType: string;
    foodTypeIds: number[];
    branches: string;
    seating: string;
    // Step 2
    fullAddress: string;
    city: string;
    pinCode: string;
    lat: number | null;
    lng: number | null;
    hours: Record<DayKey, DayHours>;
    // Step 3
    gst: string;
    fssai: string;
    pan: string;
    bankAccountHolder: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    // Step 5 — menu categories the restaurant will list dishes under
    categories: CategoryRow[];
    // Step 6
    termsAccepted: boolean;
}

export const DEFAULT_STATE: FormState = {
    ownerName: '',
    contactEmail: '',
    contactCountryCode: '+44',
    contactPhone: '',
    restaurantName: '',
    legalName: '',
    restaurantType: '',
    foodTypeIds: [],
    branches: '',
    seating: '',
    fullAddress: '',
    city: '',
    pinCode: '',
    lat: null,
    lng: null,
    hours: {
        mon: { open: true, from: '11:00', to: '23:00' },
        tue: { open: false, from: '11:00', to: '23:00' },
        wed: { open: true, from: '11:00', to: '23:00' },
        thu: { open: true, from: '11:00', to: '23:00' },
        fri: { open: true, from: '11:00', to: '23:00' },
        sat: { open: true, from: '11:00', to: '23:00' },
        sun: { open: true, from: '11:00', to: '23:00' },
    },
    gst: '',
    fssai: '',
    pan: '',
    bankAccountHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    categories: [{ name: '' }],
    termsAccepted: false,
};

export interface FoodTypeOption {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
}

// ─── Field primitives ───────────────────────────────────────────────────────

function FieldLabel({
    children,
    required,
}: {
    children: React.ReactNode;
    required?: boolean;
}) {
    return (
        <label className="text-sm font-medium text-foreground">
            {children}
            {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
    );
}

function TextField({
    label,
    required,
    placeholder,
    helper,
    value,
    onChange,
    type = 'text',
    error,
    suffix,
    inputMode,
    maxLength,
}: {
    label: string;
    required?: boolean;
    placeholder?: string;
    helper?: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    error?: string;
    suffix?: React.ReactNode;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    maxLength?: number;
}) {
    return (
        <div className="space-y-1.5">
            <FieldLabel required={required}>{label}</FieldLabel>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    aria-invalid={error ? true : undefined}
                    className={
                        'h-11 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ' +
                        (suffix ? 'pr-24 ' : '') +
                        (error
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-input focus:border-primary focus:ring-primary/30')
                    }
                />
                {suffix && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">{suffix}</div>
                )}
            </div>
            {error ? (
                <p className="text-xs text-rose-600">{error}</p>
            ) : helper ? (
                <p className="text-xs text-muted-foreground">{helper}</p>
            ) : null}
        </div>
    );
}

function SelectField({
    label,
    required,
    value,
    onChange,
    options,
    error,
    placeholder = 'Choose...',
}: {
    label: string;
    required?: boolean;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[] | string[];
    error?: string;
    placeholder?: string;
}) {
    const normalized = options.map((o) =>
        typeof o === 'string' ? { value: o, label: o } : o,
    );

    return (
        <div className="space-y-1.5">
            <FieldLabel required={required}>{label}</FieldLabel>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    className={
                        'h-11 w-full appearance-none rounded-md border bg-background pl-3 pr-9 text-sm focus:outline-none focus:ring-2 ' +
                        (error
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-input focus:border-primary focus:ring-primary/30')
                    }
                >
                    <option value="">{placeholder}</option>
                    {normalized.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
    );
}

function ToggleSwitch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <span
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition ' +
                (checked ? 'bg-primary' : 'bg-muted')
            }
        >
            <span
                className={
                    'inline-block size-5 rounded-full bg-background shadow transition ' +
                    (checked ? 'translate-x-5' : 'translate-x-0.5')
                }
            />
        </span>
    );
}

// ─── Step 1 — Account & Restaurant ─────────────────────────────────────────

export function AccountRestaurantStep({
    data,
    update,
    errors,
    foodTypes,
    documents,
    onUploadDoc,
}: {
    data: FormState;
    update: (patch: Partial<FormState>) => void;
    errors: Record<string, string>;
    foodTypes: FoodTypeOption[];
    documents: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
    onUploadDoc: (type: DocSlot, file: File) => void;
}) {
    // Food categories — partner picks from the admin-managed catalog. Chip
    // selection is stored as an array of foodType IDs on the form state.
    const toggleFoodType = (id: number) => {
        const next = data.foodTypeIds.includes(id)
            ? data.foodTypeIds.filter((x) => x !== id)
            : [...data.foodTypeIds, id];
        update({ foodTypeIds: next });
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-xl font-bold tracking-tight">Account & Restaurant</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tell us who you are and which restaurant you'll be listing on SwiftDrop.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField
                    label="Owner full name"
                    required
                    placeholder="Rohit Mehta"
                    value={data.ownerName}
                    onChange={(v) => update({ ownerName: v })}
                    error={errors.ownerName}
                />

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <FieldLabel>Email</FieldLabel>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <BadgeCheck className="size-3.5" />
                            Verified
                        </span>
                    </div>
                    <input
                        type="email"
                        value={data.contactEmail}
                        readOnly
                        className="h-11 w-full cursor-not-allowed rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <FieldLabel>Mobile number</FieldLabel>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <BadgeCheck className="size-3.5" />
                            Verified
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {/* Fixed width so flag-emoji rendering differences across
                            OSes (Linux: color emoji ~narrow, Windows older builds:
                            two-letter regional codes ~wider) don't squeeze the
                            phone input and clip the number. */}
                        <div className="relative w-24 shrink-0">
                            <select
                                value={data.contactCountryCode}
                                disabled
                                className="h-11 w-full cursor-not-allowed appearance-none rounded-md border border-input bg-muted/40 pl-3 pr-8 text-sm text-muted-foreground"
                            >
                                {COUNTRY_CODE_OPTIONS.some(
                                    (o) => o.value === data.contactCountryCode,
                                ) ? null : (
                                    <option value={data.contactCountryCode}>
                                        {data.contactCountryCode}
                                    </option>
                                )}
                                {COUNTRY_CODE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <input
                            type="tel"
                            value={data.contactPhone}
                            readOnly
                            // `min-w-0` lets the flex item shrink past its
                            // intrinsic min content width on narrow viewports
                            // so the number never gets pushed off-screen.
                            className="h-11 min-w-0 flex-1 cursor-not-allowed rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
                        />
                    </div>
                </div>

                <TextField
                    label="Restaurant name"
                    required
                    placeholder="Spice Route"
                    value={data.restaurantName}
                    onChange={(v) => update({ restaurantName: v })}
                    error={errors.restaurantName}
                />
                <TextField
                    label="Legal business name"
                    placeholder="Spice Route Hospitality Pvt Ltd"
                    value={data.legalName}
                    onChange={(v) => update({ legalName: v })}
                    error={errors.legalName}
                />
                <SelectField
                    label="Restaurant type"
                    value={data.restaurantType}
                    onChange={(v) => update({ restaurantType: v })}
                    options={RESTAURANT_TYPE_OPTIONS}
                    error={errors.restaurantType}
                />
                {/* <TextField
                    label="Branches"
                    type="number"
                    placeholder="1"
                    value={data.branches}
                    onChange={(v) => update({ branches: v })}
                    error={errors.branches}
                />
                <TextField
                    label="Seating"
                    type="number"
                    placeholder="40"
                    value={data.seating}
                    onChange={(v) => update({ seating: v })}
                    error={errors.seating}
                /> */}
            </div>

            <div className="space-y-2">
                <FieldLabel>Food types</FieldLabel>
                <p className="text-xs text-muted-foreground">
                    Pick the categories you serve. Catalog is managed by SwiftDrop admins.
                </p>
                {foodTypes.length === 0 ? (
                    <p className="rounded-md border border-dashed border-input bg-muted/30 px-3 py-4 text-xs text-muted-foreground">
                        No food items available yet — please check back soon.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {foodTypes.map((item) => {
                            const isSelected = data.foodTypeIds.includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleFoodType(item.id)}
                                    className={
                                        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ' +
                                        (isSelected
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input bg-background text-foreground hover:border-primary hover:text-primary')
                                    }
                                >
                                    {item.image_url ? (
                                        <span
                                            className={
                                                'flex size-5 shrink-0 overflow-hidden rounded-full ' +
                                                (isSelected ? 'ring-1 ring-primary-foreground/40' : 'ring-1 ring-zinc-200')
                                            }
                                        >
                                            <img
                                                src={item.image_url}
                                                alt=""
                                                className="size-full object-cover"
                                                loading="lazy"
                                            />
                                        </span>
                                    ) : null}
                                    {isSelected && <Check className="size-3" />}
                                    {item.name}
                                </button>
                            );
                        })}
                    </div>
                )}
                {errors.foodTypeIds && (
                    <p className="text-xs text-rose-600">{errors.foodTypeIds}</p>
                )}
            </div>

            <div className="space-y-2">
                <FieldLabel>Restaurant photo</FieldLabel>
                <p className="text-xs text-muted-foreground">
                    A clear photo of your storefront or main dining area.
                </p>
                <DocUploadField
                    label="Restaurant photo"
                    uploaded={documents.restaurantPhoto?.uploaded === true}
                    error={errors['doc.restaurantPhoto']}
                    onUpload={(file) => onUploadDoc('restaurantPhoto', file)}
                />
            </div>
        </div>
    );
}

// ─── Step 2 — Location & Hours ─────────────────────────────────────────────

export function LocationHoursStep({
    data,
    update,
    errors,
    googleMapsApiKey,
}: {
    data: FormState;
    update: (patch: Partial<FormState>) => void;
    errors: Record<string, string>;
    googleMapsApiKey: string | null;
}) {
    const setDay = (day: DayKey, patch: Partial<DayHours>) => {
        update({ hours: { ...data.hours, [day]: { ...data.hours[day], ...patch } } });
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-xl font-bold tracking-tight">Location & Hours</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Where customers find you and when you're open.
                </p>
            </header>

            <div className="space-y-1.5">
                <FieldLabel required>Full address</FieldLabel>
                <AddressAutocomplete
                    apiKey={googleMapsApiKey}
                    value={data.fullAddress}
                    onChange={(v) => update({ fullAddress: v })}
                    onSelect={(place) =>
                        update({
                            fullAddress: place.address,
                            lat: place.lat,
                            lng: place.lng,
                            ...(place.city ? { city: place.city } : {}),
                            ...(place.postcode ? { pinCode: place.postcode } : {}),
                        })
                    }
                    placeholder="Start typing your address…"
                    invalid={!!errors.fullAddress}
                />
                {errors.fullAddress && (
                    <p className="text-xs text-rose-600">{errors.fullAddress}</p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField
                    label="City"
                    required
                    placeholder="Bengaluru"
                    value={data.city}
                    onChange={(v) => update({ city: v })}
                    error={errors.city}
                />
                <TextField
                    label="PIN code"
                    required
                    placeholder="560038"
                    value={data.pinCode}
                    onChange={(v) => update({ pinCode: v })}
                    error={errors.pinCode}
                />
            </div>

            <div className="space-y-1.5">
                <FieldLabel>Pin location on map</FieldLabel>
                <LocationMapPicker
                    apiKey={googleMapsApiKey}
                    lat={data.lat}
                    lng={data.lng}
                    address={[data.fullAddress, data.city, data.pinCode].filter(Boolean).join(', ')}
                    onChange={(lat, lng) => update({ lat, lng })}
                />
            </div>

            <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Operating hours</h3>
                {DAYS.map(({ key, label }) => {
                    const h = data.hours[key];
                    // Mobile: 2 compact rows per day (label+toggle, then from–to).
                    // Desktop: `sm:contents` collapses the inner groupings so all
                    // five controls render inline as a single flex row.
                    return (
                        <div
                            key={key}
                            className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:gap-3"
                        >
                            <div className="flex items-center justify-between sm:contents">
                                <span className="w-12 shrink-0 text-sm font-semibold">{label}</span>
                                <ToggleSwitch
                                    checked={h.open}
                                    onChange={(v) => setDay(key, { open: v })}
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:contents">
                                <input
                                    type="time"
                                    value={h.from}
                                    onChange={(e) => setDay(key, { from: e.target.value })}
                                    disabled={!h.open}
                                    className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                                />
                                <span className="text-xs text-muted-foreground">to</span>
                                <input
                                    type="time"
                                    value={h.to}
                                    onChange={(e) => setDay(key, { to: e.target.value })}
                                    disabled={!h.open}
                                    className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                                />
                            </div>
                        </div>
                    );
                })}
            </section>
        </div>
    );
}

// ─── Step 3 — Legal & Bank ─────────────────────────────────────────────────

export function LegalBankStep({
    data,
    update,
    errors,
}: {
    data: FormState;
    update: (patch: Partial<FormState>) => void;
    errors: Record<string, string>;
}) {
    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-xl font-bold tracking-tight">Legal & Bank</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tax IDs and the bank account we'll send payouts to.
                </p>
            </header>

            <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Tax & licenses</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField
                        label="VAT number"
                        required
                        placeholder="29ABCDE1234F1Z5"
                        value={data.gst}
                        onChange={(v) => update({ gst: v })}
                        error={errors.gst}
                    />
                    <TextField
                        label="FSA / Food license"
                        required
                        placeholder="12345678901234"
                        value={data.fssai}
                        onChange={(v) => update({ fssai: v })}
                        error={errors.fssai}
                    />
                    <TextField
                        label="PAN number"
                        required
                        placeholder="ABCDE1234F"
                        value={data.pan}
                        onChange={(v) => update({ pan: v })}
                        error={errors.pan}
                    />
                </div>
            </section>

            <hr className="border-border" />

            <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                    Bank account for payouts
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField
                        label="Account holder name"
                        placeholder="Spice Route Hospitality Pvt Ltd"
                        value={data.bankAccountHolder}
                        onChange={(v) => update({ bankAccountHolder: v })}
                        error={errors.bankAccountHolder}
                    />
                    <TextField
                        label="Bank name"
                        placeholder="HDFC Bank"
                        value={data.bankName}
                        onChange={(v) => update({ bankName: v })}
                        error={errors.bankName}
                    />
                    <TextField
                        label="Account number"
                        placeholder="e.g. 1234567890"
                        value={data.accountNumber}
                        // Strip non-digits on every change (covers typing AND paste).
                        onChange={(v) => update({ accountNumber: v.replace(/\D/g, '') })}
                        error={errors.accountNumber}
                        inputMode="numeric"
                        maxLength={20}
                    />
                    <TextField
                        label="IFSC / SWIFT code"
                        placeholder="HDFC0001234"
                        value={data.ifsc}
                        onChange={(v) => update({ ifsc: v })}
                        error={errors.ifsc}
                    />
                </div>
            </section>
        </div>
    );
}

// ─── Document upload primitives ────────────────────────────────────────────

/** Single upload card. Shared between the Documents step and the Identity
 * step (which hosts the Restaurant photo upload). Handles client-side size
 * validation and surfaces server-side errors passed in via `error`. */
export function DocUploadField({
    label,
    uploaded,
    error,
    onUpload,
    helperText,
}: {
    label: string;
    uploaded: boolean;
    error?: string;
    onUpload: (file: File) => void;
    helperText?: string;
}) {
    const [localError, setLocalError] = useState<string | null>(null);

    const handleFile = (file: File, input: HTMLInputElement) => {
        // Reset so picking the SAME file again still triggers change (e.g. after
        // an oversize rejection).
        input.value = '';

        if (file.size > MAX_DOC_BYTES) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            setLocalError(`File is ${sizeMb}MB — max allowed is ${MAX_DOC_LABEL}.`);
            return;
        }

        setLocalError(null);
        onUpload(file);
    };

    const shownError = localError ?? error;

    return (
        <div>
            <label
                className={
                    'flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-background p-4 transition hover:border-primary ' +
                    (shownError ? 'border-rose-500' : 'border-border')
                }
            >
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{label}</p>
                    <p
                        className={
                            'mt-0.5 truncate text-xs ' +
                            (uploaded ? 'text-emerald-600' : 'text-muted-foreground')
                        }
                    >
                        {uploaded
                            ? 'Uploaded'
                            : helperText ?? `PDF, JPG or PNG. Max ${MAX_DOC_LABEL}.`}
                    </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary">
                    <Upload className="size-3.5" />
                    {uploaded ? 'Replace' : 'Upload'}
                </span>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f, e.target);
                    }}
                />
            </label>
            {shownError && <p className="mt-1 text-xs text-rose-600">{shownError}</p>}
        </div>
    );
}

// ─── Step 4 — Documents ────────────────────────────────────────────────────

// Restaurant photo lives on the Identity step instead of with the legal/
// banking documents, so filter it out here.
const DOCUMENTS_STEP_FIELDS = DOC_FIELDS.filter((d) => d.key !== 'restaurantPhoto');

export function DocumentsStep({
    documents,
    onUploadDoc,
    errors,
}: {
    documents: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
    onUploadDoc: (type: DocSlot, file: File) => void;
    errors: Record<string, string>;
}) {
    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-xl font-bold tracking-tight">Documents</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Upload clear scans or photos. PDF, JPG or PNG up to {MAX_DOC_LABEL} each.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DOCUMENTS_STEP_FIELDS.map((doc) => (
                    <DocUploadField
                        key={doc.key}
                        label={doc.label}
                        uploaded={documents[doc.key]?.uploaded === true}
                        error={errors[`doc.${doc.key}`]}
                        onUpload={(file) => onUploadDoc(doc.key, file)}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Step 5 — Categories ───────────────────────────────────────────────────

export function CategoriesStep({
    data,
    update,
    errors,
}: {
    data: FormState;
    update: (patch: Partial<FormState>) => void;
    errors: Record<string, string>;
}) {
    const setRow = (idx: number, patch: Partial<CategoryRow>) => {
        const next = data.categories.map((row, i) => (i === idx ? { ...row, ...patch } : row));
        update({ categories: next });
    };

    const addRow = () => {
        if (data.categories.length >= 50) return;
        update({ categories: [...data.categories, { name: '' }] });
    };

    const removeRow = (idx: number) => {
        const next = data.categories.filter((_, i) => i !== idx);
        update({ categories: next.length ? next : [{ name: '' }] });
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-xl font-bold tracking-tight">Categories</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Add the sections your menu is organised into — e.g. Starters, Main course,
                    Breads. You can add dishes to each from your dashboard later.
                </p>
            </header>

            <div className="space-y-3">
                {data.categories.map((row, idx) => {
                    const nameError = errors[`categories.${idx}.name`];
                    return (
                        <div
                            key={idx}
                            className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr_auto] sm:items-end"
                        >
                            <div className="space-y-1.5">
                                {idx === 0 && <FieldLabel>Category name</FieldLabel>}
                                <input
                                    type="text"
                                    value={row.name}
                                    onChange={(e) => setRow(idx, { name: e.target.value })}
                                    placeholder="Starters"
                                    className={
                                        'h-11 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ' +
                                        (nameError
                                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                                            : 'border-input focus:border-primary focus:ring-primary/30')
                                    }
                                />
                                {nameError && (
                                    <p className="text-xs text-rose-600">{nameError}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeRow(idx)}
                                aria-label="Remove category"
                                className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:border-rose-500 hover:text-rose-500"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input bg-background px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
            >
                <Plus className="size-4" />
                Add another category
            </button>
        </div>
    );
}

