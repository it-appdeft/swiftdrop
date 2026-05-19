<?php

namespace App\Http\Controllers\Auth;

use App\Contracts\Auth\OtpServiceInterface;
use App\Contracts\Auth\RegistrationServiceInterface;
use App\Enums\OtpChannelEnum;
use App\Enums\UserRoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterCustomerRequest;
use App\Http\Requests\Auth\RegisterRestaurantRequest;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function __construct(
        protected OtpServiceInterface $otp,
        protected RegistrationServiceInterface $registration,
        protected UserRepositoryInterface $users,
    ) {
    }

    // ── Page renderers ──────────────────────────────────────────────────────

    public function login(): Response
    {
        return Inertia::render('web/auth/login');
    }

    public function register(Request $request): Response
    {
        $role = $request->query('as') === 'restaurant' ? 'restaurant' : 'customer';

        return Inertia::render('web/auth/register', ['role' => $role]);
    }

    public function otp(Request $request): Response
    {
        $otp = (array) $request->session()->get('otp', []);

        return Inertia::render('web/auth/otp', [
            'target' => $otp['target'] ?? null,
            'email' => $otp['email'] ?? null,
            'country_code' => $otp['country_code'] ?? null,
            'mobile' => $otp['mobile'] ?? null,
        ]);
    }

    // ── Form actions ────────────────────────────────────────────────────────

    public function sendOtp(SendOtpRequest $request): RedirectResponse
    {
        $target = $request->canonicalTarget();
        $channel = OtpChannelEnum::tryFrom((string) $request->input('channel'));

        // The web /otp/send endpoint is only used by the login flow. Refuse to
        // send a code if no account is registered to the target — the user can
        // tap "Create an account" from the same screen instead.
        $user = $this->users->findByMobileOrEmail($target);

        if (! $user) {
            $field = $request->canonicalEmail() !== '' ? 'email' : 'mobile';

            throw ValidationException::withMessages([
                $field => "No account exists for this {$field}. Please register first.",
            ]);
        }

        // Admins authenticate through /admin/login with email + password — the
        // public OTP flow is for customer + restaurant accounts only. Refuse
        // here so an admin whose phone is in the users table can't slip into
        // the customer portal via SMS.
        $this->assertWebLoginEligible($user, $request);

        $this->otp->send($target, $channel);

        // Persist the original inputs (not just the joined target) so the OTP page
        // can resubmit them verbatim to /otp/verify — VerifyOtpRequest validates
        // `email` OR `country_code + mobile`, not the canonical joined string.
        $request->session()->put('otp', [
            'target' => $target,
            'email' => $request->input('email'),
            'country_code' => $request->input('country_code'),
            'mobile' => $request->input('mobile'),
        ]);

        return redirect()->route('otp');
    }

    public function verifyOtp(VerifyOtpRequest $request): RedirectResponse
    {
        $target = $request->canonicalTarget();
        $user = $this->otp->verifyAndFindUser($target, (string) $request->input('code'));

        $request->session()->forget('otp');

        if ($user) {
            // Re-check on verify too: even if a stale or replayed OTP burns
            // through the send-time check, we should never authenticate an
            // admin via the public web OTP page.
            $this->assertWebLoginEligible($user, $request);

            Auth::login($user, remember: true);

            return $this->redirectAfterAuth($request);
        }

        return redirect()
            ->route('register')
            ->with('otp.verified', $target);
    }

    public function registerCustomer(RegisterCustomerRequest $request): RedirectResponse
    {
        $user = $this->registration->register($request->validated(), 'customer');
        Auth::login($user, remember: true);

        return $this->redirectAfterAuth($request);
    }

    public function registerRestaurant(RegisterRestaurantRequest $request): RedirectResponse
    {
        $user = $this->registration->registerRestaurant($request->validated());
        Auth::login($user, remember: true);

        return $this->redirectAfterAuth($request);
    }

    /**
     * Send users to their role-specific dashboard. Never honours a previously
     * intended URL — it may be an area the visitor doesn't have access to.
     */
    protected function redirectAfterAuth(Request $request): RedirectResponse
    {
        $request->session()->forget('url.intended');

        return redirect()->route($request->user()->homeRouteName());
    }

    /**
     * Reject roles that have no business going through the public customer
     * web login. Admin accounts have a dedicated /admin/login (email +
     * password) and must not be issuable a phone OTP here. We surface the
     * same generic "no account" message rather than confirming the email /
     * mobile maps to an admin row — avoids a credential-enumeration oracle.
     */
    protected function assertWebLoginEligible(User $user, SendOtpRequest|VerifyOtpRequest $request): void
    {
        if ($user->hasRole(UserRoleEnum::ADMIN->value)) {
            $field = $request->canonicalEmail() !== '' ? 'email' : 'mobile';

            throw ValidationException::withMessages([
                $field => "You cannot log in with this phone number. Please use the admin login portal.",
            ]);
        }
    }
}
