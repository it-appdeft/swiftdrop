<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CustomerRestaurantData;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\RestaurantHour;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/** @property CustomerRestaurantData $resource */
class CustomerRestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var CustomerRestaurantData $data */
        $data = $this->resource;
        $restaurant = $data->restaurant;
        // rating defaults to 0.00 in the DB; treat "no reviews yet" as unrated
        // so the frontend's 4.0+ filter and TOP RATED badge don't trip on it.
        $rating = ((int) $restaurant->total_reviews) > 0 && $restaurant->rating !== null
            ? (float) $restaurant->rating
            : null;

        // Reuse the dashboard/search restaurant shape, then layer on the two
        // detail-only fields the header needs (description + TOP RATED badge).
        $header = (new DashboardRestaurantResource([
            'restaurant' => $restaurant,
            'distance_miles' => $data->distanceMiles,
        ]))->resolve($request);
        $header['description'] = $restaurant->description;
        $header['full_address'] = $restaurant->full_address;
        $header['cuisines'] = $restaurant->cuisines;
        $header['is_top_rated'] = $rating !== null && $rating >= 4.5;
        $header['is_favorited'] = $data->isFavorite;
        $header['share_url'] = url('/customer/restaurants/'.$restaurant->id);
        $header['store_info'] = $this->storeInfo($restaurant);

        $favoriteIds = array_flip($data->favoriteMenuItemIds);

        return [
            'restaurant' => $header,
            'keyword' => $data->keyword,
            'filters' => [
                'diet' => $data->filters['diet'] ?? null,
                'min_rating' => $data->filters['min_rating'] ?? null,
            ],
            'categories' => $data->menuCategories
                ->map(function ($items) use ($rating, $favoriteIds, $data) {

                    $category = $items->first()->category;

                    return [
                        'id' => $category?->id,
                        'name' => $category?->name,
                        'items' => $items
                            ->map(fn (MenuItem $m) => $this->dish(
                                $m,
                                $rating,
                                isset($favoriteIds[$m->id]),
                                $data->cartLookup[$m->id] ?? null
                            ))
                            ->values()
                            ->all(),
                    ];
                })
                ->values()
                ->all(),
            'recommended' => $data->recommended
                ->map(fn (MenuItem $m) => $this->dish($m, $rating, isset($favoriteIds[$m->id]), $data->cartLookup[$m->id] ?? null))
                ->values()->all(),            
        ];
    }

    /**
     * Single menu-item shape, shared by the menu + recommended lists. menu_items
     * carry no per-dish rating, so we surface the restaurant's rating here.
     *
     * @return array<string, mixed>
     */
    protected function dish(MenuItem $item, ?float $rating, bool $isFavorited, ?Collection $cartLines = null): array
    {
        // A dish can sit in the cart under several option combos, each its own
        // cart line. We surface ALL of them (with the rolled-up quantity + line
        // count) so the API and web read one self-contained shape — no need to
        // re-derive the dish's cart state from the separate cart payload.
        $lines = $cartLines ?? collect();

        return [
            'id' => $item->id,
            'name' => $item->name,
            'description' => $item->description,
            'price' => (float) $item->price,
            'is_veg' => (bool) $item->is_veg,
            // Off-menu dishes are still listed (grayed, no Add button).
            'is_available' => (bool) $item->is_available,
            'image_url' => $this->dishImageUrl($item),
            'rating' => $rating,
            'is_favorited' => $isFavorited,
            'is_in_cart' => $lines->isNotEmpty(),
            // Total quantity across every combo of this dish in the cart.
            'cart_quantity' => (int) $lines->sum('quantity'),
            // How many distinct lines (combos) this dish occupies.
            'cart_line_count' => $lines->count(),
            'cart_lines' => $lines->map(fn (CartItem $line) => $this->cartLine($line))->values()->all(),
            'modifier_groups' => $item->relationLoaded('modifierGroups')
                ? $item->modifierGroups->map(fn ($group) => $this->modifierGroup($group, $item))->values()->all()
                : [],
        ];
    }

    /**
     * One cart line of a dish: its quantity, the flat option-id list (fed
     * straight into the modifier dialog so a line opens pre-marked), and the
     * full modifier snapshot for callers that render the combo detail.
     *
     * @return array<string, mixed>
     */
    protected function cartLine(CartItem $line): array
    {
        return [
            'id' => $line->id,
            'quantity' => (int) $line->quantity,
            'selected_options' => $line->modifiers
                ->pluck('modifier_option_id')
                ->filter()
                ->values()
                ->all(),
            'modifiers' => $line->modifiers->map(fn ($modifier) => [
                'modifier_group_id' => $modifier->modifier_group_id,
                'modifier_option_id' => $modifier->modifier_option_id,
                'group_name' => $modifier->group_name,
                'option_name' => $modifier->option_name,
                'price_delta' => (float) $modifier->price_delta,
            ])->values()->all(),
        ];
    }

    /**
     * Store-info payload for the 3-dot menu modal: today's open hours, a
     * compact "Everyday HH:MM-HH:MM" summary when every open day shares the
     * same window, and the static delivery-time range we surface elsewhere.
     *
     * @return array<string, mixed>
     */
    protected function storeInfo(Restaurant $restaurant): array
    {
        $hours = $restaurant->relationLoaded('hours')
            ? $restaurant->hours
            : $restaurant->hours()->get();

        $byDay = $hours->keyBy('day_of_week');
        $today = strtolower(Carbon::now()->format('D'));      // e.g. "mon"
        $todaysRow = $byDay->get($today);

        return [
            'delivery_minutes_min' => 20,
            'delivery_minutes_max' => 30,
            'today' => $todaysRow ? $this->hourRow($todaysRow) : null,
            'hours' => RestaurantHour::DAYS
                ? collect(RestaurantHour::DAYS)
                    ->map(fn (string $d) => array_merge(
                        ['day' => $d],
                        $byDay->get($d) ? $this->hourRow($byDay->get($d)) : ['is_open' => false, 'open_from' => null, 'open_to' => null],
                    ))->all()
                : [],
            'hours_summary' => $this->hoursSummary($hours),
        ];
    }

    /** @return array<string, mixed> */
    protected function hourRow(RestaurantHour $row): array
    {
        return [
            'is_open' => (bool) $row->is_open,
            'open_from' => $row->open_from ? substr((string) $row->open_from, 0, 5) : null,
            'open_to' => $row->open_to ? substr((string) $row->open_to, 0, 5) : null,
        ];
    }

    /**
     * One-line summary: "Everyday 09:00-23:00" when every open day shares the
     * same window, otherwise null (the modal falls back to the day-by-day list).
     */
    protected function hoursSummary(\Illuminate\Support\Collection $hours): ?string
    {
        $open = $hours->where('is_open', true);
        if ($open->isEmpty() || $open->count() !== count(RestaurantHour::DAYS)) {
            return null;
        }

        $from = $open->first()->open_from;
        $to = $open->first()->open_to;
        $uniform = $open->every(fn ($r) => $r->open_from === $from && $r->open_to === $to);

        if (! $uniform || ! $from || ! $to) {
            return null;
        }

        return 'Everyday '.substr((string) $from, 0, 5).'-'.substr((string) $to, 0, 5);
    }

    /**
     * One customisation group (Size, Toppings-Veg, Cheese & Dip…) with its
     * selectable options. selection_type drives radios vs. checkboxes; the
     * required + min/max fields let the frontend gate the "Add Item" button.
     *
     * @return array<string, mixed>
     */
    protected function modifierGroup(\App\Models\ModifierGroup $group, MenuItem $item): array
    {
        // Per-dish prices for price-driver options: option id → price. A
        // price-driver group only shows the options this dish offers (those
        // with a per-dish price row), priced from that row.
        $itemPrices = $item->relationLoaded('modifierOptions')
            ? $item->modifierOptions->mapWithKeys(fn ($o) => [(int) $o->id => (float) $o->pivot->price])
            : collect();

        $options = $group->options;
        if ($group->is_price_driver) {
            $options = $options->filter(fn ($o) => $itemPrices->has((int) $o->id));
        }

        return [
            'id' => $group->id,
            'name' => $group->name,
            'description' => $group->description,
            'selection_type' => $group->selection_type, // 'single' | 'multiple'
            'is_price_driver' => (bool) $group->is_price_driver,
            'is_required' => (bool) $group->is_required,
            'min_selections' => (int) $group->min_selections,
            'max_selections' => $group->max_selections !== null ? (int) $group->max_selections : null,
            'options' => $options->map(fn ($option) => [
                'id' => $option->id,
                'name' => $option->name,
                'price_delta' => $group->is_price_driver
                    ? (float) ($itemPrices[(int) $option->id] ?? 0)
                    : (float) $option->price_delta,
                'is_default' => (bool) $option->is_default,
            ])->values()->all(),
        ];
    }

    /**
     * Prefer the menu item's own uploaded photo (the `image` upload collection,
     * the same one the partner sets in Menu Management). Only fall back to the
     * linked food-type's stock image when the dish has no photo of its own.
     */
    protected function dishImageUrl(MenuItem $item): ?string
    {
        if ($item->relationLoaded('uploads')) {
            $own = $item->uploads->firstWhere('collection', 'image');
        } else {
            $own = $item->uploadsIn('image')->first();
        }

        if ($own && $own->url) {
            return $own->url;
        }

        $foodType = $item->foodType;
        if ($foodType && $foodType->image) {
            return '/storage/'.ltrim($foodType->image, '/');
        }

        return null;
    }
}
