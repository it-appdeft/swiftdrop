import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { motion } from 'framer-motion';
import { Bell, Search } from 'lucide-react';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
}

export function AppSidebarHeader({ breadcrumbs = [] }: AppSidebarHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-[height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:px-5">
            {/* Left: trigger + breadcrumbs */}
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
                <div className="bg-border/60 hidden h-4 w-px sm:block" aria-hidden />
                <div className="hidden min-w-0 sm:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            {/* Right: search + actions */}
            <div className="ml-auto flex items-center gap-1.5">
                {/* Search */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
                    <Input
                        type="search"
                        size="sm"
                        placeholder="Search…"
                        className="h-8 w-56 rounded-full border-border/60 bg-muted/40 pl-8 pr-10 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 focus-visible:bg-background transition-all focus-visible:w-72"
                    />
                    <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-border/60 bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground/70 lg:inline-flex">
                        ⌘K
                    </kbd>
                </div>

                {/* Notification bell */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="relative size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        aria-label="Notifications"
                    >
                        <Bell className="size-4" />
                        {/* Pulse badge */}
                        <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-60" />
                            <span className="relative flex size-2.5 items-center justify-center rounded-full bg-red-500">
                                <span className="sr-only">3 unread notifications</span>
                            </span>
                        </span>
                    </Button>
                </motion.div>

                {/* Theme toggle */}
                <AppearanceToggleDropdown />
            </div>
        </header>
    );
}
