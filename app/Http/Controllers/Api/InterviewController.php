<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\AppNotification;
use App\Models\EmailLog;
use App\Models\Interview;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Interview::with(['applicant', 'interviewer'])->orderBy('scheduled_at', 'desc');

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
            'send_invitation_email' => 'nullable|boolean',
        ]);

        // Auto-generate meeting link if empty and online
        if ($validated['interview_type'] === 'online' && empty($validated['meeting_link'])) {
            $validated['meeting_link'] = 'https://meet.google.com/' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 3) . '-' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 4) . '-' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 3);
        }

        $interview = Interview::create([
            'applicant_id' => $validated['applicant_id'],
            'scheduled_at' => $validated['scheduled_at'],
            'interview_type' => $validated['interview_type'],
            'meeting_link' => $validated['meeting_link'] ?? null,
            'location' => $validated['location'] ?? null,
            'interviewer_id' => $validated['interviewer_id'] ?? $request->user()->id,
            'status' => 'scheduled',
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
        $interview = Interview::with(['applicant', 'interviewer'])->findOrFail($id);

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
            'status' => 'required|in:scheduled,completed,cancelled,rescheduled',
        ]);

        $interview->update($validated);

        return response()->json([
            'message' => 'تم تعديل بيانات المقابلة بنجاح.',
            'interview' => $interview->load(['applicant', 'interviewer']),
        ]);
    }

    public function updateQuestions(Request $request, $id)
    {
        $interview = Interview::findOrFail($id);

        $validated = $request->validate([
            'questions' => 'required|array',
            'feedback' => 'nullable|string|max:3000',
        ]);

        $updateData = ['questions' => $validated['questions']];
        if (isset($validated['feedback'])) {
            $updateData['feedback'] = $validated['feedback'];
        }

        $interview->update($updateData);

        return response()->json([
            'message' => 'تم حفظ وتحديث أسئلة وتقييمات المقابلة بنجاح.',
            'interview' => $interview->load(['applicant', 'interviewer']),
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
}
