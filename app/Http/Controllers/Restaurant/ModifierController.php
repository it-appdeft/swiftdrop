<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\ModifierGroup;
use App\Models\ModifierOption;
use App\Models\Restaurant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Restaurant > Modifiers screen.
 *
 * Powers the partner's reusable modifier-group catalogue (Size, Toppings,
 * Cheese & Dip, …) that menu items attach to so customers can customise
 * their order. The React page at resources/js/restaurant/pages/modifiers.tsx
 * receives the catalogue via Inertia props and round-trips edits through
 * the store / update / destroy endpoints registered in routes/restaurant.php.
 */
class ModifierController extends Controller
{
    /**
     * GET /restaurant/modifiers
     *
     * Renders the Modifiers page seeded with the partner's existing groups
     * (and their options, ordered by sort_order). Empty array on first
     * visit — the React page surfaces an empty-state CTA in that case.
     */
    public function index(Request $request): Response
    {
        $restaurant = $this->restaurantFor($request->user());
        $filters = ['search' => (string) $request->query('search', '')];

        $groups = $restaurant
            ? $this->serializeGroups($this->loadGroups($restaurant, $filters))
            : [];

        return Inertia::render('restaurant/modifiers', [
            'groups'  => $groups,
            'filters' => $filters,
        ]);
    }

    /**
     * POST /restaurant/modifiers
     *
     * Creates a new group with its options in one transaction. The React
     * page lets the partner add an empty group up-front and fill it in;
     * we accept an optional `options` array so the same endpoint also
     * supports a fully-populated "duplicate group" flow later on.
     */
    public function store(Request $request): RedirectResponse
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless($restaurant !== null, 403, 'No restaurant profile attached to this account.');

        $data = $this->validateGroup($request);

        DB::transaction(function () use ($restaurant, $data) {
            $group = $restaurant->modifierGroups()->create([
                'name'           => $data['name'],
                'description'    => $data['description'] ?? null,
                'selection_type' => $data['selection_type'],
                'is_required'    => $data['is_required'],
                'min_selections' => $data['min_selections'],
                'max_selections' => $data['max_selections'] ?? null,
                'sort_order'     => $this->nextSortOrder($restaurant),
            ]);

            $this->syncOptions($group, $data['options'] ?? []);
        });

        return back();
    }

    /**
     * PUT /restaurant/modifiers/{modifier}
     *
     * Replaces the group's editable fields and rewrites its option list
     * to match the payload. Options keep their id when present so a
     * rename + price-change keeps the row's history; missing ids are
     * treated as new rows, and rows on the server that aren't in the
     * payload are deleted.
     */
    public function update(Request $request, ModifierGroup $modifier): RedirectResponse
    {
        $this->authorizeOwnership($request, $modifier);

        $data = $this->validateGroup($request);

        DB::transaction(function () use ($modifier, $data) {
            $modifier->forceFill([
                'name'           => $data['name'],
                'description'    => $data['description'] ?? null,
                'selection_type' => $data['selection_type'],
                'is_required'    => $data['is_required'],
                'min_selections' => $data['min_selections'],
                'max_selections' => $data['max_selections'] ?? null,
            ])->save();

            $this->syncOptions($modifier, $data['options'] ?? []);
        });

        return back();
    }

    /**
     * DELETE /restaurant/modifiers/{modifier}
     *
     * Removes the group and its options. Menu items keep their row but
     * lose this attachment (pivot cascade); we don't reprice anything
     * here — the dish's base price stands.
     */
    public function destroy(Request $request, ModifierGroup $modifier): RedirectResponse
    {
        $this->authorizeOwnership($request, $modifier);

        $modifier->delete();

        return back();
    }

    /* -------------------- Internals -------------------- */

    /**
     * Validate the create / update payload. Selection-type + min/max
     * cross-checks live here so both endpoints share the same rules.
     */
    protected function validateGroup(Request $request): array
    {
        $validated = $request->validate([
            'name'              => ['required', 'string', 'max:120'],
            'description'       => ['nullable', 'string', 'max:255'],
            'selection_type'    => ['required', Rule::in(ModifierGroup::SELECTION_TYPES)],
            'is_required'       => ['sometimes', 'boolean'],
            'min_selections'    => ['sometimes', 'integer', 'min:0', 'max:50'],
            'max_selections'    => ['nullable', 'integer', 'min:1', 'max:50'],

            'options'                 => ['sometimes', 'array'],
            'options.*.id'            => ['nullable', 'integer'],
            'options.*.name'          => ['required', 'string', 'max:120'],
            'options.*.price_delta'   => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
        ]);

        $validated['is_required']    = (bool) ($validated['is_required'] ?? false);
        $validated['min_selections'] = (int)  ($validated['min_selections'] ?? ($validated['is_required'] ? 1 : 0));

        // Pick-one groups always behave as min=max=1 regardless of what
        // the client sent, so the constraint can't drift on the server.
        if ($validated['selection_type'] === ModifierGroup::SELECTION_SINGLE) {
            $validated['min_selections'] = $validated['is_required'] ? 1 : 0;
            $validated['max_selections'] = 1;
        } else {
            // Pick-multiple: you can't require or allow more picks than the
            // number of options that exist. Clamp both bounds to the option
            // count so a stale "max 8 with 4 options" can't be persisted.
            $optionCount = count($validated['options'] ?? []);
            if ($optionCount > 0) {
                $validated['min_selections'] = min($validated['min_selections'], $optionCount);
                if (! empty($validated['max_selections'])) {
                    $validated['max_selections'] = min($validated['max_selections'], $optionCount);
                }
            }
        }

        if (
            isset($validated['max_selections'])
            && $validated['max_selections'] < $validated['min_selections']
        ) {
            abort(422, 'Max selections must be greater than or equal to min selections.');
        }

        return $validated;
    }

    /**
     * Reconcile an options array against the rows in the database:
     *   - ids that match → updated in place + sort_order rewritten
     *   - rows with no id → created
     *   - rows on the server missing from payload → deleted
     */
    protected function syncOptions(ModifierGroup $group, array $options): void
    {
        $kept = [];

        foreach (array_values($options) as $index => $row) {
            $payload = [
                'name'        => $row['name'],
                'price_delta' => (float) ($row['price_delta'] ?? 0),
                'sort_order'  => $index,
            ];

            $option = isset($row['id']) && $row['id']
                ? $group->options()->whereKey((int) $row['id'])->first()
                : null;

            if ($option) {
                $option->forceFill($payload)->save();
            } else {
                $option = $group->options()->create($payload);
            }

            $kept[] = $option->id;
        }

        // Drop options the partner removed.
        $group->options()
            ->when($kept, fn ($q) => $q->whereNotIn('id', $kept))
            ->delete();
    }

    /**
     * Eager-loaded fetch the React page consumes. Stable order (sort_order
     * then id) so adding a group and reloading doesn't shuffle the list.
     */
    protected function loadGroups(Restaurant $restaurant, array $filters = [])
    {
        return $restaurant->modifierGroups()
            ->filter($filters)
            ->with(['options' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    /**
     * Shape the eloquent collection into the JSON the React page expects.
     * Matches the {@see \resources/js/restaurant/data/modifier-groups.ts}
     * type contract — same keys, camelCase, so the page renders without
     * a translation layer.
     */
    protected function serializeGroups($groups): array
    {
        return $groups->map(fn (ModifierGroup $g) => [
            'id'             => (string) $g->id,
            'name'           => (string) $g->name,
            'description'    => (string) ($g->description ?? ''),
            'selectionType'  => $g->selection_type,
            'required'       => (bool) $g->is_required,
            'minSelections'  => (int) $g->min_selections,
            'maxSelections'  => $g->max_selections === null ? null : (int) $g->max_selections,
            'options'        => $g->options->map(fn (ModifierOption $o) => [
                'id'         => (string) $o->id,
                'name'       => (string) $o->name,
                'priceDelta' => (float) $o->price_delta,
            ])->values()->all(),
        ])->values()->all();
    }

    protected function nextSortOrder(Restaurant $restaurant): int
    {
        return (int) ($restaurant->modifierGroups()->max('sort_order') ?? 0) + 1;
    }

    /**
     * Guard against cross-restaurant access. The route binds the model
     * by id only — without this, a partner could PUT/DELETE another
     * restaurant's group by guessing the id.
     */
    protected function authorizeOwnership(Request $request, ModifierGroup $group): void
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless(
            $restaurant !== null && $group->restaurant_id === $restaurant->id,
            403,
            'You do not have access to this modifier group.',
        );
    }

    protected function restaurantFor(?\App\Models\User $user): ?Restaurant
    {
        return $user?->restaurant()->first();
    }
}
