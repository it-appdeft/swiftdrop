<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Restaurant > Orders. Serves the live order queue for the partner's
 * restaurant. The React page at resources/js/restaurant/pages/orders/index.tsx
 * reads the bootstrap via Inertia props; filtering / search stays client-side
 * for now since the whole queue is a small working set.
 */
class OrderController extends Controller
{
    /**
     * Internal order statuses → the six buckets the orders board renders.
     * `accepted` folds into "preparing" and `delivered` into "completed" so
     * the partner sees a queue-oriented view rather than every raw state.
     */
    protected const STATUS_MAP = [
        'placed'           => 'new',
        'accepted'         => 'preparing',
        'preparing'        => 'preparing',
        'ready_for_pickup' => 'ready',
        'out_for_delivery' => 'out_for_delivery',
        'delivered'        => 'completed',
        'cancelled'        => 'cancelled',
    ];

    public function index(Request $request): Response
    {
        $restaurant = $this->restaurantFor($request->user());

        $orders = $restaurant
            ? $restaurant->orders()
                ->with([
                    // `name` is an accessor backed by customerProfile, not a
                    // users column — eager-load the profile so it resolves.
                    'customer.customerProfile',
                    'address',
                    'payment:id,order_id,method,status',
                    'items.modifiers',
                    'items.menuItem:id,is_veg',
                    'items.menuItem.uploads' => fn ($q) => $q->where('collection', 'image'),
                ])
                ->latest('placed_at')
                ->latest('id')
                ->get()
            : collect();

        return Inertia::render('restaurant/orders', [
            'orders'         => $this->serializeOrders($orders),
            'commissionRate' => (float) ($restaurant?->commission_rate ?? 0),
        ]);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Order>  $orders
     * @return array<int, array<string, mixed>>
     */
    protected function serializeOrders($orders): array
    {
        return $orders->map(fn (Order $order) => [
            'id'        => $order->uuid,
            'reference' => 'SD-'.$order->id,
            'customer'  => [
                'name'    => $order->customer?->name ?? 'Guest',
                'address' => $this->formatAddress($order),
                'phone'   => $order->customer?->canonical_mobile,
            ],
            'items'    => $order->items->map(fn (OrderItem $item) => [
                'name'      => (string) $item->name,
                'qty'       => (int) $item->quantity,
                'price'     => (float) $item->unit_price,
                'image'     => $item->menuItem?->uploads->first()?->url ?? '',
                'veg'       => (bool) ($item->menuItem?->is_veg ?? false),
                'modifiers' => $item->modifiers->map(fn ($m) => (string) $m->option_name)->all(),
            ])->all(),
            'subtotal'    => (float) $order->subtotal,
            'deliveryFee' => (float) $order->delivery_fee,
            'discount'    => (float) $order->discount_amount,
            'vat'         => (float) $order->vat_amount,
            'total'       => (float) $order->total,
            'payment'     => $order->payment?->method === 'cod' ? 'cod' : 'prepaid',
            'status'      => self::STATUS_MAP[$order->status] ?? 'new',
            'placedAt'    => optional($order->placed_at ?? $order->created_at)->toIso8601String(),
            'note'        => $order->special_instructions,
        ])->all();
    }

    /** One-line delivery address from the order's (nullable) saved address. */
    protected function formatAddress(Order $order): string
    {
        $address = $order->address;
        if ($address === null) {
            return 'Address unavailable';
        }

        return collect([
            $address->address_line_1,
            $address->address_line_2,
            $address->city,
            $address->postcode,
        ])->filter()->implode(', ');
    }

    protected function restaurantFor(?User $user): ?Restaurant
    {
        return $user?->restaurant()->first();
    }
}
