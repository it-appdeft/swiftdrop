import { toast } from '@/hooks/use-toast';
import { Head, Link, router } from '@inertiajs/react';
import { Heart, Minus, Plus, Search as SearchIcon, Star, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SiteFooter } from '../../web/components/site-footer';
import { CustomerHeader } from '../components/customer-header';
import { DishModifierDialog, type ModifierDish, type ModifierGroup } from '../components/dish-modifier-dialog';

interface Dish {
    id: number;
    name: string;
    description: string | null;
    price: number;
    is_veg: boolean;
    image_url: string | null;
    rating: number | null;
    modifier_groups: ModifierGroup[];
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

interface CartLine {
    id: number;
    menu_item_id: number;
    name: string | null;
    quantity: number;
}

interface Cart {
    id: number | null;
    restaurant_id: number | null;
    restaurant: { id: number; name: string; logo_url: string | null } | null;
    items: CartLine[];
    item_count: number;
    subtotal: number;
}

interface Props {
    restaurant: {
        restaurant: RestaurantHeader;
        keyword: string;
        menu: Dish[];
        recommended: Dish[];
    };
    cart: Cart;
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

export default function CustomerRestaurant({ restaurant: data, cart }: Props) {
    const r = data.restaurant;

    const [query, setQuery] = useState(data.keyword);
    const [diet, setDiet] = useState<Diet>('all');
    const [minRating, setMinRating] = useState(true); // "Ratings 4.0+" chip starts active (matches design)
    const [openDish, setOpenDish] = useState<ModifierDish | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(`/customer/restaurants/${r.id}`, { q: query }, { preserveScroll: true, preserveState: false });
    };

    const menu = useMemo(() => filterDishes(data.menu, diet, minRating), [data.menu, diet, minRating]);
    const recommended = useMemo(() => filterDishes(data.recommended, diet, minRating), [data.recommended, diet, minRating]);

    // Cart lines grouped by dish — a dish with modifiers can occupy several
    // lines (different customisations), so the row shows the summed quantity.
    const linesByDish = useMemo(() => {
        const map = new Map<number, CartLine[]>();
        for (const line of cart.items) {
            const list = map.get(line.menu_item_id) ?? [];
            list.push(line);
            map.set(line.menu_item_id, list);
        }
        return map;
    }, [cart.items]);

    // Only reflect the cart on this page when it actually belongs to this
    // restaurant (a cart holds one restaurant at a time).
    const cartIsThisRestaurant = cart.item_count > 0 && cart.restaurant_id === r.id;

    const addToCart = (menuItemId: number, quantity: number, options: number[], onDone?: () => void) => {
        setSubmitting(true);
        router.post(
            '/customer/cart',
            { menu_item_id: menuItemId, quantity, options },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onDone?.(),
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(typeof first === 'string' ? first : 'Could not add this item to your cart.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const updateLine = (itemId: number, quantity: number) => {
        router.put(`/customer/cart/items/${itemId}`, { quantity }, { preserveScroll: true, preserveState: true });
    };

    // "Add" / "+" entry point: dishes with options open the customise dialog,
    // plain dishes go straight into the cart.
    const handleAdd = (dish: Dish) => {
        if (dish.modifier_groups.length > 0) {
            setOpenDish(dish);
            return;
        }
        addToCart(dish.id, 1, []);
    };

    const handleIncrement = (dish: Dish) => {
        const lines = linesByDish.get(dish.id) ?? [];
        if (dish.modifier_groups.length > 0) {
            // Re-open the dialog so the customer can pick a (possibly new)
            // customisation for the extra unit.
            setOpenDish(dish);
            return;
        }
        if (lines[0]) updateLine(lines[0].id, lines[0].quantity + 1);
    };

    const handleDecrement = (dish: Dish) => {
        const lines = linesByDish.get(dish.id) ?? [];
        const last = lines[lines.length - 1];
        if (last) updateLine(last.id, last.quantity - 1);
    };

    const quantityFor = (dishId: number) => (linesByDish.get(dishId) ?? []).reduce((sum, line) => sum + line.quantity, 0);

    const renderRow = (dish: Dish, keyPrefix: string) => (
        <MenuRow
            key={`${keyPrefix}-${dish.id}`}
            dish={dish}
            quantity={quantityFor(dish.id)}
            onAdd={() => handleAdd(dish)}
            onIncrement={() => handleIncrement(dish)}
            onDecrement={() => handleDecrement(dish)}
        />
    );

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <Head title={r.name} />
            <CustomerHeader />

            <main className={'mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 sm:px-6 sm:py-8 ' + (cartIsThisRestaurant ? 'pb-28' : '')}>
                {/* Hero banner */}
                <section className="relative overflow-hidden rounded-2xl bg-zinc-800">
                    {r.cover_url || r.logo_url ? (
                        <img src={(r.cover_url ?? r.logo_url)!} alt={r.name} className="h-72 w-full object-cover sm:h-80" />
                    ) : (
                        <div className="flex h-72 w-full items-center justify-center text-6xl font-bold text-zinc-500 sm:h-80">
                            {r.name.charAt(0)}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                        <div className="mb-2 flex items-center gap-3">
                            {r.is_top_rated ? (
                                <span className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
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
                        {r.description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{r.description}</p> : null}
                    </div>
                </section>

                {/* In-restaurant search */}
                <form
                    onSubmit={submitSearch}
                    className="bg-background focus-within:border-primary mt-6 flex h-14 items-center gap-2 rounded-lg border border-zinc-200 px-4 transition"
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search for ${data.keyword || 'dishes'}`}
                        className="placeholder:text-muted-foreground h-full flex-1 bg-transparent text-base outline-none"
                    />
                    <button type="submit" aria-label="Search" className="hover:text-primary text-zinc-500">
                        <SearchIcon className="size-5" />
                    </button>
                </form>

                {/* Filters */}
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <DietRadio label="Veg" active={diet === 'veg'} color="emerald" onClick={() => setDiet(diet === 'veg' ? 'all' : 'veg')} />
                    <DietRadio
                        label="Non-Veg"
                        active={diet === 'non_veg'}
                        color="rose"
                        onClick={() => setDiet(diet === 'non_veg' ? 'all' : 'non_veg')}
                    />
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
                            className="text-foreground rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:border-emerald-500"
                        >
                            Ratings 4.0+
                        </button>
                    )}
                    <span className="text-foreground rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium">Bestseller</span>
                </div>

                {/* Top list — partner sort order */}
                <div className="mt-6 divide-y divide-zinc-100">
                    {menu.length === 0 ? (
                        <p className="text-muted-foreground py-10 text-center text-sm">No items match these filters.</p>
                    ) : (
                        menu.map((dish) => renderRow(dish, 'menu'))
                    )}
                </div>

                {/* Recommended — related to the searched item */}
                {recommended.length > 0 ? (
                    <section className="mt-10">
                        <h2 className="text-foreground text-lg font-bold">Recommended ({recommended.length})</h2>
                        <div className="mt-2 divide-y divide-zinc-100">{recommended.map((dish) => renderRow(dish, 'rec'))}</div>
                    </section>
                ) : null}
            </main>

            {/* Sticky "cart added" bar */}
            {cartIsThisRestaurant ? (
                <div className="sticky bottom-0 z-20 border-t border-emerald-700/20">
                    <div className="mx-auto flex max-w-[1100px] items-center gap-4 bg-emerald-600 px-4 py-3 text-white sm:px-6">
                        <div className="size-11 shrink-0 overflow-hidden rounded-full bg-white/20">
                            {(cart.restaurant?.logo_url ?? r.logo_url) ? (
                                <img
                                    src={(cart.restaurant?.logo_url ?? r.logo_url)!}
                                    alt={cart.restaurant?.name ?? r.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center font-bold">
                                    {(cart.restaurant?.name ?? r.name).charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{cart.restaurant?.name ?? r.name}</p>
                            <p className="text-sm text-white/85">
                                {cart.item_count} item{cart.item_count === 1 ? '' : 's'}
                            </p>
                        </div>
                        <Link
                            href={route('customer.cart')}
                            className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                            View Cart
                        </Link>
                    </div>
                </div>
            ) : null}

            <SiteFooter />

            {openDish ? (
                <DishModifierDialog
                    key={openDish.id}
                    dish={openDish}
                    submitting={submitting}
                    onClose={() => setOpenDish(null)}
                    onAdd={(optionIds, quantity) => addToCart(openDish.id, quantity, optionIds, () => setOpenDish(null))}
                />
            ) : null}
        </div>
    );
}

function formatReviews(count: number): string {
    if (count >= 500) return '500+ Reviews';
    return `${count} Review${count === 1 ? '' : 's'}`;
}

function DietRadio({ label, active, color, onClick }: { label: string; active: boolean; color: 'emerald' | 'rose'; onClick: () => void }) {
    const ring = color === 'emerald' ? 'border-emerald-600' : 'border-rose-600';
    const fill = color === 'emerald' ? 'bg-emerald-600' : 'bg-rose-600';

    return (
        <button type="button" onClick={onClick} className="text-foreground inline-flex items-center gap-2 text-sm font-medium">
            <span className={`flex size-4 items-center justify-center rounded-full border ${active ? ring : 'border-zinc-300'}`}>
                {active ? <span className={`size-2 rounded-full ${fill}`} /> : null}
            </span>
            {label}
        </button>
    );
}

function MenuRow({
    dish,
    quantity,
    onAdd,
    onIncrement,
    onDecrement,
}: {
    dish: Dish;
    quantity: number;
    onAdd: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const description = dish.description ?? '';
    const isLong = description.length > DESCRIPTION_TRUNCATE;
    const shownDescription = !expanded && isLong ? description.slice(0, DESCRIPTION_TRUNCATE).trimEnd() : description;
    const customisable = dish.modifier_groups.length > 0;

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
                {quantity === 0 ? (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-emerald-500 bg-white px-6 py-1 text-xs font-bold tracking-wide text-emerald-600 uppercase shadow-sm transition hover:bg-emerald-500 hover:text-white"
                    >
                        Add
                    </button>
                ) : (
                    <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-md border border-emerald-500 bg-white px-2 py-1 shadow-sm">
                        <button type="button" aria-label="Decrease" onClick={onDecrement} className="text-emerald-600">
                            <Minus className="size-4" />
                        </button>
                        <span className="min-w-4 text-center text-sm font-bold text-emerald-700">{quantity}</span>
                        <button type="button" aria-label="Increase" onClick={onIncrement} className="text-emerald-600">
                            <Plus className="size-4" />
                        </button>
                    </div>
                )}
                {customisable ? (
                    <span className="text-muted-foreground absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap">
                        Customisable
                    </span>
                ) : null}
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
                <VegBadge isVeg={dish.is_veg} />
                <h3 className="text-foreground mt-1.5 text-base font-semibold">{dish.name}</h3>
                {description ? (
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {shownDescription}
                        {isLong ? (
                            <>
                                {!expanded ? '..... ' : ' '}
                                <button
                                    type="button"
                                    onClick={() => setExpanded((v) => !v)}
                                    className="text-foreground font-semibold hover:underline"
                                >
                                    {expanded ? 'less' : 'more'}
                                </button>
                            </>
                        ) : null}
                    </p>
                ) : null}
                <p className="text-foreground mt-2 text-sm font-semibold tabular-nums">£{dish.price.toFixed(2)}</p>
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
