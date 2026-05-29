import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft, CheckCircle, Edit, FileText, Mail, MapPin,
    Package, Phone, ShieldCheck, ShieldOff, Star, XCircle,
} from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/shared/section-heading';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogClose, DialogContent, DialogDescription,
    DialogFooter, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Restaurant, RestaurantDocument, RestaurantOrder } from '@/types/admin';
import { formatDate, formatRelative } from '@/utils/format';

interface Props {
    restaurant: Restaurant;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    food_hygiene_cert: 'Food Hygiene Certificate',
    business_licence: 'Business Licence',
    insurance: 'Insurance Certificate',
    vat_registration: 'VAT Registration',
};

const DOC_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
};

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

const orderColumns: DataTableColumn<RestaurantOrder>[] = [
    {
        id: 'order',
        header: 'Order',
        cell: (row) => (
            <span className="font-mono text-xs">{row.uuid?.slice(0, 8)}…</span>
        ),
    },
    {
        id: 'status',
        header: 'Status',
        cell: (row) => (
            <Badge variant="secondary">{row.status.replace(/_/g, ' ')}</Badge>
        ),
    },
    {
        id: 'total',
        header: 'Total',
        align: 'right',
        cell: (row) => (
            <span className="text-sm tabular-nums">£{Number(row.total).toFixed(2)}</span>
        ),
    },
    {
        id: 'placed_at',
        header: 'Placed',
        align: 'right',
        cell: (row) => (
            <span className="text-sm text-muted-foreground">
                {row.placed_at ? formatRelative(row.placed_at) : formatRelative(row.created_at)}
            </span>
        ),
    },
];

function RejectDocumentDialog({ document }: { document: RestaurantDocument }) {
    const { data, setData, patch, processing, reset } = useForm({ reason: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/admin/documents/${document.id}/reject`, { onSuccess: () => reset() });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="xs" variant="destructive" leftIcon={<XCircle />}>Reject</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Reject document</DialogTitle>
                <DialogDescription>
                    Provide a reason for rejecting{' '}
                    {DOCUMENT_TYPE_LABELS[document.type] ?? document.type}. The restaurant will be notified.
                </DialogDescription>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="reason">Rejection reason</Label>
                        <Input
                            id="reason"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder="Document is expired or illegible…"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary" type="button">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" type="submit" loading={processing}>Reject</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function RestaurantShow({ restaurant }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/restaurants' },
        { title: 'Restaurants', href: '/admin/restaurants' },
        { title: restaurant.name, href: `/admin/restaurants/${restaurant.id}` },
    ];

    const handleStatusToggle = () => {
        const next = restaurant.status === 'active' ? 'suspended' : 'active';
        router.patch(`/admin/restaurants/${restaurant.id}/status`, { status: next });
    };

    const handleApproval = (approval_status: 'approved' | 'rejected') => {
        router.patch(`/admin/restaurants/${restaurant.id}/approval`, { approval_status });
    };

    const handleDocApprove = (docId: number) => {
        router.patch(`/admin/documents/${docId}/approve`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={restaurant.name} />

            <PageContainer>
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <Button variant="ghost" size="icon-sm" asChild>
                            <Link href="/admin/restaurants"><ArrowLeft /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
                            {restaurant.cuisine_type && (
                                <p className="text-sm text-muted-foreground">{restaurant.cuisine_type}</p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge variant={STATUS_VARIANT[restaurant.status]} dot>
                                    {restaurant.status.replace(/_/g, ' ')}
                                </Badge>
                                <Badge variant={APPROVAL_VARIANT[restaurant.approval_status]}>
                                    {restaurant.approval_status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Joined {formatDate(restaurant.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" leftIcon={<Edit />} asChild>
                            <Link href={`/admin/restaurants/${restaurant.id}/edit`}>Edit</Link>
                        </Button>
                        {restaurant.approval_status !== 'approved' && (
                            <Button size="sm" leftIcon={<CheckCircle />} onClick={() => handleApproval('approved')}>
                                Approve
                            </Button>
                        )}
                        {restaurant.approval_status === 'approved' && (
                            <Button size="sm" variant="outline" leftIcon={<XCircle />} onClick={() => handleApproval('rejected')}>
                                Revoke approval
                            </Button>
                        )}
                        <Button
                            variant={restaurant.status === 'active' ? 'destructive' : 'outline'}
                            size="sm"
                            leftIcon={restaurant.status === 'active' ? <ShieldOff /> : <ShieldCheck />}
                            onClick={handleStatusToggle}
                        >
                            {restaurant.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                    Contact
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="font-mono">{restaurant.phone}</span>
                                </div>
                                {restaurant.user?.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="size-4 shrink-0 text-muted-foreground" />
                                        <span className="truncate">{restaurant.user.email}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                    Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p>{restaurant.address_line_1}</p>
                                        {restaurant.address_line_2 && <p>{restaurant.address_line_2}</p>}
                                        <p>{restaurant.city}{restaurant.county ? `, ${restaurant.county}` : ''}</p>
                                        <p className="font-mono uppercase">{restaurant.postcode}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                    Business
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Commission</span>
                                    <span>{Number(restaurant.commission_rate).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rating</span>
                                    <span className="flex items-center gap-1">
                                        <Star className="size-3.5 fill-current text-amber-500" />
                                        {Number(restaurant.rating).toFixed(1)}
                                        <span className="text-muted-foreground">({restaurant.total_reviews})</span>
                                    </span>
                                </div>
                                {restaurant.vat_number && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">VAT number</span>
                                        <span className="font-mono">{restaurant.vat_number}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total orders</span>
                                    <span>{restaurant.orders_count ?? 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Documents */}
                        {restaurant.documents && (
                            <section>
                                <SectionHeading
                                    title="Documents"
                                    description={`${restaurant.documents.length} document${restaurant.documents.length !== 1 ? 's' : ''} uploaded`}
                                />
                                {restaurant.documents.length === 0 ? (
                                    <EmptyState
                                        icon={<FileText />}
                                        title="No documents uploaded"
                                        description="The restaurant hasn't uploaded any documents yet."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {restaurant.documents.map((doc) => (
                                            <Card key={doc.id}>
                                                <CardContent className="flex items-center justify-between gap-4 py-4">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <FileText className="size-5 shrink-0 text-muted-foreground" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium">
                                                                {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
                                                            </p>
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {doc.original_filename}
                                                                {doc.expires_at && ` · Expires ${formatDate(doc.expires_at)}`}
                                                            </p>
                                                            {doc.rejection_reason && (
                                                                <p className="mt-0.5 text-xs text-destructive">
                                                                    Reason: {doc.rejection_reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <Badge variant={DOC_STATUS_VARIANT[doc.verification_status]}>
                                                            {doc.verification_status}
                                                        </Badge>
                                                        {doc.verification_status !== 'approved' && (
                                                            <Button
                                                                size="xs"
                                                                variant="outline"
                                                                leftIcon={<CheckCircle />}
                                                                onClick={() => handleDocApprove(doc.id)}
                                                            >
                                                                Approve
                                                            </Button>
                                                        )}
                                                        {doc.verification_status !== 'rejected' && (
                                                            <RejectDocumentDialog document={doc} />
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Recent orders */}
                        <section>
                            <SectionHeading
                                title="Recent orders"
                                description={`${restaurant.orders_count ?? 0} total orders`}
                            />
                            <DataTable<RestaurantOrder>
                                data={restaurant.orders ?? []}
                                columns={orderColumns}
                                rowKey={(row) => row.id}
                                empty={
                                    <EmptyState
                                        icon={<Package />}
                                        title="No orders yet"
                                        description="This restaurant hasn't received any orders."
                                    />
                                }
                            />
                        </section>
                    </div>
                </div>
            </PageContainer>
        </AppLayout>
    );
}
