import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-[background,box-shadow,transform,color] duration-150 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:scale-[.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                primary:
                    'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm',
                default:
                    'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                outline:
                    'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
                success:
                    'bg-success text-success-foreground shadow-xs hover:bg-success/90',
                soft: 'bg-primary-muted text-primary hover:bg-primary-muted/70',
            },
            size: {
                xs: 'h-7 px-2.5 text-xs',
                sm: 'h-8 px-3 text-xs',
                default: 'h-10 px-4 text-sm',
                lg: 'h-11 px-6 text-sm',
                xl: 'h-12 px-7 text-base',
                icon: 'h-10 w-10',
                'icon-sm': 'h-8 w-8',
            },
            block: {
                true: 'w-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
            block: false,
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        { className, variant, size, block, asChild = false, loading = false, leftIcon, rightIcon, children, disabled, ...props },
        ref,
    ) => {
        const Comp = asChild ? Slot : 'button';
        const isDisabled = disabled || loading;

        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size, block, className }))}
                disabled={isDisabled}
                aria-busy={loading || undefined}
                {...props}
            >
                {asChild ? children : (
                    <>
                        {loading ? <Loader2 className="animate-spin" aria-hidden /> : leftIcon}
                        {children}
                        {!loading && rightIcon}
                    </>
                )}
            </Comp>
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
