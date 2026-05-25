import { Head, router } from '@inertiajs/react';
import { Heart, Minus, Plus, Search as SearchIcon, Star, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CustomerHeader } from '../components/customer-header';
import { SiteFooter } from '../../web/components/site-footer';

interface Dish {
    id: number;
    name: string;
    description: string | null;
    price: number;
    is_veg: boolean;
    image_url: string | null;
    rating: number | null;
}

interface RestaurantHeader {
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
    description: string | null;
    is_top_rated: boolean;
}

interface Props {
    restaurant: {
        restaurant: RestaurantHeader;
        keyword: string;
        menu: Dish[];
        recommended: Dish[];
    };
}

type Diet = 'all' | 'veg' | 'non_veg';

const DESCRIPTION_TRUNCATE = 120;

/** Client-side diet + minimum-rating filter applied to both menu lists. */
function filterDishes(dishes: Dish[], diet: Diet, minRating: boolean): Dish[] {
    return dishes.filter((d) => {
        if (diet === 'veg' && !d.is_veg) return false;
        if (diet === 'non_veg' && d.is_veg) return false;
        if (minRating && d.rating !== null && d.rating < 4.0) return false;
        return true;
    });
}

export default function CustomerRestaurant({ restaurant: data }: Props) {
    const r = data.restaurant;

    const [query, setQuery] = useState(data.keyword);
    const [diet, setDiet] = useState<Diet>('all');
    const [minRating, setMinRating] = useState(true); // "Ratings 4.0+" chip starts active (matches design)

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(`/customer/restaurants/${r.id}`, { q: query }, { preserveScroll: true, preserveState: false });
    };

    const menu = useMemo(() => filterDishes(data.menu, diet, minRating), [data.menu, diet, minRating]);
    const recommended = useMemo(
        () => filterDishes(data.recommended, diet, minRating),
        [data.recommended, diet, minRating],
    );

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title={r.name} />
            <CustomerHeader />

            <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
                {/* Hero banner */}
                <section className="relative overflow-hidden rounded-2xl bg-zinc-800">
                    {r.cover_url || r.logo_url ? (
                        <img
                            src={(r.cover_url ?? r.logo_url)!}
                            alt={r.name}
                            className="h-72 w-full object-cover sm:h-80"
                        />
                    ) : (
                        <div className="flex h-72 w-full items-center justify-center text-6xl font-bold text-zinc-500 sm:h-80">
                            {r.name.charAt(0)}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                        <div className="mb-2 flex items-center gap-3">
                            {r.is_top_rated ? (
                                <span className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    Top Rated
                                </span>
                            ) : null}
                            {r.rating !== null ? (
                                <span className="inline-flex items-center gap-1 text-sm font-medium text-white">
                                    <Star className="size-4 fill-amber-400 text-amber-400" />
                                    {r.rating.toFixed(1)} ({formatReviews(r.total_reviews)})
                                </span>
                            ) : null}
                        </div>
                        <h1 className="text-3xl font-bold text-white sm:text-4xl">{r.name}</h1>
                        {r.description ? (
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{r.description}</p>
                        ) : null}
                    </div>
                </section>

                {/* In-restaurant search */}
                <form
                    onSubmit={submitSearch}
                    className="mt-6 flex h-14 items-center gap-2 rounded-lg border border-zinc-200 bg-background px-4 transition focus-within:border-primary"
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search for ${data.keyword || 'dishes'}`}
                        className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                    />
                    <button type="submit" aria-label="Search" className="text-zinc-500 hover:text-primary">
                        <SearchIcon className="size-5" />
                    </button>
                </form>

                {/* Filters */}
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <DietRadio label="Veg" active={diet === 'veg'} color="emerald" onClick={() => setDiet(diet === 'veg' ? 'all' : 'veg')} />
                    <DietRadio label="Non-Veg" active={diet === 'non_veg'} color="rose" onClick={() => setDiet(diet === 'non_veg' ? 'all' : 'non_veg')} />
                    {minRating ? (
                        <button
                            type="button"
                            onClick={() => setMinRating(false)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
                        >
                            Ratings 4.0+ <span aria-hidden>×</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setMinRating(true)}
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-foreground hover:border-emerald-500"
                        >
                            Ratings 4.0+
                        </button>
                    )}
                    <span className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-foreground">
                        Bestseller
                    </span>
                </div>

                {/* Top list — partner sort order */}
                <div className="mt-6 divide-y divide-zinc-100">
                    {menu.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">No items match these filters.</p>
                    ) : (
                        menu.map((dish) => <MenuRow key={`menu-${dish.id}`} dish={dish} />)
                    )}
                </div>

                {/* Recommended — related to the searched item */}
                {recommended.length > 0 ? (
                    <section className="mt-10">
                        <h2 className="text-lg font-bold text-foreground">Recommended ({recommended.length})</h2>
                        <div className="mt-2 divide-y divide-zinc-100">
                            {recommended.map((dish) => (
                                <MenuRow key={`rec-${dish.id}`} dish={dish} />
                            ))}
                        </div>
                    </section>
                ) : null}
            </main>

            <SiteFooter />
        </div>
    );
}

function formatReviews(count: number): string {
    if (count >= 500) return '500+ Reviews';
    return `${count} Review${count === 1 ? '' : 's'}`;
}

function DietRadio({
    label,
    active,
    color,
    onClick,
}: {
    label: string;
    active: boolean;
    color: 'emerald' | 'rose';
    onClick: () => void;
}) {
    const ring = color === 'emerald' ? 'border-emerald-600' : 'border-rose-600';
    const fill = color === 'emerald' ? 'bg-emerald-600' : 'bg-rose-600';

    return (
        <button type="button" onClick={onClick} className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <span className={`flex size-4 items-center justify-center rounded-full border ${active ? ring : 'border-zinc-300'}`}>
                {active ? <span className={`size-2 rounded-full ${fill}`} /> : null}
            </span>
            {label}
        </button>
    );
}

function MenuRow({ dish }: { dish: Dish }) {
    const [qty, setQty] = useState(0);
    const [expanded, setExpanded] = useState(false);

    const description = dish.description ?? '';
    const isLong = description.length > DESCRIPTION_TRUNCATE;
    const shownDescription = !expanded && isLong ? description.slice(0, DESCRIPTION_TRUNCATE).trimEnd() : description;

    return (
        <article className="flex gap-4 py-5">
            {/* Image + Add / quantity stepper */}
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
                {qty === 0 ? (
                    <button
                        type="button"
                        onClick={() => setQty(1)}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-emerald-500 bg-white px-6 py-1 text-xs font-bold uppercase tracking-wide text-emerald-600 shadow-sm transition hover:bg-emerald-500 hover:text-white"
                    >
                        Add
                    </button>
                ) : (
                    <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-md border border-emerald-500 bg-white px-2 py-1 shadow-sm">
                        <button type="button" aria-label="Decrease" onClick={() => setQty((q) => q - 1)} className="text-emerald-600">
                            <Minus className="size-4" />
                        </button>
                        <span className="min-w-4 text-center text-sm font-bold text-emerald-700">{qty}</span>
                        <button type="button" aria-label="Increase" onClick={() => setQty((q) => q + 1)} className="text-emerald-600">
                            <Plus className="size-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
                <VegBadge isVeg={dish.is_veg} />
                <h3 className="mt-1.5 text-base font-semibold text-foreground">{dish.name}</h3>
                {description ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {shownDescription}
                        {isLong ? (
                            <>
                                {!expanded ? '..... ' : ' '}
                                <button
                                    type="button"
                                    onClick={() => setExpanded((v) => !v)}
                                    className="font-semibold text-foreground hover:underline"
                                >
                                    {expanded ? 'less' : 'more'}
                                </button>
                            </>
                        ) : null}
                    </p>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-foreground tabular-nums">£{dish.price.toFixed(2)}</p>
                {dish.rating !== null ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-700">
                        <Star className="size-3 fill-amber-400 text-amber-400" /> {dish.rating.toFixed(1)}
                    </span>
                ) : null}
            </div>

            {/* Favourite */}
            <FavouriteButton />
        </article>
    );
}

function FavouriteButton() {
    const [saved, setSaved] = useState(false);

    return (
        <button
            type="button"
            aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
            aria-pressed={saved}
            onClick={() => setSaved((v) => !v)}
            className={'shrink-0 self-start transition ' + (saved ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-500')}
        >
            <Heart className={'size-5 ' + (saved ? 'fill-current' : '')} />
        </button>
    );
}

function VegBadge({ isVeg }: { isVeg: boolean }) {
    const border = isVeg ? 'border-emerald-600' : 'border-rose-600';
    const dot = isVeg ? 'bg-emerald-600' : 'bg-rose-600';

    return (
        <span
            className={`flex size-4 items-center justify-center rounded-[3px] border ${border}`}
            aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
        >
            <span className={`size-1.5 rounded-full ${dot}`} />
        </span>
    );
}
