import * as React from 'react';

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Visual emphasis. `default` is the everyday card; `muted` is for nested
     * sections; `interactive` adds hover affordance for clickable cards.
     */
    surface?: 'default' | 'muted' | 'interactive';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, surface = 'default', ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'rounded-xl border bg-card text-card-foreground shadow-xs',
            surface === 'muted' && 'bg-muted/40',
            surface === 'interactive' &&
                'cursor-pointer transition-shadow hover:border-primary/30 hover:shadow-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className,
        )}
        {...props}
    />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 px-6 pt-6 pb-4', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base leading-tight font-semibold tracking-tight', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 pb-6', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-between gap-2 border-t px-6 py-4', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
