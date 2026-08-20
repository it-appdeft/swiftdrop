import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ModifierGroup } from './dish-modifier-dialog';

export interface CustomisationLine {
    group: string;
    options: string;
}

/**
 * Human summary of a saved selection — one line per modifier group that has a
 * pick, e.g. `{ group: 'Size', options: 'Regular' }`. Shared by every surface
 * that shows the "repeat previous customisation" prompt so the wording matches.
 */
export function summariseSelection(groups: ModifierGroup[], optionIds: number[]): CustomisationLine[] {
    const picked = new Set(optionIds);
    const lines: CustomisationLine[] = [];
    for (const group of groups) {
        const names = group.options.filter((o) => picked.has(o.id)).map((o) => o.name);
        if (names.length > 0) lines.push({ group: group.name, options: names.join(', ') });
    }
    return lines;
}

/** One existing cart line for the dish — a distinct option combo. */
export interface ExistingCombo {
    lineId: number;
    quantity: number;
    summary: CustomisationLine[];
}

interface Props {
    dishName: string;
    /** Every combo of this dish already in the cart, not just the last one. */
    combos: ExistingCombo[];
    submitting?: boolean;
    /** Bump a specific existing combo's quantity. */
    onRepeat: (lineId: number) => void;
    /** Re-open the modifier dialog for a combo, pre-filled, to edit + save it. */
    onEdit: (lineId: number) => void;
    /** Open the modifier dialog to build a fresh selection (a new line, or a
     *  merge if it happens to match an existing combo). */
    onChoose: () => void;
    onClose: () => void;
}

/**
 * Shown when the customer taps "+" on a customisable dish that's already in the
 * cart. It lists EVERY combo of that dish currently in the cart so they can add
 * another of any one of them, or choose new modifiers — which is what lets one
 * dish live in the cart under several different combos.
 */
export function RepeatCustomisationDialog({ dishName, combos, submitting = false, onRepeat, onEdit, onChoose, onClose }: Props) {
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[440px]">
                <DialogTitle className="sr-only">Repeat previous customisation for {dishName}</DialogTitle>
                <DialogDescription className="sr-only">
                    Add another of a previous customisation for {dishName}, or choose new modifiers.
                </DialogDescription>

                <div className="flex max-h-[85vh] flex-col">
                    <div className="px-6 pt-6 pb-2">
                        <p className="text-muted-foreground truncate text-xs">{dishName}</p>
                        <h2 className="text-foreground mt-1 text-lg font-bold">Repeat Previous Customisation?</h2>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Add another of a combo below, or choose new modifiers.
                        </p>
                    </div>

                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-3">
                        {combos.map((combo) => (
                            <div
                                key={combo.lineId}
                                className="flex items-start justify-between gap-3 rounded-md border border-zinc-200 bg-[#F6F8FA] px-3 py-2.5"
                            >
                                <div className="min-w-0 flex-1 space-y-0.5 text-sm">
                                    {combo.summary.length > 0 ? (
                                        combo.summary.map((line, i) => (
                                            <p key={i} className="text-foreground">
                                                <span className="font-semibold">{line.group}:</span> {line.options}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground">No extras</p>
                                    )}
                                    <p className="text-muted-foreground text-xs">In cart: {combo.quantity}</p>
                                </div>
                                <div className="flex shrink-0 flex-col gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(combo.lineId)}
                                        disabled={submitting}
                                        className="rounded-md border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRepeat(combo.lineId)}
                                        disabled={submitting}
                                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Repeat
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-zinc-100 px-6 py-4">
                        <button
                            type="button"
                            onClick={onChoose}
                            disabled={submitting}
                            className="w-full rounded-md border border-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            I'll Choose New Modifiers
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
