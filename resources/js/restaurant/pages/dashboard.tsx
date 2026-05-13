import { Head, Link } from '@inertiajs/react';

export default function RestaurantDashboard() {
    return (
        <div className="min-h-screen bg-zinc-50">
            <Head title="Restaurant dashboard" />

            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold tracking-tight">Welcome, partner.</h1>
                <p className="mt-2 text-muted-foreground">
                    Your restaurant dashboard will live here — manage your menu, accept orders, and review performance.
                </p>

                <div className="mt-8 rounded-2xl border border-border bg-background p-6 text-sm">
                    <p className="font-medium">Coming soon</p>
                    <ul className="mt-2 list-inside list-disc text-muted-foreground">
                        <li>Incoming orders queue</li>
                        <li>Menu &amp; pricing management</li>
                        <li>Earnings &amp; payouts</li>
                    </ul>
                </div>

                <Link href="/" className="mt-6 inline-block text-sm text-primary hover:underline">
                    ← Back to site
                </Link>
            </div>
        </div>
    );
}
