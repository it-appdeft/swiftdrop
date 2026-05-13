import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';

import { Toaster } from '@/components/ui/toast';
import { initializeTheme } from '@/hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const adminPages = import.meta.glob('./admin/pages/**/*.tsx');
        const webPages = import.meta.glob('./web/pages/**/*.tsx');
        if (name.startsWith('web/')) {
            const stripped = name.slice(4);
            return resolvePageComponent(`./web/pages/${stripped}.tsx`, webPages);
        }
        return adminPages[`./admin/pages/${name}.tsx`]
            ? resolvePageComponent(`./admin/pages/${name}.tsx`, adminPages)
            : resolvePageComponent(`./web/pages/${name}.tsx`, webPages);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <Toaster />
            </>,
        );
    },
    progress: {
        color: '#65a30d',
    },
});

// Apply persisted theme before paint to avoid a flash.
initializeTheme();
