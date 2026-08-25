import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Clock,
    Heart,
    Info,
    MapPin,
    Minus,
    MoreVertical,
    Plus,
    Search as SearchIcon,
    Share2,
    Star,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { CustomerHeader } from '../components/customer-header';
import { DishModifierDialog, type ModifierDish, type ModifierGroup } from '../components/dish-modifier-dialog';
import { RepeatCustomisationDialog, summariseSelection } from '../components/repeat-customisation-dialog';
import { useActiveOrders } from '../context/active-orders-context';

interface Dish {
    id: number;
    name: string;
    description: string | null;
    price: number;
    is_veg: boolean;
    is_available: boolean;
    image_url: string | null;
    rating: number | null;
    is_favorited: boolean;
    is_in_cart: boolean;
    // Rolled-up cart state for this dish, straight from the API — the total
    // quantity across every combo, the number of distinct lines, and the lines
    // themselves. No need to re-derive any of this from the cart payload.
    cart_quantity: number;
    cart_line_count: number;
    cart_lines: DishCartLine[];
    modifier_groups: ModifierGroup[];
}

/** One cart line of a dish — the same dish can occupy several under different
 *  option combos. `selected_options` feeds the modifier dialog pre-marked. */
interface DishCartLine {
    id: number;
    quantity: number;
    selected_options: number[];
}

interface StoreHourRow {
    day: string;
    is_open: boolean;
    open_from: string | null;
    open_to: string | null;
}

interface StoreInfo {
    delivery_minutes_min: number;
    delivery_minutes_max: number;
    today: { is_open: boolean; open_from: string | null; open_to: string | null } | null;
    hours: StoreHourRow[];
    hours_summary: string | null;
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
    is_favorited: boolean;
    is_accepting_orders: boolean;
    is_open_now: boolean;
    share_url: string;
    store_info: StoreInfo;
}

interface CartLine {
    id: number;
    menu_item_id: number;
    name: string | null;
    quantity: number;
    selected_options?: number[];
}

interface Cart {
    id: number | null;
    restaurant_id: number | null;
    restaurant: { id: number; name: string; logo_url: string | null } | null;
    items: CartLine[];
    item_count: number;
    subtotal: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface MenuMeta {
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

interface MenuFilters {
    diet: Diet | null;
    min_rating: number | null;
}

interface MenuCategory {
    id: number;
    name: string;
    items: Dish[];
}

interface RestaurantPayload {
    restaurant: RestaurantHeader;
    keyword: string;
    filters: MenuFilters;
    categories: MenuCategory[];
    recommended: Dish[];
}

interface Props {
    restaurant: RestaurantPayload;
    dish: ModifierDish;
    selectedOptions?: number[];
    cart: Cart;
}

type Diet = 'all' | 'veg' | 'non_veg';

const DESCRIPTION_TRUNCATE = 120;

/** "Ratings 4.0+" chip sends this threshold; the server gates on the
 *  restaurant's rating (menu_items carry no own rating). */
const MIN_RATING = 4.0;

const CSRF = (): string => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

export default function CustomerRestaurant({ restaurant: data, cart }: Props) {
    const r = data.restaurant;

    // Diet + rating filters are now server-side params (echoed back in
    // `data.filters`) so the API and web share one code path.
    const diet: Diet = data.filters.diet ?? 'all';
    const minRating = data.filters.min_rating !== null;

    const [query, setQuery] = useState(data.keyword ? `You Searched for “${data.keyword}”` : '');
    // The modifier dialog. `editLine` null → adding a new combo; set → editing
    // that existing line (opens pre-filled, "Update" rewrites it).
    const [openDish, setOpenDish] = useState<{ dish: ModifierDish; editLine: DishCartLine | null } | null>(null);
    // A customisable dish tapped "+" while already in the cart — prompts the
    // "repeat previous customisation?" choice (repeat / edit / choose new).
    const [repeatDish, setRepeatDish] = useState<Dish | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Local mirror of favourite state so the heart flips instantly. Server is
    // the source of truth — we just optimistically update and roll back on error.
    const [restaurantFav, setRestaurantFav] = useState(r.is_favorited);
    const allCategoryItems = data.categories.flatMap((c) => c.items);

    // Every combo of the tapped dish already in the cart — the "repeat" prompt
    // lists them all so the customer can add another of any one (one dish can
    // sit in the cart under several option combos). Read straight off the dish
    // now that the API rolls its cart lines into the menu payload.
    const repeatLines = repeatDish?.cart_lines ?? [];

    const [favoriteDishIds, setFavoriteDishIds] = useState<Set<number>>(
        () => new Set([...allCategoryItems, ...data.recommended].filter((d) => d.is_favorited).map((d) => d.id)),
    );

    const [storeInfoOpen, setStoreInfoOpen] = useState(false);

    /**
     * Apply the Veg/Non-Veg + Ratings 4.0+ filters server-side — re-runs the
     * detail query from page 1, carrying the keyword + the new filter set.
     */
    const applyMenuFilters = (next: { diet?: Diet; minRating?: boolean }) => {
        const nextDiet = next.diet ?? diet;
        const nextMin = next.minRating ?? minRating;
        router.get(
            `/customer/restaurants/${r.id}`,
            {
                ...(data.keyword ? { search: data.keyword } : {}),
                ...(nextDiet !== 'all' ? { diet: nextDiet } : {}),
                ...(nextMin ? { min_rating: MIN_RATING } : {}),
            },
            { preserveScroll: true, preserveState: false },
        );
    };

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(`/customer/restaurants/${r.id}`, { search: query }, { preserveScroll: true, preserveState: false });
    };

    const clearSearch = () => {
        router.get(`/customer/restaurants/${r.id}`, {}, { preserveScroll: true, preserveState: false });
    };

    // Menu + recommended arrive already filtered (server-side). The visible
    // menu is the locally-accumulated infinite-scroll list.
    const categories = data.categories;
    const recommended = data.recommended;

    // Only reflect the cart on this page when it actually belongs to this
    // restaurant (a cart holds one restaurant at a time).
    const cartIsThisRestaurant = cart.item_count > 0 && cart.restaurant_id === r.id;

    // The floating ActiveOrderBar (app.tsx) sticks to the same bottom-4 spot
    // as the cart bar below — when the customer already has an order in
    // flight, shift the cart bar up so both are visible and clickable
    // instead of one covering the other.
    const hasActiveOrder = useActiveOrders().length > 0;

    // The restaurant as a whole can't take orders — paused (not accepting) or
    // shut by its operating hours. Every dish then behaves like an unavailable
    // one (grayed, no Add); the server enforces this too.
    const restaurantUnavailable = !r.is_accepting_orders || !r.is_open_now;

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

    // Re-customise an existing line (options + quantity). Sending `options`
    // switches the server onto the edit path, which merges into a matching
    // combo or rewrites this line in place.
    const updateLineSelection = (itemId: number, quantity: number, options: number[], onDone?: () => void) => {
        setSubmitting(true);
        router.put(
            `/customer/cart/items/${itemId}`,
            { quantity, options },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onDone?.(),
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(typeof first === 'string' ? first : 'Could not update this item.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleAdd = (dish: Dish) => {
        if (!dish.is_available || restaurantUnavailable) return;
        if (dish.modifier_groups.length > 0) {
            setOpenDish({ dish, editLine: null });
            return;
        }
        addToCart(dish.id, 1, []);
    };

    // "+" on a dish already in the cart. A customisable dish asks whether to
    // repeat the last combo or pick new modifiers (so the same dish can sit in
    // the cart under several combos); a plain dish just bumps its quantity.
    const handleIncrement = (dish: Dish) => {
        if (restaurantUnavailable) return;
        if (dish.modifier_groups.length > 0) {
            setRepeatDish(dish);
            return;
        }
        const lines = dish.cart_lines;
        if (lines[0]) updateLine(lines[0].id, lines[0].quantity + 1);
    };

    const handleDecrement = (dish: Dish) => {
        const lines = dish.cart_lines;
        const last = lines[lines.length - 1];
        if (last) updateLine(last.id, last.quantity - 1);
    };

    // Restaurant favourite — optimistic toggle, roll back on failure.
    const toggleRestaurantFavorite = async () => {
        const before = restaurantFav;
        setRestaurantFav(!before);
        try {
            const res = await fetch(`/customer/favorites/restaurants/${r.id}`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': CSRF(), 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as { favorited: boolean };
            setRestaurantFav(json.favorited);
            toast.success(json.favorited ? 'Added to favourites' : 'Removed from favourites');
        } catch {
            setRestaurantFav(before);
            toast.error('Could not update favourite.');
        }
    };

    const toggleDishFavorite = async (dishId: number) => {
        const before = favoriteDishIds.has(dishId);
        const next = new Set(favoriteDishIds);
        if (before) next.delete(dishId);
        else next.add(dishId);
        setFavoriteDishIds(next);
        try {
            const res = await fetch(`/customer/favorites/menu-items/${dishId}`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': CSRF(), 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error();
            const json = (await res.json()) as { favorited: boolean };
            const corrected = new Set(favoriteDishIds);
            if (json.favorited) corrected.add(dishId);
            else corrected.delete(dishId);
            setFavoriteDishIds(corrected);
        } catch {
            // Roll back to the pre-toggle state.
            const rollback = new Set(favoriteDishIds);
            if (before) rollback.add(dishId);
            else rollback.delete(dishId);
            setFavoriteDishIds(rollback);
            toast.error('Could not update favourite.');
        }
    };

    const handleShare = async () => {
        const text = `${r.name} — ${r.tagline ?? 'Check this out on SwiftDrop'}`;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title: r.name, text, url: r.share_url });
                return;
            } catch {
                // user cancelled — fall through to copy-link fallback
            }
        }
        try {
            await navigator.clipboard.writeText(r.share_url);
            toast.success('Link copied to clipboard');
        } catch {
            toast.error('Could not copy link.');
        }
    };

    const renderRow = (dish: Dish, keyPrefix: string) => (
        <MenuRow
            key={`${keyPrefix}-${dish.id}`}
            dish={dish}
            quantity={dish.cart_quantity}
            isFavorited={favoriteDishIds.has(dish.id)}
            restaurantUnavailable={restaurantUnavailable}
            onAdd={() => handleAdd(dish)}
            onIncrement={() => handleIncrement(dish)}
            onDecrement={() => handleDecrement(dish)}
            onToggleFavorite={() => toggleDishFavorite(dish.id)}
        />
    );

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <Head title={r.name} />
            <CustomerHeader />

            <main
                className={
                    'mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 ' +
                    (cartIsThisRestaurant ? (hasActiveOrder ? 'pb-44' : 'pb-28') : '')
                }
            >
                {restaurantUnavailable ? (
                    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {!r.is_accepting_orders
                            ? 'This restaurant is not accepting orders right now, so items can’t be added.'
                            : 'This restaurant is currently closed, so items can’t be added until it reopens.'}
                    </div>
                ) : null}

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

                    {/* Top-left back + top-right heart / 3-dot */}
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 sm:p-4">
                        <button
                            type="button"
                            onClick={() => router.visit(document.referrer || route('customer.dashboard'))}
                            aria-label="Back"
                            className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleRestaurantFavorite}
                                aria-label={restaurantFav ? 'Remove from favourites' : 'Add to favourites'}
                                aria-pressed={restaurantFav}
                                className="flex size-9 items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-lg transition hover:bg-white"
                            >
                                <Heart className={'size-5 transition ' + (restaurantFav ? 'fill-rose-500 text-rose-500' : '')} />
                            </button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="More actions"
                                        className="flex size-9 items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-lg transition hover:bg-white"
                                    >
                                        <MoreVertical className="size-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onSelect={toggleRestaurantFavorite}>
                                        <Heart className={'mr-2 size-4 ' + (restaurantFav ? 'fill-rose-500 text-rose-500' : '')} />
                                        {restaurantFav ? 'Remove favourite' : 'Add to favourites'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setStoreInfoOpen(true)}>
                                        <Info className="mr-2 size-4" />
                                        Store info
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={handleShare}>
                                        <Share2 className="mr-2 size-4" />
                                        Share
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

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
                        {r.full_address ? (
                            <p className="mt-2 flex items-start gap-1.5 text-xs text-white/75 sm:text-sm">
                                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                <span>{r.full_address}</span>
                            </p>
                        ) : null}
                    </div>
                </section>

                {/* "You searched for X" banner — shown when arriving via search */}

                {/* In-restaurant search (now always starts empty so the banner above carries the active query) */}
                <form
                    onSubmit={submitSearch}
                    className="bg-background focus-within:border-primary mt-4 flex h-14 items-center gap-2 rounded-lg border border-zinc-200 px-4 transition"
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for dishes"
                        className="placeholder:text-muted-foreground h-full flex-1 bg-transparent text-base outline-none"
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                clearSearch();
                            }}
                            className="text-zinc-500 hover:text-zinc-700"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                    <button type="submit" aria-label="Search" className="hover:text-primary text-zinc-500">
                        <SearchIcon className="size-5" />
                    </button>
                </form>

                {/* Filters (server-side via api params) */}
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <DietRadio
                        label="Veg"
                        active={diet === 'veg'}
                        color="emerald"
                        onClick={() => applyMenuFilters({ diet: diet === 'veg' ? 'all' : 'veg' })}
                    />
                    <DietRadio
                        label="Non-Veg"
                        active={diet === 'non_veg'}
                        color="rose"
                        onClick={() => applyMenuFilters({ diet: diet === 'non_veg' ? 'all' : 'non_veg' })}
                    />
                    {minRating ? (
                        <button
                            type="button"
                            onClick={() => applyMenuFilters({ minRating: false })}
                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
                        >
                            Ratings 4.0+ <span aria-hidden>×</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => applyMenuFilters({ minRating: true })}
                            className="text-foreground rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:border-emerald-500"
                        >
                            Ratings 4.0+
                        </button>
                    )}
                    {/* <span className="text-foreground rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium">Bestseller</span> */}
                </div>

                {/* Matching items — shown above when the page was reached via search */}
                {recommended.length > 0 ? (
                    <section className="mt-6">
                        <h2 className="text-foreground text-lg font-bold">
                            Results for “{data.keyword}” ({recommended.length})
                        </h2>
                        <div className="mt-2 divide-y divide-zinc-100">{recommended.map((dish) => renderRow(dish, 'rec'))}</div>
                        <hr className="my-8 border-zinc-200" />
                    </section>
                ) : null}

                {categories.map((category) => (
                    <section key={category.id} className="mt-8">
                        <h2 className="text-foreground text-lg font-bold">{category.name}</h2>

                        <div className="mt-2 divide-y divide-zinc-100">{category.items.map((dish) => renderRow(dish, `cat-${category.id}`))}</div>
                    </section>
                ))}
            </main>

            {/* Sticky "cart added" bar — floating rounded card above the page edge.
                Shifted further up when the ActiveOrderBar (app.tsx) is also
                floating at bottom-4, so the two stack instead of overlapping —
                otherwise its higher z-index blocks "View Cart" from being clicked. */}
            {cartIsThisRestaurant ? (
                <div className={'pointer-events-none sticky z-20 px-4 sm:px-6 ' + (hasActiveOrder ? 'bottom-24' : 'bottom-4')}>
                    <div className="pointer-events-auto mx-auto flex max-w-[1600px] items-center gap-4 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-lg ring-1 shadow-emerald-900/20 ring-emerald-700/20 sm:px-5">
                        <div className="size-11 shrink-0 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/40">
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
                            <p className="truncate text-sm font-semibold sm:text-base">{cart.restaurant?.name ?? r.name}</p>
                            <p className="text-xs text-white/90 sm:text-sm">
                                {cart.item_count} item{cart.item_count === 1 ? '' : 's'} <span className="opacity-60">·</span>{' '}
                                <span className="tabular-nums">£{cart.subtotal.toFixed(2)}</span>
                            </p>
                        </div>
                        <Link
                            href={route('customer.cart')}
                            className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                            View Cart
                        </Link>
                    </div>
                </div>
            ) : null}

            {openDish ? (
                <DishModifierDialog
                    key={`${openDish.dish.id}-${openDish.editLine?.id ?? 'new'}`}
                    dish={openDish.dish}
                    selectedOptions={openDish.editLine?.selected_options ?? []}
                    initialQuantity={openDish.editLine?.quantity ?? 1}
                    editing={openDish.editLine !== null}
                    submitting={submitting}
                    onClose={() => setOpenDish(null)}
                    onAdd={(optionIds, quantity) =>
                        openDish.editLine
                            ? updateLineSelection(openDish.editLine.id, quantity, optionIds, () => setOpenDish(null))
                            : addToCart(openDish.dish.id, quantity, optionIds, () => setOpenDish(null))
                    }
                />
            ) : null}

            {repeatDish && repeatLines.length > 0 ? (
                <RepeatCustomisationDialog
                    key={`repeat-${repeatDish.id}`}
                    dishName={repeatDish.name}
                    combos={repeatLines.map((line) => ({
                        lineId: line.id,
                        quantity: line.quantity,
                        summary: summariseSelection(repeatDish.modifier_groups, line.selected_options ?? []),
                    }))}
                    submitting={submitting}
                    onClose={() => setRepeatDish(null)}
                    // Repeat a specific combo → just bump that line's quantity.
                    onRepeat={(lineId) => {
                        const line = repeatLines.find((l) => l.id === lineId);
                        if (line) updateLine(line.id, line.quantity + 1);
                        setRepeatDish(null);
                    }}
                    // Edit a combo → open the modifier dialog pre-filled for that line.
                    onEdit={(lineId) => {
                        const line = repeatLines.find((l) => l.id === lineId);
                        const dish = repeatDish;
                        setRepeatDish(null);
                        if (line) setOpenDish({ dish, editLine: line });
                    }}
                    // Choose fresh modifiers → the modifier dialog adds, and the
                    // backend merges or creates a new line by its option signature.
                    onChoose={() => {
                        const dish = repeatDish;
                        setRepeatDish(null);
                        setOpenDish({ dish, editLine: null });
                    }}
                />
            ) : null}

            <StoreInfoDialog open={storeInfoOpen} onClose={() => setStoreInfoOpen(false)} restaurant={r} />
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
    isFavorited,
    restaurantUnavailable,
    onAdd,
    onIncrement,
    onDecrement,
    onToggleFavorite,
}: {
    dish: Dish;
    quantity: number;
    isFavorited: boolean;
    restaurantUnavailable: boolean;
    onAdd: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
    onToggleFavorite: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const description = dish.description ?? '';
    const isLong = description.length > DESCRIPTION_TRUNCATE;
    const shownDescription = !expanded && isLong ? description.slice(0, DESCRIPTION_TRUNCATE).trimEnd() : description;

    // The whole restaurant being closed/paused makes every dish non-orderable,
    // same as an individually off-menu dish.
    const unavailable = !dish.is_available || restaurantUnavailable;

    return (
        <article className={'flex gap-4 py-5 ' + (unavailable ? 'opacity-70' : '')}>
            {/* Image + Add / quantity stepper */}
            <div className="relative shrink-0">
                <div className="size-28 overflow-hidden rounded-lg bg-amber-50">
                    {dish.image_url ? (
                        <img
                            src={dish.image_url}
                            alt={dish.name}
                            className={'h-full w-full object-cover ' + (unavailable ? 'grayscale' : '')}
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-amber-600">
                            <UtensilsCrossed className="size-9" />
                        </div>
                    )}
                </div>
                {/* Off-menu dish: shown grayed with no Add control. */}
                {unavailable ? (
                    <span className="text-muted-foreground absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-zinc-300 bg-white px-4 py-1 text-xs font-bold tracking-wide uppercase shadow-sm">
                        Unavailable
                    </span>
                ) : quantity === 0 ? (
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
            <FavouriteButton saved={isFavorited} onClick={onToggleFavorite} />
        </article>
    );
}

function FavouriteButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
            aria-pressed={saved}
            onClick={onClick}
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

/** Store-info modal — matches the design: rating + reviews chip, delivery / distance
 *  tiles, today's hours + a summary row, and an allergy notice card. */
function StoreInfoDialog({ open, onClose, restaurant }: { open: boolean; onClose: () => void; restaurant: RestaurantHeader }) {
    const info = restaurant.store_info;
    const todayLine =
        info.today && info.today.is_open && info.today.open_to
            ? `Open until ${info.today.open_to}`
            : info.today && !info.today.is_open
              ? 'Closed today'
              : 'Hours not available';

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-[420px]">
                <div className="p-5 pb-3">
                    <h2 className="text-foreground text-lg font-semibold">Store Info</h2>
                </div>

                <div className="px-5 pb-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-foreground text-2xl font-bold">{restaurant.name}</h3>
                            {restaurant.cuisines ? <p className="text-muted-foreground mt-1 text-sm">{restaurant.cuisines}</p> : null}
                        </div>
                        <div className="text-right">
                            {restaurant.rating !== null ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-sm font-semibold text-amber-700">
                                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                    {restaurant.rating.toFixed(1)}
                                </span>
                            ) : null}
                            <p className="text-muted-foreground mt-1 text-xs">({formatReviews(restaurant.total_reviews)})</p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-muted/40 rounded-xl p-3">
                            <Clock className="size-4 text-emerald-600" />
                            <p className="text-muted-foreground mt-1 text-xs">Delivery</p>
                            <p className="text-foreground text-sm font-semibold">
                                {info.delivery_minutes_min}-{info.delivery_minutes_max} min
                            </p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-3">
                            <MapPin className="size-4 text-emerald-600" />
                            <p className="text-muted-foreground mt-1 text-xs">Distance</p>
                            <p className="text-foreground text-sm font-semibold">
                                {restaurant.distance_miles !== null ? `${restaurant.distance_miles.toFixed(1)} mi` : '—'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-muted/40 mt-3 flex items-center justify-between rounded-xl px-3 py-3 text-sm">
                        <span className="text-foreground font-medium">{todayLine}</span>
                        {info.hours_summary ? <span className="text-muted-foreground text-xs">{info.hours_summary}</span> : null}
                    </div>

                    <div className="bg-muted/40 mt-3 rounded-xl p-3">
                        <div className="flex items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                                <AlertTriangle className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-foreground text-sm font-semibold">Allergy requests unavailable</p>
                                <p className="text-muted-foreground mt-0.5 text-xs">This shop can't accommodate in-app food allergy requests.</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                        SwiftDrop cannot guarantee that any unpackaged products served in shops are allergen-free because shops may use shared
                        equipment to store, prepare and serve them.
                    </p>

                    {!info.hours_summary && info.hours.length > 0 ? (
                        <div className="bg-muted/40 mt-3 rounded-xl p-3">
                            <p className="text-foreground text-sm font-semibold">Opening hours</p>
                            <ul className="mt-2 space-y-1 text-xs">
                                {info.hours.map((row) => (
                                    <li key={row.day} className="flex items-center justify-between">
                                        <span className="text-muted-foreground capitalize">{row.day}</span>
                                        <span className="text-foreground tabular-nums">
                                            {row.is_open && row.open_from && row.open_to ? `${row.open_from} – ${row.open_to}` : 'Closed'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
