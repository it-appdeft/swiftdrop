import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';

import { Toaster } from '@/components/ui/toast';
import { toast } from '@/hooks/use-toast';
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
        const customerPages = import.meta.glob('./customer/pages/**/*.tsx');
        const restaurantPages = import.meta.glob('./restaurant/pages/**/*.tsx');

        // Explicit namespace prefixes resolve directly to their folder.
        if (name.startsWith('web/')) {
            return resolvePageComponent(`./web/pages/${name.slice(4)}.tsx`, webPages);
        }
        if (name.startsWith('customer/')) {
            return resolvePageComponent(`./customer/pages/${name.slice(9)}.tsx`, customerPages);
        }
        if (name.startsWith('restaurant/')) {
            return resolvePageComponent(`./restaurant/pages/${name.slice(11)}.tsx`, restaurantPages);
        }

        // Unprefixed names fall back to admin → web (legacy behaviour for pages like `welcome`).
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

// Surface session flash messages from any controller redirect as a toast.
// Controllers set them via `->with('status', '…')` or `->with('error', '…')`;
// this fires once per successful Inertia visit.
router.on('success', (event) => {
    const flash = (event.detail.page.props as { flash?: { status?: string; error?: string } }).flash;
    if (flash?.status) toast.success(flash.status);
    if (flash?.error) toast.error(flash.error);
});

// Apply persisted theme before paint to avoid a flash.
initializeTheme();
