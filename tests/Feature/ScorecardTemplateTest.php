<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\Interview;
use App\Models\ScorecardTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScorecardTemplateTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_authenticated_user_can_list_scorecard_templates(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/scorecard-templates');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'stats' => ['total', 'active', 'avg_score'],
            ]);
    }

    public function test_authenticated_user_can_create_scorecard_template_with_expected_answer_and_weaknesses(): void
    {
        $payload = [
            'title' => 'كرت تقييم مهندس برمجيات متقدم',
            'position' => 'Full Stack Developer',
            'description' => 'نموذج تقييم فني شامل',
            'is_active' => true,
            'questions' => [
                [
                    'id' => 'q_test_1',
                    'question' => 'كيف تتعامل مع أمان مصادقة API ومعالجة التوكنات؟',
                    'category' => 'الأمان الفني',
                    'expected_answer' => '<h3>المعايير المطلوبة:</h3><ul><li>استخدام Sanctum / JWT مع فترات صلاحية قصيرة</li><li>تطبيق Rate Limiting</li></ul>',
                    'answer_weaknesses' => '<h4>مؤشرات الضعف:</h4><ul><li>تخزين التوكن في LocalStorage بدون حماية XSS</li><li>عدم معرفة CORS أو CSRF</li></ul>',
                    'max_score' => 50,
                ],
                [
                    'id' => 'q_test_2',
                    'question' => 'اشرح كيفية تحسين استعلامات قاعدة البيانات البطيئة.',
                    'category' => 'قواعد البيانات',
                    'expected_answer' => '<p>استخدام EXPLAIN، إضافة فهارس Indexes، وتفادي مشكلة N+1.</p>',
                    'answer_weaknesses' => '<p>اقتراح جلب جميع السجلات والفلترة داخل كود PHP.</p>',
                    'max_score' => 50,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/scorecard-templates', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('template.title', 'كرت تقييم مهندس برمجيات متقدم')
            ->assertJsonPath('template.total_max_score', 100);

        $created = ScorecardTemplate::where('title', 'كرت تقييم مهندس برمجيات متقدم')->first();
        $this->assertNotNull($created);
        $this->assertCount(2, $created->questions);
        $this->assertEquals(
            '<h4>مؤشرات الضعف:</h4><ul><li>تخزين التوكن في LocalStorage بدون حماية XSS</li><li>عدم معرفة CORS أو CSRF</li></ul>',
            $created->questions[0]['answer_weaknesses']
        );
        $this->assertEquals(
            '<h3>المعايير المطلوبة:</h3><ul><li>استخدام Sanctum / JWT مع فترات صلاحية قصيرة</li><li>تطبيق Rate Limiting</li></ul>',
            $created->questions[0]['expected_answer']
        );
    }

    public function test_authenticated_user_can_update_scorecard_template_weaknesses(): void
    {
        $template = ScorecardTemplate::create([
            'title' => 'كرت تقييم تجريبي للتعديل',
            'position' => 'Backend Developer',
            'total_max_score' => 20,
            'questions' => [
                [
                    'id' => 'q_1',
                    'question' => 'سؤال أصلي',
                    'category' => 'عام',
                    'expected_answer' => 'إجابة أصلية',
                    'answer_weaknesses' => 'نقطة ضعف أولية',
                    'max_score' => 20,
                ],
            ],
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        $updatePayload = [
            'title' => 'كرت تقييم معدل',
            'position' => 'Senior Backend Developer',
            'is_active' => true,
            'questions' => [
                [
                    'id' => 'q_1',
                    'question' => 'سؤال محدث',
                    'category' => 'المعمارية',
                    'expected_answer' => '<p>إجابة نموذجية محدثة</p>',
                    'answer_weaknesses' => '<ul><li>ضعف في فهم معمارية الميكروسيرفس</li><li>تجاهل المرونة والتكرار</li></ul>',
                    'max_score' => 30,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/api/scorecard-templates/{$template->id}", $updatePayload);

        $response->assertStatus(200);

        $template->refresh();
        $this->assertEquals('كرت تقييم معدل', $template->title);
        $this->assertEquals(
            '<ul><li>ضعف في فهم معمارية الميكروسيرفس</li><li>تجاهل المرونة والتكرار</li></ul>',
            $template->questions[0]['answer_weaknesses']
        );
    }

    public function test_interview_creation_copies_expected_answer_and_weaknesses_from_template(): void
    {
        $template = ScorecardTemplate::create([
            'title' => 'كرت تقييم لجدولة المقابلة',
            'total_max_score' => 40,
            'questions' => [
                [
                    'id' => 'q_tmpl_1',
                    'question' => 'كيف تبني نظام طوابير (Queues) لمعالجة الرسائل؟',
                    'category' => 'الأداء',
                    'expected_answer' => '<p>استخدام Redis أو RabbitMQ مع معالجة الأخطاء وإعادة المحاولة.</p>',
                    'answer_weaknesses' => '<p>معالجة الرسائل الثقيلة بشكل متزامن داخل طلب الويب الرئيسي.</p>',
                    'max_score' => 40,
                ],
            ],
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        $applicant = Applicant::create([
            'full_name' => 'أحمد مرشح تجريبي',
            'email' => 'ahmed.test.' . time() . '@example.com',
            'phone' => '01012345678',
            'position' => 'Backend Developer',
            'status' => 'applicant',
            'application_no' => 'APP-TEST-' . time(),
        ]);

        $interviewPayload = [
            'applicant_id' => $applicant->id,
            'scheduled_at' => now()->addDays(2)->format('Y-m-d H:i:s'),
            'interview_type' => 'online',
            'meeting_link' => 'https://meet.google.com/abc-test-xyz',
            'scorecard_template_id' => $template->id,
            'interviewer_id' => $this->user->id,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/interviews', $interviewPayload);

        $response->assertStatus(201);

        $interview = Interview::where('applicant_id', $applicant->id)->latest()->first();
        $this->assertNotNull($interview);
        $this->assertNotNull($interview->questions);
        $this->assertEquals(
            '<p>معالجة الرسائل الثقيلة بشكل متزامن داخل طلب الويب الرئيسي.</p>',
            $interview->questions[0]['answer_weaknesses']
        );
        $this->assertEquals(
            '<p>استخدام Redis أو RabbitMQ مع معالجة الأخطاء وإعادة المحاولة.</p>',
            $interview->questions[0]['expected_answer']
        );
    }
}
