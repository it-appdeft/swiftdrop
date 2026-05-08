import * as React from 'react';

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface Toast {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: ToastVariant;
    /** Lifetime in milliseconds. Defaults to 5000. Set to 0 to keep until dismissed. */
    duration?: number;
    action?: { label: string; onClick: () => void };
}

type Listener = (toasts: Toast[]) => void;

const listeners = new Set<Listener>();
let toasts: Toast[] = [];
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const emit = () => {
    for (const listener of listeners) listener(toasts);
};

const removeToast = (id: string) => {
    toasts = toasts.filter((toast) => toast.id !== id);
    const timer = timers.get(id);
    if (timer) {
        clearTimeout(timer);
        timers.delete(id);
    }
    emit();
};

const scheduleDismiss = (toast: Toast) => {
    const duration = toast.duration ?? 5000;
    if (duration === 0) return;
    timers.set(
        toast.id,
        setTimeout(() => removeToast(toast.id), duration),
    );
};

const pushToast = (toast: Omit<Toast, 'id'> & { id?: string }) => {
    const id = toast.id ?? Math.random().toString(36).slice(2);
    const next: Toast = { ...toast, id };
    toasts = [...toasts, next];
    scheduleDismiss(next);
    emit();
    return id;
};

export const toast = Object.assign(
    (input: Omit<Toast, 'id'> & { id?: string }) => pushToast(input),
    {
        success: (description: React.ReactNode, options?: Partial<Omit<Toast, 'description' | 'variant'>>) =>
            pushToast({ ...options, description, variant: 'success' }),
        error: (description: React.ReactNode, options?: Partial<Omit<Toast, 'description' | 'variant'>>) =>
            pushToast({ ...options, description, variant: 'danger' }),
        warning: (description: React.ReactNode, options?: Partial<Omit<Toast, 'description' | 'variant'>>) =>
            pushToast({ ...options, description, variant: 'warning' }),
        info: (description: React.ReactNode, options?: Partial<Omit<Toast, 'description' | 'variant'>>) =>
            pushToast({ ...options, description, variant: 'info' }),
        dismiss: (id: string) => removeToast(id),
    },
);

export function useToast() {
    const [items, setItems] = React.useState<Toast[]>(toasts);

    React.useEffect(() => {
        const listener: Listener = (next) => setItems(next);
        listeners.add(listener);
        listener(toasts);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    return { toasts: items, toast, dismiss: removeToast };
}
