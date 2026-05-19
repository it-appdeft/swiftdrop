import { Head, Link, router } from '@inertiajs/react';
import {
    BadgeCheck,
    Building2,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    CreditCard,
    FileCheck2,
    FileText,
    Home,
    MapPin,
    PartyPopper,
    Pencil,
    Plus,
    Trash2,
    Upload,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { SwiftdropWordmark } from '../../../web/components/swiftdrop-wordmark';

// ─── Types & static data ────────────────────────────────────────────────────

type StepKey = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Record<StepKey, string> = {
    1: 'Account & Restaurant',
    2: 'Location & Hours',
    3: 'Legal & Bank',
    4: 'Documents',
    5: 'Menu starter',
    6: 'Review & Submit',
};

const STEP_ICONS: Record<StepKey, React.ComponentType<{ className?: string }>> = {
    1: Building2,
    2: MapPin,
    3: CreditCard,
    4: FileText,
    5: UtensilsCrossed,
    6: FileCheck2,
};

const RESTAURANT_TYPE_OPTIONS = [
    'Casual Dining',
    'Fine Dining',
    'Cafe',
    'Cloud Kitchen',
    'QSR',
];

const DIET_OPTIONS: { value: 'veg' | 'non_veg' | 'egg'; label: string }[] = [
    { value: 'veg', label: 'Veg' },
    { value: 'non_veg', label: 'Non-veg' },
    { value: 'egg', label: 'Egg' },
];

const COUNTRY_CODE_OPTIONS: { value: string; label: string }[] = [
    { value: '+44', label: '🇬🇧 +44' },
    { value: '+1', label: '🇺🇸 +1' },
    { value: '+91', label: '🇮🇳 +91' },
    { value: '+234', label: '🇳🇬 +234' },
];

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
const DAYS: { key: DayKey; label: string }[] = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

type DocSlot =
    | 'gstCert'
    | 'fssai'
    | 'pan'
    | 'cancelledCheque'
    | 'ownerId'
    | 'restaurantPhoto';

const DOC_FIELDS: { key: DocSlot; label: string }[] = [
    { key: 'gstCert', label: 'GST certificate' },
    { key: 'fssai', label: 'FSSAI license' },
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

interface MenuItemRow {
    name: string;
    price: string;
    diet: 'veg' | 'non_veg' | 'egg';
}

interface FormState {
    // Step 1
    ownerName: string;
    contactEmail: string;
    contactCountryCode: string;
    contactPhone: string;
    restaurantName: string;
    legalName: string;
    restaurantType: string;
    cuisines: string;
    branches: string;
    seating: string;
    // Step 2
    fullAddress: string;
    city: string;
    pinCode: string;
    hours: Record<DayKey, DayHours>;
    // Step 3
    gst: string;
    fssai: string;
    pan: string;
    bankAccountHolder: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    // Step 5
    menuItems: MenuItemRow[];
    // Step 6
    termsAccepted: boolean;
}

const DEFAULT_STATE: FormState = {
    ownerName: '',
    contactEmail: '',
    contactCountryCode: '+44',
    contactPhone: '',
    restaurantName: '',
    legalName: '',
    restaurantType: '',
    cuisines: '',
    branches: '',
    seating: '',
    fullAddress: '',
    city: '',
    pinCode: '',
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
    menuItems: [{ name: '', price: '', diet: 'veg' }],
    termsAccepted: false,
};

interface PartnerApplyProps {
    initialStep?: number;
    initialData?: Partial<FormState>;
    initialDocuments?: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
    /** When true, render the post-submit celebration instead of the form. */
    completed?: boolean;
}

// ─── Header ────────────────────────────────────────────────────────────────

function PartnerHeader() {
    return (
        <header className="border-b border-border bg-background">
            <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
                <Link href="/" aria-label="SwiftDrop home">
                    <SwiftdropWordmark />
                </Link>
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                >
                    <ChevronLeft className="size-4" />
                    Home
                </Link>
            </div>
        </header>
    );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────

function StepSidebar({ current }: { current: StepKey }) {
    const steps: StepKey[] = [1, 2, 3, 4, 5, 6];

    return (
        <aside className="hidden w-64 shrink-0 lg:block">
            <div className="rounded-2xl border border-border bg-background p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Become a Partner
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight">
                    Restaurant Application
                </h2>

                <ol className="mt-5 space-y-1">
                    {steps.map((step) => {
                        const Icon = STEP_ICONS[step];
                        const isCompleted = step < current;
                        const isCurrent = step === current;

                        return (
                            <li
                                key={step}
                                className={
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ' +
                                    (isCurrent
                                        ? 'bg-primary/10 font-semibold text-primary'
                                        : isCompleted
                                          ? 'text-foreground'
                                          : 'text-muted-foreground')
                                }
                            >
                                {isCompleted ? (
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <Check className="size-3.5" />
                                    </span>
                                ) : (
                                    <span
                                        className={
                                            'flex size-6 shrink-0 items-center justify-center rounded-full ' +
                                            (isCurrent
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground')
                                        }
                                    >
                                        <Icon className="size-3.5" />
                                    </span>
                                )}
                                <span className="flex-1">{STEP_LABELS[step]}</span>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <p>
                    <span className="font-semibold">Saves automatically.</span> You can come
                    back anytime to finish your application.
                </p>
            </div>
        </aside>
    );
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

function AccountRestaurantStep({
    data,
    update,
    errors,
}: {
    data: FormState;
    update: (patch: Partial<FormState>) => void;
    errors: Record<string, string>;
}) {
    // `cuisines` is stored as a comma-separated string (backend column) but the
    // UI is a tag input: partner types a cuisine, presses Enter/comma to commit
    // it as a chip below. Split for display, re-join on every change so the
    // round-trip payload stays a single string.
    const selectedCuisines = data.cuisines
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

    const [cuisineDraft, setCuisineDraft] = useState('');

    const commitCuisine = () => {
        const trimmed = cuisineDraft.trim().replace(/,$/, '').trim();
        if (!trimmed) return;
        if (selectedCuisines.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            setCuisineDraft('');
            return;
        }
        update({ cuisines: [...selectedCuisines, trimmed].join(', ') });
        setCuisineDraft('');
    };

    const removeCuisine = (cuisine: string) => {
        update({
            cuisines: selectedCuisines.filter((c) => c !== cuisine).join(', '),
        });
    };

    const handleCuisineKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commitCuisine();
        } else if (e.key === 'Backspace' && cuisineDraft === '' && selectedCuisines.length) {
            removeCuisine(selectedCuisines[selectedCuisines.length - 1]);
        }
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
                        <div className="relative">
                            <select
                                value={data.contactCountryCode}
                                disabled
                                className="h-11 cursor-not-allowed appearance-none rounded-md border border-input bg-muted/40 pl-3 pr-8 text-sm text-muted-foreground"
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
                            className="h-11 flex-1 cursor-not-allowed rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
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
                <TextField
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
                />
            </div>

            <div className="space-y-2">
                <FieldLabel>Cuisines</FieldLabel>
                <input
                    type="text"
                    value={cuisineDraft}
                    onChange={(e) => setCuisineDraft(e.target.value)}
                    onKeyDown={handleCuisineKeyDown}
                    onBlur={commitCuisine}
                    placeholder="Type a cuisine and press Enter"
                    aria-invalid={errors.cuisines ? true : undefined}
                    className={
                        'h-11 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ' +
                        (errors.cuisines
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-input focus:border-primary focus:ring-primary/30')
                    }
                />
                {selectedCuisines.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {selectedCuisines.map((cuisine) => (
                            <span
                                key={cuisine}
                                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                            >
                                {cuisine}
                                <button
                                    type="button"
                                    onClick={() => removeCuisine(cuisine)}
                                    aria-label={`Remove ${cuisine}`}
                                    className="-mr-1 inline-flex size-4 items-center justify-center rounded-full hover:bg-primary/20"
                                >
                                    <X className="size-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                {errors.cuisines && (
                    <p className="text-xs text-rose-600">{errors.cuisines}</p>
                )}
            </div>
        </div>
    );
}

// ─── Step 2 — Location & Hours ─────────────────────────────────────────────

function LocationHoursStep({
    data,
    update,
    errors,
}: {
    data: FormState;
    update: (patch: Partial<FormState>) => void;
    errors: Record<string, string>;
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
                <textarea
                    rows={2}
                    value={data.fullAddress}
                    onChange={(e) => update({ fullAddress: e.target.value })}
                    placeholder="100 Ft Road, Indiranagar, Bengaluru — 560038"
                    aria-invalid={errors.fullAddress ? true : undefined}
                    className={
                        'w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ' +
                        (errors.fullAddress
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-input focus:border-primary focus:ring-primary/30')
                    }
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
                <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-input bg-muted/30 text-sm text-muted-foreground">
                    <MapPin className="mr-2 size-4 text-primary" />
                    Drag pin to set exact location
                </div>
            </div>

            <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Operating hours</h3>
                {DAYS.map(({ key, label }) => {
                    const h = data.hours[key];
                    return (
                        <div
                            key={key}
                            className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center"
                        >
                            <span className="w-12 shrink-0 text-sm font-semibold">{label}</span>
                            <ToggleSwitch
                                checked={h.open}
                                onChange={(v) => setDay(key, { open: v })}
                            />
                            <input
                                type="time"
                                value={h.from}
                                onChange={(e) => setDay(key, { from: e.target.value })}
                                disabled={!h.open}
                                className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <input
                                type="time"
                                value={h.to}
                                onChange={(e) => setDay(key, { to: e.target.value })}
                                disabled={!h.open}
                                className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                            />
                        </div>
                    );
                })}
            </section>
        </div>
    );
}

// ─── Step 3 — Legal & Bank ─────────────────────────────────────────────────

function LegalBankStep({
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
                        label="GST number"
                        required
                        placeholder="29ABCDE1234F1Z5"
                        value={data.gst}
                        onChange={(v) => update({ gst: v })}
                        error={errors.gst}
                    />
                    <TextField
                        label="FSSAI / Food license"
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
                        placeholder="XXXX XXXX XXXX"
                        value={data.accountNumber}
                        onChange={(v) => update({ accountNumber: v })}
                        error={errors.accountNumber}
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

// ─── Step 4 — Documents ────────────────────────────────────────────────────

function DocumentsStep({
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
                    Upload clear scans or photos. PDF, JPG or PNG up to 5MB each.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DOC_FIELDS.map((doc) => {
                    const uploaded = documents[doc.key]?.uploaded === true;
                    const error = errors[`doc.${doc.key}`];
                    return (
                        <div key={doc.key}>
                            <label
                                className={
                                    'flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-background p-4 transition hover:border-primary ' +
                                    (error ? 'border-rose-500' : 'border-border')
                                }
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{doc.label}</p>
                                    <p
                                        className={
                                            'mt-0.5 truncate text-xs ' +
                                            (uploaded
                                                ? 'text-emerald-600'
                                                : 'text-muted-foreground')
                                        }
                                    >
                                        {uploaded ? 'Uploaded' : 'PDF, JPG or PNG. Max 5MB.'}
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
                                    onChange={(e) =>
                                        e.target.files?.[0] &&
                                        onUploadDoc(doc.key, e.target.files[0])
                                    }
                                />
                            </label>
                            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Step 5 — Menu starter ─────────────────────────────────────────────────

function MenuStarterStep({
    data,
    update,
    errors,
}: {
    data: FormState;
    update: (patch: Partial<FormState>) => void;
    errors: Record<string, string>;
}) {
    const setRow = (idx: number, patch: Partial<MenuItemRow>) => {
        const next = data.menuItems.map((row, i) => (i === idx ? { ...row, ...patch } : row));
        update({ menuItems: next });
    };

    const addRow = () => {
        if (data.menuItems.length >= 50) return;
        update({ menuItems: [...data.menuItems, { name: '', price: '', diet: 'veg' }] });
    };

    const removeRow = (idx: number) => {
        const next = data.menuItems.filter((_, i) => i !== idx);
        update({ menuItems: next.length ? next : [{ name: '', price: '', diet: 'veg' }] });
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-xl font-bold tracking-tight">Menu starter</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Seed a few signature dishes. You can build out the full menu later from
                    your dashboard.
                </p>
            </header>

            <div className="space-y-3">
                {data.menuItems.map((row, idx) => {
                    const nameError = errors[`menuItems.${idx}.name`];
                    const priceError = errors[`menuItems.${idx}.price`];
                    return (
                        <div
                            key={idx}
                            className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end"
                        >
                            <div className="space-y-1.5">
                                {idx === 0 && <FieldLabel>Item name</FieldLabel>}
                                <input
                                    type="text"
                                    value={row.name}
                                    onChange={(e) => setRow(idx, { name: e.target.value })}
                                    placeholder="Paneer butter masala"
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
                            <div className="space-y-1.5">
                                {idx === 0 && <FieldLabel>Price (₹)</FieldLabel>}
                                <input
                                    type="number"
                                    value={row.price}
                                    onChange={(e) => setRow(idx, { price: e.target.value })}
                                    placeholder="280"
                                    className={
                                        'h-11 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ' +
                                        (priceError
                                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                                            : 'border-input focus:border-primary focus:ring-primary/30')
                                    }
                                />
                                {priceError && (
                                    <p className="text-xs text-rose-600">{priceError}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                {idx === 0 && <FieldLabel>Diet</FieldLabel>}
                                <div className="relative">
                                    <select
                                        value={row.diet}
                                        onChange={(e) =>
                                            setRow(idx, {
                                                diet: e.target.value as MenuItemRow['diet'],
                                            })
                                        }
                                        className="h-11 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-9 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        {DIET_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeRow(idx)}
                                aria-label="Remove item"
                                className="inline-flex size-11 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:border-rose-500 hover:text-rose-500"
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
                Add another item
            </button>
        </div>
    );
}

// ─── Step 6 — Review & Submit ──────────────────────────────────────────────

function SummaryCard({
    title,
    onEdit,
    children,
}: {
    title: string;
    onEdit: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold tracking-tight">{title}</h4>
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                    <Pencil className="size-3.5" />
                    Edit
                </button>
            </div>
            <div className="mt-3 space-y-2">{children}</div>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5 text-sm sm:grid sm:grid-cols-[140px_1fr] sm:gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="break-words font-medium text-foreground">{value || '—'}</span>
        </div>
    );
}

function ReviewStep({
    data,
    documents,
    onAccept,
    onEditStep,
    errors,
}: {
    data: FormState;
    documents: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
    onAccept: (v: boolean) => void;
    onEditStep: (step: StepKey) => void;
    errors: Record<string, string>;
}) {
    const uploadedCount = DOC_FIELDS.filter((d) => documents[d.key]?.uploaded).length;
    const openDays = DAYS.filter((d) => data.hours[d.key].open)
        .map((d) => d.label)
        .join(', ');
    const filledMenuItems = data.menuItems.filter((m) => m.name.trim() !== '');

    return (
        <div className="space-y-5">
            <header>
                <h2 className="text-xl font-bold tracking-tight">Review & Submit</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Take one last look. We typically respond within 24 hours.
                </p>
            </header>

            <SummaryCard title="Account & Restaurant" onEdit={() => onEditStep(1)}>
                <SummaryRow label="Owner" value={data.ownerName} />
                <SummaryRow label="Email" value={data.contactEmail} />
                <SummaryRow label="Mobile" value={data.contactPhone} />
                <SummaryRow label="Restaurant" value={data.restaurantName} />
                <SummaryRow label="Type" value={data.restaurantType} />
                <SummaryRow label="Cuisines" value={data.cuisines} />
            </SummaryCard>

            <SummaryCard title="Location & Hours" onEdit={() => onEditStep(2)}>
                <SummaryRow label="Address" value={data.fullAddress} />
                <SummaryRow
                    label="City / PIN"
                    value={[data.city, data.pinCode].filter(Boolean).join(' — ')}
                />
                <SummaryRow label="Open days" value={openDays || '—'} />
            </SummaryCard>

            <SummaryCard title="Legal & Bank" onEdit={() => onEditStep(3)}>
                <SummaryRow label="GST" value={data.gst} />
                <SummaryRow label="FSSAI" value={data.fssai} />
                <SummaryRow label="PAN" value={data.pan} />
                <SummaryRow label="Bank" value={data.bankName} />
                <SummaryRow label="Account" value={data.accountNumber} />
            </SummaryCard>

            <SummaryCard title="Documents" onEdit={() => onEditStep(4)}>
                <SummaryRow
                    label="Uploaded"
                    value={`${uploadedCount} of ${DOC_FIELDS.length}`}
                />
            </SummaryCard>

            <SummaryCard title="Menu starter" onEdit={() => onEditStep(5)}>
                <SummaryRow
                    label="Items"
                    value={
                        filledMenuItems.length
                            ? `${filledMenuItems.length} dish${filledMenuItems.length === 1 ? '' : 'es'}`
                            : '—'
                    }
                />
            </SummaryCard>

            <div>
                <label className="flex cursor-pointer items-start gap-2 pt-2 text-sm">
                    <span
                        role="checkbox"
                        aria-checked={data.termsAccepted}
                        onClick={() => onAccept(!data.termsAccepted)}
                        className={
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ' +
                            (data.termsAccepted
                                ? 'border-primary bg-primary text-primary-foreground'
                                : errors.termsAccepted
                                  ? 'border-rose-500 bg-background'
                                  : 'border-input bg-background')
                        }
                    >
                        {data.termsAccepted && <Check className="size-3" />}
                    </span>
                    <span>
                        I agree to SwiftDrop's{' '}
                        <Link href="#" className="text-primary hover:underline">
                            Partner Terms
                        </Link>{' '}
                        and confirm the information above is accurate.
                    </span>
                </label>
                {errors.termsAccepted && (
                    <p className="mt-1 text-xs text-rose-600">{errors.termsAccepted}</p>
                )}
            </div>
        </div>
    );
}

// ─── Completion screen ─────────────────────────────────────────────────────

function CompletedScreen() {
    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <Head title="You're live! — SwiftDrop Partner" />
            <PartnerHeader />

            <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100">
                        <PartyPopper className="size-8 text-primary" />
                    </div>
                    <h1 className="mt-5 text-2xl font-bold tracking-tight">
                        You're live on SwiftDrop!
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Your restaurant is ready to receive orders. Head to the dashboard to
                        go online.
                    </p>
                    <Link
                        href={route('restaurant.dashboard')}
                        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                        <Home className="mr-2 size-4" />
                        Go to dashboard
                    </Link>
                </div>
            </main>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PartnerApply({
    initialStep = 1,
    initialData = {},
    initialDocuments = {},
    completed = false,
}: PartnerApplyProps) {
    if (completed) {
        return <CompletedScreen />;
    }

    const clamp = (n: number): StepKey =>
        Math.max(1, Math.min(6, Math.floor(n))) as StepKey;

    const merged: FormState = { ...DEFAULT_STATE, ...initialData };
    if (!merged.menuItems || merged.menuItems.length === 0) {
        merged.menuItems = [{ name: '', price: '', diet: 'veg' }];
    }

    const [step, setStep] = useState<StepKey>(clamp(initialStep));
    const [data, setData] = useState<FormState>(merged);
    const [documents, setDocuments] = useState<
        Partial<Record<DocSlot, { uploaded: boolean } | null>>
    >(initialDocuments);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const update = (patch: Partial<FormState>) => {
        setData((prev) => ({ ...prev, ...patch }));
        setErrors((prev) => {
            const next = { ...prev };
            for (const key of Object.keys(patch)) delete next[key];
            return next;
        });
    };

    const normalizeServerErrors = (
        serverErrors: Record<string, string>,
    ): Record<string, string> => {
        const out: Record<string, string> = {};
        for (const [key, message] of Object.entries(serverErrors)) {
            out[key.startsWith('data.') ? key.slice('data.'.length) : key] = message;
        }
        return out;
    };

    const persistStep = (currentStep: StepKey, onSuccess?: () => void) => {
        setSaving(true);
        const payload: Record<string, unknown> = {
            step: currentStep,
            data,
        };
        router.post(route('partner.apply.save'), payload as never, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => onSuccess?.(),
            onError: (serverErrors) =>
                setErrors(normalizeServerErrors(serverErrors as Record<string, string>)),
            onFinish: () => setSaving(false),
        });
    };

    const goBack = () => {
        if (step === 1) return;
        setErrors({});
        setStep(clamp(step - 1));
    };

    const goNext = () => {
        if (step === 6) return;
        const next = clamp(step + 1);
        persistStep(step, () => setStep(next));
    };

    const handleSubmit = () => {
        if (!data.termsAccepted) {
            setErrors({ termsAccepted: 'You must accept the partner terms to submit.' });
            return;
        }
        setSubmitting(true);
        router.post(
            route('partner.apply.submit'),
            {},
            {
                onError: (serverErrors) =>
                    setErrors(normalizeServerErrors(serverErrors as Record<string, string>)),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleDocUpload = (type: DocSlot, file: File) => {
        setDocuments((prev) => ({ ...prev, [type]: { uploaded: true } }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[`doc.${type}`];
            return next;
        });
        router.post(
            route('partner.apply.documents', { type }),
            { file },
            { preserveScroll: true, preserveState: true, forceFormData: true },
        );
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <AccountRestaurantStep data={data} update={update} errors={errors} />;
            case 2:
                return <LocationHoursStep data={data} update={update} errors={errors} />;
            case 3:
                return <LegalBankStep data={data} update={update} errors={errors} />;
            case 4:
                return (
                    <DocumentsStep
                        documents={documents}
                        onUploadDoc={handleDocUpload}
                        errors={errors}
                    />
                );
            case 5:
                return <MenuStarterStep data={data} update={update} errors={errors} />;
            case 6:
                return (
                    <ReviewStep
                        data={data}
                        documents={documents}
                        onAccept={(v) => update({ termsAccepted: v })}
                        onEditStep={(s) => setStep(s)}
                        errors={errors}
                    />
                );
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <Head title="Apply — SwiftDrop Partner" />
            <PartnerHeader />

            <main className="flex-1 px-4 py-8 sm:px-6">
                <div className="mx-auto flex max-w-[1200px] flex-col gap-6 lg:flex-row">
                    <StepSidebar current={step} />

                    <section className="flex-1">
                        <div className="rounded-2xl border border-border bg-background p-5 sm:p-8">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Step {step} of 6 — {STEP_LABELS[step]}
                            </p>

                            <div className="mt-5">{renderStep()}</div>

                            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    disabled={step === 1}
                                    className="text-sm font-semibold text-foreground hover:text-primary disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    {step < 6 ? (
                                        <button
                                            type="button"
                                            onClick={goNext}
                                            disabled={saving}
                                            className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                        >
                                            {saving ? 'Saving…' : 'Continue'}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={!data.termsAccepted || submitting}
                                            className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                        >
                                            {submitting
                                                ? 'Submitting…'
                                                : 'Submit & go to dashboard'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
