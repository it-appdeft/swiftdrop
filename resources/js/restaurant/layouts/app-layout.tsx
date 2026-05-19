import { router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Bell,
    ChevronsUpDown,
    ClipboardList,
    Clock,
    FileText,
    HelpCircle,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Receipt,
    ScrollText,
    Search,
    ShoppingBag,
    Star,
    UserCog,
    UtensilsCrossed,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ─── Navigation config ────────────────────────────────────────────────────

export type NavKey =
    | 'dashboard'
    | 'orders'
    | 'menu'
    | 'inventory'
    | 'promotions'
    | 'reviews'
    | 'analytics'
    | 'reports'
    | 'payouts'
    | 'staff'
    | 'hours'
    | 'documents'
    | 'notifications'
    | 'support'
    | 'settings';

interface NavEntry {
    key: NavKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
}

const NAV: NavEntry[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: ShoppingBag, badge: 4 },
    { key: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'promotions', label: 'Promotions', icon: Receipt },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'reports', label: 'Reports', icon: ScrollText },
    { key: 'payouts', label: 'Payouts', icon: Wallet },
    { key: 'staff', label: 'Staff', icon: UserCog },
    { key: 'hours', label: 'Operating Hours', icon: Clock },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'support', label: 'Support', icon: HelpCircle },
    { key: 'settings', label: 'Settings', icon: ClipboardList },
];

interface SharedProps {
    auth: { user: { id: number; name: string; email: string | null } | null };
    [key: string]: unknown;
}

function initialsFrom(name: string): string {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? '')
            .join('') || '?'
    );
}

// ─── Sidebar content (shared between desktop rail and mobile drawer) ──────

function SidebarBody({
    active,
    onNavigate,
    showCloseButton,
    onClose,
}: {
    active: NavKey;
    onNavigate: () => void;
    showCloseButton?: boolean;
    onClose?: () => void;
}) {
    const handleLogout = () => {
        onNavigate();
        router.post(route('logout'));
    };

    return (
        <div className="flex h-full flex-col bg-zinc-950 text-zinc-200">
            <div className="flex h-16 items-center justify-between gap-2 px-5">
                <div className="flex items-center gap-2">
                    <img
                        src="/brand/icon.png"
                        alt=""
                        aria-hidden
                        className="size-9 rounded-full object-cover"
                    />
                    <span className="text-base font-bold tracking-tight text-white">
                        Swift<span className="text-primary">Drop</span>
                    </span>
                </div>
                {showCloseButton && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="flex size-9 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            <div className="px-3 pb-3">
                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-sm hover:border-primary"
                >
                    <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                            Branch
                        </span>
                        <span className="truncate text-sm font-semibold text-white">
                            Spice Route — Indiranagar
                        </span>
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 text-zinc-500" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-3">
                <ul className="space-y-1">
                    {NAV.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.key === active;
                        return (
                            <li key={item.key}>
                                <button
                                    type="button"
                                    onClick={onNavigate}
                                    className={
                                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ' +
                                        (isActive
                                            ? 'bg-primary text-primary-foreground font-semibold'
                                            : 'text-zinc-300 hover:bg-zinc-900 hover:text-white')
                                    }
                                >
                                    <Icon className="size-4" />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.badge !== undefined && (
                                        <span
                                            className={
                                                'flex size-5 items-center justify-center rounded-full text-[10px] font-bold ' +
                                                (isActive
                                                    ? 'bg-primary-foreground text-primary'
                                                    : 'bg-primary text-primary-foreground')
                                            }
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="border-t border-zinc-800 px-3 py-3">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
                >
                    <LogOut className="size-4" />
                    Log out
                </button>
            </div>
        </div>
    );
}

// ─── Top bar ──────────────────────────────────────────────────────────────

function TopBar({ name, onOpenMenu }: { name: string; onOpenMenu: () => void }) {
    const [accepting, setAccepting] = useState(true);

    return (
        <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-3 sm:gap-3 sm:px-6">
            <button
                type="button"
                onClick={onOpenMenu}
                aria-label="Open navigation"
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background hover:border-primary lg:hidden"
            >
                <Menu className="size-4" />
            </button>

            <div className="relative hidden flex-1 sm:block sm:max-w-xl">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="search"
                    placeholder="Search orders, items, customers..."
                    className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            <button
                type="button"
                aria-label="Search"
                className="flex size-9 items-center justify-center rounded-md border border-border bg-background hover:border-primary sm:hidden"
            >
                <Search className="size-4" />
            </button>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={() => setAccepting((v) => !v)}
                    className="hidden items-center gap-2 text-sm font-medium md:inline-flex"
                >
                    <span className="flex items-center gap-1.5">
                        <span
                            className={
                                'size-2 rounded-full ' + (accepting ? 'bg-primary' : 'bg-rose-500')
                            }
                        />
                        {accepting ? 'Accepting orders' : 'Paused'}
                    </span>
                    <span
                        className={
                            'relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition ' +
                            (accepting ? 'bg-primary' : 'bg-muted')
                        }
                    >
                        <span
                            className={
                                'inline-block size-5 rounded-full bg-background shadow transition ' +
                                (accepting ? 'translate-x-5' : 'translate-x-0.5')
                            }
                        />
                    </span>
                </button>

                <button
                    type="button"
                    aria-label="Notifications"
                    className="relative flex size-9 items-center justify-center rounded-full border border-border bg-background hover:border-primary"
                >
                    <Bell className="size-4" />
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                        3
                    </span>
                </button>

                <button
                    type="button"
                    aria-label="Help"
                    className="hidden size-9 items-center justify-center rounded-full border border-border bg-background hover:border-primary sm:flex"
                >
                    <HelpCircle className="size-4" />
                </button>

                <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-1 hover:border-primary sm:pr-3"
                >
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {initialsFrom(name)}
                    </span>
                    <span className="hidden text-sm font-medium sm:inline">{name}</span>
                </button>
            </div>
        </header>
    );
}

// ─── Layout shell ─────────────────────────────────────────────────────────

/**
 * Standard chrome for every authenticated restaurant page: dark sidebar on
 * the left (rail on desktop, slide-in drawer on mobile/tablet), top bar with
 * search/notifications/profile, and a scrollable main area for page content.
 * Pass `active` to highlight the current sidebar item.
 */
export default function AppLayout({
    active,
    children,
}: {
    active: NavKey;
    children: React.ReactNode;
}) {
    const { auth } = usePage<SharedProps>().props;
    const name = auth?.user?.name ?? 'Partner';
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Lock body scroll while the mobile drawer is open.
    useEffect(() => {
        if (!drawerOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [drawerOpen]);

    return (
        <div className="flex h-screen overflow-hidden bg-muted/40">
            {/* Desktop sidebar rail (≥ lg) */}
            <aside className="hidden h-screen w-60 shrink-0 border-r border-zinc-800 lg:block">
                <SidebarBody active={active} onNavigate={() => {}} />
            </aside>

            {/* Mobile drawer (< lg) */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setDrawerOpen(false)}
                        className="absolute inset-0 bg-black/50"
                    />
                    <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
                        <SidebarBody
                            active={active}
                            onNavigate={() => setDrawerOpen(false)}
                            showCloseButton
                            onClose={() => setDrawerOpen(false)}
                        />
                    </aside>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <TopBar name={name} onOpenMenu={() => setDrawerOpen(true)} />

                <main className="flex-1 overflow-y-auto px-3 py-5 sm:px-5 sm:py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
