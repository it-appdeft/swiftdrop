import { Link } from '@inertiajs/react';
import { SwiftdropWordmark } from './swiftdrop-wordmark';

export function SiteFooter() {
    return (
        <footer className="bg-zinc-950 text-zinc-200">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                    {/* Left — brand + tagline */}
                    <div className="md:max-w-sm">
                        <SwiftdropWordmark color="light" />
                        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                            Redefining logistics for the modern urban landscape with precision, speed, and
                            premium service.
                        </p>
                    </div>

                    {/* Right — Partners + Support side by side */}
                    <div className="grid grid-cols-2 gap-x-16 gap-y-8 sm:gap-x-24">
                        <div>
                            <h3 className="text-sm font-bold text-primary">Partners</h3>
                            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                                <li>
                                    <Link
                                        href={`${route('register')}?as=restaurant`}
                                        className="transition hover:text-white"
                                    >
                                        Partner with Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="transition hover:text-white">
                                        Business Delivery
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-primary">Support</h3>
                            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                                <li>
                                    <Link href="#" className="transition hover:text-white">
                                        Contact Support
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="transition hover:text-white">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="transition hover:text-white">
                                        Privacy Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
                    © {new Date().getFullYear()} Swift Drop Logistics. Premium Delivery Redefined.
                </div>
            </div>
        </footer>
    );
}
