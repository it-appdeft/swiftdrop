import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import { SwiftdropWordmark } from './swiftdrop-wordmark';

interface AuthUser {
    id: number;
    name: string;
    email: string | null;
}

interface SharedProps {
    auth: {
        user: AuthUser | null;
        home_url: string | null;
    };
    [key: string]: unknown;
}

function initialsFrom(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
        || '?';
}

export function SiteHeader() {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" aria-label="Swiftdrop home">
                    <SwiftdropWordmark />
                </Link>

                <nav className="flex items-center gap-3 sm:gap-4">
                    {!user && (
                        <Link
                            href={`${route('register')}?as=restaurant`}
                            className="hidden text-sm font-medium text-foreground transition-colors hover:text-primary sm:inline-flex"
                        >
                            Partner with Us
                        </Link>
                    )}
                    <Link
                        href="#"
                        className="hidden h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary sm:inline-flex"
                    >
                        Get This App
                    </Link>

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-full border border-border bg-background px-1 py-1 pr-2 transition hover:border-primary"
                                >
                                    <Avatar className="size-8">
                                        <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                                            {initialsFrom(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold">{user.name}</span>
                                    {user.email && (
                                        <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                                    )}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {auth.home_url && (
                                    <DropdownMenuItem asChild>
                                        <Link href={auth.home_url} className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 size-4" />
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 size-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild size="sm" className="h-9 rounded-md px-5">
                            <Link href={route('login')}>Sign In</Link>
                        </Button>
                    )}
                </nav>
            </div>
        </header>
    );
}
