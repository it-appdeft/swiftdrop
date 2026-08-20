<?php

namespace App\Http\Requests\Support;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Shared base for opening a support ticket. The subject + description rules are
 * identical across entry points; the customer and restaurant subclasses add
 * the field that's unique to their form (order reference / category).
 */
abstract class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return array_merge([
            'subject' => ['required', 'string', 'max:200'],
            'description' => ['required', 'string', 'min:5', 'max:5000'],
        ], $this->additionalRules());
    }

    /**
     * Rules contributed by the concrete request.
     *
     * @return array<string, mixed>
     */
    abstract protected function additionalRules(): array;
}
