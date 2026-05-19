import { Head, Link } from '@inertiajs/react';
import { ChevronDown, Clock, Heart, MapPin, Search, Star } from 'lucide-react';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';

const CUISINES = [
    {
        label: 'Pizza',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=240&h=240&fit=crop',
    },
    {
        label: 'Burger',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=240&h=240&fit=crop',
    },
    {
        label: 'Sushi',
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=240&h=240&fit=crop',
    },
    {
        label: 'Sandwich',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=240&h=240&fit=crop',
    },
    {
        label: 'Pasta',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=240&h=240&fit=crop',
    },
    {
        label: 'Ramen',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=240&h=240&fit=crop',
    },
    {
        label: 'Salad',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=240&h=240&fit=crop',
    },
    {
        label: 'Dessert',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=240&h=240&fit=crop',
    },
];

const RESTAURANTS = [
    {
        name: 'The Marble Grill',
        eta: '20-30 min',
        distance: '4.9 mi',
        discount: '60% OFF select items',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&h=720&fit=crop',
    },
    {
        name: 'My World Pizza',
        eta: '20-30 min',
        distance: '5.9 mi',
        discount: '20% OFF select items',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&h=720&fit=crop',
    },
    {
        name: 'My World Pizza',
        eta: '20-30 min',
        distance: '5.9 mi',
        discount: '20% OFF select items',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900&h=720&fit=crop',
    },
];

const STEPS = [
    {
        title: 'Selection',
        description:
            'Choose from an exclusive list of top-tier restaurants and artisanal kitchens.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
                <path d="m15 14 2 2 3-3" />
            </svg>
        ),
    },
    {
        title: 'Priority Transit',
        description:
            "Our dedicated couriers ensure your meal arrives in peak condition with white-glove care.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
                <circle cx="6" cy="17" r="3" />
                <circle cx="18" cy="17" r="3" />
                <path d="M8 17h7l-2-5h3l2 3" />
                <path d="M5 12h4l-1-3H6" />
            </svg>
        ),
    },
    {
        title: 'Enjoy Fresh',
        description:
            'Savor the restaurant experience from the comfort and privacy of your home.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
                <path d="M3 11h18" />
                <path d="M5 11a7 7 0 0 1 14 0" />
                <path d="M3 15h18" />
                <path d="M8 7V4M12 7V3M16 7V4" />
            </svg>
        ),
    },
];

const HERO_IMAGE = '/assets/images/landing-home-banner.png';

// Inline iPhone mockups — Tailwind + Unsplash food photos. Designed for the
// "Elevate Your Dining Experience" CTA: two phones tilted slightly outward,
// each showing a different app screen.

const PHONE_FOOD_A = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=240&h=180&fit=crop';
const PHONE_FOOD_B = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=240&h=180&fit=crop';
const PHONE_FOOD_C = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=240&h=180&fit=crop';
const PHONE_FOOD_D = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=240&h=180&fit=crop';

function PhoneFrame({
    rotation,
    className,
    children,
}: {
    rotation: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`relative overflow-hidden rounded-[2rem] border-[6px] border-zinc-900 bg-zinc-900 shadow-2xl ${rotation} ${className ?? ''}`}
        >
            {/* Notch */}
            <div className="pointer-events-none absolute left-1/2 top-1.5 z-10 h-2 w-10 -translate-x-1/2 rounded-full bg-zinc-900" />
            <div className="size-full overflow-hidden rounded-[1.5rem] bg-white">
                {children}
            </div>
        </div>
    );
}

// Left phone — "Discover" screen: location, cuisine row, Top Picks grid.
function PhoneScreenA() {
    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex items-center gap-1.5 bg-white px-3 pt-4 pb-1.5">
                <MapPin className="size-2.5 text-emerald-600" />
                <span className="text-[7px] font-semibold text-zinc-900">West Coker, Yelovil, UK</span>
            </div>
            <div className="px-3 pb-2">
                <div className="flex h-4 items-center rounded-md bg-zinc-100 px-1.5 text-[6px] text-zinc-500">
                    Search dishes & restaurants
                </div>
            </div>
            <div className="flex justify-between gap-1.5 px-3 pb-2">
                {[
                    { label: 'Pizza', color: 'bg-orange-200' },
                    { label: 'Momo', color: 'bg-rose-200' },
                    { label: 'Drinks', color: 'bg-amber-200' },
                    { label: 'Sandwich', color: 'bg-lime-200' },
                ].map((c) => (
                    <div key={c.label} className="flex flex-col items-center gap-0.5">
                        <span className={`size-5 rounded-full ${c.color}`} />
                        <span className="text-[5px] font-medium text-zinc-700">{c.label}</span>
                    </div>
                ))}
            </div>
            <div className="bg-amber-50 px-3 pt-2">
                <p className="text-[8px] font-bold text-zinc-900">Top Pick's</p>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-1.5 bg-amber-50 px-3 pb-3 pt-1.5">
                <div className="overflow-hidden rounded-md">
                    <img src={PHONE_FOOD_A} alt="" className="size-full object-cover" loading="lazy" />
                </div>
                <div className="overflow-hidden rounded-md">
                    <img src={PHONE_FOOD_B} alt="" className="size-full object-cover" loading="lazy" />
                </div>
            </div>
        </div>
    );
}

// Right phone — restaurant menu screen with Restaurants/Dishes tabs.
function PhoneScreenB() {
    const dishes = [
        { name: 'The Marble Grill', sub: 'Margherita Ultimate Cheese Pizza', price: '£8.23', img: PHONE_FOOD_C },
        { name: 'World Pizza', sub: 'Margherita Pizza Giant Slice', price: '£8.23', img: PHONE_FOOD_D },
        { name: 'Sweet Corn Pizza', sub: 'Margherita Pizza Giant Slice', price: '£8.23', img: PHONE_FOOD_A },
    ];

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-3 pt-4 pb-1.5">
                <span className="inline-flex items-center gap-1 text-[7px] font-semibold text-zinc-900">
                    <Search className="size-2.5 text-emerald-600" />
                    Pizza
                </span>
                <span className="text-[6px] text-zinc-500">highest rated</span>
            </div>
            <div className="border-b border-zinc-100 px-3 pt-1.5 pb-1">
                <p className="text-[7px] font-semibold text-zinc-900">Search dishes & restaurants</p>
            </div>
            <div className="flex gap-3 border-b border-zinc-100 px-3 py-1.5 text-[6px] font-semibold">
                <span className="text-zinc-400">Restaurants</span>
                <span className="border-b-2 border-emerald-600 pb-0.5 text-zinc-900">Dishes</span>
            </div>
            <div className="flex-1 space-y-2 px-3 py-2">
                {dishes.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                        <div className="relative size-9 shrink-0 overflow-hidden rounded-md">
                            <img src={d.img} alt="" className="size-full object-cover" loading="lazy" />
                            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-sm border border-emerald-600 bg-white px-1 text-[5px] font-semibold text-emerald-600">
                                ADD
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[7px] font-semibold text-zinc-900">{d.name}</p>
                            <p className="text-[5px] leading-tight text-zinc-500">{d.sub}</p>
                            <p className="mt-0.5 text-[6px] font-semibold text-zinc-900">{d.price}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Welcome() {
    return (
        <>
            <Head title="Order food, fast — Swiftdrop" />

            <div className="flex min-h-screen flex-col bg-background">
                <SiteHeader />

                {/* Hero ------------------------------------------------------------- */}
                <section className="relative isolate overflow-hidden text-white">
                    <img
                        src={HERO_IMAGE}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 -z-20 size-full object-cover"
                    />
                    {/* Dark green tint for headline contrast over banner image. */}
                    <div className="absolute inset-0 -z-10 bg-emerald-950/40" />

                    <div className="mx-auto flex min-h-[480px] max-w-7xl flex-col justify-center px-4 py-16 sm:min-h-[560px] sm:px-6 sm:py-20 lg:min-h-[640px] lg:px-8 lg:py-28">
                        <h1 className="mx-auto max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[56px] lg:leading-[1.1]">
                            <span className="text-emerald-300">Order food.</span>{' '}
                            <span className="text-white">Discover best restaurants. Swiftdrop it!</span>
                        </h1>

                        <div className="mx-auto mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground" />
                                <input
                                    type="text"
                                    placeholder="Enter your delivery location"
                                    className="h-12 w-full rounded-lg bg-white pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <ChevronDown className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground" />
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search restaurant or dishes"
                                    className="h-12 w-full rounded-lg bg-white pl-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Explore Cuisines ------------------------------------------------- */}
                <section className="bg-zinc-50 py-10 sm:py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Explore Cuisines</h2>
                        <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6 sm:gap-4 md:grid-cols-8">
                            {CUISINES.map((c, i) => (
                                <button
                                    key={`${c.label}-${i}`}
                                    type="button"
                                    className="group flex flex-col items-center gap-2 transition hover:opacity-80"
                                >
                                    <span className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm transition group-hover:shadow-md sm:size-[72px]">
                                        <img
                                            src={c.image}
                                            alt={c.label}
                                            loading="lazy"
                                            className="size-full object-cover"
                                        />
                                    </span>
                                    <span className="text-xs font-medium text-foreground sm:text-sm">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* All Restaurants -------------------------------------------------- */}
                <section className="bg-background py-10 sm:py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">All Restaurants</h2>
                                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                    Explore all restaurants available near you.
                                </p>
                            </div>
                            <Link
                                href="#"
                                className="shrink-0 text-sm font-semibold italic text-primary underline-offset-4 hover:underline"
                            >
                                View all →
                            </Link>
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {RESTAURANTS.map((r, i) => (
                                <div key={`${r.name}-${i}`} className="overflow-hidden">
                                    <Link href="#" className="group block">
                                        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                                            <img
                                                src={r.image}
                                                alt={r.name}
                                                loading="lazy"
                                                className="size-full object-cover transition group-hover:scale-105"
                                            />
                                            <span className="absolute bottom-3 left-3 rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                                                {r.discount}
                                            </span>
                                            <span className="absolute right-3 top-3 inline-flex items-center gap-0.5 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-amber-600 shadow-sm">
                                                <Star className="size-3 fill-current" />
                                                {r.rating}
                                            </span>
                                        </div>
                                    </Link>
                                    <div className="flex items-start justify-between gap-2 px-1 pt-3">
                                        <div>
                                            <p className="text-sm font-semibold">{r.name}</p>
                                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs">
                                                <Clock className="size-3 text-emerald-600" />
                                                {r.eta}
                                                <span className="px-0.5">|</span>
                                                {r.distance}
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
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works ----------------------------------------------------- */}
                <section className="bg-zinc-50 py-12 sm:py-16">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How It Works</h2>
                        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
                            The seamless journey from the chef's hands to your table, powered by elite
                            logistics.
                        </p>
                        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6 md:gap-8">
                            {STEPS.map((step) => (
                                <div key={step.title} className="flex flex-col items-center text-center">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                        {step.icon}
                                    </div>
                                    <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                                    <p className="mt-2 max-w-[280px] text-xs text-muted-foreground sm:text-sm">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* App Promo -------------------------------------------------------- */}
                <section className="bg-background py-10 sm:py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 lg:h-[400px] lg:px-14 lg:py-12">
                            {/* Black frame around the phones-only half (right side
                                of the card) — matches the figma where the border
                                hugs the phone artwork, not the whole promo card.
                                Only visible at lg+ where the phones render and
                                actually fill that half. */}
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-1/2 rounded-r-3xl border-2 border-black lg:block"
                            />
                            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
                                <div className="max-w-xl">
                                    <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                                        Elevate Your Dining Experience
                                    </h2>
                                    <p className="mt-3 max-w-sm text-sm text-primary-foreground/90">
                                        Get real-time tracking, exclusive partner rewards, and tailored
                                        recommendations with the Swift Drop app.
                                    </p>
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <a
                                            href="#"
                                            aria-label="Download on the App Store"
                                            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-white"
                                        >
                                            <svg
                                                className="size-6"
                                                viewBox="0 0 384 512"
                                                fill="currentColor"
                                                aria-hidden
                                            >
                                                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.1 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                            </svg>
                                            <span className="flex flex-col items-start leading-tight">
                                                <span className="text-[9px] uppercase tracking-wide">
                                                    Download on the
                                                </span>
                                                <span className="text-sm font-semibold">App Store</span>
                                            </span>
                                        </a>
                                        <a
                                            href="#"
                                            aria-label="Get it on Google Play"
                                            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-white"
                                        >
                                            <svg
                                                className="size-6"
                                                viewBox="0 0 256 256"
                                                aria-hidden
                                            >
                                                <path
                                                    fill="#00D7FE"
                                                    d="M11.5 14.3C8.9 17 7.5 21.3 7.5 26.8v202.4c0 5.5 1.4 9.8 4 12.5L139.6 128 11.5 14.3z"
                                                />
                                                <path
                                                    fill="#FFCE00"
                                                    d="m177.6 166-38-38 38-38 50.4 28.6c14.4 8.2 14.4 21.6 0 29.9L177.6 166z"
                                                />
                                                <path
                                                    fill="#FF3A44"
                                                    d="M178.7 165 139.6 128 11.5 241.7c5 5.4 13.3 6 22.7.7L178.7 165z"
                                                />
                                                <path
                                                    fill="#00F076"
                                                    d="M178.7 91 34.2 13.6C24.8 8.3 16.5 8.9 11.5 14.3L139.6 128l39.1-37z"
                                                />
                                            </svg>
                                            <span className="flex flex-col items-start leading-tight">
                                                <span className="text-[9px] uppercase tracking-wide">Get it on</span>
                                                <span className="text-sm font-semibold">Google Play</span>
                                            </span>
                                        </a>
                                    </div>
                                </div>

                                {/* Below lg the grid stacks, so the phones live in
                                    the second column as a regular in-flow image so
                                    they appear under the copy. At lg+ this column is
                                    just a placeholder and the absolutely-positioned
                                    phones below take over. */}
                                <div className="flex justify-center lg:block">
                                    <img
                                        src="/assets/images/phones.png"
                                        alt=""
                                        aria-hidden
                                        className="block h-auto max-h-[340px] w-auto select-none sm:max-h-[400px] lg:hidden"
                                    />
                                </div>
                            </div>

                            {/* Phones — single mockup PNG anchored to the card.
                                Bottom extends past the card via negative offset, and
                                the card's overflow-hidden crops it for the "popping
                                out" effect in the Figma. Only shown at lg+ where the
                                card is wide enough to host them without crowding the
                                copy column; offset scales with breakpoint so the
                                phones don't kiss the card edge on smaller desktops. */}
                            <img
                                src="/assets/images/phones.png"
                                alt=""
                                aria-hidden
                                className="pointer-events-none absolute top-10 right-6 hidden h-[380px] w-auto select-none lg:block lg:h-[420px] xl:right-12 xl:h-[440px]"
                            />
                        </div>
                    </div>
                </section>

                <SiteFooter />
            </div>
        </>
    );
}
