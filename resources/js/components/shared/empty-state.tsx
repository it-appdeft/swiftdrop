import * as React from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

/**
 * Standard empty / zero-state placeholder. Use whenever a list, table, or
 * card grid has no data so the visual treatment stays consistent.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center',
                className,
            )}
        >
            {icon ? (
                <div className="flex size-12 items-center justify-center rounded-full bg-primary-muted text-primary [&_svg]:size-6">
                    {icon}
                </div>
            ) : null}
            <div className="space-y-1">
                <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {action ? <div className="mt-2">{action}</div> : null}
        </div>
    );
}
