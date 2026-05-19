import { Head, Link, router } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    ChevronDown,
    ImageIcon,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import { SwiftdropWordmark } from '../../../web/components/swiftdrop-wordmark';

interface InitialImageMeta {
    logo: { url: string } | null;
    cover: { url: string } | null;
    gallery: Record<string, { url: string }>;
}

type DocSlot = 'gstCert' | 'fssai' | 'pan' | 'cancelledCheque' | 'ownerId' | 'menu';

interface SetupProps {
    initialStep?: number;
    initialData?: Partial<SetupState>;
    initialImages?: InitialImageMeta;
    initialDocuments?: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
}

// ─── Types & static data ────────────────────────────────────────────────────

type StepKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const STEPS: { key: StepKey; label: string }[] = [
    { key: 1, label: 'Basic info' },
    { key: 2, label: 'Branding' },
    { key: 3, label: 'Cuisine & service' },
    { key: 4, label: 'Operating hours' },
    { key: 5, label: 'Delivery & orders' },
    { key: 6, label: 'Bank details' },
    { key: 7, label: 'Tax & compliance' },
    { key: 8, label: 'Review' },
];

const CUISINE_OPTIONS = [
    'North Indian',
    'Mughlai',
    'Biryani',
    'South Indian',
    'Chinese',
    'Italian',
    'Continental',
    'Desserts',
];

const DAYS: { key: DayKey; label: string }[] = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface DayHours {
    open: boolean;
    from: string;
    to: string;
}

interface SetupState {
    // Step 1
    displayName: string;
    tagline: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    // Step 3
    cuisines: string[];
    deliveryRadius: number;
    avgPrepTime: string;
    minOrderAmount: string;
    avgTicketSize: string;
    // Step 4
    hours: Record<DayKey, DayHours>;
    // Step 5
    autoAccept: boolean;
    estimatedPrepTime: string;
    packagingCharges: string;
    taxType: string;
    cancellationCutoff: string;
    // Step 6
    bankAccountHolder: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    // Step 7
    gst: string;
    fssai: string;
    pan: string;
}

const DEFAULT_STATE: SetupState = {
    displayName: '',
    tagline: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    cuisines: [],
    deliveryRadius: 6,
    avgPrepTime: '',
    minOrderAmount: '',
    avgTicketSize: '',
    hours: {
        mon: { open: true, from: '11:00', to: '23:00' },
        tue: { open: false, from: '11:00', to: '23:00' },
        wed: { open: true, from: '11:00', to: '23:00' },
        thu: { open: true, from: '11:00', to: '23:00' },
        fri: { open: true, from: '11:00', to: '23:00' },
        sat: { open: true, from: '11:00', to: '23:00' },
        sun: { open: true, from: '11:00', to: '23:00' },
    },
    autoAccept: true,
    estimatedPrepTime: '25',
    packagingCharges: '15',
    taxType: 'GST 5% (composition)',
    cancellationCutoff: '5',
    bankAccountHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    gst: '',
    fssai: '',
    pan: '',
};

// ─── Shell ──────────────────────────────────────────────────────────────────

function OnboardingHeader() {
    return (
        <header className="border-b border-border bg-background">
            <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
                <Link href="/" aria-label="SwiftDrop home">
                    <SwiftdropWordmark />
                </Link>
                <Link
                    href={route('restaurant.dashboard')}
                    className="text-sm font-medium text-foreground hover:text-primary"
                >
                    Exit
                </Link>
            </div>
        </header>
    );
}

function Sidebar({
    current,
    onJump,
}: {
    current: StepKey;
    onJump: (s: StepKey) => void;
}) {
    return (
        <aside className="rounded-2xl border border-border bg-background p-4 lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Setup</p>
            <ol className="mt-4 space-y-1">
                {STEPS.map((s) => {
                    const isCompleted = s.key < current;
                    const isCurrent = s.key === current;
                    return (
                        <li key={s.key}>
                            <button
                                type="button"
                                onClick={() => onJump(s.key)}
                                className={
                                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ' +
                                    (isCurrent
                                        ? 'bg-emerald-50 text-primary'
                                        : isCompleted
                                          ? 'text-foreground hover:bg-muted'
                                          : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                                }
                            >
                                <span
                                    className={
                                        'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ' +
                                        (isCurrent
                                            ? 'bg-primary text-primary-foreground'
                                            : isCompleted
                                              ? 'bg-emerald-100 text-primary'
                                              : 'bg-muted text-muted-foreground')
                                    }
                                >
                                    {isCompleted ? <Check className="size-3.5" /> : s.key}
                                </span>
                                {s.label}
                            </button>
                        </li>
                    );
                })}
            </ol>
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

interface TextFieldProps {
    label: string;
    required?: boolean;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    helper?: string;
}
function TextField({ label, required, placeholder, value, onChange, type = 'text', helper }: TextFieldProps) {
    return (
        <div className="space-y-1.5">
            <FieldLabel required={required}>{label}</FieldLabel>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
        </div>
    );
}

function TextArea({
    label,
    required,
    placeholder,
    value,
    onChange,
    rows = 4,
}: {
    label: string;
    required?: boolean;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
}) {
    return (
        <div className="space-y-1.5">
            <FieldLabel required={required}>{label}</FieldLabel>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
        </div>
    );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
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

// ─── Steps ──────────────────────────────────────────────────────────────────

function BasicInfoStep({
    s,
    update,
}: {
    s: SetupState;
    update: (patch: Partial<SetupState>) => void;
}) {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField
                    label="Display name"
                    required
                    placeholder="Spice Route"
                    value={s.displayName}
                    onChange={(v) => update({ displayName: v })}
                />
                <TextField
                    label="Tagline"
                    placeholder="Authentic North Indian flavors"
                    value={s.tagline}
                    onChange={(v) => update({ tagline: v })}
                />
            </div>
            <TextArea
                label="Description"
                placeholder="Tell customers what makes your kitchen special..."
                value={s.description}
                onChange={(v) => update({ description: v })}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField
                    label="Contact email"
                    type="email"
                    placeholder="hello@spiceroute.in"
                    value={s.contactEmail}
                    onChange={(v) => update({ contactEmail: v })}
                />
                <TextField
                    label="Contact phone"
                    placeholder="+91 98XXX XXXXX"
                    value={s.contactPhone}
                    onChange={(v) => update({ contactPhone: v })}
                />
            </div>
            <TextField
                label="Address"
                placeholder="100 Ft Road, Indiranagar, Bengaluru — 560038"
                value={s.address}
                onChange={(v) => update({ address: v })}
            />
        </div>
    );
}

function BrandingStep({
    images,
    onUpload,
}: {
    images: InitialImageMeta;
    onUpload: (type: 'logo' | 'cover' | `gallery_${number}`, file: File) => void;
}) {
    const GALLERY_SLOTS = 4;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <FieldLabel required>Logo</FieldLabel>
                <div className="flex items-center gap-3">
                    <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40">
                        {images.logo ? (
                            <img src={images.logo.url} alt="" className="size-full object-cover" />
                        ) : (
                            <ImageIcon className="size-6 text-muted-foreground" />
                        )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:border-primary hover:text-primary">
                        <Upload className="size-3.5" />
                        Upload logo
                        <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && onUpload('logo', e.target.files[0])}
                        />
                    </label>
                </div>
            </div>

            <div className="space-y-2">
                <FieldLabel required>Cover image</FieldLabel>
                <label className="flex h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40 text-sm text-muted-foreground hover:border-primary">
                    {images.cover ? (
                        <img
                            src={images.cover.url}
                            alt=""
                            className="size-full rounded-lg object-cover"
                        />
                    ) : (
                        <span>Recommended 1600×600 · PNG/JPG up to 5MB</span>
                    )}
                    <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && onUpload('cover', e.target.files[0])}
                    />
                </label>
            </div>

            <div className="space-y-2">
                <FieldLabel>Gallery (up to 8 images)</FieldLabel>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: GALLERY_SLOTS }).map((_, i) => {
                        const existing = images.gallery[String(i)];
                        return (
                            <label
                                key={i}
                                className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40 hover:border-primary"
                            >
                                {existing ? (
                                    <img
                                        src={existing.url}
                                        alt=""
                                        className="size-full rounded-lg object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="size-6 text-muted-foreground" />
                                )}
                                <input
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={(e) =>
                                        e.target.files?.[0] &&
                                        onUpload(`gallery_${i}` as const, e.target.files[0])
                                    }
                                />
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function CuisineServiceStep({
    s,
    update,
}: {
    s: SetupState;
    update: (patch: Partial<SetupState>) => void;
}) {
    const toggleCuisine = (c: string) => {
        const next = s.cuisines.includes(c)
            ? s.cuisines.filter((x) => x !== c)
            : [...s.cuisines, c];
        update({ cuisines: next });
    };

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <FieldLabel required>Cuisine types</FieldLabel>
                <div className="flex flex-wrap gap-2">
                    {CUISINE_OPTIONS.map((c) => {
                        const selected = s.cuisines.includes(c);
                        return (
                            <button
                                key={c}
                                type="button"
                                onClick={() => toggleCuisine(c)}
                                className={
                                    'rounded-full border px-3 py-1 text-xs font-semibold transition ' +
                                    (selected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-input bg-background text-foreground hover:border-primary hover:text-primary')
                                }
                            >
                                {c}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <FieldLabel>Delivery radius — {s.deliveryRadius} km</FieldLabel>
                    <input
                        type="range"
                        min={1}
                        max={20}
                        value={s.deliveryRadius}
                        onChange={(e) => update({ deliveryRadius: Number(e.target.value) })}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-emerald-100 accent-primary"
                    />
                </div>
                <TextField
                    label="Avg preparation time"
                    placeholder="25 min"
                    value={s.avgPrepTime}
                    onChange={(v) => update({ avgPrepTime: v })}
                />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField
                    label="Minimum order amount"
                    placeholder="₹ 199"
                    value={s.minOrderAmount}
                    onChange={(v) => update({ minOrderAmount: v })}
                />
                <TextField
                    label="Avg ticket size (optional)"
                    placeholder="₹ 450"
                    value={s.avgTicketSize}
                    onChange={(v) => update({ avgTicketSize: v })}
                />
            </div>
        </div>
    );
}

function OperatingHoursStep({
    s,
    update,
}: {
    s: SetupState;
    update: (patch: Partial<SetupState>) => void;
}) {
    const setDay = (day: DayKey, patch: Partial<DayHours>) => {
        update({ hours: { ...s.hours, [day]: { ...s.hours[day], ...patch } } });
    };

    return (
        <div className="space-y-3">
            {DAYS.map(({ key, label }) => {
                const h = s.hours[key];
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
                        <button
                            type="button"
                            disabled={!h.open}
                            className="inline-flex h-9 shrink-0 items-center rounded-md bg-emerald-50 px-3 text-xs font-semibold text-primary disabled:opacity-50"
                        >
                            + Add break
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function DeliveryOrdersStep({
    s,
    update,
}: {
    s: SetupState;
    update: (patch: Partial<SetupState>) => void;
}) {
    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4">
                <div>
                    <p className="text-sm font-semibold">Auto accept new orders</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Orders are accepted automatically once received.
                    </p>
                </div>
                <ToggleSwitch
                    checked={s.autoAccept}
                    onChange={(v) => update({ autoAccept: v })}
                />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField
                    label="Estimated prep time"
                    placeholder="25"
                    value={s.estimatedPrepTime}
                    onChange={(v) => update({ estimatedPrepTime: v })}
                />
                <TextField
                    label="Packaging charges (₹)"
                    placeholder="15"
                    value={s.packagingCharges}
                    onChange={(v) => update({ packagingCharges: v })}
                />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <FieldLabel>Tax type</FieldLabel>
                    <div className="relative">
                        <select
                            value={s.taxType}
                            onChange={(e) => update({ taxType: e.target.value })}
                            className="h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option>GST 5% (composition)</option>
                            <option>GST 18% (regular)</option>
                            <option>No GST</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>
                <TextField
                    label="Cancellation cutoff"
                    placeholder="5 minutes"
                    value={s.cancellationCutoff}
                    onChange={(v) => update({ cancellationCutoff: v })}
                />
            </div>
        </div>
    );
}

function BankDetailsStep({
    s,
    update,
    documents,
    onUploadDoc,
}: {
    s: SetupState;
    update: (patch: Partial<SetupState>) => void;
    documents: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
    onUploadDoc: (type: DocSlot, file: File) => void;
}) {
    const chequeUploaded = documents.cancelledCheque?.uploaded === true;
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField
                    label="Account holder name"
                    required
                    placeholder="Spice Route Hospitality Pvt Ltd"
                    value={s.bankAccountHolder}
                    onChange={(v) => update({ bankAccountHolder: v })}
                />
                <TextField
                    label="Bank name"
                    required
                    placeholder="HDFC Bank"
                    value={s.bankName}
                    onChange={(v) => update({ bankName: v })}
                />
                <TextField
                    label="Account number"
                    required
                    placeholder="XXXX XXXX XXXX"
                    value={s.accountNumber}
                    onChange={(v) => update({ accountNumber: v })}
                />
                <TextField
                    label="IFSC code"
                    required
                    placeholder="HDFC0001234"
                    value={s.ifsc}
                    onChange={(v) => update({ ifsc: v })}
                />
            </div>

            <div className="space-y-2">
                <FieldLabel required>Upload cancelled cheque</FieldLabel>
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-input bg-muted/40 text-sm text-muted-foreground hover:border-primary">
                    <span className="inline-flex items-center gap-1.5">
                        <Upload className="size-4" />
                        {chequeUploaded ? (
                            <span className="text-emerald-600">Uploaded — click to replace</span>
                        ) : (
                            'Drop file or click to upload'
                        )}
                    </span>
                    <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,image/*"
                        onChange={(e) =>
                            e.target.files?.[0] && onUploadDoc('cancelledCheque', e.target.files[0])
                        }
                    />
                </label>
            </div>
        </div>
    );
}

function TaxComplianceStep({
    s,
    update,
    documents,
    onUploadDoc,
}: {
    s: SetupState;
    update: (patch: Partial<SetupState>) => void;
    documents: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
    onUploadDoc: (type: DocSlot, file: File) => void;
}) {
    const uploadTile = (label: string, key: DocSlot) => {
        const uploaded = documents[key]?.uploaded === true;
        return (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {label}
                    {uploaded && (
                        <span className="ml-2 text-xs font-normal text-emerald-600">Uploaded</span>
                    )}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary">
                    <Upload className="size-3.5" />
                    {uploaded ? 'Replace' : 'Upload'}
                </span>
                <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,image/*"
                    onChange={(e) => e.target.files?.[0] && onUploadDoc(key, e.target.files[0])}
                />
            </label>
        );
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <TextField
                    label="GST"
                    required
                    placeholder="29ABCDE1234F1Z5"
                    value={s.gst}
                    onChange={(v) => update({ gst: v })}
                />
                <TextField
                    label="FSSAI"
                    required
                    placeholder="12345678901234"
                    value={s.fssai}
                    onChange={(v) => update({ fssai: v })}
                />
                <TextField
                    label="PAN"
                    required
                    placeholder="ABCDE1234F"
                    value={s.pan}
                    onChange={(v) => update({ pan: v })}
                />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {uploadTile('GST certificate', 'gstCert')}
                {uploadTile('FSSAI license', 'fssai')}
                {uploadTile('PAN card', 'pan')}
                {uploadTile('Owner ID proof', 'ownerId')}
            </div>
        </div>
    );
}

function ReviewStep({
    s,
    documents,
}: {
    s: SetupState;
    documents: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
}) {
    const summaryRow = (label: string, content: React.ReactNode) => (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4">
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {label}
                </p>
                <p className="mt-1 text-sm font-semibold">{content}</p>
            </div>
            <button type="button" className="text-xs font-semibold text-primary hover:underline">
                Edit
            </button>
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="size-4 shrink-0" />
                Your setup looks great! Once submitted you'll go live and start receiving orders.
            </div>
            {summaryRow(
                'Basic info',
                <>
                    {s.displayName || '—'}
                    {s.address && ` · ${s.address.split(',').slice(0, 2).join(', ')}`}
                </>,
            )}
            {summaryRow('Cuisines', s.cuisines.length ? s.cuisines.join(', ') : '—')}
            {summaryRow(
                'Delivery',
                <>
                    {s.deliveryRadius} km radius · {s.estimatedPrepTime || s.avgPrepTime || '—'} min prep
                    {s.minOrderAmount && ` · ${s.minOrderAmount} min order`}
                </>,
            )}
            {summaryRow(
                'Compliance',
                <>
                    {[s.gst, s.fssai, s.pan].filter(Boolean).length ? 'GST, FSSAI, PAN verified' : '—'}
                    {' · '}
                    {(['gstCert', 'fssai', 'pan', 'ownerId'] as DocSlot[])
                        .filter((k) => documents[k]?.uploaded)
                        .length}{' '}
                    documents uploaded
                </>,
            )}
            {summaryRow(
                'Bank',
                <>
                    {s.bankName || '—'}
                    {s.accountNumber && ` · •••• ${s.accountNumber.slice(-4)}`}
                </>,
            )}
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OnboardingSetup({
    initialStep = 1,
    initialData = {},
    initialImages = { logo: null, cover: null, gallery: {} },
    initialDocuments = {},
}: SetupProps) {
    const clamp = (n: number): StepKey =>
        Math.max(1, Math.min(8, Math.floor(n))) as StepKey;

    const [step, setStep] = useState<StepKey>(clamp(initialStep));
    const [state, setState] = useState<SetupState>({ ...DEFAULT_STATE, ...initialData });
    const [images, setImages] = useState<InitialImageMeta>(initialImages);
    const [documents, setDocuments] = useState<
        Partial<Record<DocSlot, { uploaded: boolean } | null>>
    >(initialDocuments);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const update = (patch: Partial<SetupState>) =>
        setState((prev) => ({ ...prev, ...patch }));

    const goBack = () => setStep((s) => clamp(s - 1));

    const persistStep = (currentStep: StepKey, onSuccess?: () => void) => {
        setSaving(true);
        // Inertia's router types each value as FormDataConvertible — nested
        // shapes are fine at runtime but TS can't widen our state type, so we
        // serialize through a Record cast for transport.
        const payload: Record<string, unknown> = {
            step: currentStep,
            data: state,
        };
        router.post(route('restaurant.onboarding.save'), payload as never, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => onSuccess?.(),
            onFinish: () => setSaving(false),
        });
    };

    const goNext = () => {
        if (step === 8) return;
        const next = clamp(step + 1);
        // Steps with no structured data (Branding step 2) still post to save
        // so the resume cursor advances.
        persistStep(step, () => setStep(next));
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(
            route('restaurant.onboarding.submit'),
            {},
            { onFinish: () => setSubmitting(false) },
        );
    };

    const handleImageUpload = (
        type: 'logo' | 'cover' | `gallery_${number}`,
        file: File,
    ) => {
        // Optimistic local preview while the upload is in flight.
        const objectUrl = URL.createObjectURL(file);
        setImages((prev) => {
            if (type === 'logo') return { ...prev, logo: { url: objectUrl } };
            if (type === 'cover') return { ...prev, cover: { url: objectUrl } };
            const m = type.match(/^gallery_(\d+)$/);
            if (m) {
                return {
                    ...prev,
                    gallery: { ...prev.gallery, [m[1]]: { url: objectUrl } },
                };
            }
            return prev;
        });

        router.post(
            route('restaurant.onboarding.images', { type }),
            { file },
            { preserveScroll: true, preserveState: true, forceFormData: true },
        );
    };

    const handleDocUpload = (type: DocSlot, file: File) => {
        setDocuments((prev) => ({ ...prev, [type]: { uploaded: true } }));
        router.post(
            route('restaurant.onboarding.documents', { type }),
            { file },
            { preserveScroll: true, preserveState: true, forceFormData: true },
        );
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <BasicInfoStep s={state} update={update} />;
            case 2:
                return <BrandingStep images={images} onUpload={handleImageUpload} />;
            case 3:
                return <CuisineServiceStep s={state} update={update} />;
            case 4:
                return <OperatingHoursStep s={state} update={update} />;
            case 5:
                return <DeliveryOrdersStep s={state} update={update} />;
            case 6:
                return (
                    <BankDetailsStep
                        s={state}
                        update={update}
                        documents={documents}
                        onUploadDoc={handleDocUpload}
                    />
                );
            case 7:
                return (
                    <TaxComplianceStep
                        s={state}
                        update={update}
                        documents={documents}
                        onUploadDoc={handleDocUpload}
                    />
                );
            case 8:
                return <ReviewStep s={state} documents={documents} />;
        }
    };

    const stepLabel = STEPS.find((x) => x.key === step)?.label ?? '';

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <Head title="Setup — Swift Drop Partner" />
            <OnboardingHeader />

            <main className="flex-1 px-4 py-8 sm:px-6">
                <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[260px_1fr]">
                    <Sidebar current={step} onJump={setStep} />

                    <section className="space-y-4">
                        <div>
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Step {step} of 8
                            </span>
                            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                {stepLabel}
                            </h1>
                        </div>

                        <div className="rounded-2xl border border-border bg-background p-5 sm:p-7">
                            {renderStep()}

                            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    disabled={step === 1}
                                    className="text-sm font-semibold text-foreground hover:text-primary disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => persistStep(step)}
                                        disabled={saving}
                                        className="h-10 rounded-md border border-input bg-background px-4 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                                    >
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                    {step < 8 ? (
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
                                            disabled={submitting}
                                            className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                        >
                                            {submitting ? 'Submitting…' : 'Finish setup'}
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
