import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Bell, Search } from 'lucide-react';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
}

export function AppSidebarHeader({ breadcrumbs = [] }: AppSidebarHeaderProps) {
    return (
        <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur transition-[height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <div className="bg-border hidden h-5 w-px sm:block" aria-hidden />
                <div className="hidden min-w-0 sm:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
                <div className="relative hidden md:block">
                    <Input
                        type="search"
                        size="sm"
                        placeholder="Search…"
                        leftAdornment={<Search aria-hidden />}
                        className="w-64"
                    />
                    <kbd className="bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border px-1.5 font-mono text-[10px] font-medium lg:inline-flex">
                        ⌘K
                    </kbd>
                </div>
                <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
                    <Bell />
                    <Badge
                        variant="danger"
                        className="absolute -top-1 -right-1 size-4 rounded-full border-2 border-background p-0 text-[10px]"
                        aria-label="Unread notifications"
                    >
                        <span className="sr-only">Unread notifications</span>
                    </Badge>
                </Button>
                <AppearanceToggleDropdown />
            </div>
        </header>
    );
}
