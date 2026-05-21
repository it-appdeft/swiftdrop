import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Heart, MapPin, Star, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CustomerHeader } from '../components/customer-header';

// ─── Types (mirror App\Http\Resources\Customer\CustomerDashboardResource) ────

interface FoodItem {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
}

interface DashboardRestaurant {
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

interface DashboardAddress {
    id: number;
    label: string | null;
    address_line_1: string | null;
    city: string | null;
    postcode: string | null;
    lat: number | null;
    lng: number | null;
}

interface DashboardProps {
    dashboard: {
        food_items: FoodItem[];
        restaurants: DashboardRestaurant[];
        address: DashboardAddress | null;
        radius_miles: number;
        using_fallback: boolean;
    };
}

// ─── Static (cuisines / promos remain static for now) ───────────────────────

const CUISINES = [
    { label: 'Italian', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop' },
    { label: 'Asian', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop' },
    { label: 'Mexican', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&h=200&fit=crop' },
    { label: 'Chinese', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=200&h=200&fit=crop' },
    { label: 'Italian', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=200&h=200&fit=crop' },
    { label: 'Asian', image: 'https://images.unsplash.com/photo-1518983546435-91f8b87fe561?w=200&h=200&fit=crop' },
    { label: 'Mexican', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=200&fit=crop' },
    { label: 'Italian', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=200&h=200&fit=crop' },
];

const PROMOS = [
    {
        title: 'Kooker',
        subtitle: 'Special Birthday',
        offer: 'Offer Up To -25%',
        meta: 'Up To 3 Delivery Promo',
        accent: 'bg-pink-100',
        image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600&h=600&fit=crop',
    },
    {
        title: 'Kooker',
        subtitle: 'Special Birthday',
        offer: 'Offer Up To -25%',
        meta: 'Up To 3 Delivery Promo',
        accent: 'bg-amber-100',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=600&fit=crop',
    },
];

// Sections in the Figma run edge-to-edge with sharp corners and alternate
// between white and light-gray fills (not rounded cards floating on a gray
// canvas). `tone` controls which side of that zebra a section sits on.
function Section({ tone, children }: { tone: 'white' | 'gray'; children: React.ReactNode }) {
    return (
        <section className={tone === 'gray' ? 'bg-zinc-100' : 'bg-background'}>
            <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</div>
        </section>
    );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
    return (
        <div className="mb-5 flex items-end justify-between sm:mb-6">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
            {action}
        </div>
    );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function ExploreSection({ items }: { items: FoodItem[] }) {
    if (items.length === 0) return null;

    return (
        <Section tone="white">
            <SectionHeader title="Explore" />
            <div className="flex gap-8 overflow-x-auto pb-1 sm:gap-10">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={`/customer/food-items/${item.slug}`}
                        className="flex shrink-0 flex-col items-center gap-2.5 transition"
                    >
                        <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-amber-50 sm:size-24">
                            {item.image_url ? (
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <UtensilsCrossed className="size-8 text-amber-600 sm:size-10" />
                            )}
                        </span>
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </Link>
                ))}
            </div>
        </Section>
    );
}

/**
 * Top Pick's slides three restaurant cards at a time. We page in steps of
 * one card to avoid leftover blanks when the count isn't divisible by 3.
 */
function TopPicksSection({ restaurants }: { restaurants: DashboardRestaurant[] }) {
    const picks = useMemo(
        () =>
            [...restaurants]
                .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
                .slice(0, Math.max(restaurants.length, 0)),
        [restaurants],
    );

    const VISIBLE = 3;
    const [start, setStart] = useState(0);
    const maxStart = Math.max(0, picks.length - VISIBLE);

    if (picks.length === 0) return null;

    const canScroll = picks.length > VISIBLE;
    const prev = () => setStart((s) => Math.max(0, s - 1));
    const next = () => setStart((s) => Math.min(maxStart, s + 1));

    return (
        <Section tone="gray">
            <SectionHeader
                title="Top Pick's"
                action={
                    canScroll ? (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                aria-label="Previous"
                                onClick={prev}
                                disabled={start === 0}
                                className="flex size-9 items-center justify-center rounded-full border border-zinc-300 bg-background text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            <button
                                type="button"
                                aria-label="Next"
                                onClick={next}
                                disabled={start >= maxStart}
                                className="flex size-9 items-center justify-center rounded-full border border-zinc-300 bg-background text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    ) : undefined
                }
            />

            <div className="overflow-hidden">
                <div
                    className="flex gap-6 transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(calc(${-start} * ((100% - 3rem) / 3 + 1.5rem)))` }}
                >
                    {picks.map((r) => (
                        <Link
                            key={r.id}
                            href={`/customer/restaurants/${r.id}`}
                            className="group block shrink-0 basis-[calc((100%-3rem)/3)]"
                        >
                            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-zinc-200">
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
                            </div>
                            <div className="flex items-center justify-between pt-3">
                                <div className="min-w-0">
                                    <p className="truncate text-base font-semibold">{r.name}</p>
                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                        20-30 min
                                        {r.distance_miles !== null ? ` · ${r.distance_miles} mi` : r.city ? ` · ${r.city}` : ''}
                                    </p>
                                </div>
                                {r.rating !== null ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground">
                                        <Star className="size-3 fill-current" /> {r.rating.toFixed(1)}
                                        <span className="font-normal text-emerald-700/70">({r.total_reviews})</span>
                                    </span>
                                ) : null}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </Section>
    );
}

/**
 * Cuisines + promo banners live in the same white strip in the Figma —
 * not two stacked sections. Keep them grouped here so the visual rhythm
 * matches.
 */
function CuisinesAndPromoSection() {
    return (
        <Section tone="white">
            <SectionHeader title="Explore Cuisines" />
            <div className="flex gap-7 overflow-x-auto pb-1 sm:gap-8">
                {CUISINES.map((c, i) => (
                    <button
                        key={`${c.label}-${i}`}
                        type="button"
                        className="flex shrink-0 flex-col items-center gap-2.5 text-center"
                    >
                        <span className="size-20 overflow-hidden rounded-full sm:size-24">
                            <img src={c.image} alt={c.label} className="h-full w-full object-cover" loading="lazy" />
                        </span>
                        <span className="text-sm font-medium">{c.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {PROMOS.map((p, i) => (
                    <div
                        key={i}
                        className={`relative flex h-56 items-center overflow-hidden ${p.accent} px-8 sm:h-64`}
                    >
                        <div className="relative z-10 flex max-w-[55%] flex-col justify-between">
                            <div>
                                <p className="text-2xl font-bold text-foreground">{p.title}</p>
                                <p className="mt-2 text-base font-medium text-foreground/80">{p.subtitle}</p>
                                <p className="text-base font-medium text-foreground/80">{p.offer}</p>
                            </div>
                            <p className="mt-8 text-sm font-medium text-foreground/70">{p.meta}</p>
                        </div>
                        <img
                            src={p.image}
                            alt=""
                            className="absolute right-0 top-0 h-full w-1/2 object-cover"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </Section>
    );
}

function AllRestaurantsSection({
    restaurants,
    address,
    radiusMiles,
    usingFallback,
}: {
    restaurants: DashboardRestaurant[];
    address: DashboardAddress | null;
    radiusMiles: number;
    usingFallback: boolean;
}) {
    return (
        <Section tone="gray">
            <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">All Restaurants</h2>
                    {!usingFallback && address ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3.5" />
                            Within {radiusMiles} mi of {address.label ?? address.city ?? 'your saved address'}
                        </p>
                    ) : null}
                </div>
                <Link href="/customer/restaurants" className="text-sm font-semibold text-primary hover:underline">
                    View all
                </Link>
            </div>

            {restaurants.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-background p-10 text-center text-sm text-muted-foreground">
                    No restaurants {usingFallback ? 'available yet' : 'within range of your default address'}.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
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
                                        {r.distance_miles !== null ? ` · ${r.distance_miles} mi` : r.city ? ` · ${r.city}` : ''}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Save"
                                    className="shrink-0 text-muted-foreground transition hover:text-rose-500"
                                >
                                    <Heart className="size-5" />
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </Section>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CustomerHome({ dashboard }: DashboardProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title="Home" />

            <CustomerHeader />

            <main className="flex-1">
                <ExploreSection items={dashboard.food_items} />
                <TopPicksSection restaurants={dashboard.restaurants} />
                <CuisinesAndPromoSection />
                <AllRestaurantsSection
                    restaurants={dashboard.restaurants}
                    address={dashboard.address}
                    radiusMiles={dashboard.radius_miles}
                    usingFallback={dashboard.using_fallback}
                />
            </main>
        </div>
    );
}
