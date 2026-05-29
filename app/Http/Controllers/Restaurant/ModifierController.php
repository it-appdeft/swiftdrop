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
                'name'            => $data['name'],
                'description'     => $data['description'] ?? null,
                'selection_type'  => $data['selection_type'],
                'is_price_driver' => $data['is_price_driver'],
                'is_required'     => $data['is_required'],
                'min_selections'  => $data['min_selections'],
                'max_selections'  => $data['max_selections'] ?? null,
                'sort_order'      => $this->nextSortOrder($restaurant),
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
                'name'            => $data['name'],
                'description'     => $data['description'] ?? null,
                'selection_type'  => $data['selection_type'],
                'is_price_driver' => $data['is_price_driver'],
                'is_required'     => $data['is_required'],
                'min_selections'  => $data['min_selections'],
                'max_selections'  => $data['max_selections'] ?? null,
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
            'is_price_driver'   => ['sometimes', 'boolean'],
            'min_selections'    => ['sometimes', 'integer', 'min:0', 'max:50'],
            'max_selections'    => ['nullable', 'integer', 'min:1', 'max:50'],

            'options'                 => ['sometimes', 'array'],
            'options.*.id'            => ['nullable', 'integer'],
            'options.*.name'          => ['required', 'string', 'max:120'],
            'options.*.price_delta'   => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'options.*.is_default'    => ['sometimes', 'boolean'],
        ]);

        $validated['is_price_driver'] = (bool) ($validated['is_price_driver'] ?? false);

        if ($validated['is_price_driver']) {
            // A price-driver group is the item's size/variant selector: the
            // customer must pick exactly one, and that pick sets the price.
            // Required is implicit here even though the UI toggle is gone.
            $validated['selection_type'] = ModifierGroup::SELECTION_SINGLE;
            $validated['is_required']    = true;
            $validated['min_selections'] = 1;
            $validated['max_selections'] = 1;
            $this->normalizeDefaultOption($validated);

            return $validated;
        }

        // Non-driver groups: the Required toggle was removed from the UI, so
        // these are always optional. `is_default` is meaningless here.
        $validated['is_required']    = false;
        $validated['min_selections'] = 0;
        $validated['options']        = array_map(function (array $opt) {
            $opt['is_default'] = false;
            return $opt;
        }, $validated['options'] ?? []);

        if ($validated['selection_type'] === ModifierGroup::SELECTION_SINGLE) {
            $validated['max_selections'] = 1;
        } else {
            // Pick-multiple: can't allow more picks than options that exist.
            $optionCount = count($validated['options']);
            if ($optionCount > 0 && ! empty($validated['max_selections'])) {
                $validated['max_selections'] = min($validated['max_selections'], $optionCount);
            }
        }

        return $validated;
    }

    /**
     * Force exactly one default option on a price-driver group. The default
     * option's price prefills the item's base Price field. If the client
     * flags none, the first option wins; if it flags several, the first
     * flagged one wins.
     */
    protected function normalizeDefaultOption(array &$validated): void
    {
        $options = array_values($validated['options'] ?? []);
        abort_if(empty($options), 422, 'A price-driver group needs at least one option.');

        $defaultIndex = null;
        foreach ($options as $i => $opt) {
            if (! empty($opt['is_default'])) {
                $defaultIndex = $i;
                break;
            }
        }
        $defaultIndex ??= 0;

        foreach ($options as $i => &$opt) {
            $opt['is_default'] = ($i === $defaultIndex);
        }
        unset($opt);

        $validated['options'] = $options;
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
                'is_default'  => (bool) ($row['is_default'] ?? false),
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
            'isPriceDriver'  => (bool) $g->is_price_driver,
            'required'       => (bool) $g->is_required,
            'minSelections'  => (int) $g->min_selections,
            'maxSelections'  => $g->max_selections === null ? null : (int) $g->max_selections,
            'options'        => $g->options->map(fn (ModifierOption $o) => [
                'id'         => (string) $o->id,
                'name'       => (string) $o->name,
                'priceDelta' => (float) $o->price_delta,
                'isDefault'  => (bool) $o->is_default,
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
