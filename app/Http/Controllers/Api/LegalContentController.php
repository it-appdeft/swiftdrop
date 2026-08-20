<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Platform\PlatformConfigService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Public legal copy (Privacy Policy + Terms & Conditions) sourced from the
 * admin-tunable `platform_config` table. Used by the customer web app and the
 * mobile clients so the wording lives in one place.
 */
class LegalContentController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PlatformConfigService $config,
    ) {
    }

    /** Both documents in a single payload. */
    public function index(): JsonResponse
    {
        return $this->success([
            'privacy_policy' => $this->document(PlatformConfigService::KEY_PRIVACY_POLICY),
            'terms_and_conditions' => $this->document(PlatformConfigService::KEY_TERMS_AND_CONDITIONS),
        ], 'Legal content retrieved.');
    }

    public function privacyPolicy(): JsonResponse
    {
        return $this->success(
            $this->document(PlatformConfigService::KEY_PRIVACY_POLICY),
            'Privacy policy retrieved.',
        );
    }

    public function terms(): JsonResponse
    {
        return $this->success(
            $this->document(PlatformConfigService::KEY_TERMS_AND_CONDITIONS),
            'Terms & conditions retrieved.',
        );
    }

    /**
     * Normalise a stored document into `{ html, paragraphs }`. `html` is the
     * rich-text body produced by the admin editor (render directly); `paragraphs`
     * is a tag-stripped fallback for clients that render their own typography.
     *
     * @return array{html: string, paragraphs: array<int, string>}
     */
    protected function document(string $key): array
    {
        $html = (string) $this->config->get($key, '');

        return [
            'html' => $html,
            'paragraphs' => $this->toParagraphs($html),
        ];
    }

    /**
     * Best-effort plain-text paragraphs from a stored document — works for both
     * the rich-text HTML and the legacy plain-text (blank-line) format.
     *
     * @return array<int, string>
     */
    protected function toParagraphs(string $content): array
    {
        // Block-level boundaries become paragraph breaks; <br> becomes a newline.
        $normalized = preg_replace('#</(p|div|h[1-6]|li|ul|ol)>#i', "\n\n", $content);
        $normalized = preg_replace('#<br\s*/?>#i', "\n", (string) $normalized);
        $text = html_entity_decode(strip_tags((string) $normalized), ENT_QUOTES | ENT_HTML5);

        return collect(preg_split('/\n\s*\n/', $text))
            ->map(fn (string $p) => trim(preg_replace('/[ \t]+/', ' ', $p)))
            ->filter()
            ->values()
            ->all();
    }
}
