<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * File-upload validation for the Branding step. Three slot families are
 * accepted: `logo`, `cover`, and `gallery_{0..7}` for the 8-image grid.
 */
class UploadOnboardingImageRequest extends FormRequest
{
    public const FIXED_SLOTS = ['logo', 'cover'];
    public const MAX_GALLERY = 8;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['type' => $this->route('type')]);
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', function ($attribute, $value, $fail) {
                if (in_array($value, self::FIXED_SLOTS, true)) {
                    return;
                }
                if (preg_match('/^gallery_(\d+)$/', (string) $value, $m)) {
                    $idx = (int) $m[1];
                    if ($idx >= 0 && $idx < self::MAX_GALLERY) {
                        return;
                    }
                }
                $fail('Unknown image slot.');
            }],
            'file' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,webp'],
        ];
    }

    public function imageType(): string
    {
        return (string) $this->input('type');
    }

    /** Gallery index, only valid when type starts with `gallery_`. */
    public function galleryIndex(): ?int
    {
        if (preg_match('/^gallery_(\d+)$/', $this->imageType(), $m)) {
            return (int) $m[1];
        }
        return null;
    }
}
