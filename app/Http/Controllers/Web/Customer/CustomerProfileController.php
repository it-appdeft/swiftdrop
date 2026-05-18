<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Auth\OtpFlowServiceInterface;
use App\Contracts\Profile\CustomerProfileServiceInterface;
use App\Enums\UserRoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Requests\Customer\Profile\AddAddressRequest;
use App\Http\Requests\Customer\Profile\DeleteAccountRequest;
use App\Http\Requests\Customer\Profile\UpdateAddressRequest;
use App\Http\Requests\Customer\Profile\UpdateProfileRequest;
use App\Models\DeletionReason;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Web counterpart to {@see \App\Http\Controllers\Api\Customer\CustomerProfileController}.
 * Reuses the same service, form requests and resources — only the response
 * layer differs (Inertia renders / session redirects instead of JSON).
 */
class CustomerProfileController extends Controller
{
    public function __construct(
        protected CustomerProfileServiceInterface $profile,
        protected OtpFlowServiceInterface $otpFlow,
    ) {
    }

    // ── Profile ────────────────────────────────────────────────────────────

    public function show(): Response
    {
        $user = Auth::user();
        $user->loadProfileRelation();

        $reasons = DeletionReason::query()
            ->active()
            ->forRole(UserRoleEnum::CUSTOMER->value)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        // Build the customer payload explicitly so Inertia receives plain
        // arrays. Passing JsonResource / ResourceCollection instances ends
        // up with `{data: [...]}` wrappers around nested fields (addresses,
        // deletionReasons) once Laravel JSON-serializes them.
        $profile = $user->customerProfile;
        $customer = $profile ? [
            'id' => $profile->id,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                // Split form for the dropdown / display; canonical form
                // is what the OTP endpoints expect as `target`.
                'country_code' => $user->country_code,
                'mobile' => $user->mobile,
                'canonical_mobile' => $user->canonical_mobile,
            ],
            'first_name' => $profile->first_name,
            'last_name' => $profile->last_name,
            'profile_photo' => $profile->profile_photo,
            'date_of_birth' => optional($profile->date_of_birth)->toDateString(),
            'addresses' => $profile->addresses
                ->sortByDesc('is_default')
                ->values()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'label' => $a->label,
                    'address_line_1' => $a->address_line_1,
                    'address_line_2' => $a->address_line_2,
                    'city' => $a->city,
                    'county' => $a->county,
                    'postcode' => $a->postcode,
                    'lat' => (float) $a->lat,
                    'lng' => (float) $a->lng,
                    'is_default' => (bool) $a->is_default,
                ])
                ->all(),
        ] : null;

        $deletionReasons = $reasons->map(fn ($r) => [
            'id' => $r->id,
            'label' => $r->label,
            'slug' => $r->slug,
            'is_other' => $r->isOther(),
            'sort_order' => $r->sort_order,
        ])->all();

        return Inertia::render('customer/profile', [
            'customer' => $customer,
            'deletionReasons' => $deletionReasons,
        ]);
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $this->profile->updateProfile(Auth::user(), $request->validated());

        return back()->with('status', 'Profile updated.');
    }

    // ── Addresses ──────────────────────────────────────────────────────────

    public function addAddress(AddAddressRequest $request): RedirectResponse
    {
        $this->profile->addAddress(Auth::user(), $request->validated());

        return back()->with('status', 'Address added.');
    }

    public function updateAddress(int $addressId, UpdateAddressRequest $request): RedirectResponse
    {
        $this->profile->updateAddress(Auth::user(), $addressId, $request->validated());

        return back()->with('status', 'Address updated.');
    }

    public function deleteAddress(int $addressId): RedirectResponse
    {
        $this->profile->deleteAddress(Auth::user(), $addressId);

        return back()->with('status', 'Address deleted.');
    }

    public function setDefaultAddress(int $addressId): RedirectResponse
    {
        $this->profile->setDefaultAddress(Auth::user(), $addressId);

        return back()->with('status', 'Default address updated.');
    }

    // ── Change phone / email OTP (uses unified OtpFlowService) ─────────────

    /**
     * Generic OTP sender for the four authed flows used by the change
     * phone / email screens: verify_current_phone, verify_current_email,
     * update_phone, update_email. The same SendOtpRequest validates each.
     */
    public function sendOtp(SendOtpRequest $request): RedirectResponse
    {
        $payload = $this->otpFlow->send(
            type: $request->otpType(),
            channel: $request->channel(),
            target: $request->target(),
            userType: $request->userRole(),
            authUser: Auth::user(),
        );

        return back()->with('otp', $payload);
    }

    /**
     * Verifies a code for the same four authed flows. Mutation (if any)
     * happens inside OtpFlowService — controllers stay thin.
     */
    public function verifyOtp(VerifyOtpRequest $request): RedirectResponse
    {
        $result = $this->otpFlow->verify(
            type: $request->otpType(),
            channel: $request->channel(),
            target: $request->target(),
            code: $request->code(),
            userType: $request->userRole(),
            authUser: Auth::user(),
        );

        return back()->with('otpResult', $result);
    }

    // ── Account deletion ───────────────────────────────────────────────────

    public function initiateDeletion(): RedirectResponse
    {
        $target = $this->profile->initiateDeletion(Auth::user());

        return back()->with('deletion', [
            'target' => $target,
            'expires_in' => (int) config('services.otp.ttl_seconds', 300),
            'test_code' => config('services.otp.test_code'),
        ]);
    }

    public function deleteAccount(DeleteAccountRequest $request): RedirectResponse
    {
        $this->profile->deleteAccount(Auth::user(), $request->validated());

        // The user row is soft-deleted at this point — terminate the
        // session so the next request doesn't try to load a trashed user.
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')->with('status', 'Your account has been deleted.');
    }
}
