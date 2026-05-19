import { Head, Link } from '@inertiajs/react';
import { Heart, Star } from 'lucide-react';
import { CustomerHeader } from '../components/customer-header';
import { SiteFooter } from '../../web/components/site-footer';

// ─── Mock data — wire to backend resources when the catalogue endpoints land ─────

const EXPLORE = [
    { label: 'Pizza', emoji: '🍕' },
    { label: 'Momos', emoji: '🥟' },
    { label: 'Drinks', emoji: '🥤' },
    { label: 'Sandwiches', emoji: '🥪' },
    { label: 'Pizza', emoji: '🍕' },
    { label: 'Momos', emoji: '🥟' },
    { label: 'Drinks', emoji: '🥤' },
];

const TOP_PICKS = [
    {
        name: "McDonald's",
        rating: 4.6,
        reviews: '5,236',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=500&fit=crop',
    },
    {
        name: 'Handmade Burger',
        rating: 4.5,
        reviews: '3,128',
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=500&fit=crop',
    },
    {
        name: 'My World Pizza',
        rating: 4.7,
        reviews: '8,902',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop',
    },
];

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

const RESTAURANT_IMAGES = [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=450&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=450&fit=crop',
];

const ALL_RESTAURANTS = Array.from({ length: 9 }).map((_, i) => ({
    id: i + 1,
    name: i % 2 === 0 ? 'The Mocha Grill' : 'My World Pizza',
    discount: '30% OFF select menu',
    rating: 4.6,
    distance: '1.2 mi',
    eta: '25-30 min',
    image: RESTAURANT_IMAGES[i % RESTAURANT_IMAGES.length],
}));

// ─── Sections ────────────────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
    return (
        <div className="mb-5 flex items-end justify-between sm:mb-6">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
            {action}
        </div>
    );
}

/**
 * Sections in the Figma run edge-to-edge with sharp corners and alternate
 * between white and light-gray fills (not rounded cards floating on a gray
 * canvas). `tone` controls which side of that zebra a section sits on; the
 * inner div re-centres the content to the layout's max width.
 */
function Section({ tone, children }: { tone: 'white' | 'gray'; children: React.ReactNode }) {
    return (
        <section className={tone === 'gray' ? 'bg-zinc-100' : 'bg-background'}>
            <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</div>
        </section>
    );
}

function ExploreSection() {
    return (
        <Section tone="white">
            <SectionHeader title="Explore" />
            <div className="flex gap-8 overflow-x-auto pb-1 sm:gap-10">
                {EXPLORE.map((item, i) => (
                    <button
                        key={`${item.label}-${i}`}
                        type="button"
                        className="flex shrink-0 flex-col items-center gap-2.5 transition"
                    >
                        <span className="flex size-20 items-center justify-center rounded-full bg-amber-50 text-5xl sm:size-24 sm:text-6xl">
                            {item.emoji}
                        </span>
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </button>
                ))}
            </div>
        </Section>
    );
}

function TopPicksSection() {
    return (
        <Section tone="gray">
            <SectionHeader title="Top Pick's" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
                {TOP_PICKS.map((r) => (
                    <Link
                        key={r.name}
                        href="#"
                        className="group block transition"
                    >
                        <div className="aspect-[16/10] overflow-hidden rounded-xl">
                            <img
                                src={r.image}
                                alt={r.name}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-3">
                            <div>
                                <p className="text-base font-semibold">{r.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">30-40 min · 1.4 mi</p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground">
                                <Star className="size-3 fill-current" /> {r.rating}
                                <span className="font-normal text-emerald-700/70">({r.reviews})</span>
                            </span>
                        </div>
                    </Link>
                ))}
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

function AllRestaurantsSection() {
    return (
        <Section tone="gray">
            <SectionHeader
                title="All Restaurants"
                action={
                    <Link href="#" className="text-sm font-semibold text-primary hover:underline">
                        View all
                    </Link>
                }
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
                {ALL_RESTAURANTS.map((r) => (
                    <Link
                        key={r.id}
                        href="#"
                        className="group block"
                    >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                            <img
                                src={r.image}
                                alt={r.name}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                                loading="lazy"
                            />
                            <span className="absolute bottom-3 left-3 rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                                {r.discount}
                            </span>
                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-emerald-700 shadow">
                                <Star className="size-3 fill-current text-amber-500" /> {r.rating}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pt-3">
                            <div>
                                <p className="text-base font-semibold">{r.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {r.eta} · {r.distance}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Save"
                                className="text-muted-foreground transition hover:text-rose-500"
                            >
                                <Heart className="size-5" />
                            </button>
                        </div>
                    </Link>
                ))}
            </div>
        </Section>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function CustomerHome() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title="Home" />

            <CustomerHeader />

            <main className="flex-1">
                <ExploreSection />
                <TopPicksSection />
                <CuisinesAndPromoSection />
                <AllRestaurantsSection />
            </main>

            {/* <SiteFooter /> */}
        </div>
    );
}
