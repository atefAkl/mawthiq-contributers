<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\City;
use App\Models\Country;
use App\Models\Interview;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CountryAndCitySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CountryAndInterviewTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_public_can_fetch_countries_and_cities(): void
    {
        $this->seed(CountryAndCitySeeder::class);

        $response = $this->getJson('/api/public/countries');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'code', 'name_ar', 'name_en', 'phone_code', 'flag_emoji', 'sort_order'],
            ],
        ]);

        $saudi = Country::where('code', 'SA')->first();
        $this->assertNotNull($saudi);

        $citiesResponse = $this->getJson("/api/public/countries/{$saudi->id}/cities");
        $citiesResponse->assertStatus(200);
        $citiesResponse->assertJsonStructure([
            'country',
            'data' => [
                '*' => ['id', 'name_ar', 'name_en'],
            ],
        ]);
        $this->assertNotEmpty($citiesResponse->json('data'));
    }

    public function test_interview_auto_transitions_past_scheduled_to_missed(): void
    {
        $applicant = Applicant::create([
            'full_name' => 'محمد علي',
            'application_no' => 'APP-TEST-0001',
            'email' => 'test.missed@example.com',
            'phone' => '0501234567',
            'phone_code' => '+966',
            'country' => 'السعودية',
            'city' => 'الرياض',
            'position' => 'مطور واجهات',
            'status' => 'applicant',
        ]);

        // Scheduled 2 hours ago (past > 25 mins)
        $pastInterview = Interview::create([
            'applicant_id' => $applicant->id,
            'interviewer_id' => $this->user->id,
            'scheduled_at' => Carbon::now('Asia/Riyadh')->subHours(2),
            'status' => 'scheduled',
            'meeting_link' => 'https://meet.google.com/xyz',
        ]);

        // Access index as authenticated user
        $response = $this->actingAs($this->user)->getJson('/api/interviews');
        $response->assertStatus(200);

        // Verify the interview is transitioned to missed
        $this->assertDatabaseHas('interviews', [
            'id' => $pastInterview->id,
            'status' => 'missed',
        ]);

        // Stats should reflect missed count
        $this->assertGreaterThanOrEqual(1, $response->json('stats.missed'));
    }

    public function test_interview_can_be_updated_and_rescheduled(): void
    {
        $applicant = Applicant::create([
            'full_name' => 'سارة أحمد',
            'application_no' => 'APP-TEST-0002',
            'email' => 'sara@example.com',
            'phone' => '0559876543',
            'phone_code' => '+966',
            'position' => 'مصممة واجهات',
            'status' => 'applicant',
        ]);

        $interview = Interview::create([
            'applicant_id' => $applicant->id,
            'interviewer_id' => $this->user->id,
            'scheduled_at' => Carbon::now('Asia/Riyadh')->addDay(),
            'status' => 'scheduled',
        ]);

        $futureDate = Carbon::now('Asia/Riyadh')->addDays(3)->format('Y-m-d H:i');

        $response = $this->actingAs($this->user)->putJson("/api/interviews/{$interview->id}", [
            'scheduled_at' => $futureDate,
            'status' => 'scheduled',
            'meeting_link' => 'https://meet.google.com/new-link',
            'feedback' => 'تم تأجيل الموعد بناء على طلب المرشح',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('interviews', [
            'id' => $interview->id,
            'meeting_link' => 'https://meet.google.com/new-link',
            'feedback' => 'تم تأجيل الموعد بناء على طلب المرشح',
        ]);
    }

    public function test_interview_can_be_cancelled_with_reason(): void
    {
        $applicant = Applicant::create([
            'full_name' => 'خالد محمود',
            'application_no' => 'APP-TEST-0003',
            'email' => 'khaled@example.com',
            'phone' => '0512349876',
            'position' => 'مهندس جودة',
            'status' => 'applicant',
        ]);

        $interview = Interview::create([
            'applicant_id' => $applicant->id,
            'interviewer_id' => $this->user->id,
            'scheduled_at' => Carbon::now('Asia/Riyadh')->addDay(),
            'status' => 'scheduled',
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/interviews/{$interview->id}", [
            'status' => 'cancelled',
            'cancellation_reason' => 'تعذر التواصل مع المرشح والاعتذار عن الوظيفة',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('interviews', [
            'id' => $interview->id,
            'status' => 'cancelled',
            'cancellation_reason' => 'تعذر التواصل مع المرشح والاعتذار عن الوظيفة',
        ]);
    }

    public function test_applicant_phone_code_storage_on_creation(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/applicants', [
            'full_name' => 'يوسف كمال',
            'email' => 'yousef@example.com',
            'phone' => '1023456789',
            'phone_code' => '+20',
            'country' => 'مصر',
            'city' => 'القاهرة',
            'position' => 'مهندس بيانات',
            'status' => 'applicant',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('applicants', [
            'email' => 'yousef@example.com',
            'phone_code' => '+20',
            'country' => 'مصر',
        ]);
    }
}
