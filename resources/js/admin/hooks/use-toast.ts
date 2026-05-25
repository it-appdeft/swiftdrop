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

const emit = () => {
    for (const listener of listeners) listener(toasts);
};

// Auto-dismiss timing lives in the <Toast> component so it can play an exit
// animation before the item is actually removed here.
const removeToast = (id: string) => {
    toasts = toasts.filter((toast) => toast.id !== id);
    emit();
};

const pushToast = (toast: Omit<Toast, 'id'> & { id?: string }) => {
    const id = toast.id ?? Math.random().toString(36).slice(2);
    const next: Toast = { ...toast, id };
    toasts = [...toasts, next];
    emit();
    return id;
};

export const toast = Object.assign((input: Omit<Toast, 'id'> & { id?: string }) => pushToast(input), {
    success: (description: React.ReactNode, options?: Partial<Omit<Toast, 'description' | 'variant'>>) =>
        pushToast({ ...options, description, variant: 'success' }),
    error: (description: React.ReactNode, options?: Partial<Omit<Toast, 'description' | 'variant'>>) =>
        pushToast({ ...options, description, variant: 'danger' }),
    warning: (description: React.ReactNode, options?: Partial<Omit<Toast, 'description' | 'variant'>>) =>
        pushToast({ ...options, description, variant: 'warning' }),
    info: (description: React.ReactNode, options?: Partial<Omit<Toast, 'description' | 'variant'>>) =>
        pushToast({ ...options, description, variant: 'info' }),
    dismiss: (id: string) => removeToast(id),
});

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
