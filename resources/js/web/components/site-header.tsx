import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { SwiftdropWordmark } from './swiftdrop-wordmark';

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" aria-label="Swiftdrop home">
                    <SwiftdropWordmark />
                </Link>

                <nav className="flex items-center gap-2 sm:gap-6">
                    <Link
                        href={`${route('register')}?as=restaurant`}
                        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                    >
                        Partner with us
                    </Link>
                    <Link
                        href="#"
                        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                    >
                        Got Tips?
                    </Link>
                    <Button asChild size="sm" className="rounded-md">
                        <Link href={route('login')}>Sign in</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
