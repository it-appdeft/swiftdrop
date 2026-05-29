<?php

namespace Tests\Feature\Admin;

use App\Models\Offer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        return $admin;
    }

    public function test_admin_can_create_a_coupon(): void
    {
        $this->actingAs($this->admin());

        $this->post('/admin/coupons', [
            'code' => 'weekend20',
            'title' => 'Weekend Special',
            'description' => '£10 off above £45 at the weekend.',
            'type' => 'flat',
            'value' => '10',
            'min_order_value' => '45',
            'max_discount' => '',
            'trigger' => 'weekend',
            'max_uses_per_user' => '',
            'valid_from' => '',
            'valid_until' => '',
            'is_active' => true,
        ])->assertRedirect(route('admin.coupons.index'));

        // Code is uppercased; blanks normalised to null.
        $this->assertDatabaseHas('offers', [
            'code' => 'WEEKEND20', 'type' => 'flat', 'value' => 10, 'trigger' => 'weekend', 'is_active' => true,
        ]);
    }

    public function test_free_delivery_coupon_needs_no_value(): void
    {
        $this->actingAs($this->admin());

        // The form omits the value field for free delivery; it must still save.
        $this->post('/admin/coupons', [
            'code' => 'FREEDEL',
            'title' => 'Free Delivery',
            'type' => 'free_delivery',
            'value' => '',
            'trigger' => 'all',
            'is_active' => true,
        ])->assertRedirect(route('admin.coupons.index'));

        $this->assertDatabaseHas('offers', ['code' => 'FREEDEL', 'type' => 'free_delivery', 'value' => 0]);
    }

    public function test_duplicate_code_is_rejected(): void
    {
        $this->actingAs($this->admin());
        Offer::create(['code' => 'DUP', 'type' => 'flat', 'value' => 5, 'trigger' => 'all', 'is_active' => true, 'applicable_to' => 'all']);

        $this->post('/admin/coupons', [
            'code' => 'DUP', 'type' => 'flat', 'value' => '5', 'trigger' => 'all', 'is_active' => true,
        ])->assertSessionHasErrors('code');
    }

    public function test_admin_can_toggle_and_delete_a_coupon(): void
    {
        $this->actingAs($this->admin());
        $offer = Offer::create(['code' => 'TOG', 'type' => 'flat', 'value' => 5, 'trigger' => 'all', 'is_active' => true, 'applicable_to' => 'all']);

        $this->patch("/admin/coupons/{$offer->id}/status", ['is_active' => false])->assertRedirect();
        $this->assertDatabaseHas('offers', ['id' => $offer->id, 'is_active' => false]);

        $this->delete("/admin/coupons/{$offer->id}")->assertRedirect(route('admin.coupons.index'));
        $this->assertDatabaseMissing('offers', ['id' => $offer->id]);
    }

    public function test_non_admin_cannot_manage_coupons(): void
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $customer = User::factory()->create();
        $customer->assignRole('customer');
        $this->actingAs($customer);

        // The `admin` middleware redirects non-admins away rather than 403-ing.
        $this->get('/admin/coupons')->assertRedirect();
        $this->post('/admin/coupons', ['code' => 'X', 'type' => 'flat', 'value' => '1', 'trigger' => 'all', 'is_active' => true])
            ->assertRedirect();
        $this->assertDatabaseMissing('offers', ['code' => 'X']);
    }
}
