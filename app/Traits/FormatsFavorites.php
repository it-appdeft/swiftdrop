<?php

namespace App\Traits;

use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Support\Collection;

/**
 * Shared row shapes for the customer favourites lists, so the web and API
 * favourite endpoints emit an identical payload.
 */
trait FormatsFavorites
{
    /**
     * @param  Collection<int, Restaurant>  $restaurants
     * @return array<int, array<string, mixed>>
     */
    protected function favoriteRestaurantRows(Collection $restaurants): array
    {
        return $restaurants->map(fn (Restaurant $r) => [
            'id' => $r->id,
            'name' => $r->name,
            'tagline' => $r->tagline,
            'cuisines' => $r->cuisines,
            'city' => $r->city,
            'logo_url' => $r->logo_path ? '/storage/'.ltrim($r->logo_path, '/') : null,
            'cover_url' => $r->cover_photo_path ? '/storage/'.ltrim($r->cover_photo_path, '/') : null,
            // "No reviews yet" reads as unrated, matching the rest of the app.
            'rating' => ((int) $r->total_reviews) > 0 && $r->rating !== null ? (float) $r->rating : null,
            'total_reviews' => (int) $r->total_reviews,
            'is_favorited' => true,
        ])->values()->all();
    }

    /**
     * @param  Collection<int, MenuItem>  $items
     * @return array<int, array<string, mixed>>
     */
    protected function favoriteMenuItemRows(Collection $items): array
    {
        return $items->map(function (MenuItem $m) {
            $restaurant = $m->relationLoaded('restaurant') ? $m->restaurant : null;
            // menu_items carry no own rating — surface the restaurant's.
            $rating = $restaurant && ((int) $restaurant->total_reviews) > 0 && $restaurant->rating !== null
                ? (float) $restaurant->rating
                : null;

            return [
                'id' => $m->id,
                'restaurant_id' => $m->restaurant_id,
                'restaurant_name' => $restaurant?->name,
                'name' => $m->name,
                'description' => $m->description,
                'price' => (float) $m->price,
                'is_veg' => (bool) $m->is_veg,
                'image_url' => $m->foodItem && $m->foodItem->image
                    ? '/storage/'.ltrim($m->foodItem->image, '/')
                    : null,
                'rating' => $rating,
                'is_favorited' => true,
            ];
        })->values()->all();
    }
}
