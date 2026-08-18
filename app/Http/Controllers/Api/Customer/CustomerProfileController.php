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
use App\Support\PaginationMeta;
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
            ->with(['restaurant:id,name,city,full_address', 'restaurant.uploads', 'items:id,order_id,name,quantity'])
            ->orderByDesc('placed_at')
            ->orderByDesc('id')
            ->paginate(perPage: $perPage, page: $page);

        $rows = $paginator->getCollection()
            ->map(function (Order $order) {
                $restaurant = $order->restaurant;

                return [
                    'id' => $order->id,
                    'uuid' => $order->uuid,
                    'restaurant' => $restaurant?->name ?? 'Restaurant',
                    'location' => $restaurant?->city ?? $restaurant?->full_address ?? '',
                    'image' => $restaurant?->banner_url ?? $restaurant?->logo_url,
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
                'pagination' => PaginationMeta::make($paginator),
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

    /**
     * Paginated saved addresses (selected → default → newest first), 10/page.
     */
    public function addresses(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(50, (int) $request->query('per_page', 10)));
        $profile = $user->customerProfile;

        $paginator = $profile
            ? $profile->addresses()
                ->orderByDesc('is_selected')
                ->orderByDesc('is_default')
                ->orderByDesc('id')
                ->paginate(perPage: $perPage, page: $page)
            : new \Illuminate\Pagination\LengthAwarePaginator(items: [], total: 0, perPage: $perPage, currentPage: $page);

        return $this->success(
            data: [
                'addresses' => AddressResource::collection($paginator->getCollection())->resolve($request),
                'pagination' => PaginationMeta::make($paginator),
            ],
            message: 'Addresses retrieved.',
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
