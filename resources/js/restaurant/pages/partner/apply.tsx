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
} from 'lucide-react';
import { useState } from 'react';
import { SwiftdropWordmark } from '../../../web/components/swiftdrop-wordmark';
import {
    AccountRestaurantStep,
    CategoriesStep,
    DAYS,
    DEFAULT_STATE,
    DOC_FIELDS,
    DocumentsStep,
    LegalBankStep,
    LocationHoursStep,
    type DocSlot,
    type FoodItemOption,
    type FormState,
} from '../../components/partner-application-form';

// ─── Types & static data ────────────────────────────────────────────────────

type StepKey = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Record<StepKey, string> = {
    1: 'Account & Restaurant',
    2: 'Location & Hours',
    3: 'Legal & Bank',
    4: 'Documents',
    5: 'Categories',
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


interface PartnerApplyProps {
    initialStep?: number;
    initialData?: Partial<FormState>;
    initialDocuments?: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
    /** Catalog of food items managed by the admin — picker for Step 1. */
    foodItems?: FoodItemOption[];
    /** Browser key for the Step 2 location picker. Null hides the map. */
    googleMapsApiKey?: string | null;
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
    foodItems,
}: {
    data: FormState;
    documents: Partial<Record<DocSlot, { uploaded: boolean } | null>>;
    onAccept: (v: boolean) => void;
    onEditStep: (step: StepKey) => void;
    errors: Record<string, string>;
    foodItems: FoodItemOption[];
}) {
    const uploadedCount = DOC_FIELDS.filter((d) => documents[d.key]?.uploaded).length;
    const openDays = DAYS.filter((d) => data.hours[d.key].open)
        .map((d) => d.label)
        .join(', ');
    const filledCategories = data.categories.filter((c) => c.name.trim() !== '');
    const selectedFoodItemNames = foodItems
        .filter((f) => data.foodItemIds.includes(f.id))
        .map((f) => f.name)
        .join(', ');

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
                <SummaryRow label="Food items" value={selectedFoodItemNames || '—'} />
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

            <SummaryCard title="Categories" onEdit={() => onEditStep(5)}>
                <SummaryRow
                    label="Categories"
                    value={
                        filledCategories.length
                            ? filledCategories.map((c) => c.name).join(', ')
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
    foodItems = [],
    googleMapsApiKey = null,
    completed = false,
}: PartnerApplyProps) {
    if (completed) {
        return <CompletedScreen />;
    }

    const clamp = (n: number): StepKey =>
        Math.max(1, Math.min(6, Math.floor(n))) as StepKey;

    const merged: FormState = { ...DEFAULT_STATE, ...initialData };
    if (!merged.categories || merged.categories.length === 0) {
        merged.categories = [{ name: '', diet: 'veg' }];
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
                return (
                    <AccountRestaurantStep
                        data={data}
                        update={update}
                        errors={errors}
                        foodItems={foodItems}
                    />
                );
            case 2:
                return (
                    <LocationHoursStep
                        data={data}
                        update={update}
                        errors={errors}
                        googleMapsApiKey={googleMapsApiKey}
                    />
                );
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
                return <CategoriesStep data={data} update={update} errors={errors} />;
            case 6:
                return (
                    <ReviewStep
                        data={data}
                        documents={documents}
                        onAccept={(v) => update({ termsAccepted: v })}
                        onEditStep={(s) => setStep(s)}
                        errors={errors}
                        foodItems={foodItems}
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
