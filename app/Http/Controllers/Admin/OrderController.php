<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Enums\OrderStatusEnum;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Order::query()
            ->with([
                'restaurant',
                'customer.customerProfile',
                'address',
                'payment:id,order_id,method,status',
                'items.modifiers',
                'items.menuItem:id,is_veg',
                'items.menuItem.uploads' => fn ($q) => $q->where('collection', 'image'),
            ]);

        if ($request->filled('status')) {
            match ($request->status) {
                'new' => $query->where('status', OrderStatusEnum::PLACED),

                'preparing' => $query->whereIn('status', [
                    OrderStatusEnum::ACCEPTED,
                    OrderStatusEnum::PREPARING,
                ]),

                'ready' => $query->where('status', OrderStatusEnum::READY_FOR_PICKUP),

                'out_for_delivery' => $query->where('status', OrderStatusEnum::OUT_FOR_DELIVERY),

                'completed' => $query->where('status', OrderStatusEnum::DELIVERED),

                'cancelled' => $query->where('status', OrderStatusEnum::CANCELLED),

                default => null,
            };
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhereHas('restaurant', fn ($r) =>
                        $r->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('customer.customerProfile', fn ($c) =>
                        $c->where('first_name', 'like', "%{$search}%"))
                    ->orWhereHas('customer.customerProfile', fn ($c) =>
                        $c->where('last_name', 'like', "%{$search}%"));
            });
        }

        $orders = $query
            ->latest('placed_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => [
                'data' => $this->serializeOrders($orders->getCollection()),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'links' => $orders->linkCollection(),
            ],
           'counts' => [
                'all' => Order::count(),
                'new' => Order::where('status', OrderStatusEnum::PLACED)->count(),
                'preparing' => Order::whereIn('status', [
                    OrderStatusEnum::ACCEPTED,
                    OrderStatusEnum::PREPARING,
                ])->count(),
                'ready' => Order::where('status', OrderStatusEnum::READY_FOR_PICKUP)->count(),
                'out_for_delivery' => Order::where('status', OrderStatusEnum::OUT_FOR_DELIVERY)->count(),
                'completed' => Order::where('status', OrderStatusEnum::DELIVERED)->count(),
                'cancelled' => Order::where('status', OrderStatusEnum::CANCELLED)->count(),
            ],
        ]);
    }

    protected function serializeOrders($orders): array
    {
        return $orders->map(fn (Order $order) => [
            'id'         => $order->uuid,
            'reference'  => 'SD-'.$order->id,

            'restaurant' => [
                'id'   => $order->restaurant?->id,
                'name' => $order->restaurant?->name,
            ],

            'customer' => [
                'name'    => $order->customer?->name ?? 'Guest',
                'address' => $this->formatAddress($order),
                'phone'   => $order->customer?->canonical_mobile,
            ],

            'items' => $order->items->map(fn (OrderItem $item) => [
                'name'      => (string) $item->name,
                'qty'       => (int) $item->quantity,
                'price'     => (float) $item->unit_price,
                'image'     => $item->menuItem?->uploads->first()?->url ?? '',
                'veg'       => (bool) ($item->menuItem?->is_veg ?? false),
                'modifiers' => $item->modifiers
                    ->map(fn ($m) => (string) $m->option_name)
                    ->all(),
            ])->all(),

            'subtotal'    => (float) $order->subtotal,
            'deliveryFee' => (float) $order->delivery_fee,
            'discount'    => (float) $order->discount_amount,
            'vat'         => (float) $order->vat_amount,
            'total'       => (float) $order->total,

            'payment'  => $order->payment?->method === 'cod'
                ? 'cod'
                : 'prepaid',

            'status'   => $order->status->boardStatus(),
            'placedAt' => optional(
                $order->placed_at ?? $order->created_at
            )->toIso8601String(),

            'note' => $order->special_instructions,
        ])->all();
    }

    protected function formatAddress(Order $order): string
    {
        $address = $order->address;

        if (! $address) {
            return 'Address unavailable';
        }

        return collect([
            $address->address_line_1,
            $address->address_line_2,
            $address->city,
            $address->postcode,
        ])->filter()->implode(', ');
    }
}