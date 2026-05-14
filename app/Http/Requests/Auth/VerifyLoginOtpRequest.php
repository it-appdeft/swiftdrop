<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use Illuminate\Foundation\Http\FormRequest;

class VerifyLoginOtpRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'country_code' => ['required', 'string', 'regex:/^\+[0-9]{1,4}$/'],
            'mobile' => ['required', 'string', 'regex:/^[0-9\s\-]{6,20}$/'],
            'code' => ['required', 'string', 'regex:/^[0-9]{4,8}$/'],
        ];
    }
}
