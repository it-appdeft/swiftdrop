import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import * as React from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
    label: string;
    value: React.ReactNode;
    helper?: React.ReactNode;
    /** Trend in percent (e.g. 12.4 = +12.4%). Negative values render as down trend. */
    trend?: number;
    icon?: React.ReactNode;
    className?: string;
}

/**
 * KPI tile used by dashboards. Built on Card so visual treatment stays
 * consistent — only the data and trend differ.
 */
export function StatCard({ label, value, helper, trend, icon, className }: StatCardProps) {
    const isPositive = (trend ?? 0) >= 0;
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
        <Card className={cn('p-5', className)}>
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
                </div>
                {icon ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary [&_svg]:size-5">
                        {icon}
                    </span>
                ) : null}
            </div>
            {(helper || trend !== undefined) && (
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    {trend !== undefined ? (
                        <span
                            className={cn(
                                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
                                isPositive ? 'bg-success-muted text-success' : 'bg-danger-muted text-danger',
                            )}
                        >
                            <TrendIcon className="size-3" aria-hidden />
                            {Math.abs(trend).toFixed(1)}%
                        </span>
                    ) : null}
                    {helper}
                </div>
            )}
        </Card>
    );
}
