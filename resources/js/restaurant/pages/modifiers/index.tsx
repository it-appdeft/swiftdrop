import { Head, router } from '@inertiajs/react';
import {
    Check,
    GripVertical,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    type ModifierGroup,
    type ModifierOption,
    type SelectionType,
    selectionLabel,
} from '../../data/modifier-groups';
import AppLayout from '../../layouts/app-layout';

// ─── Helpers ──────────────────────────────────────────────────────────────

function nextId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Merge the server's canonical groups back into local state after a save.
 *
 * We adopt the server-assigned numeric option ids (so the next save
 * match-updates the row instead of inserting a duplicate) but otherwise
 * keep the user's current field values. Blindly replacing local state with
 * the server response would clobber text the user is still typing — and
 * because Laravel's TrimStrings middleware strips the trailing space they
 * just hit, the round-trip would drop word breaks ("Select the" → "Selectthe").
 */
function reconcileGroups(
    local: ModifierGroup[],
    server: ModifierGroup[],
): ModifierGroup[] {
    const isServerId = (id: string) => /^\d+$/.test(id);

    const merged = server.map((sg) => {
        const lg = local.find((g) => g.id === sg.id);
        if (!lg) return sg; // group only the server knows about — take as-is

        // Saved options already carry their numeric id and were matched by it
        // server-side. The freshly-created ids are the server options whose id
        // we don't already hold locally — hand those, in order, to the named
        // new (client-id) options that were just sent. Blank rows aren't sent,
        // so they keep their client id until they're named.
        const heldIds = new Set(lg.options.filter((o) => isServerId(o.id)).map((o) => o.id));
        const freshIds = sg.options.map((o) => o.id).filter((id) => !heldIds.has(id));
        let f = 0;

        return {
            ...lg,
            options: lg.options.map((lo) => {
                if (isServerId(lo.id) || !lo.name.trim()) return lo;
                const id = freshIds[f++];
                return id ? { ...lo, id } : lo;
            }),
        };
    });

    // Preserve optimistic, not-yet-persisted local groups (client ids).
    const serverIds = new Set(server.map((g) => g.id));
    const localOnly = local.filter((g) => !serverIds.has(g.id));
    return [...merged, ...localOnly];
}

// ─── Group sidebar (list of groups, left rail) ────────────────────────────

function GroupSidebar({
    groups,
    activeId,
    onSelect,
    onAdd,
    search,
    onSearch,
}: {
    groups: ModifierGroup[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;
    search: string;
    onSearch: (v: string) => void;
}) {
    return (
        <aside className="w-full shrink-0 space-y-4 lg:w-80">
            <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Groups
                    </p>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
                    >
                        <Plus className="size-3" />
                        New
                    </button>
                </div>

                <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Search groups..."
                        className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                <ul className="mt-3 space-y-1">
                    {groups.length === 0 ? (
                        <li className="rounded-lg border border-dashed border-input px-3 py-6 text-center text-xs text-muted-foreground">
                            No groups match your search.
                        </li>
                    ) : (
                        groups.map((g) => {
                            const isActive = g.id === activeId;
                            return (
                                <li key={g.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(g.id)}
                                        className={
                                            'flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition ' +
                                            (isActive
                                                ? 'bg-primary/10 font-semibold text-primary'
                                                : 'text-foreground hover:bg-muted')
                                        }
                                    >
                                        <span className="flex w-full items-center justify-between gap-2">
                                            <span className="truncate">{g.name}</span>
                                            {g.required && (
                                                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-700">
                                                    Required
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-[11px] font-normal text-muted-foreground">
                                            {g.options.length} option
                                            {g.options.length === 1 ? '' : 's'} ·{' '}
                                            {selectionLabel(g)}
                                        </span>
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>
        </aside>
    );
}

// ─── Option row ───────────────────────────────────────────────────────────

function OptionRow({
    option,
    onChange,
    onDelete,
}: {
    option: ModifierOption;
    onChange: (patch: Partial<ModifierOption>) => void;
    onDelete: () => void;
}) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
            <GripVertical className="size-4 shrink-0 text-muted-foreground" />
            <input
                type="text"
                value={option.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Option name"
                className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="relative shrink-0">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    +£
                </span>
                <input
                    type="number"
                    step="0.50"
                    value={option.priceDelta}
                    onChange={(e) =>
                        onChange({ priceDelta: Number(e.target.value) || 0 })
                    }
                    className="h-9 w-24 rounded-md border border-input bg-background pl-7 pr-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>
            <button
                type="button"
                onClick={onDelete}
                aria-label="Remove option"
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
            >
                <Trash2 className="size-4" />
            </button>
        </div>
    );
}

// ─── Group editor (right panel) ───────────────────────────────────────────

function GroupEditor({
    group,
    onChange,
    onSave,
    onDelete,
    saving,
    dirty,
}: {
    group: ModifierGroup;
    onChange: (next: ModifierGroup) => void;
    onSave: () => void;
    onDelete: () => void;
    saving: boolean;
    dirty: boolean;
}) {
    const [renaming, setRenaming] = useState(false);

    // Self-heal multiple-selection groups whose saved min/max exceed the
    // current option count (e.g. a group saved with max 8 but only 4 options).
    // Single groups are skipped — they're always min=(required?1:0)/max=1
    // regardless of option count — and we never clamp when there are no
    // options yet, since max must stay >= 1 (clamping to 0 fails server
    // validation and silently rejects the whole save).
    const optionCount = group.options.length;
    useEffect(() => {
        if (group.selectionType !== 'multiple' || optionCount === 0) return;
        const maxOver = group.maxSelections != null && group.maxSelections > optionCount;
        const minOver = group.minSelections > optionCount;
        if (maxOver || minOver) {
            onChange({
                ...group,
                minSelections: Math.min(group.minSelections, optionCount),
                maxSelections:
                    group.maxSelections == null
                        ? null
                        : Math.min(group.maxSelections, optionCount),
            });
        }
        // Only re-evaluate when the option count or selection type changes;
        // onChange/group are intentionally omitted to avoid a clamp loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [optionCount, group.selectionType]);

    const setOption = (id: string, patch: Partial<ModifierOption>) => {
        onChange({
            ...group,
            options: group.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        });
    };

    const removeOption = (id: string) => {
        const options = group.options.filter((o) => o.id !== id);
        const count = options.length;
        // Selecting more than the available options is impossible, so keep
        // min/max within the new option count when a row is removed.
        onChange({
            ...group,
            options,
            minSelections: Math.min(group.minSelections, count),
            maxSelections:
                group.maxSelections == null ? null : Math.min(group.maxSelections, count),
        });
    };

    const addOption = () => {
        onChange({
            ...group,
            options: [
                ...group.options,
                { id: nextId('o'), name: '', priceDelta: 0 },
            ],
        });
    };

    return (
        <div className="min-w-0 flex-1 space-y-5">
            <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                        {renaming ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={group.name}
                                    onChange={(e) =>
                                        onChange({ ...group, name: e.target.value })
                                    }
                                    autoFocus
                                    onBlur={() => setRenaming(false)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') setRenaming(false);
                                    }}
                                    className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-base font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setRenaming(true)}
                                className="inline-flex items-center gap-2 text-xl font-bold tracking-tight"
                            >
                                {group.name || 'Untitled group'}
                                <Pencil className="size-3.5 text-muted-foreground" />
                            </button>
                        )}
                        <input
                            type="text"
                            value={group.description ?? ''}
                            onChange={(e) =>
                                onChange({ ...group, description: e.target.value })
                            }
                            placeholder="Short helper shown to customers (optional)"
                            className="h-9 w-full max-w-xl rounded-md border-0 bg-transparent px-0 text-sm text-muted-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={saving || !dirty}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check className="size-3.5" />
                            {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-background px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                            <Trash2 className="size-3.5" />
                            Delete group
                        </button>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Selection type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['single', 'multiple'] as SelectionType[]).map((t) => {
                                const isActive = group.selectionType === t;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...group,
                                                selectionType: t,
                                                maxSelections:
                                                    t === 'single' ? 1 : group.maxSelections,
                                                minSelections:
                                                    t === 'single' ? (group.required ? 1 : 0) : group.minSelections,
                                            })
                                        }
                                        className={
                                            'flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition ' +
                                            (isActive
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-input bg-background text-foreground hover:border-primary')
                                        }
                                    >
                                        {isActive && <Check className="size-3.5" />}
                                        {t === 'single' ? 'Pick one' : 'Pick multiple'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Required</label>
                        <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2">
                            <span className="text-sm text-muted-foreground">
                                Customers must pick at least one
                            </span>
                            <span
                                role="switch"
                                aria-checked={group.required}
                                onClick={() =>
                                    onChange({
                                        ...group,
                                        required: !group.required,
                                        minSelections: !group.required ? 1 : 0,
                                    })
                                }
                                className={
                                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition ' +
                                    (group.required ? 'bg-primary' : 'bg-muted')
                                }
                            >
                                <span
                                    className={
                                        'inline-block size-5 rounded-full bg-background shadow transition ' +
                                        (group.required ? 'translate-x-5' : 'translate-x-0.5')
                                    }
                                />
                            </span>
                        </div>
                    </div>

                    {group.selectionType === 'multiple' && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Min selections</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={optionCount}
                                    value={group.minSelections}
                                    onChange={(e) =>
                                        onChange({
                                            ...group,
                                            // Can't require more than the options that exist.
                                            minSelections: Math.min(
                                                optionCount,
                                                Math.max(0, Number(e.target.value) || 0),
                                            ),
                                        })
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">
                                    Max selections{' '}
                                    <span className="text-xs text-muted-foreground">
                                        (blank = unlimited)
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={optionCount}
                                    value={group.maxSelections ?? ''}
                                    onChange={(e) =>
                                        onChange({
                                            ...group,
                                            // Cap at the option count — picking more than the
                                            // number of options is impossible.
                                            maxSelections:
                                                e.target.value === ''
                                                    ? null
                                                    : Math.min(
                                                          optionCount,
                                                          Math.max(0, Number(e.target.value) || 0),
                                                      ),
                                        })
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold tracking-tight">Options</h3>
                        <p className="text-xs text-muted-foreground">
                            Drag to reorder. Price is the surcharge added to the base item.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addOption}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-semibold hover:border-primary hover:text-primary"
                    >
                        <Plus className="size-4" />
                        Add option
                    </button>
                </div>

                <div className="mt-4 space-y-2">
                    {group.options.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-input bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                            No options yet — add the first one.
                        </div>
                    ) : (
                        group.options.map((option) => (
                            <OptionRow
                                key={option.id}
                                option={option}
                                onChange={(patch) => setOption(option.id, patch)}
                                onDelete={() => removeOption(option.id)}
                            />
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-input bg-background p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SlidersHorizontal className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-bold">No modifier groups yet</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Modifier groups let customers customise an item — sizes, toppings, dips. Create
                a group, add the options that go inside it, then attach it to a menu item.
            </p>
            <button
                type="button"
                onClick={onAdd}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
                <Plus className="size-4" />
                Create your first group
            </button>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────

interface ModifiersProps {
    /**
     * Server-filtered catalogue. ModifierController::index serializes the
     * partner's groups + options into this shape (same field names as the
     * client-side ModifierGroup type, so no translation needed).
     */
    groups: ModifierGroup[];
    /** Active filters echoed back so the search box reflects the URL. */
    filters?: { search?: string };
}

export default function Modifiers({
    groups: serverGroups = [],
    filters: initialFilters = {},
}: ModifiersProps) {
    const [groups, setGroups] = useState<ModifierGroup[]>(serverGroups);
    const [activeId, setActiveId] = useState<string | null>(
        serverGroups[0]?.id ?? null,
    );
    const [search, setSearch] = useState(initialFilters.search ?? '');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    // Explicit-save model: edits stay local until the user clicks "Save".
    // `dirtyIds` flags groups with unsaved changes; `savingId` is the group
    // whose save is currently in flight (drives the Save button feedback).
    const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
    const [savingId, setSavingId] = useState<string | null>(null);

    // Re-sync when Inertia re-renders the page after a save / delete. We
    // reconcile (adopt server option ids, keep local edits) rather than
    // overwrite, so an in-flight save can't clobber text the user is still
    // typing. See reconcileGroups for the trailing-space failure mode.
    useEffect(() => {
        setGroups((prev) => reconcileGroups(prev, serverGroups));
        // Keep the active selection if its id survived; otherwise fall
        // back to the first group (or null when the catalogue is empty).
        setActiveId((prev) => {
            if (prev && serverGroups.some((g) => g.id === prev)) return prev;
            return serverGroups[0]?.id ?? null;
        });
    }, [serverGroups]);

    // Build the request payload Laravel's validateGroup expects. Mapped
    // here once so both `addGroup` (POST) and `updateGroup` (PUT) feed
    // the same shape.
    const buildPayload = (g: ModifierGroup) => ({
        name: g.name,
        description: g.description ?? '',
        selection_type: g.selectionType,
        is_required: g.required,
        min_selections: g.minSelections,
        // The server requires max_selections to be null (unlimited) or >= 1.
        // Coerce a stray 0 to null so a save can never 422 on this field.
        max_selections: g.maxSelections && g.maxSelections > 0 ? g.maxSelections : null,
        options: g.options.map((o) => ({
            // Numeric ids come back from the server as strings; pass
            // through so the controller can match-update instead of
            // inserting duplicates. Optimistic client ids (e.g. "o-xyz")
            // are sent as null so the server creates fresh rows.
            id: /^\d+$/.test(o.id) ? Number(o.id) : null,
            name: o.name,
            price_delta: o.priceDelta,
        })),
    });

    // Filter client-side. The catalogue is small (groups per restaurant),
    // and keeping local state authoritative avoids a server round-trip whose
    // response would otherwise overwrite in-progress edits.
    const query = search.trim().toLowerCase();
    const filteredGroups = query
        ? groups.filter((g) => g.name.toLowerCase().includes(query))
        : groups;

    const activeGroup = groups.find((g) => g.id === activeId) ?? null;

    /**
     * Local edit only — changes are held in component state and don't touch
     * the server until the user clicks "Save". The group is flagged dirty so
     * the Save button reflects that there are unsaved changes.
     */
    const updateGroup = (next: ModifierGroup) => {
        setGroups((prev) => prev.map((g) => (g.id === next.id ? next : g)));
        setDirtyIds((prev) => {
            if (prev.has(next.id)) return prev;
            const n = new Set(prev);
            n.add(next.id);
            return n;
        });
    };

    /**
     * Persist a single group to the database — triggered by the "Save" button.
     *
     * Blank options are dropped from the payload (the server requires a name
     * per option, so sending a half-typed row would 422 and roll back the
     * whole save); they persist once named. On success the group is marked
     * clean and reconcileGroups adopts any server-assigned option ids.
     */
    const saveGroup = (group: ModifierGroup) => {
        // Brand-new groups stay client-side until their "Add group" POST lands
        // a numeric id — nothing to update yet.
        if (!/^\d+$/.test(group.id)) return;
        if (!group.name.trim()) return;

        const payload = buildPayload({
            ...group,
            options: group.options.filter((o) => o.name.trim()),
        });

        setSavingId(group.id);
        router.put(route('restaurant.modifiers.update', { modifier: group.id }), payload, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setDirtyIds((prev) => {
                    if (!prev.has(group.id)) return prev;
                    const n = new Set(prev);
                    n.delete(group.id);
                    return n;
                });
            },
            onFinish: () => setSavingId((cur) => (cur === group.id ? null : cur)),
        });
    };

    const addGroup = () => {
        // Server creates the row + assigns the canonical id. We
        // optimistically render a placeholder so the right-hand
        // editor focuses on the new group immediately; once props
        // refresh, the optimistic row is replaced by the real one.
        const optimistic: ModifierGroup = {
            id: nextId('g'),
            name: 'New group',
            description: '',
            selectionType: 'single',
            required: false,
            minSelections: 0,
            maxSelections: 1,
            options: [],
        };
        setGroups((prev) => [...prev, optimistic]);
        setActiveId(optimistic.id);

        router.post(route('restaurant.modifiers.store'), buildPayload(optimistic), {
            preserveScroll: true,
            preserveState: false, // refetch so we get the new id
        });
    };

    const confirmDelete = (id: string) => setConfirmDeleteId(id);

    const performDelete = () => {
        if (!confirmDeleteId) return;
        const id = confirmDeleteId;

        setGroups((prev) => prev.filter((g) => g.id !== id));
        if (activeId === id) {
            setActiveId(groups.find((g) => g.id !== id)?.id ?? null);
        }
        setConfirmDeleteId(null);

        // Optimistic groups (never persisted) drop client-side only.
        if (/^\d+$/.test(id)) {
            router.delete(route('restaurant.modifiers.destroy', { modifier: id }), {
                preserveScroll: true,
                preserveState: false,
            });
        }
    };

    // Lock body scroll while the confirm dialog is open.
    useEffect(() => {
        if (!confirmDeleteId) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [confirmDeleteId]);

    const deletingGroup = groups.find((g) => g.id === confirmDeleteId) ?? null;

    return (
        <AppLayout active="modifiers">
            <Head title="Modifiers — Swift Drop Partner" />

            <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Modifiers
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Sizes, toppings, dips — define option groups your menu items can attach to.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addGroup}
                        className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        <Plus className="size-4" />
                        Add group
                    </button>
                </div>

                {groups.length === 0 ? (
                    <EmptyState onAdd={addGroup} />
                ) : (
                    <div className="flex flex-col gap-5 lg:flex-row">
                        <GroupSidebar
                            groups={filteredGroups}
                            activeId={activeId}
                            onSelect={setActiveId}
                            onAdd={addGroup}
                            search={search}
                            onSearch={setSearch}
                        />

                        {activeGroup ? (
                            <GroupEditor
                                group={activeGroup}
                                onChange={updateGroup}
                                onSave={() => saveGroup(activeGroup)}
                                onDelete={() => confirmDelete(activeGroup.id)}
                                saving={savingId === activeGroup.id}
                                dirty={dirtyIds.has(activeGroup.id)}
                            />
                        ) : (
                            <div className="flex min-h-[300px] flex-1 items-center justify-center rounded-2xl border border-dashed border-input bg-background text-sm text-muted-foreground">
                                Pick a group on the left to start editing.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {confirmDeleteId && deletingGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl">
                        <div className="flex items-start justify-between">
                            <h3 className="text-base font-bold">Delete group?</h3>
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                aria-label="Close"
                                className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            "{deletingGroup.name || 'Untitled group'}" and its{' '}
                            {deletingGroup.options.length} option
                            {deletingGroup.options.length === 1 ? '' : 's'} will be removed. Menu
                            items currently using this group will lose the customisation.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={performDelete}
                                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
                            >
                                <Trash2 className="size-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
