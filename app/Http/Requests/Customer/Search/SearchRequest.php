<?php

namespace App\Http\Requests\Customer\Search;

use Illuminate\Foundation\Http\FormRequest;

class SearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:120'],
        ];
    }

    public function keyword(): string
    {
        return (string) ($this->input('q') ?? '');
    }
}
