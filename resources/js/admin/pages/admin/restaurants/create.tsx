import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/restaurants' },
    { title: 'Restaurants', href: '/admin/restaurants' },
    { title: 'New restaurant', href: '/admin/restaurants/create' },
];

export default function RestaurantCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        email: '',
        mobile: '',
        phone: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        county: '',
        postcode: '',
        lat: '',
        lng: '',
        cuisine_type: '',
        commission_rate: '10.00',
        vat_number: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/restaurants');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Restaurant" />

            <PageContainer width="narrow">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href="/admin/restaurants"><ArrowLeft /></Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title="New restaurant" />
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Restaurant details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Restaurant name" error={errors.name} required>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="The Curry House"
                                />
                            </FormField>
                            <FormField label="Description" error={errors.description} optional>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Authentic Indian cuisine in the heart of the city…"
                                    rows={3}
                                />
                            </FormField>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="Cuisine type" error={errors.cuisine_type} optional>
                                    <Input
                                        value={data.cuisine_type}
                                        onChange={(e) => setData('cuisine_type', e.target.value)}
                                        placeholder="Indian, Italian, Pizza…"
                                    />
                                </FormField>
                                <FormField label="Restaurant phone" error={errors.phone} required>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+441234567890"
                                        type="tel"
                                    />
                                </FormField>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Owner account</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Email" error={errors.email} required hint="Used to log in to the restaurant portal">
                                <Input
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="owner@restaurant.co.uk"
                                    type="email"
                                />
                            </FormField>
                            <FormField label="Mobile" error={errors.mobile} optional hint="UK format: +447XXXXXXXXX">
                                <Input
                                    value={data.mobile}
                                    onChange={(e) => setData('mobile', e.target.value)}
                                    placeholder="+447700000000"
                                    type="tel"
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Address</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Address line 1" error={errors.address_line_1} required>
                                <Input
                                    value={data.address_line_1}
                                    onChange={(e) => setData('address_line_1', e.target.value)}
                                    placeholder="12 High Street"
                                />
                            </FormField>
                            <FormField label="Address line 2" error={errors.address_line_2} optional>
                                <Input
                                    value={data.address_line_2}
                                    onChange={(e) => setData('address_line_2', e.target.value)}
                                    placeholder="Unit 4"
                                />
                            </FormField>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="City" error={errors.city} required>
                                    <Input
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="London"
                                    />
                                </FormField>
                                <FormField label="County" error={errors.county} optional>
                                    <Input
                                        value={data.county}
                                        onChange={(e) => setData('county', e.target.value)}
                                        placeholder="Greater London"
                                    />
                                </FormField>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <FormField label="Postcode" error={errors.postcode} required>
                                    <Input
                                        value={data.postcode}
                                        onChange={(e) => setData('postcode', e.target.value.toUpperCase())}
                                        placeholder="SW1A 1AA"
                                        className="uppercase"
                                    />
                                </FormField>
                                <FormField label="Latitude" error={errors.lat} required>
                                    <Input
                                        value={data.lat}
                                        onChange={(e) => setData('lat', e.target.value)}
                                        placeholder="51.5074"
                                    />
                                </FormField>
                                <FormField label="Longitude" error={errors.lng} required>
                                    <Input
                                        value={data.lng}
                                        onChange={(e) => setData('lng', e.target.value)}
                                        placeholder="-0.1278"
                                    />
                                </FormField>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Business & billing</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="Commission rate (%)" error={errors.commission_rate} required>
                                    <Input
                                        value={data.commission_rate}
                                        onChange={(e) => setData('commission_rate', e.target.value)}
                                        placeholder="10.00"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                    />
                                </FormField>
                                <FormField label="VAT number" error={errors.vat_number} optional>
                                    <Input
                                        value={data.vat_number}
                                        onChange={(e) => setData('vat_number', e.target.value)}
                                        placeholder="GB 123 4567 89"
                                    />
                                </FormField>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/admin/restaurants">Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>Create restaurant</Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
