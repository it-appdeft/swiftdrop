import { router } from '@inertiajs/react';
import { Bike, ChevronRight, ChevronUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useActiveOrders, type ActiveOrder } from '../context/active-orders-context';

const STATUS_CAPTION: Record<string, string> = {
    accepted: 'Preparing your order',
    preparing: 'Preparing your order',
    ready_for_pickup: 'Assigning a driver',
    out_for_delivery: 'Your order is on the way',
};

/**
 * Persistent "active order" bar — mounted once, globally, in app.tsx (not on
 * a per-page basis) so it can float over any customer screen. Reads from
 * {@link useActiveOrders} (polled once, globally — see active-orders-context)
 * rather than piggybacking on Inertia page props, since it has to survive
 * every navigation without every page having to remember to pass it down.
 */
export function ActiveOrderBar() {
    const [pathname, setPathname] = useState(() => (typeof window === 'undefined' ? '' : window.location.pathname));
    const orders = useActiveOrders();
    const [expanded, setExpanded] = useState(false);

    // router.on(...) is imperative (no React context needed for this part),
    // so this works even though the bar is rendered as a sibling of <App>,
    // outside Inertia's own page tree — see app.tsx.
    useEffect(() => {
        return router.on('navigate', () => setPathname(window.location.pathname));
    }, []);

    const isCustomerArea = pathname.startsWith('/customer');
    // The order's own tracking page already shows this in full — no need to
    // float a duplicate summary bar over it.
    const onOwnTrackingPage = /^\/customer\/orders\/[^/]+\/?$/.test(pathname);

    if (!isCustomerArea || onOwnTrackingPage || orders.length === 0) return null;

    const [primary, ...rest] = orders;

    const goTo = (uuid: string) => router.visit(`/customer/orders/${uuid}`);

    return (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
            <div className="w-full max-w-md">
                {expanded && rest.length > 0 && (
                    <div className="border-border bg-background mb-2 divide-y divide-zinc-100 overflow-hidden rounded-2xl border shadow-lg">
                        {rest.map((order) => (
                            <OrderRow key={order.uuid} order={order} onClick={() => goTo(order.uuid)} compact />
                        ))}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-900/20">
                    <button type="button" onClick={() => goTo(primary.uuid)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <Bike className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{primary.restaurant_name}</span>
                            <span className="block truncate text-xs text-white/80">
                                {primary.is_accepted ? (STATUS_CAPTION[primary.status] ?? 'Order in progress') : 'Waiting for restaurant to accept'}
                            </span>
                        </span>
                        {primary.is_accepted && primary.eta_minutes !== null ? (
                            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-700">
                                {primary.eta_minutes} min
                            </span>
                        ) : (
                            <Loader2 className="size-5 shrink-0 animate-spin text-white/80" />
                        )}
                        <ChevronRight className="size-4 shrink-0 text-white/70" />
                    </button>

                    {rest.length > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded((v) => !v);
                            }}
                            className="flex w-full items-center justify-center gap-1 border-t border-white/15 bg-white/10 py-1.5 text-xs font-medium text-white/90 hover:bg-white/15"
                        >
                            {expanded ? 'Hide' : `+${rest.length} more order${rest.length > 1 ? 's' : ''}`}
                            <ChevronUp className={`size-3.5 transition-transform ${expanded ? '' : 'rotate-180'}`} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderRow({ order, onClick, compact }: { order: ActiveOrder; onClick: () => void; compact?: boolean }) {
    return (
        <button type="button" onClick={onClick} className="hover:bg-muted/50 flex w-full items-center gap-3 px-4 py-2.5 text-left transition">
            <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full">
                <Bike className="text-muted-foreground size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className={`block truncate font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{order.restaurant_name}</span>
                <span className="text-muted-foreground block truncate text-[11px]">
                    {order.is_accepted ? (STATUS_CAPTION[order.status] ?? 'Order in progress') : 'Waiting for restaurant to accept'}
                </span>
            </span>
            {order.is_accepted && order.eta_minutes !== null && (
                <span className="text-muted-foreground shrink-0 text-xs font-semibold">{order.eta_minutes} min</span>
            )}
        </button>
    );
}
