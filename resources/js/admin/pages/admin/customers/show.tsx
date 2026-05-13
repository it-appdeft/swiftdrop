import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Mail, MapPin, Package, Phone, ShieldCheck, ShieldOff } from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { SectionHeading } from '@/components/shared/section-heading';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Customer, CustomerOrder } from '@/types/admin';
import { formatDate, formatRelative, initials } from '@/utils/format';

interface Props {
    customer: Customer;
}

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
    active: 'success',
    suspended: 'danger',
    pending_approval: 'warning',
};

const ORDER_STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'secondary'> = {
    placed: 'info',
    accepted: 'info',
    preparing: 'warning',
    ready_for_pickup: 'warning',
    out_for_delivery: 'warning',
    delivered: 'success',
    cancelled: 'danger',
};

const orderColumns: DataTableColumn<CustomerOrder>[] = [
    {
        id: 'uuid',
        header: 'Order ID',
        cell: (row) => <span className="font-mono text-xs">{row.uuid.slice(0, 8)}…</span>,
    },
    {
        id: 'status',
        header: 'Status',
        cell: (row) => (
            <Badge variant={ORDER_STATUS_VARIANT[row.status] ?? 'secondary'}>
                {row.status.replace(/_/g, ' ')}
            </Badge>
        ),
    },
    {
        id: 'total',
        header: 'Total',
        align: 'right',
        cell: (row) => <span className="font-medium tabular-nums">£{Number(row.total).toFixed(2)}</span>,
    },
    {
        id: 'placed_at',
        header: 'Placed',
        align: 'right',
        cell: (row) => <span className="text-sm text-muted-foreground">{formatRelative(row.placed_at ?? row.created_at)}</span>,
    },
];

export default function CustomerShow({ customer }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/customers' },
        { title: 'Customers', href: '/admin/customers' },
        { title: customer.name, href: `/admin/customers/${customer.id}` },
    ];

    const profile = customer.customer_profile;

    const handleStatusToggle = () => {
        const next = customer.status === 'active' ? 'suspended' : 'active';
        router.patch(`/admin/customers/${customer.id}/status`, { status: next });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={customer.name} />

            <PageContainer>
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon-sm" asChild>
                            <Link href="/admin/customers">
                                <ArrowLeft />
                            </Link>
                        </Button>
                        <Avatar className="size-14">
                            <AvatarFallback className="bg-primary-muted text-lg font-semibold text-primary">
                                {initials(customer.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-semibold">{customer.name}</h1>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant={STATUS_VARIANT[customer.status]} dot>
                                    {customer.status.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Joined {formatDate(customer.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" leftIcon={<Edit />} asChild>
                            <Link href={`/admin/customers/${customer.id}/edit`}>Edit</Link>
                        </Button>
                        <Button
                            variant={customer.status === 'active' ? 'destructive' : 'outline'}
                            size="sm"
                            leftIcon={customer.status === 'active' ? <ShieldOff /> : <ShieldCheck />}
                            onClick={handleStatusToggle}
                        >
                            {customer.status === 'active' ? 'Suspend' : 'Activate'}
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
                                    <span className="font-mono">{customer.mobile}</span>
                                </div>
                                {customer.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="size-4 text-muted-foreground shrink-0" />
                                        <span className="truncate">{customer.email}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {profile && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                        Personal Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">First name</span>
                                        <span>{profile.first_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last name</span>
                                        <span>{profile.last_name}</span>
                                    </div>
                                    {profile.date_of_birth && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Date of birth</span>
                                            <span>{formatDate(profile.date_of_birth)}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {profile?.addresses && profile.addresses.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                        Saved Addresses
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {profile.addresses.map((addr) => (
                                        <div key={addr.id} className="flex items-start gap-2 text-sm">
                                            <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium">{addr.label}</p>
                                                <p className="text-muted-foreground">
                                                    {addr.address_line_1}
                                                    {addr.address_line_2 && `, ${addr.address_line_2}`}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {addr.city}{addr.county && `, ${addr.county}`} {addr.postcode}
                                                </p>
                                            </div>
                                            {addr.is_default && (
                                                <Badge variant="soft" className="ml-auto shrink-0">Default</Badge>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right column — orders */}
                    <div className="lg:col-span-2">
                        <SectionHeading
                            title="Recent orders"
                            description={`${customer.orders_count ?? 0} order${customer.orders_count !== 1 ? 's' : ''} total`}
                        />
                        <DataTable<CustomerOrder>
                            data={customer.orders ?? []}
                            columns={orderColumns}
                            rowKey={(row) => row.id}
                            empty={
                                <EmptyState
                                    icon={<Package />}
                                    title="No orders yet"
                                    description="This customer hasn't placed any orders."
                                />
                            }
                        />
                    </div>
                </div>
            </PageContainer>
        </AppLayout>
    );
}
