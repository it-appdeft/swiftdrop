import * as React from 'react';

import { cn } from '@/lib/utils';

interface SectionHeadingProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

/**
 * Lightweight heading used inside a page (e.g. above a table or card grid).
 * Smaller and less assertive than PageHeader.
 */
export function SectionHeading({ title, description, actions, className }: SectionHeadingProps) {
    return (
        <div className={cn('flex flex-col gap-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4', className)}>
            <div>
                <h2 className="text-base font-semibold tracking-tight">{title}</h2>
                {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
    );
}
