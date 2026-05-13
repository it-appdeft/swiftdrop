import { motion } from 'framer-motion';
import * as React from 'react';

import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    eyebrow?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.38, ease, delay: custom * 0.08 },
    }),
};

const actionsVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.35, ease, delay: 0.2 },
    },
};

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6', className)}>
            <div className="space-y-1.5">
                {eyebrow ? (
                    <motion.p
                        className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        variants={childVariants}
                        custom={0}
                        initial="hidden"
                        animate="visible"
                    >
                        {eyebrow}
                    </motion.p>
                ) : null}
                <motion.h1
                    className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    variants={childVariants}
                    custom={eyebrow ? 1 : 0}
                    initial="hidden"
                    animate="visible"
                >
                    {title}
                </motion.h1>
                {description ? (
                    <motion.p
                        className="max-w-2xl text-sm text-muted-foreground"
                        variants={childVariants}
                        custom={eyebrow ? 2 : 1}
                        initial="hidden"
                        animate="visible"
                    >
                        {description}
                    </motion.p>
                ) : null}
            </div>
            {actions ? (
                <motion.div
                    className="flex flex-wrap items-center gap-2"
                    variants={actionsVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {actions}
                </motion.div>
            ) : null}
        </div>
    );
}
