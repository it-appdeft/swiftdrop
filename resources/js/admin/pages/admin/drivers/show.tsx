import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Edit, FileText, Mail, Package, Phone, ShieldCheck, ShieldOff, Truck, XCircle } from 'lucide-react';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/shared/section-heading';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Driver, DriverDelivery, DriverDocument } from '@/types/admin';
import { formatDate, formatRelative, initials } from '@/utils/format';

interface Props {
    driver: Driver;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    driving_licence: 'Driving Licence',
    insurance: 'Insurance Certificate',
    mot: 'MOT Certificate',
    dbs_check: 'DBS Check',
    vehicle_registration: 'Vehicle Registration',
};

const DOC_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
};

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

const deliveryColumns: DataTableColumn<DriverDelivery>[] = [
    {
        id: 'order',
        header: 'Order',
        cell: (row) => (
            <span className="font-mono text-xs">
                {row.order?.uuid?.slice(0, 8) ?? '—'}…
            </span>
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
        id: 'distance',
        header: 'Distance',
        align: 'right',
        cell: (row) => (
            <span className="text-sm tabular-nums">
                {row.distance_miles ? `${Number(row.distance_miles).toFixed(1)} mi` : '—'}
            </span>
        ),
    },
    {
        id: 'delivered_at',
        header: 'Delivered',
        align: 'right',
        cell: (row) => (
            <span className="text-sm text-muted-foreground">
                {row.delivered_at ? formatRelative(row.delivered_at) : '—'}
            </span>
        ),
    },
];

function RejectDocumentDialog({ document }: { document: DriverDocument }) {
    const { data, setData, patch, processing, reset } = useForm({ reason: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/admin/documents/${document.id}/reject`, {
            onSuccess: () => reset(),
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="xs" variant="destructive" leftIcon={<XCircle />}>
                    Reject
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Reject document</DialogTitle>
                <DialogDescription>
                    Provide a reason for rejecting{' '}
                    {DOCUMENT_TYPE_LABELS[document.type] ?? document.type}. The driver will be notified.
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
                        <Button variant="destructive" type="submit" loading={processing}>
                            Reject
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function DriverShow({ driver }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/drivers' },
        { title: 'Drivers', href: '/admin/drivers' },
        { title: driver.name, href: `/admin/drivers/${driver.id}` },
    ];

    const profile = driver.driver_profile;

    const handleStatusToggle = () => {
        const next = driver.status === 'active' ? 'suspended' : 'active';
        router.patch(`/admin/drivers/${driver.id}/status`, { status: next });
    };

    const handleApproval = (approval_status: 'approved' | 'rejected') => {
        router.patch(`/admin/drivers/${driver.id}/approval`, { approval_status });
    };

    const handleDocApprove = (docId: number) => {
        router.patch(`/admin/documents/${docId}/approve`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={driver.name} />

            <PageContainer>
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon-sm" asChild>
                            <Link href="/admin/drivers"><ArrowLeft /></Link>
                        </Button>
                        <Avatar className="size-14">
                            <AvatarFallback className="bg-primary-muted text-lg font-semibold text-primary">
                                {initials(driver.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-semibold">{driver.name}</h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge variant={driver.status === 'active' ? 'success' : 'danger'} dot>
                                    {driver.status.replace(/_/g, ' ')}
                                </Badge>
                                {profile && (
                                    <>
                                        <Badge variant={profile.availability === 'online' ? 'success' : 'secondary'} dot>
                                            {profile.availability}
                                        </Badge>
                                        <Badge variant={APPROVAL_VARIANT[profile.approval_status]}>
                                            {profile.approval_status}
                                        </Badge>
                                    </>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    Joined {formatDate(driver.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" leftIcon={<Edit />} asChild>
                            <Link href={`/admin/drivers/${driver.id}/edit`}>Edit</Link>
                        </Button>
                        {profile?.approval_status !== 'approved' && (
                            <Button size="sm" leftIcon={<CheckCircle />} onClick={() => handleApproval('approved')}>
                                Approve
                            </Button>
                        )}
                        {profile?.approval_status === 'approved' && (
                            <Button size="sm" variant="outline" leftIcon={<XCircle />} onClick={() => handleApproval('rejected')}>
                                Revoke approval
                            </Button>
                        )}
                        <Button
                            variant={driver.status === 'active' ? 'destructive' : 'outline'}
                            size="sm"
                            leftIcon={driver.status === 'active' ? <ShieldOff /> : <ShieldCheck />}
                            onClick={handleStatusToggle}
                        >
                            {driver.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Contact
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="size-4 text-muted-foreground shrink-0" />
                                    <span className="font-mono">{driver.mobile}</span>
                                </div>
                                {driver.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="size-4 text-muted-foreground shrink-0" />
                                        <span className="truncate">{driver.email}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {profile && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                        Vehicle
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Truck className="size-4 text-muted-foreground" />
                                        <span>{VEHICLE_LABELS[profile.vehicle_type]}</span>
                                    </div>
                                    {(profile.vehicle_make || profile.vehicle_model) && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Make / Model</span>
                                            <span>{[profile.vehicle_make, profile.vehicle_model].filter(Boolean).join(' ')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Registration</span>
                                        <span className="font-mono uppercase">{profile.vehicle_registration}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Documents */}
                        {profile?.documents && (
                            <section>
                                <SectionHeading
                                    title="Documents"
                                    description={`${profile.documents.length} document${profile.documents.length !== 1 ? 's' : ''} uploaded`}
                                />
                                {profile.documents.length === 0 ? (
                                    <EmptyState
                                        icon={<FileText />}
                                        title="No documents uploaded"
                                        description="The driver hasn't uploaded any documents yet."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {profile.documents.map((doc) => (
                                            <Card key={doc.id}>
                                                <CardContent className="flex items-center justify-between gap-4 py-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <FileText className="size-5 text-muted-foreground shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium">
                                                                {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {doc.original_filename}
                                                                {doc.expires_at && ` · Expires ${formatDate(doc.expires_at)}`}
                                                            </p>
                                                            {doc.rejection_reason && (
                                                                <p className="text-xs text-destructive mt-0.5">
                                                                    Reason: {doc.rejection_reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
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

                        {/* Deliveries */}
                        <section>
                            <SectionHeading
                                title="Recent deliveries"
                                description={`${profile?.deliveries_count ?? 0} total deliveries`}
                            />
                            <DataTable<DriverDelivery>
                                data={profile?.deliveries ?? []}
                                columns={deliveryColumns}
                                rowKey={(row) => row.id}
                                empty={
                                    <EmptyState
                                        icon={<Package />}
                                        title="No deliveries yet"
                                        description="This driver hasn't completed any deliveries."
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
