import { toast } from '@/hooks/use-toast';
import { Head, useForm } from '@inertiajs/react';
import { Eye, LifeBuoy, Mail, MessageCircle, Phone, X } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../layouts/app-layout';

interface SupportTicket {
    id: number;
    reference: string;
    subject: string;
    category: string | null;
    order_reference: string | null;
    description: string;
    status: string;
    status_label: string;
    created_at: string | null;
}

interface SupportPageProps {
    tickets: SupportTicket[];
    contact: { phone: string; email: string; live_chat_response: string };
    categories: string[];
    [key: string]: unknown;
}

const STATUS_COLORS: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-zinc-100 text-zinc-700',
};

export default function SupportPage({ tickets, contact, categories }: SupportPageProps) {
    const [selected, setSelected] = useState<SupportTicket | null>(null);
    const form = useForm({
        subject: '',
        category: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('restaurant.support.store'), {
            preserveScroll: true,
            // Success toast comes from the controller's flash message
            // (app.tsx → router.on('success')); just reset the form here.
            onSuccess: () => form.reset(),
            onError: () => toast.error('Please review the form and try again.'),
        });
    };

    return (
        <AppLayout active="support">
            <Head title="Support" />

            <div className="w-full space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Support</h1>
                    <p className="text-muted-foreground mt-1 text-sm">We're here 24/7 for partners.</p>
                </div>

                {/* Contact channels */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <ContactCard icon={Phone} title="Call us" value={contact.phone} />
                    <ContactCard icon={Mail} title="Email" value={contact.email} />
                    <ContactCard icon={MessageCircle} title="Live chat" value={contact.live_chat_response} />
                </div>

                {/* Raise a ticket */}
                <form onSubmit={submit} className="border-border bg-background rounded-2xl border p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                        <LifeBuoy className="text-primary size-5" />
                        <h2 className="text-lg font-bold">Raise a ticket</h2>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Subject</label>
                            <input
                                type="text"
                                value={form.data.subject}
                                onChange={(e) => form.setData('subject', e.target.value)}
                                placeholder="What's going on?"
                                className="border-input bg-background focus:border-primary focus:ring-primary/30 h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                            />
                            {form.errors.subject && <p className="text-xs text-rose-500">{form.errors.subject}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Category</label>
                            <select
                                value={form.data.category}
                                onChange={(e) => form.setData('category', e.target.value)}
                                className="border-input bg-background focus:border-primary focus:ring-primary/30 h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                            >
                                <option value="">Order / Payout / Menu / Other</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            {form.errors.category && <p className="text-xs text-rose-500">{form.errors.category}</p>}
                        </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                        <label className="text-sm font-medium">Describe the issue</label>
                        <textarea
                            rows={5}
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            placeholder="Add as much detail as possible..."
                            className="border-input bg-background focus:border-primary focus:ring-primary/30 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                        />
                        {form.errors.description && <p className="text-xs text-rose-500">{form.errors.description}</p>}
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-md px-5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                        >
                            {form.processing ? 'Submitting…' : 'Submit ticket'}
                        </button>
                    </div>
                </form>

                {/* Recent tickets */}
                {tickets.length > 0 && (
                    <div className="border-border bg-background rounded-2xl border p-5 sm:p-6">
                        <h2 className="text-lg font-bold">Your recent tickets</h2>
                        <div className="mt-4 space-y-2">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="border-border flex items-start justify-between gap-4 rounded-lg border p-3"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold">{ticket.subject}</p>
                                            <span
                                                className={
                                                    'inline-flex rounded px-2 py-0.5 text-xs font-semibold ' +
                                                    (STATUS_COLORS[ticket.status] ?? 'bg-zinc-100 text-zinc-700')
                                                }
                                            >
                                                {ticket.status_label}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground mt-0.5 text-xs">
                                            {ticket.reference}
                                            {ticket.category ? ` · ${ticket.category}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <p className="text-muted-foreground text-xs">
                                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ''}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(ticket)}
                                            aria-label="View ticket"
                                            title="View ticket"
                                            className="border-border text-muted-foreground hover:border-primary hover:text-primary flex size-8 items-center justify-center rounded-md border transition"
                                        >
                                            <Eye className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {selected && <TicketDetailModal ticket={selected} onClose={() => setSelected(null)} />}
        </AppLayout>
    );
}

function TicketDetailModal({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
    const createdAt = ticket.created_at ? new Date(ticket.created_at) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="bg-background relative z-10 w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="border-border bg-muted/40 flex items-start justify-between gap-4 border-b px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                            <LifeBuoy className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="truncate text-lg font-bold leading-tight">{ticket.subject}</h3>
                            <p className="text-muted-foreground mt-0.5 font-mono text-xs">{ticket.reference}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-md transition"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-5 px-6 py-5">
                    {/* Status banner */}
                    <div className="border-border flex items-center justify-between rounded-xl border px-4 py-3">
                        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Status</span>
                        <span
                            className={
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ' +
                                (STATUS_COLORS[ticket.status] ?? 'bg-zinc-100 text-zinc-700')
                            }
                        >
                            <span className="size-1.5 rounded-full bg-current" />
                            {ticket.status_label}
                        </span>
                    </div>

                    {/* Metadata grid */}
                    <dl className="grid grid-cols-2 gap-4">
                        <DetailField label="Category" value={ticket.category ?? '—'} />
                        <DetailField
                            label="Created At"
                            value={createdAt ? createdAt.toLocaleDateString() + ' (' + createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')' : '—'}
                        />
                    </dl>

                    {/* Description */}
                    <div>
                        <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wide">Description</p>
                        <div className="bg-muted/40 border-border rounded-xl border px-4 py-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-border bg-muted/30 flex justify-end gap-2 border-t px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-md px-5 text-sm font-semibold hover:opacity-90"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</dt>
            <dd className="mt-1 text-sm font-medium break-words">{value}</dd>
        </div>
    );
}

function ContactCard({
    icon: Icon,
    title,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
}) {
    return (
        <div className="border-border bg-background rounded-2xl border p-5">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                <Icon className="size-5" />
            </div>
            <p className="mt-3 font-semibold">{title}</p>
            <p className="text-muted-foreground mt-0.5 text-sm">{value}</p>
        </div>
    );
}
