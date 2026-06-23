<?php

namespace App\Services\Platform;

use App\Models\PlatformConfig;
use Illuminate\Support\Carbon;

/**
 * Cached typed accessor for the key/value `platform_config` table.
 * One round-trip per request loads the full set, then individual keys are
 * cast on read. Writes go through `set()` and bust the cache.
 */
class PlatformConfigService
{
    public const KEY_DASHBOARD_RADIUS_MILES = 'customer_dashboard_radius_miles';

    public const KEY_DASHBOARD_FALLBACK_LIMIT = 'customer_dashboard_fallback_limit';

    // Checkout pricing — all admin-tunable from Platform Settings.
    public const KEY_BASE_DELIVERY_FEE = 'base_delivery_fee_gbp';

    public const KEY_DELIVERY_FEE_PER_MILE = 'delivery_fee_per_mile_gbp';

    public const KEY_FREE_DELIVERY_THRESHOLD = 'free_delivery_threshold_gbp';

    public const KEY_ORDER_TAX_RATE = 'order_tax_rate_percent';

    // Seconds a driver has to accept/reject an incoming delivery request before
    // it's offered to the next driver — the countdown shown on the request card.
    public const KEY_DELIVERY_REQUEST_TIMEOUT_SECONDS = 'delivery_request_timeout_seconds';

    // Legal copy surfaced in the customer profile (Privacy / Terms tabs) and the
    // public legal API. Stored as plain text with blank lines between paragraphs.
    public const KEY_PRIVACY_POLICY = 'privacy_policy';

    public const KEY_TERMS_AND_CONDITIONS = 'terms_and_conditions';

    /** @var array<string, string>|null */
    protected ?array $cache = null;

    public function get(string $key, ?string $default = null): ?string
    {
        return $this->all()[$key] ?? $default;
    }

    public function int(string $key, int $default = 0): int
    {
        $raw = $this->get($key);

        return $raw === null ? $default : (int) $raw;
    }

    public function float(string $key, float $default = 0.0): float
    {
        $raw = $this->get($key);

        return $raw === null ? $default : (float) $raw;
    }

    /**
     * Split a stored text document (e.g. privacy policy) into trimmed,
     * non-empty paragraphs — blank lines are the separator.
     *
     * @return array<int, string>
     */
    public function paragraphs(string $key, string $default = ''): array
    {
        $content = (string) $this->get($key, $default);

        return collect(preg_split('/\n\s*\n/', $content))
            ->map(fn (string $p) => trim($p))
            ->filter()
            ->values()
            ->all();
    }

    /** @return array<string, string> */
    public function all(): array
    {
        if ($this->cache === null) {
            $this->cache = PlatformConfig::query()->pluck('value', 'key')->all();
        }

        return $this->cache;
    }

    /**
     * Persist a single key. Description is preserved on existing rows.
     */
    public function set(string $key, string $value, ?string $description = null): PlatformConfig
    {
        $row = PlatformConfig::firstOrNew(['key' => $key]);
        $row->value = $value;
        if ($description !== null) {
            $row->description = $description;
        }
        $row->updated_at = Carbon::now();
        $row->save();

        $this->cache = null;

        return $row;
    }

    /** @param array<string, string> $values */
    public function setMany(array $values): void
    {
        foreach ($values as $key => $value) {
            $this->set($key, (string) $value);
        }
    }
}
