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
    };
}

export default function PlatformSettingsEdit({ settings }: Props) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        customer_dashboard_radius_miles: String(settings.customer_dashboard_radius_miles),
        customer_dashboard_fallback_limit: String(settings.customer_dashboard_fallback_limit),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/admin/platform-settings', { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform Settings" />

            <PageContainer width="narrow">
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

                    <div className="flex items-center justify-end gap-3">
                        {recentlySuccessful ? (
                            <span className="text-sm text-emerald-600">Saved.</span>
                        ) : null}
                        <Button type="submit" leftIcon={<Save />} loading={processing}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
