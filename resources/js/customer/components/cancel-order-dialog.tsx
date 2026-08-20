import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

const REASONS = ['Ordered by mistake', 'Want to change items', 'Delivery time too long', 'Found a better option', 'Other'];

/**
 * "Cancel this order?" reason picker, driven the same way as profile.tsx's
 * ConfirmDeleteDialog (controlled open + onCancel/onConfirm), but with a
 * reason list instead of a single confirmation. Only rendered while the
 * order is still cancellable — see Order::isCancellable().
 */
export function CancelOrderDialog({
    open,
    onCancel,
    onConfirm,
    busy = false,
    reasons = REASONS,
}: {
    open: boolean;
    onCancel: () => void;
    onConfirm: (reason: string) => void;
    busy?: boolean;
    reasons?: string[];
}) {
    const [selected, setSelected] = useState<string | null>(null);
    const [otherText, setOtherText] = useState('');

    const reason = selected === 'Other' ? otherText.trim() : selected;
    const canSubmit = selected !== null && (selected !== 'Other' || otherText.trim().length > 0);

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) {
                    setSelected(null);
                    setOtherText('');
                    onCancel();
                }
            }}
        >
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Cancel This Order?</DialogTitle>
                    <p className="text-muted-foreground text-sm">
                        You'll receive a full refund if the restaurant has not already started preparing your order.
                    </p>
                </DialogHeader>

                <div className="mt-2 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-100">
                    {reasons.map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setSelected(r)}
                            className="hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition"
                        >
                            {r}
                            <span
                                className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                                    selected === r ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-zinc-300'
                                }`}
                            >
                                {selected === r ? <Check className="size-3" strokeWidth={3} /> : null}
                            </span>
                        </button>
                    ))}
                </div>

                {selected === 'Other' ? (
                    <textarea
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        placeholder="Tell us more…"
                        rows={3}
                        className="border-input mt-3 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                ) : null}

                <div className="mt-5 flex w-full gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-muted text-foreground hover:bg-muted/70 h-11 flex-1 rounded-md text-sm font-semibold transition"
                    >
                        Keep Order
                    </button>
                    <button
                        type="button"
                        onClick={() => reason && onConfirm(reason)}
                        disabled={!canSubmit || busy}
                        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                        {busy ? (
                            'Cancelling…'
                        ) : (
                            <>
                                <X className="size-4" />
                                Cancel Order
                            </>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
