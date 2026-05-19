<?php

namespace App\Contracts\Auth;

use App\Enums\OtpChannelEnum;
use App\Enums\OtpTypeEnum;
use App\Enums\UserRoleEnum;
use App\Models\User;

/**
 * Single orchestration point for every OTP send / verify call across the
 * customer + driver apps and the login / signup / update-phone /
 * update-email flows. Implementations are responsible for the side-effects
 * required by each flow (issue token, swap mobile, swap email, etc.).
 */
interface OtpFlowServiceInterface
{
    /**
     * @param string|null $countryCode Explicit dialling prefix (e.g. "+44").
     *                                 Only meaningful for SMS-channel flows;
     *                                 stored as-is on update_phone so we don't
     *                                 have to re-derive it from the canonical
     *                                 string with a brittle prefix table.
     *
     * @return array{target: string, expires_in: int, test_code: ?string}
     */
    public function send(
        OtpTypeEnum $type,
        OtpChannelEnum $channel,
        string $target,
        ?UserRoleEnum $userType = null,
        ?User $authUser = null,
        ?string $countryCode = null,
    ): array;

    /**
     * @return array  Shape varies per type:
     *   - LOGIN/SIGNUP: {user, token} or {target} (signup-precheck)
     *   - UPDATE_*:     {user}
     */
    public function verify(
        OtpTypeEnum $type,
        OtpChannelEnum $channel,
        string $target,
        string $code,
        ?UserRoleEnum $userType = null,
        ?User $authUser = null,
        ?string $countryCode = null,
    ): array;
}
