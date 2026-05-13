<?php

namespace App\Services\Auth;

use App\Contracts\Auth\RegistrationServiceInterface;
use App\Enums\ApprovalStatusEnum;
use App\Enums\RestaurantStatusEnum;
use App\Enums\UserRoleEnum;
use App\Enums\UserStatusEnum;
use App\Models\CustomerProfile;
use App\Models\Restaurant;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RegistrationService implements RegistrationServiceInterface
{
    public function __construct(
        protected UserRepositoryInterface $users,
    ) {
    }

    public function registerCustomer(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->users->upsertByMobileOrEmail(
                mobile: $this->canonicalMobile($data),
                email: $data['email'] ?? null,
                attributes: [
                    'mobile' => $this->canonicalMobile($data),
                    'email' => $data['email'] ?? null,
                    'password' => isset($data['password']) ? Hash::make($data['password']) : null,
                    'status' => UserStatusEnum::ACTIVE->value,
                ],
            );

            $user->syncRoles([UserRoleEnum::CUSTOMER->value]);

            CustomerProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'first_name' => $this->firstName($data['name']),
                    'last_name' => $this->lastName($data['name']),
                ],
            );

            return $user->fresh()->loadProfileRelation();
        });
    }

    public function registerRestaurant(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->users->upsertByMobileOrEmail(
                mobile: $this->canonicalMobile($data),
                email: $data['email'] ?? null,
                attributes: [
                    'mobile' => $this->canonicalMobile($data),
                    'email' => $data['email'] ?? null,
                    'password' => isset($data['password']) ? Hash::make($data['password']) : null,
                    'status' => UserStatusEnum::PENDING_APPROVAL->value,
                ],
            );

            $user->syncRoles([UserRoleEnum::RESTAURANT_OWNER->value]);

            Restaurant::updateOrCreate(
                ['user_id' => $user->id],
                array_filter([
                    'name' => $data['name'],
                    'description' => $data['description'] ?? null,
                    'address_line_1' => $data['address_line_1'] ?? null,
                    'address_line_2' => $data['address_line_2'] ?? null,
                    'city' => $data['city'] ?? null,
                    'county' => $data['county'] ?? null,
                    'postcode' => $data['postcode'] ?? null,
                    'lat' => $data['lat'] ?? null,
                    'lng' => $data['lng'] ?? null,
                    'phone' => $this->canonicalMobile($data),
                    'cuisine_type' => $data['cuisine_type'] ?? null,
                    'status' => RestaurantStatusEnum::PENDING_APPROVAL->value,
                    'approval_status' => ApprovalStatusEnum::PENDING->value,
                ], fn ($v) => $v !== null),
            );

            return $user->fresh()->loadProfileRelation();
        });
    }

    protected function canonicalMobile(array $data): ?string
    {
        if (empty($data['mobile'])) {
            return null;
        }

        $code = $data['country_code'] ?? '';
        $number = preg_replace('/\s+/', '', (string) $data['mobile']);

        return Str::startsWith($number, '+') ? $number : ($code.$number);
    }

    protected function firstName(string $name): string
    {
        return Str::before(trim($name), ' ') ?: $name;
    }

    protected function lastName(string $name): string
    {
        $rest = Str::after(trim($name), ' ');

        return $rest === $name ? '' : trim($rest);
    }
}
