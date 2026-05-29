import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { CouponFields, type CouponFormState } from './coupon-fields';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/coupons' },
    { title: 'Coupons', href: '/admin/coupons' },
    { title: 'New coupon', href: '/admin/coupons/create' },
];

interface Props {
    options: { types: string[]; triggers: string[] };
}

export default function CouponCreate({ options }: Props) {
    const { data, setData, post, processing, errors } = useForm<CouponFormState>({
        code: '',
        title: '',
        description: '',
        type: 'flat',
        value: '',
        min_order_value: '',
        max_discount: '',
        trigger: 'all',
        max_uses_per_user: '',
        valid_from: '',
        valid_until: '',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/coupons');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Coupon" />

            <PageContainer width="narrow">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href="/admin/coupons">
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title="New coupon" />
                </div>

                <form onSubmit={submit}>
                    <CouponFields data={data} setData={setData} errors={errors} options={options} />

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/admin/coupons">Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>
                            Create coupon
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
