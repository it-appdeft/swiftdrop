import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { LucideIcon, Monitor, Shield, User } from 'lucide-react';

interface SettingsNavItem extends NavItem {
    icon: LucideIcon;
    description: string;
}

const sidebarNavItems: SettingsNavItem[] = [
    { title: 'Profile',    url: '/settings/profile',    icon: User,    description: 'Email' },
    { title: 'Password',   url: '/settings/password',   icon: Shield,  description: 'Change your password' },
    { title: 'Appearance', url: '/settings/appearance', icon: Monitor, description: 'Theme preferences' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <PageContainer width="default">
            <PageHeader
                eyebrow="Account"
                title="Settings"
                description="Manage your profile and account preferences."
            />

            <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
                {/* Settings nav */}
                <aside className="w-full shrink-0 lg:w-52">
                    <nav className="flex flex-col gap-1">
                        {sidebarNavItems.map((item, i) => {
                            const isActive = currentPath === item.url;
                            return (
                                <motion.div
                                    key={item.url}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: i * 0.07, ease: [0.25, 1, 0.5, 1] }}
                                    whileHover={{ x: 2 }}
                                >
                                    <Link
                                        href={item.url}
                                        prefetch
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                                            isActive
                                                ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex size-7 items-center justify-center rounded-md [&_svg]:size-3.5',
                                                isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            <item.icon />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium leading-none">{item.title}</p>
                                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">{item.description}</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content */}
                <motion.div
                    className="flex-1 min-w-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
                >
                    <Card className="p-6 max-w-2xl">
                        {children}
                    </Card>
                </motion.div>
            </div>
        </PageContainer>
    );
}
