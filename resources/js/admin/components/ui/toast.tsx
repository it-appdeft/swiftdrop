import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import * as React from 'react';

import { useToast, type Toast as ToastItem, type ToastVariant } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
    success: CheckCircle2,
    danger: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    default: Info,
};

// Colored variants render as a solid fill with foreground text + a white icon
// badge (see partner Orders screen). `default` stays a neutral card.
const FILL: Record<ToastVariant, string> = {
    success: 'border-transparent bg-success text-success-foreground',
    danger: 'border-transparent bg-destructive text-destructive-foreground',
    warning: 'border-transparent bg-warning text-warning-foreground',
    info: 'border-transparent bg-info text-info-foreground',
    default: 'border-border bg-card text-foreground',
};

const ICON_TINT: Record<ToastVariant, string> = {
    success: 'text-success',
    danger: 'text-destructive',
    warning: 'text-warning',
    info: 'text-info',
    default: 'text-muted-foreground',
};

interface ToastProps extends ToastItem {
    onDismiss: (id: string) => void;
}

const Toast = React.memo(function Toast({ id, title, description, variant = 'default', action, onDismiss }: ToastProps) {
    const Icon = ICONS[variant] ?? Info;
    const filled = variant !== 'default';

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg [animation:var(--animate-fade-up)]',
                FILL[variant],
            )}
        >
            {filled ? (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white">
                    <Icon className={cn('size-3.5', ICON_TINT[variant])} aria-hidden />
                </span>
            ) : (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                    <Icon className={cn('size-5', ICON_TINT[variant])} aria-hidden />
                </span>
            )}
            <div className="flex-1 space-y-1">
                {title ? <p className="text-sm font-semibold leading-tight">{title}</p> : null}
                {description ? (
                    <p className={cn('text-sm', filled ? 'opacity-90' : 'text-muted-foreground')}>
                        {description}
                    </p>
                ) : null}
                {action ? (
                    <button
                        type="button"
                        onClick={() => {
                            action.onClick();
                            onDismiss(id);
                        }}
                        className={cn(
                            'mt-1 inline-flex text-sm font-medium underline-offset-4 hover:underline',
                            filled ? 'text-current' : 'text-primary',
                        )}
                    >
                        {action.label}
                    </button>
                ) : null}
            </div>
            <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => onDismiss(id)}
                className="-mr-1 -mt-1 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
                <X className="size-4" />
            </button>
        </div>
    );
});

export function Toaster() {
    const { toasts, dismiss } = useToast();

    if (typeof document === 'undefined') return null;

    return (
        <div
            aria-live="assertive"
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4 sm:left-auto sm:right-0 sm:items-end sm:p-6"
        >
            <div className="flex w-full max-w-sm flex-col gap-2">
                {toasts.map((item) => (
                    <Toast key={item.id} {...item} onDismiss={dismiss} />
                ))}
            </div>
        </div>
    );
}

