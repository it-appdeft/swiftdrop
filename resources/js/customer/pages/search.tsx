import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Clock, Heart, Search as SearchIcon, Star, Trash2, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CustomerHeader } from '../components/customer-header';

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

interface Props {
    results: {
        keyword: string;
        restaurants: SearchRestaurant[];
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
    return q ? `/customer/restaurants/${id}?q=${encodeURIComponent(q)}` : `/customer/restaurants/${id}`;
}

export default function CustomerSearch({ results }: Props) {
    const [query, setQuery] = useState(results.keyword);
    const [tab, setTab] = useState<Tab>('restaurants');

    useEffect(() => {
        setQuery(results.keyword);
    }, [results.keyword]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/customer/search', { q: query }, { preserveScroll: true, preserveState: false });
    };

    const runKeyword = (keyword: string) => {
        router.get('/customer/search', { q: keyword }, { preserveScroll: true, preserveState: false });
    };

    const clearHistory = () => {
        router.delete('/customer/search/history', { preserveScroll: true });
    };

    const hasQuery = results.keyword.trim() !== '';
    const restaurantCount = results.restaurants.length;
    const dishCount = useMemo(
        () => results.dishes_by_restaurant.reduce((sum, g) => sum + g.dishes.length, 0),
        [results.dishes_by_restaurant],
    );
    const noResults = hasQuery && restaurantCount === 0 && dishCount === 0;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title="Search" />
            <CustomerHeader />

            <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <form
                    onSubmit={submit}
                    className="flex h-14 items-center gap-1.5 rounded-md border border-zinc-200 bg-background px-3 transition focus-within:border-primary"
                >
                    {hasQuery ? (
                        <Link
                            href="/customer/search"
                            aria-label="Back"
                            className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-zinc-100"
                        >
                            <ChevronLeft className="size-5" />
                        </Link>
                    ) : null}
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search dishes & restaurants"
                        className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                    />
                    <button
                        type="submit"
                        aria-label="Search"
                        className="flex size-9 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:text-primary"
                    >
                        <SearchIcon className="size-5" />
                    </button>
                </form>

                {!hasQuery ? (
                    <RecentSearches recent={results.recent} onPick={runKeyword} onClear={clearHistory} />
                ) : (
                    <>
                        <Tabs tab={tab} setTab={setTab} />

                        {tab === 'restaurants' ? (
                            <RestaurantsList restaurants={results.restaurants} keyword={results.keyword} />
                        ) : (
                            <DishesList groups={results.dishes_by_restaurant} keyword={results.keyword} />
                        )}

                        {noResults ? (
                            <div className="mt-10 rounded-xl border border-dashed bg-zinc-50 p-10 text-center text-sm text-muted-foreground">
                                No matches for <strong className="font-semibold">“{results.keyword}”</strong>
                                {!results.using_fallback ? ` within ${results.radius_miles} mi.` : '.'}
                            </div>
                        ) : null}
                    </>
                )}
            </main>
        </div>
    );
}

function RecentSearches({
    recent,
    onPick,
    onClear,
}: {
    recent: RecentSearch[];
    onPick: (keyword: string) => void;
    onClear: () => void;
}) {
    return (
        <section className="mt-8">
            <div className="mb-4 flex items-end justify-between">
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Recent Searches</h2>
                {recent.length > 0 ? (
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline"
                    >
                        <Trash2 className="size-4" /> Clear
                    </button>
                ) : null}
            </div>

            {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Your recent searches will show up here.</p>
            ) : (
                <ul className="space-y-3">
                    {recent.map((row) => (
                        <li key={row.id}>
                            <button
                                type="button"
                                onClick={() => onPick(row.keyword)}
                                className="group flex w-full items-center gap-3 text-left"
                            >
                                <span className="flex size-6 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 group-hover:border-primary group-hover:text-primary">
                                    <SearchIcon className="size-3.5" />
                                </span>
                                <span className="text-base text-foreground group-hover:text-primary">{row.keyword}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
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
                    Dishes
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
            <div className="mt-6 rounded-xl border border-dashed bg-zinc-50 p-10 text-center text-sm text-muted-foreground">
                No matching restaurants.
            </div>
        );
    }

    return (
        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 sm:p-6">
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

function DishesList({ groups, keyword }: { groups: DishGroup[]; keyword: string }) {
    if (groups.length === 0) {
        return (
            <div className="mt-6 rounded-xl border border-dashed bg-zinc-50 p-10 text-center text-sm text-muted-foreground">
                No matching dishes.
            </div>
        );
    }

    return (
        <div className="mt-6 space-y-4 rounded-2xl bg-zinc-50 p-3 sm:p-4">
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
                                restaurantId={group.restaurant.id}
                                rating={group.restaurant.rating}
                                keyword={keyword}
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
    restaurantId,
    rating,
    keyword,
}: {
    dish: DishItem;
    restaurantId: number;
    rating: number | null;
    keyword: string;
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
                        onClick={(e) => {
                            e.preventDefault();
                            router.visit(restaurantHref(restaurantId, keyword));
                        }}
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
