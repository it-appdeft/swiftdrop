import { motion } from 'framer-motion';
import * as React from 'react';

import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <motion.div
            className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center',
                className,
            )}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.38, ease }}
        >
            {icon ? (
                <motion.div
                    className="flex size-12 items-center justify-center rounded-full bg-primary-muted text-primary [&_svg]:size-6"
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.12 }}
                >
                    {icon}
                </motion.div>
            ) : null}
            <motion.div
                className="space-y-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease, delay: 0.18 }}
            >
                <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
            </motion.div>
            {action ? (
                <motion.div
                    className="mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.28 }}
                >
                    {action}
                </motion.div>
            ) : null}
        </motion.div>
    );
}
