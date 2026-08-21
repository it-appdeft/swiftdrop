import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Filter, MapPin, Phone, Printer, Receipt, Search, Volume2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';

// ─── Types ──────────────────────────────────────────────────────────────────

type OrderStatus = 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';

type PaymentMethod = 'prepaid' | 'cod';

interface OrderItem {
    name: string;
    qty: number;
    price: number;
    image: string;
    veg?: boolean;
    modifiers?: string[];
}

interface Order {
    id: string;
    reference: string;
    customer: { name: string; address: string; phone?: string | null };
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    vat: number;
    total: number;
    payment: PaymentMethod;
    status: OrderStatus;
    placedAt: string | null; // ISO 8601
    note?: string | null;
}

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Counts {
    all: number;
    new: number;
    preparing: number;
    ready: number;
    out_for_delivery: number;
    completed: number;
    cancelled: number;
}

interface OrdersPageProps {
    orders: PaginatedOrders;
    commissionRate: number;
    counts: Counts;
    [key: string]: unknown;
}

const STATUS_META: Record<OrderStatus, { label: string; chipClass: string; tabLabel: string }> = {
    new: {
        label: 'New',
        chipClass: 'bg-emerald-500 text-white',
        tabLabel: 'New',
    },
    preparing: {
        label: 'Preparing',
        chipClass: 'bg-amber-100 text-amber-700',
        tabLabel: 'Preparing',
    },
    ready: {
        label: 'Ready',
        chipClass: 'bg-sky-100 text-sky-700',
        tabLabel: 'Ready',
    },
    out_for_delivery: {
        label: 'Out for delivery',
        chipClass: 'bg-zinc-900 text-white',
        tabLabel: 'Out for delivery',
    },
    completed: {
        label: 'Completed',
        chipClass: 'bg-emerald-100 text-emerald-700',
        tabLabel: 'Completed',
    },
    cancelled: {
        label: 'Cancelled',
        chipClass: 'bg-rose-100 text-rose-700',
        tabLabel: 'Cancelled',
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function inr(n: number): string {
    return '£ ' + n.toLocaleString('en-GB');
}

/** Compact "just now / 5m ago / 2h ago / 3d ago" from an ISO timestamp. */
function timeAgo(iso: string | null): string {
    if (!iso) return '—';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '—';
    const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

type TabKey = 'all' | OrderStatus;

const TABS: TabKey[] = ['all', 'new', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

function itemsSummary(items: OrderItem[]): string {
    return items.map((i) => `${i.name}×${i.qty}`).join(', ');
}

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status as OrderStatus] ?? {
        label: status.replaceAll('_', ' '),
        chipClass: 'bg-zinc-100 text-zinc-700',
        tabLabel: status,
    };
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.chipClass}`}>{meta.label}</span>;
}

function PaymentBadge({ method }: { method: PaymentMethod }) {
    return (
        <span className="inline-flex items-center rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
            {method === 'prepaid' ? 'Prepaid' : 'COD'}
        </span>
    );
}

function VegDot({ veg }: { veg?: boolean }) {
    return (
        <span
            className={
                'inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm border ' + (veg ? 'border-emerald-600' : 'border-rose-600')
            }
        >
            <span className={'block size-1.5 rounded-full ' + (veg ? 'bg-emerald-600' : 'bg-rose-600')} />
        </span>
    );
}

// ─── Order detail drawer ──────────────────────────────────────────────────

function OrderDrawer({ order, commissionRate, onClose }: { order: Order; commissionRate: number; onClose: () => void }) {
    const commission = (order.total * commissionRate) / 100;
    const [actioning, setActioning] = useState<'accept' | 'reject' | null>(null);

    // Accept/Reject just PATCH the order's status straight from the click —
    // no client-side status juggling. The partial reload refreshes `orders`,
    // the drawer re-renders with the new status, and this footer disappears
    // on its own once `order.status` is no longer 'new'.
    const respond = (action: 'accept' | 'reject') => {
        setActioning(action);
        router.patch(
            route(`restaurant.orders.${action}`, order.id),
            {},
            { preserveScroll: true, preserveState: true, onFinish: () => setActioning(null) },
        );
    };

    return (
        <div className="fixed inset-0 z-40">
            <button type="button" aria-label="Close order details" onClick={onClose} className="absolute inset-0 bg-black/40" />
            <aside className="border-border bg-background absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l shadow-xl">
                <header className="border-border flex items-center justify-between border-b px-5 py-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold tracking-tight">
                            {order.reference} · {order.customer.name}
                        </h2>
                        <StatusBadge status={order.status} />
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="border-border bg-background hover:border-primary flex size-9 items-center justify-center rounded-full border"
                    >
                        <X className="size-4" />
                    </button>
                </header>

                <section className="space-y-3 px-5 py-4">
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Items ({order.items.length})</p>
                    {order.items.map((item, idx) => (
                        <div key={idx} className="border-border bg-background flex items-center gap-3 rounded-xl border p-3">
                            {item.image ? (
                                <img src={item.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                            ) : (
                                <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg">
                                    <Receipt className="text-muted-foreground size-5" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <VegDot veg={item.veg} />
                                    <p className="truncate text-sm font-semibold">{item.name}</p>
                                </div>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    Qty {item.qty} · {inr(item.qty * item.price)}
                                </p>
                                {item.modifiers && item.modifiers.length > 0 && (
                                    <p className="text-muted-foreground mt-0.5 truncate text-xs">{item.modifiers.join(', ')}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </section>

                <section className="border-border bg-muted/30 border-y px-5 py-4">
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Subtotal</dt>
                            <dd className="font-semibold">{inr(order.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Delivery fee</dt>
                            <dd className="font-semibold">{inr(order.deliveryFee)}</dd>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Discount</dt>
                                <dd className="font-semibold text-emerald-600">−{inr(order.discount)}</dd>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">VAT</dt>
                            <dd className="font-semibold">{inr(order.vat)}</dd>
                        </div>
                        <div className="border-border flex justify-between border-t pt-2 text-base">
                            <dt className="font-bold">Total</dt>
                            <dd className="font-bold">{inr(order.total)}</dd>
                        </div>
                        {commissionRate > 0 && (
                            <div className="flex justify-between text-xs">
                                <dt className="text-muted-foreground">Commission ({commissionRate}%)</dt>
                                <dd className="text-rose-600">−{inr(commission)}</dd>
                            </div>
                        )}
                    </dl>
                </section>

                <section className="space-y-3 px-5 py-4">
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Customer</p>
                    <div>
                        <p className="text-base font-bold">{order.customer.name}</p>
                        <p className="text-muted-foreground mt-1 inline-flex items-start gap-1.5 text-sm">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                            <span>{order.customer.address}</span>
                        </p>
                    </div>

                    {order.note && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{order.note}</div>}

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            className="border-input bg-background hover:border-primary hover:text-primary inline-flex items-center justify-center gap-1.5 rounded-md border px-4 py-2 text-sm font-semibold"
                        >
                            <Phone className="size-4" />
                            Call
                        </button>
                        <button
                            type="button"
                            className="border-input bg-background hover:border-primary hover:text-primary inline-flex items-center justify-center gap-1.5 rounded-md border px-4 py-2 text-sm font-semibold"
                        >
                            <Receipt className="size-4" />
                            Receipt
                        </button>
                    </div>
                </section>

                {order.status === 'new' && (
                    <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        <CheckCircle2 className="size-4 shrink-0" />A rider will be auto-assigned once you accept.
                    </div>
                )}

                <section className="border-border space-y-2 border-t px-5 py-4">
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Timeline</p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Order placed
                        </span>
                        <span className="text-muted-foreground">Just now</span>
                    </div>
                </section>

                {order.status === 'new' && (
                    <footer className="border-border bg-background sticky bottom-0 mt-auto grid grid-cols-2 gap-2 border-t px-5 py-3">
                        <button
                            type="button"
                            onClick={() => respond('reject')}
                            disabled={actioning !== null}
                            className="bg-background inline-flex items-center justify-center gap-1.5 rounded-md border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                        >
                            <XCircle className="size-4" />
                            {actioning === 'reject' ? 'Rejecting…' : 'Reject'}
                        </button>
                        <button
                            type="button"
                            onClick={() => respond('accept')}
                            disabled={actioning !== null}
                            className="bg-primary text-primary-foreground inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                        >
                            <CheckCircle2 className="size-4" />
                            {actioning === 'accept' ? 'Accepting…' : 'Accept'}
                        </button>
                    </footer>
                )}
            </aside>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Orders() {
    const { orders, commissionRate, counts } = usePage<OrdersPageProps>().props;
    const [tab, setTab] = useState<TabKey>('all');
    const [search, setSearch] = useState('');
    const [soundOn, setSoundOn] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const handleSearch = (value: string) => {
        setSearch(value);

        router.get(
            route('restaurant.orders'),
            {
                status: tab === 'all' ? undefined : tab,
                search: value,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const filtered = orders.data;

    const selectedOrder = orders.data.find((o) => o.id === selectedOrderId) ?? null;

    // Lock body scroll when drawer is open.
    useEffect(() => {
        if (!selectedOrder) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [selectedOrder]);

    const tabLabel = (k: TabKey) => (k === 'all' ? 'All' : STATUS_META[k].tabLabel);

    return (
        <AppLayout active="orders">
            <Head title="Orders — Swift Drop Partner" />

            <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orders</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Real-time order queue across all channels.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSoundOn((v) => !v)}
                            className="border-input bg-background hover:border-primary inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold"
                        >
                            <Volume2 className="size-4" />
                            {soundOn ? 'Sound on' : 'Sound off'}
                        </button>
                        <button
                            type="button"
                            className="border-input bg-background hover:border-primary inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold"
                        >
                            <Filter className="size-4" />
                            Filters
                        </button>
                        <button
                            type="button"
                            className="bg-primary text-primary-foreground inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold hover:opacity-90"
                        >
                            <Printer className="size-4" />
                            Print queue
                        </button>
                    </div>
                </div>

                <div className="inline-flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Live
                    </span>
                    <span className="text-muted-foreground">Auto-refreshing · new orders every ~45s</span>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="-mx-1 flex flex-wrap items-center gap-1 px-1">
                        {TABS.map((t) => {
                            const isActive = tab === t;
                            const count = counts[t];
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                        setTab(t);

                                        router.get(
                                            route('restaurant.orders'),
                                            {
                                                status: t === 'all' ? undefined : t,
                                                search,
                                            },
                                            {
                                                preserveState: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                    className={
                                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ' +
                                        (isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                                    }
                                >
                                    {tabLabel(t)}
                                    {count > 0 && (
                                        <span
                                            className={
                                                'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ' +
                                                (isActive ? 'bg-background/20 text-background' : 'bg-muted text-foreground')
                                            }
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full lg:w-80">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search order or customer"
                            className="border-input bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30 h-10 w-full rounded-md border pr-3 pl-9 text-sm focus:ring-2 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="border-border bg-background overflow-hidden rounded-2xl border">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead className="bg-muted/40 text-muted-foreground text-left text-[11px] font-semibold tracking-wider uppercase">
                                <tr>
                                    <th className="px-5 py-3">Order</th>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Items</th>
                                    <th className="px-5 py-3">Total</th>
                                    <th className="px-5 py-3">Payment</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-muted-foreground px-5 py-10 text-center text-sm">
                                            No orders match this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((order) => {
                                        return (
                                            <tr key={order.id} className="hover:bg-muted/30">
                                                <td className="px-5 py-3 align-top">
                                                    <p className="font-semibold">{order.reference}</p>
                                                    <p className="text-muted-foreground mt-0.5 text-xs">{timeAgo(order.placedAt)}</p>
                                                </td>
                                                <td className="px-5 py-3 align-top font-medium">{order.customer.name}</td>
                                                <td className="px-5 py-3 align-top text-sm">{itemsSummary(order.items)}</td>
                                                <td className="px-5 py-3 align-top font-semibold tabular-nums">{inr(order.total)}</td>
                                                <td className="px-5 py-3 align-top">
                                                    <PaymentBadge method={order.payment} />
                                                </td>
                                                <td className="px-5 py-3 align-top">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td className="px-5 py-3 text-right align-top">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedOrderId(order.id)}
                                                        className="border-input bg-background hover:border-primary hover:text-primary inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold"
                                                    >
                                                        Open
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-border flex items-center justify-between border-t px-5 py-3">
                        <p className="text-muted-foreground text-sm">
                            Showing page {orders.current_page} of {orders.last_page}
                        </p>

                        <div className="flex gap-2">
                            {orders.current_page > 1 && (
                                <Link
                                    href={route('restaurant.orders', {
                                        page: orders.current_page - 1,
                                        search,
                                        status: tab === 'all' ? undefined : tab,
                                    })}
                                    className="rounded-md border px-3 py-2 text-sm"
                                >
                                    Previous
                                </Link>
                            )}

                            {orders.current_page < orders.last_page && (
                                <Link
                                    href={route('restaurant.orders', {
                                        page: orders.current_page + 1,
                                        search,
                                        status: tab === 'all' ? undefined : tab,
                                    })}
                                    className="rounded-md border px-3 py-2 text-sm"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedOrder && <OrderDrawer order={selectedOrder} commissionRate={commissionRate} onClose={() => setSelectedOrderId(null)} />}
        </AppLayout>
    );
}
