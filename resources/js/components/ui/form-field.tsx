import * as React from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
    /** ID applied to the form control. Required when wrapping non-Input children. */
    id?: string;
    label?: React.ReactNode;
    hint?: React.ReactNode;
    error?: React.ReactNode;
    required?: boolean;
    optional?: boolean;
    className?: string;
    children: React.ReactElement;
}

/**
 * FormField is the canonical wrapper for any labeled control on a form.
 * It composes <Label>, the control, an optional hint, and an inline error.
 * Pairing controls through FormField (rather than ad-hoc divs) keeps spacing,
 * accessibility wiring (aria-describedby, aria-invalid), and error UI uniform
 * across the entire app.
 *
 * @example
 * <FormField label="Email" error={errors.email} required>
 *   <Input type="email" value={data.email} onChange={...} />
 * </FormField>
 */
export function FormField({ id, label, hint, error, required, optional, className, children }: FormFieldProps) {
    const generatedId = React.useId();
    const controlId = id ?? (children.props as { id?: string }).id ?? generatedId;
    const hintId = hint ? `${controlId}-hint` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;

    const describedBy =
        [(children.props as { 'aria-describedby'?: string })['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;

    const control = React.cloneElement(children, {
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : (children.props as { 'aria-invalid'?: boolean })['aria-invalid'],
        invalid: error ? true : (children.props as { invalid?: boolean }).invalid,
    } as Partial<React.ComponentProps<'input'>> & { invalid?: boolean });

    return (
        <div className={cn('grid gap-1.5', className)}>
            {label ? (
                <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={controlId} className="text-sm font-medium">
                        {label}
                        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
                    </Label>
                    {optional ? <span className="text-xs text-muted-foreground">Optional</span> : null}
                </div>
            ) : null}
            {control}
            {hint && !error ? (
                <p id={hintId} className="text-xs text-muted-foreground">
                    {hint}
                </p>
            ) : null}
            {error ? (
                <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
