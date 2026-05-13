import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, MoreHorizontal, Plus, Search, Store, XCircle } from 'lucide-react';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Paginated, Restaurant } from '@/types/admin';
import { formatRelative } from '@/utils/format';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/restaurants' },
    { title: 'Restaurants', href: '/admin/restaurants' },
];

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'danger',
    pending_approval: 'warning',
};

const APPROVAL_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
};

interface Props {
    restaurants: Paginated<Restaurant>;
    filters: { search?: string; status?: string; approval_status?: string };
    stats: { total: number; active: number; approved: number; pending_approval: number };
}

export default function RestaurantIndex({ restaurants, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = useCallback(
        (overrides: Record<string, string>) => {
            router.get(
                '/admin/restaurants',
                {
                    search,
                    status: filters.status ?? '',
                    approval_status: filters.approval_status ?? '',
                    ...overrides,
                },
                { preserveState: true, replace: true },
            );
        },
        [search, filters],
    );

    const columns: DataTableColumn<Restaurant>[] = [
        {
            id: 'name',
            header: 'Restaurant',
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    {row.cuisine_type && (
                        <p className="text-xs text-muted-foreground">{row.cuisine_type}</p>
                    )}
                </div>
            ),
        },
        {
            id: 'location',
            header: 'Location',
            cell: (row) => (
                <span className="text-sm text-muted-foreground">
                    {row.city}, {row.postcode}
                </span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (row) => (
                <div className="flex flex-col gap-1">
                    <Badge variant={STATUS_VARIANT[row.status]} dot>
                        {row.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant={APPROVAL_VARIANT[row.approval_status]}>
                        {row.approval_status}
                    </Badge>
                </div>
            ),
        },
        {
            id: 'rating',
            header: 'Rating',
            align: 'right',
            cell: (row) => (
                <span className="text-sm tabular-nums">
                    {Number(row.rating).toFixed(1)} ({row.total_reviews})
                </span>
            ),
        },
        {
            id: 'orders',
            header: 'Orders',
            align: 'right',
            cell: (row) => (
                <span className="text-sm tabular-nums">{row.orders_count ?? 0}</span>
            ),
        },
        {
            id: 'joined',
            header: 'Joined',
            align: 'right',
            cell: (row) => (
                <span className="text-sm text-muted-foreground">{formatRelative(row.created_at)}</span>
            ),
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
                            <Link href={`/admin/restaurants/${row.id}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/restaurants/${row.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {row.approval_status !== 'approved' && (
                            <DropdownMenuItem
                                onClick={() => router.patch(`/admin/restaurants/${row.id}/approval`, { approval_status: 'approved' })}
                            >
                                <CheckCircle className="mr-2 size-4" /> Approve
                            </DropdownMenuItem>
                        )}
                        {row.status === 'active' ? (
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => router.patch(`/admin/restaurants/${row.id}/status`, { status: 'suspended' })}
                            >
                                <XCircle className="mr-2 size-4" /> Suspend
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={() => router.patch(`/admin/restaurants/${row.id}/status`, { status: 'active' })}
                            >
                                <CheckCircle className="mr-2 size-4" /> Activate
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Restaurants" />

            <PageContainer>
                <PageHeader
                    eyebrow="Admin"
                    title="Restaurants"
                    description="Manage restaurant accounts, approvals, and documents."
                    actions={
                        <Button size="sm" leftIcon={<Plus />} asChild>
                            <Link href="/admin/restaurants/create">Add restaurant</Link>
                        </Button>
                    }
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Total restaurants" value={stats.total}            icon={<Store />} accent="blue"   index={0} />
                    <StatCard label="Active"            value={stats.active}           icon={<Store />} accent="green"  index={1} />
                    <StatCard label="Approved"          value={stats.approved}                          accent="purple" index={2} />
                    <StatCard label="Pending approval"  value={stats.pending_approval}                  accent="orange" index={3} />
                </section>

                <section className="mt-8">
                    <SectionHeading
                        title="All restaurants"
                        description={`${restaurants.total} restaurant${restaurants.total !== 1 ? 's' : ''} total`}
                    />

                    <div className="mb-4 flex flex-wrap gap-3">
                        <div className="relative min-w-48 flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, city or postcode…"
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
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="pending_approval">Pending approval</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.approval_status ?? 'all'}
                            onValueChange={(v) => applyFilters({ approval_status: v === 'all' ? '' : v })}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="All approvals" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All approvals</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DataTable<Restaurant>
                        data={restaurants.data}
                        columns={columns}
                        rowKey={(row) => row.id}
                        onRowClick={(row) => router.visit(`/admin/restaurants/${row.id}`)}
                        empty={
                            <EmptyState
                                icon={<Store />}
                                title="No restaurants found"
                                description="Try adjusting your search or filters."
                            />
                        }
                        footer={
                            restaurants.last_page > 1 ? (
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>
                                        Showing {restaurants.from}–{restaurants.to} of {restaurants.total}
                                    </span>
                                    <div className="flex gap-1">
                                        {restaurants.links.map((link, i) => (
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
