import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Wand2 } from 'lucide-react';

/** Random, readable coupon code (no easily-confused characters). */
function generateCouponCode(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

export interface CouponFormState {
    code: string;
    title: string;
    description: string;
    type: string;
    value: string;
    min_order_value: string;
    max_discount: string;
    trigger: string;
    max_uses_per_user: string;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    [key: string]: string | boolean;
}

export const TYPE_LABELS: Record<string, string> = {
    flat: 'Flat amount off',
    percentage: 'Percentage off',
    free_delivery: 'Free delivery',
};

export const TRIGGER_LABELS: Record<string, string> = {
    all: 'All customers',
    welcome: 'Welcome (first N orders)',
    weekend: 'Weekend only (Sat/Sun)',
};

const selectCls =
    'flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2';

interface Props {
    data: CouponFormState;
    setData: (key: keyof CouponFormState, value: string | boolean) => void;
    errors: Partial<Record<keyof CouponFormState, string>>;
    options: { types: string[]; triggers: string[] };
}

/** Shared coupon form body for the admin create + edit pages. */
export function CouponFields({ data, setData, errors, options }: Props) {
    const isPercentage = data.type === 'percentage';
    const isFreeDelivery = data.type === 'free_delivery';
    const valueLabel = isPercentage ? 'Discount (%)' : 'Discount amount (£)';

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Coupon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField label="Code" error={errors.code} required hint="Type a code or generate one. Letters, numbers, - and _ only. No spaces.">
                        <div className="flex gap-2">
                            <Input
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.replace(/\s+/g, '').toUpperCase())}
                                onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
                                placeholder="WEEKEND20"
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" leftIcon={<Wand2 />} onClick={() => setData('code', generateCouponCode())}>
                                Generate
                            </Button>
                        </div>
                    </FormField>

                    <FormField label="Title" error={errors.title} optional hint="Display name on the coupon card.">
                        <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Weekend Special" />
                    </FormField>

                    <FormField label="Description" error={errors.description} optional>
                        <Input
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Get £10 OFF on all orders above £45 during the weekend."
                        />
                    </FormField>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Discount</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField label="Type" error={errors.type} required>
                        <select value={data.type} onChange={(e) => setData('type', e.target.value)} className={selectCls}>
                            {options.types.map((t) => (
                                <option key={t} value={t}>
                                    {TYPE_LABELS[t] ?? t}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    {!isFreeDelivery ? (
                        <FormField label={valueLabel} error={errors.value} required>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={isPercentage ? '100' : undefined}
                                value={data.value}
                                onChange={(e) => setData('value', e.target.value)}
                            />
                        </FormField>
                    ) : null}

                    {isPercentage ? (
                        <FormField label="Max discount (£)" error={errors.max_discount} optional hint="Caps the percentage discount.">
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.max_discount}
                                onChange={(e) => setData('max_discount', e.target.value)}
                            />
                        </FormField>
                    ) : null}

                    <FormField label="Minimum order (£)" error={errors.min_order_value} optional hint="Item subtotal must reach this to apply.">
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.min_order_value}
                            onChange={(e) => setData('min_order_value', e.target.value)}
                        />
                    </FormField>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField label="Trigger" error={errors.trigger} required>
                        <select value={data.trigger} onChange={(e) => setData('trigger', e.target.value)} className={selectCls}>
                            {options.triggers.map((t) => (
                                <option key={t} value={t}>
                                    {TRIGGER_LABELS[t] ?? t}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField
                        label={data.trigger === 'welcome' ? 'Number of first orders' : 'Max uses per customer'}
                        error={errors.max_uses_per_user}
                        optional
                        hint={
                            data.trigger === 'welcome'
                                ? 'For a Welcome coupon, how many of the customer’s first orders it applies to (default 3).'
                                : 'Leave blank for unlimited uses per customer.'
                        }
                    >
                        <Input
                            type="number"
                            min="1"
                            value={data.max_uses_per_user}
                            onChange={(e) => setData('max_uses_per_user', e.target.value)}
                            placeholder={data.trigger === 'welcome' ? '3' : ''}
                        />
                    </FormField>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Valid from" error={errors.valid_from} optional>
                            <Input type="date" value={data.valid_from} onChange={(e) => setData('valid_from', e.target.value)} />
                        </FormField>
                        <FormField label="Valid until" error={errors.valid_until} optional>
                            <Input type="date" value={data.valid_until} onChange={(e) => setData('valid_until', e.target.value)} />
                        </FormField>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                        <Checkbox checked={data.is_active} onCheckedChange={(v) => setData('is_active', v === true)} />
                        Active (visible &amp; usable by customers)
                    </label>
                </CardContent>
            </Card>
        </div>
    );
}
