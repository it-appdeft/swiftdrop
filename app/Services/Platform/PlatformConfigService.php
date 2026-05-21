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
