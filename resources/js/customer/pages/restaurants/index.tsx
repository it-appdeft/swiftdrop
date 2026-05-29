import { toast } from '@/hooks/use-toast';
import { Head } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CustomerHeader } from '../../components/customer-header';
import { RestaurantCard, type DashboardRestaurant } from '../dashboard';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PageMeta {
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

interface Props {
    restaurants: DashboardRestaurant[];
    pagination: PageMeta;
}

const CSRF = (): string =>
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

/**
 * "View all" restaurants page — first page comes from the Inertia render;
 * subsequent pages are appended via JSON fetch when the bottom sentinel
 * scrolls into view (true infinite scroll, no scroll-position jumps).
 */
export default function CustomerRestaurantsIndex({ restaurants: initial, pagination: initialMeta }: Props) {
    const [items, setItems] = useState<DashboardRestaurant[]>(initial);
    const [meta, setMeta] = useState<PageMeta>(initialMeta);
    const [loading, setLoading] = useState(false);
    const [favorited, setFavorited] = useState<Set<number>>(
        () => new Set(initial.filter((r) => r.is_favorited).map((r) => r.id)),
    );
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const hasMore = meta.current_page < meta.last_page;

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const res = await fetch(`/customer/restaurants?page=${meta.current_page + 1}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as Props;
            // De-duplicate by id in case the same row appears on two pages
            // (concurrent insert) so React keys stay unique.
            setItems((prev) => {
                const seen = new Set(prev.map((r) => r.id));
                return [...prev, ...json.restaurants.filter((r) => !seen.has(r.id))];
            });
            setFavorited((prev) => {
                const next = new Set(prev);
                for (const r of json.restaurants) if (r.is_favorited) next.add(r.id);
                return next;
            });
            setMeta(json.pagination);
        } catch {
            toast.error('Could not load more restaurants.');
        } finally {
            setLoading(false);
        }
    }, [hasMore, loading, meta.current_page]);

    // IntersectionObserver triggers loadMore as the sentinel enters viewport.
    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;
        const el = sentinelRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) loadMore();
            },
            { rootMargin: '400px 0px' }, // start fetching a screen before the user hits the bottom
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    const toggleFavorite = async (restaurantId: number) => {
        const wasFav = favorited.has(restaurantId);
        const optimistic = new Set(favorited);
        if (wasFav) optimistic.delete(restaurantId);
        else optimistic.add(restaurantId);
        setFavorited(optimistic);
        try {
            const res = await fetch(`/customer/favorites/restaurants/${restaurantId}`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': CSRF(), 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as { favorited: boolean };
            const corrected = new Set(optimistic);
            if (json.favorited) corrected.add(restaurantId);
            else corrected.delete(restaurantId);
            setFavorited(corrected);
            toast.success(json.favorited ? 'Added to favourites' : 'Removed from favourites');
        } catch {
            const rollback = new Set(favorited);
            if (wasFav) rollback.add(restaurantId);
            else rollback.delete(restaurantId);
            setFavorited(rollback);
            toast.error('Could not update favourite.');
        }
    };

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <Head title="All restaurants" />
            <CustomerHeader />

            <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">All Restaurants</h1>
                    <p className="text-muted-foreground mt-1 text-sm">{meta.total} restaurant{meta.total === 1 ? '' : 's'} available</p>
                </div>

                {items.length === 0 ? (
                    <div className="text-muted-foreground rounded-xl border border-dashed bg-[#F6F8FA] p-10 text-center text-sm">
                        No restaurants available yet.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                            {items.map((r) => (
                                <RestaurantCard
                                    key={r.id}
                                    restaurant={r}
                                    isFavorited={favorited.has(r.id)}
                                    onToggleFavorite={() => toggleFavorite(r.id)}
                                />
                            ))}
                        </div>

                        <div ref={sentinelRef} className="flex items-center justify-center py-10">
                            {loading ? (
                                <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                                    <Loader2 className="size-4 animate-spin" /> Loading more…
                                </span>
                            ) : hasMore ? (
                                <button
                                    type="button"
                                    onClick={loadMore}
                                    className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold hover:border-emerald-500 hover:text-emerald-600"
                                >
                                    Load more
                                </button>
                            ) : (
                                <span className="text-muted-foreground text-xs">You've reached the end.</span>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
