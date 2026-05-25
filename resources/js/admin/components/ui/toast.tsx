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

// Light tinted background with dark, colour-matched text per result.
const VARIANT_STYLES: Record<ToastVariant, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900 [&_[data-icon]]:text-emerald-600',
    danger: 'border-rose-200 bg-rose-50 text-rose-900 [&_[data-icon]]:text-rose-600',
    warning: 'border-amber-200 bg-amber-50 text-amber-900 [&_[data-icon]]:text-amber-600',
    info: 'border-sky-200 bg-sky-50 text-sky-900 [&_[data-icon]]:text-sky-600',
    default: 'border-zinc-200 bg-white text-zinc-900 [&_[data-icon]]:text-zinc-500',
};

interface ToastProps extends ToastItem {
    onDismiss: (id: string) => void;
}

/** Time the slide-out animation runs before the toast is removed. */
const EXIT_MS = 250;

const Toast = React.memo(function Toast({ id, title, description, variant = 'default', duration = 5000, action, onDismiss }: ToastProps) {
    const Icon = ICONS[variant] ?? Info;
    const [leaving, setLeaving] = React.useState(false);

    const close = React.useCallback(() => {
        setLeaving(true);
        window.setTimeout(() => onDismiss(id), EXIT_MS);
    }, [id, onDismiss]);

    // Auto-dismiss after `duration` (0 = sticky), driving the exit animation.
    React.useEffect(() => {
        if (duration === 0) return;
        const t = window.setTimeout(close, duration);
        return () => window.clearTimeout(t);
    }, [duration, close]);

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg duration-300',
                leaving ? 'animate-out fade-out slide-out-to-right-full' : 'animate-in fade-in slide-in-from-right-full',
                VARIANT_STYLES[variant],
            )}
        >
            <span data-icon className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                <Icon className="size-5" aria-hidden />
            </span>
            <div className="flex-1 space-y-1">
                {title ? <p className="text-sm leading-tight font-semibold">{title}</p> : null}
                {description ? <p className="text-sm opacity-90">{description}</p> : null}
                {action ? (
                    <button
                        type="button"
                        onClick={() => {
                            action.onClick();
                            close();
                        }}
                        className="text-primary mt-1 inline-flex text-sm font-medium underline-offset-4 hover:underline"
                    >
                        {action.label}
                    </button>
                ) : null}
            </div>
            <button
                type="button"
                aria-label="Dismiss notification"
                onClick={close}
                className="text-muted-foreground focus-visible:ring-ring -mt-1 -mr-1 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:outline-hidden"
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
        <div aria-live="assertive" className="pointer-events-none fixed top-0 right-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6">
            <div className="flex w-full max-w-sm flex-col gap-2">
                {toasts.map((item) => (
                    <Toast key={item.id} {...item} onDismiss={dismiss} />
                ))}
            </div>
        </div>
    );
}
