import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Car,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    Package,
    Plus,
    ShoppingBag,
    Store,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { formatRelative } from '@/utils/format';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

// ─── Sample data ────────────────────────────────────────────────────────────

const WEEKLY_ORDERS = [
    { day: 'Mon', orders: 234 },
    { day: 'Tue', orders: 289 },
    { day: 'Wed', orders: 312 },
    { day: 'Thu', orders: 267 },
    { day: 'Fri', orders: 398 },
    { day: 'Sat', orders: 445 },
    { day: 'Sun', orders: 342 },
];

const RECENT_ORDERS = [
    { id: 'ORD-4821', customer: 'Marcus Thompson', restaurant: 'Spice Garden', status: 'delivered', total: '£24.50', time: '2026-05-08T09:14:00Z' },
    { id: 'ORD-4820', customer: 'Priya Sharma', restaurant: 'Smash Burger Co.', status: 'out_for_delivery', total: '£18.20', time: '2026-05-08T09:02:00Z' },
    { id: 'ORD-4819', customer: 'Liam O\'Brien', restaurant: 'Napoli Pizza', status: 'preparing', total: '£31.80', time: '2026-05-08T08:55:00Z' },
    { id: 'ORD-4818', customer: 'Aisha Patel', restaurant: 'Sushi Wave', status: 'accepted', total: '£42.00', time: '2026-05-08T08:48:00Z' },
    { id: 'ORD-4817', customer: 'Sofia Bennett', restaurant: 'Green Thai Kitchen', status: 'cancelled', total: '£15.60', time: '2026-05-08T08:31:00Z' },
];

const ACTIVITY = [
    { id: 1, icon: Store, color: 'text-blue-500 bg-blue-500/10', message: 'Sushi Wave registered and pending approval', time: '2026-05-08T09:05:00Z' },
    { id: 2, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10', message: 'Driver James Reed approved', time: '2026-05-08T08:52:00Z' },
    { id: 3, icon: FileText, color: 'text-orange-500 bg-orange-500/10', message: '4 documents awaiting verification', time: '2026-05-08T08:40:00Z' },
    { id: 4, icon: Package, color: 'text-purple-500 bg-purple-500/10', message: '342 orders completed today', time: '2026-05-08T08:00:00Z' },
];

const QUICK_ACTIONS = [
    { label: 'Add restaurant', href: '/admin/restaurants/create', icon: Store, color: 'text-blue-500' },
    { label: 'Add driver', href: '/admin/drivers/create', icon: Car, color: 'text-orange-500' },
    { label: 'Pending approvals', href: '/admin/drivers?approval_status=pending', icon: AlertCircle, color: 'text-red-500' },
    { label: 'View customers', href: '/admin/customers', icon: Users, color: 'text-purple-500' },
];

const ORDER_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' | 'info' }> = {
    delivered:        { label: 'Delivered',   variant: 'success' },
    out_for_delivery: { label: 'On the way',  variant: 'info' },
    preparing:        { label: 'Preparing',   variant: 'warning' },
    accepted:         { label: 'Accepted',    variant: 'secondary' },
    cancelled:        { label: 'Cancelled',   variant: 'danger' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function OrdersBarChart() {
    const max = Math.max(...WEEKLY_ORDERS.map((d) => d.orders));

    return (
        <div className="flex items-end gap-2 h-36 pt-4">
            {WEEKLY_ORDERS.map((d, i) => {
                const pct = (d.orders / max) * 100;
                const isToday = d.day === 'Sun';
                return (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                        <motion.div
                            className={cn(
                                'w-full rounded-t-md relative overflow-hidden',
                                isToday ? 'bg-primary/20' : 'bg-muted',
                            )}
                            style={{ height: `${pct}%` }}
                            initial={{ scaleY: 0, originY: 1 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.55, delay: 0.1 + i * 0.07, ease }}
                        >
                            <motion.div
                                className={cn(
                                    'absolute inset-x-0 top-0 rounded-t-md',
                                    isToday ? 'bg-primary h-[45%]' : 'bg-muted-foreground/30 h-[35%]',
                                )}
                            />
                        </motion.div>
                        <span className={cn('text-[10px] font-medium', isToday ? 'text-primary' : 'text-muted-foreground')}>
                            {d.day}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function PlatformHealthRow() {
    const metrics = [
        { label: 'Avg delivery time', value: '28 min', icon: Clock, good: true },
        { label: 'Order success rate', value: '97.4%', icon: TrendingUp, good: true },
        { label: 'Driver utilisation', value: '78%', icon: Zap, good: true },
    ];
    return (
        <div className="grid grid-cols-3 divide-x divide-border">
            {metrics.map((m, i) => (
                <motion.div
                    key={m.label}
                    className="flex flex-col gap-0.5 px-4 py-3 first:pl-0 last:pr-0"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.08, ease }}
                >
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className={cn('text-lg font-semibold tabular-nums', m.good && 'text-emerald-600 dark:text-emerald-400')}>{m.value}</p>
                </motion.div>
            ))}
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    })();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <PageContainer>
                <PageHeader
                    eyebrow={greeting}
                    title="Dashboard"
                    description="Here's what's happening across SwiftDrop today."
                    actions={
                        <>
                            <Button variant="outline" size="sm" leftIcon={<ShoppingBag />} asChild>
                                <Link href="/admin/restaurants">Restaurants</Link>
                            </Button>
                            <Button size="sm" leftIcon={<Plus />} asChild>
                                <Link href="/admin/restaurants/create">Add restaurant</Link>
                            </Button>
                        </>
                    }
                />

                {/* KPI stat cards */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Orders today"    value="342"   trend={12.4} helper="vs. yesterday" icon={<Package />}     accent="blue"   index={0} />
                    <StatCard label="Revenue today"   value="£8,429" trend={8.1} helper="vs. yesterday" icon={<CreditCard />}  accent="green"  index={1} />
                    <StatCard label="Active drivers"  value="47"    trend={5.2}  helper="online now"    icon={<Car />}         accent="orange" index={2} />
                    <StatCard label="Pending reviews" value="12"    trend={-2.1} helper="needs action"  icon={<AlertCircle />} accent="red"    index={3} />
                </section>

                {/* Middle row */}
                <section className="mt-6 grid gap-6 lg:grid-cols-3">
                    {/* Orders chart */}
                    <Card className="lg:col-span-2 overflow-hidden">
                        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-0">
                            <div>
                                <CardTitle className="text-base">Orders this week</CardTitle>
                                <p className="text-sm text-muted-foreground mt-0.5">Daily order volume — last 7 days</p>
                            </div>
                            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight />} asChild>
                                <Link href="/admin/restaurants">View all</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="px-6 pb-4 pt-2">
                            <OrdersBarChart />
                            <div className="mt-4 border-t border-border/60 pt-4">
                                <PlatformHealthRow />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick actions + activity */}
                    <div className="flex flex-col gap-4">
                        {/* Quick actions */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Quick actions</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-2 pt-0">
                                {QUICK_ACTIONS.map((a, i) => (
                                    <motion.div
                                        key={a.label}
                                        initial={{ opacity: 0, scale: 0.94 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.2 + i * 0.06, ease }}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <Link
                                            href={a.href}
                                            className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-center hover:bg-muted/60 hover:border-border transition-all"
                                        >
                                            <span className={cn('flex size-8 items-center justify-center rounded-lg bg-muted', a.color)}>
                                                <a.icon className="size-4" />
                                            </span>
                                            <span className="text-xs font-medium leading-tight">{a.label}</span>
                                        </Link>
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Recent activity */}
                        <Card className="flex-1">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                {ACTIVITY.map((item, i) => (
                                    <motion.div
                                        key={item.id}
                                        className="flex items-start gap-3"
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.28, delay: 0.3 + i * 0.07, ease }}
                                    >
                                        <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg [&_svg]:size-3.5', item.color)}>
                                            <item.icon />
                                        </span>
                                        <div className="min-w-0 space-y-0.5">
                                            <p className="text-xs leading-snug text-foreground">{item.message}</p>
                                            <p className="text-[10px] text-muted-foreground">{formatRelative(item.time)}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Recent orders table */}
                <section className="mt-6">
                    <div className="flex items-center justify-between pb-4">
                        <div>
                            <h2 className="text-base font-semibold tracking-tight">Recent orders</h2>
                            <p className="text-sm text-muted-foreground">Latest orders across all restaurants</p>
                        </div>
                        <Button variant="outline" size="sm" rightIcon={<ArrowRight />} asChild>
                            <Link href="/admin/restaurants">View all orders</Link>
                        </Button>
                    </div>
                    <Card className="overflow-hidden p-0">
                        <div className="divide-y divide-border/60">
                            {/* Header */}
                            <div className="grid grid-cols-[1fr_1fr_120px_80px_80px] gap-3 bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <span>Customer</span>
                                <span>Restaurant</span>
                                <span>Status</span>
                                <span className="text-right">Total</span>
                                <span className="text-right">Time</span>
                            </div>
                            {RECENT_ORDERS.map((order, i) => (
                                <motion.div
                                    key={order.id}
                                    className="grid grid-cols-[1fr_1fr_120px_80px_80px] items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: 0.15 + i * 0.05, ease }}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Avatar className="size-7 shrink-0">
                                            <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                                                {order.customer.split(' ').map((n) => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{order.customer}</p>
                                            <p className="truncate text-[10px] text-muted-foreground font-mono">{order.id}</p>
                                        </div>
                                    </div>
                                    <p className="truncate text-sm text-muted-foreground">{order.restaurant}</p>
                                    <Badge variant={ORDER_STATUS[order.status].variant} dot>
                                        {ORDER_STATUS[order.status].label}
                                    </Badge>
                                    <p className="text-right text-sm font-medium tabular-nums">{order.total}</p>
                                    <p className="text-right text-xs text-muted-foreground">{formatRelative(order.time)}</p>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </section>
            </PageContainer>
        </AppLayout>
    );
}
