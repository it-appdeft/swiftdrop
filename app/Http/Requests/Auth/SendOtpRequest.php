<?php

namespace App\Http\Requests\Auth;

use App\Enums\OtpChannelEnum;
use App\Enums\OtpTypeEnum;
use App\Enums\UserRoleEnum;
use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Single request payload for /auth/send-otp covering every type
 * (login / signup / update_phone / update_email / verify_current_phone /
 * verify_current_email) and every channel (email / phone). Field
 * requirements are derived from `type` + `channel` so the same JSON
 * shape works for all flows.
 */
class SendOtpRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Accept "phone" as the public-facing channel name and translate it to
     * the SMS channel used internally.
     */
    protected function prepareForValidation(): void
    {
        $channel = $this->input('channel');

        if ($channel === 'phone') {
            $this->merge(['channel' => OtpChannelEnum::SMS->value]);
        }
    }

    public function rules(): array
    {
        $channel = $this->input('channel');
        $needsEmail = $channel === OtpChannelEnum::EMAIL->value;
        $needsMobile = $channel === OtpChannelEnum::SMS->value;
        $type = $this->input('type');
        // user_type is only meaningful for the unauthenticated flows
        // (login / signup). Any flow that operates on the currently
        // authed user resolves identity from the sanctum token instead.
        $isAuthedFlow = in_array($type, [
            OtpTypeEnum::UPDATE_EMAIL->value,
            OtpTypeEnum::UPDATE_PHONE->value,
            OtpTypeEnum::VERIFY_CURRENT_PHONE->value,
            OtpTypeEnum::VERIFY_CURRENT_EMAIL->value,
        ], true);

        return [
            'type' => ['required', Rule::enum(OtpTypeEnum::class)],
            'user_type' => [
                Rule::requiredIf(! $isAuthedFlow),
                'nullable',
                Rule::in([UserRoleEnum::CUSTOMER->value, UserRoleEnum::DRIVER->value]),
            ],
            'channel' => ['required', Rule::enum(OtpChannelEnum::class)],
            'email' => [Rule::requiredIf($needsEmail), 'nullable', 'email', 'max:255'],
            'country_code' => [Rule::requiredIf($needsMobile), 'nullable', 'string', 'regex:/^\+[0-9]{1,4}$/'],
            'mobile' => [Rule::requiredIf($needsMobile), 'nullable', 'string', 'regex:/^\+?[0-9\s\-]{6,20}$/'],
        ];
    }

    public function otpType(): OtpTypeEnum
    {
        return OtpTypeEnum::from((string) $this->input('type'));
    }

    public function channel(): OtpChannelEnum
    {
        return OtpChannelEnum::from((string) $this->input('channel'));
    }

    public function userRole(): ?UserRoleEnum
    {
        $value = $this->input('user_type');

        return $value ? UserRoleEnum::from((string) $value) : null;
    }

    /** Canonical target for this request — picks email or mobile by channel. */
    public function target(): string
    {
        return $this->channel() === OtpChannelEnum::EMAIL
            ? $this->canonicalEmail()
            : $this->canonicalMobile();
    }
}
