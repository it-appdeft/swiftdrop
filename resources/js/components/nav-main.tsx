import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavGroup, NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface NavMainProps {
    /** Either a flat list of items (legacy) or grouped sections. */
    items?: NavItem[];
    groups?: NavGroup[];
}

export function NavMain({ items, groups }: NavMainProps) {
    const sections: NavGroup[] = groups ?? (items ? [{ title: 'Platform', items }] : []);
    const page = usePage();

    return (
        <>
            {sections.map((section) => (
                <SidebarGroup key={section.title} className="px-2">
                    <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {section.items.map((item) => {
                                const isActive = page.url === item.url || page.url.startsWith(`${item.url}/`);
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                                            <Link href={item.url} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    );
}
