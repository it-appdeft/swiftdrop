<?php

namespace App\Services\Driver;

use App\Contracts\Driver\OrderStatusServiceInterface;
use App\Contracts\Order\OrderStatusTransitionServiceInterface;
use App\Enums\OrderStatusEnum;
use App\Exceptions\InvalidInputException;
use App\Exceptions\ResourceNotFoundException;
use App\Jobs\AutoAdvanceOrderToOutForDeliveryJob;
use App\Models\Delivery;
use App\Models\DriverEarning;
use App\Models\DriverProfile;
use App\Models\Order;
use App\Models\User;
use App\Services\Platform\PlatformConfigService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class OrderStatusService implements OrderStatusServiceInterface
{
    public function __construct(
        protected OrderStatusTransitionServiceInterface $transitions,
        protected PlatformConfigService $config,
    ) {
    }

    public function updateStatus(User $user, int $deliveryId, string $status, ?string $otp): Delivery
    {
        $profile = $this->profileOrFail($user);

        return DB::transaction(function () use ($profile, $deliveryId, $status, $otp) {
            /** @var Delivery|null $delivery */
            $delivery = Delivery::query()->lockForUpdate()->find($deliveryId);

            if (! $delivery || $delivery->driver_id !== $profile->id) {
                throw ResourceNotFoundException::for('Delivery', 'delivery');
            }

            /** @var Order|null $order */
            $order = Order::query()->lockForUpdate()->find($delivery->order_id);

            if (! $order) {
                throw ResourceNotFoundException::for('Order', 'order');
            }

            $newStatus = OrderStatusEnum::from($status);

            // Idempotent no-op on a retried request: skip re-checking the
            // OTP and re-triggering the delivery-side side effects below —
            // transition() itself is a no-op too, since the order is already there.
            $alreadyAtStatus = $order->status === $newStatus;

            if (! $alreadyAtStatus) {
                if ($status === 'picked_up') {
                    $this->verifyOtp($order->pick_up_code, $otp);
                } elseif ($status === 'delivered') {
                    $this->verifyOtp($order->delivery_code, $otp);
                }
            }

            $now = Carbon::now();

            $orderFields = [];
            if ($status === 'picked_up') {
                $orderFields['picked_up_at'] = $now;
            } elseif ($status === 'delivered') {
                $orderFields['delivered_at'] = $now;
            }

            $this->transitions->transition($order, $newStatus, $profile->user_id, $orderFields);

            // The deliveries.status enum only has picked_up/delivered as
            // handover states — reached_restaurant lives on the order only,
            // the delivery stays `assigned` until pickup. Driver actions are
            // the only thing allowed to write here (see
            // OrderStatusTransitionService, which never touches this table).
            if (! $alreadyAtStatus && $status === 'picked_up') {
                $delivery->forceFill(['status' => 'picked_up', 'picked_up_at' => $now])->save();

                // Stand-in for the restaurant confirming handover — see the
                // job's docblock.
                AutoAdvanceOrderToOutForDeliveryJob::dispatch($order->id)->delay(now()->addSeconds(10));
            } elseif (! $alreadyAtStatus && $status === 'delivered') {
                $delivery->forceFill(['status' => 'delivered', 'delivered_at' => $now])->save();

                // Credit the driver's earnings ledger — the delivery-history
                // API and the dashboard's "today's earnings" figure both read
                // from here. firstOrCreate guards a duplicate on any retry.
                DriverEarning::firstOrCreate(
                    ['delivery_id' => $delivery->id, 'type' => DriverEarning::TYPE_DELIVERY_FEE],
                    [
                        'driver_id' => $profile->id,
                        'order_id' => $order->id,
                        'amount' => $this->config->float(PlatformConfigService::KEY_BASE_DELIVERY_FEE, 1.99),
                        'status' => DriverEarning::STATUS_PENDING,
                        'earned_at' => $now,
                    ],
                );
            }

            return $delivery->fresh('order');
        });
    }

    /**
     * Check the driver-entered OTP against the stored code. Fails closed —
     * a missing stored code (not yet issued) or missing input never matches.
     */
    private function verifyOtp(?string $expected, ?string $otp): void
    {
        if ($expected === null || $otp === null || ! hash_equals($expected, $otp)) {
            throw InvalidInputException::make('Invalid OTP.', 'otp');
        }
    }

    private function profileOrFail(User $user): DriverProfile
    {
        $profile = $user->driverProfile;

        if (! $profile instanceof DriverProfile) {
            throw ResourceNotFoundException::for('Driver profile');
        }

        return $profile;
    }
}
