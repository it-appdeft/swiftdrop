import { AnimatePresence, motion } from 'framer-motion';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { NavGroup, NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface NavMainProps {
    items?: NavItem[];
    groups?: NavGroup[];
}

const MotionSidebarMenuItem = motion.create(SidebarMenuItem);

export function NavMain({ items, groups }: NavMainProps) {
    const sections: NavGroup[] = groups ?? (items ? [{ title: 'Platform', items }] : []);
    const page = usePage();

    let globalIndex = 0;

    return (
        <>
            {sections.map((section) => (
                <SidebarGroup key={section.title} className="px-2 py-1">
                    <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease, delay: globalIndex * 0.04 }}
                    >
                        <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/60">
                            {section.title}
                        </SidebarGroupLabel>
                    </motion.div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {section.items.map((item) => {
                                const isActive = page.url === item.url || page.url.startsWith(`${item.url}/`);
                                const delay = 0.08 + globalIndex++ * 0.05;
                                return (
                                    <MotionSidebarMenuItem
                                        key={item.title}
                                        className="relative"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, ease, delay }}
                                    >
                                        {/* Shared animated active background pill */}
                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="sidebar-active-pill"
                                                    className="absolute inset-0 rounded-md bg-primary/10 border border-primary/20"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.18 }}
                                                />
                                            )}
                                        </AnimatePresence>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            className={cn(
                                                'relative z-10 transition-all duration-200 font-medium',
                                                isActive
                                                    ? 'text-primary hover:text-primary hover:bg-transparent'
                                                    : 'text-sidebar-foreground/80 hover:text-sidebar-foreground',
                                            )}
                                        >
                                            <Link href={item.url} prefetch>
                                                {item.icon && (
                                                    <item.icon
                                                        className={cn(
                                                            'transition-colors',
                                                            isActive ? 'text-primary' : 'text-muted-foreground',
                                                        )}
                                                    />
                                                )}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </MotionSidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    );
}
