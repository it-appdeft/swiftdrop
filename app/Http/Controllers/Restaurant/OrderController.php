<?php

namespace App\Http\Controllers\Restaurant;

use App\Contracts\Restaurant\RestaurantOrderServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\User;
use App\Enums\OrderStatusEnum;
use Illuminate\Http\RedirectResponse;
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
    public function __construct(
        protected RestaurantOrderServiceInterface $orders,
    ) {
    }

    public function index(Request $request): Response
    {
        $restaurant = $this->restaurantFor($request->user());

        $query = $restaurant
            ? $restaurant->orders()
                ->with([
                    'customer.customerProfile',
                    'address',
                    'payment:id,order_id,method,status',
                    'items.modifiers',
                    'items.menuItem:id,is_veg',
                    'items.menuItem.uploads' => fn ($q) => $q->where('collection', 'image'),
                    'delivery.driver.user:id,mobile,country_code',
                    'statusHistories' => fn ($q) => $q->oldest('id'),
                ]) : collect();

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

                'cancelled' => $query->whereIn('status', [OrderStatusEnum::CANCELLED, OrderStatusEnum::REJECTED]),

                default => null,
            };
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
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

        return Inertia::render('restaurant/orders', [
            'orders' => [
                'data' => $this->serializeOrders($orders->getCollection()),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'links' => $orders->linkCollection(),
            ],
            'commissionRate' => (float) ($restaurant?->commission_rate ?? 0),
            'counts' => [
                'all' => $restaurant->orders()->count(),
                'new' => $restaurant->orders()->where('status', OrderStatusEnum::PLACED)->count(),
                'preparing' => $restaurant->orders()->whereIn('status', [
                    OrderStatusEnum::ACCEPTED,
                    OrderStatusEnum::PREPARING,
                ])->count(),
                'ready' => $restaurant->orders()->where('status', OrderStatusEnum::READY_FOR_PICKUP)->count(),
                'out_for_delivery' => $restaurant->orders()->where('status', OrderStatusEnum::OUT_FOR_DELIVERY)->count(),
                'completed' => $restaurant->orders()->where('status', OrderStatusEnum::DELIVERED)->count(),
                'cancelled' => $restaurant->orders()->whereIn('status', [OrderStatusEnum::CANCELLED, OrderStatusEnum::REJECTED])->count(),
            ],
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
            'status'      => $order->status->boardStatus(),
            // The underlying enum value — mostly for display/debugging now.
            // Button gating below uses preparingAt/readyAt instead, since
            // `status` can race ahead to driver_assigned (or further) before
            // the kitchen has clicked through its own steps — the two tracks
            // run independently (see OrderStatusTransitionService).
            'rawStatus'   => $order->status->value,
            'placedAt'    => optional($order->placed_at ?? $order->created_at)->toIso8601String(),
            'note'        => $order->special_instructions,
            // Handed to the driver on collection; only set once a driver has
            // accepted the delivery (see DriverDashboardService::acceptDelivery()).
            'pickUpCode'  => $order->pick_up_code,
            // Kitchen's own progress, independent of the driver track — these
            // gate the "Start preparing" / "Mark ready" actions.
            'preparingAt' => optional($order->preparing_at)->toIso8601String(),
            'readyAt'     => optional($order->ready_at)->toIso8601String(),
            'driver'      => $this->formatDriver($order),
            'history'     => $order->statusHistories->map(fn ($h) => [
                'status' => $h->status->value,
                'at'     => $h->created_at->toIso8601String(),
            ])->all(),
        ])->all();
    }

    /** Driver assigned to the order's delivery, once one has accepted it. */
    protected function formatDriver(Order $order): ?array
    {
        $driver = $order->delivery?->driver;
        if ($driver === null) {
            return null;
        }

        return [
            'name'         => trim("{$driver->first_name} {$driver->last_name}") ?: 'Driver',
            'phone'        => $driver->user?->canonical_mobile,
            'vehicleType'  => $driver->vehicle_type,
            'vehicleReg'   => $driver->vehicle_registration,
        ];
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

    /**
     * Accept a newly-placed order into the kitchen. `RestaurantOrderService`
     * enforces ownership + the `placed`-only guard and throws
     * ResourceNotFoundException / InvalidInputException otherwise — both
     * render themselves via the centralized exception handler.
     */
    public function accept(Request $request, string $order): RedirectResponse
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless($restaurant !== null, 403, 'No restaurant profile attached to this account.');

        $this->orders->accept($restaurant, $order);

        return back()->with('status', 'Order accepted.');
    }

    public function reject(Request $request, string $order): RedirectResponse
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless($restaurant !== null, 403, 'No restaurant profile attached to this account.');

        $this->orders->reject($restaurant, $order, $request->string('reason')->toString() ?: null);

        return back()->with('status', 'Order rejected.');
    }

    /**
     * The kitchen side of the status progression: preparing, then
     * ready_for_pickup. out_for_delivery isn't settable here — it's stamped
     * automatically once the driver's own app confirms pickup (see
     * AutoAdvanceOrderToOutForDeliveryJob).
     */
    public function updateStatus(Request $request, string $order): RedirectResponse
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless($restaurant !== null, 403, 'No restaurant profile attached to this account.');

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:preparing,ready_for_pickup'],
        ]);

        $this->orders->updateStatus($restaurant, $order, $validated['status']);

        $message = $validated['status'] === 'preparing' ? 'Order marked preparing.' : 'Order marked ready for pickup.';

        return back()->with('status', $message);
    }

    protected function restaurantFor(?User $user): ?Restaurant
    {
        return $user?->restaurant()->first();
    }
}
