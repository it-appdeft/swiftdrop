<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CustomerRestaurantData;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\RestaurantHour;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

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
            'menu' => $data->menuItems
                ->map(fn (MenuItem $m) => $this->dish($m, $rating, isset($favoriteIds[$m->id])))
                ->values()->all(),
            'recommended' => $data->recommended
                ->map(fn (MenuItem $m) => $this->dish($m, $rating, isset($favoriteIds[$m->id])))
                ->values()->all(),
        ];
    }

    /**
     * Single menu-item shape, shared by the menu + recommended lists. menu_items
     * carry no per-dish rating, so we surface the restaurant's rating here.
     *
     * @return array<string, mixed>
     */
    protected function dish(MenuItem $item, ?float $rating, bool $isFavorited): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'description' => $item->description,
            'price' => (float) $item->price,
            'is_veg' => (bool) $item->is_veg,
            'image_url' => $this->dishImageUrl($item),
            'rating' => $rating,
            'is_favorited' => $isFavorited,
            // Drives the "Add" → customise popup. Empty array → the dish adds
            // to the cart directly with no modal.
            'modifier_groups' => $item->relationLoaded('modifierGroups')
                ? $item->modifierGroups->map(fn ($group) => $this->modifierGroup($group))->values()->all()
                : [],
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
    protected function modifierGroup(\App\Models\ModifierGroup $group): array
    {
        return [
            'id' => $group->id,
            'name' => $group->name,
            'description' => $group->description,
            'selection_type' => $group->selection_type, // 'single' | 'multiple'
            'is_required' => (bool) $group->is_required,
            'min_selections' => (int) $group->min_selections,
            'max_selections' => $group->max_selections !== null ? (int) $group->max_selections : null,
            'options' => $group->options->map(fn ($option) => [
                'id' => $option->id,
                'name' => $option->name,
                'price_delta' => (float) $option->price_delta,
            ])->values()->all(),
        ];
    }

    protected function dishImageUrl(MenuItem $item): ?string
    {
        $foodItem = $item->foodItem;
        if ($foodItem && $foodItem->image) {
            return '/storage/'.ltrim($foodItem->image, '/');
        }

        return null;
    }
}
