import { motion } from 'framer-motion';
import * as React from 'react';

import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PageContainerProps {
    /** Constrain content width. `full` removes the cap (use for table-heavy pages). */
    width?: 'narrow' | 'default' | 'wide' | 'full';
    className?: string;
    children?: React.ReactNode;
    id?: string;
}

const widthClass: Record<NonNullable<PageContainerProps['width']>, string> = {
    narrow: 'max-w-3xl',
    default: 'max-w-6xl',
    wide: 'max-w-7xl',
    full: 'max-w-none',
};

export function PageContainer({ width = 'full', className, children, id }: PageContainerProps) {
    return (
        <motion.div
            id={id}
            className={cn(
                'w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
                width === 'full' ? '' : 'mx-auto',
                widthClass[width],
                className,
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease }}
        >
            {children}
        </motion.div>
    );
}
