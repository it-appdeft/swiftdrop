import * as Flags from 'country-flag-icons/react/3x2';
import { Globe } from 'lucide-react';

type FlagComponent = React.FC<React.SVGProps<SVGSVGElement> & { title?: string }>;

const FLAGS = Flags as unknown as Record<string, FlagComponent | undefined>;

/**
 * Renders one country's flag as an inline SVG (via country-flag-icons) keyed by
 * its ISO 3166-1 alpha-2 code — consistent across Windows / macOS / Linux where
 * Unicode flag emoji don't all render. Falls back to a globe for unknown codes.
 */
export function CountryFlag({ iso, className }: { iso?: string | null; className?: string }) {
    const code = (iso ?? '').toUpperCase();
    const Flag = FLAGS[code];

    if (!Flag) {
        return <Globe className={className} aria-hidden />;
    }

    return <Flag className={className} title={code} />;
}
