import { Head, Link, router, usePage } from '@inertiajs/react';
import { MoreHorizontal, Plus, Search, Users } from 'lucide-react';
import { useCallback, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionHeading } from '@/components/shared/section-heading';
import { StatCard } from '@/components/shared/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { Customer, Paginated } from '@/types/admin';
import type { BreadcrumbItem } from '@/types';
import { initials, formatRelative } from '@/utils/format';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/customers' },
    { title: 'Customers', href: '/admin/customers' },
];

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
    active: 'success',
    suspended: 'danger',
    pending_approval: 'warning',
};

const STATUS_LABEL: Record<string, string> = {
    active: 'Active',
    suspended: 'Suspended',
    pending_approval: 'Pending',
};

interface Props {
    customers: Paginated<Customer>;
    filters: { search?: string; status?: string };
    stats: { total: number; active: number; suspended: number; pending: number };
}

export default function CustomersIndex({ customers, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = useCallback((overrides: Record<string, string>) => {
        router.get('/admin/customers', { search, status: filters.status ?? '', ...overrides }, { preserveState: true, replace: true });
    }, [search, filters.status]);

    const columns: DataTableColumn<Customer>[] = [
        {
            id: 'name',
            header: 'Customer',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                        <AvatarFallback className="bg-primary-muted text-xs font-medium text-primary">
                            {initials(row.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{row.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.email ?? row.mobile}</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'mobile',
            header: 'Mobile',
            cell: (row) => <span className="font-mono text-sm">{row.mobile}</span>,
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
            id: 'orders',
            header: 'Orders',
            align: 'right',
            cell: (row) => <span className="tabular-nums text-sm">{row.orders_count ?? 0}</span>,
        },
        {
            id: 'joined',
            header: 'Joined',
            align: 'right',
            cell: (row) => <span className="text-sm text-muted-foreground">{formatRelative(row.created_at)}</span>,
        },
        {
            id: 'actions',
            header: '',
            align: 'right',
            width: '48px',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/customers/${row.id}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/customers/${row.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {row.status === 'active' ? (
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => router.patch(`/admin/customers/${row.id}/status`, { status: 'suspended' })}
                            >
                                Suspend
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={() => router.patch(`/admin/customers/${row.id}/status`, { status: 'active' })}
                            >
                                Activate
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />

            <PageContainer>
                <PageHeader
                    eyebrow="Admin"
                    title="Customers"
                    description="View and manage all registered customers."
                    actions={
                        <Button size="sm" leftIcon={<Plus />} asChild>
                            <Link href="/admin/customers/create">Add customer</Link>
                        </Button>
                    }
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Total customers" value={stats.total} icon={<Users />} />
                    <StatCard label="Active" value={stats.active} />
                    <StatCard label="Suspended" value={stats.suspended} />
                    <StatCard label="Pending approval" value={stats.pending} />
                </section>

                <section className="mt-8">
                    <SectionHeading
                        title="All customers"
                        description={`${customers.total} customer${customers.total !== 1 ? 's' : ''} total`}
                    />

                    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email or mobile…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                            />
                        </div>
                        <Select
                            value={filters.status ?? 'all'}
                            onValueChange={(v) => applyFilters({ status: v === 'all' ? '' : v })}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="pending_approval">Pending approval</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DataTable<Customer>
                        data={customers.data}
                        columns={columns}
                        rowKey={(row) => row.id}
                        onRowClick={(row) => router.visit(`/admin/customers/${row.id}`)}
                        empty={
                            <EmptyState
                                icon={<Users />}
                                title="No customers found"
                                description="Try adjusting your search or filters."
                            />
                        }
                        footer={
                            customers.last_page > 1 ? (
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>
                                        Showing {customers.from}–{customers.to} of {customers.total}
                                    </span>
                                    <div className="flex gap-1">
                                        {customers.links.map((link, i) => (
                                            <Button
                                                key={i}
                                                size="xs"
                                                variant={link.active ? 'default' : 'outline'}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
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
