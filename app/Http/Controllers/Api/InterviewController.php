<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\AppNotification;
use App\Models\EmailLog;
use App\Models\Interview;
use App\Models\ScorecardTemplate;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    public function index(Request $request)
    {
        // Auto-detect and transition past scheduled interviews (> 25 min window) to 'missed'
        try {
            $pastCutoff = Carbon::now()->subMinutes(25);
            Interview::where('status', 'scheduled')
                ->where('scheduled_at', '<', $pastCutoff)
                ->update(['status' => 'missed']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed auto-transitioning past scheduled interviews to missed: ' . $e->getMessage());
        }

        $query = Interview::with(['applicant', 'interviewer', 'scorecardTemplate'])->orderBy('scheduled_at', 'desc');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('applicant_id')) {
            $query->where('applicant_id', $request->applicant_id);
        }

        if ($request->filled('interviewer_id')) {
            $query->where('interviewer_id', $request->interviewer_id);
        }

        $interviews = $query->paginate($request->get('per_page', 20));

        $stats = [
            'total' => Interview::count(),
            'scheduled' => Interview::where('status', 'scheduled')->count(),
            'missed' => Interview::where('status', 'missed')->count(),
            'completed' => Interview::where('status', 'completed')->count(),
            'cancelled' => Interview::where('status', 'cancelled')->count(),
        ];

        return response()->json([
            'data' => $interviews->items(),
            'current_page' => $interviews->currentPage(),
            'last_page' => $interviews->lastPage(),
            'total' => $interviews->total(),
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'applicant_id' => 'required|exists:applicants,id',
            'scheduled_at' => 'required|date',
            'interview_type' => 'required|in:online,in_person,phone',
            'meeting_link' => 'nullable|url',
            'location' => 'nullable|string|max:255',
            'interviewer_id' => 'nullable|exists:users,id',
            'scorecard_template_id' => 'nullable|exists:scorecard_templates,id',
            'send_invitation_email' => 'nullable|boolean',
        ]);

        // Auto-generate meeting link if empty and online
        if ($validated['interview_type'] === 'online' && empty($validated['meeting_link'])) {
            $validated['meeting_link'] = 'https://meet.google.com/' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 3) . '-' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 4) . '-' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 3);
        }

        // Prevent duplicate scheduling if submitted multiple times rapidly
        $existing = Interview::where('applicant_id', $validated['applicant_id'])
            ->where('scheduled_at', $validated['scheduled_at'])
            ->where('status', 'scheduled')
            ->first();
        if ($existing) {
            return response()->json([
                'message' => 'تم جدولة هذه المقابلة بالفعل لهذا المتقدم في هذا الموعد.',
                'interview' => $existing,
            ], 200);
        }

        $interviewerId = $validated['interviewer_id'] ?? $request->user()->id;
        $scheduledTime = Carbon::parse($validated['scheduled_at']);

        // Prevent double booking conflicts (within 25 minutes active interview unit) unless explicitly forced
        $conflict = Interview::where('interviewer_id', $interviewerId)
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_at', [
                $scheduledTime->copy()->subMinutes(25),
                $scheduledTime->copy()->addMinutes(25),
            ])
            ->with('applicant:id,full_name,application_no')
            ->first();

        if ($conflict && !$request->boolean('force_conflict', false)) {
            $conflictName = $conflict->applicant->full_name ?? 'متقدم آخر';
            $conflictTime = $conflict->scheduled_at ? $conflict->scheduled_at->format('Y-m-d H:i') : '';
            return response()->json([
                'message' => "تنبيه: يوجد تضارب في المواعيد! المحكّم لديه مقابلة أخرى مجدولة بالفعل مع ({$conflictName}) في توقيت متقارب ({$conflictTime}). يمكنك اختيار موعد آخر أو تأكيد الحفظ على أي حال.",
                'has_conflict' => true,
                'conflict_time' => $conflictTime,
            ], 422);
        }

        // Initialize questions from scorecard template if chosen
        $initialQuestions = null;
        $maxScore = null;
        if (!empty($validated['scorecard_template_id'])) {
            $template = ScorecardTemplate::find($validated['scorecard_template_id']);
            if ($template && is_array($template->questions)) {
                $maxScore = $template->total_max_score;
                $initialQuestions = array_map(function ($q, $index) {
                    return [
                        'id' => $q['id'] ?? ('q_' . ($index + 1)),
                        'question' => $q['question'],
                        'category' => $q['category'] ?? 'عام',
                        'expected_answer' => $q['expected_answer'] ?? '',
                        'answer_weaknesses' => $q['answer_weaknesses'] ?? '',
                        'checklist_items' => $q['checklist_items'] ?? [],
                        'checked_items' => [],
                        'max_score' => (float)($q['max_score'] ?? 10),
                        'score' => null,
                        'notes' => '',
                    ];
                }, $template->questions, array_keys($template->questions));
            }
        }

        $interview = Interview::create([
            'applicant_id' => $validated['applicant_id'],
            'scorecard_template_id' => $validated['scorecard_template_id'] ?? null,
            'scheduled_at' => $validated['scheduled_at'],
            'interview_type' => $validated['interview_type'],
            'meeting_link' => $validated['meeting_link'] ?? null,
            'location' => $validated['location'] ?? null,
            'interviewer_id' => $interviewerId,
            'status' => 'scheduled',
            'questions' => $initialQuestions,
            'max_score' => $maxScore,
        ]);

        $applicant = Applicant::find($validated['applicant_id']);

        // If candidate is still 'applicant', promote to 'participant'
        if ($applicant && $applicant->status === 'applicant') {
            $applicant->update(['status' => 'participant']);
            $applicant->statusLogs()->create([
                'from_status' => 'applicant',
                'to_status' => 'participant',
                'changed_by' => $request->user()->id,
                'notes' => 'تم الترقية إلى مشارك نظراً لجدولة المقابلة الشخصية.',
            ]);
        }

        // Send email invitation log
        if ($applicant && $request->boolean('send_invitation_email', true)) {
            $scheduledCarbon = Carbon::parse($validated['scheduled_at'])->setTimezone('Asia/Riyadh');
            $dateFormatted = $scheduledCarbon->format('Y-m-d H:i');
            $endTimeFormatted = $scheduledCarbon->copy()->addMinutes(25)->format('H:i');
            $body = "عزيزي {$applicant->full_name}،\n\nيسعدنا إبلاغك بتحديد موعد مقابلتك الشخصية لوظيفة ({$applicant->position}).\nالموعد: {$dateFormatted} (إلى {$endTimeFormatted}) بتوقيت الشرق الأوسط (الرياض - GMT+3)\nالمدة: 25 دقيقة نشطة\nنوع المقابلة: " . ($validated['interview_type'] === 'online' ? 'عبر الإنترنت (أونلاين)' : 'حضورياً') . "\n";
            if (!empty($validated['meeting_link'])) {
                $body .= "رابط المقابلة: {$validated['meeting_link']}\n";
            }
            $body .= "\nيرجى التواجد في الموعد المحدد.\nفريق العمل";

            EmailLog::create([
                'applicant_id' => $applicant->id,
                'sender_email' => Setting::get('mail_from_address', 'recruitment@contributors.app'),
                'recipient_email' => $applicant->email,
                'subject' => "دعوة لحضور المقابلة الشخصية [{$applicant->application_no}]",
                'body' => $body,
                'type' => 'sent',
                'status' => 'delivered',
                'template_name' => 'interview_invitation',
                'sent_by' => $request->user()->id,
            ]);
        }

        // Notify interviewer if assigned
        if (!empty($validated['interviewer_id']) && $validated['interviewer_id'] != $request->user()->id) {
            AppNotification::create([
                'user_id' => $validated['interviewer_id'],
                'title' => 'مقابلة جديدة مسندة إليك',
                'message' => "تم إسناد مقابلة المتقدم {$applicant->full_name} بتاريخ {$validated['scheduled_at']}.",
                'type' => 'info',
                'action_url' => '/interviews',
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'تمت جدولة المقابلة وإشعار المتقدم بنجاح.',
            'interview' => $interview->load(['applicant', 'interviewer']),
        ], 201);
    }

    /**
     * Requirement: تسجيل نتائج المقابلة والتقييم
     */
    public function recordResult(Request $request, $id)
    {
        $interview = Interview::findOrFail($id);

        $validated = $request->validate([
            'technical_score' => 'required|integer|min:1|max:10',
            'communication_score' => 'required|integer|min:1|max:10',
            'commitment_score' => 'required|integer|min:1|max:10',
            'recommendation' => 'required|in:strong_hire,hire,under_consideration,reject',
            'feedback' => 'required|string|max:3000',
            'questions' => 'nullable|array',
            'promote_to_status' => 'nullable|in:probation,accepted,rejected,participant',
        ]);

        // Calculate average overall score out of 10
        $overall = round(($validated['technical_score'] + $validated['communication_score'] + $validated['commitment_score']) / 3, 2);

        $interview->update([
            'status' => 'completed',
            'technical_score' => $validated['technical_score'],
            'communication_score' => $validated['communication_score'],
            'commitment_score' => $validated['commitment_score'],
            'overall_score' => $overall,
            'recommendation' => $validated['recommendation'],
            'feedback' => $validated['feedback'],
            'questions' => $validated['questions'] ?? $interview->questions,
            'conducted_at' => Carbon::now(),
        ]);

        $applicant = $interview->applicant;
        if ($applicant) {
            // Update applicant rating (scaled from 10 to 5)
            $applicant->rating = round($overall / 2, 1);
            $applicant->save();

            // Optionally promote candidate directly from interview scorecard
            if (!empty($validated['promote_to_status']) && $validated['promote_to_status'] !== $applicant->status) {
                $oldStatus = $applicant->status;
                $applicant->status = $validated['promote_to_status'];
                $applicant->save();

                $applicant->statusLogs()->create([
                    'from_status' => $oldStatus,
                    'to_status' => $validated['promote_to_status'],
                    'changed_by' => $request->user()->id,
                    'notes' => 'ترقية تلقائية بناءً على نتيجة المقابلة الشخصية (التقييم: ' . $overall . '/10 - التوصية: ' . $validated['recommendation'] . ')',
                ]);
            }
        }

        return response()->json([
            'message' => 'تم حفظ نتائج وتقييم المقابلة بنجاح.',
            'interview' => $interview->load(['applicant', 'interviewer']),
        ]);
    }

    public function show($id)
    {
        $interview = Interview::with(['applicant', 'interviewer', 'scorecardTemplate'])->findOrFail($id);

        return response()->json([
            'interview' => $interview,
        ]);
    }

    public function update(Request $request, $id)
    {
        $interview = Interview::with('applicant')->findOrFail($id);

        $validated = $request->validate([
            'scheduled_at' => 'nullable|date',
            'interview_type' => 'nullable|in:online,in_person,phone',
            'meeting_link' => 'nullable|url',
            'location' => 'nullable|string|max:255',
            'interviewer_id' => 'nullable|exists:users,id',
            'scorecard_template_id' => 'nullable',
            'status' => 'nullable|in:scheduled,completed,cancelled,rescheduled,missed',
            'feedback' => 'nullable|string|max:2000',
            'cancellation_reason' => 'nullable|string|max:1000',
            'send_update_email' => 'nullable|boolean',
            'send_cancellation_email' => 'nullable|boolean',
            'force_conflict' => 'nullable|boolean',
        ]);

        // Prevent modifying scheduled_at if already completed
        if ($interview->status === 'completed' && isset($validated['scheduled_at']) && $validated['scheduled_at'] != $interview->scheduled_at) {
            return response()->json([
                'message' => 'لا يمكن تعديل موعد مقابلة مكتملة تم رصد نتائجها مسبقاً.',
            ], 422);
        }

        // Auto-generate meeting link if empty and online
        if (($validated['interview_type'] ?? $interview->interview_type) === 'online' && empty($validated['meeting_link']) && empty($interview->meeting_link)) {
            $validated['meeting_link'] = 'https://meet.google.com/' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 3) . '-' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 4) . '-' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 3);
        }

        // Check for double booking conflict if schedule or interviewer changes
        if (isset($validated['scheduled_at'])) {
            $interviewerId = $validated['interviewer_id'] ?? $interview->interviewer_id;
            $scheduledTime = Carbon::parse($validated['scheduled_at']);

            // If rescheduling to a future time from 'missed', auto-restore status to 'scheduled'
            if ($scheduledTime->isFuture() && in_array($interview->status, ['missed', 'scheduled'])) {
                $validated['status'] = 'scheduled';
            }

            $conflict = Interview::where('id', '!=', $interview->id)
                ->where('interviewer_id', $interviewerId)
                ->where('status', 'scheduled')
                ->whereBetween('scheduled_at', [
                    $scheduledTime->copy()->subMinutes(25),
                    $scheduledTime->copy()->addMinutes(25),
                ])
                ->with('applicant:id,full_name,application_no')
                ->first();

            if ($conflict && !$request->boolean('force_conflict', false)) {
                $conflictName = $conflict->applicant->full_name ?? 'متقدم آخر';
                $conflictTime = $conflict->scheduled_at ? $conflict->scheduled_at->format('Y-m-d H:i') : '';
                return response()->json([
                    'message' => "تنبيه: يوجد تضارب في المواعيد! المحكّم لديه مقابلة أخرى مجدولة بالفعل مع ({$conflictName}) في توقيت متقارب ({$conflictTime}). يمكنك اختيار موعد آخر أو تأكيد الحفظ على أي حال.",
                    'has_conflict' => true,
                    'conflict_time' => $conflictTime,
                ], 422);
            }
        }

        // Synchronize scorecard template questions if changed
        if (array_key_exists('scorecard_template_id', $validated)) {
            $newTemplateId = $validated['scorecard_template_id'];
            if (!empty($newTemplateId) && $newTemplateId != $interview->scorecard_template_id) {
                $template = ScorecardTemplate::find($newTemplateId);
                if ($template && is_array($template->questions)) {
                    $validated['max_score'] = $template->total_max_score;
                    $validated['questions'] = array_map(function ($q, $index) {
                        return [
                            'id' => $q['id'] ?? ('q_' . ($index + 1)),
                            'question' => $q['question'],
                            'category' => $q['category'] ?? 'عام',
                            'expected_answer' => $q['expected_answer'] ?? '',
                            'answer_weaknesses' => $q['answer_weaknesses'] ?? '',
                            'checklist_items' => $q['checklist_items'] ?? [],
                            'checked_items' => [],
                            'max_score' => (float)($q['max_score'] ?? 10),
                            'score' => null,
                            'notes' => '',
                        ];
                    }, $template->questions, array_keys($template->questions));
                }
            } elseif (empty($newTemplateId)) {
                $validated['scorecard_template_id'] = null;
                $validated['max_score'] = null;
                $validated['questions'] = null;
            }
        }

        $oldStatus = $interview->status;
        $interview->update($validated);

        $applicant = $interview->applicant;

        // Send email update to candidate if requested
        if ($request->boolean('send_update_email', false) && $applicant && $applicant->email) {
            $scheduledCarbon = Carbon::parse($interview->scheduled_at)->setTimezone('Asia/Riyadh');
            $dateFormatted = $scheduledCarbon->format('Y-m-d H:i');
            $endTimeFormatted = $scheduledCarbon->copy()->addMinutes(25)->format('H:i');
            $body = "عزيزي {$applicant->full_name}،\n\nنود إبلاغك بتحديث موعد وبيانات مقابلتك الشخصية لوظيفة ({$applicant->position}).\nالموعد المحدّث: {$dateFormatted} (إلى {$endTimeFormatted}) بتوقيت الشرق الأوسط (الرياض - GMT+3)\nالمدة: 25 دقيقة نشطة\nنوع المقابلة: " . ($interview->interview_type === 'online' ? 'عبر الإنترنت (أونلاين)' : 'حضورياً') . "\n";
            if (!empty($interview->meeting_link)) {
                $body .= "رابط المقابلة: {$interview->meeting_link}\n";
            }
            if (!empty($interview->location)) {
                $body .= "المكان: {$interview->location}\n";
            }
            $body .= "\nيرجى التواجد في الموعد المحدد.\nفريق العمل";

            EmailLog::create([
                'applicant_id' => $applicant->id,
                'sender_email' => Setting::get('mail_from_address', 'recruitment@contributors.app'),
                'recipient_email' => $applicant->email,
                'subject' => "تحديث موعد المقابلة الشخصية [{$applicant->application_no}]",
                'body' => $body,
                'type' => 'sent',
                'status' => 'delivered',
                'template_name' => 'interview_update',
                'sent_by' => $request->user()->id,
            ]);
        }

        // Send cancellation email if status transitioned to cancelled
        if (isset($validated['status']) && $validated['status'] === 'cancelled' && $oldStatus !== 'cancelled' && $request->boolean('send_cancellation_email', false) && $applicant && $applicant->email) {
            $reasonText = !empty($validated['cancellation_reason']) ? "\nسبب الإلغاء: " . $validated['cancellation_reason'] : '';
            $body = "عزيزي {$applicant->full_name}،\n\nنود إبلاغك بأنه قد تم إلغاء موعد المقابلة الشخصية المحددة سابقاً لوظيفة ({$applicant->position}).{$reasonText}\n\nسيتم التواصل معك في حال تحديد موعد بديل.\nفريق العمل";

            EmailLog::create([
                'applicant_id' => $applicant->id,
                'sender_email' => Setting::get('mail_from_address', 'recruitment@contributors.app'),
                'recipient_email' => $applicant->email,
                'subject' => "إلغاء موعد المقابلة الشخصية [{$applicant->application_no}]",
                'body' => $body,
                'type' => 'sent',
                'status' => 'delivered',
                'template_name' => 'interview_cancellation',
                'sent_by' => $request->user()->id,
            ]);
        }

        return response()->json([
            'message' => 'تم تعديل بيانات المقابلة بنجاح.',
            'interview' => $interview->load(['applicant', 'interviewer', 'scorecardTemplate']),
        ]);
    }

    public function updateQuestions(Request $request, $id)
    {
        $interview = Interview::findOrFail($id);

        $validated = $request->validate([
            'questions' => 'required|array',
            'feedback' => 'nullable|string|max:3000',
            'recommendation' => 'nullable|in:strong_hire,hire,under_consideration,reject',
            'status' => 'nullable|in:scheduled,completed,cancelled,rescheduled',
            'promote_to_status' => 'nullable|in:probation,accepted,rejected,participant',
        ]);

        // Auto calculate total_score, max_score, and overall_percentage
        $sumScore = 0;
        $sumMax = 0;
        $allScored = true;
        foreach ($validated['questions'] as &$q) {
            $max = isset($q['max_score']) && is_numeric($q['max_score']) ? (float)$q['max_score'] : 10;
            $sumMax += $max;

            // Auto-calculate score from checklist items if score is null or empty
            if (!empty($q['checklist_items']) && is_array($q['checklist_items'])) {
                $checkedIds = $q['checked_items'] ?? [];
                $calculatedScore = 0;
                $hasExplicitWeights = false;
                foreach ($q['checklist_items'] as $item) {
                    $itemWeight = (float)($item['weight'] ?? 0);
                    if ($itemWeight > 0) {
                        $hasExplicitWeights = true;
                    }
                    if (in_array($item['id'] ?? '', $checkedIds)) {
                        $calculatedScore += $itemWeight;
                    }
                }
                if (!$hasExplicitWeights && count($q['checklist_items']) > 0) {
                    $ratio = count($checkedIds) / count($q['checklist_items']);
                    $calculatedScore = round($ratio * $max, 2);
                }

                // Capped at max score: can exceed in weights but max awarded is full question score
                $calculatedScore = min($max, $calculatedScore);

                if (!isset($q['score']) || $q['score'] === null || $q['score'] === '') {
                    $q['score'] = $calculatedScore;
                }
            }

            if (isset($q['score']) && is_numeric($q['score'])) {
                $sumScore += (float)$q['score'];
            } else {
                $allScored = false;
            }
        }
        unset($q);

        $totalScore = round($sumScore, 2);
        $maxScore = $sumMax > 0 ? round($sumMax, 2) : 100.00;
        $percentage = $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : 0;
        $overallScore = round(($percentage / 10), 2); // 0.0 - 10.0 scale

        $updateData = [
            'questions' => $validated['questions'],
            'total_score' => $totalScore,
            'max_score' => $maxScore,
            'overall_percentage' => $percentage,
            'overall_score' => $overallScore,
        ];

        if (isset($validated['feedback'])) {
            $updateData['feedback'] = $validated['feedback'];
        }

        if (isset($validated['recommendation'])) {
            $updateData['recommendation'] = $validated['recommendation'];
        }

        if (!empty($validated['status'])) {
            $updateData['status'] = $validated['status'];
            if ($validated['status'] === 'completed' && !$interview->conducted_at) {
                $updateData['conducted_at'] = Carbon::now();
            }
        }

        $interview->update($updateData);

        // Update applicant rating & handle promotion if status changed
        $applicant = $interview->applicant;
        if ($applicant) {
            // Update rating (0-5 stars)
            $applicant->rating = round($percentage / 20, 1);
            $applicant->save();

            if (!empty($validated['promote_to_status']) && $validated['promote_to_status'] !== $applicant->status) {
                $oldStatus = $applicant->status;
                $applicant->status = $validated['promote_to_status'];
                $applicant->save();

                $applicant->statusLogs()->create([
                    'from_status' => $oldStatus,
                    'to_status' => $validated['promote_to_status'],
                    'changed_by' => $request->user()->id,
                    'notes' => 'ترقية بناءً على تقييم كرت المقابلة (' . $totalScore . '/' . $maxScore . ' - ' . $percentage . '%)',
                ]);
            }
        }

        return response()->json([
            'message' => 'تم حفظ وتحديث تقييم كرت المقابلة والنتائج بنجاح.',
            'interview' => $interview->load(['applicant', 'interviewer', 'scorecardTemplate']),
        ]);
    }

    public function destroy($id)
    {
        $interview = Interview::findOrFail($id);
        $interview->delete();

        return response()->json([
            'message' => 'تم حذف المقابلة بنجاح.'
        ]);
    }

    /**
     * Compute intersection between candidate availability & interviewer working hours,
     * subtract booked interviews, and return free recommended interview slots.
     */
    public function getAvailableSlots(Request $request)
    {
        $request->validate([
            'applicant_id' => 'required|exists:applicants,id',
            'interviewer_id' => 'nullable|exists:users,id',
            'days_ahead' => 'nullable|integer|min:1|max:30',
            'slot_duration' => 'nullable|integer|min:15|max:120',
        ]);

        $applicant = Applicant::findOrFail($request->applicant_id);
        $interviewerId = $request->interviewer_id ?: $request->user()->id;
        $interviewer = \App\Models\User::findOrFail($interviewerId);

        $daysAhead = (int)$request->input('days_ahead', 14);
        $slotDuration = (int)$request->input('slot_duration', 25);

        $applicantWindows = $applicant->getAvailabilityWindows();
        $interviewerHours = $interviewer->getWorkingHoursOrDefault();

        $startDate = Carbon::tomorrow()->startOfDay();
        $endDate = Carbon::today()->addDays($daysAhead)->endOfDay();

        // Existing scheduled interviews for this interviewer in this window
        $bookedInterviews = Interview::where('interviewer_id', $interviewer->id)
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->get(['id', 'scheduled_at', 'applicant_id']);

        $slots = [];
        $arabicDays = [
            'Sunday' => 'الأحد',
            'Monday' => 'الإثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
            'Saturday' => 'السبت',
        ];

        // Helper to convert "HH:mm" to minutes from midnight
        $toMinutes = function ($timeStr, $default = 0) {
            if (empty($timeStr)) return $default;
            $parts = explode(':', $timeStr);
            return ((int)($parts[0] ?? 0) * 60) + (int)($parts[1] ?? 0);
        };

        $dayMapping = [
            'الأحد' => 'Sunday',
            'الاحد' => 'Sunday',
            'الإثنين' => 'Monday',
            'الاثنين' => 'Monday',
            'الثلاثاء' => 'Tuesday',
            'الأربعاء' => 'Wednesday',
            'الاربعاء' => 'Wednesday',
            'الخميس' => 'Thursday',
            'الجمعة' => 'Friday',
            'السبت' => 'Saturday',
        ];

        $normalizeDays = function ($days) use ($dayMapping) {
            if (!is_array($days)) return [];
            return array_map(function ($d) use ($dayMapping) {
                return $dayMapping[$d] ?? $d;
            }, $days);
        };

        for ($d = 1; $d <= $daysAhead; $d++) {
            $date = Carbon::today()->addDays($d);
            $dayName = $date->format('l');

            // 1. Get Interviewer intervals for this day
            $interviewerIntervals = [];
            foreach ($interviewerHours as $ih) {
                $days = $normalizeDays($ih['days'] ?? []);
                if (in_array($dayName, $days) || in_array('all', $days)) {
                    if (!empty($ih['all_day'])) {
                        $interviewerIntervals[] = ['start' => 9 * 60, 'end' => 17 * 60];
                    } else {
                        $s = $toMinutes($ih['from'] ?? '09:00', 9 * 60);
                        $e = $toMinutes($ih['to'] ?? '17:00', 17 * 60);
                        if ($e > $s) {
                            $interviewerIntervals[] = ['start' => $s, 'end' => $e];
                        }
                    }
                }
            }

            if (empty($interviewerIntervals)) {
                continue;
            }

            // 2. Get Applicant intervals for this day
            $applicantIntervals = [];
            if (!empty($applicantWindows)) {
                foreach ($applicantWindows as $aw) {
                    $days = $normalizeDays($aw['days'] ?? []);
                    if (in_array($dayName, $days) || in_array('all', $days)) {
                        if (!empty($aw['all_day'])) {
                            $applicantIntervals[] = ['start' => 0, 'end' => 24 * 60];
                        } else {
                            $s = $toMinutes($aw['from'] ?? '00:00', 0);
                            $e = $toMinutes($aw['to'] ?? '23:59', 24 * 60);
                            if ($e > $s) {
                                $applicantIntervals[] = ['start' => $s, 'end' => $e];
                            }
                        }
                    }
                }
            } else {
                $applicantIntervals[] = ['start' => 0, 'end' => 24 * 60];
            }

            if (empty($applicantIntervals)) {
                continue;
            }

            // 3. Compute Intersection (Overlap)
            foreach ($interviewerIntervals as $intInt) {
                foreach ($applicantIntervals as $appInt) {
                    $overlapStart = max($intInt['start'], $appInt['start']);
                    $overlapEnd = min($intInt['end'], $appInt['end']);

                    if ($overlapEnd - $overlapStart >= $slotDuration) {
                        for ($m = $overlapStart; $m <= $overlapEnd - $slotDuration; $m += $slotDuration) {
                            $slotStartCarbon = $date->copy()->startOfDay()->addMinutes($m);

                            // 4. Subtract booked appointments (conflict check within 40 min buffer)
                            $isBooked = false;
                            foreach ($bookedInterviews as $booked) {
                                $bookedTime = $booked->scheduled_at;
                                if ($bookedTime) {
                                    if (abs($bookedTime->diffInMinutes($slotStartCarbon, false)) < 40) {
                                        $isBooked = true;
                                        break;
                                    }
                                }
                            }

                            if (!$isBooked) {
                                $hour = (int)$slotStartCarbon->format('H');
                                $periodAr = $hour < 12 ? 'ص' : 'م';
                                $hour12 = $hour % 12 ?: 12;
                                $timeDisplay = sprintf('%d:%s %s', $hour12, $slotStartCarbon->format('i'), $periodAr);
                                $dayAr = $arabicDays[$dayName] ?? $dayName;
                                $dateDisplay = $date->format('j/m');

                                $slots[] = [
                                    'datetime' => $slotStartCarbon->format('Y-m-d\TH:i'),
                                    'date' => $slotStartCarbon->format('Y-m-d'),
                                    'time' => $slotStartCarbon->format('H:i'),
                                    'day_name' => $dayName,
                                    'day_ar' => $dayAr,
                                    'label' => "{$dayAr} ({$dateDisplay}) - {$timeDisplay}",
                                    'label_en' => "{$dayName} ({$dateDisplay}) - {$slotStartCarbon->format('h:i A')}",
                                ];
                            }
                        }
                    }
                }
            }
        }

        return response()->json([
            'applicant' => [
                'id' => $applicant->id,
                'name' => $applicant->full_name,
                'windows' => $applicantWindows,
                'has_custom_availability' => !empty($applicantWindows),
                'notes' => $applicant->availability['notes'] ?? null,
            ],
            'interviewer' => [
                'id' => $interviewer->id,
                'name' => $interviewer->name,
                'working_hours' => $interviewerHours,
            ],
            'slots' => $slots,
            'total_slots' => count($slots),
        ]);
    }

    /**
     * Get list of active interviewers / evaluators for interview assignment
     */
    public function getInterviewers(Request $request)
    {
        $interviewers = \App\Models\User::with('role')
            ->where('status', 'active')
            ->whereHas('role', function ($q) {
                $q->where('name', '!=', 'contributor');
            })
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'data' => $interviewers,
            'interviewers' => $interviewers,
        ]);
    }

    /**
     * Requirement: توليد تقرير المقابلة والشهادة بالذكاء الاصطناعي
     */
    public function generateAiReport(Request $request, $id)
    {
        $interview = Interview::with(['applicant', 'interviewer'])->findOrFail($id);

        $aiReport = \App\Services\AiEvaluationService::generateReport($interview);

        $interview->ai_report = $aiReport;
        $interview->save();

        return response()->json([
            'message' => 'تم توليد تقرير الذكاء الاصطناعي والشهادة الملكية بنجاح.',
            'ai_report' => $aiReport,
            'interview' => $interview,
        ]);
    }

    /**
     * Requirement: استرجاع بيانات التقرير والشهادة المعتمدة لقالب interview-report.html
     */
    public function getReportData($id)
    {
        $interview = Interview::with(['applicant', 'interviewer', 'scorecardTemplate'])->findOrFail($id);

        // Auto-generate AI report if not yet generated
        if (empty($interview->ai_report)) {
            $interview->ai_report = \App\Services\AiEvaluationService::generateReport($interview);
            $interview->save();
        }

        $applicant = $interview->applicant;
        $interviewer = $interview->interviewer;

        $scheduledRiyadh = $interview->scheduled_at
            ? $interview->scheduled_at->copy()->setTimezone('Asia/Riyadh')->format('Y-m-d H:i')
            : null;

        $conductedRiyadh = $interview->conducted_at
            ? $interview->conducted_at->copy()->setTimezone('Asia/Riyadh')->format('Y-m-d H:i')
            : ($scheduledRiyadh ?: now()->setTimezone('Asia/Riyadh')->format('Y-m-d H:i'));

        return response()->json([
            'interview' => $interview,
            'applicant' => $applicant,
            'interviewer' => $interviewer,
            'ai_report' => $interview->ai_report,
            'dates' => [
                'scheduled_riyadh' => $scheduledRiyadh,
                'conducted_riyadh' => $conductedRiyadh,
                'date_arabic' => now()->setTimezone('Asia/Riyadh')->translatedFormat('d F Y'),
            ],
            'meta' => [
                'platform_name' => 'منصة موثِق',
                'slogan' => 'منظومة تمكين الشركاء والمساهمين التقنيين',
                'certificate_title' => 'شهادة جدارة واعتماد شريك',
            ],
        ]);
    }

    /**
     * Requirement: استرجاع بيانات أجندة لقاء التعارف لقالب interview-agnda.html
     */
    public function getAgendaData($id)
    {
        $interview = Interview::with(['applicant', 'interviewer'])->findOrFail($id);
        $applicant = $interview->applicant;
        $interviewer = $interview->interviewer;

        $scheduledCarbon = $interview->scheduled_at
            ? $interview->scheduled_at->copy()->setTimezone('Asia/Riyadh')
            : now()->setTimezone('Asia/Riyadh');

        $arabicDays = [
            'Sunday' => 'الأحد',
            'Monday' => 'الاثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
            'Saturday' => 'السبت',
        ];

        $dayNameEn = $scheduledCarbon->format('l');
        $dayNameAr = $arabicDays[$dayNameEn] ?? $dayNameEn;

        $startTimeStr = $scheduledCarbon->format('h:i') . ($scheduledCarbon->format('A') === 'AM' ? ' ص' : ' م');
        $endTimeCarbon = $scheduledCarbon->copy()->addMinutes(25);
        $endTimeStr = $endTimeCarbon->format('h:i') . ($endTimeCarbon->format('A') === 'AM' ? ' ص' : ' م');

        return response()->json([
            'interview_id' => $interview->id,
            'applicant_name' => $applicant->full_name ?? 'المرشح',
            'position' => $applicant->position ?? 'المسار التخصصي',
            'interviewer_name' => $interviewer->name ?? 'فريق الاعتماد والتحكيم',
            'meeting_link' => $interview->meeting_link ?? 'سيتم تزويدك به قبل اللقاء',
            'scheduled_date' => $scheduledCarbon->format('Y-m-d'),
            'day_name_ar' => $dayNameAr,
            'time_window' => "{$startTimeStr} - {$endTimeStr} بتوقيت الرياض (GMT+3)",
            'duration' => '25 دقيقة نشطة + 5 دقائق فترة انتقالية',
            'interview_type' => $interview->interview_type === 'online' ? 'عبر الإنترنت (Google Meet)' : 'حضورياً',
            'applicant_email' => $applicant->email ?? '',
            'applicant_phone' => $applicant->phone ?? '',
        ]);
    }

    /**
     * Requirement: Standalone Pristine 4-Page Meeting Agenda Document View
     */
    public function agendaDoc($id)
    {
        $interview = Interview::with(['applicant', 'interviewer'])->findOrFail($id);
        $applicant = $interview->applicant;
        $interviewer = $interview->interviewer;

        $scheduledCarbon = $interview->scheduled_at
            ? $interview->scheduled_at->copy()->setTimezone('Asia/Riyadh')
            : now()->setTimezone('Asia/Riyadh');

        $datetimeLocal = $scheduledCarbon->format('Y-m-d\TH:i');

        return view('docs.agenda', [
            'interview' => $interview,
            'applicantName' => $applicant->full_name ?? 'المرشح',
            'interviewerName' => $interviewer->name ?? 'فريق الاعتماد والتحكيم',
            'specialty' => $applicant->position ?? 'تطوير البرمجيات',
            'datetimeLocal' => $datetimeLocal,
            'meetingLink' => $interview->meeting_link ?? 'https://meet.google.com/gyf-eyds-cgc',
        ]);
    }

    /**
     * Requirement: Standalone Pristine Evaluation Report & Royal Certificate Document View
     */
    public function reportDoc($id)
    {
        $interview = Interview::with(['applicant', 'interviewer'])->findOrFail($id);
        $applicant = $interview->applicant;
        $interviewer = $interview->interviewer;

        if (empty($interview->ai_report)) {
            $interview->ai_report = \App\Services\AiEvaluationService::generateReport($interview);
            $interview->save();
        }
        $aiReport = $interview->ai_report;

        $scheduledCarbon = $interview->scheduled_at
            ? $interview->scheduled_at->copy()->setTimezone('Asia/Riyadh')
            : now()->setTimezone('Asia/Riyadh');

        $summary = $aiReport['executive_summary'] ?? ($interview->feedback ?? '');
        $strengths = implode("\n• ", $aiReport['strengths'] ?? []);
        if (!empty($strengths)) $strengths = "• " . $strengths;
        $gaps = implode("\n• ", $aiReport['areas_for_development'] ?? []);
        if (!empty($gaps)) $gaps = "• " . $gaps;

        $goldenMessage = $aiReport['certificate_text'] ?? '';

        return view('docs.report', [
            'interview' => $interview,
            'applicantName' => $applicant->full_name ?? 'المرشح',
            'interviewerName' => $interviewer->name ?? 'فريق الاعتماد',
            'specialty' => $applicant->position ?? 'استشارات التحول الرقمي وحلول المؤسسات',
            'interviewDate' => $scheduledCarbon->format('Y-m-d'),
            'round' => 'مقابلة تقييم واعتماد شراكة',
            'duration' => '25 دقيقة',
            'purpose' => 'تقييم مدى التوافق مع رؤية موثِق، واستكشاف الخبرات والدوافع والاستعداد لتحمل مسؤولية كشريك استراتيجي.',
            'techScore' => $interview->technical_score ? ($interview->technical_score >= 8 ? '5 — متميز' : ($interview->technical_score >= 6 ? '4 — قوي' : '3 — جيد')) : '5 — متميز',
            'businessScore' => '5 — متميز',
            'leadershipScore' => '4 — قوي',
            'communicationScore' => $interview->communication_score ? ($interview->communication_score >= 8 ? '5 — متميز' : '4 — قوي') : '5 — متميز',
            'commitmentScore' => $interview->commitment_score ? ($interview->commitment_score >= 8 ? '5 — متميز' : '4 — قوي') : '5 — متميز',
            'summary' => $summary,
            'strengths' => $strengths,
            'gaps' => $gaps,
            'decision' => $interview->recommendation === 'strong_hire' ? 'قبول واعتماد شريك' : ($interview->recommendation === 'hire' ? 'قبول واعتماد' : 'استكمال التقييم'),
            'status' => $interview->status === 'completed' ? 'مكتمل' : 'تقييم أولي — غير نهائي',
            'rationale' => $aiReport['recommendation_text'] ?? 'الجدارة المثبتة والخبرة النوعية تمثل إضافة محورية لمنظومة الشركاء في موثِق.',
            'followup' => 'مناقشة خطة تفعيل المشاريع الاستشارية وآلية المشاركة في العوائد.',
            'nextSteps' => 'توقيع اتفاقية الشراكة وتحديد خطة الإطلاق المشتركة للمشاريع.',
            'goldenMessage' => $goldenMessage,
            'refNo' => $applicant->application_no ?? ('MQ-' . date('Y') . '-' . str_pad($applicant->id, 4, '0', STR_PAD_LEFT)),
        ]);
    }
}
