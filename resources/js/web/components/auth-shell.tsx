import { Link } from '@inertiajs/react';
import { SwiftdropWordmark } from './swiftdrop-wordmark';

interface AuthShellProps {
    children: React.ReactNode;
}

const HERO_IMAGE_URL = '/assets/Rectangle 3463358 (2).svg';

export function AuthShell({ children }: AuthShellProps) {
    return (
        <div className="grid min-h-screen grid-cols-1 bg-zinc-50 lg:grid-cols-2">
            {/* Hero image panel */}
            <div
                className="hidden bg-slate-900 bg-cover bg-center bg-no-repeat lg:block"
                style={{ backgroundImage: `url("${HERO_IMAGE_URL}")` }}
                aria-hidden
            />

            {/* Form panel */}
            <div className="flex flex-col items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
                <Link href="/" aria-label="SwiftDrop home" className="mb-6">
                    <SwiftdropWordmark />
                </Link>
                <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}
