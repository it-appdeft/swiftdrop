import { cn } from '@/lib/utils';

interface SwiftdropWordmarkProps {
    className?: string;
    color?: 'light' | 'dark';
}

export function SwiftdropWordmark({ className, color = 'dark' }: SwiftdropWordmarkProps) {
    const isLight = color === 'light';

    return (
        <div className={cn('inline-flex items-center gap-2', className)}>
            <img
                src="/brand/dark-logo-4x.png"
                alt=""
                aria-hidden
                className={cn('h-15 w-25', isLight && 'brightness-0 invert')}
            />
        </div>
    );
}
