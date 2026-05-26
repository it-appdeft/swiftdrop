<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FoodItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FoodItemController extends Controller
{
    public function index(Request $request)
    {
        $items = FoodItem::query()
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('slug', 'like', "%{$request->search}%"))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/food-items/index', [
            'items'   => $items,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/food-items/create');
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $data['slug'] = $this->uniqueSlug($data['slug'] ?: $data['name']);

        // Image is required by the validator above. Bail loudly on a disk
        // write failure (returns false) instead of silently saving image=null.
        $path = $request->file('image')->store('food-items', 'public');
        if (! $path) {
            return back()->withInput()->withErrors([
                'image' => 'Could not save the uploaded image. Please check storage permissions and try again.',
            ]);
        }
        $data['image'] = $path;

        FoodItem::create($data);

        return redirect()->route('admin.food-items.index')
            ->with('success', 'Food item created.');
    }

    public function edit(int $id)
    {
        $item = FoodItem::findOrFail($id);

        return Inertia::render('admin/food-items/edit', [
            'item' => $item,
        ]);
    }

    public function update(Request $request, int $id)
    {
        $item = FoodItem::findOrFail($id);
        $data = $this->validated($request, $item->id);

        $data['slug'] = $this->uniqueSlug($data['slug'] ?: $data['name'], $item->id);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('food-items', 'public');
            if (! $path) {
                return back()->withInput()->withErrors([
                    'image' => 'Could not save the uploaded image. Please check storage permissions and try again.',
                ]);
            }
            if ($item->image && Storage::disk('public')->exists($item->image)) {
                Storage::disk('public')->delete($item->image);
            }
            $data['image'] = $path;
        } else {
            // No new file picked — keep the existing image, don't pass an
            // UploadedFile (or null) through to the model.
            unset($data['image']);
        }

        $item->update($data);

        return redirect()->route('admin.food-items.index')
            ->with('success', 'Food item updated.');
    }

    public function destroy(int $id)
    {
        $item = FoodItem::findOrFail($id);

        if ($item->image && Storage::disk('public')->exists($item->image)) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        return redirect()->route('admin.food-items.index')
            ->with('success', 'Food item deleted.');
    }

    protected function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name'  => ['required', 'string', 'max:100', Rule::unique('food_items', 'name')->ignore($ignoreId)],
            'slug'  => ['nullable', 'string', 'max:120', 'alpha_dash', Rule::unique('food_items', 'slug')->ignore($ignoreId)],
            'image' => [$ignoreId ? 'nullable' : 'required', 'image', 'mimes:jpeg,jpg,png,webp,svg', 'max:2048'],
        ], [
            'name.unique' => 'A food item with this name already exists.',
            'slug.unique' => 'A food item with this slug already exists.',
        ]);
    }

    protected function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base);
        $original = $slug;
        $i = 1;

        while (FoodItem::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$original}-{$i}";
            $i++;
        }

        return $slug;
    }
}
