import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/customers' },
    { title: 'Customers', href: '/admin/customers' },
    { title: 'New customer', href: '/admin/customers/create' },
];

export default function CustomerCreate() {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        mobile: '',
        email: '',
        date_of_birth: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/customers');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Customer" />

            <PageContainer width="narrow">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href="/admin/customers"><ArrowLeft /></Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title="New customer" />
                </div>

                <form onSubmit={submit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="First name" error={errors.first_name} required>
                                    <Input
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        placeholder="Jane"
                                        autoComplete="given-name"
                                    />
                                </FormField>
                                <FormField label="Last name" error={errors.last_name} required>
                                    <Input
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        placeholder="Smith"
                                        autoComplete="family-name"
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
                                    placeholder="jane@example.com"
                                    type="email"
                                />
                            </FormField>

                            <FormField label="Date of birth" error={errors.date_of_birth} optional>
                                <Input
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                    type="date"
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/admin/customers">Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>
                            Create customer
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
