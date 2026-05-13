import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import * as React from 'react';

import { Card } from '@/components/ui/card';
import { ease, spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type StatCardAccent = 'default' | 'blue' | 'green' | 'orange' | 'red' | 'purple';

const ACCENT_ICON: Record<StatCardAccent, string> = {
    default: 'bg-primary/10 text-primary',
    blue:   'bg-blue-500/10 text-blue-500 dark:text-blue-400',
    green:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    orange: 'bg-orange-500/10 text-orange-500 dark:text-orange-400',
    red:    'bg-red-500/10 text-red-500 dark:text-red-400',
    purple: 'bg-purple-500/10 text-purple-500 dark:text-purple-400',
};

const ACCENT_BORDER: Record<StatCardAccent, string> = {
    default: '',
    blue:   'border-blue-500/20',
    green:  'border-emerald-500/20',
    orange: 'border-orange-500/20',
    red:    'border-red-500/20',
    purple: 'border-purple-500/20',
};

export interface StatCardProps {
    label: string;
    value: React.ReactNode;
    helper?: React.ReactNode;
    /** Trend in percent (e.g. 12.4 = +12.4%). Negative values render as down trend. */
    trend?: number;
    icon?: React.ReactNode;
    /** Index in a sibling group — controls stagger delay. */
    index?: number;
    accent?: StatCardAccent;
    className?: string;
}

export function StatCard({ label, value, helper, trend, icon, index = 0, accent = 'default', className }: StatCardProps) {
    const isPositive = (trend ?? 0) >= 0;
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: index * 0.07 }}
            whileHover={{ y: -3, transition: spring }}
            className="h-full"
        >
            <Card className={cn('relative overflow-hidden p-5 h-full', ACCENT_BORDER[accent], className)}>
                {/* subtle top accent strip */}
                {accent !== 'default' && (
                    <div
                        className={cn(
                            'absolute inset-x-0 top-0 h-[2px]',
                            accent === 'blue'   && 'bg-gradient-to-r from-blue-500/50 to-blue-400/50',
                            accent === 'green'  && 'bg-gradient-to-r from-emerald-500/50 to-emerald-400/50',
                            accent === 'orange' && 'bg-gradient-to-r from-orange-500/50 to-orange-400/50',
                            accent === 'red'    && 'bg-gradient-to-r from-red-500/50 to-red-400/50',
                            accent === 'purple' && 'bg-gradient-to-r from-purple-500/50 to-purple-400/50',
                        )}
                    />
                )}
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
                        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
                    </div>
                    {icon ? (
                        <motion.span
                            className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5', ACCENT_ICON[accent])}
                            initial={{ scale: 0, rotate: -12 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: index * 0.07 + 0.15 }}
                        >
                            {icon}
                        </motion.span>
                    ) : null}
                </div>
                {(helper || trend !== undefined) && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        {trend !== undefined ? (
                            <span
                                className={cn(
                                    'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
                                    isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400',
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
        </motion.div>
    );
}
