<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required_without:mobile', 'nullable', 'email', 'max:255'],
            'country_code' => ['required_with:mobile', 'nullable', 'string', 'regex:/^\+[0-9]{1,4}$/'],
            'mobile' => ['required_without:email', 'nullable', 'string', 'regex:/^[0-9\s\-]{6,20}$/'],
            'channel' => ['nullable', 'in:sms,email'],
        ];
    }
}
