<?php

namespace App\Http\Requests\Driver\Profile;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use Illuminate\Foundation\Http\FormRequest;

class CompleteEmailChangeRequest extends FormRequest
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
            'code' => ['required', 'string', 'min:4', 'max:8'],
        ];
    }
}
