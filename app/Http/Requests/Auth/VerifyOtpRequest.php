<?php

namespace App\Http\Requests\Auth;

use App\Enums\OtpChannelEnum;
use App\Enums\OtpTypeEnum;
use App\Enums\UserRoleEnum;
use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use App\Rules\Auth\ValidCountryIso;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Mirrors {@see SendOtpRequest} but adds the `code` digits the user typed.
 * Field requirements are derived from `type` + `channel` the same way so a
 * single endpoint serves every verify scenario.
 */
class VerifyOtpRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('channel') === 'phone') {
            $this->merge(['channel' => OtpChannelEnum::SMS->value]);
        }

        $this->normalizeMobileInput();
        $this->normalizeCountryIso();
    }

    public function rules(): array
    {
        $channel = $this->input('channel');
        $needsEmail = $channel === OtpChannelEnum::EMAIL->value;
        $needsMobile = $channel === OtpChannelEnum::SMS->value;
        $type = $this->input('type');
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
            // Required for every SMS flow — see SendOtpRequest::rules() for why.
            'country_iso' => [Rule::requiredIf($needsMobile), 'nullable', 'string', 'size:2', new ValidCountryIso()],
            'mobile' => [Rule::requiredIf($needsMobile), 'nullable', 'string', 'regex:/^\+?[0-9]{6,11}$/'],
            'code' => ['required', 'string', 'regex:/^[0-9]{4,8}$/'],
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

    public function target(): string
    {
        return $this->channel() === OtpChannelEnum::EMAIL
            ? $this->canonicalEmail()
            : $this->canonicalMobile();
    }

    /**
     * Explicit dialling prefix from the request — see {@see SendOtpRequest}
     * for context. Threaded through OtpFlowService so update_phone persists
     * country_code verbatim instead of deriving it from the canonical mobile.
     */
    public function countryCode(): ?string
    {
        if ($this->channel() !== OtpChannelEnum::SMS) {
            return null;
        }

        $code = (string) $this->input('country_code', '');

        return $code === '' ? null : $code;
    }

    /**
     * Explicit ISO 3166-1 alpha-2 country code ("GB") — see {@see SendOtpRequest}
     * for context. Threaded through OtpFlowService so update_phone persists the
     * country verbatim and the right flag survives a number change.
     */
    public function countryIso(): ?string
    {
        if ($this->channel() !== OtpChannelEnum::SMS) {
            return null;
        }

        $iso = (string) $this->input('country_iso', '');

        return $iso === '' ? null : strtoupper($iso);
    }

    public function code(): string
    {
        return (string) $this->input('code');
    }
}
