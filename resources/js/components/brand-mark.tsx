import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';

/**
 * Compact SwiftDrop brand mark — used in sidebar / topbar / auth header.
 * Combines the inline icon (kept lightweight, ~1 KB) with the wordmark.
 *
 * The full artwork at /brand/logo.png is reserved for splash / hero contexts
 * where the imagery actually shows; do not embed it as a tiny avatar.
 */
interface BrandMarkProps {
    className?: string;
    showWordmark?: boolean;
    tagline?: boolean;
    iconClassName?: string;
}

export function BrandMark({ className, showWordmark = true, tagline = false, iconClassName }: BrandMarkProps) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <span
                className={cn(
                    'bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md shadow-sm',
                    iconClassName,
                )}
            >
                <AppLogoIcon className="size-5 fill-current" />
            </span>
            {showWordmark ? (
                <div className="leading-tight">
                    <p className="text-sm font-semibold tracking-tight">SwiftDrop</p>
                    {tagline ? (
                        <p className="text-muted-foreground text-[10px] font-medium tracking-[0.18em] uppercase">
                            Fresh food · Fast delivery
                        </p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
