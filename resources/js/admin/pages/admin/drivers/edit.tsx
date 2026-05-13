import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Driver } from '@/types/admin';

interface Props {
    driver: Driver;
}

export default function DriverEdit({ driver }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/drivers' },
        { title: 'Drivers', href: '/admin/drivers' },
        { title: driver.name, href: `/admin/drivers/${driver.id}` },
        { title: 'Edit', href: `/admin/drivers/${driver.id}/edit` },
    ];

    const profile = driver.driver_profile;

    const { data, setData, put, processing, errors } = useForm({
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        mobile: driver.mobile,
        email: driver.email ?? '',
        vehicle_type: profile?.vehicle_type ?? ('' as 'bicycle' | 'motorcycle' | 'car' | 'van' | ''),
        vehicle_make: profile?.vehicle_make ?? '',
        vehicle_model: profile?.vehicle_model ?? '',
        vehicle_registration: profile?.vehicle_registration ?? '',
        status: driver.status,
        approval_status: profile?.approval_status ?? 'pending',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/drivers/${driver.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${driver.name}`} />

            <PageContainer width="narrow">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/admin/drivers/${driver.id}`}><ArrowLeft /></Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title={`Edit ${driver.name}`} />
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="First name" error={errors.first_name} required>
                                    <Input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                                </FormField>
                                <FormField label="Last name" error={errors.last_name} required>
                                    <Input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                                </FormField>
                            </div>
                            <FormField label="Mobile" error={errors.mobile} required>
                                <Input value={data.mobile} onChange={(e) => setData('mobile', e.target.value)} type="tel" />
                            </FormField>
                            <FormField label="Email" error={errors.email} optional>
                                <Input value={data.email} onChange={(e) => setData('email', e.target.value)} type="email" />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Vehicle details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Vehicle type" error={errors.vehicle_type} required>
                                <Select
                                    value={data.vehicle_type}
                                    onValueChange={(v) => setData('vehicle_type', v as typeof data.vehicle_type)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bicycle">Bicycle</SelectItem>
                                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                        <SelectItem value="car">Car</SelectItem>
                                        <SelectItem value="van">Van</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="Make" error={errors.vehicle_make} optional>
                                    <Input value={data.vehicle_make} onChange={(e) => setData('vehicle_make', e.target.value)} />
                                </FormField>
                                <FormField label="Model" error={errors.vehicle_model} optional>
                                    <Input value={data.vehicle_model} onChange={(e) => setData('vehicle_model', e.target.value)} />
                                </FormField>
                            </div>
                            <FormField label="Registration plate" error={errors.vehicle_registration} required>
                                <Input
                                    value={data.vehicle_registration}
                                    onChange={(e) => setData('vehicle_registration', e.target.value.toUpperCase())}
                                    className="uppercase"
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Account & approval</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Account status" error={errors.status} required>
                                <Select value={data.status} onValueChange={(v) => setData('status', v as typeof data.status)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="pending_approval">Pending approval</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField label="Approval status" error={errors.approval_status} required>
                                <Select
                                    value={data.approval_status}
                                    onValueChange={(v) => setData('approval_status', v as typeof data.approval_status)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormField>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/drivers/${driver.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>Save changes</Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
