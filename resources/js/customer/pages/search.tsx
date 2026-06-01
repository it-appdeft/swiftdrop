import { toast } from '@/hooks/use-toast';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, Clock, Heart, Minus, Plus, Star, Tag, UtensilsCrossed } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomerHeader } from '../components/customer-header';
import { DishModifierDialog, type ModifierDish } from '../components/dish-modifier-dialog';

interface SearchRestaurant {
    id: number;
    name: string;
    tagline: string | null;
    cuisines: string | null;
    city: string | null;
    full_address: string | null;
    logo_url: string | null;
    cover_url: string | null;
    rating: number | null;
    total_reviews: number;
    distance_miles: number | null;
}

interface DishItem {
    id: number;
    name: string;
    description: string | null;
    price: number;
    is_veg: boolean;
    image_url: string | null;
    modifier_groups: ModifierDish['modifier_groups'];
}

interface DishGroupRestaurant {
    id: number;
    name: string;
    city: string | null;
    logo_url: string | null;
    cover_url: string | null;
    rating: number | null;
    total_reviews: number;
    distance_miles: number | null;
}

interface DishGroup {
    restaurant: DishGroupRestaurant;
    dishes: DishItem[];
}

interface RecentSearch {
    id: number;
    keyword: string;
    searched_at: string | null;
}

interface SearchAddress {
    id: number;
    label: string | null;
    address_line_1: string | null;
    city: string | null;
    postcode: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface RestaurantsMeta {
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

interface SearchFilters {
    offers: boolean;
    highest_rated: boolean;
}

interface CartLine {
    id: number;
    menu_item_id: number;
    quantity: number;
    selected_options?: number[];
}

interface Cart {
    restaurant_id: number | null;
    items: CartLine[];
}

interface Props {
    results: {
        type: Tab;
        keyword: string;
        filters: SearchFilters;
        restaurants: SearchRestaurant[];
        pagination: RestaurantsMeta;
        dishes_by_restaurant: DishGroup[];
        recent: RecentSearch[];
        address: SearchAddress | null;
        radius_miles: number;
        using_fallback: boolean;
    };
    cart: Cart;
}

// Mirrors the backend `{type}` route segment.
type Tab = 'restaurant' | 'items';

/** Restaurant detail URL, carrying the active search keyword so the detail
 *  page can populate its "Recommended" (related to your search) list. */
function restaurantHref(id: number, keyword: string): string {
    const q = keyword.trim();
    return q ? `/customer/restaurants/${id}?search=${encodeURIComponent(q)}` : `/customer/restaurants/${id}`;
}

export default function CustomerSearch({ results, cart }: Props) {
    const type = results.type;
    const [openDish, setOpenDish] = useState<{ dish: ModifierDish; restaurantId: number } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Cart lines keyed by dish — drives the in-list quantity steppers and the
    // pre-marked options in the customise dialog. A cart holds one restaurant
    // at a time, so only that restaurant's dishes ever show as "in cart".
    const linesByDish = useMemo(() => {
        const map = new Map<number, CartLine[]>();
        for (const line of cart.items) {
            const list = map.get(line.menu_item_id) ?? [];
            list.push(line);
            map.set(line.menu_item_id, list);
        }
        return map;
    }, [cart.items]);

    const quantityFor = (dishId: number) =>
        (linesByDish.get(dishId) ?? []).reduce((sum, line) => sum + line.quantity, 0);

    // The line the dialog edits — most recent combo for the dish, so its
    // current selection opens pre-marked (see restaurant page for the rationale).
    const lastLineFor = (dishId: number): CartLine | null => {
        const lines = linesByDish.get(dishId) ?? [];
        return lines.length ? lines[lines.length - 1] : null;
    };

    const openExistingLine = openDish ? lastLineFor(openDish.dish.id) : null;

    // Both tabs use infinite scroll. The active tab's first page comes from
    // props; subsequent pages append via JSON fetch from the same
    // /customer/search/{type} endpoint. Only the list matching the current
    // `type` is shown, but we keep both states so the reset effect is simple.
    const [restaurants, setRestaurants] = useState<SearchRestaurant[]>(results.restaurants);
    const [groups, setGroups] = useState<DishGroup[]>(results.dishes_by_restaurant);
    const [meta, setMeta] = useState<RestaurantsMeta>(results.pagination);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Reset the local lists whenever a fresh render arrives (new type, keyword
    // or filter set) so we never show stale rows from the previous request.
    useEffect(() => {
        setRestaurants(results.restaurants);
        setGroups(results.dishes_by_restaurant);
        setMeta(results.pagination);
    }, [results.type, results.keyword, results.restaurants, results.dishes_by_restaurant, results.pagination]);

    const hasMore = meta.current_page < meta.last_page;

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const params = new URLSearchParams({
                search: results.keyword,
                page: String(meta.current_page + 1),
            });
            if (results.filters.offers) params.set('offers', '1');
            if (results.filters.highest_rated) params.set('highest_rated', '1');
            const res = await fetch(`/customer/search/${type}?${params.toString()}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as {
                restaurants: SearchRestaurant[];
                dishes_by_restaurant: DishGroup[];
                pagination: RestaurantsMeta;
            };
            if (type === 'items') {
                setGroups((prev) => {
                    const seen = new Set(prev.map((g) => g.restaurant.id));
                    return [...prev, ...json.dishes_by_restaurant.filter((g) => !seen.has(g.restaurant.id))];
                });
            } else {
                setRestaurants((prev) => {
                    const seen = new Set(prev.map((r) => r.id));
                    return [...prev, ...json.restaurants.filter((r) => !seen.has(r.id))];
                });
            }
            setMeta(json.pagination);
        } catch {
            toast.error('Could not load more results.');
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, meta.current_page, results.keyword, results.filters, type]);

    // Switching tab is a fresh search against the other endpoint, carrying the
    // keyword + active filters so the result set stays in sync.
    const goToTab = (next: Tab) => {
        if (next === type) return;
        router.get(
            `/customer/search/${next}`,
            {
                search: results.keyword,
                ...(results.filters.offers ? { offers: 1 } : {}),
                ...(results.filters.highest_rated ? { highest_rated: 1 } : {}),
            },
            { preserveScroll: true, preserveState: false },
        );
    };

    // Toggling a result filter re-runs the current tab from page 1.
    const toggleFilter = (key: keyof SearchFilters) => {
        const next: SearchFilters = { ...results.filters, [key]: !results.filters[key] };
        router.get(
            `/customer/search/${type}`,
            {
                search: results.keyword,
                ...(next.offers ? { offers: 1 } : {}),
                ...(next.highest_rated ? { highest_rated: 1 } : {}),
            },
            { preserveScroll: true, preserveState: false },
        );
    };

    // IntersectionObserver kicks off loadMore when the sentinel scrolls in.
    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;
        const el = sentinelRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) loadMore();
            },
            { rootMargin: '400px 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    const hasQuery = results.keyword.trim() !== '';
    const activeCount = type === 'items' ? groups.length : restaurants.length;

    // All cart mutations refresh only the `cart` prop (partial reload) so the
    // infinite-scroll dish list + scroll position survive the round-trip.
    const cartReloadOpts = (onDone?: () => void) => ({
        preserveScroll: true,
        preserveState: true,
        only: ['cart'],
        onError: (errors: Record<string, string>) => {
            const first = Object.values(errors)[0];
            toast.error(typeof first === 'string' ? first : 'Could not update your cart.');
        },
        onSuccess: () => onDone?.(),
        onFinish: () => setSubmitting(false),
    });

    const addToCart = (menuItemId: number, quantity: number, options: number[], onDone?: () => void) => {
        setSubmitting(true);
        router.post('/customer/cart', { menu_item_id: menuItemId, quantity, options }, cartReloadOpts(onDone));
    };

    const updateLine = (itemId: number, quantity: number) => {
        router.put(`/customer/cart/items/${itemId}`, { quantity }, { preserveScroll: true, preserveState: true, only: ['cart'] });
    };

    const updateLineSelection = (itemId: number, quantity: number, options: number[], onDone?: () => void) => {
        setSubmitting(true);
        router.put(`/customer/cart/items/${itemId}`, { quantity, options }, cartReloadOpts(onDone));
    };

    // First add from a card. Dishes with options open the customise dialog;
    // plain dishes drop straight into the cart and the card flips to a stepper.
    const handleDishAdd = (dish: DishItem, restaurantId: number) => {
        if (dish.modifier_groups.length > 0) {
            setOpenDish({ dish, restaurantId });
            return;
        }
        addToCart(dish.id, 1, []);
    };

    // Stepper +: re-open the dialog for customisable dishes (so the customer
    // confirms a combo), else bump the existing line's quantity.
    const handleIncrement = (dish: DishItem, restaurantId: number) => {
        if (dish.modifier_groups.length > 0) {
            setOpenDish({ dish, restaurantId });
            return;
        }
        const line = lastLineFor(dish.id);
        if (line) updateLine(line.id, line.quantity + 1);
    };

    const handleDecrement = (dish: DishItem) => {
        const line = lastLineFor(dish.id);
        if (line) updateLine(line.id, line.quantity - 1);
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title="Search" />
            <CustomerHeader />

            <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {hasQuery ? (
                    <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                        Results for <span className="text-primary">“{results.keyword}”</span>
                    </h1>
                ) : null}

                {!hasQuery ? (
                    <p className="text-muted-foreground mt-2 text-sm">Use the search icon in the header to find dishes & restaurants.</p>
                ) : (
                    <>
                        <Tabs tab={type} onChange={goToTab} />

                        {/* Post-keyword result filters — re-run the active tab. */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <FilterChip
                                active={results.filters.offers}
                                onClick={() => toggleFilter('offers')}
                                icon={<Tag className="size-3.5" />}
                            >
                                Offers
                            </FilterChip>
                            <FilterChip
                                active={results.filters.highest_rated}
                                onClick={() => toggleFilter('highest_rated')}
                                icon={<Star className="size-3.5" />}
                            >
                                Highest rated
                            </FilterChip>
                        </div>

                        {type === 'restaurant' ? (
                            <RestaurantsList restaurants={restaurants} keyword={results.keyword} />
                        ) : (
                            <DishesList
                                groups={groups}
                                keyword={results.keyword}
                                quantityFor={quantityFor}
                                onAdd={handleDishAdd}
                                onIncrement={handleIncrement}
                                onDecrement={handleDecrement}
                            />
                        )}

                        {activeCount > 0 ? (
                            <div ref={sentinelRef} className="flex items-center justify-center py-8">
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
                    </>
                )}
            </main>

            {openDish ? (
                <DishModifierDialog
                    key={openDish.dish.id}
                    dish={openDish.dish}
                    selectedOptions={openExistingLine?.selected_options ?? []}
                    initialQuantity={openExistingLine?.quantity ?? 1}
                    editing={openExistingLine !== null}
                    submitting={submitting}
                    onClose={() => setOpenDish(null)}
                    onAdd={(optionIds, quantity) =>
                        openExistingLine
                            ? updateLineSelection(openExistingLine.id, quantity, optionIds, () => setOpenDish(null))
                            : addToCart(openDish.dish.id, quantity, optionIds, () => setOpenDish(null))
                    }
                />
            ) : null}
        </div>
    );
}

function FilterChip({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ' +
                (active
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'text-foreground border-zinc-300 hover:border-emerald-500')
            }
        >
            {icon}
            {children}
        </button>
    );
}

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
    return (
        <div className="mt-6 border-b border-zinc-200">
            <div className="flex gap-10">
                <TabButton active={tab === 'restaurant'} onClick={() => onChange('restaurant')}>
                    Restaurants
                </TabButton>
                <TabButton active={tab === 'items'} onClick={() => onChange('items')}>
                    Items
                </TabButton>
            </div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                'relative pb-3 text-base font-semibold transition ' +
                (active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')
            }
        >
            <span className="inline-flex items-center gap-1.5">{children}</span>
            {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" /> : null}
        </button>
    );
}

/** Clock icon + "20-30 min" | distance, shared by restaurant cards and dish-group headers. */
function MetaLine({ distanceMiles, city }: { distanceMiles: number | null; city: string | null }) {
    const right = distanceMiles !== null ? `${distanceMiles} mi` : (city ?? '');

    return (
        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>20-30 min</span>
            {right ? (
                <>
                    <span className="h-3 w-px bg-zinc-300" />
                    <span>{right}</span>
                </>
            ) : null}
        </p>
    );
}

function RestaurantsList({ restaurants, keyword }: { restaurants: SearchRestaurant[]; keyword: string }) {
    if (restaurants.length === 0) {
        return (
            <div className="mt-6 rounded-xl border border-dashed bg-[#F6F8FA] p-10 text-center text-sm text-muted-foreground">
                No matching restaurants.
            </div>
        );
    }

    return (
        <div className="mt-6 rounded-2xl bg-[#F6F8FA] p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((r) => (
                    <Link key={r.id} href={restaurantHref(r.id, keyword)} className="group block">
                        <div className="relative aspect-[7/4] overflow-hidden rounded-2xl bg-zinc-200">
                            {r.cover_url || r.logo_url ? (
                                <img
                                    src={(r.cover_url ?? r.logo_url)!}
                                    alt={r.name}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-zinc-400">
                                    {r.name.charAt(0)}
                                </div>
                            )}
                            <span className="absolute bottom-3 left-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-medium text-white shadow">
                                20% OFF select items
                            </span>
                            {r.rating !== null ? (
                                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-zinc-900 shadow">
                                    <Star className="size-3 fill-amber-400 text-amber-400" /> {r.rating.toFixed(1)}
                                </span>
                            ) : null}
                        </div>
                        <div className="flex items-start justify-between gap-2 pt-3">
                            <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-foreground">{r.name}</p>
                                <MetaLine distanceMiles={r.distance_miles} city={r.city} />
                            </div>
                            <button
                                type="button"
                                aria-label="Save"
                                onClick={(e) => e.preventDefault()}
                                className="shrink-0 text-zinc-400 transition hover:text-rose-500"
                            >
                                <Heart className="size-5" />
                            </button>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function DishesList({
    groups,
    keyword,
    quantityFor,
    onAdd,
    onIncrement,
    onDecrement,
}: {
    groups: DishGroup[];
    keyword: string;
    quantityFor: (dishId: number) => number;
    onAdd: (dish: DishItem, restaurantId: number) => void;
    onIncrement: (dish: DishItem, restaurantId: number) => void;
    onDecrement: (dish: DishItem) => void;
}) {
    if (groups.length === 0) {
        return (
            <div className="mt-6 rounded-xl border border-dashed bg-[#F6F8FA] p-10 text-center text-sm text-muted-foreground">
                No matching dishes.
            </div>
        );
    }

    return (
        <div className="mt-6 space-y-4 rounded-2xl bg-[#F6F8FA] p-3 sm:p-4">
            {groups.map((group) => (
                <section key={group.restaurant.id} className="rounded-2xl bg-white p-4 sm:p-6">
                    <Link
                        href={restaurantHref(group.restaurant.id, keyword)}
                        className="group flex items-center justify-between gap-3 border-b border-zinc-100 pb-4"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-lg font-bold text-foreground group-hover:text-primary">
                                {group.restaurant.name}
                            </p>
                            <MetaLine distanceMiles={group.restaurant.distance_miles} city={group.restaurant.city} />
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                    </Link>
                    <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.dishes.map((dish) => (
                            <DishCard
                                key={dish.id}
                                dish={dish}
                                rating={group.restaurant.rating}
                                quantity={quantityFor(dish.id)}
                                onAdd={() => onAdd(dish, group.restaurant.id)}
                                onIncrement={() => onIncrement(dish, group.restaurant.id)}
                                onDecrement={() => onDecrement(dish)}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

function DishCard({
    dish,
    rating,
    quantity,
    onAdd,
    onIncrement,
    onDecrement,
}: {
    dish: DishItem;
    rating: number | null;
    quantity: number;
    onAdd: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
}) {
    return (
        <article className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="flex gap-3">
                <div className="relative shrink-0">
                    <div className="size-28 overflow-hidden rounded-lg bg-amber-50">
                        {dish.image_url ? (
                            <img src={dish.image_url} alt={dish.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-amber-600">
                                <UtensilsCrossed className="size-9" />
                            </div>
                        )}
                    </div>
                    {quantity === 0 ? (
                        <button
                            type="button"
                            onClick={onAdd}
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-emerald-500 bg-white px-5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-600 shadow-sm transition hover:bg-emerald-500 hover:text-white"
                        >
                            Add
                        </button>
                    ) : (
                        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-md border border-emerald-500 bg-white px-2 py-1 shadow-sm">
                            <button type="button" aria-label="Decrease" onClick={onDecrement} className="text-emerald-600">
                                <Minus className="size-4" />
                            </button>
                            <span className="min-w-4 text-center text-sm font-bold text-emerald-700">{quantity}</span>
                            <button type="button" aria-label="Increase" onClick={onIncrement} className="text-emerald-600">
                                <Plus className="size-4" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">{dish.name}</p>
                        <VegBadge isVeg={dish.is_veg} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">£{dish.price.toFixed(2)}</p>
                    {rating !== null ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-700">
                            <Star className="size-3 fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
                        </span>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function VegBadge({ isVeg }: { isVeg: boolean }) {
    const border = isVeg ? 'border-emerald-600' : 'border-rose-600';
    const dot = isVeg ? 'bg-emerald-600' : 'bg-rose-600';

    return (
        <span
            className={`flex size-4 shrink-0 items-center justify-center rounded-[3px] border ${border}`}
            aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
        >
            <span className={`size-1.5 rounded-full ${dot}`} />
        </span>
    );
}
