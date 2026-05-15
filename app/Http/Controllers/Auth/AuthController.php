<?php

namespace App\Http\Controllers\Auth;

use App\Contracts\Auth\OtpServiceInterface;
use App\Contracts\Auth\RegistrationServiceInterface;
use App\Enums\OtpChannelEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterCustomerRequest;
use App\Http\Requests\Auth\RegisterRestaurantRequest;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function __construct(
        protected OtpServiceInterface $otp,
        protected RegistrationServiceInterface $registration,
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
}
