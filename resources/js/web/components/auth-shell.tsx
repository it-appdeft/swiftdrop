import { SiteHeader } from './site-header';

interface AuthShellProps {
    children: React.ReactNode;
}

const HERO_IMAGE_URL = '/assets/Rectangle 3463358 (2).svg';

export function AuthShell({ children }: AuthShellProps) {
    return (
        <div className="flex min-h-screen flex-col bg-zinc-50">
            <SiteHeader />

            <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
                {/* Hero image panel */}
                <div
                    className="hidden bg-slate-900 bg-cover bg-center bg-no-repeat lg:block"
                    style={{ backgroundImage: `url("${HERO_IMAGE_URL}")` }}
                    aria-hidden
                />

                {/* Form panel */}
                <div className="flex flex-col items-center justify-center px-4 py-8 sm:px-12 sm:py-10 lg:px-16">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
