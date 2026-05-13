import { Link } from '@inertiajs/react';
import { SwiftdropWordmark } from './swiftdrop-wordmark';

export function SiteFooter() {
    return (
        <footer className="bg-zinc-950 text-zinc-200">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
                    <div>
                        <SwiftdropWordmark color="light" />
                        <p className="mt-4 max-w-xs text-sm text-zinc-400">
                            Redefining logistics for the modern citizen with speed, information, sleek and seamless service.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">Partners</h3>
                        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                            <li>
                                <Link href={`${route('register')}?as=restaurant`} className="hover:text-white">
                                    Partner with us
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Become a Driver
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">Support</h3>
                        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Contact Support
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
                    © {new Date().getFullYear()} Swiftdrop. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
