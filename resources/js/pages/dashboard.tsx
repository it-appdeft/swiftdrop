import { Head } from '@inertiajs/react';
import { ArrowUpRight, CreditCard, Download, MoreHorizontal, Package, Plus, Sparkles, Users } from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionHeading } from '@/components/shared/section-heading';
import { StatCard } from '@/components/shared/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { formatCompact, formatCurrency, formatPercent, formatRelative, initials } from '@/utils/format';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

interface Customer {
    id: string;
    name: string;
    email: string;
    plan: 'Starter' | 'Growth' | 'Enterprise';
    status: 'active' | 'trial' | 'past_due';
    mrr: number;
    lastSeen: string;
}

const SAMPLE_CUSTOMERS: Customer[] = [
    { id: '1', name: 'Olivia Martinez', email: 'olivia@northwindlabs.com', plan: 'Enterprise', status: 'active', mrr: 4200, lastSeen: '2026-04-27T13:14:00Z' },
    { id: '2', name: 'Jamie Chen', email: 'jamie@brightline.io', plan: 'Growth', status: 'active', mrr: 1290, lastSeen: '2026-04-26T18:02:00Z' },
    { id: '3', name: 'Priya Patel', email: 'priya@helix.app', plan: 'Starter', status: 'trial', mrr: 0, lastSeen: '2026-04-28T08:55:00Z' },
    { id: '4', name: 'Marcus Reed', email: 'marcus@orbit.dev', plan: 'Growth', status: 'past_due', mrr: 990, lastSeen: '2026-04-25T11:21:00Z' },
    { id: '5', name: 'Sofia Müller', email: 'sofia@constellation.de', plan: 'Enterprise', status: 'active', mrr: 5800, lastSeen: '2026-04-28T07:40:00Z' },
];

const STATUS_VARIANT = {
    active: 'success',
    trial: 'info',
    past_due: 'warning',
} as const;

const STATUS_LABEL: Record<Customer['status'], string> = {
    active: 'Active',
    trial: 'Trial',
    past_due: 'Past due',
};

const customerColumns: DataTableColumn<Customer>[] = [
    {
        id: 'name',
        header: 'Customer',
        cell: (row) => (
            <div className="flex items-center gap-3">
                <Avatar className="size-8">
                    <AvatarFallback className="bg-primary-muted text-xs font-medium text-primary">{initials(row.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                </div>
            </div>
        ),
    },
    {
        id: 'plan',
        header: 'Plan',
        cell: (row) => <Badge variant="outline">{row.plan}</Badge>,
    },
    {
        id: 'status',
        header: 'Status',
        cell: (row) => (
            <Badge variant={STATUS_VARIANT[row.status]} dot>
                {STATUS_LABEL[row.status]}
            </Badge>
        ),
    },
    {
        id: 'mrr',
        header: 'MRR',
        align: 'right',
        cell: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.mrr)}</span>,
    },
    {
        id: 'lastSeen',
        header: 'Last seen',
        align: 'right',
        cell: (row) => <span className="text-sm text-muted-foreground">{formatRelative(row.lastSeen)}</span>,
    },
    {
        id: 'actions',
        header: '',
        align: 'right',
        width: '48px',
        cell: () => (
            <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                <MoreHorizontal />
            </Button>
        ),
    },
];

const ACTIVITY_ITEMS = [
    { id: 1, who: 'Olivia Martinez', action: 'upgraded to Enterprise', when: '2026-04-28T07:14:00Z' },
    { id: 2, who: 'Jamie Chen', action: 'invited 3 new teammates', when: '2026-04-27T19:02:00Z' },
    { id: 3, who: 'System', action: 'completed weekly billing run', when: '2026-04-27T03:00:00Z' },
    { id: 4, who: 'Priya Patel', action: 'started a 14-day trial', when: '2026-04-26T22:31:00Z' },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <PageContainer>
                <PageHeader
                    eyebrow="Overview"
                    title="Welcome back"
                    description="Here's what happened with your workspace in the last 30 days."
                    actions={
                        <>
                            <Button variant="outline" size="sm" leftIcon={<Download />}>
                                Export
                            </Button>
                            <Button size="sm" leftIcon={<Plus />}>
                                New invoice
                            </Button>
                        </>
                    }
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Monthly recurring revenue"
                        value={formatCurrency(48230)}
                        trend={12.4}
                        helper="vs. last month"
                        icon={<CreditCard />}
                    />
                    <StatCard
                        label="Active customers"
                        value={formatCompact(2842)}
                        trend={4.1}
                        helper="vs. last month"
                        icon={<Users />}
                    />
                    <StatCard
                        label="Trial conversion"
                        value={formatPercent(0.318)}
                        trend={-1.2}
                        helper="last 30 days"
                        icon={<Sparkles />}
                    />
                    <StatCard
                        label="Open shipments"
                        value={formatCompact(184)}
                        trend={8.7}
                        helper="vs. last week"
                        icon={<Package />}
                    />
                </section>

                <section className="mt-8 grid gap-6 lg:grid-cols-3">
                    <Card className="overflow-hidden lg:col-span-2">
                        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                            <div>
                                <CardTitle>Revenue</CardTitle>
                                <p className="text-sm text-muted-foreground">Monthly recurring revenue across all plans.</p>
                            </div>
                            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight />}>
                                View report
                            </Button>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <RevenueSpark />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent activity</CardTitle>
                            <p className="text-sm text-muted-foreground">Latest events across your workspace.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ACTIVITY_ITEMS.map((item) => (
                                <div key={item.id} className="flex items-start gap-3">
                                    <Avatar className="size-8">
                                        <AvatarFallback className="bg-secondary text-xs font-medium">{initials(item.who)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 space-y-0.5">
                                        <p className="text-sm leading-tight">
                                            <span className="font-medium">{item.who}</span>{' '}
                                            <span className="text-muted-foreground">{item.action}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatRelative(item.when)}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="mt-8">
                    <SectionHeading
                        title="Recent customers"
                        description="Newest accounts joined or upgraded in the last week."
                        actions={
                            <Button variant="outline" size="sm" rightIcon={<ArrowUpRight />}>
                                View all
                            </Button>
                        }
                    />
                    <DataTable<Customer>
                        data={SAMPLE_CUSTOMERS}
                        columns={customerColumns}
                        rowKey={(row) => row.id}
                        empty={
                            <EmptyState
                                icon={<Users />}
                                title="No customers yet"
                                description="Once people sign up, you'll see them here."
                            />
                        }
                    />
                </section>
            </PageContainer>
        </AppLayout>
    );
}

/**
 * Tiny presentational sparkline rendered with pure SVG so we don't pull in
 * a chart library for a single visual. Replace with a real chart once data
 * volume justifies the dependency.
 */
function RevenueSpark() {
    const points = [12, 18, 16, 22, 28, 24, 32, 36, 30, 38, 42, 48];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const w = 600;
    const h = 160;
    const stepX = w / (points.length - 1);
    const path = points
        .map((value, index) => {
            const x = index * stepX;
            const y = h - ((value - min) / (max - min || 1)) * (h - 12) - 6;
            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" role="img" aria-label="Revenue trend">
            <defs>
                <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#spark-fill)" />
            <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
