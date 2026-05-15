<?php

namespace App\Http\Requests\Customer\Profile;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use Illuminate\Foundation\Http\FormRequest;

class InitiateEmailChangeRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'email',
                'max:255',
            ],
        ];
    }
}
