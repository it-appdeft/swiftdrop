import * as React from 'react';

import { cn } from '@/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Constrain content width. `full` removes the cap (use for table-heavy pages). */
    width?: 'narrow' | 'default' | 'wide' | 'full';
}

const widthClass: Record<NonNullable<PageContainerProps['width']>, string> = {
    narrow: 'max-w-3xl',
    default: 'max-w-6xl',
    wide: 'max-w-7xl',
    full: 'max-w-none',
};

/**
 * Top-level page wrapper providing a consistent gutter, max-width and
 * vertical rhythm. Pages should use this rather than re-implementing
 * paddings on their root element.
 */
export function PageContainer({ width = 'wide', className, ...props }: PageContainerProps) {
    return (
        <div
            className={cn(
                'mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
                widthClass[width],
                className,
            )}
            {...props}
        />
    );
}
