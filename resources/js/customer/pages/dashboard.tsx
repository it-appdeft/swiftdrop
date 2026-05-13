import { Head, Link } from '@inertiajs/react';

export default function CustomerDashboard() {
    return (
        <div className="min-h-screen bg-zinc-50">
            <Head title="Customer dashboard" />

            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
                <p className="mt-2 text-muted-foreground">
                    Your customer dashboard will live here — browse restaurants, place orders, and track deliveries.
                </p>

                <div className="mt-8 rounded-2xl border border-border bg-background p-6 text-sm">
                    <p className="font-medium">Coming soon</p>
                    <ul className="mt-2 list-inside list-disc text-muted-foreground">
                        <li>Active orders &amp; live tracking</li>
                        <li>Saved addresses</li>
                        <li>Favourite restaurants</li>
                    </ul>
                </div>

                <Link href="/" className="mt-6 inline-block text-sm text-primary hover:underline">
                    ← Back to site
                </Link>
            </div>
        </div>
    );
}
