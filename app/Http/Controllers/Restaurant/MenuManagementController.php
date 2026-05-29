<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\ModifierGroup;
use App\Models\ModifierOption;
use App\Models\Restaurant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Restaurant > Menu Management screen.
 *
 * Owns the partner's catalogue of dishes (price, availability, category,
 * description, modifier-group attachments). The React page at
 * resources/js/restaurant/pages/menu.tsx reads the bootstrap via Inertia
 * props and writes back through the verbs registered in
 * routes/restaurant.php (categories.*, items.*, toggleAvailability).
 *
 * Modifier groups themselves are managed by {@see ModifierController};
 * this controller only reads them so the Add Menu Item modal can show
 * the partner which groups to attach.
 */
class MenuManagementController extends Controller
{
    /**
     * GET /restaurant/menu
     *
     * Renders the page with everything it needs in one shot:
     *   - categories  → left-rail sidebar
     *   - items       → grid of dish cards
     *   - modifierGroups → "Modifier groups" section of the Add Item modal
     */
    /** Dishes per page in the Menu Management grid. */
    protected const PER_PAGE = 12;

    public function index(Request $request): Response
    {
        $restaurant = $this->restaurantFor($request->user());
        $filters = $this->menuFilters($request);

        $paginator = $restaurant
            ? $restaurant->menuItems()
                ->filter($filters)
                ->with([
                    'modifierGroups' => fn ($q) => $q->orderBy('menu_item_modifier_group.sort_order'),
                    'uploads' => fn ($q) => $q->where('collection', 'image'),
                ])
                ->orderBy('sort_order')
                ->orderBy('id')
                ->paginate(self::PER_PAGE)
                ->withQueryString()
            : null;

        return Inertia::render('restaurant/menu', [
            'categories'     => $restaurant ? $this->serializeCategories($restaurant) : [],
            'items'          => $paginator ? $this->serializeItems($paginator->getCollection()) : [],
            'modifierGroups' => $restaurant ? $this->serializeModifierGroups($restaurant) : [],
            'itemsTotal'     => $restaurant ? $restaurant->menuItems()->count() : 0,
            'filters'        => $filters,
            'pagination'     => $paginator ? [
                'currentPage' => $paginator->currentPage(),
                'lastPage'    => $paginator->lastPage(),
                'perPage'     => $paginator->perPage(),
                'total'       => $paginator->total(),
                'from'        => $paginator->firstItem(),
                'to'          => $paginator->lastItem(),
            ] : null,
        ]);
    }

    /** Normalise the grid filter params off the query string. */
    protected function menuFilters(Request $request): array
    {
        return [
            'search'    => (string) $request->query('search', ''),
            'category'  => (string) $request->query('category', 'all'),
            'diet'      => (string) $request->query('diet', 'all'),
            'price_min' => $request->query('price_min'),
            'price_max' => $request->query('price_max'),
            'group_ids' => array_values(array_filter(
                (array) $request->query('group_ids', []),
                fn ($v) => $v !== '' && $v !== null,
            )),
        ];
    }

    /* -------------------- Menu items -------------------- */

    public function storeItem(Request $request): RedirectResponse
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless($restaurant !== null, 403, 'No restaurant profile attached to this account.');

        $data = $this->validateItem($request, $restaurant);

        DB::transaction(function () use ($restaurant, $data, $request) {
            $item = $restaurant->menuItems()->create([
                'category_id'  => $data['category_id'] ?? null,
                'name'         => $data['name'],
                'description'  => $data['description'] ?? null,
                'price'        => $data['price'],
                'is_available' => $data['is_available'],
                'is_veg'       => $data['is_veg'],
                'sort_order'   => $this->nextItemSortOrder($restaurant),
            ]);

            $this->syncModifierGroups($item, $data['modifier_group_ids'] ?? []);

            if ($request->hasFile('image')) {
                $item->replaceUpload($request->file('image'), 'image');
            }
        });

        return back();
    }

    public function updateItem(Request $request, MenuItem $item): RedirectResponse
    {
        $this->authorizeItemOwnership($request, $item);

        $restaurant = $this->restaurantFor($request->user());
        $data = $this->validateItem($request, $restaurant);

        DB::transaction(function () use ($item, $data, $request) {
            $item->forceFill([
                'category_id'  => $data['category_id'] ?? null,
                'name'         => $data['name'],
                'description'  => $data['description'] ?? null,
                'price'        => $data['price'],
                'is_available' => $data['is_available'],
                'is_veg'       => $data['is_veg'],
            ])->save();

            $this->syncModifierGroups($item, $data['modifier_group_ids'] ?? []);

            if ($request->hasFile('image')) {
                $item->replaceUpload($request->file('image'), 'image');
            }
        });

        return back();
    }

    public function destroyItem(Request $request, MenuItem $item): RedirectResponse
    {
        $this->authorizeItemOwnership($request, $item);
        $item->delete();

        return back();
    }

    /**
     * PATCH /restaurant/menu/items/{item}/availability
     *
     * One-shot toggle used by the "Available / 86'd" switch on each
     * dish card. Splitting it out from updateItem keeps the request
     * tiny and lets the React page do an optimistic flip.
     */
    public function toggleItemAvailability(Request $request, MenuItem $item): RedirectResponse
    {
        $this->authorizeItemOwnership($request, $item);

        $validated = $request->validate([
            'is_available' => ['required', 'boolean'],
        ]);

        $item->forceFill(['is_available' => (bool) $validated['is_available']])->save();

        return back();
    }

    /* -------------------- Menu categories -------------------- */

    public function storeCategory(Request $request): RedirectResponse
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless($restaurant !== null, 403, 'No restaurant profile attached to this account.');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
        ]);

        $restaurant->categories()->create([
            'name'       => $validated['name'],
            'sort_order' => (int) ($restaurant->categories()->max('sort_order') ?? 0) + 1,
            'is_active'  => true,
        ]);

        return back();
    }

    public function destroyCategory(Request $request, MenuCategory $category): RedirectResponse
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless(
            $restaurant !== null && $category->restaurant_id === $restaurant->id,
            403,
            'You do not have access to this category.',
        );

        // category_id nullOnDelete cascades — items survive without a
        // category (they fall back to "Uncategorised" in the UI).
        $category->delete();

        return back();
    }

    /* -------------------- Internals -------------------- */

    protected function validateItem(Request $request, ?Restaurant $restaurant): array
    {
        $categoryIds = $restaurant
            ? $restaurant->categories()->pluck('id')->all()
            : [];

        $modifierGroupIds = $restaurant
            ? $restaurant->modifierGroups()->pluck('id')->all()
            : [];

        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:120'],
            'description'     => ['nullable', 'string', 'max:500'],
            'price'           => ['required', 'numeric', 'min:0', 'max:99999.99'],
            'category_id'     => ['nullable', 'integer', Rule::in($categoryIds)],
            'is_available'    => ['sometimes', 'boolean'],
            'is_veg'          => ['sometimes', 'boolean'],
            'prep_time'       => ['nullable', 'integer', 'min:0', 'max:240'],
            'image'           => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],

            'modifier_group_ids'   => ['sometimes', 'array'],
            'modifier_group_ids.*' => ['integer', Rule::in($modifierGroupIds)],
        ]);

        $validated['is_available'] = (bool) ($validated['is_available'] ?? true);
        $validated['is_veg']       = (bool) ($validated['is_veg'] ?? false);

        return $validated;
    }

    /**
     * Sync the pivot to match the payload. Pivot's sort_order follows
     * the order the partner ticked the groups in, so the dish renders
     * them in that sequence (Size → Toppings → Dip).
     */
    protected function syncModifierGroups(MenuItem $item, array $groupIds): void
    {
        $payload = [];
        foreach (array_values($groupIds) as $index => $id) {
            $payload[(int) $id] = ['sort_order' => $index];
        }

        $item->modifierGroups()->sync($payload);
    }

    protected function nextItemSortOrder(Restaurant $restaurant): int
    {
        return (int) ($restaurant->menuItems()->max('sort_order') ?? 0) + 1;
    }

    protected function authorizeItemOwnership(Request $request, MenuItem $item): void
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless(
            $restaurant !== null && $item->restaurant_id === $restaurant->id,
            403,
            'You do not have access to this menu item.',
        );
    }

    /* -------------------- Serializers (Inertia → React) -------------------- */

    protected function serializeCategories(Restaurant $restaurant): array
    {
        // Counts are unfiltered totals so the sidebar shows how many dishes
        // each category holds regardless of the active grid filters.
        return $restaurant->categories()
            ->withCount('items')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (MenuCategory $c) => [
                'id'    => (string) $c->id,
                'name'  => (string) $c->name,
                'count' => (int) $c->items_count,
            ])
            ->all();
    }

    /**
     * Map a (paginated) collection of menu items into the React shape.
     * The query + eager-loads live in {@see index()} so pagination meta
     * stays alongside the page slice.
     *
     * @param  \Illuminate\Support\Collection<int, MenuItem>  $items
     */
    protected function serializeItems($items): array
    {
        return $items->map(fn (MenuItem $item) => [
            'id'                 => (string) $item->id,
            'name'               => (string) $item->name,
            'categoryId'         => $item->category_id !== null ? (string) $item->category_id : null,
            'price'              => (float) $item->price,
            'diet'               => $item->is_veg ? 'veg' : 'non_veg',
            'available'          => (bool) $item->is_available,
            'description'        => (string) ($item->description ?? ''),
            'image'              => $item->uploads->first()?->url ?? '',
            // sold is read-only and surfaced from the orders table once
            // that endpoint lands; default to 0 so the dish card renders.
            'sold'               => 0,
            'modifierGroupIds'   => $item->modifierGroups
                ->pluck('id')
                ->map(fn ($id) => (string) $id)
                ->all(),
        ])->all();
    }

    protected function serializeModifierGroups(Restaurant $restaurant): array
    {
        $groups = $restaurant->modifierGroups()
            ->with(['options' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

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

    protected function restaurantFor(?User $user): ?Restaurant
    {
        return $user?->restaurant()->first();
    }
}
