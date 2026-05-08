import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-3 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                outline: 'border-border text-foreground',
                success: 'border-transparent bg-success-muted text-success',
                warning: 'border-transparent bg-warning-muted text-warning',
                danger: 'border-transparent bg-danger-muted text-danger',
                destructive: 'border-transparent bg-destructive text-destructive-foreground',
                info: 'border-transparent bg-info-muted text-info',
                soft: 'border-transparent bg-primary-muted text-primary',
            },
            tone: {
                solid: '',
                subtle: '',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
    dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props}>
            {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
            {children}
        </div>
    );
}

export { Badge, badgeVariants };
