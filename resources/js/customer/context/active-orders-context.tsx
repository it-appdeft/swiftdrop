import { router } from '@inertiajs/react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ─── Server-supplied shape (see ActiveOrderService::payload()) ────────────────

export interface ActiveOrder {
    uuid: string;
    status: string;
    is_accepted: boolean;
    restaurant_name: string;
    eta_minutes: number | null;
    placed_at: string | null;
}

const POLL_INTERVAL_MS = 15000;

const ActiveOrdersContext = createContext<ActiveOrder[]>([]);

/**
 * Polls the customer's in-progress orders once, globally (the same JSON
 * endpoint the mobile app uses via ActiveOrderService), and makes the result
 * available to any descendant. Mounted once in app.tsx wrapping both <App>
 * and the floating <ActiveOrderBar> — page-level UI that also needs to know
 * whether that bar is on screen (e.g. the restaurant page's "View Cart" bar,
 * which has to make room for it instead of being covered by it) reads the
 * same {@link useActiveOrders} hook instead of polling a second time.
 */
export function ActiveOrdersProvider({ children }: { children: ReactNode }) {
    const [pathname, setPathname] = useState(() => (typeof window === 'undefined' ? '' : window.location.pathname));
    const [orders, setOrders] = useState<ActiveOrder[]>([]);

    useEffect(() => {
        return router.on('navigate', () => setPathname(window.location.pathname));
    }, []);

    const isCustomerArea = pathname.startsWith('/customer');

    useEffect(() => {
        if (!isCustomerArea) {
            setOrders([]);
            return;
        }

        let cancelled = false;
        const fetchActive = async () => {
            try {
                const res = await fetch('/customer/orders/active', {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                if (!res.ok || cancelled) return;
                const json = (await res.json()) as { orders: ActiveOrder[] };
                if (!cancelled) setOrders(json.orders);
            } catch {
                // A missed poll isn't worth surfacing — the next tick retries.
            }
        };

        fetchActive();
        const id = window.setInterval(fetchActive, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [isCustomerArea]);

    return <ActiveOrdersContext.Provider value={orders}>{children}</ActiveOrdersContext.Provider>;
}

export function useActiveOrders(): ActiveOrder[] {
    return useContext(ActiveOrdersContext);
}
