import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';

import { Toaster } from '@/components/ui/toast';
import { initializeTheme } from '@/hooks/use-appearance';
import { toast } from '@/hooks/use-toast';

import { ActiveOrderBar } from './customer/components/active-order-bar';
import { ActiveOrdersProvider } from './customer/context/active-orders-context';

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
            // Resolve `restaurant/menu` to either pages/menu.tsx or, if the
            // page lives in its own folder, pages/menu/index.tsx.
            const page = name.slice(11);
            const direct = `./restaurant/pages/${page}.tsx`;
            const indexed = `./restaurant/pages/${page}/index.tsx`;
            return resolvePageComponent(restaurantPages[direct] ? direct : indexed, restaurantPages);
        }

        // Unprefixed names fall back to admin → web (legacy behaviour for pages like `welcome`).
        return adminPages[`./admin/pages/${name}.tsx`]
            ? resolvePageComponent(`./admin/pages/${name}.tsx`, adminPages)
            : resolvePageComponent(`./web/pages/${name}.tsx`, webPages);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ActiveOrdersProvider>
                <App {...props} />
                <Toaster />
                {/* Global, not per-page: reads the shared active-orders poll
                    (see active-orders-context.tsx) and tracks navigation
                    itself so it can float over any customer screen without
                    every page having to remember to render it. Individual
                    pages can read the same orders via useActiveOrders() to
                    make room for this bar instead of being covered by it —
                    see e.g. the restaurant page's "View Cart" bar. */}
                <ActiveOrderBar />
            </ActiveOrdersProvider>,
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
    const flash = (event.detail.page.props as { flash?: { status?: string; success?: string; error?: string } }).flash;
    if (flash?.status) toast.success(flash.status);
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
});

// Apply persisted theme before paint to avoid a flash.
// Light/dark toggle is admin-only; customer and restaurant panels are always light.
const applyPanelTheme = () => {
    if (window.location.pathname.startsWith('/admin')) {
        initializeTheme();
    } else {
        document.documentElement.classList.remove('dark');
    }
};
applyPanelTheme();
router.on('navigate', applyPanelTheme);
