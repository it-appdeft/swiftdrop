import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    FileText,
    Heart,
    HelpCircle,
    Home as HomeIcon,
    Hotel,
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
import { useEffect, useRef, useState } from 'react';
import { CustomerHeader } from '../components/customer-header';
import { SiteFooter } from '../../web/components/site-footer';

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string | null } | null;
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

interface SavedAddress {
    id: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    line1: string;
    line2: string;
    isDefault?: boolean;
}

const INITIAL_ADDRESSES: SavedAddress[] = [
    {
        id: 1,
        label: 'Flat SBC',
        icon: HomeIcon,
        line1: 'West Coker Midtown, 162500,',
        line2: 'West Yelovil UK',
        isDefault: true,
    },
    {
        id: 2,
        label: 'Hotel',
        icon: Hotel,
        line1: 'West Coker Midtown, 123500,',
        line2: 'West Yelovil UK',
    },
    {
        id: 3,
        label: 'Friends And Family',
        icon: UsersIcon,
        line1: 'West Coker Midtown, 162500,',
        line2: 'West Yelovil UK',
    },
    {
        id: 4,
        label: 'Hotel',
        icon: Hotel,
        line1: 'West Coker Midtown, 123500,',
        line2: 'West Yelovil UK',
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
}

function OtpInputRow({ digits, onDigit, onKeyDown, inputsRef, resendIn, onResend, onVerify, disabled }: OtpInputRowProps) {
    return (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold">Enter Verification Code</p>
            <p className="text-[11px] text-muted-foreground">We've sent a 4-digit code to your email.</p>
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
}

function EditProfileDialog({ open, onOpenChange, initialName, initialEmail }: EditProfileDialogProps) {
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [emailEditing, setEmailEditing] = useState(false);
    const [emailOtpVisible, setEmailOtpVisible] = useState(false);
    const [emailDigits, setEmailDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [emailResendIn, setEmailResendIn] = useState(0);
    const emailInputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const [countryCode, setCountryCode] = useState('+44');
    const [mobile, setMobile] = useState('');
    const [mobileEditing, setMobileEditing] = useState(false);
    const [mobileOtpVisible, setMobileOtpVisible] = useState(false);
    const [mobileDigits, setMobileDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [mobileResendIn, setMobileResendIn] = useState(0);
    const mobileInputsRef = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        if (emailResendIn <= 0) return;
        const t = setTimeout(() => setEmailResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [emailResendIn]);

    useEffect(() => {
        if (mobileResendIn <= 0) return;
        const t = setTimeout(() => setMobileResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [mobileResendIn]);

    const makeDigitHandlers = (
        digits: string[],
        setDigits: React.Dispatch<React.SetStateAction<string[]>>,
        inputsRef: React.RefObject<Array<HTMLInputElement | null>>,
    ) => ({
        onDigit: (index: number, value: string) => {
            const d = value.replace(/\D/g, '').slice(-1);
            const next = [...digits];
            next[index] = d;
            setDigits(next);
            if (d && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
        },
        onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace' && !digits[index] && index > 0) {
                inputsRef.current[index - 1]?.focus();
            }
        },
    });

    const emailHandlers = makeDigitHandlers(emailDigits, setEmailDigits, emailInputsRef);
    const mobileHandlers = makeDigitHandlers(mobileDigits, setMobileDigits, mobileInputsRef);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Edit Profile</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!emailEditing}
                                placeholder="john@example.com"
                                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-muted/40"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (emailEditing) {
                                        setEmailOtpVisible(true);
                                        setEmailResendIn(OTP_RESEND_SECONDS);
                                    } else {
                                        setEmailEditing(true);
                                    }
                                }}
                                className="h-10 rounded-md border border-input bg-background px-3 text-xs font-semibold text-primary hover:bg-muted"
                            >
                                {emailEditing ? 'Verify Email' : 'Change'}
                            </button>
                        </div>
                        {emailOtpVisible && (
                            <OtpInputRow
                                digits={emailDigits}
                                onDigit={emailHandlers.onDigit}
                                onKeyDown={emailHandlers.onKeyDown}
                                inputsRef={emailInputsRef}
                                resendIn={emailResendIn}
                                onResend={() => setEmailResendIn(OTP_RESEND_SECONDS)}
                                onVerify={() => {
                                    setEmailOtpVisible(false);
                                    setEmailEditing(false);
                                    setEmailResendIn(0);
                                }}
                            />
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Mobile Number</label>
                        <div className="flex gap-2">
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                disabled={!mobileEditing}
                                className="h-10 rounded-md border border-input bg-background px-2 text-sm disabled:bg-muted/40"
                            >
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+91">🇮🇳 +91</option>
                            </select>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                disabled={!mobileEditing}
                                placeholder="7123 456789"
                                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-muted/40"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (mobileEditing) {
                                        setMobileOtpVisible(true);
                                        setMobileResendIn(OTP_RESEND_SECONDS);
                                    } else {
                                        setMobileEditing(true);
                                    }
                                }}
                                className="h-10 rounded-md border border-input bg-background px-3 text-xs font-semibold text-primary hover:bg-muted"
                            >
                                {mobileEditing ? 'Verify Mobile' : 'Change'}
                            </button>
                        </div>
                        {mobileOtpVisible && (
                            <OtpInputRow
                                digits={mobileDigits}
                                onDigit={mobileHandlers.onDigit}
                                onKeyDown={mobileHandlers.onKeyDown}
                                inputsRef={mobileInputsRef}
                                resendIn={mobileResendIn}
                                onResend={() => setMobileResendIn(OTP_RESEND_SECONDS)}
                                onVerify={() => {
                                    setMobileOtpVisible(false);
                                    setMobileEditing(false);
                                    setMobileResendIn(0);
                                }}
                            />
                        )}
                    </div>
                </div>
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

function AddressesSection() {
    const [addresses, setAddresses] = useState(INITIAL_ADDRESSES);
    const [pendingDelete, setPendingDelete] = useState<number | null>(null);

    const handleConfirmDelete = () => {
        if (pendingDelete != null) {
            setAddresses((prev) => prev.filter((a) => a.id !== pendingDelete));
        }
        setPendingDelete(null);
    };

    const handleSetDefault = (id: number) => {
        setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    };

    return (
        <>
            <h2 className="text-lg font-bold tracking-tight">Manage Addresses</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {addresses.map((addr) => {
                    const Icon = addr.icon;
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
                                    {addr.line1}
                                    <br />
                                    {addr.line2}
                                </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSetDefault(addr.id)}
                                    aria-label={addr.isDefault ? 'Default' : 'Set as default'}
                                    className={
                                        'flex size-5 items-center justify-center rounded-full border transition ' +
                                        (addr.isDefault
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input hover:border-primary')
                                    }
                                >
                                    {addr.isDefault && <CheckCircle2 className="size-3" />}
                                </button>
                                <div className="flex items-center gap-2 text-[11px] font-semibold">
                                    <button type="button" className="text-primary hover:underline">
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

function SettingsSection() {
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
        </>
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

function ProfileHeader({ name, email, onEdit }: { name: string; email: string | null; onEdit: () => void }) {
    return (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {initialsFrom(name)}
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
    const { auth } = usePage<SharedProps>().props;
    const user = auth?.user ?? null;
    const name = user?.name ?? 'John Doe';
    const email = user?.email ?? 'johnbride203@gmail.com';

    const [section, setSection] = useState<SidebarKey>('orders');
    const [editOpen, setEditOpen] = useState(false);
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
                return <AddressesSection />;
            case 'favorites':
                return <FavoritesSection />;
            case 'payments':
                return <PaymentsSection onAddNew={() => setAddingCard(true)} />;
            case 'settings':
                return <SettingsSection />;
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
                    <ProfileHeader name={name} email={email} onEdit={() => setEditOpen(true)} />

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
                initialName={name}
                initialEmail={email ?? ''}
            />
        </div>
    );
}
