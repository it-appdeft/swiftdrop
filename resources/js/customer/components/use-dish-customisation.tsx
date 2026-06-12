import { toast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { DishModifierDialog, type ModifierDish } from './dish-modifier-dialog';
import { RepeatCustomisationDialog, summariseSelection } from './repeat-customisation-dialog';

/** One cart line of a dish — a distinct option combo the customer can repeat or edit. */
export interface CustomisableLine {
    id: number;
    quantity: number;
    selected_options: number[];
}

/** A dish we can add to / re-customise — the modifier-dialog shape plus an id
 *  that is the menu item id (so "choose new" can POST against it). */
export type CustomisableDish = ModifierDish;

/**
 * Shared "+ on a customisable dish" behaviour for the cart, checkout and
 * restaurant surfaces. A plain dish just bumps its single line; a dish with
 * modifier groups opens the "repeat previous customisation?" prompt — repeat a
 * combo, edit one, or choose new modifiers — exactly like the menu, so the same
 * dish can live in the cart under several combos no matter where "+" is tapped.
 *
 * The hook owns the two dialogs and the cart mutations; callers just call
 * {@link increment} from their "+" button and render {@link dialogs} once.
 */
export function useDishCustomisation() {
    const [repeat, setRepeat] = useState<{ dish: CustomisableDish; lines: CustomisableLine[] } | null>(null);
    const [editor, setEditor] = useState<{ dish: CustomisableDish; line: CustomisableLine | null } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const bump = (line: CustomisableLine, delta: number) =>
        router.put(`/customer/cart/items/${line.id}`, { quantity: line.quantity + delta }, { preserveScroll: true, preserveState: true });

    // The "+" handler. `lines` is every combo of this dish already in the cart
    // (one entry for a plain dish), so the repeat prompt can list them all.
    const increment = (dish: CustomisableDish, lines: CustomisableLine[]) => {
        if (dish.modifier_groups.length > 0) {
            setRepeat({ dish, lines });
            return;
        }
        if (lines[0]) bump(lines[0], 1);
    };

    const addLine = (dish: CustomisableDish, quantity: number, options: number[], onDone: () => void) => {
        setSubmitting(true);
        router.post(
            '/customer/cart',
            { menu_item_id: dish.id, quantity, options },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onDone(),
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(typeof first === 'string' ? first : 'Could not add this item to your cart.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const updateSelection = (lineId: number, quantity: number, options: number[], onDone: () => void) => {
        setSubmitting(true);
        router.put(
            `/customer/cart/items/${lineId}`,
            { quantity, options },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onDone(),
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(typeof first === 'string' ? first : 'Could not update this item.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const dialogs = (
        <>
            {repeat ? (
                <RepeatCustomisationDialog
                    key={`repeat-${repeat.dish.id}`}
                    dishName={repeat.dish.name}
                    combos={repeat.lines.map((line) => ({
                        lineId: line.id,
                        quantity: line.quantity,
                        summary: summariseSelection(repeat.dish.modifier_groups, line.selected_options),
                    }))}
                    submitting={submitting}
                    onClose={() => setRepeat(null)}
                    // Repeat a specific combo → bump just that line's quantity.
                    onRepeat={(lineId) => {
                        const line = repeat.lines.find((l) => l.id === lineId);
                        if (line) bump(line, 1);
                        setRepeat(null);
                    }}
                    // Edit a combo → open the modifier dialog pre-filled for that line.
                    onEdit={(lineId) => {
                        const line = repeat.lines.find((l) => l.id === lineId) ?? null;
                        const dish = repeat.dish;
                        setRepeat(null);
                        setEditor({ dish, line });
                    }}
                    // Choose fresh modifiers → the modifier dialog adds, and the
                    // backend merges or creates a new line by its option signature.
                    onChoose={() => {
                        const dish = repeat.dish;
                        setRepeat(null);
                        setEditor({ dish, line: null });
                    }}
                />
            ) : null}

            {editor ? (
                <DishModifierDialog
                    key={`${editor.dish.id}-${editor.line?.id ?? 'new'}`}
                    dish={editor.dish}
                    selectedOptions={editor.line?.selected_options ?? []}
                    initialQuantity={editor.line?.quantity ?? 1}
                    editing={editor.line !== null}
                    submitting={submitting}
                    onClose={() => setEditor(null)}
                    onAdd={(optionIds, quantity) =>
                        editor.line
                            ? updateSelection(editor.line.id, quantity, optionIds, () => setEditor(null))
                            : addLine(editor.dish, quantity, optionIds, () => setEditor(null))
                    }
                />
            ) : null}
        </>
    );

    return { increment, dialogs };
}
