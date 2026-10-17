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

        // Prevent double booking conflicts (within 40 minutes) unless explicitly forced
        $conflict = Interview::where('interviewer_id', $interviewerId)
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_at', [
                $scheduledTime->copy()->subMinutes(40),
                $scheduledTime->copy()->addMinutes(40),
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
            $dateFormatted = Carbon::parse($validated['scheduled_at'])->format('Y-m-d H:i');
            $body = "عزيزي {$applicant->full_name}،\n\nيسعدنا إبلاغك بتحديد موعد مقابلتك الشخصية لوظيفة ({$applicant->position}).\nالموعد: {$dateFormatted}\nنوع المقابلة: " . ($validated['interview_type'] === 'online' ? 'عبر الإنترنت (أونلاين)' : 'حضورياً') . "\n";
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
        $interview = Interview::findOrFail($id);

        $validated = $request->validate([
            'scheduled_at' => 'required|date',
            'interview_type' => 'required|in:online,in_person,phone',
            'meeting_link' => 'nullable|url',
            'location' => 'nullable|string|max:255',
            'interviewer_id' => 'nullable|exists:users,id',
            'scorecard_template_id' => 'nullable|exists:scorecard_templates,id',
            'status' => 'required|in:scheduled,completed,cancelled,rescheduled',
        ]);

        $interview->update($validated);

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
        foreach ($validated['questions'] as $q) {
            $max = isset($q['max_score']) && is_numeric($q['max_score']) ? (float)$q['max_score'] : 10;
            $sumMax += $max;
            if (isset($q['score']) && is_numeric($q['score'])) {
                $sumScore += (float)$q['score'];
            } else {
                $allScored = false;
            }
        }

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
        $slotDuration = (int)$request->input('slot_duration', 45);

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
}
