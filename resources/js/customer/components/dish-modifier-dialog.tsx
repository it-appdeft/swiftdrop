import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check, Minus, Plus, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface ModifierOption {
    id: number;
    name: string;
    price_delta: number;
}

export interface ModifierGroup {
    id: number;
    name: string;
    description: string | null;
    selection_type: 'single' | 'multiple';
    is_required: boolean;
    min_selections: number;
    max_selections: number | null;
    options: ModifierOption[];
}

export interface ModifierDish {
    id: number;
    name: string;
    description: string | null;
    price: number;
    is_veg: boolean;
    image_url: string | null;
    modifier_groups: ModifierGroup[];
}

interface Props {
    dish: ModifierDish;
    submitting?: boolean;
    onClose: () => void;
    onAdd: (optionIds: number[], quantity: number) => void;
}

/** Each single-select group defaults to its first option (matches the design,
 *  where "Regular" is pre-selected). Multi-select groups start empty. */
function defaultSelection(groups: ModifierGroup[]): Record<number, number[]> {
    const initial: Record<number, number[]> = {};
    for (const group of groups) {
        initial[group.id] = group.selection_type === 'single' && group.options.length > 0 ? [group.options[0].id] : [];
    }
    return initial;
}

export function DishModifierDialog({ dish, submitting = false, onClose, onAdd }: Props) {
    const [selected, setSelected] = useState<Record<number, number[]>>(() => defaultSelection(dish.modifier_groups));
    const [quantity, setQuantity] = useState(1);

    const deltaById = useMemo(() => {
        const map = new Map<number, number>();
        for (const group of dish.modifier_groups) {
            for (const option of group.options) map.set(option.id, option.price_delta);
        }
        return map;
    }, [dish]);

    const selectedIds = useMemo(() => Object.values(selected).flat(), [selected]);

    const unitPrice = useMemo(
        () => selectedIds.reduce((sum, id) => sum + (deltaById.get(id) ?? 0), dish.price),
        [selectedIds, deltaById, dish.price],
    );

    // Every required group must be satisfied before the dish can be added.
    const canAdd = useMemo(
        () =>
            dish.modifier_groups.every((group) => {
                const count = selected[group.id]?.length ?? 0;
                if (group.selection_type === 'single') return group.is_required ? count >= 1 : true;
                const min = Math.max(group.is_required ? 1 : 0, group.min_selections);
                return count >= min;
            }),
        [dish.modifier_groups, selected],
    );

    const toggleSingle = (groupId: number, optionId: number) => {
        setSelected((prev) => ({ ...prev, [groupId]: [optionId] }));
    };

    const toggleMultiple = (group: ModifierGroup, optionId: number) => {
        setSelected((prev) => {
            const current = prev[group.id] ?? [];
            const isOn = current.includes(optionId);
            if (isOn) return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
            // Respect the group's max — silently ignore picks beyond it.
            if (group.max_selections !== null && current.length >= group.max_selections) return prev;
            return { ...prev, [group.id]: [...current, optionId] };
        });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[480px]">
                <div className="max-h-[90vh] overflow-y-auto">
                    {/* Hero image */}
                    <div className="aspect-[16/9] w-full overflow-hidden bg-amber-50">
                        {dish.image_url ? (
                            <img src={dish.image_url} alt={dish.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-amber-600">
                                <UtensilsCrossed className="size-12" />
                            </div>
                        )}
                    </div>

                    <div className="px-5 pt-4 pb-5">
                        <h2 className="text-foreground text-xl font-bold">{dish.name}</h2>
                        {dish.description ? <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{dish.description}</p> : null}

                        {dish.modifier_groups.map((group) => (
                            <GroupBlock
                                key={group.id}
                                group={group}
                                basePrice={dish.price}
                                isVeg={dish.is_veg}
                                selectedIds={selected[group.id] ?? []}
                                onSelectSingle={(optionId) => toggleSingle(group.id, optionId)}
                                onToggleMultiple={(optionId) => toggleMultiple(group, optionId)}
                            />
                        ))}
                    </div>
                </div>

                {/* Sticky footer: quantity + add */}
                <div className="bg-background flex items-center gap-3 border-t border-zinc-100 px-5 py-3">
                    <div className="flex items-center gap-3 rounded-md border border-emerald-500 px-3 py-2">
                        <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="text-emerald-600 disabled:opacity-40"
                            disabled={quantity <= 1}
                        >
                            <Minus className="size-4" />
                        </button>
                        <span className="min-w-5 text-center text-sm font-bold text-emerald-700">{quantity}</span>
                        <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                            className="text-emerald-600"
                        >
                            <Plus className="size-4" />
                        </button>
                    </div>
                    <button
                        type="button"
                        disabled={!canAdd || submitting}
                        onClick={() => onAdd(selectedIds, quantity)}
                        className="flex-1 rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Add Item £{(unitPrice * quantity).toFixed(2)}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function GroupBlock({
    group,
    basePrice,
    isVeg,
    selectedIds,
    onSelectSingle,
    onToggleMultiple,
}: {
    group: ModifierGroup;
    basePrice: number;
    isVeg: boolean;
    selectedIds: number[];
    onSelectSingle: (optionId: number) => void;
    onToggleMultiple: (optionId: number) => void;
}) {
    const isSingle = group.selection_type === 'single';
    // Single groups read as a price (base + delta), like the Size selector in
    // the design; only show it when at least one option actually costs more.
    const showAbsolutePrice = isSingle && group.options.some((o) => o.price_delta !== 0);
    const atMax = !isSingle && group.max_selections !== null && selectedIds.length >= group.max_selections;

    return (
        <section className="mt-5 border-t border-zinc-100 pt-4">
            <h3 className="text-foreground text-base font-bold">{group.name}</h3>
            {group.is_required ? (
                <p className="text-xs font-medium text-amber-600">Required</p>
            ) : group.max_selections ? (
                <p className="text-muted-foreground text-xs">Select up to {group.max_selections}</p>
            ) : null}

            <div className="mt-2 divide-y divide-zinc-50">
                {group.options.map((option) => {
                    const checked = selectedIds.includes(option.id);
                    const disabled = !isSingle && !checked && atMax;
                    const priceLabel = showAbsolutePrice
                        ? `£${(basePrice + option.price_delta).toFixed(2)}`
                        : option.price_delta > 0
                          ? `+£${option.price_delta.toFixed(2)}`
                          : '';

                    return (
                        <button
                            key={option.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => (isSingle ? onSelectSingle(option.id) : onToggleMultiple(option.id))}
                            className="flex w-full items-center gap-3 py-2.5 text-left disabled:opacity-40"
                        >
                            <VegDot isVeg={isVeg} />
                            <span className="text-foreground flex-1 text-sm">{option.name}</span>
                            {priceLabel ? <span className="text-muted-foreground text-sm tabular-nums">{priceLabel}</span> : null}
                            {isSingle ? <Radio checked={checked} /> : <CheckBox checked={checked} />}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function Radio({ checked }: { checked: boolean }) {
    return (
        <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${checked ? 'border-emerald-600' : 'border-zinc-300'}`}
        >
            {checked ? <span className="size-2.5 rounded-full bg-emerald-600" /> : null}
        </span>
    );
}

function CheckBox({ checked }: { checked: boolean }) {
    return (
        <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-[4px] border ${
                checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-zinc-300'
            }`}
        >
            {checked ? <Check className="size-3.5 stroke-[3]" /> : null}
        </span>
    );
}

function VegDot({ isVeg }: { isVeg: boolean }) {
    const border = isVeg ? 'border-emerald-600' : 'border-rose-600';
    const dot = isVeg ? 'bg-emerald-600' : 'bg-rose-600';
    return (
        <span className={`flex size-4 shrink-0 items-center justify-center rounded-[3px] border ${border}`}>
            <span className={`size-1.5 rounded-full ${dot}`} />
        </span>
    );
}
