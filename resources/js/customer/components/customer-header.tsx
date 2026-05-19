import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BadgePercent,
    ChevronDown,
    LayoutDashboard,
    LogOut,
    Search,
    ShoppingBag,
    User as UserIcon,
    UserCircle,
} from 'lucide-react';

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string | null } | null;
    };
    [key: string]: unknown;
}

export function CustomerHeader() {
    const { auth } = usePage<SharedProps>().props;
    const user = auth?.user ?? null;
    const displayName = user?.name ?? 'Alexander';

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <header className="sticky top-0 z-30 border-b border-border bg-background">
            <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-3 sm:gap-5 sm:px-4 lg:gap-6 lg:px-6">
                <Link href={route('customer.dashboard')} aria-label="SwiftDrop home" className="flex shrink-0 flex-col items-center leading-none">
                    <img src="/brand/Container.png" alt="" aria-hidden className="h-6 w-auto sm:h-7" />
                    <span className="mt-0.5 text-[10px] font-semibold tracking-tight">
                        {/* <span>Swift</span>
                        <span className="text-primary">Drop</span> */}
                    </span>
                </Link>

                <button
                    type="button"
                    className="flex min-w-0 items-center gap-1.5 text-sm text-foreground sm:gap-2"
                >
                    <span className="font-semibold underline underline-offset-4">Others</span>
                    <span className="hidden truncate text-muted-foreground md:inline">
                        West Coker, Yelovil, UK
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-primary" />
                </button>

                <nav className="ml-auto flex items-center gap-3 text-sm font-medium sm:gap-5 lg:gap-7">
                    <button
                        type="button"
                        aria-label="Search"
                        className="flex items-center gap-1.5 text-foreground hover:text-primary"
                    >
                        <Search className="size-4" />
                        <span className="hidden md:inline">Search</span>
                    </button>
                    <button
                        type="button"
                        aria-label="Offers"
                        className="flex items-center gap-1.5 text-foreground hover:text-primary"
                    >
                        <BadgePercent className="size-4" />
                        <span className="hidden md:inline">Offers</span>
                    </button>
                    <button
                        type="button"
                        aria-label="Cart"
                        className="flex items-center gap-1.5 text-foreground hover:text-primary"
                    >
                        <ShoppingBag className="size-4" />
                        <span className="hidden md:inline">Cart</span>
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                aria-label="Account"
                                className="flex max-w-[160px] items-center gap-1.5 text-foreground hover:text-primary"
                            >
                                <UserIcon className="size-4" />
                                <span className="hidden truncate sm:inline">{displayName}</span>
                                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:inline" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="flex flex-col gap-0.5">
                                <span className="text-sm font-semibold">{displayName}</span>
                                {user?.email && (
                                    <span className="truncate text-xs font-normal text-muted-foreground">
                                        {user.email}
                                    </span>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={route('customer.dashboard')} className="cursor-pointer">
                                    <LayoutDashboard className="mr-2 size-4" />
                                    Dashboard
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={route('customer.profile')} className="cursor-pointer">
                                    <UserCircle className="mr-2 size-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={handleLogout}
                                className="cursor-pointer text-destructive focus:text-destructive"
                            >
                                <LogOut className="mr-2 size-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </nav>
            </div>
        </header>
    );
}
