import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin text-muted-foreground', {
    variants: {
        size: {
            xs: 'size-3',
            sm: 'size-4',
            md: 'size-5',
            lg: 'size-6',
            xl: 'size-8',
        },
        tone: {
            default: 'text-muted-foreground',
            primary: 'text-primary',
            inverse: 'text-primary-foreground',
            current: 'text-current',
        },
    },
    defaultVariants: {
        size: 'md',
        tone: 'default',
    },
});

export interface SpinnerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>, VariantProps<typeof spinnerVariants> {
    label?: string;
}

export function Spinner({ size, tone, className, label = 'Loading', ...props }: SpinnerProps) {
    return (
        <span role="status" aria-live="polite" className={cn('inline-flex items-center justify-center', className)} {...props}>
            <Loader2 className={cn(spinnerVariants({ size, tone }))} aria-hidden />
            <span className="sr-only">{label}</span>
        </span>
    );
}

Spinner.displayName = 'Spinner';
