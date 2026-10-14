<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

use App\Models\User;
use App\Models\ExpenseCategory;
use App\Models\ExpenseItem;

class ExpenseItemTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_item()
    {
        $user = User::factory()->create();
        $cat = ExpenseCategory::create(['name' => 'Cat', 'created_by' => $user->id]);

        $response = $this->actingAs($user)->postJson('/api/expense-items', [
            'name' => 'Test Item',
            'category_id' => $cat->id,
            'amount' => 50.25,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('expense_items', ['name' => 'Test Item']);
    }

    public function test_can_list_items()
    {
        $user = User::factory()->create();
        $cat = ExpenseCategory::create(['name' => 'Cat', 'created_by' => $user->id]);
        ExpenseItem::create(['name' => 'Item1', 'category_id' => $cat->id, 'created_by' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/expense-items');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }
}
