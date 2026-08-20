import { toast } from '@/hooks/use-toast';
import { Head, Link } from '@inertiajs/react';
import { Headphones, MapPin, RefreshCw, Store } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CancelOrderDialog } from '../../components/cancel-order-dialog';
import { CustomerHeader } from '../../components/customer-header';

// ─── Server-supplied types (see OrderTrackingService::payload()) ──────────────

type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'rejected';

interface TrackingOrder {
    uuid: string;
    status: OrderStatus;
    cancellable: boolean;
    delivery_code: string | null;
    cancellation_reason: string | null;
    subtotal: number;
    delivery_fee: number;
    discount_amount: number;
    vat_amount: number;
    total: number;
    special_instructions: string | null;
    placed_at: string | null;
}

interface TrackingRestaurant {
    id: number;
    name: string;
    location: string | null;
    image: string | null;
    lat: number | null;
    lng: number | null;
}

interface TrackingAddress {
    label: string | null;
    line: string;
    lat: number | null;
    lng: number | null;
}

interface TrackingItem {
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    modifiers: string[];
}

interface TrackingDelivery {
    status: 'pending_assignment' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
    eta_minutes: number | null;
    driver: { name: string; photo: string | null } | null;
}

interface TrackingPayload {
    order: TrackingOrder;
    restaurant: TrackingRestaurant | null;
    address: TrackingAddress | null;
    items: TrackingItem[];
    payment: { method: string; status: string } | null;
    delivery: TrackingDelivery | null;
    status_history: { status: string; at: string | null }[];
}

// ─── Status → banner copy ───────────────────────────────────────────────────

const STATUS_META: Record<OrderStatus, { label: string; caption: string; barPct: number; tone: 'live' | 'done' | 'cancelled' }> = {
    placed: { label: 'Awaiting Confirmation', caption: 'The restaurant is reviewing your order.', barPct: 10, tone: 'live' },
    accepted: { label: 'Order Placed', caption: 'The restaurant has accepted your order.', barPct: 25, tone: 'live' },
    preparing: { label: 'Preparing Your Order', caption: 'Your food is being prepared.', barPct: 45, tone: 'live' },
    ready_for_pickup: { label: 'Assigning Delivery Partner', caption: 'Looking for a nearby driver.', barPct: 60, tone: 'live' },
    out_for_delivery: { label: 'Out For Delivery', caption: 'Your order is on the way.', barPct: 85, tone: 'live' },
    delivered: { label: 'Order Delivered', caption: 'Hope you enjoy your meal!', barPct: 100, tone: 'done' },
    cancelled: { label: 'Order Cancelled', caption: 'This order was cancelled.', barPct: 100, tone: 'cancelled' },
    rejected: { label: 'Order Rejected', caption: 'The restaurant was unable to take this order.', barPct: 100, tone: 'cancelled' },
};

const DELIVERY_CAPTION: Record<TrackingDelivery['status'], string> = {
    pending_assignment: 'Looking for a nearby driver.',
    assigned: 'Your driver is heading to the restaurant.',
    picked_up: 'Your driver has picked up your order.',
    delivered: 'Delivered.',
    failed: 'We ran into a problem delivering this order.',
};

const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled', 'rejected'];
const POLL_INTERVAL_MS = 5000;

function csrfToken(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
}

export default function OrderTrack({ tracking, reasons }: { tracking: TrackingPayload; reasons: string[] }) {
    const [data, setData] = useState<TrackingPayload>(tracking);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const pollRef = useRef<number | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(route('customer.orders.status', data.order.uuid), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            setData((await res.json()) as TrackingPayload);
        } catch {
            // A missed poll isn't worth surfacing — the next tick retries.
        }
    }, [data.order.uuid]);

    // Poll every 5s while the order is still moving; stop once it's terminal.
    useEffect(() => {
        if (TERMINAL_STATUSES.includes(data.order.status)) return;

        pollRef.current = window.setInterval(fetchStatus, POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
        };
    }, [data.order.status, fetchStatus]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStatus();
        setRefreshing(false);
    };

    const handleCancel = async (reason: string) => {
        setCancelling(true);
        try {
            const res = await fetch(route('customer.orders.cancel', data.order.uuid), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ reason }),
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json?.message ?? 'This order could not be cancelled.');
                return;
            }
            setData(json as TrackingPayload);
            setCancelOpen(false);
            toast.success('Order cancelled.');
        } catch {
            toast.error('This order could not be cancelled. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    const meta = STATUS_META[data.order.status];
    const banner = meta.tone === 'cancelled' ? 'bg-rose-600' : meta.tone === 'done' ? 'bg-emerald-600' : 'bg-emerald-600';
    const caption = data.delivery && data.order.status === 'out_for_delivery' ? DELIVERY_CAPTION[data.delivery.status] : meta.caption;

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <Head title={`Order #${data.order.uuid.slice(0, 8).toUpperCase()}`} />
            <CustomerHeader />

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
                <Link
                    href={route('customer.dashboard')}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
                >
                    ← Back
                </Link>

                {/* Status banner */}
                <div className={`mt-4 overflow-hidden rounded-2xl ${banner} p-6 text-white`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold">{data.restaurant?.name ?? 'Your order'}</h1>
                            <p className="mt-2 text-base font-semibold">{meta.label}</p>
                            <p className="mt-0.5 text-sm text-white/80">{caption}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            aria-label="Refresh status"
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/25"
                        >
                            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    {meta.tone === 'live' && (
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${meta.barPct}%` }} />
                        </div>
                    )}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    {/* Map */}
                    <OrderMap restaurant={data.restaurant} address={data.address} />

                    {/* Details */}
                    <div className="space-y-4">
                        {data.address && (
                            <div className="border-border rounded-2xl border p-4">
                                <p className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                    <MapPin className="size-4" /> Delivery Address
                                </p>
                                <p className="mt-1.5 text-sm font-medium">{data.address.line}</p>
                            </div>
                        )}

                        {data.restaurant && (
                            <div className="border-border rounded-2xl border p-4">
                                <p className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                    <Store className="size-4" /> {data.restaurant.name}
                                </p>
                                {data.restaurant.location && <p className="text-muted-foreground mt-1 text-sm">{data.restaurant.location}</p>}

                                <div className="border-border/70 mt-3 flex items-center justify-between border-t pt-3 text-sm">
                                    <span className="text-muted-foreground">Order ID</span>
                                    <span className="font-mono font-semibold">#{data.order.uuid.slice(0, 8).toUpperCase()}</span>
                                </div>

                                <ul className="mt-2 space-y-1.5">
                                    {data.items.map((item, i) => (
                                        <li key={i} className="flex items-start justify-between text-sm">
                                            <span>
                                                <span className="text-muted-foreground">{item.quantity}x</span> {item.name}
                                                {item.modifiers.length > 0 && (
                                                    <span className="text-muted-foreground block text-xs">{item.modifiers.join(', ')}</span>
                                                )}
                                            </span>
                                            <span className="font-medium tabular-nums">£{item.subtotal.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {data.delivery?.driver && (
                            <div className="border-border flex items-center gap-3 rounded-2xl border p-4">
                                {data.delivery.driver.photo ? (
                                    <img src={data.delivery.driver.photo} alt="" className="size-11 rounded-full object-cover" />
                                ) : (
                                    <div className="bg-muted flex size-11 items-center justify-center rounded-full text-sm font-semibold">
                                        {data.delivery.driver.name.charAt(0)}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{data.delivery.driver.name}</p>
                                    <p className="text-muted-foreground text-xs">Your delivery partner</p>
                                </div>
                                {data.order.delivery_code && (
                                    <div className="text-right">
                                        <p className="text-muted-foreground text-[11px] tracking-wide uppercase">Delivery Code</p>
                                        <p className="font-mono text-lg font-bold tracking-widest">{data.order.delivery_code}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="border-border rounded-2xl border p-4">
                                <p className="text-muted-foreground text-xs">Total Paid</p>
                                <p className="mt-1 text-lg font-bold text-emerald-600">£{data.order.total.toFixed(2)}</p>
                            </div>
                            {data.payment && (
                                <div className="border-border rounded-2xl border p-4">
                                    <p className="text-muted-foreground text-xs">Payment</p>
                                    <p className="mt-1 text-sm font-semibold capitalize">{data.payment.method}</p>
                                </div>
                            )}
                        </div>

                        {(data.order.status === 'cancelled' || data.order.status === 'rejected') && data.order.cancellation_reason && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                <span className="font-semibold">{data.order.status === 'rejected' ? 'Reason:' : 'Cancellation reason:'}</span>{' '}
                                {data.order.cancellation_reason}
                            </div>
                        )}

                        <Link
                            href={route('customer.profile')}
                            className="border-border hover:bg-muted/50 flex items-center justify-between rounded-2xl border p-4 text-sm font-medium transition"
                        >
                            <span className="flex items-center gap-2">
                                <Headphones className="size-4 text-rose-500" />
                                Go to Support
                            </span>
                            <span aria-hidden>›</span>
                        </Link>

                        {data.order.cancellable && (
                            <button
                                type="button"
                                onClick={() => setCancelOpen(true)}
                                className="h-12 w-full rounded-md bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>
            </main>

            <CancelOrderDialog open={cancelOpen} onCancel={() => setCancelOpen(false)} onConfirm={handleCancel} busy={cancelling} reasons={reasons} />
        </div>
    );
}

/**
 * Small static overview map (restaurant → delivery address). No live driver
 * position is tracked yet, so this is deliberately static rather than an
 * interactive Google Maps embed.
 */
function OrderMap({ restaurant, address }: { restaurant: TrackingRestaurant | null; address: TrackingAddress | null }) {
    const apiKey = (import.meta.env as Record<string, string | undefined>).VITE_GOOGLE_MAPS_API_KEY;
    const hasPoints = restaurant?.lat != null && restaurant?.lng != null && address?.lat != null && address?.lng != null;

    if (apiKey && hasPoints) {
        const markers = [
            `markers=color:0x16a34a%7Clabel:R%7C${restaurant!.lat},${restaurant!.lng}`,
            `markers=color:0x111827%7Clabel:D%7C${address!.lat},${address!.lng}`,
        ].join('&');
        const src = `https://maps.googleapis.com/maps/api/staticmap?size=640x640&${markers}&key=${encodeURIComponent(apiKey)}`;

        return (
            <div className="border-border h-64 overflow-hidden rounded-2xl border lg:h-full">
                <img src={src} alt="Delivery route map" className="size-full object-cover" />
            </div>
        );
    }

    return (
        <div className="border-border bg-muted/40 text-muted-foreground flex h-64 items-center justify-center rounded-2xl border lg:h-full">
            <MapPin className="size-8" />
        </div>
    );
}
