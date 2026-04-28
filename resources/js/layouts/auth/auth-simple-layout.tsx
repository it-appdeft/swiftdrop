import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="bg-background relative flex min-h-svh items-stretch">
            {/* Left — branded panel. Hidden under lg. */}
            <aside className="bg-aurora text-foreground relative hidden flex-1 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
                <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />

                <div className="relative flex items-center gap-2">
                    <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-md shadow-sm">
                        <AppLogoIcon className="size-5 fill-current text-white" />
                    </span>
                    <div className="leading-tight">
                        <p className="text-sm font-semibold">SwiftDrop</p>
                        <p className="text-muted-foreground text-xs">Operations console</p>
                    </div>
                </div>

                <div className="relative max-w-md space-y-4">
                    <p className="text-foreground/90 text-2xl leading-snug font-medium">
                        “The new dashboard cut our weekly ops review from two hours to fifteen minutes.”
                    </p>
                    <div className="text-muted-foreground flex items-center gap-3 text-sm">
                        <div className="bg-foreground/10 flex size-9 items-center justify-center rounded-full font-medium">OM</div>
                        <div className="leading-tight">
                            <p className="text-foreground font-medium">Olivia Martinez</p>
                            <p>VP Operations · Northwind Labs</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Right — form column */}
            <main className="flex w-full flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:max-w-xl">
                <div className="w-full max-w-sm space-y-8">
                    <div className="lg:hidden">
                        <Link href={route('home')} className="inline-flex items-center gap-2">
                            <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-md shadow-sm">
                                <AppLogoIcon className="size-5 fill-current text-white" />
                            </span>
                            <span className="text-sm font-semibold">SwiftDrop</span>
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
                    </div>

                    {children}
                </div>
            </main>
        </div>
    );
}
