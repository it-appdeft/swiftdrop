import { Head, Link, router } from '@inertiajs/react';
import { ImageOff, MoreHorizontal, Plus, Search, UtensilsCrossed } from 'lucide-react';
import { useCallback, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionHeading } from '@/components/shared/section-heading';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { FoodItem, Paginated } from '@/types/admin';
import { formatRelative } from '@/utils/format';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/food-items' },
    { title: 'Food Items', href: '/admin/food-items' },
];

interface Props {
    items: Paginated<FoodItem>;
    filters: { search?: string };
}

export default function FoodItemsIndex({ items, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [confirm, setConfirm] = useState<FoodItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const applyFilters = useCallback(
        (overrides: Record<string, string>) => {
            router.get('/admin/food-items', { search, ...overrides }, { preserveState: true, replace: true });
        },
        [search],
    );

    const handleDelete = () => {
        if (!confirm) return;
        setDeleting(true);
        router.delete(`/admin/food-items/${confirm.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setConfirm(null);
            },
        });
    };

    const columns: DataTableColumn<FoodItem>[] = [
        {
            id: 'image',
            header: 'Image',
            width: '88px',
            cell: (row) =>
                row.image_url ? (
                    <img
                        src={row.image_url}
                        alt={row.name}
                        className="size-12 rounded-md border border-border/60 object-cover"
                    />
                ) : (
                    <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground">
                        <ImageOff className="size-4" />
                    </div>
                ),
        },
        {
            id: 'name',
            header: 'Name',
            cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
        },
        {
            id: 'slug',
            header: 'Slug',
            cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.slug}</span>,
        },
        {
            id: 'created',
            header: 'Created',
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
                            <Link href={`/admin/food-items/${row.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
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
            <Head title="Food Items" />

            <PageContainer>
                <PageHeader
                    eyebrow="Admin"
                    title="Food Items"
                    description="Manage the food categories shown to customers."
                    actions={
                        <Button size="sm" leftIcon={<Plus />} asChild>
                            <Link href="/admin/food-items/create">Add item</Link>
                        </Button>
                    }
                />

                <section className="mt-2">
                    <SectionHeading
                        title="All items"
                        description={`${items.total} item${items.total !== 1 ? 's' : ''} total`}
                    />

                    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or slug…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                            />
                        </div>
                    </div>

                    <DataTable<FoodItem>
                        data={items.data}
                        columns={columns}
                        rowKey={(row) => row.id}
                        empty={
                            <EmptyState
                                icon={<UtensilsCrossed />}
                                title="No food items yet"
                                description="Add your first food item to get started."
                                action={
                                    <Button leftIcon={<Plus />} asChild>
                                        <Link href="/admin/food-items/create">Add item</Link>
                                    </Button>
                                }
                            />
                        }
                        footer={
                            items.last_page > 1 ? (
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>
                                        Showing {items.from}–{items.to} of {items.total}
                                    </span>
                                    <div className="flex gap-1">
                                        {items.links.map((link, i) => (
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
                        <DialogTitle>Delete food item?</DialogTitle>
                        <DialogDescription>
                            This will permanently remove <strong>{confirm?.name}</strong> and its image. This action cannot be undone.
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
