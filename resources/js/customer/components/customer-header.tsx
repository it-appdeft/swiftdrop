import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import { BadgePercent, ChevronDown, LayoutDashboard, LogOut, Search, ShoppingBag, UserCircle, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { AddressDialog } from './address-dialog';

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string | null } | null;
        selected_address: {
            id: number;
            label: string | null;
            address_line_1: string | null;
            city: string | null;
            postcode: string | null;
        } | null;
    };
    cart_summary?: { item_count: number };
    [key: string]: unknown;
}

export function CustomerHeader() {
    const { auth, cart_summary } = usePage<SharedProps>().props;
    const user = auth?.user ?? null;
    const cartCount = cart_summary?.item_count ?? 0;
    const [addressOpen, setAddressOpen] = useState(false);
    const displayName = user?.name ?? 'Alexander';
    const address = auth?.selected_address ?? null;
    const addressLabel = address?.label ?? 'Address';
    const addressSummary = address
        ? [address.address_line_1, address.city].filter(Boolean).join(', ') || (address.postcode ?? '')
        : 'Add a delivery address';

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <>
            <header className="sticky top-0 z-30 bg-zinc-50">
                <div className="mx-auto flex h-20 max-w-[1600px] items-center gap-4 px-4 sm:gap-8 sm:px-6 lg:gap-10 lg:px-8">
                    <Link href={route('customer.dashboard')} aria-label="SwiftDrop home" className="flex shrink-0 items-center leading-none">
                        <img src="/brand/Container.png" alt="" aria-hidden className="h-9 w-auto sm:h-10" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => setAddressOpen(true)}
                        aria-label="Change delivery address"
                        className="text-foreground flex min-w-0 items-center gap-2 text-sm"
                    >
                        <span className="font-semibold underline underline-offset-4">{addressLabel}</span>
                        <span className="text-muted-foreground hidden truncate md:inline">{addressSummary}</span>
                        <ChevronDown className="text-primary size-4 shrink-0" />
                    </button>

                    <nav className="ml-auto flex items-center gap-6 text-sm font-medium sm:gap-8 lg:gap-10">
                        <Link
                            href={route('customer.search')}
                            aria-label="Search"
                            className="text-foreground hover:text-primary flex items-center gap-2"
                        >
                            <Search className="size-5" />
                            <span className="hidden md:inline">Search</span>
                        </Link>
                        <button type="button" aria-label="Offers" className="text-foreground hover:text-primary flex items-center gap-2">
                            <BadgePercent className="size-5" />
                            <span className="hidden md:inline">Offers</span>
                        </button>
                        <Link
                            href={route('customer.cart')}
                            aria-label="Cart"
                            className="text-foreground hover:text-primary relative flex items-center gap-2"
                        >
                            <span className="relative">
                                <ShoppingBag className="size-5" />
                                {cartCount > 0 ? (
                                    <span className="absolute -top-2 -right-2 flex min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] leading-4 font-bold text-white">
                                        {cartCount}
                                    </span>
                                ) : null}
                            </span>
                            <span className="hidden md:inline">Cart</span>
                        </Link>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Account"
                                    className="text-foreground hover:text-primary flex max-w-[180px] items-center gap-2"
                                >
                                    <UserIcon className="size-5" />
                                    <span className="hidden truncate sm:inline">{displayName}</span>
                                    <ChevronDown className="text-muted-foreground hidden size-3.5 sm:inline" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold">{displayName}</span>
                                    {user?.email && <span className="text-muted-foreground truncate text-xs font-normal">{user.email}</span>}
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
                                <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                                    <LogOut className="mr-2 size-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </header>

            <AddressDialog open={addressOpen} onOpenChange={setAddressOpen} />
        </>
    );
}
