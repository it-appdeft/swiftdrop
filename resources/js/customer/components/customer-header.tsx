import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import { BadgePercent, ChevronDown, LayoutDashboard, LogOut, MapPin, Search, Search as SearchIcon, ShoppingBag, Trash2, UserCircle, User as UserIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
            <header className="sticky top-0 z-30 bg-[#F6F8FA]">
                <div className="mx-auto flex h-20 max-w-[1600px] items-center gap-4 px-4 sm:gap-8 sm:px-6 lg:gap-10 lg:px-8">
                    <Link href={route('customer.dashboard')} aria-label="SwiftDrop home" className="flex shrink-0 items-center leading-none">
                        <img src="/brand/Container.png" alt="" aria-hidden className="h-9 w-auto sm:h-10" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => setAddressOpen(true)}
                        aria-label="Change delivery address"
                        className="group text-foreground hover:bg-background/80 focus-visible:ring-primary/40 flex min-w-0 max-w-[420px] items-center gap-3 rounded-xl px-2.5 py-1.5 text-left transition focus-visible:ring-2 focus-visible:outline-none"
                    >
                        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                            <MapPin className="size-4.5" strokeWidth={2.2} />
                        </span>
                        <span className="flex min-w-0 flex-col leading-tight">
                            <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px] font-medium tracking-wide uppercase">
                                Deliver to <span className="shrink-0">{addressLabel}</span>
                                <ChevronDown className="text-primary size-3 transition group-hover:translate-y-0.5" />
                            </span>
                            <span className="text-foreground mt-0.5 flex min-w-0 items-baseline gap-1.5 text-sm font-semibold">
                                
                                <span className="text-muted-foreground hidden truncate font-normal sm:inline"> {addressSummary}</span>
                            </span>
                        </span>
                    </button>

                    <nav className="ml-auto flex items-center gap-6 text-sm font-medium sm:gap-8 lg:gap-10">
                        <HeaderSearch />
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

interface RecentSearch {
    id: number;
    keyword: string;
}

/**
 * Inline search input + history dropdown. Closed state shows the icon-only
 * button (matching the design); clicking opens an input that fetches the
 * customer's recent search list lazily. Submitting navigates to the search
 * results page (where the input itself stays hidden — the header owns search).
 */
function HeaderSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [recent, setRecent] = useState<RecentSearch[] | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Click-outside / Esc closes the inline input.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    // Lazy-load history on first open; refresh each time the panel opens so
    // a search performed elsewhere shows up the next time.
    useEffect(() => {
        if (!open) return;
        inputRef.current?.focus();
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/customer/search/history', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!res.ok) {
                setRecent([]);
                return;
            }
            const data = (await res.json()) as { recent: RecentSearch[] };
            setRecent(data.recent ?? []);
        } catch {
            setRecent([]);
        } finally {
            setLoading(false);
        }
    };

    const submit = (keyword: string) => {
        const q = keyword.trim();
        if (!q) return;
        setOpen(false);
        setQuery('');
        router.get('/customer/search', { search: q }, { preserveScroll: false, preserveState: false });
    };

    const clearHistory = async () => {
        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
            await fetch('/customer/search/history', {
                method: 'DELETE',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
        } catch {
            // ignore — UI will just keep the stale list until reload
        }
        setRecent([]);
    };

    if (!open) {
        return (
            <button
                type="button"
                aria-label="Search"
                onClick={() => setOpen(true)}
                className="text-foreground hover:text-primary flex items-center gap-2"
            >
                <Search className="size-5" />
                <span className="hidden md:inline">Search</span>
            </button>
        );
    }

    return (
        <div ref={wrapperRef} className="relative">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    submit(query);
                }}
                className="bg-background flex h-10 w-72 items-center gap-2 rounded-md border border-zinc-200 px-3 focus-within:border-emerald-500 sm:w-80"
            >
                <SearchIcon className="text-muted-foreground size-4" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search dishes & restaurants"
                    className="placeholder:text-muted-foreground h-full flex-1 bg-transparent text-sm outline-none"
                />
                <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </form>

            <div className="bg-background absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-md border border-zinc-200 shadow-lg sm:w-80">
                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                    <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Recent searches</span>
                    {recent && recent.length > 0 ? (
                        <button
                            type="button"
                            onClick={clearHistory}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                        >
                            <Trash2 className="size-3" /> Clear
                        </button>
                    ) : null}
                </div>
                {loading && recent === null ? (
                    <p className="text-muted-foreground px-3 py-3 text-xs">Loading…</p>
                ) : !recent || recent.length === 0 ? (
                    <p className="text-muted-foreground px-3 py-3 text-xs">Your recent searches will show up here.</p>
                ) : (
                    <ul className="max-h-72 overflow-y-auto">
                        {recent.map((row) => (
                            <li key={row.id}>
                                <button
                                    type="button"
                                    onClick={() => submit(row.keyword)}
                                    className="hover:bg-muted/60 flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                                >
                                    <SearchIcon className="text-muted-foreground size-3.5" />
                                    <span className="text-foreground truncate">{row.keyword}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
