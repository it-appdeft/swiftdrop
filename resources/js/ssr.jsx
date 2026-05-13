/* prettier-ignore */
import {
createInertiaApp
} from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        resolve: (name) => {
            const adminPages = import.meta.glob('./admin/pages/**/*.tsx', { eager: true });
            const webPages = import.meta.glob('./web/pages/**/*.tsx', { eager: true });
            const customerPages = import.meta.glob('./customer/pages/**/*.tsx', { eager: true });
            const restaurantPages = import.meta.glob('./restaurant/pages/**/*.tsx', { eager: true });

            if (name.startsWith('web/')) {
                return webPages[`./web/pages/${name.slice(4)}.tsx`];
            }
            if (name.startsWith('customer/')) {
                return customerPages[`./customer/pages/${name.slice(9)}.tsx`];
            }
            if (name.startsWith('restaurant/')) {
                return restaurantPages[`./restaurant/pages/${name.slice(11)}.tsx`];
            }

            return adminPages[`./admin/pages/${name}.tsx`] ?? webPages[`./web/pages/${name}.tsx`];
        },
        // prettier-ignore
        setup: ({ App, props }) => <App {...props} />,
    }),
);
