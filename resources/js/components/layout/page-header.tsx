import * as React from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
    eyebrow?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

/**
 * Standardized page heading. Pair with PageContainer to keep every page's
 * "title + description + primary actions" row aligned and on-brand.
 */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6', className)}>
            <div className="space-y-1.5">
                {eyebrow ? (
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
                ) : null}
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
    );
}
