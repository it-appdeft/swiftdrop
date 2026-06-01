<?php

namespace App\Http\Resources\Customer;

use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A single matching dish on the search Items tab. Shared by the web
 * ({@see CustomerSearchResource}) and api ({@see CustomerSearchApiResource})
 * search payloads so the dish shape stays in one place.
 *
 * @property MenuItem $resource
 */
class SearchDishResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var MenuItem $m */
        $m = $this->resource;

        return [
            'id' => $m->id,
            'name' => $m->name,
            'description' => $m->description,
            'price' => (float) $m->price,
            'is_veg' => (bool) $m->is_veg,
            'image_url' => $this->imageUrl($m),
            // Drives the customise dialog on the search dish-card. Empty array →
            // dish adds straight to cart.
            'modifier_groups' => $m->relationLoaded('modifierGroups')
                ? $m->modifierGroups->map(function ($g) use ($m) {
                    // Per-dish prices for price-driver options: option id → price.
                    $itemPrices = $m->relationLoaded('modifierOptions')
                        ? $m->modifierOptions->mapWithKeys(fn ($o) => [(int) $o->id => (float) $o->pivot->price])
                        : collect();

                    $options = $g->is_price_driver
                        ? $g->options->filter(fn ($o) => $itemPrices->has((int) $o->id))
                        : $g->options;

                    return [
                        'id' => $g->id,
                        'name' => $g->name,
                        'description' => $g->description,
                        'selection_type' => $g->selection_type,
                        'is_price_driver' => (bool) $g->is_price_driver,
                        'is_required' => (bool) $g->is_required,
                        'min_selections' => (int) $g->min_selections,
                        'max_selections' => $g->max_selections !== null ? (int) $g->max_selections : null,
                        'options' => $options->map(fn ($o) => [
                            'id' => $o->id,
                            'name' => $o->name,
                            'price_delta' => $g->is_price_driver
                                ? (float) ($itemPrices[(int) $o->id] ?? 0)
                                : (float) $o->price_delta,
                            'is_default' => (bool) $o->is_default,
                        ])->values()->all(),
                    ];
                })->values()->all()
                : [],
        ];
    }

    /**
     * Prefer the dish's own uploaded photo (the `image` collection set in Menu
     * Management); fall back to the linked food-type's stock image only when
     * the dish has none of its own. Mirrors the restaurant-detail resource.
     */
    protected function imageUrl(MenuItem $item): ?string
    {
        $own = $item->relationLoaded('uploads')
            ? $item->uploads->firstWhere('collection', 'image')
            : $item->uploadsIn('image')->first();

        if ($own && $own->url) {
            return $own->url;
        }

        $foodType = $item->foodType;

        return $foodType && $foodType->image ? '/storage/'.ltrim($foodType->image, '/') : null;
    }
}
