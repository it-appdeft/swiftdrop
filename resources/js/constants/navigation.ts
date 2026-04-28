import type { NavGroup, NavItem } from '@/types';
import {
    BarChart3,
    BookOpen,
    CreditCard,
    Folder,
    LayoutGrid,
    LifeBuoy,
    Settings,
    Users,
} from 'lucide-react';

/**
 * Sidebar navigation, grouped by section. Adding a new top-level link is a
 * one-line change; the AppSidebar reads from this list directly.
 */
export const primaryNavigation: NavGroup[] = [
    {
        title: 'Workspace',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'Analytics', url: '/analytics', icon: BarChart3 },
            { title: 'Customers', url: '/customers', icon: Users },
            { title: 'Billing', url: '/billing', icon: CreditCard },
        ],
    },
    {
        title: 'Account',
        items: [
            { title: 'Settings', url: '/settings/profile', icon: Settings },
            { title: 'Support', url: '/support', icon: LifeBuoy },
        ],
    },
];

export const secondaryNavigation: NavItem[] = [
    {
        title: 'Repository',
        url: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        url: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];
