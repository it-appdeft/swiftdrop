import { Head, router } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    Copy,
    Download,
    EyeOff,
    Filter,
    FolderInput,
    ImageIcon,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Trash2,
    Upload,
    UploadCloud,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type ModifierGroup, selectionLabel } from '../../data/modifier-groups';
import AppLayout from '../../layouts/app-layout';

// ─── Types & mock data ────────────────────────────────────────────────────

type Diet = 'veg' | 'non_veg';

interface Category {
    id: string;
    name: string;
    /** Unfiltered item count for the sidebar badge. */
    count?: number;
}

interface MenuItem {
    id: string;
    name: string;
    // Null = dish belongs to no category (server allows it after a
    // category gets deleted via ON DELETE SET NULL on the FK).
    categoryId: string | null;
    price: number;
    diet: Diet;
    sold: number;
    available: boolean;
    image: string;
    description?: string;
    prepMin?: number;
    /** Modifier groups attached to this item (Size / Toppings / Dips, …). */
    modifierGroupIds?: string[];
    /** Per-group option subset offered for this item: group id → option ids. */
    modifierOptionIds?: Record<string, string[]>;
}

const FOOD_IMG = {
    biryani: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&h=400&fit=crop',
    paneer: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop',
    naan: 'https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?w=600&h=400&fit=crop',
    thali: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop',
    gulab: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop',
    mutton: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&h=400&fit=crop',
    coke: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=400&fit=crop',
    tikka: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop',
};

type DietFilter = 'all' | Diet;

// ─── Helpers ──────────────────────────────────────────────────────────────

function inr(n: number): string {
    return '₹ ' + n.toLocaleString('en-IN');
}

function VegDot({ diet }: { diet: Diet }) {
    const veg = diet === 'veg';
    return (
        <span
            className={
                'inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm border ' +
                (veg ? 'border-emerald-600' : 'border-rose-600')
            }
        >
            <span
                className={
                    'block size-1.5 rounded-full ' + (veg ? 'bg-emerald-600' : 'bg-rose-600')
                }
            />
        </span>
    );
}

function ToggleSwitch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <span
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition ' +
                (checked ? 'bg-primary' : 'bg-muted')
            }
        >
            <span
                className={
                    'inline-block size-5 rounded-full bg-background shadow transition ' +
                    (checked ? 'translate-x-5' : 'translate-x-0.5')
                }
            />
        </span>
    );
}

// ─── Category sidebar ─────────────────────────────────────────────────────

function CategorySidebar({
    categories,
    counts,
    activeCategory,
    onSelect,
    onAddCategory,
    totalCount,
}: {
    categories: Category[];
    counts: Record<string, number>;
    activeCategory: 'all' | string;
    onSelect: (id: 'all' | string) => void;
    onAddCategory: (name: string) => void;
    totalCount: number;
}) {
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState('');

    const commit = () => {
        const name = draft.trim();
        if (!name) {
            setAdding(false);
            return;
        }
        onAddCategory(name);
        setDraft('');
        setAdding(false);
    };

    return (
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Categories
                </p>
                <ul className="mt-3 space-y-1">
                    <li>
                        <button
                            type="button"
                            onClick={() => onSelect('all')}
                            className={
                                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ' +
                                (activeCategory === 'all'
                                    ? 'bg-primary/10 font-semibold text-primary'
                                    : 'text-foreground hover:bg-muted')
                            }
                        >
                            <span>All</span>
                            <span className="text-xs text-muted-foreground">{totalCount}</span>
                        </button>
                    </li>
                    {categories.map((c) => {
                        const isActive = activeCategory === c.id;
                        return (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(c.id)}
                                    className={
                                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ' +
                                        (isActive
                                            ? 'bg-primary/10 font-semibold text-primary'
                                            : 'text-foreground hover:bg-muted')
                                    }
                                >
                                    <span>{c.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {counts[c.id] ?? 0}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {adding ? (
                    <div className="mt-3 space-y-2">
                        <input
                            type="text"
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commit();
                                if (e.key === 'Escape') {
                                    setDraft('');
                                    setAdding(false);
                                }
                            }}
                            placeholder="Category name"
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={commit}
                                disabled={!draft.trim()}
                                className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDraft('');
                                    setAdding(false);
                                }}
                                className="inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
                    >
                        <Plus className="size-3.5" />
                        New category
                    </button>
                )}
            </div>

            {/* <div className="rounded-2xl bg-zinc-900 p-4 text-white">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    <Sparkles className="size-3.5" />
                    Combo builder
                </p>
                <p className="mt-2 text-sm font-bold">Bundle items to boost AOV</p>
                <button
                    type="button"
                    className="mt-3 inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                    <Plus className="size-3.5" />
                    Create combo
                </button>
            </div> */}
        </aside>
    );
}

// ─── Menu item card ───────────────────────────────────────────────────────

function MenuItemCard({
    item,
    categoryLabel,
    modifierGroupsById,
    onToggle,
    onEdit,
    onDuplicate,
    onMoveCategory,
    onDelete,
}: {
    item: MenuItem;
    categoryLabel: string;
    modifierGroupsById: Record<string, ModifierGroup>;
    onToggle: (v: boolean) => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onMoveCategory: () => void;
    onDelete: () => void;
}) {
    const attachedGroups = (item.modifierGroupIds ?? [])
        .map((id) => modifierGroupsById[id])
        .filter((g): g is ModifierGroup => Boolean(g));

    const [menuOpen, setMenuOpen] = useState(false);
    const menuWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const onDocClick = (e: MouseEvent) => {
            if (!menuWrapperRef.current?.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [menuOpen]);

    const closeAnd = (fn: () => void) => () => {
        setMenuOpen(false);
        fn();
    };

    return (
        <article className="relative rounded-2xl border border-border bg-background">
            <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-muted">
                <img
                    src={item.image}
                    alt=""
                    className={
                        'h-full w-full object-cover transition ' +
                        (item.available ? '' : 'opacity-30')
                    }
                />
                {!item.available && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="rounded-full bg-background px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-foreground">
                            Unavailable
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <VegDot diet={item.diet} />
                            <h3 className="truncate text-sm font-bold">{item.name}</h3>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {categoryLabel} · {item.sold} sold
                        </p>
                    </div>
                    <div ref={menuWrapperRef} className="relative">
                        <button
                            type="button"
                            aria-label="More actions"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((v) => !v)}
                            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <MoreHorizontal className="size-4" />
                        </button>
                        {menuOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 top-[calc(100%+4px)] z-20 w-52 overflow-hidden rounded-lg border border-border bg-background shadow-lg"
                            >
                                <div className="border-b border-border px-3 py-2 text-xs font-semibold text-foreground">
                                    {item.name}
                                </div>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={closeAnd(onEdit)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
                                >
                                    <Pencil className="size-4 text-muted-foreground" />
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={closeAnd(onDuplicate)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
                                >
                                    <Copy className="size-4 text-muted-foreground" />
                                    Duplicate
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={closeAnd(() => onToggle(!item.available))}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
                                >
                                    <EyeOff className="size-4 text-muted-foreground" />
                                    {item.available ? 'Mark unavailable' : 'Mark available'}
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={closeAnd(onMoveCategory)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
                                >
                                    <FolderInput className="size-4 text-muted-foreground" />
                                    Move to category
                                </button>
                                <div className="border-t border-border">
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={closeAnd(onDelete)}
                                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {attachedGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {attachedGroups.map((g) => (
                            <span
                                key={g.id}
                                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                                title={`${g.options.length} option${g.options.length === 1 ? '' : 's'}`}
                            >
                                {g.name}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-base font-bold tabular-nums">{inr(item.price)}</span>
                    <div className="flex items-center gap-2 text-xs">
                        <span
                            className={
                                item.available ? 'text-emerald-600' : 'text-muted-foreground'
                            }
                        >
                            {item.available ? 'Available' : "86'd"}
                        </span>
                        <ToggleSwitch checked={item.available} onChange={onToggle} />
                    </div>
                </div>
            </div>
        </article>
    );
}

// ─── Add item dialog ──────────────────────────────────────────────────────

function AddItemDialog({
    open,
    onClose,
    categories,
    modifierGroups,
    editing,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    categories: Category[];
    modifierGroups: ModifierGroup[];
    /** When set, the dialog opens in edit mode pre-filled from this item. */
    editing?: MenuItem | null;
    onSubmit: (
        item: Omit<MenuItem, 'id' | 'sold' | 'image'> & {
            image?: string;
            imageFile?: File | null;
        },
    ) => void;
}) {
    const isEdit = !!editing;
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
    const [price, setPrice] = useState('');
    const [diet, setDiet] = useState<Diet>('veg');
    const [prepMin, setPrepMin] = useState('20');
    const [description, setDescription] = useState('');
    const [available, setAvailable] = useState(true);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    // The actual file to upload (null = keep existing / none).
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [modifierGroupIds, setModifierGroupIds] = useState<string[]>([]);
    // Per-group option subset: group id → option ids this item offers.
    // Defaults to "all options" the moment a group is checked.
    const [optionsByGroup, setOptionsByGroup] = useState<Record<string, string[]>>({});

    // Pre-fill (edit) or clear (add) the form whenever the dialog opens.
    useEffect(() => {
        if (!open) return;
        if (editing) {
            const groupIds = editing.modifierGroupIds ?? [];
            setName(editing.name);
            setCategoryId(editing.categoryId ?? categories[0]?.id ?? '');
            setPrice(String(editing.price));
            setDiet(editing.diet);
            setPrepMin(editing.prepMin != null ? String(editing.prepMin) : '');
            setDescription(editing.description ?? '');
            setAvailable(editing.available);
            setPhotoPreview(editing.image ?? null);
            setPhotoFile(null);
            setModifierGroupIds(groupIds);
            // Per-option subsets aren't persisted server-side yet, so default
            // each attached group to "all options offered".
            setOptionsByGroup(
                editing.modifierOptionIds ??
                    Object.fromEntries(
                        groupIds.map((gid) => [
                            gid,
                            (modifierGroups.find((g) => g.id === gid)?.options ?? []).map(
                                (o) => o.id,
                            ),
                        ]),
                    ),
            );
        } else {
            setName('');
            setCategoryId(categories[0]?.id ?? '');
            setPrice('');
            setDiet('veg');
            setPrepMin('20');
            setDescription('');
            setAvailable(true);
            setPhotoPreview(null);
            setPhotoFile(null);
            setModifierGroupIds([]);
            setOptionsByGroup({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing]);

    const toggleGroup = (group: ModifierGroup) => {
        setModifierGroupIds((prev) => {
            if (prev.includes(group.id)) {
                setOptionsByGroup((o) => {
                    const next = { ...o };
                    delete next[group.id];
                    return next;
                });
                return prev.filter((x) => x !== group.id);
            }
            // Newly checked → a "pick one" group offers a single option
            // (radio) so default to the first; "pick multiple" offers all.
            setOptionsByGroup((o) => ({
                ...o,
                [group.id]:
                    group.selectionType === 'single'
                        ? group.options.slice(0, 1).map((opt) => opt.id)
                        : group.options.map((opt) => opt.id),
            }));
            return [...prev, group.id];
        });
    };

    const toggleOption = (group: ModifierGroup, optionId: string) => {
        setOptionsByGroup((prev) => {
            // Pick-one groups behave like a radio: selecting an option
            // replaces the previous choice. Pick-multiple toggles like a
            // checkbox.
            if (group.selectionType === 'single') {
                return { ...prev, [group.id]: [optionId] };
            }
            const current = prev[group.id] ?? [];
            const next = current.includes(optionId)
                ? current.filter((x) => x !== optionId)
                : [...current, optionId];
            return { ...prev, [group.id]: next };
        });
    };

    const reset = () => {
        setName('');
        setCategoryId(categories[0]?.id ?? '');
        setPrice('');
        setDiet('veg');
        setPrepMin('20');
        setDescription('');
        setAvailable(true);
        setPhotoPreview(null);
        setPhotoFile(null);
        setModifierGroupIds([]);
        setOptionsByGroup({});
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !price) return;
        onSubmit({
            name: name.trim(),
            categoryId,
            price: Number(price),
            diet,
            available,
            description: description.trim() || undefined,
            prepMin: prepMin ? Number(prepMin) : undefined,
            image: photoPreview ?? FOOD_IMG.tikka,
            imageFile: photoFile,
            modifierGroupIds,
            modifierOptionIds: optionsByGroup,
        });
        handleClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10">
            <div className="relative w-full max-w-xl rounded-2xl border border-border bg-background shadow-xl">
                <header className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">
                            {isEdit ? 'Edit menu item' : 'Add menu item'}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Item details, pricing, and availability.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                    >
                        <X className="size-4" />
                    </button>
                </header>

                <form onSubmit={submit} className="space-y-4 px-6 py-5">
                    <div className="flex items-start gap-4">
                        <label className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-input bg-muted/40 hover:border-primary">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt=""
                                    className="size-full object-cover"
                                />
                            ) : (
                                <ImageIcon className="size-6 text-muted-foreground" />
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="sr-only"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        setPhotoFile(f);
                                        setPhotoPreview(URL.createObjectURL(f));
                                    }
                                }}
                            />
                        </label>
                        <div className="space-y-2">
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="size-3.5" />
                                Upload photo
                            </button>
                            <p className="text-[11px] text-muted-foreground">
                                PNG/JPG, square, up to 2MB
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            Item name
                            <span className="ml-0.5 text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Paneer Tikka"
                            required
                            aria-required="true"
                            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Category</label>
                            <div className="relative">
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="h-11 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-9 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Price (₹)
                                <span className="ml-0.5 text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="220"
                                required
                                aria-required="true"
                                min="0"
                                step="0.01"
                                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Diet</label>
                            <div className="flex gap-4 pt-2 text-sm">
                                {(['veg', 'non_veg'] as Diet[]).map((d) => (
                                    <label key={d} className="inline-flex items-center gap-2">
                                        <input
                                            type="radio"
                                            checked={diet === d}
                                            onChange={() => setDiet(d)}
                                            className="size-4 accent-primary"
                                        />
                                        {d === 'veg' ? 'Veg' : 'Non-veg'}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Prep time</label>
                            <input
                                type="number"
                                value={prepMin}
                                onChange={(e) => setPrepMin(e.target.value)}
                                placeholder="20 min"
                                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Spiced cottage cheese cubes, char-grilled in the tandoor."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Modifier groups</label>
                            <a
                                href={route('restaurant.modifiers')}
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                Manage groups
                            </a>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pick the size / topping / dip groups customers can choose from for
                            this item.
                        </p>
                        {modifierGroups.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-input bg-muted/30 px-3 py-4 text-xs text-muted-foreground">
                                No modifier groups defined yet — create them in the Modifiers
                                module.
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {modifierGroups.map((g) => {
                                    const isSelected = modifierGroupIds.includes(g.id);
                                    const chosenOptions = optionsByGroup[g.id] ?? [];
                                    return (
                                        <li
                                            key={g.id}
                                            className={
                                                'overflow-hidden rounded-lg border transition ' +
                                                (isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-input')
                                            }
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(g)}
                                                aria-pressed={isSelected}
                                                className="flex w-full items-start gap-3 p-3 text-left hover:bg-primary/5"
                                            >
                                                <span
                                                    className={
                                                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ' +
                                                        (isSelected
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-input bg-background')
                                                    }
                                                >
                                                    {isSelected && <Check className="size-3" />}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-semibold">
                                                            {g.name}
                                                        </span>
                                                        {g.required && (
                                                            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-700">
                                                                Required
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                        {isSelected
                                                            ? `${chosenOptions.length} of ${g.options.length} offered · ${selectionLabel(g)}`
                                                            : `${g.options.length} option${g.options.length === 1 ? '' : 's'} · ${selectionLabel(g)}`}
                                                    </span>
                                                </span>
                                            </button>

                                            {isSelected && (
                                                <div className="border-t border-primary/20 bg-background/60 px-3 py-2.5">
                                                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                        Offer these options ·{' '}
                                                        {g.selectionType === 'single'
                                                            ? 'customer picks one'
                                                            : 'customer picks any'}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {g.options.map((opt) => {
                                                            const checked =
                                                                chosenOptions.includes(opt.id);
                                                            const isSingle =
                                                                g.selectionType === 'single';
                                                            return (
                                                                <button
                                                                    key={opt.id}
                                                                    type="button"
                                                                    role={
                                                                        isSingle
                                                                            ? 'radio'
                                                                            : 'checkbox'
                                                                    }
                                                                    aria-checked={checked}
                                                                    onClick={() =>
                                                                        toggleOption(g, opt.id)
                                                                    }
                                                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                                                                >
                                                                    <span
                                                                        aria-hidden
                                                                        className={
                                                                            'flex size-4 shrink-0 items-center justify-center border ' +
                                                                            (isSingle
                                                                                ? 'rounded-full '
                                                                                : 'rounded ') +
                                                                            (checked
                                                                                ? isSingle
                                                                                    ? 'border-primary bg-background'
                                                                                    : 'border-primary bg-primary text-primary-foreground'
                                                                                : 'border-input bg-background')
                                                                        }
                                                                    >
                                                                        {checked &&
                                                                            (isSingle ? (
                                                                                <span className="size-2 rounded-full bg-primary" />
                                                                            ) : (
                                                                                <Check className="size-2.5" />
                                                                            ))}
                                                                    </span>
                                                                    <span className="flex-1">
                                                                        {opt.name}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {opt.priceDelta === 0
                                                                            ? 'Included'
                                                                            : `+${inr(opt.priceDelta)}`}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background p-4">
                        <div>
                            <p className="text-sm font-semibold">Available right now</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Turn off to "86" without removing the item.
                            </p>
                        </div>
                        <ToggleSwitch checked={available} onChange={setAvailable} />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || !price}
                            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            {isEdit ? 'Save changes' : 'Add item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Bulk upload dialog ───────────────────────────────────────────────────

function BulkUploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [file, setFile] = useState<File | null>(null);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10">
            <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl">
                <header className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Bulk upload menu</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Upload a CSV/XLSX to add or update many items at once.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                    >
                        <X className="size-4" />
                    </button>
                </header>

                <div className="space-y-4 px-6 py-5">
                    <a
                        href="#"
                        className="flex items-center justify-between rounded-xl border border-border bg-background p-4 hover:border-primary"
                    >
                        <div>
                            <p className="text-sm font-semibold">Download CSV template</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Columns: name, category, price, veg, description
                            </p>
                        </div>
                        <Download className="size-4 text-muted-foreground" />
                    </a>

                    <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-input bg-muted/30 py-10 text-center hover:border-primary">
                        <UploadCloud className="size-6 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">
                            {file ? file.name : 'Drop your file here, or'}{' '}
                            <span className="text-primary">Browse</span>
                        </p>
                        <input
                            type="file"
                            accept=".csv,.xlsx"
                            className="sr-only"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!file}
                            onClick={onClose}
                            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Move to category dialog ──────────────────────────────────────────────

function MoveCategoryDialog({
    open,
    item,
    categories,
    onClose,
    onMove,
}: {
    open: boolean;
    item: MenuItem | null;
    categories: Category[];
    onClose: () => void;
    onMove: (categoryId: string | null) => void;
}) {
    const [categoryId, setCategoryId] = useState<string>('');

    useEffect(() => {
        if (open && item) setCategoryId(item.categoryId ?? '');
    }, [open, item]);

    if (!open || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-base font-bold">Move to category</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">{item.name}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="mt-4 space-y-1.5">
                    <label className="text-sm font-medium">Category</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="">Uncategorised</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove(categoryId || null)}
                        className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        Move
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Filter popover ────────────────────────────────────────────────────────

interface MenuFilters {
    priceMin: string;
    priceMax: string;
    /** Group ids whose checkbox is on. */
    groupIds: string[];
    /** Per-group selected option ids — selecting any marks the group active. */
    optionIds: Record<string, string[]>;
}

const EMPTY_FILTERS: MenuFilters = {
    priceMin: '',
    priceMax: '',
    groupIds: [],
    optionIds: {},
};

/** Groups considered "active" — directly checked or with ≥1 option chosen. */
function activeGroupSet(filters: MenuFilters): Set<string> {
    const set = new Set(filters.groupIds);
    for (const [gid, opts] of Object.entries(filters.optionIds)) {
        if (opts.length) set.add(gid);
    }
    return set;
}

function countActiveFilters(filters: MenuFilters): number {
    return (
        (filters.priceMin !== '' || filters.priceMax !== '' ? 1 : 0) +
        activeGroupSet(filters).size
    );
}

function FilterPanel({
    modifierGroups,
    filters,
    onChange,
    onReset,
    onClose,
}: {
    modifierGroups: ModifierGroup[];
    filters: MenuFilters;
    onChange: (next: MenuFilters) => void;
    onReset: () => void;
    onClose: () => void;
}) {
    const [expanded, setExpanded] = useState<string | null>(null);

    const toggleGroup = (id: string) => {
        const on = filters.groupIds.includes(id);
        onChange({
            ...filters,
            groupIds: on
                ? filters.groupIds.filter((x) => x !== id)
                : [...filters.groupIds, id],
        });
    };

    const toggleOption = (groupId: string, optionId: string) => {
        const current = filters.optionIds[groupId] ?? [];
        const next = current.includes(optionId)
            ? current.filter((x) => x !== optionId)
            : [...current, optionId];
        onChange({
            ...filters,
            optionIds: { ...filters.optionIds, [groupId]: next },
        });
    };

    return (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-bold">Filters</p>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close filters"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4 py-4">
                {/* Price range */}
                <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Price range (₹)
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={0}
                            value={filters.priceMin}
                            onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
                            placeholder="Min"
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                            type="number"
                            min={0}
                            value={filters.priceMax}
                            onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
                            placeholder="Max"
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>

                {/* Modifier groups + options */}
                <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Modifier groups
                    </p>
                    {modifierGroups.length === 0 ? (
                        <p className="rounded-md border border-dashed border-input bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                            No modifier groups defined yet.
                        </p>
                    ) : (
                        <ul className="space-y-1.5">
                            {modifierGroups.map((g) => {
                                const groupOn = filters.groupIds.includes(g.id);
                                const chosen = filters.optionIds[g.id] ?? [];
                                const isOpen = expanded === g.id;
                                return (
                                    <li
                                        key={g.id}
                                        className="overflow-hidden rounded-lg border border-border"
                                    >
                                        <div className="flex items-center gap-2 px-2.5 py-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(g.id)}
                                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                            >
                                                <span
                                                    className={
                                                        'flex size-4 shrink-0 items-center justify-center rounded border ' +
                                                        (groupOn
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-input bg-background')
                                                    }
                                                >
                                                    {groupOn && <Check className="size-2.5" />}
                                                </span>
                                                <span className="truncate text-sm font-medium">
                                                    {g.name}
                                                </span>
                                                {chosen.length > 0 && (
                                                    <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
                                                        {chosen.length}
                                                    </span>
                                                )}
                                            </button>
                                            {g.options.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpanded(isOpen ? null : g.id)
                                                    }
                                                    aria-label="Toggle options"
                                                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                                                >
                                                    <ChevronDown
                                                        className={
                                                            'size-4 transition ' +
                                                            (isOpen ? 'rotate-180' : '')
                                                        }
                                                    />
                                                </button>
                                            )}
                                        </div>
                                        {isOpen && g.options.length > 0 && (
                                            <div className="border-t border-border bg-muted/20 px-2.5 py-1.5">
                                                {g.options.map((opt) => {
                                                    const checked = chosen.includes(opt.id);
                                                    return (
                                                        <label
                                                            key={opt.id}
                                                            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted"
                                                        >
                                                            <span
                                                                role="checkbox"
                                                                aria-checked={checked}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    toggleOption(g.id, opt.id);
                                                                }}
                                                                className={
                                                                    'flex size-4 shrink-0 items-center justify-center rounded border ' +
                                                                    (checked
                                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                                        : 'border-input bg-background')
                                                                }
                                                            >
                                                                {checked && (
                                                                    <Check className="size-2.5" />
                                                                )}
                                                            </span>
                                                            <span className="flex-1 truncate">
                                                                {opt.name}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <button
                    type="button"
                    onClick={onReset}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                    Reset
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                    Done
                </button>
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────

interface ServerFilters {
    search?: string;
    category?: string;
    diet?: string;
    price_min?: string | number | null;
    price_max?: string | number | null;
    group_ids?: Array<string | number>;
}

interface MenuPageProps {
    /** Server-rendered category list (per-restaurant) with unfiltered counts. */
    categories: Category[];
    /** Server-filtered dish catalogue with modifier-group attachments. */
    items: MenuItem[];
    /** Server-rendered modifier-group catalogue (Size, Toppings, Dip…). */
    modifierGroups: ModifierGroup[];
    /** Unfiltered total item count for the "All" sidebar row. */
    itemsTotal?: number;
    /** Active filters echoed back so the controls reflect the URL. */
    filters?: ServerFilters;
    /** Server pagination meta for the current page of items. */
    pagination?: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
        from: number | null;
        to: number | null;
    } | null;
}

export default function Menu({
    categories = [],
    items: serverItems = [],
    modifierGroups = [],
    itemsTotal = 0,
    filters: initialFilters = {},
    pagination = null,
}: MenuPageProps) {
    const [items, setItems] = useState<MenuItem[]>(serverItems);
    const [activeCategory, setActiveCategory] = useState<'all' | string>(
        initialFilters.category || 'all',
    );
    const [search, setSearch] = useState(initialFilters.search ?? '');
    const [dietFilter, setDietFilter] = useState<DietFilter>(
        (initialFilters.diet as DietFilter) || 'all',
    );
    const [filters, setFilters] = useState<MenuFilters>({
        priceMin:
            initialFilters.price_min != null ? String(initialFilters.price_min) : '',
        priceMax:
            initialFilters.price_max != null ? String(initialFilters.price_max) : '',
        groupIds: (initialFilters.group_ids ?? []).map(String),
        optionIds: {},
    });
    const [filterOpen, setFilterOpen] = useState(false);
    const filterWrapRef = useRef<HTMLDivElement>(null);
    const didMountRef = useRef(false);
    const [addOpen, setAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [movingItem, setMovingItem] = useState<MenuItem | null>(null);
    const [bulkOpen, setBulkOpen] = useState(false);

    // Re-sync after every Inertia visit (POST / PUT / DELETE round-trip)
    // so freshly-saved rows replace the optimistic placeholders we
    // rendered while waiting for the server response.
    useEffect(() => {
        setItems(serverItems);
    }, [serverItems]);

    // Lock body scroll while any dialog is open.
    useEffect(() => {
        if (!addOpen && !bulkOpen && !movingItem) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [addOpen, bulkOpen, movingItem]);

    // Sidebar counts come from the server (unfiltered totals).
    const counts = useMemo(() => {
        const out: Record<string, number> = {};
        for (const c of categories) out[c.id] = c.count ?? 0;
        return out;
    }, [categories]);

    // Close the filter popover on outside click.
    useEffect(() => {
        if (!filterOpen) return;
        const onDocClick = (e: MouseEvent) => {
            if (!filterWrapRef.current?.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [filterOpen]);

    const activeFilterCount = countActiveFilters(filters);

    // Current filter state → query params (omits `page`; a filter change
    // always lands the user back on page 1).
    const buildQuery = (): Record<string, unknown> => {
        const groups = [...activeGroupSet(filters)];
        const query: Record<string, unknown> = {};
        if (search.trim()) query.search = search.trim();
        if (activeCategory !== 'all') query.category = activeCategory;
        if (dietFilter !== 'all') query.diet = dietFilter;
        if (filters.priceMin !== '') query.price_min = filters.priceMin;
        if (filters.priceMax !== '') query.price_max = filters.priceMax;
        if (groups.length) query.group_ids = groups;
        return query;
    };

    // Push filter changes to the server (the MenuItem::filter scope does the
    // work). Debounced so typing in search / price doesn't fire per keystroke.
    // Skips the initial render so the first visit doesn't double-request.
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
        const t = setTimeout(() => {
            router.get(route('restaurant.menu'), buildQuery() as never, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, activeCategory, dietFilter, filters]);

    const goToPage = (page: number) => {
        router.get(
            route('restaurant.menu'),
            { ...buildQuery(), page } as never,
            { preserveState: true, preserveScroll: true },
        );
    };

    // Items arrive already filtered from the server.
    const filtered = items;

    const categoryLabel = (id: string | null) =>
        (id && categories.find((c) => c.id === id)?.name) ?? 'Uncategorised';

    // ── Mutations ──────────────────────────────────────────────────────
    // Each handler does an optimistic local update so the UI feels
    // instant, then fires the matching Inertia visit so the change
    // persists. `preserveState: false` on writes makes the controller
    // re-send the canonical `items` prop, which our useEffect above
    // copies into local state — replacing optimistic ids with real ones.

    const toggleAvailable = (id: string, v: boolean) => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, available: v } : i)));
        if (!/^\d+$/.test(id)) return; // optimistic-only row
        router.patch(
            route('restaurant.menu.items.availability', { item: id }),
            { is_available: v },
            { preserveScroll: true, preserveState: true },
        );
    };

    const editItem = (id: string) => {
        const item = items.find((i) => i.id === id);
        if (!item) return;
        setEditingItem(item);
        setAddOpen(true);
    };

    const closeDialog = () => {
        setAddOpen(false);
        setEditingItem(null);
    };

    const duplicateItem = (id: string) => {
        const source = items.find((i) => i.id === id);
        if (!source) return;
        router.post(
            route('restaurant.menu.items.store'),
            {
                name: `${source.name} (copy)`,
                category_id: source.categoryId,
                price: source.price,
                is_available: source.available,
                is_veg: source.diet === 'veg',
                description: source.description ?? null,
                modifier_group_ids: source.modifierGroupIds ?? [],
            },
            { preserveScroll: true, preserveState: false },
        );
    };

    const moveItem = (id: string) => {
        const item = items.find((i) => i.id === id);
        if (item) setMovingItem(item);
    };

    const confirmMove = (categoryId: string | null) => {
        const item = movingItem;
        setMovingItem(null);
        if (!item || !/^\d+$/.test(item.id)) return;

        // updateItem validates the full item, so send its current fields
        // alongside the new category.
        router.put(
            route('restaurant.menu.items.update', { item: item.id }),
            {
                name: item.name,
                category_id: categoryId,
                price: item.price,
                is_available: item.available,
                is_veg: item.diet === 'veg',
                description: item.description ?? null,
                modifier_group_ids: item.modifierGroupIds ?? [],
            },
            { preserveScroll: true, preserveState: false },
        );
    };

    const addCategory = (name: string) => {
        router.post(
            route('restaurant.menu.categories.store'),
            { name },
            { preserveScroll: true, preserveState: false },
        );
    };

    const deleteItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
        if (!/^\d+$/.test(id)) return;
        router.delete(route('restaurant.menu.items.destroy', { item: id }), {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const submitItem = (
        data: Omit<MenuItem, 'id' | 'sold' | 'image'> & {
            image?: string;
            imageFile?: File | null;
        },
    ) => {
        const payload: Record<string, unknown> = {
            name: data.name,
            category_id: data.categoryId || null,
            price: data.price,
            is_available: data.available,
            is_veg: data.diet === 'veg',
            description: data.description ?? null,
            prep_time: data.prepMin ?? null,
            modifier_group_ids: data.modifierGroupIds ?? [],
        };

        // When a file is present Inertia auto-switches to multipart FormData;
        // forceFormData guarantees it even for the no-file case so booleans
        // serialise consistently.
        if (data.imageFile) {
            payload.image = data.imageFile;
        }

        const opts = {
            preserveScroll: true,
            preserveState: false,
            forceFormData: !!data.imageFile,
        } as const;

        if (editingItem && /^\d+$/.test(editingItem.id)) {
            // FormData can't do a real PUT — Inertia spoofs it via _method
            // when we POST with files, so route through POST + _method here.
            if (data.imageFile) {
                router.post(
                    route('restaurant.menu.items.update', { item: editingItem.id }),
                    { ...payload, _method: 'put' } as never,
                    opts,
                );
            } else {
                router.put(
                    route('restaurant.menu.items.update', { item: editingItem.id }),
                    payload as never,
                    opts,
                );
            }
        } else {
            router.post(route('restaurant.menu.items.store'), payload as never, opts);
        }
    };

    const modifierGroupsById = useMemo(
        () =>
            Object.fromEntries(modifierGroups.map((g) => [g.id, g])) as Record<
                string,
                ModifierGroup
            >,
        [modifierGroups],
    );

    return (
        <AppLayout active="menu">
            <Head title="Menu management — Swift Drop Partner" />

            <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Menu management
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Categorize, price and control availability for every dish.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* <button
                            type="button"
                            onClick={() => setBulkOpen(true)}
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-semibold hover:border-primary"
                        >
                            <Upload className="size-4" />
                            Bulk upload
                        </button> */}
                        <button
                            type="button"
                            onClick={() => {
                                setEditingItem(null);
                                setAddOpen(true);
                            }}
                            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                        >
                            <Plus className="size-4" />
                            Add item
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row">
                    <CategorySidebar
                        categories={categories}
                        counts={counts}
                        activeCategory={activeCategory}
                        onSelect={setActiveCategory}
                        onAddCategory={addCategory}
                        totalCount={itemsTotal}
                    />

                    <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search menu items..."
                                    className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-background p-1">
                                {(
                                    [
                                        { k: 'all' as DietFilter, label: 'All' },
                                        { k: 'veg' as DietFilter, label: 'Veg' },
                                        { k: 'non_veg' as DietFilter, label: 'Non-veg' },
                                    ]
                                ).map((opt) => {
                                    const isActive = dietFilter === opt.k;
                                    return (
                                        <button
                                            key={opt.k}
                                            type="button"
                                            onClick={() => setDietFilter(opt.k)}
                                            className={
                                                'rounded-full px-3 py-1 text-xs font-semibold transition ' +
                                                (isActive
                                                    ? 'bg-foreground text-background'
                                                    : 'text-muted-foreground hover:text-foreground')
                                            }
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div ref={filterWrapRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setFilterOpen((v) => !v)}
                                    aria-expanded={filterOpen}
                                    className={
                                        'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition ' +
                                        (activeFilterCount > 0
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-input bg-background hover:border-primary')
                                    }
                                >
                                    <Filter className="size-4" />
                                    Filter
                                    {activeFilterCount > 0 && (
                                        <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                                {filterOpen && (
                                    <FilterPanel
                                        modifierGroups={modifierGroups}
                                        filters={filters}
                                        onChange={setFilters}
                                        onReset={() => setFilters(EMPTY_FILTERS)}
                                        onClose={() => setFilterOpen(false)}
                                    />
                                )}
                            </div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-input bg-background px-6 py-16 text-center text-sm text-muted-foreground">
                                No menu items match this filter.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {filtered.map((item) => (
                                    <MenuItemCard
                                        key={item.id}
                                        item={item}
                                        categoryLabel={categoryLabel(item.categoryId)}
                                        modifierGroupsById={modifierGroupsById}
                                        onToggle={(v) => toggleAvailable(item.id, v)}
                                        onEdit={() => editItem(item.id)}
                                        onDuplicate={() => duplicateItem(item.id)}
                                        onMoveCategory={() => moveItem(item.id)}
                                        onDelete={() => deleteItem(item.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {pagination && pagination.lastPage > 1 && (
                            <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
                                <p className="text-xs text-muted-foreground">
                                    Showing {pagination.from ?? 0}–{pagination.to ?? 0} of{' '}
                                    {pagination.total}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => goToPage(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage <= 1}
                                        className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-semibold hover:border-primary disabled:opacity-40 disabled:hover:border-input"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
                                        .filter(
                                            (p) =>
                                                p === 1 ||
                                                p === pagination.lastPage ||
                                                Math.abs(p - pagination.currentPage) <= 1,
                                        )
                                        .map((p, idx, arr) => {
                                            const prev = arr[idx - 1];
                                            const gap = prev && p - prev > 1;
                                            return (
                                                <span key={p} className="flex items-center">
                                                    {gap && (
                                                        <span className="px-1 text-xs text-muted-foreground">
                                                            …
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => goToPage(p)}
                                                        className={
                                                            'inline-flex size-9 items-center justify-center rounded-md border text-sm font-semibold transition ' +
                                                            (p === pagination.currentPage
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-input bg-background hover:border-primary')
                                                        }
                                                    >
                                                        {p}
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    <button
                                        type="button"
                                        onClick={() => goToPage(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage >= pagination.lastPage}
                                        className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-semibold hover:border-primary disabled:opacity-40 disabled:hover:border-input"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddItemDialog
                open={addOpen}
                onClose={closeDialog}
                categories={categories}
                modifierGroups={modifierGroups}
                editing={editingItem}
                onSubmit={submitItem}
            />
            <BulkUploadDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
            <MoveCategoryDialog
                open={!!movingItem}
                item={movingItem}
                categories={categories}
                onClose={() => setMovingItem(null)}
                onMove={confirmMove}
            />
        </AppLayout>
    );
}
