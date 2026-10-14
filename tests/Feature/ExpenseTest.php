<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_expenses(): void
    {
        $response = $this->get('/expenses');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_access_expenses_index(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->get('/expenses');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_expense(): void
    {
        $user = User::factory()->create();
        $category = Category::create(['name' => 'Test Category']);

        $expenseData = [
            'amount' => 100.50,
            'description' => 'Test Expense',
            'date' => '2026-09-11',
            'category_id' => $category->id,
            'recorded_by' => $user->id,
        ];

        $response = $this->actingAs($user)->post('/expenses', $expenseData);

        $response->assertRedirect('/expenses');
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('expenses', [
            'amount' => 100.50,
            'description' => 'Test Expense',
            'category_id' => $category->id,
            'recorded_by' => $user->id,
        ]);
    }

    public function test_expense_creation_requires_valid_data(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/expenses', [
            'amount' => -10,
            'description' => '',
            'recorded_by' => '',
        ]);

        $response->assertSessionHasErrors(['amount', 'description', 'date', 'category_id', 'recorded_by']);
    }
}
