import { toast } from '@/hooks/use-toast';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, Clock, Heart, Star, Tag, UtensilsCrossed } from 'lucide-react';
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

interface Props {
    results: {
        keyword: string;
        filters: SearchFilters;
        restaurants: SearchRestaurant[];
        restaurants_meta: RestaurantsMeta;
        dishes_by_restaurant: DishGroup[];
        recent: RecentSearch[];
        address: SearchAddress | null;
        radius_miles: number;
        using_fallback: boolean;
    };
}

type Tab = 'restaurants' | 'dishes';

/** Restaurant detail URL, carrying the active search keyword so the detail
 *  page can populate its "Recommended" (related to your search) list. */
function restaurantHref(id: number, keyword: string): string {
    const q = keyword.trim();
    return q ? `/customer/restaurants/${id}?search=${encodeURIComponent(q)}` : `/customer/restaurants/${id}`;
}

export default function CustomerSearch({ results }: Props) {
    const [tab, setTab] = useState<Tab>('restaurants');
    const [openDish, setOpenDish] = useState<{ dish: ModifierDish; restaurantId: number } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Restaurants tab uses infinite scroll. Initial page comes from props; we
    // append subsequent pages via JSON fetch (same /customer/search endpoint).
    const [restaurants, setRestaurants] = useState<SearchRestaurant[]>(results.restaurants);
    const [restaurantsMeta, setRestaurantsMeta] = useState<RestaurantsMeta>(results.restaurants_meta);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Whenever the keyword changes (new Inertia render), reset the local list
    // so we don't show stale rows from the previous keyword.
    useEffect(() => {
        setRestaurants(results.restaurants);
        setRestaurantsMeta(results.restaurants_meta);
    }, [results.keyword, results.restaurants, results.restaurants_meta]);

    const hasMoreRestaurants = restaurantsMeta.current_page < restaurantsMeta.last_page;

    const loadMoreRestaurants = useCallback(async () => {
        if (loadingMore || !hasMoreRestaurants) return;
        setLoadingMore(true);
        try {
            const params = new URLSearchParams({
                search: results.keyword,
                page: String(restaurantsMeta.current_page + 1),
            });
            if (results.filters.offers) params.set('offers', '1');
            if (results.filters.highest_rated) params.set('highest_rated', '1');
            const res = await fetch(`/customer/search?${params.toString()}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as { restaurants: SearchRestaurant[]; restaurants_meta: RestaurantsMeta };
            setRestaurants((prev) => {
                const seen = new Set(prev.map((r) => r.id));
                return [...prev, ...json.restaurants.filter((r) => !seen.has(r.id))];
            });
            setRestaurantsMeta(json.restaurants_meta);
        } catch {
            toast.error('Could not load more restaurants.');
        } finally {
            setLoadingMore(false);
        }
    }, [hasMoreRestaurants, loadingMore, restaurantsMeta.current_page, results.keyword, results.filters]);

    // Toggling a result filter re-runs the search from page 1 (full Inertia
    // visit) carrying the keyword + the new filter set.
    const toggleFilter = (key: keyof SearchFilters) => {
        const next: SearchFilters = { ...results.filters, [key]: !results.filters[key] };
        router.get(
            '/customer/search',
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
        if (tab !== 'restaurants' || !sentinelRef.current || !hasMoreRestaurants) return;
        const el = sentinelRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) loadMoreRestaurants();
            },
            { rootMargin: '400px 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [tab, hasMoreRestaurants, loadMoreRestaurants]);

    const hasQuery = results.keyword.trim() !== '';
    const dishCount = useMemo(
        () => results.dishes_by_restaurant.reduce((sum, g) => sum + g.dishes.length, 0),
        [results.dishes_by_restaurant],
    );
    const noResults = hasQuery && restaurants.length === 0 && dishCount === 0;

    /**
     * Add a dish to the cart from a search-results row, then navigate the
     * customer into the restaurant detail page so they see the qty stepper +
     * sticky cart bar already reflecting their addition.
     */
    const addToCartAndOpenRestaurant = (menuItemId: number, restaurantId: number, options: number[], quantity: number) => {
        setSubmitting(true);
        router.post(
            '/customer/cart',
            { menu_item_id: menuItemId, quantity, options },
            {
                preserveScroll: false,
                preserveState: false,
                onSuccess: () => {
                    setOpenDish(null);
                    router.visit(restaurantHref(restaurantId, results.keyword));
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(typeof first === 'string' ? first : 'Could not add this item to your cart.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleDishAdd = (dish: DishItem, restaurantId: number) => {
        if (dish.modifier_groups.length > 0) {
            setOpenDish({ dish, restaurantId });
            return;
        }
        addToCartAndOpenRestaurant(dish.id, restaurantId, [], 1);
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
                ) : noResults ? (
                    <div className="text-muted-foreground mt-10 rounded-xl border border-dashed bg-[#F6F8FA] p-10 text-center text-sm">
                        No matches for <strong className="font-semibold">“{results.keyword}”</strong>
                        {!results.using_fallback ? ` within ${results.radius_miles} mi.` : '.'}
                    </div>
                ) : (
                    <>
                        <Tabs tab={tab} setTab={setTab} />

                        {/* Post-keyword result filters — apply to both tabs (server filters both). */}
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

                        {tab === 'restaurants' ? (
                            <>
                                <RestaurantsList restaurants={restaurants} keyword={results.keyword} />
                                {restaurants.length > 0 ? (
                                    <div ref={sentinelRef} className="flex items-center justify-center py-8">
                                        {loadingMore ? (
                                            <span className="text-muted-foreground text-xs">Loading more…</span>
                                        ) : hasMoreRestaurants ? (
                                            <button
                                                type="button"
                                                onClick={loadMoreRestaurants}
                                                className="hover:border-primary rounded-md border border-zinc-300 px-4 py-1.5 text-xs font-semibold"
                                            >
                                                Load more
                                            </button>
                                        ) : restaurantsMeta.total > restaurantsMeta.per_page ? (
                                            <span className="text-muted-foreground text-xs">You've reached the end.</span>
                                        ) : null}
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <DishesList groups={results.dishes_by_restaurant} keyword={results.keyword} onAdd={handleDishAdd} />
                        )}
                    </>
                )}
            </main>

            {openDish ? (
                <DishModifierDialog
                    key={openDish.dish.id}
                    dish={openDish.dish}
                    submitting={submitting}
                    onClose={() => setOpenDish(null)}
                    onAdd={(optionIds, quantity) =>
                        addToCartAndOpenRestaurant(openDish.dish.id, openDish.restaurantId, optionIds, quantity)
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

function Tabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
    return (
        <div className="mt-6 border-b border-zinc-200">
            <div className="flex gap-10">
                <TabButton active={tab === 'restaurants'} onClick={() => setTab('restaurants')}>
                    Restaurants
                </TabButton>
                <TabButton active={tab === 'dishes'} onClick={() => setTab('dishes')}>
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
    onAdd,
}: {
    groups: DishGroup[];
    keyword: string;
    onAdd: (dish: DishItem, restaurantId: number) => void;
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
                                onAdd={() => onAdd(dish, group.restaurant.id)}
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
    onAdd,
}: {
    dish: DishItem;
    rating: number | null;
    onAdd: () => void;
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
                    <button
                        type="button"
                        onClick={onAdd}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-emerald-500 bg-white px-5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-600 shadow-sm transition hover:bg-emerald-500 hover:text-white"
                    >
                        Add
                    </button>
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
