<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Profile\CustomerProfileServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Profile\AddAddressRequest;
use App\Http\Requests\Customer\Profile\DeleteAccountRequest;
use App\Http\Requests\Customer\Profile\UpdateAddressRequest;
use App\Http\Requests\Customer\Profile\UpdateProfileRequest;
use App\Http\Resources\Customer\AddressResource;
use App\Http\Resources\Customer\CustomerProfileResource;
use App\Models\Order;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerProfileController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerProfileServiceInterface $profile,
    ) {
    }

    public function show(): JsonResponse
    {
        $user = auth('sanctum')->user();

        return $this->success(
            data: new CustomerProfileResource($user->customerProfile),
            message: 'Profile retrieved.',
        );
    }

    /**
     * Paginated past orders for the customer. 10 per page by default.
     */
    public function orders(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(50, (int) $request->query('per_page', 10)));

        $paginator = Order::query()
            ->where('user_id', $user->id)
            ->with(['restaurant:id,name,city,full_address,logo_path,cover_photo_path', 'items:id,order_id,name,quantity'])
            ->orderByDesc('placed_at')
            ->orderByDesc('id')
            ->paginate(perPage: $perPage, page: $page);

        $rows = $paginator->getCollection()
            ->map(function (Order $order) {
                $restaurant = $order->restaurant;
                $image = $restaurant?->cover_photo_path ?? $restaurant?->logo_path;

                return [
                    'id' => $order->id,
                    'restaurant' => $restaurant?->name ?? 'Restaurant',
                    'location' => $restaurant?->city ?? $restaurant?->full_address ?? '',
                    'image' => $image ? '/storage/'.ltrim($image, '/') : null,
                    'status' => $order->status,
                    'items' => $order->items->map(fn ($i) => [
                        'qty' => (int) $i->quantity,
                        'name' => $i->name,
                    ])->all(),
                    'placed_at' => optional($order->placed_at ?? $order->created_at)->format('F j, g:i A'),
                ];
            })->values()->all();

        return $this->success(
            data: [
                'orders' => $rows,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
            message: 'Orders retrieved.',
        );
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->updateProfile($user, $request->validated());

        return $this->success(
            data: new CustomerProfileResource($updatedUser->customerProfile),
            message: 'Profile updated.',
        );
    }

    public function addAddress(AddAddressRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $address = $this->profile->addAddress($user, $request->validated());

        return $this->success(
            data: new AddressResource($address),
            message: 'Address added successfully.',
            status: 201,
        );
    }

    public function updateAddress(int $addressId, UpdateAddressRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $address = $this->profile->updateAddress($user, $addressId, $request->validated());

        return $this->success(
            data: new AddressResource($address),
            message: 'Address updated successfully.',
        );
    }

    public function deleteAddress(int $addressId): JsonResponse
    {
        $user = auth('sanctum')->user();
        $this->profile->deleteAddress($user, $addressId);

        return $this->success(
            message: 'Address deleted successfully.',
        );
    }

    public function setDefaultAddress(int $addressId): JsonResponse
    {
        $user = auth('sanctum')->user();
        $address = $this->profile->setDefaultAddress($user, $addressId);

        return $this->success(
            data: new AddressResource($address),
            message: 'Default address updated.',
        );
    }

    public function setSelectedAddress(int $addressId): JsonResponse
    {
        $user = auth('sanctum')->user();
        $address = $this->profile->setSelectedAddress($user, $addressId);

        return $this->success(
            data: new AddressResource($address),
            message: 'Selected address updated.',
        );
    }

    public function initiateDeletion(): JsonResponse
    {
        $user = auth('sanctum')->user();
        $target = $this->profile->initiateDeletion($user);

        return $this->success(
            data: [
                'target' => $target,
                'expires_in' => (int) config('services.otp.ttl_seconds', 300),
                'test_code' => config('services.otp.test_code'),
            ],
            message: 'Verification code sent.',
        );
    }

    public function deleteAccount(DeleteAccountRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $this->profile->deleteAccount($user, $request->validated());

        return $this->success(
            message: 'Account deleted successfully.',
        );
    }
}
