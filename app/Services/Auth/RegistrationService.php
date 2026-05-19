<?php

namespace App\Services\Auth;

use App\Contracts\Auth\RegistrationServiceInterface;
use App\Enums\ApprovalStatusEnum;
use App\Enums\RestaurantStatusEnum;
use App\Enums\UserRoleEnum;
use App\Enums\UserStatusEnum;
use App\Models\CustomerProfile;
use App\Models\DriverProfile;
use App\Models\Restaurant;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Files\ImageUploadService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RegistrationService implements RegistrationServiceInterface
{
    public function __construct(
        protected UserRepositoryInterface $users,
        protected ImageUploadService $imageUpload,
    ) {
    }

    protected array $profiles = [
        'customer' => CustomerProfile::class,
        'driver' => DriverProfile::class,
    ];

    public function register(array $data, string $type): User
    {
        return DB::transaction(function () use ($data, $type) {

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

            $role = UserRoleEnum::from($type);
            $user->syncRoles([$role->value]);

            $profileModel = $this->profiles[$type] ?? null;

            if (! $profileModel) {
                throw new \InvalidArgumentException('Invalid registration type.');
            }

            $profileAttributes = [
                'first_name' => $this->firstName($data['name']),
                'last_name' => $this->lastName($data['name']),
            ];

            // Driver-only: persist the profile photo uploaded at signup.
            if ($type === 'driver' && isset($data['profile_photo'])) {
                $profileAttributes['profile_photo'] = $this->imageUpload->save(
                    $data['profile_photo'],
                    'driver/profile',
                );
            }

            $profileModel::updateOrCreate(
                ['user_id' => $user->id],
                $profileAttributes,
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

            // Registration only collects name/email/mobile (mirrors the customer
            // flow). All other restaurant details are filled in via the partner
            // application steps; we pre-seed owner_email / owner_mobile so the
            // Step 1 form can show them as defaults.
            Restaurant::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $data['name'],
                    'owner_email' => $data['email'] ?? null,
                    'owner_mobile' => $this->canonicalMobile($data),
                    'status' => RestaurantStatusEnum::PENDING_APPROVAL->value,
                    'approval_status' => ApprovalStatusEnum::PENDING->value,
                    'application_step' => 1,
                ],
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
        $number = preg_replace('/[\s\-]+/', '', (string) $data['mobile']);

        if (Str::startsWith($number, '+')) {
            return $number;
        }

        if (Str::startsWith($number, '00')) {
            return '+'.substr($number, 2);
        }

        return $code.ltrim($number, '0');
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
