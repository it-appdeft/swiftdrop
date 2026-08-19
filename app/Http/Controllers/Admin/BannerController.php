<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BannerStatusRequest;
use App\Http\Requests\Admin\StoreBannerRequest;
use App\Http\Requests\Admin\UpdateBannerRequest;
use App\Models\Banner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BannerController extends Controller
{
    public function index(Request $request)
    {
        $items = Banner::query()
            ->when($request->search, fn ($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->with('uploads')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/banners/index', [
            'items'   => $items,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/banners/create');
    }

    public function store(StoreBannerRequest $request): RedirectResponse
    {
        $banner = Banner::create($request->validated());
        $banner->replaceUpload($request->file('image'), 'image');

        return redirect()->route('admin.banners.index')
            ->with('success', 'Banner created.');
    }

    public function edit(int $id)
    {
        $item = Banner::with('uploads')->findOrFail($id);

        return Inertia::render('admin/banners/edit', [
            'item' => $item,
        ]);
    }

    public function update(UpdateBannerRequest $request, int $id): RedirectResponse
    {
        $item = Banner::findOrFail($id);
        $item->update($request->validated());

        if ($request->hasFile('image')) {
            $item->replaceUpload($request->file('image'), 'image');
        }

        return redirect()->route('admin.banners.index')
            ->with('success', 'Banner updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $item = Banner::findOrFail($id);
        foreach ($item->uploadsIn('image')->get() as $upload) {
            $upload->deleteWithFile();
        }
        $item->delete();

        return redirect()->route('admin.banners.index')
            ->with('success', 'Banner deleted.');
    }

    public function updateStatus(BannerStatusRequest $request, int $id): RedirectResponse
    {
        Banner::findOrFail($id)->update(['status' => $request->validated('status')]);

        return back()->with('success', 'Banner status updated.');
    }
}
