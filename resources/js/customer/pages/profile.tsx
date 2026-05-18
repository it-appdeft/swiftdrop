import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Camera,
    CheckCircle2,
    CreditCard,
    FileText,
    Heart,
    HelpCircle,
    Home as HomeIcon,
    LogOut,
    MapPin,
    PencilLine,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    ShoppingBag,
    Star,
    Trash2,
    Users as UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CustomerHeader } from '../components/customer-header';
import { SiteFooter } from '../../web/components/site-footer';

// ─── Server-supplied types ────────────────────────────────────────────────────

interface ServerAddress {
    id: number;
    label: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    county: string | null;
    postcode: string;
    lat: number;
    lng: number;
    is_default: boolean;
}

interface ServerUser {
    id: number;
    name: string;
    email: string | null;
    /** Subscriber-only digits (no country code). */
    mobile: string | null;
    /** Dialling prefix, e.g. "+44". */
    country_code: string | null;
    /** country_code + mobile, ready to pass as an OTP target. */
    canonical_mobile: string | null;
}

interface ServerCustomer {
    id: number;
    user: ServerUser;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
    date_of_birth: string | null;
    addresses: ServerAddress[];
}

interface ServerDeletionReason {
    id: number;
    label: string;
    slug: string | null;
    is_other: boolean;
    sort_order: number;
}

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string | null; mobile?: string | null } | null;
    };
    customer?: ServerCustomer | null;
    deletionReasons?: ServerDeletionReason[];
    flash?: {
        status?: string;
        otp?: { target: string; expires_in: number; test_code: string | null } | null;
        deletion?: { target: string; expires_in: number; test_code: string | null } | null;
        otpResult?: { verified?: boolean; type?: string } | null;
    };
    [key: string]: unknown;
}

type SidebarKey =
    | 'orders'
    | 'addresses'
    | 'favorites'
    | 'payments'
    | 'settings'
    | 'privacy'
    | 'terms'
    | 'help';

const SIDEBAR_ITEMS: { key: SidebarKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'orders', label: 'Order History', icon: ShoppingBag },
    { key: 'addresses', label: 'Saved Address', icon: MapPin },
    { key: 'favorites', label: 'Favorites', icon: Heart },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { key: 'terms', label: 'Terms & Conditions', icon: FileText },
    { key: 'help', label: 'Help', icon: HelpCircle },
];

// ─── Mock data ─────────────────────────────────────────────────────────────────

interface PastOrder {
    id: number;
    restaurant: string;
    location: string;
    image: string;
    items: { qty: number; name: string }[];
    paymentFailed?: boolean;
    placedAt: string;
}

const PAST_ORDERS: PastOrder[] = [
    {
        id: 1,
        restaurant: 'The Marble Grill',
        location: 'Green Park, CA 90210',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
        items: [
            { qty: 1, name: 'Margherita Pizza Giant Slice' },
            { qty: 1, name: 'Sweet Corn Pizza Regular' },
        ],
        placedAt: 'Ordered April 25, 5:08 PM',
    },
    {
        id: 2,
        restaurant: 'The Marble Grill',
        location: 'Green Park, CA 90210',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
        items: [
            { qty: 1, name: 'Margherita Pizza Giant Slice' },
            { qty: 1, name: 'Sweet Corn Pizza Regular' },
        ],
        paymentFailed: true,
        placedAt: 'Ordered April 25, 5:08 PM',
    },
    {
        id: 3,
        restaurant: 'The Marble Grill',
        location: 'Green Park, CA 90210',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
        items: [
            { qty: 1, name: 'Margherita Pizza Giant Slice' },
            { qty: 1, name: 'Sweet Corn Pizza Regular' },
        ],
        placedAt: 'Ordered April 25, 5:08 PM',
    },
];

interface FavoriteRestaurant {
    id: number;
    name: string;
    rating: number;
    eta: string;
    distance: string;
    discount: string;
    image: string;
}

const FAVORITE_RESTAURANTS: FavoriteRestaurant[] = [
    {
        id: 1,
        name: 'The Marble Grill',
        rating: 4.5,
        eta: '20-30 min',
        distance: '4.9 mi',
        discount: '60% OFF select items',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=450&fit=crop',
    },
    {
        id: 2,
        name: 'My World Pizza',
        rating: 4.6,
        eta: '20-30 min',
        distance: '5.9 mi',
        discount: '20% OFF select items',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop',
    },
    {
        id: 3,
        name: 'My World Pizza',
        rating: 4.6,
        eta: '20-30 min',
        distance: '5.9 mi',
        discount: '20% OFF select items',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop',
    },
];

interface FavoriteItem {
    id: number;
    name: string;
    price: string;
    rating: number;
    veg: boolean;
    image: string;
}

interface FavoriteItemGroup {
    restaurant: string;
    eta: string;
    distance: string;
    items: FavoriteItem[];
}

const FAVORITE_ITEM_GROUPS: FavoriteItemGroup[] = [
    {
        restaurant: 'The Marble Grill',
        eta: '20-30 min',
        distance: '4.9 mi',
        items: [
            {
                id: 1,
                name: 'Margherita Ultimate Cheese Pizza',
                price: '£8.23',
                rating: 4.8,
                veg: true,
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop',
            },
            {
                id: 2,
                name: 'Margherita Pizza Giant Slice',
                price: '£8.23',
                rating: 4.8,
                veg: true,
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
            },
        ],
    },
    {
        restaurant: 'My World Pizza',
        eta: '20-30 min',
        distance: '4.9 mi',
        items: [
            {
                id: 3,
                name: 'Margherita Ultimate Cheese Pizza',
                price: '£8.23',
                rating: 4.8,
                veg: true,
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop',
            },
            {
                id: 4,
                name: 'Margherita Pizza Giant Slice',
                price: '£8.23',
                rating: 4.8,
                veg: true,
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
            },
        ],
    },
];

interface SavedCard {
    id: number;
    last4: string;
    holder: string;
    expires: string;
    brand: 'VISA' | 'MC';
    isDefault?: boolean;
}

const INITIAL_CARDS: SavedCard[] = [
    { id: 1, last4: '4242', holder: 'ALEX JOHNSON', expires: '12/26', brand: 'VISA', isDefault: true },
    { id: 2, last4: '8888', holder: 'ALEX JOHNSON', expires: '08/25', brand: 'VISA' },
    { id: 3, last4: '8888', holder: 'ALEX JOHNSON', expires: '08/25', brand: 'VISA' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function initialsFrom(name: string): string {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || '?'
    );
}

// ─── Edit Profile dialog ───────────────────────────────────────────────────────

const OTP_LENGTH = 4;
const OTP_RESEND_SECONDS = 59;

interface OtpInputRowProps {
    digits: string[];
    onDigit: (index: number, value: string) => void;
    onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputsRef: React.RefObject<Array<HTMLInputElement | null>>;
    resendIn: number;
    onResend: () => void;
    onVerify: () => void;
    disabled?: boolean;
    label?: string;
}

function OtpInputRow({ digits, onDigit, onKeyDown, inputsRef, resendIn, onResend, onVerify, disabled, label }: OtpInputRowProps) {
    return (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold">Enter Verification Code</p>
            <p className="text-[11px] text-muted-foreground">{label ?? "We've sent a 4-digit code to your email."}</p>
            <div className="mt-3 flex items-center gap-2">
                <div className="flex flex-1 gap-2">
                    {digits.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => {
                                inputsRef.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => onDigit(i, e.target.value)}
                            onKeyDown={(e) => onKeyDown(i, e)}
                            className="size-10 rounded-md border border-input bg-background text-center text-base font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    ))}
                </div>
                <button
                    type="button"
                    onClick={onVerify}
                    disabled={disabled || digits.join('').length < OTP_LENGTH}
                    className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                    Verify
                </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
                {resendIn > 0 ? (
                    <>
                        <span className="font-medium text-primary">Resend code</span>
                        <span className="text-muted-foreground">
                            {String(Math.floor(resendIn / 60)).padStart(2, '0')}:{String(resendIn % 60).padStart(2, '0')}
                        </span>
                    </>
                ) : (
                    <button type="button" onClick={onResend} className="font-medium text-primary hover:underline">
                        Resend code
                    </button>
                )}
            </div>
        </div>
    );
}

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialName: string;
    initialEmail: string;
    /** Subscriber-only digits (no prefix). */
    initialMobile: string | null;
    /** Dialling prefix, e.g. "+44". */
    initialCountryCode: string | null;
    initialPhoto: string | null;
}

interface ProfileFormState {
    name: string;
    profile_photo: File | null;
    // Laravel rejects PUT with multipart bodies — Inertia advises sending
    // a real POST and method-spoofing via this hidden field.
    _method: 'put';
    [key: string]: string | File | null;
}

/**
 * Three sub-flows in one modal:
 *   1. Save full name + profile photo (PUT /customer/profile, multipart)
 *   2. Change email — verify current → enter new → verify new (two OTPs)
 *   3. Change phone — same as email but over SMS
 *
 * Each OTP step goes through the unified /customer/profile/otp/send +
 * /customer/profile/otp/verify endpoints; the `type` field on each request
 * tells the server which step it is.
 */
function EditProfileDialog({
    open,
    onOpenChange,
    initialName,
    initialEmail,
    initialMobile,
    initialCountryCode,
    initialPhoto,
}: EditProfileDialogProps) {
    // ── Name + photo ───────────────────────────────────────────────────────
    const profileForm = useForm<ProfileFormState>({
        name: initialName,
        profile_photo: null,
        _method: 'put',
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhoto);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Reset local state whenever the modal reopens with fresh server data.
    useEffect(() => {
        if (open) {
            profileForm.setData({ name: initialName, profile_photo: null, _method: 'put' });
            profileForm.clearErrors();
            setPhotoPreview(initialPhoto);
        }
        // setData is referentially stable; safe to depend only on open + seed values.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialName, initialPhoto]);

    const onPhotoChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        profileForm.setData('profile_photo', file);
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPhotoPreview(objectUrl);
        } else {
            setPhotoPreview(initialPhoto);
        }
    };

    // Revoke object URLs when we replace them, so the browser can GC the blob.
    const previousObjectUrl = useRef<string | null>(null);
    useEffect(() => {
        if (photoPreview?.startsWith('blob:')) {
            previousObjectUrl.current = photoPreview;
        }
        return () => {
            if (previousObjectUrl.current && previousObjectUrl.current !== photoPreview) {
                URL.revokeObjectURL(previousObjectUrl.current);
            }
        };
    }, [photoPreview]);

    // Verify-current OTP renders INLINE under the corresponding field; only
    // the "enter new" + "verify new" steps live in the popup sub-dialogs.
    type VerifyState = 'idle' | 'awaitingCode' | 'verified';
    const [emailVerifyState, setEmailVerifyState] = useState<VerifyState>('idle');
    const [emailDigits, setEmailDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [emailResendIn, setEmailResendIn] = useState(0);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailVerifying, setEmailVerifying] = useState(false);
    const emailInputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const [phoneVerifyState, setPhoneVerifyState] = useState<VerifyState>('idle');
    const [phoneDigits, setPhoneDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [phoneResendIn, setPhoneResendIn] = useState(0);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [phoneVerifying, setPhoneVerifying] = useState(false);
    const phoneInputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);

    // Resend countdowns.
    useEffect(() => {
        if (emailResendIn <= 0) return;
        const t = setTimeout(() => setEmailResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [emailResendIn]);
    useEffect(() => {
        if (phoneResendIn <= 0) return;
        const t = setTimeout(() => setPhoneResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [phoneResendIn]);

    // Reset all inline OTP state whenever the dialog reopens.
    useEffect(() => {
        if (!open) return;
        setEmailVerifyState('idle');
        setEmailDigits(Array(OTP_LENGTH).fill(''));
        setEmailError(null);
        setPhoneVerifyState('idle');
        setPhoneDigits(Array(OTP_LENGTH).fill(''));
        setPhoneError(null);
    }, [open]);

    const sendCurrentEmailOtp = () => {
        if (!initialEmail) return;
        setEmailError(null);
        router.post(
            route('customer.profile.otp.send'),
            { type: 'verify_current_email', channel: 'email', email: initialEmail },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setEmailVerifyState('awaitingCode');
                    setEmailDigits(Array(OTP_LENGTH).fill(''));
                    setEmailResendIn(OTP_RESEND_SECONDS);
                    toast.info(`Verification code sent to ${initialEmail}.`);
                },
                onError: (errors) => {
                    const msg = Object.values(errors).flat().join(' ') || 'Failed to send code.';
                    setEmailError(msg);
                    toast.error(msg);
                },
            },
        );
    };

    const verifyCurrentEmail = () => {
        if (!initialEmail) return;
        setEmailError(null);
        setEmailVerifying(true);
        router.post(
            route('customer.profile.otp.verify'),
            {
                type: 'verify_current_email',
                channel: 'email',
                email: initialEmail,
                code: emailDigits.join(''),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setEmailVerifyState('verified');
                    setEmailDialogOpen(true); // Pop the "enter new email" sub-modal.
                },
                onError: (errors) => {
                    const msg = Object.values(errors).flat().join(' ') || 'Invalid code.';
                    setEmailError(msg);
                    toast.error(msg);
                },
                onFinish: () => setEmailVerifying(false),
            },
        );
    };

    // Mobile is the subscriber-only digits; pair with the real country_code
    // (falls back to "+44" if the user pre-dates the split-storage backfill).
    const phoneCountry = initialCountryCode ?? '+44';
    const phoneDisplay = initialMobile ? `${phoneCountry} ${initialMobile}` : '';

    const sendCurrentPhoneOtp = () => {
        if (!initialMobile) return;
        setPhoneError(null);
        router.post(
            route('customer.profile.otp.send'),
            {
                type: 'verify_current_phone',
                channel: 'sms',
                country_code: phoneCountry,
                mobile: initialMobile,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setPhoneVerifyState('awaitingCode');
                    setPhoneDigits(Array(OTP_LENGTH).fill(''));
                    setPhoneResendIn(OTP_RESEND_SECONDS);
                    toast.info(`Verification code sent to ${phoneDisplay}.`);
                },
                onError: (errors) => {
                    const msg = Object.values(errors).flat().join(' ') || 'Failed to send code.';
                    setPhoneError(msg);
                    toast.error(msg);
                },
            },
        );
    };

    const verifyCurrentPhone = () => {
        if (!initialMobile) return;
        setPhoneError(null);
        setPhoneVerifying(true);
        router.post(
            route('customer.profile.otp.verify'),
            {
                type: 'verify_current_phone',
                channel: 'sms',
                country_code: phoneCountry,
                mobile: initialMobile,
                code: phoneDigits.join(''),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setPhoneVerifyState('verified');
                    setPhoneDialogOpen(true);
                },
                onError: (errors) => {
                    const msg = Object.values(errors).flat().join(' ') || 'Invalid code.';
                    setPhoneError(msg);
                    toast.error(msg);
                },
                onFinish: () => setPhoneVerifying(false),
            },
        );
    };

    const onEmailDigit = (i: number, v: string) => {
        const d = v.replace(/\D/g, '').slice(-1);
        const next = [...emailDigits];
        next[i] = d;
        setEmailDigits(next);
        if (d && i < OTP_LENGTH - 1) emailInputsRef.current[i + 1]?.focus();
    };
    const onEmailKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !emailDigits[i] && i > 0) emailInputsRef.current[i - 1]?.focus();
    };
    const onPhoneDigit = (i: number, v: string) => {
        const d = v.replace(/\D/g, '').slice(-1);
        const next = [...phoneDigits];
        next[i] = d;
        setPhoneDigits(next);
        if (d && i < OTP_LENGTH - 1) phoneInputsRef.current[i + 1]?.focus();
    };
    const onPhoneKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !phoneDigits[i] && i > 0) phoneInputsRef.current[i - 1]?.focus();
    };

    // ── Profile save (name + photo) ────────────────────────────────────────
    const saveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        // Send as POST + _method=put so Laravel routes it to the PUT handler
        // (real PUT can't carry multipart bodies). The _method field already
        // lives in the form state, so FormData picks it up automatically.
        profileForm.post(route('customer.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile updated.');
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Could not update profile. Please review the fields below.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Edit Profile</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Photo + Name */}
                    <form onSubmit={saveProfile} className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="size-16 overflow-hidden rounded-full border border-border bg-muted">
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt="Profile preview"
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground">
                                            {initialsFrom(profileForm.data.name || initialName)}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-border bg-background text-foreground shadow hover:bg-muted"
                                    aria-label="Change profile photo"
                                >
                                    <Camera className="size-3.5" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={onPhotoChosen}
                                    className="hidden"
                                />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                                <input
                                    type="text"
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                        {profileForm.errors.name && (
                            <p className="text-xs text-destructive">{profileForm.errors.name}</p>
                        )}
                        {profileForm.errors.profile_photo && (
                            <p className="text-xs text-destructive">{profileForm.errors.profile_photo}</p>
                        )}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={
                                    profileForm.processing ||
                                    (profileForm.data.name === initialName && !profileForm.data.profile_photo)
                                }
                                className="h-10 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            >
                                {profileForm.processing ? 'Saving…' : 'Save Profile'}
                            </button>
                        </div>
                    </form>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={initialEmail}
                                readOnly
                                placeholder="john@example.com"
                                className="h-10 flex-1 rounded-md border border-input bg-muted/40 px-3 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (!initialEmail) {
                                        setEmailDialogOpen(true);
                                        return;
                                    }
                                    sendCurrentEmailOtp();
                                }}
                                className="h-10 rounded-md border border-input bg-background px-3 text-xs font-semibold text-primary hover:bg-muted"
                            >
                                {emailVerifyState === 'awaitingCode' ? 'Resend' : 'Change'}
                            </button>
                        </div>
                        {emailVerifyState === 'awaitingCode' && (
                            <OtpInputRow
                                digits={emailDigits}
                                onDigit={onEmailDigit}
                                onKeyDown={onEmailKeyDown}
                                inputsRef={emailInputsRef}
                                resendIn={emailResendIn}
                                onResend={sendCurrentEmailOtp}
                                onVerify={verifyCurrentEmail}
                                disabled={emailVerifying}
                                label={`We've sent a code to ${initialEmail}.`}
                            />
                        )}
                        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                    </div>

                    {/* Phone — country code and subscriber digits shown
                        in separate inputs to mirror the split storage. */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Mobile Number</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={phoneCountry}
                                readOnly
                                aria-label="Country code"
                                className="h-10 w-16 rounded-md border border-input bg-muted/40 px-2 text-center text-sm"
                            />
                            <input
                                type="tel"
                                value={initialMobile ?? ''}
                                readOnly
                                placeholder="—"
                                aria-label="Mobile number"
                                className="h-10 flex-1 rounded-md border border-input bg-muted/40 px-3 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (!initialMobile) {
                                        setPhoneDialogOpen(true);
                                        return;
                                    }
                                    sendCurrentPhoneOtp();
                                }}
                                className="h-10 rounded-md border border-input bg-background px-3 text-xs font-semibold text-primary hover:bg-muted"
                            >
                                {phoneVerifyState === 'awaitingCode' ? 'Resend' : 'Change'}
                            </button>
                        </div>
                        {phoneVerifyState === 'awaitingCode' && (
                            <OtpInputRow
                                digits={phoneDigits}
                                onDigit={onPhoneDigit}
                                onKeyDown={onPhoneKeyDown}
                                inputsRef={phoneInputsRef}
                                resendIn={phoneResendIn}
                                onResend={sendCurrentPhoneOtp}
                                onVerify={verifyCurrentPhone}
                                disabled={phoneVerifying}
                                label={`We've sent a code to ${phoneDisplay}.`}
                            />
                        )}
                        {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                    </div>
                </div>
            </DialogContent>

            <ChangeEmailDialog
                open={emailDialogOpen}
                onOpenChange={(v) => {
                    setEmailDialogOpen(v);
                    if (!v) setEmailVerifyState('idle'); // Reset inline state on close.
                }}
            />
            <ChangePhoneDialog
                open={phoneDialogOpen}
                onOpenChange={(v) => {
                    setPhoneDialogOpen(v);
                    if (!v) setPhoneVerifyState('idle');
                }}
            />
        </Dialog>
    );
}

// ─── Change Email sub-dialog (enter-new + verify-new only) ─────────────────────

interface ChangeEmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Pops up after the parent EditProfileDialog has already verified the
 * customer's current email. Handles only steps 2-3: capture the new email,
 * fire the update_email OTP, verify it, reload props.
 */
function ChangeEmailDialog({ open, onOpenChange }: ChangeEmailDialogProps) {
    type Step = 'enterNew' | 'verifyNew';
    const [step, setStep] = useState<Step>('enterNew');
    const [newEmail, setNewEmail] = useState('');
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [resendIn, setResendIn] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendIn]);

    useEffect(() => {
        if (!open) return;
        setStep('enterNew');
        setNewEmail('');
        setDigits(Array(OTP_LENGTH).fill(''));
        setError(null);
        setProcessing(false);
    }, [open]);

    const sendNewOtp = (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);
        setProcessing(true);
        router.post(
            route('customer.profile.otp.send'),
            { type: 'update_email', channel: 'email', email: newEmail },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setStep('verifyNew');
                    setDigits(Array(OTP_LENGTH).fill(''));
                    setResendIn(OTP_RESEND_SECONDS);
                    toast.info(`Verification code sent to ${newEmail}.`);
                },
                onError: (errors) => {
                    const msg = Object.values(errors).flat().join(' ') || 'Failed to send code.';
                    setError(msg);
                    toast.error(msg);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const verifyNew = () => {
        setError(null);
        setProcessing(true);
        router.post(
            route('customer.profile.otp.verify'),
            {
                type: 'update_email',
                channel: 'email',
                email: newEmail,
                code: digits.join(''),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Email updated successfully.');
                    router.reload({
                        only: ['customer', 'auth'],
                        onFinish: () => onOpenChange(false),
                    });
                },
                onError: (errors) => {
                    const msg = Object.values(errors).flat().join(' ') || 'Invalid code.';
                    setError(msg);
                    toast.error(msg);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const onDigit = (i: number, v: string) => {
        const d = v.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = d;
        setDigits(next);
        if (d && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
    };
    const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-center">Edit Email Address</DialogTitle>
                </DialogHeader>

                {step === 'enterNew' && (
                    <form onSubmit={sendNewOtp} className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="Add New Email"
                                autoFocus
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <button
                            type="submit"
                            disabled={processing || !newEmail}
                            className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            Verify
                        </button>
                    </form>
                )}

                {step === 'verifyNew' && (
                    <>
                        <p className="text-center text-xs text-muted-foreground">
                            Enter the code we sent to{' '}
                            <span className="font-medium text-foreground">{newEmail}</span>.
                        </p>
                        <OtpInputRow
                            digits={digits}
                            onDigit={onDigit}
                            onKeyDown={onKeyDown}
                            inputsRef={inputsRef}
                            resendIn={resendIn}
                            onResend={() => sendNewOtp()}
                            onVerify={verifyNew}
                            disabled={processing}
                            label={`Code sent to ${newEmail}`}
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Change Phone sub-dialog (enter-new + verify-new only) ─────────────────────

interface ChangePhoneDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Pops up after the parent EditProfileDialog has already verified the
 * customer's current mobile. Handles only the new-number steps: capture
 * country_code + mobile, send update_phone OTP, verify, reload props.
 */
function ChangePhoneDialog({ open, onOpenChange }: ChangePhoneDialogProps) {
    type Step = 'enterNew' | 'verifyNew';
    const [step, setStep] = useState<Step>('enterNew');
    const [newCountry, setNewCountry] = useState('+44');
    const [newMobile, setNewMobile] = useState('');
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [resendIn, setResendIn] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendIn]);

    useEffect(() => {
        if (!open) return;
        setStep('enterNew');
        setNewCountry('+44');
        setNewMobile('');
        setDigits(Array(OTP_LENGTH).fill(''));
        setError(null);
        setProcessing(false);
    }, [open]);

    const sendNewOtp = (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);
        setProcessing(true);
        router.post(
            route('customer.profile.otp.send'),
            { type: 'update_phone', channel: 'sms', country_code: newCountry, mobile: newMobile },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setStep('verifyNew');
                    setDigits(Array(OTP_LENGTH).fill(''));
                    setResendIn(OTP_RESEND_SECONDS);
                    toast.info(`Verification code sent to ${newCountry} ${newMobile}.`);
                },
                onError: (errors) => {
                    const msg = Object.values(errors).flat().join(' ') || 'Failed to send code.';
                    setError(msg);
                    toast.error(msg);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const verifyNew = () => {
        setError(null);
        setProcessing(true);
        router.post(
            route('customer.profile.otp.verify'),
            {
                type: 'update_phone',
                channel: 'sms',
                country_code: newCountry,
                mobile: newMobile,
                code: digits.join(''),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Mobile number updated successfully.');
                    router.reload({
                        only: ['customer', 'auth'],
                        onFinish: () => onOpenChange(false),
                    });
                },
                onError: (errors) => {
                    const msg = Object.values(errors).flat().join(' ') || 'Invalid code.';
                    setError(msg);
                    toast.error(msg);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const onDigit = (i: number, v: string) => {
        const d = v.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = d;
        setDigits(next);
        if (d && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
    };
    const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-center">Edit Mobile Number</DialogTitle>
                </DialogHeader>

                {step === 'enterNew' && (
                    <form onSubmit={sendNewOtp} className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Mobile Number</label>
                            <div className="flex gap-2">
                                <select
                                    value={newCountry}
                                    onChange={(e) => setNewCountry(e.target.value)}
                                    className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                                >
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+91">🇮🇳 +91</option>
                                </select>
                                <input
                                    type="tel"
                                    value={newMobile}
                                    onChange={(e) => setNewMobile(e.target.value)}
                                    placeholder="Add New Number"
                                    autoFocus
                                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <button
                            type="submit"
                            disabled={processing || !newMobile}
                            className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            Verify
                        </button>
                    </form>
                )}

                {step === 'verifyNew' && (
                    <>
                        <p className="text-center text-xs text-muted-foreground">
                            Enter the code we sent to{' '}
                            <span className="font-medium text-foreground">
                                {newCountry} {newMobile}
                            </span>
                            .
                        </p>
                        <OtpInputRow
                            digits={digits}
                            onDigit={onDigit}
                            onKeyDown={onKeyDown}
                            inputsRef={inputsRef}
                            resendIn={resendIn}
                            onResend={() => sendNewOtp()}
                            onVerify={verifyNew}
                            disabled={processing}
                            label={`Code sent to ${newCountry} ${newMobile}`}
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Section: Order History ────────────────────────────────────────────────────

function OrderCard({ order }: { order: PastOrder }) {
    return (
        <article className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <header className="flex items-start gap-3">
                <img
                    src={order.image}
                    alt=""
                    className="size-12 shrink-0 rounded-lg object-cover"
                    loading="lazy"
                />
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{order.restaurant}</h3>
                    <p className="text-xs text-muted-foreground">{order.location}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="size-3" />
                    Delivered
                </span>
            </header>

            <div className="mt-3 flex flex-wrap gap-2">
                {order.items.map((item, i) => (
                    <span
                        key={`${order.id}-${i}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium text-foreground"
                    >
                        <span className="rounded bg-background px-1 text-[10px] font-semibold text-muted-foreground">
                            {item.qty}x
                        </span>
                        {item.name}
                    </span>
                ))}
            </div>

            <button
                type="button"
                className="mt-3 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
                Reorder
            </button>

            {order.paymentFailed && (
                <div className="mt-3 text-xs">
                    <p className="flex items-center gap-1 font-semibold text-rose-600">
                        <AlertCircle className="size-3.5" />
                        Payment failed
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        If any amount is deducted, it will be refunded in 3–5 working days.
                    </p>
                </div>
            )}

            <p className="mt-3 text-[11px] text-muted-foreground">{order.placedAt}</p>
        </article>
    );
}

function OrderHistorySection() {
    const [search, setSearch] = useState('');

    const filtered = PAST_ORDERS.filter((o) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return o.restaurant.toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q));
    });

    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Past Orders</h2>
            <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by restaurant or dish"
                    className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>
            <div className="mt-4 space-y-3">
                {filtered.length === 0 ? (
                    <p className="rounded-lg bg-muted/50 py-8 text-center text-sm text-muted-foreground">
                        No orders match your search.
                    </p>
                ) : (
                    filtered.map((o) => <OrderCard key={o.id} order={o} />)
                )}
            </div>
        </>
    );
}

// ─── Section: Addresses ────────────────────────────────────────────────────────

function iconForLabel(label: string) {
    if (label === 'Work') return UsersIcon;
    if (label === 'Other') return MapPin;
    return HomeIcon;
}

interface AddressFormState {
    label: 'Home' | 'Work' | 'Other';
    address_line_1: string;
    address_line_2: string;
    city: string;
    county: string;
    postcode: string;
    lat: string;
    lng: string;
    is_default: boolean;
    [key: string]: string | boolean;
}

const EMPTY_ADDRESS_FORM: AddressFormState = {
    label: 'Home',
    address_line_1: '',
    address_line_2: '',
    city: '',
    county: '',
    postcode: '',
    lat: '0',
    lng: '0',
    is_default: false,
};

function AddressEditorDialog({
    open,
    onOpenChange,
    initial,
    editingId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial?: ServerAddress;
    editingId: number | null;
}) {
    const form = useForm<AddressFormState>(EMPTY_ADDRESS_FORM);

    useEffect(() => {
        if (open) {
            form.clearErrors();
            if (initial) {
                form.setData({
                    label: (initial.label as AddressFormState['label']) || 'Home',
                    address_line_1: initial.address_line_1,
                    address_line_2: initial.address_line_2 ?? '',
                    city: initial.city,
                    county: initial.county ?? '',
                    postcode: initial.postcode,
                    lat: String(initial.lat),
                    lng: String(initial.lng),
                    is_default: initial.is_default,
                });
            } else {
                form.setData(EMPTY_ADDRESS_FORM);
            }
        }
        // form.setData is referentially stable per Inertia; safe to omit from deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editingId]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(editingId != null ? 'Address updated.' : 'Address added.');
                onOpenChange(false);
            },
            onError: () => {
                toast.error('Please correct the highlighted fields.');
            },
        };
        if (editingId != null) {
            form.put(route('customer.addresses.update', editingId), opts);
        } else {
            form.post(route('customer.addresses.store'), opts);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingId != null ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Label</label>
                        <select
                            value={form.data.label}
                            onChange={(e) => form.setData('label', e.target.value as AddressFormState['label'])}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <Field label="Address line 1" error={form.errors.address_line_1}>
                        <input
                            type="text"
                            value={form.data.address_line_1}
                            onChange={(e) => form.setData('address_line_1', e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </Field>
                    <Field label="Address line 2 (optional)">
                        <input
                            type="text"
                            value={form.data.address_line_2}
                            onChange={(e) => form.setData('address_line_2', e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="City" error={form.errors.city}>
                            <input
                                type="text"
                                value={form.data.city}
                                onChange={(e) => form.setData('city', e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                        </Field>
                        <Field label="County" error={form.errors.county}>
                            <input
                                type="text"
                                value={form.data.county}
                                onChange={(e) => form.setData('county', e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                        </Field>
                    </div>
                    <Field label="Postcode" error={form.errors.postcode}>
                        <input
                            type="text"
                            value={form.data.postcode}
                            onChange={(e) => form.setData('postcode', e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm uppercase"
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Latitude" error={form.errors.lat}>
                            <input
                                type="number"
                                step="any"
                                value={form.data.lat}
                                onChange={(e) => form.setData('lat', e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                        </Field>
                        <Field label="Longitude" error={form.errors.lng}>
                            <input
                                type="number"
                                step="any"
                                value={form.data.lng}
                                onChange={(e) => form.setData('lng', e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                        </Field>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.data.is_default}
                            onChange={(e) => form.setData('is_default', e.target.checked)}
                        />
                        Set as default
                    </label>
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="h-10 flex-1 rounded-md bg-muted text-sm font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            {editingId != null ? 'Save Changes' : 'Add Address'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function AddressesSection({ addresses }: { addresses: ServerAddress[] }) {
    const [pendingDelete, setPendingDelete] = useState<number | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const editingAddress = useMemo(
        () => (editingId != null ? addresses.find((a) => a.id === editingId) : undefined),
        [addresses, editingId],
    );

    const handleConfirmDelete = () => {
        if (pendingDelete != null) {
            router.delete(route('customer.addresses.delete', pendingDelete), {
                preserveScroll: true,
                onSuccess: () => toast.success('Address deleted.'),
                onError: () => toast.error('Could not delete address.'),
                onFinish: () => setPendingDelete(null),
            });
        }
    };

    const handleSetDefault = (id: number) => {
        router.post(route('customer.addresses.default', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Default address updated.'),
            onError: () => toast.error('Could not update default address.'),
        });
    };

    const openAdd = () => {
        setEditingId(null);
        setEditorOpen(true);
    };

    const openEdit = (id: number) => {
        setEditingId(id);
        setEditorOpen(true);
    };

    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Manage Addresses</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {addresses.length === 0 && (
                    <p className="col-span-full rounded-lg bg-muted/50 py-8 text-center text-sm text-muted-foreground">
                        You have no saved addresses yet.
                    </p>
                )}
                {addresses.map((addr) => {
                    const Icon = iconForLabel(addr.label);
                    return (
                        <div
                            key={addr.id}
                            className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 text-sm font-semibold">
                                    <Icon className="size-4 text-muted-foreground" />
                                    {addr.label}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {addr.address_line_1}
                                    {addr.address_line_2 ? `, ${addr.address_line_2}` : ''}
                                    <br />
                                    {[addr.city, addr.county, addr.postcode].filter(Boolean).join(', ')}
                                </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSetDefault(addr.id)}
                                    aria-label={addr.is_default ? 'Default' : 'Set as default'}
                                    className={
                                        'flex size-5 items-center justify-center rounded-full border transition ' +
                                        (addr.is_default
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input hover:border-primary')
                                    }
                                >
                                    {addr.is_default && <CheckCircle2 className="size-3" />}
                                </button>
                                <div className="flex items-center gap-2 text-[11px] font-semibold">
                                    <button type="button" onClick={() => openEdit(addr.id)} className="text-primary hover:underline">
                                        EDIT
                                    </button>
                                    <span className="text-muted-foreground">|</span>
                                    <button
                                        type="button"
                                        onClick={() => setPendingDelete(addr.id)}
                                        className="text-rose-600 hover:underline"
                                    >
                                        DELETE
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={openAdd}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-input bg-background py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
            >
                <Plus className="size-4" />
                Add New Address
            </button>

            <Dialog open={pendingDelete != null} onOpenChange={(open) => !open && setPendingDelete(null)}>
                <DialogContent className="sm:max-w-sm">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-rose-500">
                            <Trash2 className="size-7 text-white" />
                        </div>
                        <DialogTitle className="mt-4 text-base font-semibold">
                            Are You Sure You Want To Delete This Address?
                        </DialogTitle>
                        <div className="mt-5 flex w-full gap-3">
                            <button
                                type="button"
                                onClick={() => setPendingDelete(null)}
                                className="h-10 flex-1 rounded-md bg-muted text-sm font-semibold text-foreground hover:bg-muted/70"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="h-10 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AddressEditorDialog
                open={editorOpen}
                onOpenChange={setEditorOpen}
                initial={editingAddress}
                editingId={editingId}
            />
        </>
    );
}

// ─── Section: Favorites ────────────────────────────────────────────────────────

function FavoritesSection() {
    const [tab, setTab] = useState<'restaurants' | 'items'>('restaurants');

    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Favorites</h2>

            <div className="mt-3 border-b border-border">
                <div className="flex gap-6 text-sm font-medium">
                    {(['restaurants', 'items'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={
                                'border-b-2 px-1 pb-2 capitalize transition ' +
                                (tab === t
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground')
                            }
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {tab === 'restaurants' ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {FAVORITE_RESTAURANTS.map((r) => (
                        <div
                            key={r.id}
                            className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <img
                                    src={r.image}
                                    alt={r.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                                <span className="absolute left-3 bottom-3 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                                    {r.discount}
                                </span>
                                <span className="absolute right-3 top-3 inline-flex items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-amber-600 shadow">
                                    <Star className="size-3 fill-current" /> {r.rating}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3">
                                <div>
                                    <p className="text-sm font-semibold">{r.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {r.eta} · {r.distance}
                                    </p>
                                </div>
                                <Heart className="size-5 fill-rose-500 text-rose-500" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    {FAVORITE_ITEM_GROUPS.map((g) => (
                        <div key={g.restaurant} className="rounded-2xl border border-border bg-background">
                            <header className="flex items-center justify-between p-3">
                                <div>
                                    <p className="text-sm font-semibold">{g.restaurant}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {g.eta} · {g.distance}
                                    </p>
                                </div>
                                <button type="button" className="text-muted-foreground hover:text-primary">
                                    ›
                                </button>
                            </header>
                            <div className="grid grid-cols-1 gap-3 p-3 pt-0 sm:grid-cols-2">
                                {g.items.map((item) => (
                                    <div key={item.id} className="flex gap-3 rounded-lg border border-border p-2">
                                        <div className="relative size-20 shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="size-full rounded-md object-cover"
                                                loading="lazy"
                                            />
                                            <button
                                                type="button"
                                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-primary bg-background px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm"
                                            >
                                                ADD
                                            </button>
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span
                                                        className={
                                                            'size-3 shrink-0 rounded-sm border-2 ' +
                                                            (item.veg
                                                                ? 'border-emerald-500'
                                                                : 'border-rose-500')
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                'block size-full rounded-full ' +
                                                                (item.veg ? 'bg-emerald-500' : 'bg-rose-500')
                                                            }
                                                        />
                                                    </span>
                                                    <Heart className="size-4 fill-rose-500 text-rose-500" />
                                                </div>
                                                <p className="text-xs font-semibold leading-tight">{item.name}</p>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="font-semibold">{item.price}</span>
                                                <span className="inline-flex items-center gap-0.5 text-amber-600">
                                                    <Star className="size-3 fill-current" /> {item.rating}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

// ─── Section: Payments ─────────────────────────────────────────────────────────

function PaymentsSection({ onAddNew }: { onAddNew: () => void }) {
    const [cards, setCards] = useState(INITIAL_CARDS);

    const handleDelete = (id: number) => setCards((prev) => prev.filter((c) => c.id !== id));
    const handleSetDefault = (id: number) =>
        setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));

    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Payment Options</h2>
            <h3 className="mt-3 text-sm font-semibold">Saved Credit/Debit Cards</h3>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        className="rounded-2xl border border-border bg-background p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-bold tracking-wide text-foreground">
                                {card.brand}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleSetDefault(card.id)}
                                aria-label={card.isDefault ? 'Default' : 'Set as default'}
                                className={
                                    'flex size-5 items-center justify-center rounded-full border ' +
                                    (card.isDefault
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-input hover:border-primary')
                                }
                            >
                                {card.isDefault && <CheckCircle2 className="size-3" />}
                            </button>
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                            <p className="font-mono text-sm tracking-widest text-muted-foreground">
                                •••• •••• •••• {card.last4}
                            </p>
                            <button
                                type="button"
                                onClick={() => handleDelete(card.id)}
                                className="text-[11px] font-semibold text-rose-600 hover:underline"
                            >
                                DELETE
                            </button>
                        </div>
                        <div className="mt-3 flex items-end justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                            <div>
                                <p>Card Holder</p>
                                <p className="mt-0.5 text-xs font-semibold tracking-normal text-foreground">
                                    {card.holder}
                                </p>
                            </div>
                            <div className="text-right">
                                <p>Expires</p>
                                <p className="mt-0.5 text-xs font-semibold tracking-normal text-foreground">
                                    {card.expires}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={onAddNew}
                    className="flex min-h-[150px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-input bg-background text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
                >
                    <Plus className="size-5" />
                    Add New Card
                </button>
            </div>
        </>
    );
}

function AddPaymentMethod({ onBack }: { onBack: () => void }) {
    const [save, setSave] = useState(true);
    return (
        <>
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
                <ArrowLeft className="size-4" />
                Back to Payments
            </button>

            <div className="mt-4 mx-auto max-w-md rounded-2xl bg-muted/40 p-6">
                <h2 className="text-xl font-bold tracking-tight">Add New Payment Method</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    Enter your card details to secure your next meal faster.
                </p>

                <div className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Cardholder Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. ALEX MORGAN"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Card Number
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0000 0000 0000 0000"
                                className="h-10 w-full rounded-md border border-input bg-background pl-3 pr-9 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <CreditCard className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Expiry Date
                            </label>
                            <input
                                type="text"
                                placeholder="MM/YY"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                CVV / CVC
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="•••"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <span
                            role="switch"
                            aria-checked={save}
                            onClick={() => setSave((v) => !v)}
                            className={
                                'relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition ' +
                                (save ? 'bg-primary' : 'bg-muted')
                            }
                        >
                            <span
                                className={
                                    'inline-block size-4 rounded-full bg-background shadow transition ' +
                                    (save ? 'translate-x-4' : 'translate-x-0.5')
                                }
                            />
                        </span>
                        Save card for future payments
                    </label>

                    <button
                        type="button"
                        className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        Add Card & Pay
                    </button>
                    <p className="text-center text-[11px] text-muted-foreground">
                        🔒 Secure encrypted transaction. Verified by Visa &amp; Mastercard.
                    </p>
                </div>
            </div>
        </>
    );
}

// ─── Section: Settings ─────────────────────────────────────────────────────────

function SettingsSection({ onDeleteAccount }: { onDeleteAccount: () => void }) {
    const [recs, setRecs] = useState(true);
    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Settings</h2>
            <div className="mt-4 flex items-start justify-between gap-3 rounded-xl bg-muted/40 p-4">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Recommendations &amp; Reminders</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Keep this on to receive offer recommendations &amp; timely reminders based on your interests.
                    </p>
                </div>
                <span
                    role="switch"
                    aria-checked={recs}
                    onClick={() => setRecs((v) => !v)}
                    className={
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition ' +
                        (recs ? 'bg-primary' : 'bg-muted')
                    }
                >
                    <span
                        className={
                            'inline-block size-5 rounded-full bg-background shadow transition ' +
                            (recs ? 'translate-x-5' : 'translate-x-0.5')
                        }
                    />
                </span>
            </div>

            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/40 p-4">
                <p className="text-sm font-semibold text-rose-700">Delete Account</p>
                <p className="mt-1 text-[11px] text-rose-600/80">
                    Permanently remove your account and all associated data. This action can be reversed only by contacting support.
                </p>
                <button
                    type="button"
                    onClick={onDeleteAccount}
                    className="mt-3 h-9 rounded-md bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700"
                >
                    Delete My Account
                </button>
            </div>
        </>
    );
}

// ─── Delete Account dialog ─────────────────────────────────────────────────────

function DeleteAccountDialog({
    open,
    onOpenChange,
    reasons,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reasons: ServerDeletionReason[];
}) {
    type Step = 'pickReason' | 'confirmCopy' | 'enterOtp';
    const [step, setStep] = useState<Step>('pickReason');
    const [reasonId, setReasonId] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [target, setTarget] = useState<string | null>(null);
    const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [resendIn, setResendIn] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendIn]);

    // Reset whenever the dialog reopens, so the previous flow doesn't bleed in.
    useEffect(() => {
        if (open) {
            setStep('pickReason');
            setReasonId(null);
            setDescription('');
            setTarget(null);
            setOtpDigits(Array(OTP_LENGTH).fill(''));
            setError(null);
        }
    }, [open]);

    const selectedReason = useMemo(() => reasons.find((r) => r.id === reasonId), [reasons, reasonId]);

    const sendDeletionOtp = () => {
        setError(null);
        router.post(
            route('customer.profile.delete.initiate'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const flash = (page.props as unknown as SharedProps).flash;
                    setTarget(flash?.deletion?.target ?? null);
                    setStep('enterOtp');
                    setOtpDigits(Array(OTP_LENGTH).fill(''));
                    setResendIn(OTP_RESEND_SECONDS);
                    toast.success(`Verification code sent${flash?.deletion?.target ? ` to ${flash.deletion.target}` : ''}.`);
                },
                onError: (errors) => {
                    const msg = Object.values(errors).flat().join(' ') || 'Failed to send code.';
                    setError(msg);
                    toast.error(msg);
                },
            },
        );
    };

    const onDigit = (index: number, value: string) => {
        const d = value.replace(/\D/g, '').slice(-1);
        const next = [...otpDigits];
        next[index] = d;
        setOtpDigits(next);
        if (d && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
    };

    const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const submitDeletion = () => {
        if (!reasonId) return;
        setError(null);
        setSubmitting(true);
        router.delete(route('customer.profile.delete'), {
            data: {
                reason_id: reasonId,
                description: description || undefined,
                code: otpDigits.join(''),
            },
            preserveScroll: true,
            onSuccess: () => {
                // The server redirects to /home with a flash message; the
                // global flash-toast listener in app.tsx will surface it,
                // so we just close the dialog locally.
                onOpenChange(false);
            },
            onError: (errors) => {
                const msg = Object.values(errors).flat().join(' ') || 'Verification failed.';
                setError(msg);
                toast.error(msg);
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        {step === 'pickReason' && 'Why are you leaving?'}
                        {step === 'confirmCopy' && 'Confirm Account Deletion'}
                        {step === 'enterOtp' && 'Verify Your Identity'}
                    </DialogTitle>
                </DialogHeader>

                {step === 'pickReason' && (
                    <div className="space-y-2">
                        {reasons.map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setReasonId(r.id)}
                                className={
                                    'flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition ' +
                                    (reasonId === r.id
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-input hover:border-primary/50')
                                }
                            >
                                <span>{r.label}</span>
                                <span
                                    className={
                                        'size-4 rounded-full border ' +
                                        (reasonId === r.id ? 'border-primary bg-primary' : 'border-input')
                                    }
                                />
                            </button>
                        ))}
                        <button
                            type="button"
                            disabled={!reasonId}
                            onClick={() => setStep('confirmCopy')}
                            className="mt-3 h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {step === 'confirmCopy' && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium">{selectedReason?.label}</p>
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={
                                selectedReason?.is_other
                                    ? 'Tell us a bit more (optional).'
                                    : 'Do you have any feedback for us? (optional)'
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStep('pickReason')}
                                className="h-10 flex-1 rounded-md bg-muted text-sm font-semibold"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={sendDeletionOtp}
                                className="h-10 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
                            >
                                Send Verification Code
                            </button>
                        </div>
                    </div>
                )}

                {step === 'enterOtp' && (
                    <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                            For your security, please enter the code we sent to{' '}
                            <span className="font-medium text-foreground">{target ?? 'your contact'}</span>.
                        </p>
                        <OtpInputRow
                            digits={otpDigits}
                            onDigit={onDigit}
                            onKeyDown={onKeyDown}
                            inputsRef={inputsRef}
                            resendIn={resendIn}
                            onResend={sendDeletionOtp}
                            onVerify={submitDeletion}
                            disabled={submitting}
                            label={`Code sent to ${target ?? 'your contact'}`}
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Section: Privacy & Terms ──────────────────────────────────────────────────

function PrivacyPolicySection() {
    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Privacy Policy</h2>
            <div className="mt-4 space-y-3 rounded-xl bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
                <p>
                    This Privacy Policy describes how SwiftDrop collects, uses, and shares your personal
                    information when you use our website or mobile application.
                </p>
                <p>
                    At SwiftDrop, we are committed to protecting your privacy and ensuring that your personal
                    data is handled in a safe and responsible manner.
                </p>
            </div>
        </>
    );
}

function TermsSection() {
    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Terms &amp; Conditions</h2>
            <div className="mt-4 space-y-3 rounded-xl bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
                <p>
                    By using SwiftDrop, you agree to be bound by these Terms &amp; Conditions. Please read
                    them carefully before placing an order.
                </p>
                <p>
                    We may update these terms from time to time. Continued use of the service after changes
                    are posted constitutes acceptance of the new terms.
                </p>
            </div>
        </>
    );
}

// ─── Section: Help ─────────────────────────────────────────────────────────────

function HelpSection() {
    const [orderId, setOrderId] = useState('#SWDI3232');
    const [issue, setIssue] = useState('');
    const [details, setDetails] = useState('');

    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Help</h2>

            <div className="mt-4 rounded-2xl bg-muted/40 p-5">
                <h3 className="text-lg font-bold">Report An Issue</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    If you are experiencing any issue, please let us know. We will try to solve as soon as
                    possible.
                </p>

                <div className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Order ID <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Issue <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={issue}
                            onChange={(e) => setIssue(e.target.value)}
                            placeholder="Enter title for the issue"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Details <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={5}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Describe the issue in details..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <button
                        type="button"
                        className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        Submit Issue
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── Profile header ────────────────────────────────────────────────────────────

function ProfileHeader({
    name,
    email,
    photo,
    onEdit,
}: {
    name: string;
    email: string | null;
    photo: string | null;
    onEdit: () => void;
}) {
    return (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {photo ? (
                        <img src={photo} alt="" className="size-full object-cover" />
                    ) : (
                        initialsFrom(name)
                    )}
                </div>
                <div>
                    <p className="text-base font-bold tracking-tight">{name}</p>
                    {email && <p className="text-xs text-muted-foreground">{email}</p>}
                </div>
            </div>
            <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
                <PencilLine className="size-3.5" />
                Edit Profile
            </button>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CustomerProfile() {
    const { auth, customer, deletionReasons } = usePage<SharedProps>().props;
    const user = auth?.user ?? null;
    // Prefer real server data; fall back to auth shared props.
    const fullName = customer
        ? `${customer.first_name} ${customer.last_name}`.trim()
        : user?.name ?? '';
    const email = customer?.user?.email ?? user?.email ?? null;
    const mobile = customer?.user?.mobile ?? user?.mobile ?? null;
    const countryCode = customer?.user?.country_code ?? null;
    const photo = customer?.profile_photo ?? null;
    const addresses = customer?.addresses ?? [];
    const reasons = deletionReasons ?? [];

    const [section, setSection] = useState<SidebarKey>('orders');
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [addingCard, setAddingCard] = useState(false);

    const handleLogout = () => router.post(route('logout'));

    const renderSection = () => {
        if (section === 'payments' && addingCard) {
            return <AddPaymentMethod onBack={() => setAddingCard(false)} />;
        }
        switch (section) {
            case 'orders':
                return <OrderHistorySection />;
            case 'addresses':
                return <AddressesSection addresses={addresses} />;
            case 'favorites':
                return <FavoritesSection />;
            case 'payments':
                return <PaymentsSection onAddNew={() => setAddingCard(true)} />;
            case 'settings':
                return <SettingsSection onDeleteAccount={() => setDeleteOpen(true)} />;
            case 'privacy':
                return <PrivacyPolicySection />;
            case 'terms':
                return <TermsSection />;
            case 'help':
                return <HelpSection />;
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <Head title="Profile" />

            <CustomerHeader />

            <main className="flex-1 py-4">
                <div className="mx-auto max-w-[1600px] space-y-4 px-3 sm:px-4 lg:px-6">
                    <ProfileHeader
                        name={fullName || 'Customer'}
                        email={email}
                        photo={photo}
                        onEdit={() => setEditOpen(true)}
                    />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
                        <aside className="rounded-2xl border border-border bg-background p-2 lg:sticky lg:top-20 lg:self-start">
                            <ul className="flex flex-row overflow-x-auto lg:flex-col lg:overflow-visible">
                                {SIDEBAR_ITEMS.map((item) => {
                                    const Icon = item.icon;
                                    const active = section === item.key;
                                    return (
                                        <li key={item.key} className="shrink-0 lg:shrink">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSection(item.key);
                                                    setAddingCard(false);
                                                }}
                                                className={
                                                    'flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ' +
                                                    (active
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'text-foreground hover:bg-muted')
                                                }
                                            >
                                                <Icon className="size-4" />
                                                {item.label}
                                            </button>
                                        </li>
                                    );
                                })}
                                <li className="shrink-0 lg:mt-2 lg:shrink lg:border-t lg:border-border lg:pt-2">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                                    >
                                        <LogOut className="size-4" />
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </aside>

                        <section className="rounded-2xl border border-border bg-background p-4 sm:p-6">
                            {renderSection()}
                        </section>
                    </div>
                </div>
            </main>

            <SiteFooter />

            <EditProfileDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                initialName={fullName}
                initialEmail={email ?? ''}
                initialMobile={mobile}
                initialCountryCode={countryCode}
                initialPhoto={photo}
            />

            <DeleteAccountDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                reasons={reasons}
            />
        </div>
    );
}
