import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, Heart, MapPin, Search as SearchIcon, Star, Trash2, UtensilsCrossed } from 'lucide-react';
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
                {hasQuery ? (
                    <div className="mb-4 flex items-center gap-3">
                        <Link
                            href="/customer/search"
                            aria-label="Back"
                            className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-zinc-100"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                        <h1 className="truncate text-lg font-semibold capitalize sm:text-xl">{results.keyword}</h1>
                    </div>
                ) : null}

                <form onSubmit={submit} className="relative">
                    <input
                        type="search"
                        value={query}
                        autoFocus
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search dishes & restaurants"
                        className="h-14 w-full rounded-md border border-zinc-200 bg-background pl-5 pr-14 text-base outline-none transition focus:border-primary"
                    />
                    <button
                        type="submit"
                        aria-label="Search"
                        className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 hover:text-primary"
                    >
                        <SearchIcon className="size-5" />
                    </button>
                </form>

                {results.address ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" />
                        Showing results within {results.radius_miles} mi of {results.address.label ?? results.address.city ?? 'your saved address'}
                    </p>
                ) : (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" />
                        Add a delivery address in your profile to see results near you.
                    </p>
                )}

                {!hasQuery ? (
                    <RecentSearches recent={results.recent} onPick={runKeyword} onClear={clearHistory} />
                ) : (
                    <>
                        <Tabs
                            tab={tab}
                            setTab={setTab}
                            restaurantCount={restaurantCount}
                            dishCount={dishCount}
                        />

                        {tab === 'restaurants' ? (
                            <RestaurantsList restaurants={results.restaurants} />
                        ) : (
                            <DishesList groups={results.dishes_by_restaurant} />
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

function Tabs({
    tab,
    setTab,
    restaurantCount,
    dishCount,
}: {
    tab: Tab;
    setTab: (t: Tab) => void;
    restaurantCount: number;
    dishCount: number;
}) {
    return (
        <div className="mt-6 border-b border-zinc-200">
            <div className="flex gap-8">
                <TabButton active={tab === 'restaurants'} onClick={() => setTab('restaurants')}>
                    Restaurants {restaurantCount > 0 ? <span className="text-muted-foreground">({restaurantCount})</span> : null}
                </TabButton>
                <TabButton active={tab === 'dishes'} onClick={() => setTab('dishes')}>
                    Dishes {dishCount > 0 ? <span className="text-muted-foreground">({dishCount})</span> : null}
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
            {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            ) : null}
        </button>
    );
}

function RestaurantsList({ restaurants }: { restaurants: SearchRestaurant[] }) {
    if (restaurants.length === 0) {
        return (
            <div className="mt-8 rounded-xl border border-dashed bg-zinc-50 p-10 text-center text-sm text-muted-foreground">
                No matching restaurants.
            </div>
        );
    }

    return (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
            {restaurants.map((r) => (
                <Link key={r.id} href={`/customer/restaurants/${r.id}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-200">
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
                        <span className="absolute bottom-3 left-3 rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                            20% OFF select items
                        </span>
                        {r.rating !== null ? (
                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-emerald-700 shadow">
                                <Star className="size-3 fill-current text-amber-500" /> {r.rating.toFixed(1)}
                            </span>
                        ) : null}
                    </div>
                    <div className="flex items-center justify-between pt-3">
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold">{r.name}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                20-30 min
                                {r.distance_miles !== null
                                    ? ` · ${r.distance_miles} mi`
                                    : r.city
                                      ? ` · ${r.city}`
                                      : ''}
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Save"
                            onClick={(e) => e.preventDefault()}
                            className="shrink-0 text-muted-foreground transition hover:text-rose-500"
                        >
                            <Heart className="size-5" />
                        </button>
                    </div>
                </Link>
            ))}
        </div>
    );
}

function DishesList({ groups }: { groups: DishGroup[] }) {
    if (groups.length === 0) {
        return (
            <div className="mt-8 rounded-xl border border-dashed bg-zinc-50 p-10 text-center text-sm text-muted-foreground">
                No matching dishes.
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-10">
            {groups.map((group) => (
                <section key={group.restaurant.id}>
                    <Link
                        href={`/customer/restaurants/${group.restaurant.id}`}
                        className="group mb-4 flex items-center justify-between gap-3"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold group-hover:text-primary sm:text-lg">
                                {group.restaurant.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {group.restaurant.rating !== null ? (
                                    <span className="mr-2 inline-flex items-center gap-1 text-emerald-700">
                                        <Star className="size-3 fill-current text-amber-500" />
                                        {group.restaurant.rating.toFixed(1)}
                                    </span>
                                ) : null}
                                20-30 min
                                {group.restaurant.distance_miles !== null
                                    ? ` · ${group.restaurant.distance_miles} mi`
                                    : group.restaurant.city
                                      ? ` · ${group.restaurant.city}`
                                      : ''}
                            </p>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                    </Link>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
                        {group.dishes.map((dish) => (
                            <DishCard key={dish.id} dish={dish} restaurantId={group.restaurant.id} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

function DishCard({ dish, restaurantId }: { dish: DishItem; restaurantId: number }) {
    return (
        <article className="relative overflow-hidden rounded-xl border border-zinc-200 bg-background transition hover:border-primary/40 hover:shadow-sm">
            <Link href={`/customer/restaurants/${restaurantId}`} className="block">
                <div className="aspect-[4/3] overflow-hidden bg-amber-50">
                    {dish.image_url ? (
                        <img
                            src={dish.image_url}
                            alt={dish.name}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-amber-600">
                            <UtensilsCrossed className="size-10" />
                        </div>
                    )}
                </div>
                <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-semibold">{dish.name}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold tabular-nums">£{dish.price.toFixed(2)}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                router.visit(`/customer/restaurants/${restaurantId}`);
                            }}
                            className="rounded-md border border-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition hover:bg-primary hover:text-primary-foreground"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </Link>
        </article>
    );
}
