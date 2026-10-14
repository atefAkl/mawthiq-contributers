<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\ApplicantStatusLog;
use App\Models\AppNotification;
use App\Models\EmailLog;
use App\Models\Setting;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicantController extends Controller
{
    public function index(Request $request)
    {
        $query = Applicant::query();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('application_no', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%");
            });
        }

        // Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Position Filter
        if ($request->filled('position') && $request->position !== 'all') {
            $query->where('position', $request->position);
        }

        // Sort
        $sortField = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDir);

        $applicants = $query->with(['interviews', 'statusLogs'])->paginate($request->get('per_page', 15));

        // Aggregate statistics for quick tabs / badge counters
        $counts = [
            'all' => Applicant::count(),
            'applicant' => Applicant::where('status', 'applicant')->count(),
            'participant' => Applicant::where('status', 'participant')->count(),
            'probation' => Applicant::where('status', 'probation')->count(),
            'accepted' => Applicant::where('status', 'accepted')->count(),
            'rejected' => Applicant::where('status', 'rejected')->count(),
        ];

        return response()->json([
            'data' => $applicants->items(),
            'current_page' => $applicants->currentPage(),
            'last_page' => $applicants->lastPage(),
            'total' => $applicants->total(),
            'per_page' => $applicants->perPage(),
            'counts' => $counts,
        ]);
    }

    public function show($id)
    {
        $applicant = Applicant::with([
            'statusLogs.changedByUser',
            'interviews.interviewer',
            'emailLogs.sentByUser',
            'createdByUser'
        ])->findOrFail($id);

        return response()->json([
            'applicant' => $applicant,
            'statuses' => Applicant::getStatuses(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:30',
            'national_id' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'position' => 'required|string|max:255',
            'experience_years' => 'nullable|integer|min:0|max:50',
            'education_level' => 'nullable|string|max:255',
            'portfolio_url' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
            'github_url' => 'nullable|url|max:255',
            'cover_letter' => 'nullable|string|max:3000',
            'internal_notes' => 'nullable|string|max:3000',
            'skills' => 'nullable|array',
            'status' => 'required|in:applicant,participant,probation,accepted,rejected',
        ]);

        $year = date('Y');
        $lastApplicant = Applicant::whereYear('created_at', $year)->latest('id')->first();
        $nextNumber = $lastApplicant ? ((int)substr($lastApplicant->application_no, -4) + 1) : 1;
        $appNo = sprintf("APP-%s-%04d", $year, $nextNumber);

        $validated['application_no'] = $appNo;
        $validated['created_by'] = $request->user()->id;

        $applicant = Applicant::create($validated);

        ApplicantStatusLog::create([
            'applicant_id' => $applicant->id,
            'from_status' => null,
            'to_status' => $applicant->status,
            'changed_by' => $request->user()->id,
            'notes' => 'تم إنشاء الملف يدوياً من لوحة التحكم بواسطة ' . $request->user()->name,
        ]);

        return response()->json([
            'message' => 'تم إضافة المتقدم بنجاح.',
            'applicant' => $applicant,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $applicant = Applicant::findOrFail($id);

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:30',
            'national_id' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'position' => 'required|string|max:255',
            'experience_years' => 'nullable|integer|min:0|max:50',
            'education_level' => 'nullable|string|max:255',
            'portfolio_url' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
            'github_url' => 'nullable|url|max:255',
            'age' => 'nullable|integer|min:15|max:100',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'governorate' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:500',
            'marital_status' => 'nullable|string|max:50',
            'social_links' => 'nullable|array',
            'portfolio_items' => 'nullable|array',
            'cover_letter' => 'nullable|string|max:5000',
            'internal_notes' => 'nullable|string|max:5000',
            'rating' => 'nullable|numeric|min:0|max:5',
            'skills' => 'nullable|array',
            'rejection_reason' => 'nullable|string|max:1000',
        ]);

        $applicant->update($validated);

        return response()->json([
            'message' => 'تم تحديث بيانات المتقدم بنجاح.',
            'applicant' => $applicant->fresh(['statusLogs.changedByUser', 'interviews.interviewer', 'emailLogs.sentByUser']),
        ]);
    }

    public function uploadResume(Request $request, $id)
    {
        $applicant = Applicant::findOrFail($id);

        $request->validate([
            'resume' => 'required|file|mimes:pdf,doc,docx|max:10240', // Max 10MB
        ]);

        $file = $request->file('resume');
        $filename = 'cv_' . $applicant->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('resumes', $filename, 'public');

        $applicant->update([
            'resume_path' => '/storage/' . $path,
        ]);

        return response()->json([
            'message' => 'تم رفع ملف السيرة الذاتية بنجاح.',
            'resume_path' => $applicant->resume_path,
            'applicant' => $applicant->fresh(['statusLogs.changedByUser', 'interviews.interviewer', 'emailLogs.sentByUser']),
        ]);
    }

    /**
     * Fifth requirement: Status Management & Promotion Pipeline
     * (متقدم - مشارك - تحت الاختبار - مقبول - مرفوض)
     */
    public function updateStatus(Request $request, $id)
    {
        $applicant = Applicant::findOrFail($id);

        $request->validate([
            'to_status' => 'required|in:applicant,participant,probation,accepted,rejected',
            'notes' => 'nullable|string|max:2000',
            'rejection_reason' => 'nullable|string|max:1000',
            'send_email' => 'nullable|boolean',
            'email_body' => 'nullable|string',
        ]);

        $fromStatus = $applicant->status;
        $toStatus = $request->to_status;

        $applicant->status = $toStatus;
        if ($toStatus === 'rejected' && $request->filled('rejection_reason')) {
            $applicant->rejection_reason = $request->rejection_reason;
        }
        $applicant->save();

        // Log the transition
        ApplicantStatusLog::create([
            'applicant_id' => $applicant->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'changed_by' => $request->user()->id,
            'notes' => $request->notes ?? ('تم تغيير الحالة من ' . ($applicant::getStatuses()[$fromStatus]['ar'] ?? $fromStatus) . ' إلى ' . ($applicant::getStatuses()[$toStatus]['ar'] ?? $toStatus)),
        ]);

        // Optional email notification to applicant
        if ($request->boolean('send_email')) {
            $statusLabels = Applicant::getStatuses();
            $statusNameAr = $statusLabels[$toStatus]['ar'] ?? $toStatus;

            $defaultBody = $request->email_body ?? "مرحباً {$applicant->full_name}،\n\nنود إعلامك بأنه تم تحديث حالة طلبك في المنصة إلى: [{$statusNameAr}].\n\n" . ($request->notes ? "ملاحظة: {$request->notes}\n\n" : "") . "نتمنى لك دوام التوفيق والنجاح.\nفريق العمل";

            EmailLog::create([
                'applicant_id' => $applicant->id,
                'sender_email' => Setting::get('mail_from_address', 'recruitment@contributors.app'),
                'recipient_email' => $applicant->email,
                'subject' => "تحديث حالة طلبك - {$applicant->position} [{$applicant->application_no}]",
                'body' => $defaultBody,
                'type' => 'sent',
                'status' => 'delivered',
                'template_name' => 'status_change_' . $toStatus,
                'sent_by' => $request->user()->id,
            ]);
        }

        // Add In-App notification
        AppNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'تم تغيير حالة المتقدم',
            'message' => "تم تحديث حالة {$applicant->full_name} إلى {$applicant->status_label_ar}.",
            'type' => $toStatus === 'accepted' ? 'success' : ($toStatus === 'rejected' ? 'danger' : 'info'),
            'action_url' => '/applicants/' . $applicant->id,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'تم تغيير حالة المتقدم بنجاح.',
            'applicant' => $applicant->fresh(['statusLogs.changedByUser']),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $applicant = Applicant::findOrFail($id);
        $applicant->delete();

        return response()->json([
            'message' => 'تم حذف المتقدم بنجاح.'
        ]);
    }

    public function export(Request $request)
    {
        $applicants = Applicant::orderBy('created_at', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="applicants_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($applicants) {
            $handle = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel Arabic support
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, ['رقم الطلب', 'الاسم الكامل', 'البريد الإلكتروني', 'الهاتف', 'الدور/الوظيفة', 'سنوات الخبرة', 'المدينة', 'الدولة', 'الحالة', 'التقييم', 'تاريخ التقديم']);

            foreach ($applicants as $row) {
                fputcsv($handle, [
                    $row->application_no,
                    $row->full_name,
                    $row->email,
                    $row->phone,
                    $row->position,
                    $row->experience_years,
                    $row->city,
                    $row->country,
                    $row->status_label_ar,
                    $row->rating,
                    $row->created_at->format('Y-m-d H:i'),
                ]);
            }

            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }
}
