import type { Transition, Variants } from 'framer-motion';

type Bez = [number, number, number, number];

export const ease: Bez = [0.25, 1, 0.5, 1];
export const easeIn: Bez = [0.55, 0, 1, 0.45];

export const spring: Transition = { type: 'spring', stiffness: 420, damping: 32 };
export const springSmooth: Transition = { type: 'spring', stiffness: 260, damping: 24 };

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease } },
};

export const slideLeft: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
};

export const slideRight: Variants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
};

export const staggerContainer = (delayChildren = 0.05, staggerChildren = 0.08): Variants => ({
    hidden: {},
    visible: { transition: { delayChildren, staggerChildren } },
});

export const pageEnter: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};
