import { cn } from '@/lib/utils';

interface SwiftdropWordmarkProps {
    className?: string;
    color?: 'light' | 'dark';
}

export function SwiftdropWordmark({ className, color = 'dark' }: SwiftdropWordmarkProps) {
    return (
        <div className={cn('inline-flex items-center gap-2', className)}>
            <svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden>
                <path
                    d="M12 2 L20 8 L17 21 L7 21 L4 8 Z"
                    className={color === 'light' ? 'fill-white' : 'fill-primary'}
                />
            </svg>
            <span
                className={cn(
                    'text-lg font-semibold tracking-tight',
                    color === 'light' ? 'text-white' : 'text-foreground',
                )}
            >
                swiftdrop
            </span>
        </div>
    );
}
