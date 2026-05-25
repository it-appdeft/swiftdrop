import { Head, Link, router } from '@inertiajs/react';
import { MoreHorizontal, Plus, Search, Ticket } from 'lucide-react';
import { useCallback, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionHeading } from '@/components/shared/section-heading';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/admin';
import { TRIGGER_LABELS } from './coupon-fields';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/coupons' },
    { title: 'Coupons', href: '/admin/coupons' },
];

interface Coupon {
    id: number;
    code: string;
    title: string | null;
    type: string;
    value: string | number;
    trigger: string;
    is_active: boolean;
    usages_count: number;
    valid_until: string | null;
}

interface Props {
    coupons: Paginated<Coupon>;
    filters: { search?: string; status?: string };
}

function discountLabel(c: Coupon): string {
    const v = Number(c.value);
    if (c.type === 'percentage') return `${v}% off`;
    if (c.type === 'free_delivery') return 'Free delivery';
    return `£${v.toFixed(2)} off`;
}

export default function CouponsIndex({ coupons, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [confirm, setConfirm] = useState<Coupon | null>(null);
    const [deleting, setDeleting] = useState(false);

    const applyFilters = useCallback(
        (overrides: Record<string, string>) => {
            router.get('/admin/coupons', { search, status: filters.status ?? '', ...overrides }, { preserveState: true, replace: true });
        },
        [search, filters.status],
    );

    const toggleActive = (c: Coupon) => {
        router.patch(`/admin/coupons/${c.id}/status`, { is_active: !c.is_active }, { preserveScroll: true });
    };

    const handleDelete = () => {
        if (!confirm) return;
        setDeleting(true);
        router.delete(`/admin/coupons/${confirm.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setConfirm(null);
            },
        });
    };

    const columns: DataTableColumn<Coupon>[] = [
        {
            id: 'code',
            header: 'Code',
            cell: (row) => (
                <div>
                    <span className="font-mono text-sm font-semibold">{row.code}</span>
                    {row.title ? <p className="text-muted-foreground text-xs">{row.title}</p> : null}
                </div>
            ),
        },
        {
            id: 'discount',
            header: 'Discount',
            cell: (row) => <span className="text-sm">{discountLabel(row)}</span>,
        },
        {
            id: 'trigger',
            header: 'Availability',
            cell: (row) => <span className="text-muted-foreground text-sm">{TRIGGER_LABELS[row.trigger] ?? row.trigger}</span>,
        },
        {
            id: 'uses',
            header: 'Uses',
            align: 'right',
            cell: (row) => <span className="text-muted-foreground text-sm tabular-nums">{row.usages_count}</span>,
        },
        {
            id: 'status',
            header: 'Status',
            cell: (row) => (
                <span
                    className={
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' +
                        (row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600')
                    }
                >
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
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
                            <Link href={`/admin/coupons/${row.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toggleActive(row)}>{row.is_active ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => {
                                e.preventDefault();
                                setConfirm(row);
                            }}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Coupons" />

            <PageContainer>
                <PageHeader
                    eyebrow="Admin"
                    title="Coupons"
                    description="Create and manage discount coupons available to customers at checkout."
                    actions={
                        <Button size="sm" leftIcon={<Plus />} asChild>
                            <Link href="/admin/coupons/create">Add coupon</Link>
                        </Button>
                    }
                />

                <section className="mt-2">
                    <SectionHeading title="All coupons" description={`${coupons.total} coupon${coupons.total !== 1 ? 's' : ''} total`} />

                    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                placeholder="Search by code or title…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                            />
                        </div>
                        <select
                            value={filters.status ?? ''}
                            onChange={(e) => applyFilters({ status: e.target.value })}
                            className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <DataTable<Coupon>
                        data={coupons.data}
                        columns={columns}
                        rowKey={(row) => row.id}
                        empty={
                            <EmptyState
                                icon={<Ticket />}
                                title="No coupons yet"
                                description="Create your first coupon to offer customers a discount."
                                action={
                                    <Button leftIcon={<Plus />} asChild>
                                        <Link href="/admin/coupons/create">Add coupon</Link>
                                    </Button>
                                }
                            />
                        }
                        footer={
                            coupons.last_page > 1 ? (
                                <div className="text-muted-foreground flex items-center justify-between text-sm">
                                    <span>
                                        Showing {coupons.from}–{coupons.to} of {coupons.total}
                                    </span>
                                    <div className="flex gap-1">
                                        {coupons.links.map((link, i) => (
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

            <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete coupon?</DialogTitle>
                        <DialogDescription>
                            This will permanently remove <strong>{confirm?.code}</strong>. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirm(null)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} loading={deleting}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
