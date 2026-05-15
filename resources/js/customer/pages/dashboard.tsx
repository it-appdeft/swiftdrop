import { Head, Link } from '@inertiajs/react';
import { Heart, Star } from 'lucide-react';
import { CustomerHeader } from '../components/customer-header';
import { SiteFooter } from '../../web/components/site-footer';

// ─── Mock data — wire to backend resources when the catalogue endpoints land ─────

const EXPLORE = [
    { label: 'Pizza', emoji: '🍕' },
    { label: 'Burger', emoji: '🍔' },
    { label: 'Drinks', emoji: '🥤' },
    { label: 'Sandwich', emoji: '🥪' },
    { label: 'Pasta', emoji: '🍝' },
    { label: 'Ramen', emoji: '🍜' },
    { label: 'Dessert', emoji: '🍰' },
    { label: 'Sushi', emoji: '🍣' },
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
    { label: 'Salad', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop' },
    { label: 'Asian', image: 'https://images.unsplash.com/photo-1518983546435-91f8b87fe561?w=200&h=200&fit=crop' },
    { label: 'Mexican', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=200&fit=crop' },
    { label: 'Salad', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' },
];

const PROMOS = [
    {
        title: 'Kooker',
        subtitle: 'Special Birthday Offer up to 25%',
        meta: 'Up To 3 Delivery Promo',
        accent: 'bg-pink-100',
        image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=400&h=300&fit=crop',
    },
    {
        title: 'Kooker',
        subtitle: 'Special Birthday Offer up to 25%',
        meta: 'Up To 3 Delivery Promo',
        accent: 'bg-amber-100',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop',
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
        <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {action}
        </div>
    );
}

function ExploreSection() {
    return (
        <section className="bg-background py-4">
            <div className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6">
                <SectionHeader title="Explore" />
                <div className="flex gap-6 overflow-x-auto pb-1">
                    {EXPLORE.map((item, i) => (
                        <button
                            key={`${item.label}-${i}`}
                            type="button"
                            className="flex shrink-0 flex-col items-center gap-1.5 transition"
                        >
                            <span className="flex size-18 items-center justify-center rounded-full bg-amber-50 text-5xl">
                                {item.emoji}
                            </span>
                            <span className="text-xs font-medium text-foreground">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TopPicksSection() {
    return (
        <section className="bg-zinc-50 py-4">
            <div className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6">
                <SectionHeader title="Top Pick's" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {TOP_PICKS.map((r) => (
                        <Link
                            key={r.name}
                            href="#"
                            className="group overflow-hidden rounded-2xl bg-background shadow-sm transition hover:shadow-md"
                        >
                            <div className="aspect-[16/10] overflow-hidden">
                                <img
                                    src={r.image}
                                    alt={r.name}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                    loading="lazy"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3">
                                <div>
                                    <p className="text-sm font-semibold">{r.name}</p>
                                    <p className="text-[11px] text-muted-foreground">30-40 min · 1.4 mi</p>
                                </div>
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    <Star className="size-3 fill-current" /> {r.rating}
                                    <span className="ml-0.5 font-normal text-emerald-700/70">({r.reviews})</span>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CuisinesSection() {
    return (
        <section className="bg-background py-4">
            <div className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6">
                <SectionHeader title="Explore Cuisines" />
                <div className="flex gap-6 overflow-x-auto pb-1">
                    {CUISINES.map((c, i) => (
                        <button
                            key={`${c.label}-${i}`}
                            type="button"
                            className="flex shrink-0 flex-col items-center gap-2 text-center"
                        >
                            <span className="size-25 overflow-hidden rounded-full">
                                <img src={c.image} alt={c.label} className="h-full w-full object-cover" loading="lazy" />
                            </span>
                            <span className="text-xs font-medium">{c.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

function PromoSection() {
    return (
        <section className="bg-background py-4">
            <div className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {PROMOS.map((p, i) => (
                        <div
                            key={i}
                            className={`relative overflow-hidden rounded-2xl ${p.accent} p-5`}
                        >
                            <div className="relative z-10 max-w-[60%]">
                                <p className="text-sm font-bold">{p.title}</p>
                                <p className="mt-1 text-xs font-medium text-foreground/80">{p.subtitle}</p>
                                <p className="mt-3 inline-block rounded-md bg-white/70 px-2 py-1 text-[11px] font-semibold text-foreground/80">
                                    {p.meta}
                                </p>
                            </div>
                            <img
                                src={p.image}
                                alt=""
                                className="absolute right-0 top-0 h-full w-2/5 object-cover"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function AllRestaurantsSection() {
    return (
        <section className="bg-zinc-50 py-4">
            <div className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6">
                <SectionHeader
                    title="All Restaurants"
                    action={
                        <Link href="#" className="text-xs font-semibold text-primary hover:underline">
                            View all
                        </Link>
                    }
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {ALL_RESTAURANTS.map((r) => (
                        <Link
                            key={r.id}
                            href="#"
                            className="group overflow-hidden rounded-2xl bg-background shadow-sm transition hover:shadow-md"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <img
                                    src={r.image}
                                    alt={r.name}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                    loading="lazy"
                                />
                                <span className="absolute left-3 top-3 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                                    {r.discount}
                                </span>
                                <button
                                    type="button"
                                    aria-label="Save"
                                    className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-white/90 text-muted-foreground transition hover:text-rose-500"
                                >
                                    <Heart className="size-3.5" />
                                </button>
                                <span className="absolute right-3 bottom-3 inline-flex items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 shadow">
                                    <Star className="size-3 fill-current" /> {r.rating}
                                </span>
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-semibold">{r.name}</p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {r.eta} · {r.distance}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
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
                <CuisinesSection />
                <PromoSection />
                <AllRestaurantsSection />
            </main>

            <SiteFooter />
        </div>
    );
}
