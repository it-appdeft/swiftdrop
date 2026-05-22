import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    Filter,
    MapPin,
    Phone,
    Printer,
    Receipt,
    Search,
    Volume2,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';

// ─── Types & mock data ────────────────────────────────────────────────────

type OrderStatus =
    | 'new'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'completed'
    | 'cancelled';

type PaymentMethod = 'prepaid' | 'cod';

interface OrderItem {
    name: string;
    qty: number;
    price: number;
    image: string;
    veg?: boolean;
}

interface Order {
    id: string;
    customer: { name: string; address: string; phone?: string };
    items: OrderItem[];
    subtotal: number;
    packaging: number;
    taxRate: number;
    commissionRate: number;
    payment: PaymentMethod;
    status: OrderStatus;
    placedAt: string; // human display, e.g. "1m ago"
    note?: string;
}

const STATUS_META: Record<
    OrderStatus,
    { label: string; chipClass: string; tabLabel: string }
> = {
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

const FOOD_IMG = {
    biryani: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=120&h=120&fit=crop',
    coke: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&h=120&fit=crop',
    raita: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=120&h=120&fit=crop',
    paneer: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=120&h=120&fit=crop',
    naan: 'https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?w=120&h=120&fit=crop',
    thali: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=120&h=120&fit=crop',
    mutton: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=120&h=120&fit=crop',
    rice: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop',
    noodles: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=120&h=120&fit=crop',
    pizza: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=120&h=120&fit=crop',
    burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop',
    falafel: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=120&h=120&fit=crop',
};

const ORDERS: Order[] = [
    {
        id: 'SD-2841',
        customer: {
            name: 'Priya Sharma',
            address: '12, 4th Cross, Indiranagar — 560038',
            phone: '+91 98765 43210',
        },
        items: [
            { name: 'Chicken Biryani', qty: 2, price: 260, image: FOOD_IMG.biryani, veg: false },
            { name: 'Coke 500ml', qty: 1, price: 60, image: FOOD_IMG.coke, veg: true },
            { name: 'Raita', qty: 1, price: 40, image: FOOD_IMG.raita, veg: true },
        ],
        subtotal: 620,
        packaging: 20,
        taxRate: 0.05,
        commissionRate: 0.18,
        payment: 'prepaid',
        status: 'new',
        placedAt: '1m ago',
        note: 'Note: Please don\'t ring the bell.',
    },
    {
        id: 'SD-2840',
        customer: { name: 'Amit Kumar', address: '88 MG Road, Bengaluru — 560001' },
        items: [
            { name: 'Paneer Tikka', qty: 1, price: 240, image: FOOD_IMG.paneer, veg: true },
            { name: 'Butter Naan', qty: 3, price: 33, image: FOOD_IMG.naan, veg: true },
        ],
        subtotal: 340,
        packaging: 15,
        taxRate: 0.05,
        commissionRate: 0.18,
        payment: 'cod',
        status: 'new',
        placedAt: '4m ago',
    },
    {
        id: 'SD-2839',
        customer: { name: 'Riya Desai', address: '5 Brigade Road, Bengaluru' },
        items: [{ name: 'Veg Thali', qty: 1, price: 280, image: FOOD_IMG.thali, veg: true }],
        subtotal: 280,
        packaging: 15,
        taxRate: 0.05,
        commissionRate: 0.18,
        payment: 'prepaid',
        status: 'preparing',
        placedAt: '12m ago',
    },
    {
        id: 'SD-2838',
        customer: { name: 'Karan Patel', address: 'HSR Layout Sector 2' },
        items: [
            { name: 'Mutton Rogan Josh', qty: 1, price: 420, image: FOOD_IMG.mutton, veg: false },
            { name: 'Jeera Rice', qty: 1, price: 140, image: FOOD_IMG.rice, veg: true },
        ],
        subtotal: 560,
        packaging: 20,
        taxRate: 0.05,
        commissionRate: 0.18,
        payment: 'prepaid',
        status: 'preparing',
        placedAt: '18m ago',
    },
    {
        id: 'SD-2837',
        customer: { name: 'Sneha Iyer', address: 'Koramangala 5th Block' },
        items: [
            { name: 'Hakka Noodles', qty: 1, price: 220, image: FOOD_IMG.noodles, veg: true },
            { name: 'Veg Manchurian', qty: 1, price: 240, image: FOOD_IMG.thali, veg: true },
        ],
        subtotal: 460,
        packaging: 20,
        taxRate: 0.05,
        commissionRate: 0.18,
        payment: 'prepaid',
        status: 'ready',
        placedAt: '22m ago',
    },
    {
        id: 'SD-2836',
        customer: { name: 'Aman Singh', address: 'Whitefield ITPL Main Rd' },
        items: [{ name: 'Pizza Margherita L', qty: 1, price: 549, image: FOOD_IMG.pizza, veg: true }],
        subtotal: 549,
        packaging: 20,
        taxRate: 0.05,
        commissionRate: 0.18,
        payment: 'prepaid',
        status: 'out_for_delivery',
        placedAt: '35m ago',
    },
    {
        id: 'SD-2835',
        customer: { name: 'Diya Roy', address: 'Jayanagar 4th Block' },
        items: [{ name: 'Burger Combo', qty: 1, price: 425, image: FOOD_IMG.burger, veg: false }],
        subtotal: 425,
        packaging: 15,
        taxRate: 0.05,
        commissionRate: 0.18,
        payment: 'cod',
        status: 'completed',
        placedAt: '65m ago',
    },
    {
        id: 'SD-2834',
        customer: { name: 'Vikram J.', address: 'BTM 2nd Stage' },
        items: [{ name: 'Falafel Wrap', qty: 1, price: 220, image: FOOD_IMG.falafel, veg: true }],
        subtotal: 220,
        packaging: 15,
        taxRate: 0.05,
        commissionRate: 0.18,
        payment: 'prepaid',
        status: 'cancelled',
        placedAt: '90m ago',
    },
];

type TabKey = 'all' | OrderStatus;

const TABS: TabKey[] = [
    'all',
    'new',
    'preparing',
    'ready',
    'out_for_delivery',
    'completed',
    'cancelled',
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function inr(n: number): string {
    return '₹ ' + n.toLocaleString('en-IN');
}

function itemsSummary(items: OrderItem[]): string {
    return items.map((i) => `${i.name}×${i.qty}`).join(', ');
}

function StatusBadge({ status }: { status: OrderStatus }) {
    const meta = STATUS_META[status];
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.chipClass}`}
        >
            {meta.label}
        </span>
    );
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
                'inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm border ' +
                (veg ? 'border-emerald-600' : 'border-rose-600')
            }
        >
            <span
                className={
                    'block size-1.5 rounded-full ' + (veg ? 'bg-emerald-600' : 'bg-rose-600')
                }
            />
        </span>
    );
}

// ─── Order detail drawer ──────────────────────────────────────────────────

function OrderDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
    const taxAmount = Math.round(order.subtotal * order.taxRate);
    const total = order.subtotal + order.packaging + taxAmount;
    const commission = Math.round(total * order.commissionRate);

    return (
        <div className="fixed inset-0 z-40">
            <button
                type="button"
                aria-label="Close order details"
                onClick={onClose}
                className="absolute inset-0 bg-black/40"
            />
            <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l border-border bg-background shadow-xl">
                <header className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold tracking-tight">
                            {order.id} · {order.customer.name}
                        </h2>
                        <StatusBadge status={order.status} />
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-full border border-border bg-background hover:border-primary"
                    >
                        <X className="size-4" />
                    </button>
                </header>

                <section className="space-y-3 px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Items ({order.items.length})
                    </p>
                    {order.items.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                        >
                            <img
                                src={item.image}
                                alt=""
                                className="size-12 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <VegDot veg={item.veg} />
                                    <p className="truncate text-sm font-semibold">{item.name}</p>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Qty {item.qty} · {inr(item.qty * item.price)}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="border-y border-border bg-muted/30 px-5 py-4">
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Subtotal</dt>
                            <dd className="font-semibold">{inr(order.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Packaging</dt>
                            <dd className="font-semibold">{inr(order.packaging)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                                Tax ({Math.round(order.taxRate * 100)}%)
                            </dt>
                            <dd className="font-semibold">{inr(taxAmount)}</dd>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 text-base">
                            <dt className="font-bold">Total</dt>
                            <dd className="font-bold">{inr(total)}</dd>
                        </div>
                        <div className="flex justify-between text-xs">
                            <dt className="text-muted-foreground">
                                Commission ({Math.round(order.commissionRate * 100)}%)
                            </dt>
                            <dd className="text-rose-600">−{inr(commission)}</dd>
                        </div>
                    </dl>
                </section>

                <section className="space-y-3 px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Customer
                    </p>
                    <div>
                        <p className="text-base font-bold">{order.customer.name}</p>
                        <p className="mt-1 inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                            <span>{order.customer.address}</span>
                        </p>
                    </div>

                    {order.note && (
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            {order.note}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                        >
                            <Phone className="size-4" />
                            Call
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                        >
                            <Receipt className="size-4" />
                            Receipt
                        </button>
                    </div>
                </section>

                {order.status === 'new' && (
                    <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        <CheckCircle2 className="size-4 shrink-0" />
                        A rider will be auto-assigned once you accept.
                    </div>
                )}

                <section className="space-y-2 border-t border-border px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Timeline
                    </p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Order placed
                        </span>
                        <span className="text-muted-foreground">Just now</span>
                    </div>
                </section>

                {order.status === 'new' && (
                    <footer className="sticky bottom-0 mt-auto grid grid-cols-2 gap-2 border-t border-border bg-background px-5 py-3">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-background px-4 py-2.5 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                        >
                            <XCircle className="size-4" />
                            Reject
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                        >
                            <CheckCircle2 className="size-4" />
                            Accept
                        </button>
                    </footer>
                )}
            </aside>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Orders() {
    const [tab, setTab] = useState<TabKey>('all');
    const [search, setSearch] = useState('');
    const [soundOn, setSoundOn] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const counts = ORDERS.reduce<Record<TabKey, number>>(
        (acc, o) => {
            acc.all += 1;
            acc[o.status] = (acc[o.status] ?? 0) + 1;
            return acc;
        },
        {
            all: 0,
            new: 0,
            preparing: 0,
            ready: 0,
            out_for_delivery: 0,
            completed: 0,
            cancelled: 0,
        } as Record<TabKey, number>,
    );

    const filtered = ORDERS.filter((o) => tab === 'all' || o.status === tab).filter((o) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            o.id.toLowerCase().includes(q) ||
            o.customer.name.toLowerCase().includes(q) ||
            o.items.some((i) => i.name.toLowerCase().includes(q))
        );
    });

    const selectedOrder = ORDERS.find((o) => o.id === selectedOrderId) ?? null;

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
                        <p className="mt-1 text-sm text-muted-foreground">
                            Real-time order queue across all channels.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSoundOn((v) => !v)}
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-semibold hover:border-primary"
                        >
                            <Volume2 className="size-4" />
                            {soundOn ? 'Sound on' : 'Sound off'}
                        </button>
                        <button
                            type="button"
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-semibold hover:border-primary"
                        >
                            <Filter className="size-4" />
                            Filters
                        </button>
                        <button
                            type="button"
                            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
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
                    <span className="text-muted-foreground">
                        Auto-refreshing · new orders every ~45s
                    </span>
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
                                    onClick={() => setTab(t)}
                                    className={
                                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ' +
                                        (isActive
                                            ? 'bg-foreground text-background'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                                    }
                                >
                                    {tabLabel(t)}
                                    {count > 0 && (
                                        <span
                                            className={
                                                'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ' +
                                                (isActive
                                                    ? 'bg-background/20 text-background'
                                                    : 'bg-muted text-foreground')
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
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search order or customer"
                            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-10 text-center text-sm text-muted-foreground"
                                        >
                                            No orders match this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((order) => {
                                        const total =
                                            order.subtotal +
                                            order.packaging +
                                            Math.round(order.subtotal * order.taxRate);
                                        return (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-5 py-3 align-top">
                                                    <p className="font-semibold">{order.id}</p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {order.placedAt}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3 align-top font-medium">
                                                    {order.customer.name}
                                                </td>
                                                <td className="px-5 py-3 align-top text-sm">
                                                    {itemsSummary(order.items)}
                                                </td>
                                                <td className="px-5 py-3 align-top font-semibold tabular-nums">
                                                    {inr(total)}
                                                </td>
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
                                                        className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-semibold hover:border-primary hover:text-primary"
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
                </div>
            </div>

            {selectedOrder && (
                <OrderDrawer
                    order={selectedOrder}
                    onClose={() => setSelectedOrderId(null)}
                />
            )}
        </AppLayout>
    );
}
