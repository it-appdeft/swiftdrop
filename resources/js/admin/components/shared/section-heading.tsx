import { motion } from 'framer-motion';
import * as React from 'react';

import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function SectionHeading({ title, description, actions, className }: SectionHeadingProps) {
    return (
        <motion.div
            className={cn('flex flex-col gap-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4', className)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
        >
            <div>
                <h2 className="text-base font-semibold tracking-tight">{title}</h2>
                {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </motion.div>
    );
}
