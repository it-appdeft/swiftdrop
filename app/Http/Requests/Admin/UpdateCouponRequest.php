<?php

namespace App\Http\Requests\Admin;

class UpdateCouponRequest extends StoreCouponRequest
{
    public function rules(): array
    {
        return $this->couponRules((int) $this->route('id'));
    }
}
