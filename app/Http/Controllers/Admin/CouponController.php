<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCouponRequest;
use App\Http\Requests\Admin\UpdateCouponRequest;
use App\Models\Offer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin CRUD for coupons (backed by the {@see Offer} model). Mirrors the
 * FoodItem/Driver admin pattern: thin controller + FormRequest validation +
 * Inertia pages, with a PATCH toggle for active/inactive.
 */
class CouponController extends Controller
{
    public function index(Request $request): Response
    {
        $coupons = Offer::query()
            ->filter($request->only(['search', 'status']))
            ->withCount('usages')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/coupons/index', [
            'coupons' => $coupons,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/coupons/create', [
            'options' => $this->formOptions(),
        ]);
    }

    public function store(StoreCouponRequest $request): RedirectResponse
    {
        Offer::create($this->normalise($request->validated()));

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon created.');
    }

    public function edit(int $id): Response
    {
        $coupon = Offer::findOrFail($id);

        return Inertia::render('admin/coupons/edit', [
            'coupon' => [
                ...$coupon->only([
                    'id', 'code', 'title', 'description', 'type', 'value', 'min_order_value',
                    'max_discount', 'trigger', 'max_uses_per_user', 'is_active',
                ]),
                'valid_from' => optional($coupon->valid_from)->toDateString(),
                'valid_until' => optional($coupon->valid_until)->toDateString(),
            ],
            'options' => $this->formOptions(),
        ]);
    }

    public function update(UpdateCouponRequest $request, int $id): RedirectResponse
    {
        $coupon = Offer::findOrFail($id);
        $coupon->update($this->normalise($request->validated()));

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        Offer::findOrFail($id)->delete();

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon deleted.');
    }

    /** Active/inactive toggle (the partner-style PATCH action). */
    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        Offer::findOrFail($id)->update(['is_active' => $request->boolean('is_active')]);

        return back()->with('success', 'Coupon status updated.');
    }

    /**
     * Normalise the validated payload: uppercase code, blank → null for the
     * optional numerics/dates, force free-delivery value to 0, and always scope
     * to 'all' (per-restaurant targeting is a later enhancement).
     */
    private function normalise(array $data): array
    {
        $data['code'] = strtoupper($data['code']);
        $data['applicable_to'] = 'all'; // per-restaurant/category targeting is a later enhancement
        $data['value'] = $data['type'] === Offer::TYPE_FREE_DELIVERY ? 0 : $data['value'];

        foreach (['min_order_value', 'max_discount', 'max_uses_per_user', 'valid_from', 'valid_until'] as $key) {
            if (($data[$key] ?? '') === '') {
                $data[$key] = null;
            }
        }

        return $data;
    }

    /** @return array<string, mixed> */
    private function formOptions(): array
    {
        return [
            'types' => Offer::TYPES,
            'triggers' => Offer::TRIGGERS,
        ];
    }
}
