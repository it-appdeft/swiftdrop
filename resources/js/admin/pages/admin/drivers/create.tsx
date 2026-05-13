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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/drivers' },
    { title: 'Drivers', href: '/admin/drivers' },
    { title: 'New driver', href: '/admin/drivers/create' },
];

export default function DriverCreate() {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        mobile: '',
        email: '',
        vehicle_type: '' as 'bicycle' | 'motorcycle' | 'car' | 'van' | '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_registration: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/drivers');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Driver" />

            <PageContainer width="narrow">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href="/admin/drivers"><ArrowLeft /></Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title="New driver" />
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="First name" error={errors.first_name} required>
                                    <Input
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        placeholder="John"
                                    />
                                </FormField>
                                <FormField label="Last name" error={errors.last_name} required>
                                    <Input
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        placeholder="Smith"
                                    />
                                </FormField>
                            </div>
                            <FormField label="Mobile" error={errors.mobile} required hint="UK format: +447XXXXXXXXX">
                                <Input
                                    value={data.mobile}
                                    onChange={(e) => setData('mobile', e.target.value)}
                                    placeholder="+447700000000"
                                    type="tel"
                                />
                            </FormField>
                            <FormField label="Email" error={errors.email} optional>
                                <Input
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="john@example.com"
                                    type="email"
                                />
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
                                    <SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
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
                                    <Input
                                        value={data.vehicle_make}
                                        onChange={(e) => setData('vehicle_make', e.target.value)}
                                        placeholder="Ford"
                                    />
                                </FormField>
                                <FormField label="Model" error={errors.vehicle_model} optional>
                                    <Input
                                        value={data.vehicle_model}
                                        onChange={(e) => setData('vehicle_model', e.target.value)}
                                        placeholder="Transit"
                                    />
                                </FormField>
                            </div>

                            <FormField label="Registration plate" error={errors.vehicle_registration} required hint="UK registration: AB12 CDE">
                                <Input
                                    value={data.vehicle_registration}
                                    onChange={(e) => setData('vehicle_registration', e.target.value.toUpperCase())}
                                    placeholder="AB12 CDE"
                                    className="uppercase"
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/admin/drivers">Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>Create driver</Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
