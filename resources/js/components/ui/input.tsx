import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const inputVariants = cva(
    'flex w-full rounded-md border bg-background text-foreground ring-offset-background transition-shadow file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    {
        variants: {
            size: {
                sm: 'h-8 px-2.5 py-1 text-sm',
                default: 'h-10 px-3 py-2 text-base',
                lg: 'h-11 px-4 text-base',
            },
            invalid: {
                true: 'border-destructive focus-visible:ring-destructive/40',
                false: 'border-input',
            },
        },
        defaultVariants: {
            size: 'default',
            invalid: false,
        },
    },
);

type NativeInputProps = Omit<React.ComponentProps<'input'>, 'size'>;

export interface InputProps extends NativeInputProps, VariantProps<typeof inputVariants> {
    leftAdornment?: React.ReactNode;
    rightAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', size, invalid, leftAdornment, rightAdornment, ...props }, ref) => {
        if (leftAdornment || rightAdornment) {
            return (
                <div
                    className={cn(
                        'flex w-full items-center rounded-md border bg-background ring-offset-background transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                        invalid ? 'border-destructive focus-within:ring-destructive/40' : 'border-input',
                        size === 'sm' && 'h-8',
                        size === 'lg' && 'h-11',
                        (!size || size === 'default') && 'h-10',
                        className,
                    )}
                >
                    {leftAdornment && (
                        <span className="pointer-events-none flex items-center pl-3 text-muted-foreground [&_svg]:size-4">
                            {leftAdornment}
                        </span>
                    )}
                    <input
                        ref={ref}
                        type={type}
                        className={cn(
                            'h-full w-full bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
                            leftAdornment && 'pl-2',
                            rightAdornment && 'pr-2',
                        )}
                        {...props}
                    />
                    {rightAdornment && (
                        <span className="flex items-center pr-3 text-muted-foreground [&_svg]:size-4">
                            {rightAdornment}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <input
                ref={ref}
                type={type}
                aria-invalid={invalid || undefined}
                className={cn(inputVariants({ size, invalid }), className)}
                {...props}
            />
        );
    },
);

Input.displayName = 'Input';

export { Input, inputVariants };
