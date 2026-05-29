/**
 * Generates the shared country dataset used on both sides of the app:
 *   - resources/js/admin/lib/countries.ts  (dropdown data + lookup helpers)
 *   - app/Support/Countries.php             (validation + dial→iso fallback)
 *
 * Source of truth: countries-list (devDependency). Re-run after bumping it:
 *   node scripts/generate-countries.cjs
 *
 * ISO codes are 3166-1 alpha-2 (matches country-flag-icons + flag emoji).
 */
const fs = require('fs');
const path = require('path');
const { countries } = require('countries-list');

// A dial code can map to several countries (+1 → US/CA, +44 → GB/JE/GG/IM).
// When we only know the dial code (legacy rows, derivation fallback) we resolve
// to the most populous / canonical country for that prefix.
const PRIMARY_ISO_BY_DIAL = {
    '+1': 'US', '+7': 'RU', '+44': 'GB', '+47': 'NO', '+61': 'AU', '+64': 'NZ',
    '+212': 'MA', '+262': 'RE', '+290': 'SH', '+358': 'FI', '+377': 'MC',
    '+381': 'RS', '+386': 'SI', '+500': 'FK', '+590': 'GP', '+672': 'NF',
};

const list = Object.entries(countries)
    .map(([iso, c]) => ({ iso, dial: '+' + c.phone[0], name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

// Deterministic primary map: first ISO seen per dial (ISO-sorted), then overrides.
const primary = {};
for (const { iso, dial } of [...list].sort((a, b) => a.iso.localeCompare(b.iso))) {
    if (!primary[dial]) primary[dial] = iso;
}
Object.assign(primary, PRIMARY_ISO_BY_DIAL);

// ─── TypeScript ──────────────────────────────────────────────────────────────
const tsRows = list
    .map((c) => `    { iso: '${c.iso}', dial: '${c.dial}', name: ${JSON.stringify(c.name)} },`)
    .join('\n');
const tsPrimary = Object.entries(primary)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dial, iso]) => `    '${dial}': '${iso}',`)
    .join('\n');

const ts = `// AUTO-GENERATED from countries-list. Do not edit by hand —
// run \`node scripts/generate-countries.cjs\` to regenerate.
//
// ISO codes are 3166-1 alpha-2, the format used by country-flag-icons so a
// stored \`country_iso\` ("IN", "GB") resolves to one exact flag even when the
// dialling prefix is shared (+44 → GB/JE/GG/IM, +1 → US/CA, …).

export interface Country {
    /** ISO 3166-1 alpha-2, uppercase, e.g. "IN". */
    iso: string;
    /** Dialling prefix with leading "+", e.g. "+91". */
    dial: string;
    /** English country name, e.g. "India". */
    name: string;
}

export const COUNTRIES: Country[] = [
${tsRows}
];

// Most canonical country for a shared dialling prefix — used as a fallback when
// a row only carries the dial code (legacy users created before country_iso).
const PRIMARY_ISO_BY_DIAL: Record<string, string> = {
${tsPrimary}
};

export function primaryIsoForDial(dial?: string | null): string | undefined {
    return dial ? PRIMARY_ISO_BY_DIAL[dial] : undefined;
}

/**
 * Resolve the country to display: prefer the stored ISO (exact), else fall back
 * to the primary country for the dial code, else any country with that dial.
 */
export function findCountry(iso?: string | null, dial?: string | null): Country | undefined {
    if (iso) {
        const upper = iso.toUpperCase();
        const match = COUNTRIES.find((c) => c.iso === upper);
        if (match) return match;
    }
    if (dial) {
        const primaryIso = PRIMARY_ISO_BY_DIAL[dial];
        if (primaryIso) {
            const match = COUNTRIES.find((c) => c.iso === primaryIso);
            if (match) return match;
        }
        return COUNTRIES.find((c) => c.dial === dial);
    }
    return undefined;
}

export function isValidIso(iso?: string | null): boolean {
    if (!iso) return false;
    const upper = iso.toUpperCase();
    return COUNTRIES.some((c) => c.iso === upper);
}
`;

// ─── PHP ─────────────────────────────────────────────────────────────────────
const phpRows = list
    .map((c) => `        ['iso' => '${c.iso}', 'dial' => '${c.dial}', 'name' => ${phpStr(c.name)}],`)
    .join('\n');
const phpPrimary = Object.entries(primary)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dial, iso]) => `        '${dial}' => '${iso}',`)
    .join('\n');

function phpStr(s) {
    return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

const php = `<?php

namespace App\\Support;

/**
 * AUTO-GENERATED from countries-list. Do not edit by hand —
 * run \`node scripts/generate-countries.cjs\` to regenerate.
 *
 * Shared ISO 3166-1 alpha-2 country dataset. The frontend persists a
 * country_iso ("IN", "GB") alongside the dialling prefix so a shared prefix
 * (+44 → GB/JE/GG/IM, +1 → US/CA) still resolves to one exact flag.
 */
class Countries
{
    /** @var list<array{iso: string, dial: string, name: string}> */
    public const ALL = [
${phpRows}
    ];

    /**
     * Most canonical country for a shared dialling prefix — used to derive an
     * ISO when only the dial code is known (legacy rows / fallback).
     *
     * @var array<string, string>
     */
    private const PRIMARY_ISO_BY_DIAL = [
${phpPrimary}
    ];

    /** @return list<array{iso: string, dial: string, name: string}> */
    public static function all(): array
    {
        return self::ALL;
    }

    public static function isValidIso(?string $iso): bool
    {
        if ($iso === null || $iso === '') {
            return false;
        }

        $upper = strtoupper($iso);

        foreach (self::ALL as $country) {
            if ($country['iso'] === $upper) {
                return true;
            }
        }

        return false;
    }

    public static function primaryIsoForDial(?string $dial): ?string
    {
        return $dial === null ? null : (self::PRIMARY_ISO_BY_DIAL[$dial] ?? null);
    }

    public static function dialForIso(?string $iso): ?string
    {
        if ($iso === null || $iso === '') {
            return null;
        }

        $upper = strtoupper($iso);

        foreach (self::ALL as $country) {
            if ($country['iso'] === $upper) {
                return $country['dial'];
            }
        }

        return null;
    }
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'resources/js/admin/lib/countries.ts'), ts);
fs.writeFileSync(path.join(__dirname, '..', 'app/Support/Countries.php'), php);
console.log('Wrote resources/js/admin/lib/countries.ts and app/Support/Countries.php');
console.log('Countries:', list.length);
