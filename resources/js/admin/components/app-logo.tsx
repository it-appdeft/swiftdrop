import { motion } from 'framer-motion';

import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <motion.div
                className="relative flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary to-primary/80 shadow-sm shadow-primary/40 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
                <AppLogoIcon className="size-5 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-sm font-bold tracking-tight">SwiftDrop</span>
                <span className="text-muted-foreground mt-0.5 truncate text-[10px] font-medium tracking-[0.18em] uppercase">
                    Admin Panel
                </span>
            </div>
        </>
    );
}
