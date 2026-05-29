import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Head, Link, router } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag, Trash2, UtensilsCrossed } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SiteFooter } from '../../web/components/site-footer';
import { CustomerHeader } from '../components/customer-header';

interface CartModifier {
    group_id: number | null;
    group_name: string;
    option_id: number | null;
    option_name: string;
    price_delta: number;
}

interface CartLine {
    id: number;
    menu_item_id: number;
    name: string | null;
    is_veg: boolean;
    image_url: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
    modifiers: CartModifier[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ItemsMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
    next_page_url?: string | null;
    prev_page_url?: string | null;
    links?: PaginationLink[];
}

interface Cart {
    id: number | null;
    restaurant_id: number | null;
    restaurant: { id: number; name: string; logo_url: string | null } | null;
    items: CartLine[];
    pagination: ItemsMeta;
    item_count: number;
    line_count: number;
    subtotal: number;
}

interface Props {
    cart: Cart;
}

export default function CustomerCart({ cart }: Props) {
    const [pendingDelete, setPendingDelete] = useState<CartLine | null>(null);

    // Initial page comes from props; subsequent pages are fetched as JSON and
    // appended. Reset whenever the underlying Inertia render changes (after a
    // mutation, for example).
    const [items, setItems] = useState<CartLine[]>(cart.items);
    const [meta, setMeta] = useState<ItemsMeta>(cart.pagination);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setItems(cart.items);
        setMeta(cart.pagination);
    }, [cart.items, cart.pagination]);

    const hasMore = meta.current_page < meta.last_page;

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const res = await fetch(`/customer/cart?page=${meta.current_page + 1}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as Cart;
            setItems((prev) => {
                const seen = new Set(prev.map((l) => l.id));
                return [...prev, ...json.items.filter((l) => !seen.has(l.id))];
            });
            setMeta(json.pagination);
        } catch {
            toast.error('Could not load more items.');
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, meta.current_page]);

    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;
        const el = sentinelRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) loadMore();
            },
            { rootMargin: '300px 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    const updateLine = (itemId: number, quantity: number) => {
        router.put(`/customer/cart/items/${itemId}`, { quantity }, { preserveScroll: true, preserveState: true });
    };

    const confirmRemove = () => {
        if (!pendingDelete) return;
        router.delete(`/customer/cart/items/${pendingDelete.id}`, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setPendingDelete(null),
        });
    };

    const clearCart = () => {
        router.delete('/customer/cart', { preserveScroll: true, preserveState: true });
    };

    const empty = cart.item_count === 0;

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <Head title="Your Cart" />
            <CustomerHeader />

            <main className="mx-auto w-full max-w-[800px] flex-1 px-4 py-8 sm:px-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-foreground text-2xl font-bold">Your Cart</h1>
                    {!empty ? (
                        <button type="button" onClick={clearCart} className="text-sm font-medium text-rose-600 hover:underline">
                            Clear cart
                        </button>
                    ) : null}
                </div>

                {empty ? (
                    <div className="mt-16 flex flex-col items-center text-center">
                        <ShoppingBag className="size-12 text-zinc-300" />
                        <p className="text-foreground mt-4 text-lg font-semibold">Your cart is empty</p>
                        <p className="text-muted-foreground mt-1 text-sm">Add some dishes to get started.</p>
                        <Link
                            href={route('customer.dashboard')}
                            className="mt-6 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Browse restaurants
                        </Link>
                    </div>
                ) : (
                    <>
                        {cart.restaurant ? (
                            <Link
                                href={route('customer.restaurants.show', cart.restaurant.id)}
                                className="text-foreground hover:text-primary mt-4 inline-flex items-center gap-3 text-sm font-semibold"
                            >
                                <span className="size-9 overflow-hidden rounded-full bg-zinc-100">
                                    {cart.restaurant.logo_url ? (
                                        <img src={cart.restaurant.logo_url} alt={cart.restaurant.name} className="h-full w-full object-cover" />
                                    ) : null}
                                </span>
                                {cart.restaurant.name}
                            </Link>
                        ) : null}

                        <div className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-100">
                            {items.map((line) => (
                                <CartRow
                                    key={line.id}
                                    line={line}
                                    onIncrement={() => updateLine(line.id, line.quantity + 1)}
                                    onDecrement={() => updateLine(line.id, line.quantity - 1)}
                                    onRemove={() => setPendingDelete(line)}
                                />
                            ))}
                        </div>

                        {items.length > 0 ? (
                            <div ref={sentinelRef} className="flex items-center justify-center py-4">
                                {loadingMore ? (
                                    <span className="text-muted-foreground text-xs">Loading more…</span>
                                ) : hasMore ? (
                                    <button
                                        type="button"
                                        onClick={loadMore}
                                        className="hover:border-primary rounded-md border border-zinc-300 px-4 py-1.5 text-xs font-semibold"
                                    >
                                        Load more
                                    </button>
                                ) : meta.total > meta.per_page ? (
                                    <span className="text-muted-foreground text-xs">You've reached the end.</span>
                                ) : null}
                            </div>
                        ) : null}

                        {/* Bill summary */}
                        <div className="mt-6 rounded-xl border border-zinc-100 p-5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal ({cart.item_count} items)</span>
                                <span className="text-foreground font-semibold tabular-nums">£{cart.subtotal.toFixed(2)}</span>
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">Delivery fees and taxes are calculated at checkout.</p>
                            <button
                                type="button"
                                onClick={() => router.visit('/customer/checkout')}
                                className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </>
                )}
            </main>

            <SiteFooter />

            <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove item?</DialogTitle>
                        <DialogDescription>
                            Remove <strong>{pendingDelete?.name}</strong> from your cart? This can’t be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setPendingDelete(null)}
                            className="text-foreground h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold hover:bg-[#F6F8FA]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmRemove}
                            className="h-10 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
                        >
                            Remove
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CartRow({
    line,
    onIncrement,
    onDecrement,
    onRemove,
}: {
    line: CartLine;
    onIncrement: () => void;
    onDecrement: () => void;
    onRemove: () => void;
}) {
    const modifierSummary = line.modifiers.map((m) => m.option_name).join(', ');

    return (
        <div className="flex gap-4 p-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-amber-50">
                {line.image_url ? (
                    <img src={line.image_url} alt={line.name ?? ''} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-amber-600">
                        <UtensilsCrossed className="size-7" />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-foreground text-sm font-semibold">{line.name}</h3>
                    <button type="button" aria-label="Remove item" onClick={onRemove} className="shrink-0 text-zinc-400 hover:text-rose-600">
                        <Trash2 className="size-4" />
                    </button>
                </div>
                {modifierSummary ? <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{modifierSummary}</p> : null}

                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-md border border-emerald-500 px-2 py-1">
                        <button type="button" aria-label="Decrease" onClick={onDecrement} className="text-emerald-600">
                            <Minus className="size-4" />
                        </button>
                        <span className="min-w-4 text-center text-sm font-bold text-emerald-700">{line.quantity}</span>
                        <button type="button" aria-label="Increase" onClick={onIncrement} className="text-emerald-600">
                            <Plus className="size-4" />
                        </button>
                    </div>
                    <span className="text-foreground text-sm font-semibold tabular-nums">£{line.line_total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
