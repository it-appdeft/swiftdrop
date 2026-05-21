import { Head, Link, router } from '@inertiajs/react';
import { MapPin, Search as SearchIcon, Star, Trash2, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CustomerHeader } from '../components/customer-header';

// Mirrors App\Http\Resources\Customer\CustomerSearchResource.
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

interface SearchMenuItem {
    id: number;
    name: string;
    description: string | null;
    price: number;
    is_veg: boolean;
    restaurant: { id: number; name: string; city: string | null };
    distance_miles: number | null;
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
        menu_items: SearchMenuItem[];
        recent: RecentSearch[];
        address: SearchAddress | null;
        radius_miles: number;
        using_fallback: boolean;
    };
}

export default function CustomerSearch({ results }: Props) {
    const [query, setQuery] = useState(results.keyword);

    // Keep local state in sync with the keyword the server resolved from
    // the URL (e.g. after clicking a recent search or a back/forward nav).
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
    const noResults = hasQuery && results.restaurants.length === 0 && results.menu_items.length === 0;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title="Search" />
            <CustomerHeader />

            <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* Search input */}
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-md text-zinc-500 hover:text-primary"
                    >
                        <SearchIcon className="size-5" />
                    </button>
                </form>

                {/* Address banner */}
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

                {/* Recent searches (empty state) */}
                {!hasQuery ? (
                    <section className="mt-8">
                        <div className="mb-4 flex items-end justify-between">
                            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Recent Searches</h2>
                            {results.recent.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={clearHistory}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline"
                                >
                                    <Trash2 className="size-4" /> Clear
                                </button>
                            ) : null}
                        </div>

                        {results.recent.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Your recent searches will show up here.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {results.recent.map((row) => (
                                    <li key={row.id}>
                                        <button
                                            type="button"
                                            onClick={() => runKeyword(row.keyword)}
                                            className="group flex w-full items-center gap-3 text-left"
                                        >
                                            <span className="flex size-6 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 group-hover:border-primary group-hover:text-primary">
                                                <SearchIcon className="size-3.5" />
                                            </span>
                                            <span className="text-base text-foreground group-hover:text-primary">
                                                {row.keyword}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ) : null}

                {/* Results state */}
                {hasQuery ? (
                    <div className="mt-8 space-y-10">
                        {results.restaurants.length > 0 ? (
                            <section>
                                <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">
                                    Restaurants ({results.restaurants.length})
                                </h2>
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
                                    {results.restaurants.map((r) => (
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
                                                {r.rating !== null ? (
                                                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-emerald-700 shadow">
                                                        <Star className="size-3 fill-current text-amber-500" /> {r.rating.toFixed(1)}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="pt-3">
                                                <p className="truncate text-base font-semibold">{r.name}</p>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {r.distance_miles !== null
                                                        ? `${r.distance_miles} mi · ${r.city ?? ''}`.trim()
                                                        : r.city ?? r.tagline ?? ''}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {results.menu_items.length > 0 ? (
                            <section>
                                <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">
                                    Dishes ({results.menu_items.length})
                                </h2>
                                <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-background">
                                    {results.menu_items.map((m) => (
                                        <li key={m.id}>
                                            <Link
                                                href={`/customer/restaurants/${m.restaurant.id}`}
                                                className="flex items-center gap-4 px-4 py-4 transition hover:bg-zinc-50"
                                            >
                                                <span className="flex size-10 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                                                    <Utensils className="size-4" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">{m.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {m.restaurant.name}
                                                        {m.distance_miles !== null ? ` · ${m.distance_miles} mi` : ''}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-sm font-semibold tabular-nums">
                                                    £{m.price.toFixed(2)}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}

                        {noResults ? (
                            <div className="rounded-xl border border-dashed bg-zinc-50 p-10 text-center text-sm text-muted-foreground">
                                No matches for <strong className="font-semibold">“{results.keyword}”</strong>
                                {!results.using_fallback ? ` within ${results.radius_miles} mi.` : '.'}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </main>
        </div>
    );
}
