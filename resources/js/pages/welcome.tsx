import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { type Variants, motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
    ArrowRight,
    BadgeCheck,
    ChefHat,
    Clock,
    MapPin,
    Package,
    ShieldCheck,
    Smartphone,
    Star,
    TrendingUp,
    Truck,
    Zap,
} from 'lucide-react';
import { useRef } from 'react';

// Typed bezier constants so TS treats them as 4-tuples, not number[]
type Bez = [number, number, number, number];
const EASE_OUT: Bez = [0.25, 1, 0.5, 1];

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
};

const stagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

const staggerFast: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
};

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};

// ─── Animated section wrapper ─────────────────────────────────────────────────

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
            {children}
        </motion.div>
    );
}

// ─── Stat item ────────────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: string; label: string }) {
    return (
        <motion.div variants={fadeUp} className="text-center">
            <p className="text-3xl font-bold tracking-tight sm:text-4xl">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </motion.div>
    );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <motion.div
            variants={scaleIn}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-6">
                {icon}
            </div>
            <h3 className="mb-2 text-base font-semibold">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </motion.div>
    );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <motion.div variants={fadeUp} className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {number}
                </div>
                <div className="mt-2 w-px flex-1 bg-border" />
            </div>
            <div className="pb-8">
                <h3 className="mb-1 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
        </motion.div>
    );
}

// ─── Phone mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -4 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.4 }}
            className="relative mx-auto w-64 sm:w-72"
            style={{ rotate: '-4deg' }}
        >
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative overflow-hidden rounded-[2.5rem] border-4 border-border bg-card shadow-xl"
            >
                <div className="flex items-center justify-between bg-primary px-5 py-3">
                    <span className="text-xs font-semibold text-primary-foreground">SwiftDrop</span>
                    <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
                        <div className="h-1.5 w-3 rounded-full bg-primary-foreground/70" />
                        <div className="h-1.5 w-4 rounded-full bg-primary-foreground" />
                    </div>
                </div>
                <div className="bg-background p-4">
                    <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Nearby restaurants</p>
                    {[
                        { name: 'Spice Garden', tag: 'Indian', time: '22 min', rating: '4.7' },
                        { name: 'Napoli Pizza', tag: 'Italian', time: '18 min', rating: '4.8' },
                        { name: 'Smash Burger Co.', tag: 'Burgers', time: '25 min', rating: '4.5' },
                    ].map((r, i) => (
                        <motion.div
                            key={r.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + i * 0.15 }}
                            className="mb-2 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5"
                        >
                            <div>
                                <p className="text-xs font-semibold">{r.name}</p>
                                <p className="text-[10px] text-muted-foreground">{r.tag}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-medium text-primary">{r.time}</p>
                                <p className="text-[10px] text-muted-foreground">★ {r.rating}</p>
                            </div>
                        </motion.div>
                    ))}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 }}
                        className="mt-3 rounded-xl bg-primary py-2.5 text-center"
                    >
                        <span className="text-xs font-semibold text-primary-foreground">Track my order →</span>
                    </motion.div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4, type: 'spring', stiffness: 200 }}
                className="absolute -right-8 top-10 rounded-xl border border-border bg-card px-3 py-2 shadow-lg"
            >
                <p className="text-xs font-semibold text-success">✓ Delivered!</p>
                <p className="text-[10px] text-muted-foreground">18 min avg</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, type: 'spring', stiffness: 200 }}
                className="absolute -left-10 bottom-16 rounded-xl border border-border bg-card px-3 py-2 shadow-lg"
            >
                <p className="text-xs font-semibold">150+ restaurants</p>
                <p className="text-[10px] text-muted-foreground">across 5 cities</p>
            </motion.div>
        </motion.div>
    );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
    const { scrollY } = useScroll();
    const navBg = useTransform(scrollY, [0, 60], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)']);
    const navShadow = useTransform(scrollY, [0, 60], ['0 0 0 0 transparent', '0 1px 0 0 rgba(0,0,0,0.06)']);

    return (
        <motion.nav style={{ backgroundColor: navBg, boxShadow: navShadow }} className="fixed inset-x-0 top-0 z-50 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2">
                    {/* <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                        <Zap className="size-4 text-primary-foreground" strokeWidth={2.5} />
                    </div> */}
                    <img src="/brand/icon.png" alt="SwiftDrop logo" className="size-8 rounded-lg bg-primary p-1" />
                    <span className="text-lg font-bold tracking-tight">SwiftDrop</span>
                </motion.div>

                <motion.div variants={staggerFast} initial="hidden" animate="visible" className="hidden items-center gap-8 md:flex">
                    {['Features', 'How it works', 'For restaurants', 'For drivers'].map((item) => (
                        <motion.a
                            key={item}
                            variants={fadeIn}
                            href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {item}
                        </motion.a>
                    ))}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-3">
                    {isLoggedIn ? (
                        <Link href={route('dashboard')} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                            Dashboard <ArrowRight className="size-3.5" />
                        </Link>
                    ) : (
                        <>
                            <Link href={route('login')} className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block">
                                Log in
                            </Link>
                            <Link href={route('login')} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                                Get started <ArrowRight className="size-3.5" />
                            </Link>
                        </>
                    )}
                </motion.div>
            </div>
        </motion.nav>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="SwiftDrop — Fast Food Delivery">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-background font-sans text-foreground antialiased">
                <Navbar isLoggedIn={!!auth.user} />

                {/* ─ Hero ─ */}
                <section className="relative overflow-hidden pt-24 pb-20 sm:pt-36 sm:pb-32">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10"
                        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, hsl(155 76% 43% / 0.12), transparent)' }}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.25]"
                        style={{
                            backgroundImage:
                                'linear-gradient(hsl(155 76% 43% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(155 76% 43% / 0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />

                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center">
                            {/* Copy */}
                            <div className="flex-1 text-center lg:text-left">
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary"
                                >
                                    <Zap className="size-3" /> Now live in 5 UK cities
                                </motion.div>

                                <motion.h1 variants={stagger} initial="hidden" animate="visible" className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                                    {['Food delivered', 'fast. From the', 'restaurants you love.'].map((line, i) => (
                                        <motion.span key={i} variants={fadeUp} className="block">
                                            {i === 2 ? <span className="text-primary">{line}</span> : line}
                                        </motion.span>
                                    ))}
                                </motion.h1>

                                <motion.p variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.5 }} className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
                                    SwiftDrop connects you with the best local restaurants and a network of vetted independent
                                    drivers. Order in minutes, track in real time.
                                </motion.p>

                                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                                    <Link
                                        href={auth.user ? route('dashboard') : route('login')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-primary/30 sm:w-auto"
                                    >
                                        Order now <ArrowRight className="size-4" />
                                    </Link>
                                    <a
                                        href="#how-it-works"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-muted sm:w-auto"
                                    >
                                        See how it works
                                    </a>
                                </motion.div>

                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="mt-8 flex flex-wrap items-center justify-center gap-5 lg:justify-start">
                                    {[
                                        { icon: <Star className="size-3.5 fill-current" />, text: '4.8 App rating' },
                                        { icon: <ShieldCheck className="size-3.5" />, text: 'Secure payments' },
                                        { icon: <Clock className="size-3.5" />, text: '18 min avg delivery' },
                                    ].map((item) => (
                                        <div key={item.text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span className="text-primary">{item.icon}</span>
                                            {item.text}
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Phone */}
                            <div className="flex flex-1 justify-center lg:justify-end">
                                <PhoneMockup />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─ Stats bar ─ */}
                <section className="border-y border-border bg-muted/30 py-12">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        <AnimatedSection className="grid grid-cols-2 gap-10 sm:grid-cols-4">
                            <StatItem value="50k+" label="Orders delivered" />
                            <StatItem value="150+" label="Partner restaurants" />
                            <StatItem value="5" label="UK cities" />
                            <StatItem value="4.8★" label="Customer rating" />
                        </AnimatedSection>
                    </div>
                </section>

                {/* ─ Features ─ */}
                <section id="features" className="py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <AnimatedSection className="mb-14 text-center">
                            <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                                Why SwiftDrop
                            </motion.p>
                            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Everything you need, nothing you don't
                            </motion.h2>
                            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-muted-foreground">
                                A platform built for speed — fast for customers to order, easy for restaurants to manage,
                                and rewarding for drivers to earn.
                            </motion.p>
                        </AnimatedSection>

                        <AnimatedSection className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <FeatureCard icon={<Zap />} title="Lightning fast ordering" description="Browse menus, customise your order, and check out in under 2 minutes. Real-time confirmation the moment a restaurant accepts." />
                            <FeatureCard icon={<MapPin />} title="Live order tracking" description="Follow your delivery from kitchen to doorstep on a live map. Get ETA updates as your driver gets closer." />
                            <FeatureCard icon={<ShieldCheck />} title="Secure payments" description="Card, open banking, or cash. Your payment details are tokenised — we never store raw card data." />
                            <FeatureCard icon={<Star />} title="Curated restaurants" description="Every restaurant on SwiftDrop is vetted. Food hygiene certificates checked, ratings verified, quality guaranteed." />
                            <FeatureCard icon={<Clock />} title="Schedule for later" description="Busy morning? Pre-schedule your order for exactly when you need it. We'll handle the rest." />
                            <FeatureCard icon={<Package />} title="Easy reordering" description="Your favourite orders are one tap away. Reorder last week's dinner in seconds — same restaurant, same items." />
                        </AnimatedSection>
                    </div>
                </section>

                {/* ─ How it works ─ */}
                <section id="how-it-works" className="bg-muted/30 py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
                            <AnimatedSection>
                                <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                                    How it works
                                </motion.p>
                                <motion.h2 variants={fadeUp} className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                    From craving to doorstep in minutes
                                </motion.h2>
                                <motion.p variants={fadeUp} className="mb-10 text-muted-foreground">
                                    We've streamlined every step so you spend less time waiting and more time eating.
                                </motion.p>
                                <div>
                                    <StepCard number="1" title="Pick your restaurant" description="Browse local restaurants filtered by cuisine, rating, or delivery time. Find exactly what you're in the mood for." />
                                    <StepCard number="2" title="Build your order" description="Choose dishes, add customisations, apply a promo code, and head to a secure checkout." />
                                    <StepCard number="3" title="Kitchen accepts & cooks" description="The restaurant confirms your order and starts preparing. You'll get a real-time notification the moment they accept." />
                                    <StepCard number="4" title="Driver picks up & delivers" description="A vetted SwiftDrop driver collects your food and heads straight to you. Track every metre on the map." />
                                </div>
                            </AnimatedSection>

                            {/* Card stack */}
                            <AnimatedSection className="hidden lg:flex lg:items-center lg:justify-center">
                                <div className="relative h-96 w-72">
                                    {[
                                        { label: 'Order placed', sub: 'Awaiting restaurant', top: '0%', left: '0%', rot: '-6deg' },
                                        { label: 'Restaurant confirmed', sub: 'Preparing your food', top: '18%', left: '14%', rot: '2deg' },
                                        { label: 'Driver assigned', sub: 'Ryan is on his way', top: '36%', left: '28%', rot: '-2deg' },
                                    ].map((card) => (
                                        <motion.div
                                            key={card.label}
                                            variants={scaleIn}
                                            style={{ position: 'absolute', top: card.top, left: card.left, rotate: card.rot } as React.CSSProperties}
                                            className="w-60 rounded-2xl border border-border bg-card p-5 shadow-lg"
                                        >
                                            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10">
                                                <Truck className="size-4 text-primary" />
                                            </div>
                                            <p className="font-semibold text-sm">{card.label}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <div className="h-1.5 flex-1 rounded-full bg-muted">
                                                    <div className="h-1.5 w-2/3 rounded-full bg-primary" />
                                                </div>
                                                <span className="text-xs font-medium text-primary">18 min</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ─ For restaurants ─ */}
                <section id="for-restaurants" className="py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-12 lg:grid-cols-2">
                            <AnimatedSection>
                                <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                                    For restaurants
                                </motion.p>
                                <motion.h2 variants={fadeUp} className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Grow your restaurant with zero faff
                                </motion.h2>
                                <motion.p variants={fadeUp} className="mb-8 text-muted-foreground">
                                    Join SwiftDrop and reach thousands of new customers in your area. Our platform handles
                                    orders, logistics, and payments so you can focus on the food.
                                </motion.p>
                                <AnimatedSection className="space-y-4">
                                    {[
                                        { icon: <TrendingUp />, title: 'Reach more customers', desc: "Get in front of hungry locals who haven't discovered you yet." },
                                        { icon: <ChefHat />, title: 'You control the menu', desc: 'Update prices, availability, and descriptions in real time from your dashboard.' },
                                        { icon: <BadgeCheck />, title: 'Transparent commission', desc: 'A simple, flat commission rate — no hidden fees, no surprises on payout day.' },
                                    ].map((item) => (
                                        <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{item.title}</p>
                                                <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatedSection>
                                <motion.div variants={fadeUp} className="mt-8">
                                    <Link href={route('login')} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                                        Partner with us <ArrowRight className="size-4" />
                                    </Link>
                                </motion.div>
                            </AnimatedSection>

                            {/* Stats cards */}
                            <AnimatedSection className="flex justify-center lg:justify-end">
                                <motion.div variants={scaleIn} className="w-full max-w-sm space-y-4">
                                    {[
                                        { label: 'Weekly orders', value: '248', change: '+12%' },
                                        { label: 'Revenue this month', value: '£4,820', change: '+8%' },
                                        { label: 'Average rating', value: '4.7 ★', change: null },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, x: 30 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.15, duration: 0.5 }}
                                            className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-sm"
                                        >
                                            <div>
                                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                                <p className="mt-0.5 text-xl font-bold">{stat.value}</p>
                                            </div>
                                            {stat.change && (
                                                <span className="rounded-lg bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                                                    {stat.change}
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ─ For drivers ─ */}
                <section id="for-drivers" className="bg-muted/30 py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-12 lg:grid-cols-2">
                            {/* Earnings card */}
                            <AnimatedSection className="order-2 flex justify-center lg:order-1 lg:justify-start">
                                <motion.div variants={scaleIn} className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-md">
                                    <p className="mb-1 text-sm text-muted-foreground">Earnings this week</p>
                                    <p className="mb-6 text-4xl font-bold">£312.50</p>
                                    <div className="mb-4 flex h-20 items-end gap-1">
                                        {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scaleY: 0 }}
                                                whileInView={{ scaleY: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                                                style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                                                className="flex-1 rounded-t-md bg-primary/25"
                                            />
                                        ))}
                                    </div>
                                    <div className="mb-5 flex justify-between text-[10px] text-muted-foreground">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                                            <span key={d}>{d}</span>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        {[{ l: 'Deliveries', v: '47' }, { l: 'Avg / trip', v: '£6.65' }, { l: 'Rating', v: '4.9★' }].map((s) => (
                                            <div key={s.l} className="flex-1 rounded-xl bg-muted/60 px-2 py-2.5 text-center">
                                                <p className="text-[10px] text-muted-foreground">{s.l}</p>
                                                <p className="mt-0.5 text-sm font-bold">{s.v}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatedSection>

                            <AnimatedSection className="order-1 lg:order-2">
                                <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                                    For drivers
                                </motion.p>
                                <motion.h2 variants={fadeUp} className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Earn on your own schedule
                                </motion.h2>
                                <motion.p variants={fadeUp} className="mb-8 text-muted-foreground">
                                    Drive when you want, rest when you need. SwiftDrop's driver app gives you full
                                    control of your earnings with transparent pay and instant cashout.
                                </motion.p>
                                <AnimatedSection className="space-y-4">
                                    {[
                                        { icon: <Smartphone />, title: 'Go online in one tap', desc: 'Toggle availability from the app. Accept or decline jobs — no penalties, no pressure.' },
                                        { icon: <TrendingUp />, title: 'Real-time earnings', desc: 'Watch your balance grow after every delivery. Weekly payouts direct to your bank.' },
                                        { icon: <ShieldCheck />, title: 'Fully insured', desc: 'All SwiftDrop drivers are covered during active deliveries. Your safety matters.' },
                                    ].map((item) => (
                                        <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{item.title}</p>
                                                <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatedSection>
                                <motion.div variants={fadeUp} className="mt-8">
                                    <Link href={route('login')} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                                        Start delivering <ArrowRight className="size-4" />
                                    </Link>
                                </motion.div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ─ CTA ─ */}
                <section className="relative overflow-hidden py-20 sm:py-28">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10"
                        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, hsl(155 76% 43% / 0.1), transparent)' }}
                    />
                    <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
                        <AnimatedSection>
                            <motion.div variants={scaleIn} className="mb-8 inline-flex size-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
                                <Zap className="size-8 text-primary-foreground" strokeWidth={2} />
                            </motion.div>
                            <motion.h2 variants={fadeUp} className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                Ready to order your first meal?
                            </motion.h2>
                            <motion.p variants={fadeUp} className="mb-8 text-lg text-muted-foreground">
                                Join thousands of happy customers across London, Manchester, Birmingham, Leeds, and Bristol.
                            </motion.p>
                            <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                <Link
                                    href={auth.user ? route('dashboard') : route('login')}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-xl sm:w-auto"
                                >
                                    {auth.user ? 'Go to dashboard' : "Order now — it's free"} <ArrowRight className="size-4" />
                                </Link>
                            </motion.div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ─ Footer ─ */}
                <footer className="border-t border-border bg-muted/20 py-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
                                    <Zap className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
                                </div>
                                <span className="font-bold">SwiftDrop</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                © {new Date().getFullYear()} SwiftDrop Ltd. Registered in England & Wales.
                            </p>
                            <div className="flex gap-5 text-xs text-muted-foreground">
                                {['Privacy', 'Terms', 'Contact'].map((l) => (
                                    <a key={l} href="#" className="transition-colors hover:text-foreground">{l}</a>
                                ))}
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
