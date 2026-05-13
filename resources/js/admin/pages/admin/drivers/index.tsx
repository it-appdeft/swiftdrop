import { Head, Link, router } from '@inertiajs/react';
import { Car, MoreHorizontal, Plus, Search, Users } from 'lucide-react';
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
import type { BreadcrumbItem } from '@/types';
import type { Driver, Paginated } from '@/types/admin';
import { formatRelative, initials } from '@/utils/format';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/drivers' },
    { title: 'Drivers', href: '/admin/drivers' },
];

const APPROVAL_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
};

const VEHICLE_LABELS: Record<string, string> = {
    bicycle: 'Bicycle',
    motorcycle: 'Motorcycle',
    car: 'Car',
    van: 'Van',
};

interface Props {
    drivers: Paginated<Driver>;
    filters: { search?: string; status?: string; approval_status?: string; availability?: string };
    stats: { total: number; online: number; approved: number; pending_approval: number };
}

export default function DriversIndex({ drivers, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = useCallback(
        (overrides: Record<string, string>) => {
            router.get(
                '/admin/drivers',
                {
                    search,
                    status: filters.status ?? '',
                    approval_status: filters.approval_status ?? '',
                    availability: filters.availability ?? '',
                    ...overrides,
                },
                { preserveState: true, replace: true },
            );
        },
        [search, filters],
    );

    const columns: DataTableColumn<Driver>[] = [
        {
            id: 'name',
            header: 'Driver',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                        <AvatarFallback className="bg-primary-muted text-xs font-medium text-primary">
                            {initials(row.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{row.name}</p>
                        <p className="truncate text-xs text-muted-foreground font-mono">{row.mobile}</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'vehicle',
            header: 'Vehicle',
            cell: (row) => (
                <div className="text-sm">
                    <p>{VEHICLE_LABELS[row.driver_profile?.vehicle_type ?? ''] ?? '—'}</p>
                    {row.driver_profile?.vehicle_registration && (
                        <p className="font-mono text-xs text-muted-foreground uppercase">
                            {row.driver_profile.vehicle_registration}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'availability',
            header: 'Availability',
            cell: (row) => (
                <Badge variant={row.driver_profile?.availability === 'online' ? 'success' : 'secondary'} dot>
                    {row.driver_profile?.availability ?? 'offline'}
                </Badge>
            ),
        },
        {
            id: 'approval',
            header: 'Approval',
            cell: (row) => (
                <Badge variant={APPROVAL_VARIANT[row.driver_profile?.approval_status ?? 'pending']}>
                    {row.driver_profile?.approval_status ?? 'pending'}
                </Badge>
            ),
        },
        {
            id: 'docs',
            header: 'Docs',
            cell: (row) => {
                const pending = row.driver_profile?.pending_documents_count ?? 0;
                return pending > 0 ? (
                    <Badge variant="warning">{pending} pending</Badge>
                ) : (
                    <span className="text-sm text-muted-foreground">{row.driver_profile?.documents_count ?? 0}</span>
                );
            },
        },
        {
            id: 'deliveries',
            header: 'Deliveries',
            align: 'right',
            cell: (row) => (
                <span className="tabular-nums text-sm">{row.driver_profile?.deliveries_count ?? 0}</span>
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
                            <Link href={`/admin/drivers/${row.id}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/drivers/${row.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {row.driver_profile?.approval_status !== 'approved' && (
                            <DropdownMenuItem
                                onClick={() => router.patch(`/admin/drivers/${row.id}/approval`, { approval_status: 'approved' })}
                            >
                                Approve driver
                            </DropdownMenuItem>
                        )}
                        {row.status === 'active' ? (
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => router.patch(`/admin/drivers/${row.id}/status`, { status: 'suspended' })}
                            >
                                Suspend
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={() => router.patch(`/admin/drivers/${row.id}/status`, { status: 'active' })}
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
            <Head title="Drivers" />

            <PageContainer>
                <PageHeader
                    eyebrow="Admin"
                    title="Drivers"
                    description="Manage driver accounts, approvals, and documents."
                    actions={
                        <Button size="sm" leftIcon={<Plus />} asChild>
                            <Link href="/admin/drivers/create">Add driver</Link>
                        </Button>
                    }
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Total drivers"    value={stats.total}            icon={<Users />} accent="blue"   index={0} />
                    <StatCard label="Online now"       value={stats.online}           icon={<Car />}   accent="green"  index={1} />
                    <StatCard label="Approved"         value={stats.approved}                          accent="purple" index={2} />
                    <StatCard label="Pending approval" value={stats.pending_approval}                  accent="orange" index={3} />
                </section>

                <section className="mt-8">
                    <SectionHeading
                        title="All drivers"
                        description={`${drivers.total} driver${drivers.total !== 1 ? 's' : ''} total`}
                    />

                    <div className="mb-4 flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, mobile or registration…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                            />
                        </div>
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
                        <Select
                            value={filters.availability ?? 'all'}
                            onValueChange={(v) => applyFilters({ availability: v === 'all' ? '' : v })}
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="offline">Offline</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DataTable<Driver>
                        data={drivers.data}
                        columns={columns}
                        rowKey={(row) => row.id}
                        onRowClick={(row) => router.visit(`/admin/drivers/${row.id}`)}
                        empty={
                            <EmptyState
                                icon={<Car />}
                                title="No drivers found"
                                description="Try adjusting your search or filters."
                            />
                        }
                        footer={
                            drivers.last_page > 1 ? (
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>
                                        Showing {drivers.from}–{drivers.to} of {drivers.total}
                                    </span>
                                    <div className="flex gap-1">
                                        {drivers.links.map((link, i) => (
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
