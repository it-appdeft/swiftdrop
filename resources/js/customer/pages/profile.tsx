import { CountryCodeDropdown } from '@/components/country-code-dropdown';
import { CountryFlag } from '@/components/country-flag';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { primaryIsoForDial } from '@/lib/countries';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddressDialog } from '../components/address-dialog';
import { CustomerHeader } from '../components/customer-header';

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
    /** ISO 3166-1 alpha-2 code, e.g. "GB" — resolves the exact flag. */
    country_iso: string | null;
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

interface OrdersMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string | null; mobile?: string | null } | null;
    };
    customer?: ServerCustomer | null;
    deletionReasons?: ServerDeletionReason[];
    orders?: PastOrder[];
    pagination?: OrdersMeta;
    legal?: {
        privacy_policy: string;
        terms_and_conditions: string;
    };
    flash?: {
        status?: string;
        otp?: { target: string; expires_in: number; test_code: string | null } | null;
        deletion?: { target: string; expires_in: number; test_code: string | null } | null;
        otpResult?: { verified?: boolean; type?: string } | null;
    };
    [key: string]: unknown;
}

type SidebarKey = 'orders' | 'addresses' | 'favorites' | 'payments' | 'settings' | 'privacy' | 'terms' | 'help';

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

/** Past order shape supplied by CustomerProfileController@show. */
interface PastOrder {
    id: number;
    uuid: string;
    restaurant: string;
    location: string;
    image: string | null;
    items: { qty: number; name: string }[];
    status: string;
    payment_failed?: boolean;
    placed_at: string | null;
}

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
    const ready = digits.join('').length >= OTP_LENGTH && !disabled;
    return (
        <div className="border-border bg-muted/30 rounded-lg border px-3.5 py-3">
            <p className="text-foreground text-sm font-semibold">Enter Verification Code</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{label ?? "We've sent a 4-digit code to your email."}</p>
            <div className="mt-3 flex items-center gap-3">
                <div className="flex flex-1 gap-2.5">
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
                            className="bg-background text-foreground focus:ring-primary/40 size-11 rounded-md border-0 text-center text-base font-semibold shadow-sm transition focus:ring-2 focus:outline-none"
                        />
                    ))}
                </div>
                <button
                    type="button"
                    onClick={onVerify}
                    disabled={!ready}
                    className={
                        'text-primary-foreground h-11 rounded-md px-5 text-sm font-semibold transition ' +
                        (ready ? 'bg-primary hover:opacity-90' : 'bg-primary/40 cursor-not-allowed')
                    }
                >
                    Verify
                </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
                {resendIn > 0 ? (
                    <>
                        <span className="text-primary/50 font-medium">Resend code</span>
                        <span className="text-muted-foreground font-medium">
                            {String(Math.floor(resendIn / 60)).padStart(2, '0')}:{String(resendIn % 60).padStart(2, '0')}
                        </span>
                    </>
                ) : (
                    <button type="button" onClick={onResend} className="text-primary font-medium hover:underline">
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
    /** ISO 3166-1 alpha-2 code, e.g. "GB". */
    initialCountryIso: string | null;
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
    initialCountryIso,
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
    // Prefer the stored ISO for an exact flag; else derive it from the dial code.
    const phoneIso = initialCountryIso ?? primaryIsoForDial(phoneCountry) ?? 'GB';
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
                country_iso: phoneIso,
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
                country_iso: phoneIso,
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
                    <DialogTitle className="text-center text-lg font-semibold">Edit Profile</DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Photo */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="border-border bg-muted size-20 overflow-hidden rounded-full border">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profile preview" className="size-full object-cover" />
                                ) : (
                                    <div className="text-muted-foreground flex size-full items-center justify-center text-base font-semibold">
                                        {initialsFrom(profileForm.data.name || initialName)}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="border-border bg-background text-foreground hover:bg-muted absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border shadow-sm transition"
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
                    </div>

                    {/* Name */}
                    <form onSubmit={saveProfile} className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-foreground text-xs font-medium">Full Name</label>
                            <input
                                type="text"
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                placeholder="John Doe"
                                className="bg-muted/60 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-primary/30 h-11 w-full rounded-md border-0 px-3 text-sm transition focus:ring-2 focus:outline-none"
                            />
                        </div>
                        {profileForm.errors.name && <p className="text-destructive text-xs">{profileForm.errors.name}</p>}
                        {profileForm.errors.profile_photo && <p className="text-destructive text-xs">{profileForm.errors.profile_photo}</p>}
                        {(profileForm.data.name !== initialName || profileForm.data.profile_photo) && (
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="bg-primary text-primary-foreground h-10 rounded-md px-4 text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {profileForm.processing ? 'Saving…' : 'Save Profile'}
                                </button>
                            </div>
                        )}
                    </form>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-foreground text-xs font-medium">Email Address</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={initialEmail}
                                readOnly
                                placeholder="john@example.com"
                                className="bg-muted/60 text-foreground placeholder:text-muted-foreground focus:ring-primary/30 h-11 flex-1 rounded-md border-0 px-3 text-sm focus:ring-2 focus:outline-none"
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
                                className="bg-primary/15 text-primary hover:bg-primary/20 h-11 shrink-0 rounded-md px-4 text-xs font-semibold transition"
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
                                label={`We've sent a 4-digit code to ${initialEmail}.`}
                            />
                        )}
                        {emailError && <p className="text-destructive text-xs">{emailError}</p>}
                    </div>

                    {/* Phone — country code and subscriber digits shown
                        in separate inputs to mirror the split storage. */}
                    <div className="space-y-1.5">
                        <label className="text-foreground text-xs font-medium">Mobile Number</label>
                        <div className="flex gap-2">
                            <div className="bg-muted/60 flex h-11 flex-1 items-center gap-2 rounded-md px-3">
                                <span className="text-foreground flex items-center gap-1.5 text-sm">
                                    <span className="flex h-3.5 w-5 shrink-0 items-center overflow-hidden rounded-sm ring-1 ring-zinc-200">
                                        <CountryFlag iso={phoneIso} className="h-full w-full object-cover" />
                                    </span>
                                    {phoneCountry}
                                </span>
                                <span className="bg-border h-5 w-px" />
                                <input
                                    type="tel"
                                    value={initialMobile ?? ''}
                                    readOnly
                                    placeholder="7123 456789"
                                    aria-label="Mobile number"
                                    className="text-foreground placeholder:text-muted-foreground h-full flex-1 bg-transparent text-sm focus:outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!initialMobile) {
                                        setPhoneDialogOpen(true);
                                        return;
                                    }
                                    sendCurrentPhoneOtp();
                                }}
                                className="bg-primary/15 text-primary hover:bg-primary/20 h-11 shrink-0 rounded-md px-4 text-xs font-semibold transition"
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
                                label={`We've sent a 4-digit code to ${phoneDisplay}.`}
                            />
                        )}
                        {phoneError && <p className="text-destructive text-xs">{phoneError}</p>}
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
                    <DialogTitle className="text-center text-lg font-semibold">Edit Email Address</DialogTitle>
                </DialogHeader>

                {step === 'enterNew' && (
                    <form onSubmit={sendNewOtp} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-foreground text-xs font-medium">Email Address</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="Add New Email"
                                autoFocus
                                className="bg-muted/60 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-primary/30 h-11 w-full rounded-md border-0 px-3 text-sm focus:ring-2 focus:outline-none"
                            />
                        </div>
                        {error && <p className="text-destructive text-xs">{error}</p>}
                        <button
                            type="submit"
                            disabled={processing || !newEmail}
                            className={
                                'text-primary-foreground h-11 w-full rounded-md text-sm font-semibold transition ' +
                                (processing || !newEmail ? 'bg-primary/40 cursor-not-allowed' : 'bg-primary hover:opacity-90')
                            }
                        >
                            Verify
                        </button>
                    </form>
                )}

                {step === 'verifyNew' && (
                    <div className="space-y-3">
                        <p className="text-muted-foreground text-center text-xs">
                            Enter the code we sent to <span className="text-foreground font-medium">{newEmail}</span>.
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
                        {error && <p className="text-destructive text-xs">{error}</p>}
                    </div>
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
    const [newCountryIso, setNewCountryIso] = useState('GB');
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
        setNewCountryIso('GB');
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
            { type: 'update_phone', channel: 'sms', country_code: newCountry, country_iso: newCountryIso, mobile: newMobile },
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
                country_iso: newCountryIso,
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
                    <DialogTitle className="text-center text-lg font-semibold">Edit Mobile Number</DialogTitle>
                </DialogHeader>

                {step === 'enterNew' && (
                    <form onSubmit={sendNewOtp} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-foreground text-xs font-medium">Mobile Number</label>
                            <div className="flex gap-2">
                                <CountryCodeDropdown
                                    dial={newCountry}
                                    iso={newCountryIso}
                                    onChange={(c) => {
                                        setNewCountry(c.dial);
                                        setNewCountryIso(c.iso);
                                    }}
                                    className="h-11"
                                />
                                <input
                                    type="tel"
                                    value={newMobile}
                                    onChange={(e) => setNewMobile(e.target.value)}
                                    placeholder="Add New Number"
                                    autoFocus
                                    className="bg-muted/60 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-primary/30 h-11 flex-1 rounded-md px-3 text-sm transition focus:ring-2 focus:outline-none"
                                />
                            </div>
                        </div>
                        {error && <p className="text-destructive text-xs">{error}</p>}
                        <button
                            type="submit"
                            disabled={processing || !newMobile}
                            className={
                                'text-primary-foreground h-11 w-full rounded-md text-sm font-semibold transition ' +
                                (processing || !newMobile ? 'bg-primary/40 cursor-not-allowed' : 'bg-primary hover:opacity-90')
                            }
                        >
                            Verify
                        </button>
                    </form>
                )}

                {step === 'verifyNew' && (
                    <div className="space-y-3">
                        <p className="text-muted-foreground text-center text-xs">
                            Enter the code we sent to{' '}
                            <span className="text-foreground font-medium">
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
                        {error && <p className="text-destructive text-xs">{error}</p>}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Section: Order History ────────────────────────────────────────────────────

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
    placed: { label: 'Placed', className: 'text-amber-600' },
    accepted: { label: 'Accepted', className: 'text-amber-600' },
    preparing: { label: 'Preparing', className: 'text-amber-600' },
    ready_for_pickup: { label: 'Ready', className: 'text-sky-600' },
    out_for_delivery: { label: 'Out for delivery', className: 'text-sky-600' },
    delivered: { label: 'Delivered', className: 'text-emerald-700' },
    cancelled: { label: 'Cancelled', className: 'text-rose-600' },
    rejected: { label: 'Rejected', className: 'text-rose-600' },
};

function OrderCard({ order }: { order: PastOrder }) {
    const badge = ORDER_STATUS[order.status] ?? { label: order.status, className: 'text-muted-foreground' };

    return (
        <article
            role="link"
            tabIndex={0}
            onClick={() => router.visit(route('customer.orders.show', order.uuid))}
            onKeyDown={(e) => e.key === 'Enter' && router.visit(route('customer.orders.show', order.uuid))}
            className="border-border bg-background cursor-pointer rounded-2xl border p-5 transition hover:border-emerald-200 hover:bg-emerald-50/30"
        >
            <header className="flex items-start gap-4">
                {order.image ? (
                    <img src={order.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" loading="lazy" />
                ) : (
                    <div className="bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center rounded-xl">
                        <ShoppingBag className="size-6" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold">{order.restaurant}</h3>
                    <p className="text-muted-foreground mt-0.5 text-sm">{order.location}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold ${badge.className}`}>
                    {order.status === 'delivered' ? (
                        <CheckCircle2 className="size-4 fill-emerald-700 text-white" />
                    ) : (
                        <span className="size-2 rounded-full bg-current" />
                    )}
                    {badge.label}
                </span>
            </header>

            <div className="border-border/70 mt-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {order.items.map((item, i) => (
                        <span key={`${order.id}-${i}`} className="text-foreground inline-flex items-center gap-2 text-sm font-medium">
                            <span className="rounded-md border border-emerald-200 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                                {item.qty}x
                            </span>
                            {item.name}
                        </span>
                    ))}
                </div>
            </div>

            <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="bg-primary text-primary-foreground mt-5 w-75 rounded-md py-3 text-sm font-semibold transition hover:opacity-90"
            >
                Reorder
            </button>

            {order.payment_failed && (
                <div className="mt-4 space-y-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                        <AlertCircle className="size-4" />
                        Payment failed
                    </p>
                    <p className="text-muted-foreground text-xs">If any amount is deducted, it will be refunded in 3-5 Working days</p>
                </div>
            )}

            {order.placed_at ? <p className="text-muted-foreground mt-4 text-xs">Ordered {order.placed_at}</p> : null}
        </article>
    );
}

function OrderHistorySection({ initialOrders, initialMeta }: { initialOrders: PastOrder[]; initialMeta: OrdersMeta }) {
    const [search, setSearch] = useState('');
    const [orders, setOrders] = useState<PastOrder[]>(initialOrders);
    const [meta, setMeta] = useState<OrdersMeta>(initialMeta);
    const [loading, setLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const filtered = orders.filter((o) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return o.restaurant.toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q));
    });

    const hasMore = meta.current_page < meta.last_page;

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const res = await fetch(`/customer/profile/orders?page=${meta.current_page + 1}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as { orders: PastOrder[]; pagination: OrdersMeta };
            setOrders((prev) => {
                const seen = new Set(prev.map((o) => o.id));
                return [...prev, ...json.orders.filter((o) => !seen.has(o.id))];
            });
            setMeta(json.pagination);
        } catch {
            toast.error('Could not load more orders.');
        } finally {
            setLoading(false);
        }
    }, [hasMore, loading, meta.current_page]);

    // IntersectionObserver triggers loadMore as the sentinel enters viewport.
    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;
        const el = sentinelRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) loadMore();
            },
            { rootMargin: '300px 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    return (
        <>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Past Orders</h2>
            <div className="relative mt-6">
                <Search className="text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by restaurant or dish"
                    className="bg-muted/50 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-primary/30 h-12 w-full rounded-lg border-0 pr-4 pl-12 text-sm focus:ring-2 focus:outline-none"
                />
            </div>
            <div className="mt-6 space-y-4">
                {filtered.length === 0 ? (
                    <p className="bg-muted/50 text-muted-foreground rounded-lg py-8 text-center text-sm">
                        {orders.length === 0 ? 'You haven’t placed any orders yet.' : 'No orders match your search.'}
                    </p>
                ) : (
                    filtered.map((o) => <OrderCard key={o.id} order={o} />)
                )}
            </div>
            {orders.length > 0 ? (
                <div ref={sentinelRef} className="flex items-center justify-center py-6">
                    {loading ? (
                        <span className="text-muted-foreground text-xs">Loading more…</span>
                    ) : hasMore ? (
                        <button
                            type="button"
                            onClick={loadMore}
                            className="hover:border-primary rounded-md border border-zinc-300 px-4 py-1.5 text-xs font-semibold"
                        >
                            Load more
                        </button>
                    ) : (
                        <span className="text-muted-foreground text-xs">You've reached the end.</span>
                    )}
                </div>
            ) : null}
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

    const inputCls =
        'h-11 w-full rounded-md border-0 bg-muted/60 px-3 text-sm text-foreground placeholder:text-muted-foreground transition focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-lg font-semibold">{editingId != null ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-foreground text-xs font-medium">Label</label>
                        <select
                            value={form.data.label}
                            onChange={(e) => form.setData('label', e.target.value as AddressFormState['label'])}
                            className={inputCls}
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
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Address line 2 (optional)">
                        <input
                            type="text"
                            value={form.data.address_line_2}
                            onChange={(e) => form.setData('address_line_2', e.target.value)}
                            className={inputCls}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="City" error={form.errors.city}>
                            <input type="text" value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="County" error={form.errors.county}>
                            <input
                                type="text"
                                value={form.data.county}
                                onChange={(e) => form.setData('county', e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                    </div>
                    <Field label="Postcode" error={form.errors.postcode}>
                        <input
                            type="text"
                            value={form.data.postcode}
                            onChange={(e) => form.setData('postcode', e.target.value)}
                            className={inputCls + ' uppercase'}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Latitude" error={form.errors.lat}>
                            <input
                                type="number"
                                step="any"
                                value={form.data.lat}
                                onChange={(e) => form.setData('lat', e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Longitude" error={form.errors.lng}>
                            <input
                                type="number"
                                step="any"
                                value={form.data.lng}
                                onChange={(e) => form.setData('lng', e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.data.is_default}
                            onChange={(e) => form.setData('is_default', e.target.checked)}
                            className="accent-primary"
                        />
                        Set as default
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="bg-muted text-foreground hover:bg-muted/70 h-11 flex-1 rounded-md text-sm font-semibold transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="bg-primary text-primary-foreground h-11 flex-1 rounded-md text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
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
            <label className="text-foreground text-xs font-medium">{label}</label>
            {children}
            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}

/**
 * Reusable red-trash confirmation modal used by destructive actions
 * (delete address, delete account). Driven by a controlled `open` flag
 * + onCancel/onConfirm so the parent owns the destructive call itself.
 */
function ConfirmDeleteDialog({
    open,
    onCancel,
    onConfirm,
    title,
    confirmLabel = 'Delete',
    busy = false,
}: {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
    confirmLabel?: string;
    busy?: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
            <DialogContent className="sm:max-w-sm">
                <div className="flex flex-col items-center text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-rose-500">
                        <Trash2 className="size-7 text-white" />
                    </div>
                    <DialogTitle className="mt-4 text-base font-semibold">{title}</DialogTitle>
                    <div className="mt-5 flex w-full gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-muted text-foreground hover:bg-muted/70 h-11 flex-1 rounded-md text-sm font-semibold transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={busy}
                            className="bg-primary text-primary-foreground h-11 flex-1 rounded-md text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                        >
                            {busy ? 'Deleting…' : confirmLabel}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function AddressesSection({ addresses }: { addresses: ServerAddress[] }) {
    const [pendingDelete, setPendingDelete] = useState<number | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [addOpen, setAddOpen] = useState(false); // map-based add flow (edit still uses the dialog below)

    const editingAddress = useMemo(() => (editingId != null ? addresses.find((a) => a.id === editingId) : undefined), [addresses, editingId]);

    const handleConfirmDelete = () => {
        if (pendingDelete != null) {
            router.delete(route('customer.addresses.delete', pendingDelete), {
                preserveScroll: true,
                onSuccess: () => toast.success('Address deleted.'),
                onError: (errors) => toast.error(errors.address ?? 'Could not delete address.'),
                onFinish: () => setPendingDelete(null),
            });
        }
    };

    const handleSetDefault = (id: number) => {
        router.post(
            route('customer.addresses.default', id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Default address updated.'),
                onError: () => toast.error('Could not update default address.'),
            },
        );
    };

    const openAdd = () => setAddOpen(true);

    const openEdit = (id: number) => {
        setEditingId(id);
        setEditorOpen(true);
    };

    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Manage Addresses</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {addresses.length === 0 && (
                    <p className="bg-muted/50 text-muted-foreground col-span-full rounded-lg py-8 text-center text-sm">
                        You have no saved addresses yet.
                    </p>
                )}
                {addresses.map((addr) => {
                    const Icon = iconForLabel(addr.label);
                    return (
                        <div key={addr.id} className="border-border bg-background flex items-start gap-3 rounded-2xl border p-4">
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 text-sm font-semibold">
                                    <Icon className="text-muted-foreground size-4" />
                                    {addr.label}
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
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
                                        (addr.is_default ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:border-primary')
                                    }
                                >
                                    {addr.is_default && <CheckCircle2 className="size-3" />}
                                </button>
                                <div className="flex items-center gap-2 text-[11px] font-semibold">
                                    <button type="button" onClick={() => openEdit(addr.id)} className="text-primary hover:underline">
                                        EDIT
                                    </button>
                                    <span className="text-muted-foreground">|</span>
                                    <button type="button" onClick={() => setPendingDelete(addr.id)} className="text-rose-600 hover:underline">
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
                className="border-input bg-background text-muted-foreground hover:border-primary hover:text-primary mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed py-3 text-sm font-medium"
            >
                <Plus className="size-4" />
                Add New Address
            </button>

            <ConfirmDeleteDialog
                open={pendingDelete != null}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Are You Sure You Want To Delete This Address?"
            />

            <AddressEditorDialog open={editorOpen} onOpenChange={setEditorOpen} initial={editingAddress} editingId={editingId} />
            <AddressDialog open={addOpen} onOpenChange={setAddOpen} />
        </>
    );
}

// ─── Section: Favorites ────────────────────────────────────────────────────────

interface FavMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface FavRestaurant {
    id: number;
    name: string;
    cuisines: string | null;
    city: string | null;
    logo_url: string | null;
    cover_url: string | null;
    rating: number | null;
    total_reviews: number;
}

interface FavItem {
    id: number;
    restaurant_id: number;
    restaurant_name: string | null;
    name: string;
    price: number;
    is_veg: boolean;
    image_url: string | null;
    rating: number | null;
}

const favCsrf = (): string => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

/**
 * Generic paginated favourites loader — fetches `/customer/favorites/{type}`
 * (JSON, 10/page), accumulates pages for infinite scroll, and removes a row
 * when it's unfavourited. Returns everything the two tab views need.
 */
function useFavorites<T extends { id: number }>(endpoint: string, active: boolean) {
    const [items, setItems] = useState<T[]>([]);
    const [meta, setMeta] = useState<FavMeta>({ current_page: 0, last_page: 1, per_page: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const loadPage = useCallback(
        async (page: number) => {
            setLoading(true);
            try {
                const res = await fetch(`${endpoint}?page=${page}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                if (!res.ok) throw new Error();
                const json = (await res.json()) as { data: T[]; pagination: FavMeta };
                setItems((prev) => {
                    const seen = new Set(prev.map((r) => r.id));
                    return page === 1 ? json.data : [...prev, ...json.data.filter((r) => !seen.has(r.id))];
                });
                setMeta(json.pagination);
                setLoaded(true);
            } catch {
                toast.error('Could not load favourites.');
            } finally {
                setLoading(false);
            }
        },
        [endpoint],
    );

    // Lazy first load when the tab becomes active.
    useEffect(() => {
        if (active && !loaded && !loading) loadPage(1);
    }, [active, loaded, loading, loadPage]);

    const hasMore = meta.current_page > 0 && meta.current_page < meta.last_page;

    useEffect(() => {
        if (!active || !sentinelRef.current || !hasMore) return;
        const el = sentinelRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting) && !loading) loadPage(meta.current_page + 1);
            },
            { rootMargin: '300px 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [active, hasMore, loading, meta.current_page, loadPage]);

    const remove = (id: number) => setItems((prev) => prev.filter((r) => r.id !== id));

    return { items, loading, loaded, hasMore, sentinelRef, loadPage, meta, remove };
}

function FavoritesSection() {
    const [tab, setTab] = useState<'restaurants' | 'items'>('restaurants');

    const restaurants = useFavorites<FavRestaurant>('/customer/favorites/restaurants', tab === 'restaurants');
    const items = useFavorites<FavItem>('/customer/favorites/menu-items', tab === 'items');

    const unfavorite = async (type: 'restaurants' | 'menu-items', id: number, onDone: () => void) => {
        try {
            const res = await fetch(`/customer/favorites/${type}/${id}`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': favCsrf(), 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error();
            onDone();
            toast.success('Removed from favourites');
        } catch {
            toast.error('Could not update favourite.');
        }
    };

    // Group the loaded items by restaurant for the Items tab (matches design).
    const itemGroups = (() => {
        const map = new Map<number, { name: string; items: FavItem[] }>();
        for (const it of items.items) {
            const g = map.get(it.restaurant_id) ?? { name: it.restaurant_name ?? 'Restaurant', items: [] };
            g.items.push(it);
            map.set(it.restaurant_id, g);
        }
        return [...map.entries()].map(([id, g]) => ({ id, ...g }));
    })();

    return (
        <>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Favorites</h2>

            <div className="border-border mt-3 border-b">
                <div className="flex gap-6 text-sm font-medium">
                    {(['restaurants', 'items'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={
                                'border-b-2 px-1 pb-2 capitalize transition ' +
                                (tab === t ? 'border-primary text-primary' : 'text-muted-foreground hover:text-foreground border-transparent')
                            }
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {tab === 'restaurants' ? (
                <>
                    {restaurants.loaded && restaurants.items.length === 0 ? (
                        <p className="bg-muted/40 text-muted-foreground mt-4 rounded-lg py-10 text-center text-sm">No favourite restaurants yet.</p>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {restaurants.items.map((r) => (
                                <Link
                                    key={r.id}
                                    href={`/customer/restaurants/${r.id}`}
                                    className="border-border bg-background group block overflow-hidden rounded-2xl border shadow-sm"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-200">
                                        {r.cover_url || r.logo_url ? (
                                            <img
                                                src={(r.cover_url ?? r.logo_url)!}
                                                alt={r.name}
                                                className="h-full w-full object-cover transition group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-zinc-400">
                                                {r.name.charAt(0)}
                                            </div>
                                        )}
                                        {r.rating !== null ? (
                                            <span className="absolute top-3 right-3 inline-flex items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-amber-600 shadow">
                                                <Star className="size-3 fill-current" /> {r.rating.toFixed(1)}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center justify-between p-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">{r.name}</p>
                                            <p className="text-muted-foreground text-[11px]">20-30 min{r.city ? ` · ${r.city}` : ''}</p>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label="Remove from favourites"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                unfavorite('restaurants', r.id, () => restaurants.remove(r.id));
                                            }}
                                            className="shrink-0"
                                        >
                                            <Heart className="size-5 fill-rose-500 text-rose-500" />
                                        </button>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    <FavLoadMore loading={restaurants.loading} hasMore={restaurants.hasMore} sentinelRef={restaurants.sentinelRef} />
                </>
            ) : (
                <>
                    {items.loaded && items.items.length === 0 ? (
                        <p className="bg-muted/40 text-muted-foreground mt-4 rounded-lg py-10 text-center text-sm">No favourite items yet.</p>
                    ) : (
                        <div className="mt-4 space-y-4">
                            {itemGroups.map((g) => (
                                <div key={g.id} className="border-border bg-background rounded-2xl border">
                                    <Link href={`/customer/restaurants/${g.id}`} className="hover:text-primary flex items-center justify-between p-3">
                                        <p className="text-sm font-semibold">{g.name}</p>
                                        <span className="text-muted-foreground">›</span>
                                    </Link>
                                    <div className="grid grid-cols-1 gap-3 p-3 pt-0 sm:grid-cols-2">
                                        {g.items.map((item) => (
                                            <div key={item.id} className="border-border flex gap-3 rounded-lg border p-2">
                                                <div className="relative size-20 shrink-0">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="size-full rounded-md object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="bg-muted/40 size-full rounded-md" />
                                                    )}
                                                    <Link
                                                        href={`/customer/restaurants/${item.restaurant_id}`}
                                                        className="border-primary bg-background text-primary absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border px-2 py-0.5 text-[10px] font-semibold shadow-sm"
                                                    >
                                                        ADD
                                                    </Link>
                                                </div>
                                                <div className="flex min-w-0 flex-1 flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <span
                                                                className={
                                                                    'size-3 shrink-0 rounded-sm border-2 ' +
                                                                    (item.is_veg ? 'border-emerald-500' : 'border-rose-500')
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        'block size-full rounded-full ' +
                                                                        (item.is_veg ? 'bg-emerald-500' : 'bg-rose-500')
                                                                    }
                                                                />
                                                            </span>
                                                            <button
                                                                type="button"
                                                                aria-label="Remove from favourites"
                                                                onClick={() => unfavorite('menu-items', item.id, () => items.remove(item.id))}
                                                            >
                                                                <Heart className="size-4 fill-rose-500 text-rose-500" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs leading-tight font-semibold">{item.name}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="font-semibold">£{item.price.toFixed(2)}</span>
                                                        {item.rating !== null ? (
                                                            <span className="inline-flex items-center gap-0.5 text-amber-600">
                                                                <Star className="size-3 fill-current" /> {item.rating.toFixed(1)}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <FavLoadMore loading={items.loading} hasMore={items.hasMore} sentinelRef={items.sentinelRef} />
                </>
            )}
        </>
    );
}

function FavLoadMore({ loading, hasMore, sentinelRef }: { loading: boolean; hasMore: boolean; sentinelRef: React.RefObject<HTMLDivElement | null> }) {
    if (!hasMore && !loading) return null;
    return (
        <div ref={sentinelRef} className="flex items-center justify-center py-6">
            {loading ? <span className="text-muted-foreground text-xs">Loading more…</span> : null}
        </div>
    );
}

// ─── Section: Payments ─────────────────────────────────────────────────────────

function PaymentsSection({ onAddNew }: { onAddNew: () => void }) {
    const [cards, setCards] = useState(INITIAL_CARDS);

    const handleDelete = (id: number) => setCards((prev) => prev.filter((c) => c.id !== id));
    const handleSetDefault = (id: number) => setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));

    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Payment Options</h2>
            <h3 className="mt-3 text-sm font-semibold">Saved Credit/Debit Cards</h3>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cards.map((card) => (
                    <div key={card.id} className="border-border bg-background rounded-2xl border p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                            <span className="bg-muted text-foreground inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wide">
                                {card.brand}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleSetDefault(card.id)}
                                aria-label={card.isDefault ? 'Default' : 'Set as default'}
                                className={
                                    'flex size-5 items-center justify-center rounded-full border ' +
                                    (card.isDefault ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:border-primary')
                                }
                            >
                                {card.isDefault && <CheckCircle2 className="size-3" />}
                            </button>
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                            <p className="text-muted-foreground font-mono text-sm tracking-widest">•••• •••• •••• {card.last4}</p>
                            <button
                                type="button"
                                onClick={() => handleDelete(card.id)}
                                className="text-[11px] font-semibold text-rose-600 hover:underline"
                            >
                                DELETE
                            </button>
                        </div>
                        <div className="text-muted-foreground mt-3 flex items-end justify-between text-[10px] tracking-wide uppercase">
                            <div>
                                <p>Card Holder</p>
                                <p className="text-foreground mt-0.5 text-xs font-semibold tracking-normal">{card.holder}</p>
                            </div>
                            <div className="text-right">
                                <p>Expires</p>
                                <p className="text-foreground mt-0.5 text-xs font-semibold tracking-normal">{card.expires}</p>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={onAddNew}
                    className="border-input bg-background text-muted-foreground hover:border-primary hover:text-primary flex min-h-[150px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-sm font-medium"
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
            <button type="button" onClick={onBack} className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                <ArrowLeft className="size-4" />
                Back to Payments
            </button>

            <div className="bg-muted/40 mx-auto mt-4 max-w-md rounded-2xl p-6">
                <h2 className="text-xl font-bold tracking-tight">Add New Payment Method</h2>
                <p className="text-muted-foreground mt-1 text-xs">Enter your card details to secure your next meal faster.</p>

                <div className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">Cardholder Name</label>
                        <input
                            type="text"
                            placeholder="e.g. ALEX MORGAN"
                            className="border-input bg-background focus:border-primary focus:ring-primary/30 h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">Card Number</label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0000 0000 0000 0000"
                                className="border-input bg-background focus:border-primary focus:ring-primary/30 h-10 w-full rounded-md border pr-9 pl-3 text-sm focus:ring-2 focus:outline-none"
                            />
                            <CreditCard className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">Expiry Date</label>
                            <input
                                type="text"
                                placeholder="MM/YY"
                                className="border-input bg-background focus:border-primary focus:ring-primary/30 h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">CVV / CVC</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="•••"
                                className="border-input bg-background focus:border-primary focus:ring-primary/30 h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
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
                                    'bg-background inline-block size-4 rounded-full shadow transition ' + (save ? 'translate-x-4' : 'translate-x-0.5')
                                }
                            />
                        </span>
                        Save card for future payments
                    </label>

                    <button
                        type="button"
                        className="bg-primary text-primary-foreground h-11 w-full rounded-md text-sm font-semibold hover:opacity-90"
                    >
                        Add Card & Pay
                    </button>
                    <p className="text-muted-foreground text-center text-[11px]">
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
            {/* <div className="mt-4 flex items-start justify-between gap-3 rounded-xl bg-muted/40 p-4">
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
            </div> */}

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
    // After the user enters their OTP and hits Verify we hold off the actual
    // DELETE call and surface a final confirmation modal — the action is
    // destructive and the OTP alone shouldn't be the only guardrail.
    const [confirmOpen, setConfirmOpen] = useState(false);
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
            setConfirmOpen(false);
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

    // First click on Verify after the OTP is entered: don't delete yet, ask
    // the user to confirm the destructive action one last time.
    const askForFinalConfirmation = () => {
        if (!reasonId) return;
        if (otpDigits.join('').length < OTP_LENGTH) return;
        setError(null);
        setConfirmOpen(true);
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
                setConfirmOpen(false);
                onOpenChange(false);
            },
            onError: (errors) => {
                const msg = Object.values(errors).flat().join(' ') || 'Verification failed.';
                setError(msg);
                toast.error(msg);
                setConfirmOpen(false);
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
                                    (reasonId === r.id ? 'border-primary bg-primary/5 text-primary' : 'border-input hover:border-primary/50')
                                }
                            >
                                <span>{r.label}</span>
                                <span
                                    className={'size-4 rounded-full border ' + (reasonId === r.id ? 'border-primary bg-primary' : 'border-input')}
                                />
                            </button>
                        ))}
                        <button
                            type="button"
                            disabled={!reasonId}
                            onClick={() => setStep('confirmCopy')}
                            className="bg-primary text-primary-foreground mt-3 h-10 w-full rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-50"
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
                            placeholder={selectedReason?.is_other ? 'Tell us a bit more (optional).' : 'Do you have any feedback for us? (optional)'}
                            className="border-input bg-background focus:border-primary focus:ring-primary/30 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                        />
                        {error && <p className="text-destructive text-xs">{error}</p>}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStep('pickReason')}
                                className="bg-muted h-10 flex-1 rounded-md text-sm font-semibold"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={sendDeletionOtp}
                                className="bg-primary text-primary-foreground h-10 flex-1 rounded-md text-sm font-semibold hover:opacity-90"
                            >
                                Send Verification Code
                            </button>
                        </div>
                    </div>
                )}

                {step === 'enterOtp' && (
                    <div className="space-y-3">
                        <p className="text-muted-foreground text-xs">
                            For your security, please enter the code we sent to{' '}
                            <span className="text-foreground font-medium">{target ?? 'your contact'}</span>.
                        </p>
                        <OtpInputRow
                            digits={otpDigits}
                            onDigit={onDigit}
                            onKeyDown={onKeyDown}
                            inputsRef={inputsRef}
                            resendIn={resendIn}
                            onResend={sendDeletionOtp}
                            onVerify={askForFinalConfirmation}
                            disabled={submitting}
                            label={`Code sent to ${target ?? 'your contact'}`}
                        />
                        {error && <p className="text-destructive text-xs">{error}</p>}
                    </div>
                )}
            </DialogContent>

            <ConfirmDeleteDialog
                open={confirmOpen}
                onCancel={() => !submitting && setConfirmOpen(false)}
                onConfirm={submitDeletion}
                title="Are You Sure You Want To Delete Your Account?"
                busy={submitting}
            />
        </Dialog>
    );
}

// ─── Section: Privacy & Terms ──────────────────────────────────────────────────

/** Renders a stored legal document (rich-text HTML from platform_config). */
function LegalSection({ title, content }: { title: string; content: string }) {
    const hasContent = content.trim().length > 0;
    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <div className="bg-muted/40 text-muted-foreground mt-4 rounded-xl p-4 text-sm leading-relaxed">
                {hasContent ? (
                    <div
                        className="[&_a]:text-primary space-y-2 [&_a]:underline [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                ) : (
                    <p>Content will be available soon.</p>
                )}
            </div>
        </>
    );
}

// ─── Section: Help ─────────────────────────────────────────────────────────────

function HelpSection() {
    const form = useForm({
        order_reference: '',
        subject: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('customer.support-tickets.store'), {
            preserveScroll: true,
            // Success toast is fired globally from the controller's flash message
            // (see app.tsx → router.on('success')); here we just reset the form.
            onSuccess: () => form.reset(),
            onError: () => toast.error('Please review the form and try again.'),
        });
    };

    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Help</h2>

            <form onSubmit={submit} className="bg-muted/40 mt-4 rounded-2xl p-5">
                <h3 className="text-lg font-bold">Report An Issue</h3>
                <p className="text-muted-foreground mt-1 text-xs">
                    If you are experiencing any issue, please let us know. We will try to solve as soon as possible.
                </p>

                <div className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-muted-foreground text-xs font-medium">
                            Order ID <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.data.order_reference}
                            onChange={(e) => form.setData('order_reference', e.target.value)}
                            placeholder="#SWDI3232"
                            className="border-input bg-background focus:border-primary focus:ring-primary/30 h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                        />
                        {form.errors.order_reference && <p className="text-xs text-rose-500">{form.errors.order_reference}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-muted-foreground text-xs font-medium">
                            Issue <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.data.subject}
                            onChange={(e) => form.setData('subject', e.target.value)}
                            placeholder="Enter title for the issue"
                            className="border-input bg-background focus:border-primary focus:ring-primary/30 h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                        />
                        {form.errors.subject && <p className="text-xs text-rose-500">{form.errors.subject}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-muted-foreground text-xs font-medium">
                            Details <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={5}
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            placeholder="Describe the issue in details..."
                            className="border-input bg-background focus:border-primary focus:ring-primary/30 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                        />
                        {form.errors.description && <p className="text-xs text-rose-500">{form.errors.description}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="bg-primary text-primary-foreground h-11 w-full rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                    >
                        {form.processing ? 'Submitting…' : 'Submit Issue'}
                    </button>
                </div>
            </form>
        </>
    );
}

// ─── Profile header ────────────────────────────────────────────────────────────

function ProfileHeader({ name, email, photo, onEdit }: { name: string; email: string | null; photo: string | null; onEdit: () => void }) {
    return (
        <div className="bg-background flex flex-col items-start justify-between gap-4 rounded-2xl p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-center gap-5">
                <div className="bg-muted text-muted-foreground flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold sm:size-24">
                    {photo ? <img src={photo} alt="" className="size-full object-cover" /> : initialsFrom(name)}
                </div>
                <div>
                    <p className="text-2xl font-bold tracking-tight sm:text-3xl">{name}</p>
                    {email && <p className="text-muted-foreground mt-1 text-sm">{email}</p>}
                </div>
            </div>
            <button
                type="button"
                onClick={onEdit}
                className="bg-primary text-primary-foreground inline-flex h-12 items-center gap-2 rounded-md px-6 text-sm font-semibold transition hover:opacity-90"
            >
                <PencilLine className="size-4" />
                Edit Profile
            </button>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CustomerProfile() {
    const { auth, customer, deletionReasons, orders: serverOrders, pagination, legal } = usePage<SharedProps>().props;
    const orders = serverOrders ?? [];
    const ordersMeta: OrdersMeta = pagination ?? {
        current_page: 1,
        last_page: 1,
        per_page: orders.length || 10,
        total: orders.length,
    };
    const user = auth?.user ?? null;
    // Prefer real server data; fall back to auth shared props.
    const fullName = customer ? `${customer.first_name} ${customer.last_name}`.trim() : (user?.name ?? '');
    const email = customer?.user?.email ?? user?.email ?? null;
    const mobile = customer?.user?.mobile ?? user?.mobile ?? null;
    const countryCode = customer?.user?.country_code ?? null;
    const countryIso = customer?.user?.country_iso ?? null;
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
                return <OrderHistorySection initialOrders={orders} initialMeta={ordersMeta} />;
            case 'addresses':
                return <AddressesSection addresses={addresses} />;
            case 'favorites':
                return <FavoritesSection />;
            case 'payments':
                return <OrderHistorySection initialOrders={orders} initialMeta={ordersMeta} />;
            // return <PaymentsSection onAddNew={() => setAddingCard(true)} />;
            case 'settings':
                return <SettingsSection onDeleteAccount={() => setDeleteOpen(true)} />;
            case 'privacy':
                return <LegalSection title="Privacy Policy" content={legal?.privacy_policy ?? ''} />;
            case 'terms':
                return <LegalSection title="Terms & Conditions" content={legal?.terms_and_conditions ?? ''} />;
            case 'help':
                return <HelpSection />;
        }
    };

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <Head title="Profile" />

            <CustomerHeader />

            <main className="flex-1 py-6 sm:py-8">
                <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
                    <ProfileHeader name={fullName || 'Customer'} email={email} photo={photo} onEdit={() => setEditOpen(true)} />

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
                        <aside className="rounded-2xl bg-[#F6F8FA] p-3 lg:sticky lg:top-20 lg:self-start">
                            <ul className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:gap-1.5 lg:overflow-visible">
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
                                                    'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium whitespace-nowrap transition ' +
                                                    (active ? 'bg-background text-primary shadow-sm' : 'text-foreground hover:bg-background/60')
                                                }
                                            >
                                                <Icon className="size-5" />
                                                {item.label}
                                            </button>
                                        </li>
                                    );
                                })}
                                <li className="lg:border-border shrink-0 lg:mt-2 lg:shrink lg:border-t lg:pt-2">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium whitespace-nowrap transition"
                                    >
                                        <LogOut className="size-5" />
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </aside>

                        <section className="rounded-2xl bg-[#F6F8FA] p-5 sm:p-8">{renderSection()}</section>
                    </div>
                </div>
            </main>

            {/* <SiteFooter /> */}

            <EditProfileDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                initialName={fullName}
                initialEmail={email ?? ''}
                initialMobile={mobile}
                initialCountryCode={countryCode}
                initialCountryIso={countryIso}
                initialPhoto={photo}
            />

            <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} reasons={reasons} />
        </div>
    );
}
