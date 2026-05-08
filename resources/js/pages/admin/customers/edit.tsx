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
import type { Customer } from '@/types/admin';

interface Props {
    customer: Customer;
}

export default function CustomerEdit({ customer }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/customers' },
        { title: 'Customers', href: '/admin/customers' },
        { title: customer.name, href: `/admin/customers/${customer.id}` },
        { title: 'Edit', href: `/admin/customers/${customer.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        first_name: customer.customer_profile?.first_name ?? '',
        last_name: customer.customer_profile?.last_name ?? '',
        mobile: customer.mobile,
        email: customer.email ?? '',
        date_of_birth: customer.customer_profile?.date_of_birth ?? '',
        status: customer.status,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/customers/${customer.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${customer.name}`} />

            <PageContainer width="narrow">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/admin/customers/${customer.id}`}><ArrowLeft /></Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title={`Edit ${customer.name}`} />
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
                                    />
                                </FormField>
                                <FormField label="Last name" error={errors.last_name} required>
                                    <Input
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                    />
                                </FormField>
                            </div>

                            <FormField label="Date of birth" error={errors.date_of_birth} optional>
                                <Input
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                    type="date"
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Contact & account</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Mobile" error={errors.mobile} required>
                                <Input
                                    value={data.mobile}
                                    onChange={(e) => setData('mobile', e.target.value)}
                                    type="tel"
                                />
                            </FormField>

                            <FormField label="Email" error={errors.email} optional>
                                <Input
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    type="email"
                                />
                            </FormField>

                            <FormField label="Status" error={errors.status} required>
                                <Select value={data.status} onValueChange={(v) => setData('status', v as typeof data.status)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="pending_approval">Pending approval</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormField>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/customers/${customer.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>Save changes</Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
