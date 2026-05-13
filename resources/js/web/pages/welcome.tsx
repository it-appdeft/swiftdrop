import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head, Link } from '@inertiajs/react';
import { MapPin, Package, Search, Sparkles, Zap } from 'lucide-react';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';

const CUISINES = [
    { label: 'Pizza', emoji: '🍕' },
    { label: 'Burger', emoji: '🍔' },
    { label: 'Sushi', emoji: '🍣' },
    { label: 'Sandwich', emoji: '🥪' },
    { label: 'Pasta', emoji: '🍝' },
    { label: 'Ramen', emoji: '🍜' },
    { label: 'Salad', emoji: '🥗' },
    { label: 'Dessert', emoji: '🧁' },
];

const RESTAURANTS = [
    { name: 'The Mocha Grill', location: '20-25 min', distance: '1.2 mi', emoji: '🍕' },
    { name: 'My World Pizza', location: '15-20 min', distance: '0.8 mi', emoji: '🍝' },
    { name: 'Smash Burger Co.', location: '25-30 min', distance: '2.1 mi', emoji: '🍔' },
];

const STEPS = [
    {
        icon: Sparkles,
        title: 'Selection',
        description: 'Choose from a curated list of top restaurants in your area, powered by local data.',
    },
    {
        icon: Zap,
        title: 'Priority Transit',
        description: 'Our riders prioritize your food and route freshness with smart dispatching.',
    },
    {
        icon: Package,
        title: 'Enjoy Fresh',
        description: 'Track every step from kitchen to doorstep and enjoy a hot, fresh delivery.',
    },
];

export default function Welcome() {
    return (
        <>
            <Head title="Order food, fast — Swiftdrop" />

            <div className="flex min-h-screen flex-col bg-background">
                <SiteHeader />

                {/* Hero */}
                <section className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.25),transparent_55%)]" />
                    <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                Order food. Discover best restaurants.{' '}
                                <span className="text-emerald-400">Swiftdrop it!</span>
                            </h1>
                        </div>

                        <div className="mx-auto mt-10 max-w-3xl">
                            <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Enter your delivery location"
                                        className="border-0 pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                                    />
                                </div>
                                <div className="relative flex-1 border-t border-border pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:left-6" />
                                    <Input
                                        type="text"
                                        placeholder="Search restaurants or cuisine"
                                        className="border-0 pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 sm:pl-12"
                                    />
                                </div>
                                <Button size="lg" className="h-11 px-8">
                                    Find food
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Explore Cuisines */}
                <section className="bg-background py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold tracking-tight">Explore Cuisines</h2>
                        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                            {CUISINES.map((c) => (
                                <button
                                    key={c.label}
                                    type="button"
                                    className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card px-5 py-4 text-sm font-medium transition hover:border-primary hover:shadow-md"
                                >
                                    <span className="text-3xl">{c.emoji}</span>
                                    <span>{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* All Restaurants */}
                <section className="bg-background py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-end justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">All Restaurants</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Discover all the restaurants in your area</p>
                            </div>
                            <Link href="#" className="text-sm font-medium text-primary hover:underline">
                                View all
                            </Link>
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {RESTAURANTS.map((r) => (
                                <Link
                                    key={r.name}
                                    href="#"
                                    className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-lg"
                                >
                                    <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-orange-100 to-amber-200 text-7xl">
                                        {r.emoji}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold">{r.name}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {r.location} · {r.distance}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="bg-background py-14">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        <h2 className="text-center text-2xl font-bold tracking-tight">How It Works</h2>
                        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
                            The seamless journey from the chef's hands to your table, powered by lithe logistics.
                        </p>
                        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
                            {STEPS.map((step) => (
                                <div key={step.title} className="text-center">
                                    <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                        <step.icon className="size-7" />
                                    </div>
                                    <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA — Elevate Your Dining Experience */}
                <section className="bg-background pb-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-8 py-12 text-white sm:px-12">
                            <div className="grid items-center gap-8 md:grid-cols-2">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                        Elevate Your Dining Experience
                                    </h2>
                                    <p className="mt-3 max-w-md text-sm text-emerald-50">
                                        Get the Swiftdrop app to unlock faster ordering, real-time tracking and exclusive
                                        offers on every delivery.
                                    </p>
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <a
                                            href="#"
                                            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium"
                                        >
                                            <span className="text-xl">🍎</span>
                                            <span className="flex flex-col items-start leading-tight">
                                                <span className="text-[10px]">Download on the</span>
                                                <span className="text-sm font-semibold">App Store</span>
                                            </span>
                                        </a>
                                        <a
                                            href="#"
                                            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium"
                                        >
                                            <span className="text-xl">▶</span>
                                            <span className="flex flex-col items-start leading-tight">
                                                <span className="text-[10px]">Get it on</span>
                                                <span className="text-sm font-semibold">Google Play</span>
                                            </span>
                                        </a>
                                    </div>
                                </div>
                                <div className="flex justify-center md:justify-end">
                                    <div className="relative size-64 rounded-[2.5rem] border-8 border-black bg-white shadow-2xl">
                                        <div className="absolute inset-2 flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-100 to-amber-100 text-6xl">
                                            📱
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <SiteFooter />
            </div>
        </>
    );
}
