import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

/**
 * Branded split-screen auth layout. Left panel plays the SwiftDrop splash
 * reel as a muted, looping background; the static logo poster ships as a
 * graceful fallback when the video can't autoplay (reduced-motion, slow
 * connections, browsers that block autoplay).
 */
export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="bg-background relative flex min-h-svh flex-col">
            {/* Top header — full-width brand bar spanning both columns.
                Mirrors the customer chrome so the admin login feels like
                part of the same product. */}
            <header className="px-4 py-2 sm:px-6 sm:py-2">
                <Link href={route('home')} className="inline-flex w-fit items-center" aria-label="SwiftDrop">
                    <img src="/brand/dark-logo-4x.png" alt="SwiftDrop" className="h-15 w-25" />
                </Link>
            </header>

            <div className="relative grid flex-1 lg:grid-cols-2">
            {/* Left — branded splash panel. Hidden under lg. */}
            <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
                {/* <video
                    className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
                    poster="/brand/logo.png"
                    src="/brand/splash.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden
                /> */}
                <img
                    className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
                    src="/brand/Swift-Bird.gif"
                    alt=""
                    aria-hidden="true"
                />
                {/* Static fallback for reduced-motion users */}
                <img
                    src="/brand/logo.png"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 hidden h-full w-full object-cover motion-reduce:block"
                />
                {/* Soft overlay so the foreground copy stays legible regardless of frame */}
                <div
                    className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/55"
                    aria-hidden
                />

                <div className="relative flex items-center gap-2 text-white">
                    {/* <span className="flex size-9 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/30 backdrop-blur">
                        <AppLogoIcon className="size-5 fill-current" />
                    </span>
                    <div className="leading-tight">
                        <p className="text-sm font-semibold">SwiftDrop</p>
                        <p className="text-[10px] font-medium tracking-[0.18em] uppercase opacity-80">
                            Fresh food · Fast delivery
                        </p>
                    </div> */}
                </div>

                <div className="relative max-w-md space-y-4 text-white">
                    <p className="text-2xl leading-snug font-medium drop-shadow-sm">
                        Your favorite food, delivered <span className="text-primary-foreground bg-primary/90 inline-block rounded-md px-2 py-0.5">Swiftly</span>.
                    </p>
                    <p className="text-sm text-white/80">
                        Manage couriers, track live shipments, and keep partners in sync — all from one operations console.
                    </p>
                </div>
            </aside>

            {/* Right — form column */}
            <main className="flex w-full items-center justify-center px-6 py-10 sm:px-10">
                <div className="w-full max-w-sm space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
                    </div>

                    {children}
                </div>
            </main>
            </div>
        </div>
    );
}
