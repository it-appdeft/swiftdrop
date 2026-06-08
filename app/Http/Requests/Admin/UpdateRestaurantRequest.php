<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use App\Models\Restaurant;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Rules\Auth\ValidCountryIso;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRestaurantRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeMobileInput();
        $this->normalizeCountryIso();
    }

    public function rules(): array
    {
        // The route binds the restaurant via {restaurant} (id); we look up the
        // current owner so the email/mobile uniqueness rules can exclude them.
        $ownerId = optional($this->ownerUser())->id;

        return [
            'name'                => ['required', 'string', 'max:100'],
            'legal_business_name' => ['nullable', 'string', 'max:200'],
            'owner_name'          => ['nullable', 'string', 'max:100'],
            'description'         => ['nullable', 'string'],
            // Owner account — same shape as the create form.
            'email'               => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($ownerId),
            ],
            'country_code'        => ['required', 'string', 'regex:/^\+[0-9]{1,4}$/'],
            'country_iso'         => ['required', 'string', 'size:2', new ValidCountryIso()],
            'mobile'              => ['required', 'string', 'regex:/^\+?[0-9]{6,11}$/'],
            'restaurant_type'     => ['nullable', 'string', 'max:50'],
            'branches'            => ['nullable', 'integer', 'min:1'],
            'seating_capacity'    => ['nullable', 'integer', 'min:0'],
            'full_address'        => ['nullable', 'string', 'max:1000'],
            'city'                => ['nullable', 'string', 'max:120'],
            'pin_code'            => ['nullable', 'string', 'max:20'],
            'lat'                 => ['nullable', 'numeric', 'between:-90,90'],
            'lng'                 => ['nullable', 'numeric', 'between:-180,180'],
            'commission_rate'     => ['required', 'numeric', 'min:0', 'max:100'],
            'status'              => ['required', Rule::in(['pending_approval', 'active', 'inactive', 'suspended'])],
            'approval_status'     => ['required', Rule::in(['pending', 'approved', 'rejected'])],
            'food_type_ids'       => ['sometimes', 'array'],
            'food_type_ids.*'     => ['integer', 'exists:food_types,id'],
            'categories'          => ['sometimes', 'array'],
            'categories.*.name'   => ['nullable', 'string', 'max:120'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $canonical = $this->canonicalMobile();

            if ($canonical === '') {
                return;
            }

            $existing = app(UserRepositoryInterface::class)->findByMobile($canonical);
            $ownerId  = optional($this->ownerUser())->id;

            if ($existing && (int) $existing->id !== (int) $ownerId) {
                $validator->errors()->add('mobile', 'This mobile number is already registered.');
            }
        });
    }

    protected function ownerUser()
    {
        $restaurantId = (int) ($this->route('id') ?? $this->route('restaurant'));
        if ($restaurantId <= 0) {
            return null;
        }

        return optional(Restaurant::with('user')->find($restaurantId))->user;
    }
}
