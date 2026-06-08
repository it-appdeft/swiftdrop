import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/platform-settings' },
    { title: 'Platform Settings', href: '/admin/platform-settings' },
];

interface Props {
    settings: {
        customer_dashboard_radius_miles: number;
        customer_dashboard_fallback_limit: number;
        base_delivery_fee_gbp: number;
        delivery_fee_per_mile_gbp: number;
        free_delivery_threshold_gbp: number;
        order_tax_rate_percent: number;
        delivery_request_timeout_seconds: number;
    };
}

export default function PlatformSettingsEdit({ settings }: Props) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        customer_dashboard_radius_miles: String(settings.customer_dashboard_radius_miles),
        customer_dashboard_fallback_limit: String(settings.customer_dashboard_fallback_limit),
        base_delivery_fee_gbp: String(settings.base_delivery_fee_gbp),
        delivery_fee_per_mile_gbp: String(settings.delivery_fee_per_mile_gbp),
        free_delivery_threshold_gbp: String(settings.free_delivery_threshold_gbp),
        order_tax_rate_percent: String(settings.order_tax_rate_percent),
        delivery_request_timeout_seconds: String(settings.delivery_request_timeout_seconds),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/admin/platform-settings', { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform Settings" />

            <PageContainer width="full">
                <PageHeader
                    eyebrow="Admin"
                    title="Platform Settings"
                    description="Tune platform-wide defaults that drive customer-facing behaviour."
                />

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer dashboard</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                label="Delivery radius (miles)"
                                error={errors.customer_dashboard_radius_miles}
                                hint="Restaurants further than this from a customer's default address are hidden."
                                required
                            >
                                <Input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="200"
                                    value={data.customer_dashboard_radius_miles}
                                    onChange={(e) => setData('customer_dashboard_radius_miles', e.target.value)}
                                />
                            </FormField>

                            <FormField
                                label="Fallback restaurant limit"
                                error={errors.customer_dashboard_fallback_limit}
                                hint="How many of the latest restaurants to show when the customer has no saved address yet."
                                required
                            >
                                <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={data.customer_dashboard_fallback_limit}
                                    onChange={(e) => setData('customer_dashboard_fallback_limit', e.target.value)}
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery &amp; charges</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                label="Base delivery fee (£)"
                                error={errors.base_delivery_fee_gbp}
                                hint="Flat amount added to every delivery before the per-mile charge."
                                required
                            >
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.base_delivery_fee_gbp}
                                    onChange={(e) => setData('base_delivery_fee_gbp', e.target.value)}
                                />
                            </FormField>

                            <FormField
                                label="Delivery fee per mile (£)"
                                error={errors.delivery_fee_per_mile_gbp}
                                hint="Charged per mile between the customer address and the restaurant."
                                required
                            >
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.delivery_fee_per_mile_gbp}
                                    onChange={(e) => setData('delivery_fee_per_mile_gbp', e.target.value)}
                                />
                            </FormField>

                            <FormField
                                label="Free delivery threshold (£)"
                                error={errors.free_delivery_threshold_gbp}
                                hint="Orders with an item subtotal at or above this get free delivery."
                                required
                            >
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1000"
                                    value={data.free_delivery_threshold_gbp}
                                    onChange={(e) => setData('free_delivery_threshold_gbp', e.target.value)}
                                />
                            </FormField>

                            <FormField
                                label="Taxes & charges (%)"
                                error={errors.order_tax_rate_percent}
                                hint="Applied to the item subtotal and shown as 'Taxes & Charges' at checkout."
                                required
                            >
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.order_tax_rate_percent}
                                    onChange={(e) => setData('order_tax_rate_percent', e.target.value)}
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Driver operations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                label="Delivery request timeout (seconds)"
                                error={errors.delivery_request_timeout_seconds}
                                hint="How long a driver has to accept or reject an incoming delivery request before it's offered to the next driver — the countdown shown on the request card."
                                required
                            >
                                <Input
                                    type="number"
                                    min="5"
                                    max="300"
                                    value={data.delivery_request_timeout_seconds}
                                    onChange={(e) => setData('delivery_request_timeout_seconds', e.target.value)}
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        {recentlySuccessful ? <span className="text-sm text-emerald-600">Saved.</span> : null}
                        <Button type="submit" leftIcon={<Save />} loading={processing}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
