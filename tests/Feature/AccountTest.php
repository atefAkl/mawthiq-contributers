<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

use App\Models\User;
use App\Models\Account;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_account()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/accounts', [
            'name' => 'Bank Account',
            'type' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('accounts', ['name' => 'Bank Account']);
    }

    public function test_can_list_accounts()
    {
        $user = User::factory()->create();
        Account::create(['name' => 'Acc1', 'created_by' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/accounts');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }
}
