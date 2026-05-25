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
    { title: 'Edit coupon', href: '#' },
];

interface Coupon {
    id: number;
    code: string;
    title: string | null;
    description: string | null;
    type: string;
    value: string | number;
    min_order_value: string | number | null;
    max_discount: string | number | null;
    trigger: string;
    max_uses_per_user: number | null;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
}

interface Props {
    coupon: Coupon;
    options: { types: string[]; triggers: string[] };
}

const str = (v: string | number | null | undefined): string => (v === null || v === undefined ? '' : String(v));

export default function CouponEdit({ coupon, options }: Props) {
    const { data, setData, put, processing, errors } = useForm<CouponFormState>({
        code: coupon.code,
        title: coupon.title ?? '',
        description: coupon.description ?? '',
        type: coupon.type,
        value: str(coupon.value),
        min_order_value: str(coupon.min_order_value),
        max_discount: str(coupon.max_discount),
        trigger: coupon.trigger,
        max_uses_per_user: str(coupon.max_uses_per_user),
        valid_from: coupon.valid_from ?? '',
        valid_until: coupon.valid_until ?? '',
        is_active: coupon.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/coupons/${coupon.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${coupon.code}`} />

            <PageContainer width="narrow">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href="/admin/coupons">
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title={`Edit ${coupon.code}`} />
                </div>

                <form onSubmit={submit}>
                    <CouponFields data={data} setData={setData} errors={errors} options={options} />

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/admin/coupons">Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
