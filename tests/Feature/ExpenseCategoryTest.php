<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

use App\Models\User;
use App\Models\ExpenseCategory;

class ExpenseCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_category()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/expense-categories', [
            'name' => 'Test Category',
            'description' => 'Test Description',
            'type' => 'some_type',
            'active' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('expense_categories', ['name' => 'Test Category']);
    }

    public function test_can_list_categories()
    {
        $user = User::factory()->create();
        ExpenseCategory::create(['name' => 'Cat1', 'created_by' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/expense-categories');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }
}
