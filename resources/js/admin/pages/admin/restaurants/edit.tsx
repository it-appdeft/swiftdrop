import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Restaurant } from '@/types/admin';

interface Props {
    restaurant: Restaurant;
}

export default function RestaurantEdit({ restaurant }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/restaurants' },
        { title: 'Restaurants', href: '/admin/restaurants' },
        { title: restaurant.name, href: `/admin/restaurants/${restaurant.id}` },
        { title: 'Edit', href: `/admin/restaurants/${restaurant.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: restaurant.name,
        description: restaurant.description ?? '',
        phone: restaurant.phone,
        address_line_1: restaurant.address_line_1,
        address_line_2: restaurant.address_line_2 ?? '',
        city: restaurant.city,
        county: restaurant.county ?? '',
        postcode: restaurant.postcode,
        lat: restaurant.lat,
        lng: restaurant.lng,
        cuisine_type: restaurant.cuisine_type ?? '',
        commission_rate: restaurant.commission_rate,
        vat_number: restaurant.vat_number ?? '',
        status: restaurant.status,
        approval_status: restaurant.approval_status,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/restaurants/${restaurant.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${restaurant.name}`} />

            <PageContainer width="narrow">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/admin/restaurants/${restaurant.id}`}><ArrowLeft /></Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title={`Edit ${restaurant.name}`} />
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Restaurant details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Restaurant name" error={errors.name} required>
                                <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            </FormField>
                            <FormField label="Description" error={errors.description} optional>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                            </FormField>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="Cuisine type" error={errors.cuisine_type} optional>
                                    <Input value={data.cuisine_type} onChange={(e) => setData('cuisine_type', e.target.value)} />
                                </FormField>
                                <FormField label="Restaurant phone" error={errors.phone} required>
                                    <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} type="tel" />
                                </FormField>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Address</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Address line 1" error={errors.address_line_1} required>
                                <Input value={data.address_line_1} onChange={(e) => setData('address_line_1', e.target.value)} />
                            </FormField>
                            <FormField label="Address line 2" error={errors.address_line_2} optional>
                                <Input value={data.address_line_2} onChange={(e) => setData('address_line_2', e.target.value)} />
                            </FormField>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="City" error={errors.city} required>
                                    <Input value={data.city} onChange={(e) => setData('city', e.target.value)} />
                                </FormField>
                                <FormField label="County" error={errors.county} optional>
                                    <Input value={data.county} onChange={(e) => setData('county', e.target.value)} />
                                </FormField>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <FormField label="Postcode" error={errors.postcode} required>
                                    <Input
                                        value={data.postcode}
                                        onChange={(e) => setData('postcode', e.target.value.toUpperCase())}
                                        className="uppercase"
                                    />
                                </FormField>
                                <FormField label="Latitude" error={errors.lat} required>
                                    <Input value={data.lat} onChange={(e) => setData('lat', e.target.value)} />
                                </FormField>
                                <FormField label="Longitude" error={errors.lng} required>
                                    <Input value={data.lng} onChange={(e) => setData('lng', e.target.value)} />
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
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                    />
                                </FormField>
                                <FormField label="VAT number" error={errors.vat_number} optional>
                                    <Input value={data.vat_number} onChange={(e) => setData('vat_number', e.target.value)} />
                                </FormField>
                            </div>
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
                                        <SelectItem value="inactive">Inactive</SelectItem>
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
                            <Link href={`/admin/restaurants/${restaurant.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>Save changes</Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
