<?php

namespace App\Services;

use App\Models\Interview;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiEvaluationService
{
    /**
     * Generate an AI-powered evaluation report and royal certificate text for an interview.
     */
    public static function generateReport(Interview $interview): array
    {
        $applicant = $interview->applicant;
        $interviewer = $interview->interviewer;
        $questions = is_array($interview->questions) ? $interview->questions : [];

        // Compile checklist findings & category scores
        $strengthsObserved = [];
        $gapsObserved = [];
        $categoryBreakdown = [];

        foreach ($questions as $q) {
            $cat = $q['category'] ?? 'عام';
            if (!isset($categoryBreakdown[$cat])) {
                $categoryBreakdown[$cat] = ['score' => 0, 'max' => 0];
            }
            $categoryBreakdown[$cat]['score'] += (float)($q['score'] ?? 0);
            $categoryBreakdown[$cat]['max'] += (float)($q['max_score'] ?? 10);

            $checklistItems = $q['checklist_items'] ?? [];
            $checkedIds = $q['checked_items'] ?? [];

            foreach ($checklistItems as $item) {
                $text = trim($item['text'] ?? '');
                if (empty($text)) continue;

                if (in_array($item['id'] ?? '', $checkedIds)) {
                    $strengthsObserved[] = $text . " (ضمن محور: {$cat})";
                } else {
                    $gapsObserved[] = $text . " (ضمن محور: {$cat})";
                }
            }

            if (!empty($q['notes'])) {
                $strengthsObserved[] = "ملاحظة المحكّم: " . $q['notes'];
            }
        }

        $percentage = (float)($interview->overall_percentage ?? 0);
        if ($percentage <= 0 && ($interview->max_score ?? 0) > 0) {
            $percentage = round((($interview->total_score ?? 0) / $interview->max_score) * 100, 1);
        }

        // Try Calling External AI (Gemini or OpenAI) if configured
        $aiApiKey = Setting::get('ai_api_key') ?: (Setting::get('gemini_api_key') ?: (Setting::get('openai_api_key') ?: env('OPENAI_API_KEY')));

        if (!empty($aiApiKey)) {
            try {
                $externalReport = self::callExternalAi($aiApiKey, $applicant, $interview, $categoryBreakdown, $strengthsObserved, $gapsObserved, $percentage);
                if ($externalReport) {
                    return $externalReport;
                }
            } catch (\Throwable $e) {
                Log::warning('External AI evaluation call failed, falling back to Mawthiq AI Core Engine: ' . $e->getMessage());
            }
        }

        // Intelligent Internal Rule-Based Synthesis Engine (Guaranteed Fallback)
        return self::synthesizeLocalReport($applicant, $interview, $categoryBreakdown, $strengthsObserved, $gapsObserved, $percentage);
    }

    /**
     * Synthesize using local intelligence engine
     */
    protected static function synthesizeLocalReport($applicant, $interview, array $categoryBreakdown, array $strengthsObserved, array $gapsObserved, float $percentage): array
    {
        $name = $applicant->full_name ?? 'المرشح';
        $position = $applicant->position ?? 'المسار التخصصي';
        $rec = $interview->recommendation ?? 'under_consideration';

        // 1. Executive Summary
        if ($percentage >= 85) {
            $summary = "أظهر المرشح/الشريك ({$name}) كفاءة استثنائية وجدارة متقدمة في مسار ({$position}) بنسبة إنجاز بلغت {$percentage}%. أثبتت المقابلة تحقيقه لمعظم المؤشرات الفنية والقيادية المتوقعة، مع جاهزية فورية للاندماج والمساهمة الفاعلة في منظومة موثق التقنية والاستثمارية.";
            $recText = "اعتماد مباشر كشريك استراتيجي ومساهم تقني رئيسي (Strong Hire).";
        } elseif ($percentage >= 70) {
            $summary = "حقق المرشح ({$name}) مستوى أداء قوياً بنسبة تقييم {$percentage}% في مسار ({$position}). أظهر استيعاباً جيداً للمتطلبات والمهام، مع امتلاكه قاعدة صلبة تؤهله للمشاركة الفعالة بعد استيفاء بعض الملاحظات البسيطة.";
            $recText = "قبول واعتماد الشراكة مع إسناد مهام موجهة (Hire).";
        } elseif ($percentage >= 50) {
            $summary = "قدم المرشح ({$name}) أداءً متوسطاً بنسبة {$percentage}% في مسار ({$position}). توجد مقومات إيجابية في بعض المحاور بينما تتطلب محاور أخرى تدريباً مكثفاً وإشرافاً دقيقاً قبل الاعتماد النهائي.";
            $recText = "فترة تجربة واختبار مع مراجعة إضافية بعد 30 يوماً (Under Consideration).";
        } else {
            $summary = "سجل المرشح ({$name}) نسبة تقييم {$percentage}% في مسار ({$position})، ولم تلبِ إجاباته الحد الأدنى من متطلبات الجدارة المعتمدة للمساهمة في المنصة.";
            $recText = "عدم الاعتماد في المرحلة الحالية مع إمكانية إعادة التقديم مستقبلاً (Reject).";
        }

        // 2. Strengths
        $strengths = !empty($strengthsObserved)
            ? array_slice($strengthsObserved, 0, 5)
            : [
                "الالتزام بالمعايير المهنية الأساسية والتفاعل الإيجابي أثناء المقابلة.",
                "وضوح الرؤية المهنية والرغبة في المساهمة في مشاريع منصة موثق.",
                "المرونة والقدرة على مواكبة المتطلبات التقنية والتنظيمية.",
            ];

        // 3. Areas for Development
        $development = !empty($gapsObserved)
            ? array_slice($gapsObserved, 0, 4)
            : [
                "تعميق الممارسة التطبيقية في الجوانب المعمارية للمشاريع الكبرى.",
                "تعزيز دقة التقديرات الزمنية ومؤشرات الإنجاز المباشرة.",
            ];

        // 4. Royal Golden Certificate Text (Calligraphy Style)
        $certText = "تشهد إدارة منصة «موثِق» ومجلس التحكيم والاعتماد بأنّ الشريك: {$name}، قد اجتاز بنجاح واقتدار كافة مراحل التقييم والمقابلة المقررة لمسار ({$position}) بمعدل جدارة ({$percentage}%)، واستوفى معايير الكفاءة المهنية والالتزام المؤسسي المقررة للشراكة، وبناءً عليه مُنح هذه الشهادة المعتمدة تقديراً لتميزه وجدارته في منظومتنا.";

        return [
            'executive_summary' => $summary,
            'recommendation_text' => $recText,
            'strengths' => $strengths,
            'areas_for_development' => $development,
            'certificate_text' => $certText,
            'overall_percentage' => $percentage,
            'generated_at' => now()->toIso8601String(),
            'model' => 'Mawthiq AI Core Engine',
        ];
    }

    /**
     * Call External OpenAI / Gemini API if configured
     */
    protected static function callExternalAi(string $apiKey, $applicant, $interview, array $categoryBreakdown, array $strengths, array $gaps, float $percentage): ?array
    {
        $prompt = "أنت مستشار أول لتقييم الكفاءات والشراكات لمنصة «موثِق». قم بتحليل نتائج مقابلة الشريك التالية وأخرج تقريراً تنفيذياً بصيغة JSON:\n";
        $prompt .= "اسم المرشح: " . ($applicant->full_name ?? '') . "\n";
        $prompt .= "المسار/التخصص: " . ($applicant->position ?? '') . "\n";
        $prompt .= "نسبة الإنجاز الإجمالية: {$percentage}%\n";
        $prompt .= "النقاط المحققة من قائمة التحقق: " . implode("، ", array_slice($strengths, 0, 8)) . "\n";
        $prompt .= "النقاط التي لم تتحقق: " . implode("، ", array_slice($gaps, 0, 6)) . "\n";
        $prompt .= "ملاحظات المحكّم: " . ($interview->feedback ?? 'لا توجد') . "\n";
        $prompt .= "\nالمطلوب إخراج كائن JSON فقط بالبنية التالية دون أي نصوص إضافية:\n";
        $prompt .= '{"executive_summary":"...","recommendation_text":"...","strengths":["...","..."],"areas_for_development":["...","..."],"certificate_text":"..."}';

        // Check if OpenAI key (starts with sk-)
        if (str_starts_with($apiKey, 'sk-')) {
            $response = Http::withToken($apiKey)->timeout(15)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are an executive HR and talent partner evaluation consultant.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.4,
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                $cleaned = preg_replace('/```json|```/', '', $content);
                $decoded = json_decode(trim($cleaned), true);
                if (is_array($decoded) && !empty($decoded['executive_summary'])) {
                    $decoded['generated_at'] = now()->toIso8601String();
                    $decoded['model'] = 'OpenAI GPT-4o';
                    $decoded['overall_percentage'] = $percentage;
                    return $decoded;
                }
            }
        } else {
            // Google Gemini API call
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}";
            $response = Http::timeout(15)->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $content = $response->json('candidates.0.content.parts.0.text');
                $cleaned = preg_replace('/```json|```/', '', $content);
                $decoded = json_decode(trim($cleaned), true);
                if (is_array($decoded) && !empty($decoded['executive_summary'])) {
                    $decoded['generated_at'] = now()->toIso8601String();
                    $decoded['model'] = 'Google Gemini';
                    $decoded['overall_percentage'] = $percentage;
                    return $decoded;
                }
            }
        }

        return null;
    }
}
