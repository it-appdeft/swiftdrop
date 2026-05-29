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
                ? $m->modifierGroups->map(fn ($g) => [
                    'id' => $g->id,
                    'name' => $g->name,
                    'description' => $g->description,
                    'selection_type' => $g->selection_type,
                    'is_required' => (bool) $g->is_required,
                    'min_selections' => (int) $g->min_selections,
                    'max_selections' => $g->max_selections !== null ? (int) $g->max_selections : null,
                    'options' => $g->options->map(fn ($o) => [
                        'id' => $o->id,
                        'name' => $o->name,
                        'price_delta' => (float) $o->price_delta,
                    ])->values()->all(),
                ])->values()->all()
                : [],
        ];
    }

    protected function imageUrl(MenuItem $item): ?string
    {
        $foodType = $item->foodType;

        return $foodType && $foodType->image ? '/storage/'.ltrim($foodType->image, '/') : null;
    }
}
