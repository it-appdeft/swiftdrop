<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CustomerCartData;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CartItemModifier;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Customer cart shape shared by the cart endpoints AND embedded into the
 * restaurant detail payload (so the page can render in-list quantity steppers
 * and the sticky "cart added" bar). A null/empty cart serialises to a zeroed,
 * item-less payload so the frontend has one code path.
 *
 * @property CustomerCartData $resource
 */
class CustomerCartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var CustomerCartData $data */
        $data = $this->resource;
        $cart = $data->cart;

        if (! $cart instanceof Cart) {
            return $this->emptyPayload();
        }

        $items = $cart->items->map(fn (CartItem $item) => $this->line($item));

        return [
            'id' => $cart->id,
            'restaurant_id' => $cart->restaurant_id,
            'restaurant' => $cart->restaurant ? [
                'id' => $cart->restaurant->id,
                'name' => $cart->restaurant->name,
                'logo_url' => $cart->restaurant->logo_url,
            ] : null,
            'items' => $items->values()->all(),
            // Sum of quantities — the "2 items" badge on the bar / header.
            'item_count' => (int) $items->sum('quantity'),
            // Distinct lines — useful for the cart page.
            'line_count' => $items->count(),
            'subtotal' => round((float) $items->sum('line_total'), 2),
        ];
    }

    /** @return array<string, mixed> */
    protected function line(CartItem $item): array
    {
        $unitPrice = (float) $item->unit_price;

        return [
            'id' => $item->id,
            'menu_item_id' => $item->menu_item_id,
            'name' => $item->menuItem?->name,
            'is_veg' => (bool) $item->menuItem?->is_veg,
            'image_url' => $this->dishImageUrl($item),
            'unit_price' => $unitPrice,
            'quantity' => (int) $item->quantity,
            'line_total' => round($unitPrice * (int) $item->quantity, 2),
            'modifiers' => $item->modifiers->map(fn (CartItemModifier $m) => [
                'group_id' => $m->modifier_group_id,
                'group_name' => $m->group_name,
                'option_id' => $m->modifier_option_id,
                'option_name' => $m->option_name,
                'price_delta' => (float) $m->price_delta,
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    protected function emptyPayload(): array
    {
        return [
            'id' => null,
            'restaurant_id' => null,
            'restaurant' => null,
            'items' => [],
            'item_count' => 0,
            'line_count' => 0,
            'subtotal' => 0.0,
        ];
    }

    protected function dishImageUrl(CartItem $item): ?string
    {
        $foodType = $item->menuItem?->foodType;
        if ($foodType && $foodType->image) {
            return '/storage/'.ltrim($foodType->image, '/');
        }

        return null;
    }

    protected function absoluteUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return '/storage/'.ltrim($path, '/');
    }
}
