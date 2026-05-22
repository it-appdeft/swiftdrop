import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BadgeCheck, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../layouts/app-layout';

const COUNTRY_CODE_OPTIONS: { value: string; label: string }[] = [
    { value: '+44', label: '🇬🇧 +44' },
    { value: '+1', label: '🇺🇸 +1' },
    { value: '+91', label: '🇮🇳 +91' },
    { value: '+234', label: '🇳🇬 +234' },
];

// ─── Types ─────────────────────────────────────────────────────────────────

type TabKey = 'profile' | 'restaurant' | 'notifications' | 'security' | 'billing';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'restaurant', label: 'Restaurant' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'security', label: 'Security' },
    { key: 'billing', label: 'Billing' },
];

interface SharedProps {
    auth: { user: { id: number; name: string; email: string | null } | null };
    profile?: {
        ownerName: string;
        email: string;
        countryCode: string;
        mobile: string;
        role: string;
    };
    [key: string]: unknown;
}

// ─── Shared field primitives ───────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <label className="text-sm font-medium text-foreground">{children}</label>;
}

function TextField({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div className="space-y-1.5">
            <FieldLabel>{label}</FieldLabel>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
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

function ToggleRow({
    title,
    description,
    checked,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background p-4">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
            <ToggleSwitch checked={checked} onChange={onChange} />
        </div>
    );
}

function SettingsCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-base font-bold tracking-tight">{title}</h2>
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}

// ─── Tab panels ────────────────────────────────────────────────────────────

interface ProfileData {
    ownerName: string;
    email: string;
    countryCode: string;
    mobile: string;
    role: string;
}

function VerifiedBadge() {
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <BadgeCheck className="size-3.5" />
            Verified
        </span>
    );
}

function ReadonlyInput({ value }: { value: string }) {
    return (
        <input
            type="text"
            value={value}
            readOnly
            className="h-11 w-full cursor-not-allowed rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
        />
    );
}

function ProfileTab({ profile }: { profile: ProfileData }) {
    const form = useForm({
        ownerName: profile.ownerName,
    });

    const submit: React.FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('restaurant.settings.profile.update'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <form onSubmit={submit}>
            <SettingsCard title="Personal information">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <FieldLabel>Full name</FieldLabel>
                        <input
                            type="text"
                            value={form.data.ownerName}
                            onChange={(e) => form.setData('ownerName', e.target.value)}
                            placeholder="Rohit Mehta"
                            aria-invalid={form.errors.ownerName ? true : undefined}
                            className={
                                'h-11 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ' +
                                (form.errors.ownerName
                                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                                    : 'border-input focus:border-primary focus:ring-primary/30')
                            }
                        />
                        {form.errors.ownerName && (
                            <p className="text-xs text-rose-600">{form.errors.ownerName}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <FieldLabel>Email</FieldLabel>
                            <VerifiedBadge />
                        </div>
                        <ReadonlyInput value={profile.email} />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <FieldLabel>Mobile number</FieldLabel>
                            <VerifiedBadge />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative shrink-0">
                                <select
                                    value={profile.countryCode}
                                    disabled
                                    aria-label="Country code"
                                    className="h-11 cursor-not-allowed appearance-none rounded-md border border-input bg-muted/40 pl-3 pr-8 text-sm text-muted-foreground"
                                >
                                    {COUNTRY_CODE_OPTIONS.some(
                                        (o) => o.value === profile.countryCode,
                                    ) ? null : (
                                        <option value={profile.countryCode}>
                                            {profile.countryCode}
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
                                value={profile.mobile}
                                readOnly
                                className="h-11 flex-1 cursor-not-allowed rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Role</FieldLabel>
                        <ReadonlyInput value={profile.role} />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                    >
                        {form.processing ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </SettingsCard>
        </form>
    );
}

function RestaurantTab() {
    const [displayName, setDisplayName] = useState('Spice Route');
    const [phone, setPhone] = useState('+91 80 1234 5678');
    const [address, setAddress] = useState('100 Ft Road, Indiranagar, Bengaluru — 560038');
    const [autoAccept, setAutoAccept] = useState(true);
    const [paused, setPaused] = useState(false);
    const [scheduled, setScheduled] = useState(true);

    return (
        <div className="space-y-5">
            <SettingsCard title="Restaurant details">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField label="Display name" value={displayName} onChange={setDisplayName} />
                    <TextField label="Phone" value={phone} onChange={setPhone} />
                </div>
                <div className="space-y-1.5">
                    <FieldLabel>Address</FieldLabel>
                    <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
            </SettingsCard>

            <SettingsCard title="Order preferences">
                <ToggleRow
                    title="Auto accept orders"
                    description="Accept new orders automatically when received."
                    checked={autoAccept}
                    onChange={setAutoAccept}
                />
                <ToggleRow
                    title="Pause new orders"
                    description="Temporarily stop accepting orders."
                    checked={paused}
                    onChange={setPaused}
                />
                <ToggleRow
                    title="Allow scheduled orders"
                    description="Customers can place orders for later."
                    checked={scheduled}
                    onChange={setScheduled}
                />
            </SettingsCard>
        </div>
    );
}

function NotificationsTab() {
    const [orderAlerts, setOrderAlerts] = useState(true);
    const [payoutUpdates, setPayoutUpdates] = useState(true);
    const [reviewsRatings, setReviewsRatings] = useState(false);
    const [announcements, setAnnouncements] = useState(true);

    return (
        <SettingsCard title="Channels">
            <ToggleRow
                title="Order alerts"
                description="New, accepted, ready, cancelled."
                checked={orderAlerts}
                onChange={setOrderAlerts}
            />
            <ToggleRow
                title="Payout updates"
                description="When payouts are processed."
                checked={payoutUpdates}
                onChange={setPayoutUpdates}
            />
            <ToggleRow
                title="Reviews & ratings"
                description="When new reviews come in."
                checked={reviewsRatings}
                onChange={setReviewsRatings}
            />
            <ToggleRow
                title="Platform announcements"
                description="Product news from Swift Drop."
                checked={announcements}
                onChange={setAnnouncements}
            />
        </SettingsCard>
    );
}

function SecurityTab() {
    const [twoFactor, setTwoFactor] = useState(true);
    const [rememberDevices, setRememberDevices] = useState(false);

    return (
        <SettingsCard title="Login & security">
            <ToggleRow
                title="Two-factor authentication"
                description="Require OTP for every new device."
                checked={twoFactor}
                onChange={setTwoFactor}
            />
            <ToggleRow
                title="Remember devices"
                description="Skip OTP on trusted browsers for 30 days."
                checked={rememberDevices}
                onChange={setRememberDevices}
            />

            <div className="flex flex-wrap gap-2 pt-1">
                <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-semibold hover:border-primary hover:text-primary"
                >
                    View active sessions
                </button>
                <button
                    type="button"
                    onClick={() => router.post(route('logout'))}
                    className="inline-flex h-10 items-center rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
                >
                    Log out everywhere
                </button>
            </div>
        </SettingsCard>
    );
}

function BillingTab() {
    return (
        <SettingsCard title="Plan">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-base font-bold tracking-tight">
                        Growth · 15% per order
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Renews automatically with every weekly payout.
                    </p>
                </div>
                <button
                    type="button"
                    className="inline-flex h-10 shrink-0 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                    Change plan
                </button>
            </div>
        </SettingsCard>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function RestaurantSettings() {
    const { auth, profile } = usePage<SharedProps>().props;
    const profileData: ProfileData = profile ?? {
        ownerName: '',
        email: auth?.user?.email ?? '',
        countryCode: '+44',
        mobile: '',
        role: 'Owner',
    };
    const [tab, setTab] = useState<TabKey>('profile');

    return (
        <AppLayout active="settings">
            <Head title="Settings — Swift Drop Partner" />

            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Profile, restaurant, notifications and security.
                    </p>
                </header>

                <div className="flex flex-wrap gap-1 rounded-full border border-border bg-background p-1 sm:w-fit">
                    {TABS.map((t) => {
                        const isActive = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={
                                    'rounded-full px-4 py-1.5 text-sm font-semibold transition ' +
                                    (isActive
                                        ? 'bg-foreground text-background'
                                        : 'text-muted-foreground hover:text-foreground')
                                }
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {tab === 'profile' && <ProfileTab profile={profileData} />}
                {tab === 'restaurant' && <RestaurantTab />}
                {tab === 'notifications' && <NotificationsTab />}
                {tab === 'security' && <SecurityTab />}
                {tab === 'billing' && <BillingTab />}
            </div>
        </AppLayout>
    );
}
