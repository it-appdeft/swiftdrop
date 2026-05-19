import { Head, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    Coins,
    Download,
    Megaphone,
    Plus,
    ShoppingBag,
    Star,
    TrendingUp,
} from 'lucide-react';
import AppLayout from '../layouts/app-layout';

// ─── Mock data ─────────────────────────────────────────────────────────────

const SALES_POINTS = [18000, 17800, 17200, 26500, 33000, 38500, 42180];
const SALES_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HOUR_POINTS: { hour: string; orders: number }[] = [
    { hour: '11a', orders: 8 },
    { hour: '12p', orders: 22 },
    { hour: '1p', orders: 34 },
    { hour: '2p', orders: 26 },
    { hour: '5p', orders: 12 },
    { hour: '7p', orders: 38 },
    { hour: '8p', orders: 46 },
    { hour: '9p', orders: 28 },
    { hour: '10p', orders: 14 },
];

const TOP_ITEMS = [
    { rank: 1, name: 'Chicken Biryani', orders: 124, sales: '₹ 28,520' },
    { rank: 2, name: 'Paneer Tikka', orders: 86, sales: '₹ 17,200' },
    { rank: 3, name: 'Butter Naan', orders: 212, sales: '₹ 8,480' },
    { rank: 4, name: 'Gulab Jamun', orders: 64, sales: '₹ 3,840' },
];

const REVIEWS = [
    { name: 'Priya S.', rating: 5, text: 'Best biryani in the area. Always on time!' },
    { name: 'Amit K.', rating: 4, text: 'Loved the paneer, naan was a bit cold.' },
    { name: 'Riya D.', rating: 5, text: 'Packaging was great. Will order again.' },
];

const LOW_STOCK = [
    { name: 'Basmati Rice', detail: '2 kg left' },
    { name: 'Paneer', detail: 'out of stock' },
    { name: 'Cola 500ml', detail: '6 left' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatINR(n: number): string {
    return '₹ ' + n.toLocaleString('en-IN');
}

interface SharedProps {
    auth: { user: { id: number; name: string; email: string | null } | null };
    [key: string]: unknown;
}


interface MetricCardProps {
    label: string;
    value: string;
    delta?: string;
    deltaTone?: 'positive' | 'neutral';
    icon: React.ComponentType<{ className?: string }>;
}

function MetricCard({ label, value, delta, deltaTone = 'positive', icon: Icon }: MetricCardProps) {
    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-primary">
                    <Icon className="size-4" />
                </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
            {delta && (
                <p
                    className={
                        'mt-1 text-xs font-medium ' +
                        (deltaTone === 'positive' ? 'text-emerald-600' : 'text-muted-foreground')
                    }
                >
                    {delta}
                </p>
            )}
        </div>
    );
}

function StatusCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: 'amber' | 'sky' | 'emerald' | 'rose';
}) {
    const toneClass = {
        amber: 'bg-amber-50 text-amber-700',
        sky: 'bg-sky-50 text-sky-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        rose: 'bg-rose-50 text-rose-700',
    }[tone];

    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass}`}>
                    Live
                </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
        </div>
    );
}

function SalesTrendChart() {
    const max = Math.max(...SALES_POINTS) * 1.1;
    const width = 720;
    const height = 220;
    const pad = { top: 20, right: 12, bottom: 28, left: 12 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const xFor = (i: number) =>
        pad.left + (SALES_POINTS.length === 1 ? innerW / 2 : (i * innerW) / (SALES_POINTS.length - 1));
    const yFor = (v: number) => pad.top + innerH - (v / max) * innerH;

    const linePath = SALES_POINTS.map(
        (v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(v)}`,
    ).join(' ');
    const areaPath =
        `${linePath} L ${xFor(SALES_POINTS.length - 1)} ${pad.top + innerH} L ${xFor(0)} ${pad.top + innerH} Z`;

    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold">Sales trend</p>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                </div>
                <span className="text-xs font-semibold text-foreground">
                    ₹ 1,98,200 <span className="text-muted-foreground">this week</span>
                </span>
            </div>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Sales trend chart"
                className="mt-4 h-48 w-full"
            >
                {[0.25, 0.5, 0.75].map((p) => (
                    <line
                        key={p}
                        x1={pad.left}
                        x2={width - pad.right}
                        y1={pad.top + innerH * p}
                        y2={pad.top + innerH * p}
                        stroke="currentColor"
                        className="text-zinc-100"
                    />
                ))}
                <path d={areaPath} fill="rgb(16 185 129 / 0.12)" />
                <path d={linePath} fill="none" stroke="rgb(16 185 129)" strokeWidth={2.5} />
                {SALES_POINTS.map((v, i) => (
                    <circle
                        key={i}
                        cx={xFor(i)}
                        cy={yFor(v)}
                        r={3.5}
                        fill="white"
                        stroke="rgb(16 185 129)"
                        strokeWidth={2}
                    />
                ))}
                {SALES_LABELS.map((label, i) => (
                    <text
                        key={label}
                        x={xFor(i)}
                        y={height - 8}
                        textAnchor="middle"
                        className="fill-zinc-400 text-[10px]"
                    >
                        {label}
                    </text>
                ))}
            </svg>
        </div>
    );
}

function OrdersByHour() {
    const max = Math.max(...HOUR_POINTS.map((p) => p.orders));
    const BAR_AREA = 160; // px — height the bars are normalized against

    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-sm font-semibold">Orders by hour</p>
            <p className="text-xs text-muted-foreground">Today</p>
            <div className="mt-4 flex items-end gap-1.5" style={{ height: BAR_AREA + 24 }}>
                {HOUR_POINTS.map((p) => (
                    <div
                        key={p.hour}
                        className="flex flex-1 flex-col items-center justify-end gap-1.5"
                    >
                        <div
                            className="w-full rounded-t bg-zinc-900"
                            style={{ height: Math.max(4, (p.orders / max) * BAR_AREA) }}
                            title={`${p.orders} orders`}
                        />
                        <span className="text-[9px] text-muted-foreground">{p.hour}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TopSellingItems() {
    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Top-selling items</p>
                <button type="button" className="text-xs font-semibold text-primary hover:underline">
                    View menu
                </button>
            </div>
            <ul className="mt-4 space-y-3">
                {TOP_ITEMS.map((item) => (
                    <li key={item.name} className="flex items-center gap-3">
                        <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-primary">
                            {item.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">{item.orders} orders</p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{item.sales}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function RecentReviews() {
    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Recent reviews</p>
                <button type="button" className="text-xs font-semibold text-primary hover:underline">
                    All reviews
                </button>
            </div>
            <ul className="mt-4 space-y-4">
                {REVIEWS.map((r) => (
                    <li key={r.name}>
                        <div className="flex items-center gap-2">
                            <span className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={
                                            'size-3 ' +
                                            (i < r.rating
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-zinc-300')
                                        }
                                    />
                                ))}
                            </span>
                            <span className="text-sm font-semibold">{r.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{r.text}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function LowStockAlerts() {
    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                <AlertTriangle className="size-4" />
                Low stock alerts
            </p>
            <ul className="mt-3 space-y-3">
                {LOW_STOCK.map((s) => (
                    <li key={s.name} className="flex items-center justify-between">
                        <p className="text-sm">
                            {s.name} <span className="text-muted-foreground">— {s.detail}</span>
                        </p>
                        <button
                            type="button"
                            className="text-xs font-semibold text-primary hover:underline"
                        >
                            Restock
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function AnnouncementCard() {
    return (
        <div className="rounded-2xl bg-zinc-900 p-5 text-white">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                <Megaphone className="size-3.5" />
                Announcement
            </p>
            <p className="mt-3 text-base font-bold">New: Combo builder is live</p>
            <p className="mt-1 text-xs text-zinc-300">
                Bundle items, set discounts and boost AOV by up to 22%.
            </p>
            <button
                type="button"
                className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
                Try combos
            </button>
        </div>
    );
}

function QuickActions() {
    const actions = [
        { label: 'Menu item', icon: Plus },
        { label: 'Notify staff', icon: Bell },
        { label: 'Export', icon: Download },
        { label: 'Reviews', icon: Star },
    ];

    return (
        <div className="rounded-2xl border border-border bg-background p-5">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <CheckCircle2 className="size-4 text-primary" />
                Quick actions
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
                {actions.map((a) => {
                    const Icon = a.icon;
                    return (
                        <button
                            key={a.label}
                            type="button"
                            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary"
                        >
                            <Icon className="size-3.5" />
                            {a.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function RestaurantDashboard() {
    const { auth } = usePage<SharedProps>().props;
    const firstName = (auth?.user?.name ?? 'Partner').split(' ')[0] || 'Partner';

    return (
        <AppLayout active="dashboard">
            <Head title="Dashboard — Swift Drop Partner" />

            <div className="space-y-6">
                        {/* Header row */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                    Good evening, {firstName}
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Here's how Spice Route — Indiranagar is doing today.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-semibold hover:border-primary hover:text-primary"
                                >
                                    <Download className="size-4" />
                                    Report
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                                >
                                    <Plus className="size-4" />
                                    Add menu item
                                </button>
                            </div>
                        </div>

                        {/* Metric cards */}
                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard
                                label="Today's orders"
                                value="94"
                                delta="↑ +12% vs yesterday"
                                icon={ShoppingBag}
                            />
                            <MetricCard
                                label="Gross sales"
                                value={formatINR(42180)}
                                delta="↑ +18% vs yesterday"
                                icon={TrendingUp}
                            />
                            <MetricCard
                                label="Net earnings"
                                value={formatINR(34587)}
                                delta="↑ After 18% commission"
                                icon={Coins}
                            />
                            <MetricCard
                                label="Avg rating"
                                value="4.7"
                                delta="↑ 236 reviews"
                                icon={Star}
                            />
                        </section>

                        {/* Status cards */}
                        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                            <StatusCard label="In progress" value={12} tone="amber" />
                            <StatusCard label="Ready" value={5} tone="sky" />
                            <StatusCard label="Completed" value={76} tone="emerald" />
                            <StatusCard label="Cancelled" value={1} tone="rose" />
                        </section>

                        {/* Charts row */}
                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <SalesTrendChart />
                            </div>
                            <div>
                                <OrdersByHour />
                            </div>
                        </section>

                        {/* Bottom row */}
                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <TopSellingItems />
                            <RecentReviews />
                            <div className="space-y-4">
                                <LowStockAlerts />
                                <AnnouncementCard />
                                <QuickActions />
                            </div>
                        </section>
            </div>
        </AppLayout>
    );
}
