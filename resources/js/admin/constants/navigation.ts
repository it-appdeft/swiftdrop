import type { NavGroup, NavItem } from '@/types';
import {
    BarChart3,
    BookOpen,
    Car,
    Folder,
    LayoutGrid,
    Settings,
    SlidersHorizontal,
    Store,
    UtensilsCrossed,
    Users,
} from 'lucide-react';

export const primaryNavigation: NavGroup[] = [
    {
        title: 'Overview',
        items: [
            { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutGrid },
            // { title: 'Analytics', url: '/analytics', icon: BarChart3 },
        ],
    },
    {
        title: 'Management',
        items: [
            { title: 'Customers', url: '/admin/customers', icon: Users },
            { title: 'Drivers', url: '/admin/drivers', icon: Car },
            { title: 'Restaurants', url: '/admin/restaurants', icon: Store },
            { title: 'Food Items', url: '/admin/food-items', icon: UtensilsCrossed },
        ],
    },
    {
        title: 'Configuration',
        items: [
            { title: 'Platform Settings', url: '/admin/platform-settings', icon: SlidersHorizontal },
        ],
    },
    {
        title: 'Account',
        items: [
            { title: 'Settings', url: '/settings/profile', icon: Settings },
        ],
    },
];

export const secondaryNavigation: NavItem[] = [
    // {
    //     title: 'Repository',
    //     url: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     url: 'https://laravel.com/docs/starter-kits',
    //     icon: BookOpen,
    // },
];
