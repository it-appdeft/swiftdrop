/**
 * Shared modifier-group catalog for the restaurant admin panel.
 *
 * The Modifiers page (resources/js/restaurant/pages/modifiers.tsx) lets the
 * admin manage these groups; the Menu Management "Add item" dialog
 * (resources/js/restaurant/pages/menu.tsx) lets the admin attach groups to a
 * menu item. Both screens read this seed as the in-memory catalog until
 * the backend endpoints land.
 */

export type SelectionType = 'single' | 'multiple';

export interface ModifierOption {
    id: string;
    name: string;
    /**
     * Normally a surcharge added to the base item price, in £ (0 = included).
     * On a price-driver group this is the ABSOLUTE price for the option.
     */
    priceDelta: number;
    /** On a price-driver group, the option whose price prefills the item Price. */
    isDefault?: boolean;
}

export interface ModifierGroup {
    id: string;
    name: string;
    description?: string;
    selectionType: SelectionType;
    /**
     * When true, this group sets the item's base price (variant/size pricing):
     * options carry absolute prices and the default option prefills Price (£).
     * Behaviour is keyed off this flag, never the group name.
     */
    isPriceDriver?: boolean;
    required: boolean;
    minSelections: number;
    /** null = unbounded (only meaningful for multi-select). */
    maxSelections: number | null;
    options: ModifierOption[];
}

export const MODIFIER_GROUP_SEED: ModifierGroup[] = [
    {
        id: 'g1',
        name: 'Size',
        description: 'Pick the portion size.',
        selectionType: 'single',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
            { id: 'o1', name: 'Regular (serves 1, 17 cm)', priceDelta: 0 },
            { id: 'o2', name: 'Medium (serves 2, 25 cm)', priceDelta: 2 },
            { id: 'o3', name: 'Large (serves 4, 33 cm)', priceDelta: 6.5 },
        ],
    },
    {
        id: 'g2',
        name: 'Toppings — Veg',
        description: 'Add any extras you like.',
        selectionType: 'multiple',
        required: false,
        minSelections: 0,
        maxSelections: null,
        options: [
            { id: 'o4', name: 'Paneer', priceDelta: 1 },
            { id: 'o5', name: 'Onions', priceDelta: 2 },
            { id: 'o6', name: 'Olives', priceDelta: 1 },
            { id: 'o7', name: 'Jalapenos', priceDelta: 2 },
            { id: 'o8', name: 'Red Paprika', priceDelta: 1 },
            { id: 'o9', name: 'Pineapples', priceDelta: 2 },
            { id: 'o10', name: 'Sweet Corns', priceDelta: 2 },
        ],
    },
    {
        id: 'g3',
        name: 'Cheese & Dip',
        description: 'Optional cheese boost or dip.',
        selectionType: 'multiple',
        required: false,
        minSelections: 0,
        maxSelections: 3,
        options: [
            { id: 'o11', name: 'Extra Cheese', priceDelta: 1 },
            { id: 'o12', name: 'Cheese Dip', priceDelta: 2 },
            { id: 'o13', name: 'Jalapeno Dip', priceDelta: 1 },
            { id: 'o14', name: 'Hot & Garlic Dip', priceDelta: 2 },
            { id: 'o15', name: 'Peri Peri Dip', priceDelta: 1 },
            { id: 'o16', name: 'Mozzarella', priceDelta: 2 },
        ],
    },
];

export function selectionLabel(g: ModifierGroup): string {
    if (g.selectionType === 'single') return 'Pick one';
    if (g.maxSelections === null) return 'Pick any';
    return `Pick up to ${g.maxSelections}`;
}
