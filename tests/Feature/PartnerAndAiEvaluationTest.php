<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\Interview;
use App\Models\Role;
use App\Models\ScorecardTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PartnerAndAiEvaluationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure roles exist
        Role::firstOrCreate(
            ['name' => 'admin'],
            ['display_name_ar' => 'مدير النظام', 'display_name_en' => 'System Admin', 'permissions' => ['*']]
        );
        Role::firstOrCreate(
            ['name' => 'contributor'],
            ['display_name_ar' => 'شريك / مساهم', 'display_name_en' => 'Partner / Contributor', 'permissions' => ['partner.view']]
        );
    }

    public function test_scorecard_template_supports_checklist_items()
    {
        $admin = User::factory()->create([
            'role_id' => Role::where('name', 'admin')->first()->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/scorecard-templates', [
            'title' => 'تقييم مطور برمجيات متقدم',
            'position' => 'Senior Backend Developer',
            'description' => 'نموذج لاختبار الكفاءة المعمارية وقوائم التحقق',
            'is_active' => true,
            'questions' => [
                [
                    'id' => 'q_1',
                    'question' => 'كيف تصمم معمارية Microservices في بيئة عالية الأحمال؟',
                    'category' => 'المهارات الفنية',
                    'expected_answer' => 'الحديث عن Message Queues و Caching',
                    'answer_weaknesses' => 'تجاهل معالجة الأخطاء والـ Idempotency',
                    'max_score' => 20,
                    'checklist_items' => [
                        ['id' => 'chk_1', 'text' => 'استخدام Redis/Memcached للتخزين المؤقت', 'weight' => 10],
                        ['id' => 'chk_2', 'text' => 'تطبيق Kafka أو RabbitMQ للمراسلة غير المتزامنة', 'weight' => 10],
                    ],
                ]
            ]
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('scorecard_templates', [
            'title' => 'تقييم مطور برمجيات متقدم',
        ]);

        $tpl = ScorecardTemplate::where('title', 'تقييم مطور برمجيات متقدم')->first();
        $this->assertCount(1, $tpl->questions);
        $this->assertCount(2, $tpl->questions[0]['checklist_items']);
    }

    public function test_interview_auto_calculates_score_from_checklist_checked_items()
    {
        $admin = User::factory()->create([
            'role_id' => Role::where('name', 'admin')->first()->id,
        ]);

        $applicant = Applicant::create([
            'application_no' => 'APP-TEST-001',
            'full_name' => 'طارق عبد الله',
            'email' => 'tariq.test@example.com',
            'phone' => '0551234567',
            'position' => 'Fullstack Developer',
            'status' => 'applicant',
        ]);

        $interview = Interview::create([
            'applicant_id' => $applicant->id,
            'interviewer_id' => $admin->id,
            'scheduled_at' => now()->addDays(2),
            'interview_type' => 'online',
            'meeting_link' => 'https://meet.google.com/abc-defg-hij',
            'status' => 'scheduled',
            'questions' => [
                [
                    'id' => 'q_1',
                    'question' => 'معايير جودة الكود',
                    'category' => 'فني',
                    'max_score' => 10,
                    'checklist_items' => [
                        ['id' => 'chk_1', 'text' => 'كتابة اختبارات الوحدة (Unit Testing)', 'weight' => 5],
                        ['id' => 'chk_2', 'text' => 'مراعاة مبادئ SOLID', 'weight' => 5],
                    ],
                    'checked_items' => [],
                    'score' => null,
                ]
            ],
            'max_score' => 10,
        ]);

        // Interviewer checks chk_1 only (score should auto-compute to 5)
        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/interviews/{$interview->id}/questions", [
            'questions' => [
                [
                    'id' => 'q_1',
                    'question' => 'معايير جودة الكود',
                    'category' => 'فني',
                    'max_score' => 10,
                    'checklist_items' => [
                        ['id' => 'chk_1', 'text' => 'كتابة اختبارات الوحدة (Unit Testing)', 'weight' => 5],
                        ['id' => 'chk_2', 'text' => 'مراعاة مبادئ SOLID', 'weight' => 5],
                    ],
                    'checked_items' => ['chk_1'],
                ]
            ],
            'status' => 'completed',
        ]);

        $response->assertStatus(200);
        $fresh = $interview->fresh();
        $this->assertEquals(5, $fresh->total_score);
        $this->assertEquals(50, $fresh->overall_percentage);
    }

    public function test_ai_evaluation_report_generation_and_royal_certificate()
    {
        $admin = User::factory()->create([
            'role_id' => Role::where('name', 'admin')->first()->id,
        ]);

        $applicant = Applicant::create([
            'application_no' => 'APP-TEST-002',
            'full_name' => 'سارة خالد المنصور',
            'email' => 'sara.test@example.com',
            'phone' => '0559876543',
            'position' => 'AI Engineer',
            'status' => 'participant',
        ]);

        $interview = Interview::create([
            'applicant_id' => $applicant->id,
            'interviewer_id' => $admin->id,
            'scheduled_at' => now()->subDay(),
            'conducted_at' => now()->subDay(),
            'interview_type' => 'online',
            'status' => 'completed',
            'total_score' => 90,
            'max_score' => 100,
            'overall_percentage' => 90,
            'recommendation' => 'strong_hire',
            'feedback' => 'مرشحة ممتازة ذات خلفية قوية في هندسة النماذج اللغوية.',
            'questions' => [
                [
                    'id' => 'q_1',
                    'question' => 'التعامل مع الـ Embeddings والـ Vector Databases',
                    'category' => 'الذكاء الاصطناعي',
                    'max_score' => 100,
                    'score' => 90,
                    'checklist_items' => [
                        ['id' => 'chk_1', 'text' => 'خبرة مثبتة في pgvector أو Milvus', 'weight' => 50],
                        ['id' => 'chk_2', 'text' => 'إتقان تقنيات RAG المتقدمة', 'weight' => 40],
                    ],
                    'checked_items' => ['chk_1', 'chk_2'],
                ]
            ]
        ]);

        // Generate AI Report
        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/interviews/{$interview->id}/generate-ai-report");
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'ai_report' => [
                'executive_summary',
                'recommendation_text',
                'strengths',
                'areas_for_development',
                'certificate_text',
                'overall_percentage',
            ]
        ]);

        // Retrieve report data
        $reportRes = $this->actingAs($admin, 'sanctum')->getJson("/api/interviews/{$interview->id}/report-data");
        $reportRes->assertStatus(200);
        $this->assertNotEmpty($reportRes->json('ai_report.certificate_text'));
        $this->assertStringContainsString('سارة خالد المنصور', $reportRes->json('ai_report.certificate_text'));
    }

    public function test_agenda_data_endpoint_provides_riyadh_time_and_stages()
    {
        $admin = User::factory()->create([
            'role_id' => Role::where('name', 'admin')->first()->id,
        ]);

        $applicant = Applicant::create([
            'application_no' => 'APP-TEST-003',
            'full_name' => 'فيصل الأحمدي',
            'email' => 'faisal.test@example.com',
            'phone' => '0551122334',
            'position' => 'DevOps Architect',
        ]);

        $interview = Interview::create([
            'applicant_id' => $applicant->id,
            'interviewer_id' => $admin->id,
            'scheduled_at' => '2026-11-01 14:00:00',
            'interview_type' => 'online',
            'meeting_link' => 'https://meet.google.com/xyz-uvwx-rst',
            'status' => 'scheduled',
        ]);

        $res = $this->actingAs($admin, 'sanctum')->getJson("/api/interviews/{$interview->id}/agenda-data");
        $res->assertStatus(200);
        $res->assertJsonFragment([
            'applicant_name' => 'فيصل الأحمدي',
            'position' => 'DevOps Architect',
            'meeting_link' => 'https://meet.google.com/xyz-uvwx-rst',
        ]);
        $this->assertStringContainsString('بتوقيت الرياض', $res->json('time_window'));
    }

    public function test_partner_portal_auth_and_privacy_scoping()
    {
        $contributorRole = Role::where('name', 'contributor')->first();

        $partnerUser = User::create([
            'name' => 'هند القحطاني',
            'email' => 'hind.test@example.com',
            'password' => Hash::make('Password@123'),
            'role_id' => $contributorRole->id,
            'status' => 'active',
        ]);

        $applicant = Applicant::create([
            'user_id' => $partnerUser->id,
            'application_no' => 'APP-HIND-001',
            'full_name' => 'هند القحطاني',
            'email' => 'hind.test@example.com',
            'phone' => '0559988776',
            'position' => 'UI/UX Lead',
            'internal_notes' => 'ملاحظة سرية جداً خاصة بالإدارة فقط',
            'rejection_reason' => 'سرية',
            'rating' => 4.5,
        ]);

        // 1. Partner Login with password
        $loginRes = $this->postJson('/api/partner/login', [
            'email' => 'hind.test@example.com',
            'password' => 'Password@123',
        ]);
        $loginRes->assertStatus(200);
        $token = $loginRes->json('token');
        $this->assertNotEmpty($token);

        // 2. Partner Profile Scoping (Never leaks internal_notes or rating)
        $profileRes = $this->withHeader('Authorization', 'Bearer ' . $token)->getJson('/api/partner/profile');
        $profileRes->assertStatus(200);
        $profileRes->assertJsonMissing(['internal_notes' => 'ملاحظة سرية جداً خاصة بالإدارة فقط']);
        $profileRes->assertJsonMissing(['rating' => 4.5]);
        $profileRes->assertJsonFragment(['full_name' => 'هند القحطاني']);

        // 3. Request OTP
        $otpRes = $this->postJson('/api/partner/send-otp', [
            'email' => 'hind.test@example.com',
        ]);
        $otpRes->assertStatus(200);

        $freshUser = $partnerUser->fresh();
        $this->assertNotEmpty($freshUser->otp_code);

        // 4. Verify OTP
        $verifyRes = $this->postJson('/api/partner/verify-otp', [
            'email' => 'hind.test@example.com',
            'otp_code' => $freshUser->otp_code,
        ]);
        $verifyRes->assertStatus(200);
        $this->assertNotEmpty($verifyRes->json('token'));
    }
}
