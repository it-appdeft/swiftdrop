import { Head, router } from '@inertiajs/react';
import { CheckCircle, LifeBuoy, MessageCircle, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionHeading } from '@/components/shared/section-heading';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/admin';
import { decodePaginationLabel, formatRelative } from '@/utils/format';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/support-tickets' },
    { title: 'Support Tickets', href: '/admin/support-tickets' },
];

interface SupportTicket {
    id: number;
    reference: string;
    source: 'customer' | 'driver' | 'restaurant';
    subject: string;
    category: string | null;
    order_reference: string | null;
    description: string;
    status: string;
    status_label: string;
    customer_name: string | null;
    restaurant_name: string | null;
    created_at: string | null;
}

interface Props {
    tickets: Paginated<SupportTicket>;
    filters: { search?: string; status?: string; source?: string };
    stats: { total: number; open: number; in_progress: number; resolved: number; closed: number };
    statuses: string[];
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
    open: 'secondary',
    in_progress: 'warning',
    resolved: 'success',
    closed: 'secondary',
};

const STATUS_LABEL: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
};

const SOURCE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
    customer: 'secondary',
    driver: 'warning',
    restaurant: 'success',
};

export default function SupportTicketIndex({ tickets, filters, stats, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = useCallback(
        (overrides: Record<string, string>) => {
            router.get(
                '/admin/support-tickets',
                {
                    search,
                    status: filters.status ?? '',
                    source: filters.source ?? '',
                    ...overrides,
                },
                { preserveState: true, replace: true },
            );
        },
        [search, filters],
    );

    const setStatus = (ticket: SupportTicket, status: string) =>
        router.patch(`/admin/support-tickets/${ticket.id}/status`, { status }, { preserveScroll: true });

    const columns: DataTableColumn<SupportTicket>[] = [
        {
            id: 'reference',
            header: 'Ref',
            cell: (row) => <span className="font-mono text-xs font-semibold">{row.reference}</span>,
        },
        {
            id: 'subject',
            header: 'Subject',
            cell: (row) => (
                <div className="max-w-md">
                    <p className="truncate font-medium">{row.subject}</p>
                    <p className="text-muted-foreground truncate text-xs">{row.description}</p>
                </div>
            ),
        },
        {
            id: 'raised_by',
            header: 'Raised by',
            cell: (row) => (
                <div>
                    <Badge variant={SOURCE_VARIANT[row.source] ?? 'secondary'}>{row.source}</Badge>
                    <p className="text-muted-foreground mt-1 text-xs">
                        {row.source === 'restaurant'
                            ? (row.restaurant_name ?? row.customer_name ?? '—')
                            : (row.customer_name ?? '—')}
                    </p>
                </div>
            ),
        },
        {
            id: 'context',
            header: 'Context',
            cell: (row) => (
                <span className="text-muted-foreground text-sm">{row.category ?? row.order_reference ?? '—'}</span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (row) => <Badge variant={STATUS_VARIANT[row.status] ?? 'secondary'}>{row.status_label}</Badge>,
        },
        {
            id: 'created',
            header: 'Created',
            align: 'right',
            cell: (row) => (
                <span className="text-muted-foreground text-sm">
                    {row.created_at ? formatRelative(row.created_at) : '—'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            align: 'right',
            width: '48px',
            cell: (row) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Change status">
                                <CheckCircle />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Set status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {statuses.map((status) => (
                                <DropdownMenuItem
                                    key={status}
                                    disabled={status === row.status}
                                    onClick={() => setStatus(row, status)}
                                >
                                    {STATUS_LABEL[status] ?? status}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Support Tickets" />

            <PageContainer>
                <PageHeader
                    eyebrow="Admin"
                    title="Support Tickets"
                    description="Customer and restaurant support requests across the platform."
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Total tickets" value={stats.total} icon={<LifeBuoy />} accent="blue" index={0} />
                    <StatCard label="Open" value={stats.open} accent="orange" index={1} />
                    <StatCard label="In progress" value={stats.in_progress} accent="purple" index={2} />
                    <StatCard label="Resolved" value={stats.resolved} accent="green" index={3} />
                </section>

                <section className="mt-8">
                    <SectionHeading
                        title="All tickets"
                        description={`${tickets.total} ticket${tickets.total !== 1 ? 's' : ''} total`}
                    />

                    <div className="mb-4 flex flex-wrap gap-3">
                        <div className="relative min-w-48 flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                placeholder="Search by subject, reference or order…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                            />
                        </div>
                        <Select
                            value={filters.source ?? 'all'}
                            onValueChange={(v) => applyFilters({ source: v === 'all' ? '' : v })}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="All sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sources</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="driver">Driver</SelectItem>
                                <SelectItem value="restaurant">Restaurant</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.status ?? 'all'}
                            onValueChange={(v) => applyFilters({ status: v === 'all' ? '' : v })}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {statuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {STATUS_LABEL[status] ?? status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DataTable<SupportTicket>
                        data={tickets.data}
                        columns={columns}
                        rowKey={(row) => row.id}
                        empty={
                            <EmptyState
                                icon={<MessageCircle />}
                                title="No support tickets found"
                                description="Try adjusting your search or filters."
                            />
                        }
                        footer={
                            tickets.last_page > 1 ? (
                                <div className="text-muted-foreground flex items-center justify-between text-sm">
                                    <span>
                                        Showing {tickets.from}–{tickets.to} of {tickets.total}
                                    </span>
                                    <div className="flex gap-1">
                                        {tickets.links.map((link, i) => (
                                            <Button
                                                key={i}
                                                size="xs"
                                                variant={link.active ? 'default' : 'outline'}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                            >
                                                {decodePaginationLabel(link.label)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ) : null
                        }
                    />
                </section>
            </PageContainer>
        </AppLayout>
    );
}
