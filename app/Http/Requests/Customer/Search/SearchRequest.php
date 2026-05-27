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
            'search' => ['nullable', 'string', 'max:120'],
        ];
    }

    public function keyword(): string
    {
        // Accept `search` (current) and `q` (legacy bookmarks) so existing
        // links don't 404.
        return (string) ($this->input('search') ?? $this->input('q') ?? '');
    }
}
