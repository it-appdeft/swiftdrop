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
        return Inertia::render('web/auth/otp', [
            'target' => $request->session()->get('otp.target'),
        ]);
    }

    // ── Form actions ────────────────────────────────────────────────────────

    public function sendOtp(SendOtpRequest $request): RedirectResponse
    {
        $target = $request->canonicalTarget();
        $channel = OtpChannelEnum::tryFrom((string) $request->input('channel'));

        match ($request->purpose()) {
            'register' => $this->otp->sendForRegistration($target, $channel),
            default => $this->otp->sendForLogin($target, $channel),
        };

        return redirect()->route('otp')->with('otp.target', $target);
    }

    public function verifyOtp(VerifyOtpRequest $request): RedirectResponse
    {
        $target = $request->canonicalTarget();
        $user = $this->otp->verifyAndFindUser($target, (string) $request->input('code'));

        if ($user) {
            Auth::login($user, remember: true);

            return redirect()->intended(route('dashboard', absolute: false));
        }

        return redirect()
            ->route('register')
            ->with('otp.verified', $target);
    }

    public function registerCustomer(RegisterCustomerRequest $request): RedirectResponse
    {
        $user = $this->registration->registerCustomer($request->validated());
        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    public function registerRestaurant(RegisterRestaurantRequest $request): RedirectResponse
    {
        $user = $this->registration->registerRestaurant($request->validated());
        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
