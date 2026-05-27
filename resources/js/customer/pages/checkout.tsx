import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, Check, Home, MapPin, Minus, Pencil, Plus, ShieldCheck, Sparkles, Tag, Ticket, Users, UtensilsCrossed, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SiteFooter } from '../../web/components/site-footer';
import { AddressDialog } from '../components/address-dialog';
import { CustomerHeader } from '../components/customer-header';

interface CheckoutItem {
    id: number;
    menu_item_id: number;
    name: string | null;
    is_veg: boolean;
    image_url: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
    modifiers: { option_name: string }[];
}

interface CheckoutAddress {
    id: number;
    label: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    county: string | null;
    postcode: string | null;
    is_default: boolean;
    is_selected: boolean;
}

interface AvailableCoupon {
    code: string;
    title: string | null;
    description: string | null;
    type: string;
    headline: string;
    min_order_value: number | null;
    trigger: string;
    valid_from: string | null;
    valid_until: string | null;
    eligible: boolean;
    upcoming: boolean;
}

interface Checkout {
    is_empty: boolean;
    restaurant: { id: number; name: string; area: string | null; logo_url: string | null } | null;
    items: CheckoutItem[];
    addresses: CheckoutAddress[];
    selected_address_id: number | null;
    in_range: boolean;
    range_message: string | null;
    distance_miles: number | null;
    accepts_cooking_requests: boolean;
    applied_coupon: { code: string; title: string | null; type: string; discount: number; free_delivery: boolean } | null;
    coupon_error: string | null;
    available_coupons: AvailableCoupon[];
    bill: {
        item_total: number;
        item_discount: number;
        delivery_fee: number;
        free_delivery: boolean;
        taxes: number;
        to_pay: number;
    };
}

interface Props {
    checkout: Checkout;
}

export default function CustomerCheckout({ checkout }: Props) {
    const r = checkout.restaurant;
    const [couponOpen, setCouponOpen] = useState(false);
    const [addrOpen, setAddrOpen] = useState(false);
    const [showCooking, setShowCooking] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [placing, setPlacing] = useState(false);
    // Success splash shown for ~2s after a coupon successfully applies — null when hidden.
    const [appliedSplash, setAppliedSplash] = useState<{ savedAmount: number; badge: string; detail: string } | null>(null);

    // Auto-dismiss the splash. Cleanup guards against early unmount/replace.
    useEffect(() => {
        if (!appliedSplash) return;
        const t = window.setTimeout(() => setAppliedSplash(null), 4000);
        return () => window.clearTimeout(t);
    }, [appliedSplash]);

    // Recompute the summary for a new address / coupon — both are GET query
    // params so this is a plain Inertia visit that re-prices server-side.
    const reload = (params: { address_id?: number | null; coupon?: string | null }) => {
        const address_id = params.address_id !== undefined ? params.address_id : checkout.selected_address_id;
        const coupon = params.coupon !== undefined ? params.coupon : (checkout.applied_coupon?.code ?? null);
        router.get(
            '/customer/checkout',
            {
                ...(address_id ? { address_id } : {}),
                ...(coupon ? { coupon } : {}),
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const updateLine = (itemId: number, quantity: number) => {
        router.put(`/customer/cart/items/${itemId}`, { quantity }, { preserveScroll: true, preserveState: true });
    };

    const applyCoupon = (code: string) => {
        setCouponOpen(false);
        // Look up the source coupon so we can render the right badge ("EXCLUSIVE
        // WELCOME" for welcome offers, otherwise the headline / code). Manual
        // entry won't match — we fall back to the server-returned title in that case.
        const source = checkout.available_coupons.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? null;

        router.get(
            '/customer/checkout',
            {
                ...(checkout.selected_address_id ? { address_id: checkout.selected_address_id } : {}),
                coupon: code,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const next = page.props.checkout as Checkout;
                    if (next.applied_coupon && !next.coupon_error && next.bill.item_discount > 0) {
                        const badge =
                            source?.trigger === 'welcome'
                                ? 'EXCLUSIVE WELCOME'
                                : (source?.headline ?? next.applied_coupon.title ?? next.applied_coupon.code);
                        setAppliedSplash({
                            savedAmount: next.bill.item_discount,
                            badge,
                            detail: source?.headline ? `${source.headline} applied` : 'Discount applied',
                        });
                    }
                },
            },
        );
    };

    const placeOrder = () => {
        if (!checkout.in_range || !checkout.selected_address_id) return;
        setPlacing(true);
        router.post(
            '/customer/checkout',
            {
                address_id: checkout.selected_address_id,
                coupon_code: checkout.applied_coupon?.code ?? null,
                special_instructions: checkout.accepts_cooking_requests ? instructions : null,
            },
            {
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(typeof first === 'string' ? first : 'Could not place your order.');
                },
                onFinish: () => setPlacing(false),
            },
        );
    };

    const bill = checkout.bill;

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <Head title="Checkout" />
            <CustomerHeader />

            <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px]">
                {/* Left — address selection */}
                <section>
                    <div className="flex items-center gap-3">
                        <span className="flex size-12 items-center justify-center rounded-xl bg-[#0F1A2E] text-white shadow-sm">
                            <MapPin className="size-6" strokeWidth={2.2} />
                        </span>
                        <div>
                            <h1 className="text-foreground text-2xl font-bold">Choose A Delivery Address</h1>
                            <p className="text-muted-foreground text-sm">Multiple addresses in this location</p>
                        </div>
                    </div>

                    {!checkout.in_range && checkout.range_message ? (
                        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {checkout.range_message}
                        </div>
                    ) : null}

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {checkout.addresses.map((addr) => (
                            <AddressCard
                                key={addr.id}
                                address={addr}
                                selected={addr.id === checkout.selected_address_id}
                                onSelect={() => reload({ address_id: addr.id })}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setAddrOpen(true)}
                        className="bg-background mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-zinc-300 py-3 text-sm font-medium text-emerald-600 hover:border-emerald-500"
                    >
                        <Plus className="size-4" />
                        Add New Address
                    </button>
                </section>

                {/* Right — order summary */}
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border border-zinc-100 bg-[#F6F8FA] p-5">
                        {r ? (
                            <div className="border-b border-zinc-200 pb-4">
                                <h2 className="text-foreground text-lg font-bold">{r.name}</h2>
                                {r.area ? <p className="text-muted-foreground text-sm">{r.area}</p> : null}
                            </div>
                        ) : null}

                        {/* Items */}
                        <div className="divide-y divide-zinc-200">
                            {checkout.items.map((item) => (
                                <CheckoutItemRow
                                    key={item.id}
                                    item={item}
                                    restaurantId={r?.id ?? null}
                                    onIncrement={() => updateLine(item.id, item.quantity + 1)}
                                    onDecrement={() => updateLine(item.id, item.quantity - 1)}
                                />
                            ))}
                        </div>

                        {/* Add items + cooking requests */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {r ? (
                                <Link
                                    href={`/customer/restaurants/${r.id}`}
                                    className="bg-background text-foreground inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:border-emerald-500"
                                >
                                    <Plus className="size-4" /> Add Items
                                </Link>
                            ) : null}
                            {checkout.accepts_cooking_requests ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCooking((v) => !v)}
                                    className={
                                        'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ' +
                                        (showCooking
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-background text-foreground border border-zinc-300 hover:border-emerald-500')
                                    }
                                >
                                    <Pencil className="size-4" /> Cooking Requests
                                    {showCooking ? <X className="size-3.5" /> : null}
                                </button>
                            ) : null}
                        </div>

                        {checkout.accepts_cooking_requests && showCooking ? (
                            <div className="mt-3">
                                <div className="bg-background rounded-lg border border-zinc-200 p-3">
                                    
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value.slice(0, 300))}
                                        rows={3}
                                        className="mt-2 w-full resize-none bg-transparent text-sm outline-none"
                                        placeholder="e.g. Less spicy, no nuts (allergy)…"
                                    />
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setShowCooking(false)}
                                            className="text-xs font-semibold text-emerald-600 hover:underline"
                                        >
                                            Save
                                        </button>
                                    <span className="text-muted-foreground text-right text-[11px]">{instructions.length}/300</span>

                                    </div>
                                </div>
                                <p className="text-muted-foreground mt-1 text-[11px]">
                                    The restaurant will do its best to accommodate your request. Refunds cannot be issued for unmet special requests.
                                </p>
                            </div>
                        ) : instructions && checkout.accepts_cooking_requests ? (
                            <div className="bg-background mt-3 flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                                <span className="text-foreground truncate">{instructions}</span>
                                <button type="button" onClick={() => setShowCooking(true)} aria-label="Edit request">
                                    <Pencil className="text-muted-foreground size-4" />
                                </button>
                            </div>
                        ) : null}

                        {/* Coupon */}
                        <div className="mt-4">
                            {checkout.applied_coupon ? (
                                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                                    <span className="flex items-center gap-2 text-sm">
                                        <Tag className="size-4 text-emerald-600" />
                                        <span>
                                            <span className="font-semibold text-emerald-700">£{checkout.bill.item_discount.toFixed(2)}</span>{' '}
                                            <span className="text-muted-foreground text-xs">
                                                Saved {checkout.applied_coupon.title ?? checkout.applied_coupon.code}
                                            </span>
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => reload({ coupon: null })}
                                        className="text-sm font-semibold text-emerald-600 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setCouponOpen(true)}
                                    className="bg-background text-foreground flex w-full items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 text-sm font-medium hover:border-emerald-500"
                                >
                                    <Tag className="size-4 text-emerald-600" /> Apply Coupon
                                </button>
                            )}
                            {checkout.coupon_error ? <p className="mt-1.5 text-xs text-rose-600">{checkout.coupon_error}</p> : null}
                        </div>

                        {/* Bill summary */}
                        <div className="mt-5">
                            <h3 className="text-foreground text-lg font-bold">Bill Summary</h3>
                            <dl className="mt-3 space-y-2 text-sm">
                                <Row label="Item Total" value={`£${bill.item_total.toFixed(2)}`} />
                                {bill.item_discount > 0 ? (
                                    <Row label="Item Discount" value={`-£${bill.item_discount.toFixed(2)}`} valueClass="text-emerald-600" />
                                ) : null}
                                <Row
                                    label="Delivery Fee"
                                    value={bill.free_delivery ? 'Free' : `£${bill.delivery_fee.toFixed(2)}`}
                                    valueClass={bill.free_delivery ? 'text-emerald-600' : undefined}
                                />
                                <Row label="Taxes & Charges" value={`£${bill.taxes.toFixed(2)}`} />
                            </dl>
                            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
                                <span className="text-foreground text-lg font-bold">To Pay</span>
                                <span className="text-lg font-bold text-emerald-600">£{bill.to_pay.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Cancellation policy */}
                        <div className="bg-background mt-4 rounded-lg border border-zinc-200 p-3">
                            <p className="text-foreground text-sm font-semibold">Cancellation policy</p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                                Please double-check your orders and address details. Orders are not refundable once placed.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={placeOrder}
                            disabled={!checkout.in_range || !checkout.selected_address_id || placing}
                            className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {placing ? 'Placing order…' : 'Place Order'}
                        </button>
                    </div>
                </aside>
            </main>

            <SiteFooter />

            <CouponModal open={couponOpen} onClose={() => setCouponOpen(false)} coupons={checkout.available_coupons} onApply={applyCoupon} />

            <AddressDialog open={addrOpen} onOpenChange={setAddrOpen} />

            <CouponAppliedDialog splash={appliedSplash} onClose={() => setAppliedSplash(null)} />

            <ProcessingPaymentDialog open={placing} />
        </div>
    );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={'font-medium tabular-nums ' + (valueClass ?? 'text-foreground')}>{value}</dd>
        </div>
    );
}

function iconForLabel(label: string | null) {
    const l = (label ?? '').toLowerCase();
    if (l.includes('home') || l.includes('flat')) return Home;
    if (l.includes('friend') || l.includes('family')) return Users;
    return Building2;
}

function AddressCard({ address, selected, onSelect }: { address: CheckoutAddress; selected: boolean; onSelect: () => void }) {
    const Icon = iconForLabel(address.label);
    const line2 = [address.city, address.postcode, address.county].filter(Boolean).join(', ');

    return (
        <button
            type="button"
            onClick={onSelect}
            className="bg-background flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 p-4 text-left transition hover:border-zinc-300"
        >
            <div className="min-w-0">
                <p className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
                    <Icon className="text-muted-foreground size-4" />
                    {address.label ?? 'Address'}
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {address.address_line_1}
                    {line2 ? (
                        <>
                            <br />
                            {line2}
                        </>
                    ) : null}
                </p>
            </div>
            <span
                className={
                    'flex size-5 shrink-0 items-center justify-center rounded-full border transition ' +
                    (selected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-zinc-300 bg-white')
                }
                aria-hidden
            >
                {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
            </span>
        </button>
    );
}

function CheckoutItemRow({
    item,
    restaurantId,
    onIncrement,
    onDecrement,
}: {
    item: CheckoutItem;
    restaurantId: number | null;
    onIncrement: () => void;
    onDecrement: () => void;
}) {
    const modifierSummary = item.modifiers.map((m) => m.option_name).join(', ');

    return (
        <div className="flex gap-3 py-3">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-amber-50">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name ?? ''} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-amber-600">
                        <UtensilsCrossed className="size-6" />
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-semibold">{item.name}</p>
                {modifierSummary ? (
                    <p className="text-muted-foreground truncate text-xs">{modifierSummary}</p>
                ) : restaurantId ? (
                    <Link href={`/customer/restaurants/${restaurantId}`} className="text-muted-foreground text-xs hover:text-emerald-600">
                        Customize ›
                    </Link>
                ) : null}
                <p className="text-foreground mt-0.5 text-sm font-medium tabular-nums">£{item.unit_price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 self-center">
                <button
                    type="button"
                    aria-label="Decrease"
                    onClick={onDecrement}
                    className="flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                    <Minus className="size-3.5" strokeWidth={2.5} />
                </button>
                <span className="min-w-4 text-center text-sm font-bold text-foreground tabular-nums">{item.quantity}</span>
                <button
                    type="button"
                    aria-label="Increase"
                    onClick={onIncrement}
                    className="flex size-7 items-center justify-center rounded-md bg-emerald-500 text-white transition hover:bg-emerald-600"
                >
                    <Plus className="size-3.5" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}

function CouponModal({
    open,
    onClose,
    coupons,
    onApply,
}: {
    open: boolean;
    onClose: () => void;
    coupons: AvailableCoupon[];
    onApply: (code: string) => void;
}) {
    const [code, setCode] = useState('');

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-[520px]">
                <div className="p-5">
                    <h2 className="text-foreground text-lg font-bold">Coupons</h2>

                    <div className="mt-4 flex gap-2">
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Enter Coupon Code"
                            className="h-11 flex-1 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-emerald-500"
                        />
                        <button
                            type="button"
                            disabled={!code.trim()}
                            onClick={() => onApply(code.trim())}
                            className="rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            Apply
                        </button>
                    </div>

                    <div className="mt-4 space-y-3">
                        {coupons.length === 0 ? (
                            <p className="text-muted-foreground py-6 text-center text-sm">No coupons available for this order.</p>
                        ) : (
                            <>
                                {coupons
                                    .filter((c) => !c.upcoming)
                                    .map((c) =>
                                        c.trigger === 'welcome' ? (
                                            <WelcomeCouponCard key={c.code} coupon={c} onApply={() => onApply(c.code)} />
                                        ) : (
                                            <CouponCard key={c.code} coupon={c} onApply={() => onApply(c.code)} />
                                        ),
                                    )}
                                {coupons.some((c) => c.upcoming) ? (
                                    <>
                                        <h3 className="text-muted-foreground pt-2 text-xs font-semibold uppercase tracking-wide">
                                            Upcoming coupons
                                        </h3>
                                        {coupons
                                            .filter((c) => c.upcoming)
                                            .map((c) => (
                                                <CouponCard key={c.code} coupon={c} onApply={() => onApply(c.code)} />
                                            ))}
                                    </>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function couponCondition(c: AvailableCoupon): string | null {
    if (c.upcoming && c.valid_from) return `Starts ${c.valid_from}`;
    if (c.trigger === 'weekend') return 'Weekend only';
    if (c.min_order_value) return `Valid on orders > £${c.min_order_value.toFixed(0)}`;
    if (c.valid_until) return `Valid until ${c.valid_until}`;
    return null;
}

function CouponCard({ coupon, onApply }: { coupon: AvailableCoupon; onApply: () => void }) {
    const condition = couponCondition(coupon);

    return (
        <div className={'rounded-xl border border-zinc-100 bg-[#F6F8FA] p-4 ' + (coupon.upcoming ? 'opacity-80' : '')}>
            <div className="flex items-start justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Ticket className="size-4" />
                </span>
                <div className="flex items-center gap-1.5">
                    {coupon.upcoming ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            Upcoming
                        </span>
                    ) : null}
                    <span className="bg-background text-foreground rounded-md border border-zinc-200 px-2 py-0.5 font-mono text-xs font-semibold">
                        {coupon.code}
                    </span>
                </div>
            </div>
            <p className="text-foreground mt-2 text-sm font-bold">{coupon.headline}</p>
            {coupon.title ? <p className="text-foreground text-sm font-medium">{coupon.title}</p> : null}
            {coupon.description ? <p className="text-muted-foreground mt-0.5 text-xs">{coupon.description}</p> : null}
            <div className="mt-2 flex items-center justify-between">
                {condition ? (
                    <span
                        className={
                            'text-xs ' +
                            (coupon.upcoming ? 'text-amber-700' : coupon.eligible ? 'text-muted-foreground' : 'text-rose-600')
                        }
                    >
                        {condition}
                    </span>
                ) : (
                    <span />
                )}
                <button
                    type="button"
                    disabled={!coupon.eligible}
                    onClick={onApply}
                    className="text-sm font-semibold text-emerald-600 hover:underline disabled:text-zinc-400 disabled:no-underline"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}

/**
 * Welcome (first-N orders) coupons get a saturated red hero card so they read
 * as a "you just got an offer" moment rather than another row in the list.
 */
function WelcomeCouponCard({ coupon, onApply }: { coupon: AvailableCoupon; onApply: () => void }) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 p-5 text-white shadow-sm">
            {/* Decorative food/blur splash on the right — pure CSS so we don't need an asset */}
            <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-6 size-56 rounded-full bg-white/10 blur-2xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-12 right-8 size-40 rounded-full bg-white/10 blur-2xl"
            />

            <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    <Sparkles className="size-3.5" />
                    Exclusive Welcome
                </span>

                <p className="mt-3 text-3xl font-extrabold leading-none">{coupon.headline}</p>
                {coupon.title ? <p className="mt-2 max-w-[60%] text-base font-medium leading-snug">{coupon.title}</p> : null}

                <div className="mt-5 flex items-end justify-between gap-3">
                    <p className="text-xs font-medium text-white/90">
                        {coupon.valid_until ? `Valid until ${coupon.valid_until}` : 'Limited time offer'}
                    </p>
                    <button
                        type="button"
                        disabled={!coupon.eligible}
                        onClick={onApply}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Apply Now
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Brief success splash shown right after a coupon successfully applies.
 * Auto-dismisses on a timer in the parent; the "Yah!" button provides an
 * immediate-out for users who don't want to wait the full 2 seconds.
 */
function CouponAppliedDialog({
    splash,
    onClose,
}: {
    splash: { savedAmount: number; badge: string; detail: string } | null;
    onClose: () => void;
}) {
    return (
        <Dialog open={!!splash} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[400px]">
                {splash ? (
                    <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
                        {/* Tick badge with confetti dots */}
                        <div className="relative">
                            <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-8 ring-emerald-100">
                                <Check className="size-8" strokeWidth={3} />
                            </span>
                            <span aria-hidden className="absolute -top-2 -left-4 size-1.5 rounded-full bg-emerald-400" />
                            <span aria-hidden className="absolute top-2 -right-6 size-2 rounded-full bg-emerald-300" />
                            <span aria-hidden className="absolute -bottom-1 -right-3 size-2.5 rounded-sm bg-emerald-200" />
                            <span aria-hidden className="absolute -bottom-2 left-0 size-1.5 rounded-full bg-emerald-400" />
                        </div>

                        <h2 className="text-foreground mt-5 text-xl font-bold">Coupon Applied!</h2>

                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                            <Sparkles className="size-3.5" />
                            {splash.badge}
                        </span>

                        <div className="mt-4 w-full rounded-lg bg-[#F6F8FA] px-4 py-3">
                            <p className="text-sm font-semibold text-emerald-600">You saved £{splash.savedAmount.toFixed(2)}</p>
                            <p className="text-muted-foreground mt-0.5 text-xs">{splash.detail}</p>
                        </div>

                        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                            The discount has been added to your cart. Enjoy your meal!
                        </p>

                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-5 w-full rounded-md bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                        >
                            Yah!
                        </button>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Modal shown while the order POST is in-flight. Non-dismissable — the user
 * shouldn't be able to close it during a network round-trip; it disappears
 * on its own when the server redirects (this component unmounts), or on
 * failure when `placing` flips back to false in the parent.
 */
function ProcessingPaymentDialog({ open }: { open: boolean }) {
    return (
        <Dialog open={open}>
            <DialogContent
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[420px] [&>button]:hidden"
            >
                <div className="flex flex-col items-center px-8 pt-10 pb-8 text-center">
                    {/* Spinner ring around a green shield — the ring rotates via CSS animation. */}
                    <div className="relative flex size-24 items-center justify-center">
                        <span
                            aria-hidden
                            className="absolute inset-0 animate-spin rounded-full border-[3px] border-zinc-100 border-t-emerald-500"
                            style={{ animationDuration: '1.2s' }}
                        />
                        <ShieldCheck className="size-9 text-emerald-500" strokeWidth={2.2} />
                    </div>

                    <h2 className="text-foreground mt-6 text-lg font-bold">Processing Your Payment…</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Please don't close the Web page</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
