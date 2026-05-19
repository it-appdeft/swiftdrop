import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    Check,
    CheckCircle2,
    MapPin,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import { SwiftdropWordmark } from '../../../web/components/swiftdrop-wordmark';

// ─── Types ──────────────────────────────────────────────────────────────────

type StepKey = 1 | 2 | 3 | 4;

interface FormState {
    // Step 1 — Restaurant
    restaurantName: string;
    legalName: string;
    ownerName: string;
    mobile: string;
    email: string;
    restaurantType: string;
    cuisines: string;
    branches: string;
    seating: string;
    fullAddress: string;
    // Step 2 — Legal & Bank
    gst: string;
    fssai: string;
    pan: string;
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    // Step 4 — Review
    termsAccepted: boolean;
}

type DocKey =
    | 'gstCert'
    | 'fssai'
    | 'pan'
    | 'cancelledCheque'
    | 'ownerId'
    | 'menu';

const DOC_FIELDS: { key: DocKey; label: string }[] = [
    { key: 'gstCert', label: 'GST certificate' },
    { key: 'fssai', label: 'FSSAI license' },
    { key: 'pan', label: 'PAN card' },
    { key: 'cancelledCheque', label: 'Cancelled cheque' },
    { key: 'ownerId', label: 'Owner ID proof' },
    { key: 'menu', label: 'Menu (PDF/Image)' },
];

const STEP_LABELS: Record<StepKey, string> = {
    1: 'Restaurant',
    2: 'Legal & Bank',
    3: 'Documents',
    4: 'Review',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const GST_RE = /^[A-Za-z0-9]{15}$/;

const RESTAURANT_KEYS = new Set([
    'restaurantName',
    'legalName',
    'ownerName',
    'mobile',
    'email',
    'restaurantType',
    'cuisines',
    'branches',
    'seating',
    'fullAddress',
]);

const LEGAL_KEYS = new Set([
    'gst',
    'fssai',
    'pan',
    'accountHolder',
    'bankName',
    'accountNumber',
    'ifsc',
]);

function validateStep(
    step: StepKey,
    data: FormState,
    uploads: Record<DocKey, File | null>,
    savedDocs: Partial<Record<DocKey, { uploaded: boolean } | null>>,
): Record<string, string> {
    const errors: Record<string, string> = {};
    const requireText = (key: keyof FormState, label: string) => {
        const v = data[key];
        if (typeof v !== 'string' || v.trim().length === 0) {
            errors[key as string] = `${label} is required.`;
        }
    };

    if (step === 1) {
        requireText('restaurantName', 'Restaurant name');
        requireText('legalName', 'Legal business name');
        requireText('ownerName', 'Owner name');
        requireText('mobile', 'Mobile number');
        requireText('email', 'Email address');
        requireText('restaurantType', 'Restaurant type');
        requireText('cuisines', 'Cuisines');
        requireText('branches', 'Number of branches');
        requireText('fullAddress', 'Full address');

        if (data.email && !EMAIL_RE.test(data.email)) {
            errors.email = 'Enter a valid email address.';
        }
        if (data.branches && !/^[1-9]\d*$/.test(data.branches)) {
            errors.branches = 'Enter a whole number (1 or more).';
        }
        if (data.seating && !/^\d+$/.test(data.seating)) {
            errors.seating = 'Seating capacity must be a number.';
        }
    }

    if (step === 2) {
        requireText('gst', 'GST number');
        requireText('fssai', 'FSSAI / Food license');
        requireText('pan', 'PAN number');

        if (data.gst && !GST_RE.test(data.gst.replace(/\s/g, ''))) {
            errors.gst = 'GST must be 15 alphanumeric characters.';
        }
        if (data.pan && !PAN_RE.test(data.pan)) {
            errors.pan = 'PAN format should be ABCDE1234F.';
        }
        if (data.fssai && !/^\d{14}$/.test(data.fssai.replace(/\s/g, ''))) {
            errors.fssai = 'FSSAI / Food license should be 14 digits.';
        }
        // Bank fields are optional, but if any are filled, all four are required.
        const bankFilled =
            data.accountHolder || data.bankName || data.accountNumber || data.ifsc;
        if (bankFilled) {
            if (!data.accountHolder.trim()) errors.accountHolder = 'Account holder is required.';
            if (!data.bankName.trim()) errors.bankName = 'Bank name is required.';
            if (!data.accountNumber.trim()) errors.accountNumber = 'Account number is required.';
            if (!data.ifsc.trim()) errors.ifsc = 'IFSC / SWIFT code is required.';
        }
    }

    if (step === 3) {
        for (const doc of DOC_FIELDS) {
            const has = uploads[doc.key] || savedDocs[doc.key]?.uploaded;
            if (!has) {
                errors[`doc.${doc.key}`] = `${doc.label} is required.`;
            }
        }
    }

    if (step === 4) {
        if (!data.termsAccepted) {
            errors.termsAccepted = 'You must accept the partner terms to submit.';
        }
    }

    return errors;
}

// ─── Header ─────────────────────────────────────────────────────────────────

function PartnerHeader() {
    return (
        <header className="border-b border-border bg-background">
            <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 sm:px-6">
                <Link href="/" aria-label="SwiftDrop home">
                    <SwiftdropWordmark />
                </Link>
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                >
                    <ChevronLeft className="size-4" />
                    Back to home
                </Link>
            </div>
        </header>
    );
}

// ─── Stepper ────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: StepKey }) {
    const steps: StepKey[] = [1, 2, 3, 4];

    return (
        <ol className="mt-6 grid grid-cols-4 gap-3">
            {steps.map((step) => {
                const isCompleted = step < current;
                const isCurrent = step === current;
                const barClass = isCompleted || isCurrent ? 'bg-primary' : 'bg-muted';

                return (
                    <li key={step} className="flex flex-col">
                        <span className={`h-1 rounded-full ${barClass}`} aria-hidden />
                        <span className="mt-3 inline-flex items-center gap-2 text-sm">
                            {isCompleted ? (
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Check className="size-3.5" />
                                </span>
                            ) : isCurrent ? (
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                                    {step}
                                </span>
                            ) : (
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                                    {step}
                                </span>
                            )}
                            <span
                                className={
                                    'font-medium ' +
                                    (isCurrent
                                        ? 'text-foreground'
                                        : isCompleted
                                          ? 'text-foreground'
                                          : 'text-muted-foreground')
                                }
                            >
                                {STEP_LABELS[step]}
                            </span>
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

// ─── Field primitives ───────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
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
}: {
    label: string;
    required?: boolean;
    placeholder?: string;
    helper?: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    error?: string;
}) {
    return (
        <div className="space-y-1.5">
            <FieldLabel required={required}>{label}</FieldLabel>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-invalid={error ? true : undefined}
                className={
                    'h-11 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ' +
                    (error
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-input focus:border-primary focus:ring-primary/30')
                }
            />
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
}: {
    label: string;
    required?: boolean;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    error?: string;
}) {
    return (
        <div className="space-y-1.5">
            <FieldLabel required={required}>{label}</FieldLabel>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={error ? true : undefined}
                className={
                    'h-11 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 ' +
                    (error
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-input focus:border-primary focus:ring-primary/30')
                }
            >
                <option value="">Choose...</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
    );
}

// ─── Step 1 — Restaurant ────────────────────────────────────────────────────

function RestaurantStep({
    data,
    update,
    errors,
}: {
    data: FormState;
    update: (patch: Partial<FormState>) => void;
    errors: Record<string, string>;
}) {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    required
                    placeholder="Spice Route Hospitality Pvt Ltd"
                    value={data.legalName}
                    onChange={(v) => update({ legalName: v })}
                    error={errors.legalName}
                />
                <TextField
                    label="Owner name"
                    required
                    placeholder="Rohit Mehta"
                    value={data.ownerName}
                    onChange={(v) => update({ ownerName: v })}
                    error={errors.ownerName}
                />
                <TextField
                    label="Mobile number"
                    required
                    placeholder="+91 98XXX XXXXX"
                    value={data.mobile}
                    onChange={(v) => update({ mobile: v })}
                    error={errors.mobile}
                />
                <TextField
                    label="Email address"
                    required
                    placeholder="owner@spiceroute.in"
                    type="email"
                    value={data.email}
                    onChange={(v) => update({ email: v })}
                    error={errors.email}
                />
                <SelectField
                    label="Restaurant type"
                    required
                    value={data.restaurantType}
                    onChange={(v) => update({ restaurantType: v })}
                    options={['Casual Dining', 'Fine Dining', 'Cafe', 'Cloud Kitchen', 'QSR']}
                    error={errors.restaurantType}
                />
                <TextField
                    label="Cuisines"
                    required
                    placeholder="North Indian, Mughlai, Biryani"
                    helper="Comma separated, e.g. North Indian, Mughlai"
                    value={data.cuisines}
                    onChange={(v) => update({ cuisines: v })}
                    error={errors.cuisines}
                />
                <TextField
                    label="Number of branches"
                    required
                    placeholder="1"
                    value={data.branches}
                    onChange={(v) => update({ branches: v })}
                    error={errors.branches}
                />
                <TextField
                    label="Seating capacity"
                    placeholder="40"
                    value={data.seating}
                    onChange={(v) => update({ seating: v })}
                    error={errors.seating}
                />
            </div>

            <div className="space-y-1.5">
                <FieldLabel required>Full address</FieldLabel>
                <textarea
                    rows={3}
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

            <div className="space-y-1.5">
                <FieldLabel required>Pin location on map</FieldLabel>
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-input bg-muted/30 text-sm text-muted-foreground">
                    <MapPin className="mr-2 size-4 text-emerald-600" />
                    Drag pin to set exact location
                </div>
            </div>
        </div>
    );
}

// ─── Step 2 — Legal & Bank ──────────────────────────────────────────────────

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

            <hr className="border-border" />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField
                    label="Account holder name"
                    placeholder="Spice Route Hospitality Pvt Ltd"
                    value={data.accountHolder}
                    onChange={(v) => update({ accountHolder: v })}
                    error={errors.accountHolder}
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
        </div>
    );
}

// ─── Step 3 — Documents ─────────────────────────────────────────────────────

function DocumentsStep({
    uploads,
    savedDocs,
    onUpload,
    errors,
}: {
    uploads: Record<DocKey, File | null>;
    savedDocs: Partial<Record<DocKey, { uploaded: boolean } | null>>;
    onUpload: (key: DocKey, file: File | null) => void;
    errors: Record<string, string>;
}) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DOC_FIELDS.map((doc) => {
                const file = uploads[doc.key];
                const isSaved = savedDocs[doc.key]?.uploaded === true;
                const hint = file?.name ?? (isSaved ? 'Uploaded' : 'PDF, JPG or PNG. Max 5MB.');
                const hasFile = Boolean(file) || isSaved;
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
                                        (isSaved && !file ? 'text-emerald-600' : 'text-muted-foreground')
                                    }
                                >
                                    {hint}
                                </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary">
                                <Upload className="size-3.5" />
                                {hasFile ? 'Replace' : 'Upload'}
                            </span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="sr-only"
                                onChange={(e) => onUpload(doc.key, e.target.files?.[0] ?? null)}
                            />
                        </label>
                        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Step 4 — Review ────────────────────────────────────────────────────────

function ReviewStep({
    data,
    uploads,
    savedDocs,
    onAccept,
    errors,
}: {
    data: FormState;
    uploads: Record<DocKey, File | null>;
    savedDocs: Partial<Record<DocKey, { uploaded: boolean } | null>>;
    onAccept: (v: boolean) => void;
    errors: Record<string, string>;
}) {
    const uploadedCount = DOC_FIELDS.filter(
        (d) => uploads[d.key] || savedDocs[d.key]?.uploaded,
    ).length;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <h3 className="text-base font-bold tracking-tight">Almost done!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Please review your information. Our team typically responds within 24 hours.
                </p>
            </div>

            <ReviewCard title="Restaurant">
                <ReviewRow label="Name" value={data.restaurantName || '—'} />
                <ReviewRow label="Type" value={data.restaurantType || '—'} />
                <ReviewRow label="Branches" value={data.branches || '—'} />
            </ReviewCard>

            <ReviewCard title="Legal">
                <ReviewRow label="GST" value={data.gst || '—'} />
                <ReviewRow label="FSSAI" value={data.fssai || '—'} />
                <ReviewRow label="PAN" value={data.pan || '—'} />
            </ReviewCard>

            <ReviewCard title="Documents">
                <div>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                    <p className="mt-0.5 text-sm font-semibold">
                        {uploadedCount} of {DOC_FIELDS.length}
                    </p>
                </div>
            </ReviewCard>

            <div>
                <label className="flex cursor-pointer items-center gap-2 pt-2 text-sm">
                    <span
                        role="checkbox"
                        aria-checked={data.termsAccepted}
                        onClick={() => onAccept(!data.termsAccepted)}
                        className={
                            'flex size-5 shrink-0 items-center justify-center rounded-full border ' +
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
                        I agree to Swift Drop's{' '}
                        <Link href="#" className="text-primary hover:underline">
                            Partner Terms
                        </Link>{' '}
                        and confirm the information is accurate.
                    </span>
                </label>
                {errors.termsAccepted && (
                    <p className="mt-1 text-xs text-rose-600">{errors.termsAccepted}</p>
                )}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="size-4 shrink-0" />
                Your application will be reviewed within 24 hours.
            </div>
        </div>
    );
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <h4 className="text-base font-semibold tracking-tight">{title}</h4>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">{children}</div>
        </div>
    );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-sm font-semibold">{value}</p>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

interface PartnerApplyProps {
    initialStep?: number;
    initialData?: Partial<FormState>;
    initialDocuments?: Partial<Record<DocKey, { uploaded: boolean } | null>>;
}

const DEFAULT_DATA: FormState = {
    restaurantName: '',
    legalName: '',
    ownerName: '',
    mobile: '',
    email: '',
    restaurantType: '',
    cuisines: '',
    branches: '',
    seating: '',
    fullAddress: '',
    gst: '',
    fssai: '',
    pan: '',
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    termsAccepted: false,
};

export default function PartnerApply({
    initialStep = 1,
    initialData = {},
    initialDocuments = {},
}: PartnerApplyProps) {
    const clampStep = (n: number): StepKey =>
        (Math.max(1, Math.min(4, Math.floor(n))) as StepKey);

    const [step, setStep] = useState<StepKey>(clampStep(initialStep));
    const [data, setData] = useState<FormState>({ ...DEFAULT_DATA, ...initialData });
    const [uploads, setUploads] = useState<Record<DocKey, File | null>>({
        gstCert: null,
        fssai: null,
        pan: null,
        cancelledCheque: null,
        ownerId: null,
        menu: null,
    });
    // Server-side filenames already on disk for previously uploaded docs.
    const [savedDocs] = useState<Partial<Record<DocKey, { uploaded: boolean } | null>>>(initialDocuments);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const update = (patch: Partial<FormState>) => {
        setData((prev) => ({ ...prev, ...patch }));
        // Clear errors for fields the user just edited.
        setErrors((prev) => {
            const next = { ...prev };
            for (const key of Object.keys(patch)) {
                delete next[key];
            }
            return next;
        });
    };

    // Strip the `data.` prefix Laravel adds to nested validation keys so the
    // returned errors line up with our flat field-name lookups.
    const normalizeServerErrors = (
        serverErrors: Record<string, string>,
    ): Record<string, string> => {
        const out: Record<string, string> = {};
        for (const [key, message] of Object.entries(serverErrors)) {
            out[key.startsWith('data.') ? key.slice('data.'.length) : key] = message;
        }
        return out;
    };

    /**
     * Persist the data the user just entered for `currentStep`. The server
     * writes that step's columns and advances its own resume cursor — the
     * frontend should NOT pre-advance the UI step before this succeeds.
     */
    const persistDraft = (
        currentStep: StepKey,
        payload: FormState = data,
        onSuccess?: () => void,
    ) => {
        setSaving(true);
        router.post(
            route('partner.apply.save'),
            { step: currentStep, data: { ...payload } },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onSuccess?.(),
                onError: (serverErrors) =>
                    setErrors(normalizeServerErrors(serverErrors as Record<string, string>)),
                onFinish: () => setSaving(false),
            },
        );
    };

    const handleUpload = (key: DocKey, file: File | null) => {
        setUploads((prev) => ({ ...prev, [key]: file }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[`doc.${key}`];
            return next;
        });
        if (!file) return;
        router.post(
            route('partner.apply.documents', { type: key }),
            { file },
            { preserveScroll: true, preserveState: true, forceFormData: true },
        );
    };

    const goBack = () => {
        if (step === 1) return;
        // Back is pure navigation — don't write anything to the server. The
        // user can always click Continue again from the prior step to save.
        setErrors({});
        setStep(clampStep(step - 1));
    };

    const goNext = () => {
        if (step === 4) return;
        const stepErrors = validateStep(step, data, uploads, savedDocs);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            return;
        }
        setErrors({});
        const next = clampStep(step + 1);
        // Save THIS step's data first, then advance the UI on success so a
        // server-side validation failure keeps us on the current step.
        persistDraft(step, data, () => setStep(next));
    };

    const handleSubmit = () => {
        // Validate every step's requirements before submitting.
        const allErrors: Record<string, string> = {};
        for (const s of [1, 2, 3, 4] as StepKey[]) {
            Object.assign(allErrors, validateStep(s, data, uploads, savedDocs));
        }
        if (Object.keys(allErrors).length > 0) {
            setErrors(allErrors);
            // Jump back to the first step that has an error so the user can see it.
            const firstBad =
                Object.keys(allErrors).some((k) => RESTAURANT_KEYS.has(k))
                    ? 1
                    : Object.keys(allErrors).some((k) => LEGAL_KEYS.has(k))
                      ? 2
                      : Object.keys(allErrors).some((k) => k.startsWith('doc.'))
                        ? 3
                        : 4;
            setStep(firstBad as StepKey);
            return;
        }
        setSubmitting(true);
        router.post(
            route('partner.apply.submit'),
            { data: { ...data } },
            {
                onError: (serverErrors) =>
                    setErrors(normalizeServerErrors(serverErrors as Record<string, string>)),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const canSubmit = step === 4 && data.termsAccepted;

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <Head title="Apply — Swift Drop Partner" />

            <PartnerHeader />

            <main className="flex-1 px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-[1100px]">
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Step {step} of 4
                    </span>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                        Partner application
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Tell us about your restaurant. Saves automatically as draft.
                    </p>

                    <Stepper current={step} />

                    <section className="mt-6 rounded-2xl border border-border bg-background p-5 sm:p-8">
                        {step === 1 && (
                            <RestaurantStep data={data} update={update} errors={errors} />
                        )}
                        {step === 2 && (
                            <LegalBankStep data={data} update={update} errors={errors} />
                        )}
                        {step === 3 && (
                            <DocumentsStep
                                uploads={uploads}
                                savedDocs={savedDocs}
                                onUpload={handleUpload}
                                errors={errors}
                            />
                        )}
                        {step === 4 && (
                            <ReviewStep
                                data={data}
                                uploads={uploads}
                                savedDocs={savedDocs}
                                onAccept={(v) => update({ termsAccepted: v })}
                                errors={errors}
                            />
                        )}

                        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
                            <button
                                type="button"
                                onClick={goBack}
                                disabled={step === 1}
                                className="text-sm font-semibold text-foreground hover:text-primary disabled:opacity-50"
                            >
                                Back
                            </button>
                            <div className="flex items-center gap-3">
                                {step < 4 ? (
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
                                        disabled={!canSubmit || submitting}
                                        className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting…' : 'Submit application'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already a partner?{' '}
                        <Link href={route('login')} className="font-medium text-primary hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
