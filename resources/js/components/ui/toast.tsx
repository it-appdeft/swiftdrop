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

const VARIANT_STYLES: Record<ToastVariant, string> = {
    success: 'border-success/30 bg-card text-foreground [&_[data-icon]]:text-success',
    danger: 'border-destructive/30 bg-card text-foreground [&_[data-icon]]:text-destructive',
    warning: 'border-warning/30 bg-card text-foreground [&_[data-icon]]:text-warning',
    info: 'border-info/30 bg-card text-foreground [&_[data-icon]]:text-info',
    default: 'border-border bg-card text-foreground [&_[data-icon]]:text-muted-foreground',
};

interface ToastProps extends ToastItem {
    onDismiss: (id: string) => void;
}

const Toast = React.memo(function Toast({ id, title, description, variant = 'default', action, onDismiss }: ToastProps) {
    const Icon = ICONS[variant] ?? Info;

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg [animation:var(--animate-fade-up)]',
                VARIANT_STYLES[variant],
            )}
        >
            <span data-icon className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                <Icon className="size-5" aria-hidden />
            </span>
            <div className="flex-1 space-y-1">
                {title ? <p className="text-sm font-semibold leading-tight">{title}</p> : null}
                {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
                {action ? (
                    <button
                        type="button"
                        onClick={() => {
                            action.onClick();
                            onDismiss(id);
                        }}
                        className="mt-1 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                        {action.label}
                    </button>
                ) : null}
            </div>
            <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => onDismiss(id)}
                className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
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
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4 sm:bottom-0 sm:left-auto sm:right-0 sm:top-auto sm:items-end sm:p-6"
        >
            <div className="flex w-full max-w-sm flex-col gap-2">
                {toasts.map((item) => (
                    <Toast key={item.id} {...item} onDismiss={dismiss} />
                ))}
            </div>
        </div>
    );
}

