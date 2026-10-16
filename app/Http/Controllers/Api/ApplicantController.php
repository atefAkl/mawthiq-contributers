<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\ApplicantStatusLog;
use App\Models\AppNotification;
use App\Models\EmailLog;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicantController extends Controller
{
    protected function normalizeAttachments(Applicant $applicant): array
    {
        $attachments = is_array($applicant->attachments) ? $applicant->attachments : [];

        // Migrate legacy single resume_path if attachments array is empty
        if (empty($attachments) && !empty($applicant->resume_path)) {
            $relPath = ltrim(preg_replace('#^/storage/#', '', $applicant->resume_path), '/');
            $exists = Storage::disk('public')->exists($relPath);
            $attachments = [[
                'id' => 'att_legacy_' . $applicant->id,
                'version' => 1,
                'filename' => basename($relPath),
                'original_name' => basename($relPath),
                'path' => '/storage/' . $relPath,
                'storage_path' => $relPath,
                'mime_type' => $exists ? (Storage::disk('public')->mimeType($relPath) ?: 'application/pdf') : 'application/pdf',
                'size' => $exists ? Storage::disk('public')->size($relPath) : 0,
                'notes' => 'النسخة الأساسية',
                'uploaded_by' => 'النظام',
                'uploaded_at' => optional($applicant->updated_at ?? $applicant->created_at)->toIso8601String() ?: now()->toIso8601String(),
                'is_current' => true,
            ]];
            $applicant->attachments = $attachments;
            $applicant->saveQuietly();
        }

        // Enrich with live file existence check
        return array_values(array_map(function ($att) {
            $relPath = $att['storage_path'] ?? ltrim(preg_replace('#^/storage/#', '', $att['path'] ?? ''), '/');
            $exists = $relPath && Storage::disk('public')->exists($relPath);
            $att['storage_path'] = $relPath;
            $att['file_exists'] = $exists;
            if ($exists && empty($att['size'])) {
                $att['size'] = Storage::disk('public')->size($relPath);
            }
            return $att;
        }, $attachments));
    }

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

        $applicant->setAttribute('attachments', $this->normalizeAttachments($applicant));

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
        $fresh = $applicant->fresh(['statusLogs.changedByUser', 'interviews.interviewer', 'emailLogs.sentByUser']);
        $fresh->setAttribute('attachments', $this->normalizeAttachments($fresh));

        return response()->json([
            'message' => 'تم تحديث بيانات المتقدم بنجاح.',
            'applicant' => $fresh,
        ]);
    }

    public function uploadResume(Request $request, $id)
    {
        $applicant = Applicant::findOrFail($id);

        $request->validate([
            'resume' => 'required|file|mimes:pdf,doc,docx|max:10240', // Max 10MB
            'mode' => 'nullable|in:new_version,replace',
            'attachment_id' => 'nullable|string',
            'notes' => 'nullable|string|max:500',
        ]);

        $file = $request->file('resume');
        if (!$file || !$file->isValid()) {
            return response()->json([
                'message' => 'الملف المرفوع غير صالح أو لم يكتمل رفعه بشكل سليم.',
            ], 422);
        }

        $attachments = $this->normalizeAttachments($applicant);
        $mode = $request->input('mode', 'new_version');
        $targetId = $request->input('attachment_id');

        $ext = strtolower($file->getClientOriginalExtension() ?: 'pdf');
        $filename = 'cv_' . $applicant->id . '_' . time() . '_' . substr(uniqid(), -4) . '.' . $ext;
        $path = $file->storeAs('resumes', $filename, 'public');

        if (!$path || !Storage::disk('public')->exists($path) || Storage::disk('public')->size($path) === 0) {
            return response()->json([
                'message' => 'تعذر حفظ الملف على الخادم أو أن الملف فارغ.',
            ], 500);
        }

        $publicUrl = '/storage/' . $path;
        $fileSize = Storage::disk('public')->size($path);
        $mimeType = $file->getClientMimeType() ?: 'application/pdf';
        $originalName = $file->getClientOriginalName() ?: $filename;
        $uploaderName = $request->user()?->name ?? 'Admin';
        $notes = $request->input('notes', '');

        if ($mode === 'replace' && !empty($attachments)) {
            $replaceIndex = null;
            if ($targetId) {
                foreach ($attachments as $idx => $att) {
                    if (($att['id'] ?? '') === $targetId) {
                        $replaceIndex = $idx;
                        break;
                    }
                }
            }
            if ($replaceIndex === null) {
                foreach ($attachments as $idx => $att) {
                    if (!empty($att['is_current'])) {
                        $replaceIndex = $idx;
                        break;
                    }
                }
            }
            if ($replaceIndex === null) {
                $replaceIndex = count($attachments) - 1;
            }

            $oldItem = $attachments[$replaceIndex];
            $oldRelPath = $oldItem['storage_path'] ?? ltrim(preg_replace('#^/storage/#', '', $oldItem['path'] ?? ''), '/');
            if ($oldRelPath && $oldRelPath !== $path && Storage::disk('public')->exists($oldRelPath)) {
                Storage::disk('public')->delete($oldRelPath);
            }

            foreach ($attachments as &$att) {
                $att['is_current'] = false;
            }
            unset($att);

            $attachments[$replaceIndex] = [
                'id' => $oldItem['id'] ?? ('att_' . uniqid()),
                'version' => $oldItem['version'] ?? ($replaceIndex + 1),
                'filename' => $filename,
                'original_name' => $originalName,
                'path' => $publicUrl,
                'storage_path' => $path,
                'mime_type' => $mimeType,
                'size' => $fileSize,
                'notes' => $notes !== '' ? $notes : ($oldItem['notes'] ?? 'تم استبدال الملف'),
                'uploaded_by' => $uploaderName,
                'uploaded_at' => now()->toIso8601String(),
                'is_current' => true,
                'file_exists' => true,
            ];
            $actionMessage = 'تم استبدال ملف السيرة الذاتية بنجاح.';
        } else {
            $maxVersion = 0;
            foreach ($attachments as &$att) {
                $att['is_current'] = false;
                if (($att['version'] ?? 0) > $maxVersion) {
                    $maxVersion = (int)$att['version'];
                }
            }
            unset($att);

            $nextVersion = $maxVersion + 1;
            $attachments[] = [
                'id' => 'att_' . uniqid(),
                'version' => $nextVersion,
                'filename' => $filename,
                'original_name' => $originalName,
                'path' => $publicUrl,
                'storage_path' => $path,
                'mime_type' => $mimeType,
                'size' => $fileSize,
                'notes' => $notes !== '' ? $notes : ('الإصدار رقم v' . $nextVersion),
                'uploaded_by' => $uploaderName,
                'uploaded_at' => now()->toIso8601String(),
                'is_current' => true,
                'file_exists' => true,
            ];
            $actionMessage = 'تم رفع إصدار جديد من السيرة الذاتية (v' . $nextVersion . ') بنجاح.';
        }

        $applicant->update([
            'resume_path' => $publicUrl,
            'attachments' => array_values($attachments),
        ]);

        $fresh = $applicant->fresh(['statusLogs.changedByUser', 'interviews.interviewer', 'emailLogs.sentByUser']);
        $fresh->setAttribute('attachments', $this->normalizeAttachments($fresh));

        return response()->json([
            'message' => $actionMessage,
            'resume_path' => $applicant->resume_path,
            'applicant' => $fresh,
        ]);
    }

    public function activateResume(Request $request, $id, $attachmentId)
    {
        $applicant = Applicant::findOrFail($id);
        $attachments = $this->normalizeAttachments($applicant);

        $activePath = null;
        foreach ($attachments as &$att) {
            if (($att['id'] ?? '') === $attachmentId) {
                $att['is_current'] = true;
                $activePath = $att['path'];
            } else {
                $att['is_current'] = false;
            }
        }
        unset($att);

        if (!$activePath) {
            return response()->json(['message' => 'السجل المطلوب غير موجود.'], 404);
        }

        $applicant->update([
            'resume_path' => $activePath,
            'attachments' => array_values($attachments),
        ]);

        $fresh = $applicant->fresh(['statusLogs.changedByUser', 'interviews.interviewer', 'emailLogs.sentByUser']);
        $fresh->setAttribute('attachments', $this->normalizeAttachments($fresh));

        return response()->json([
            'message' => 'تم تعيين هذا الإصدار كملف السيرة الذاتية المعتمد.',
            'applicant' => $fresh,
        ]);
    }

    public function deleteResume(Request $request, $id, $attachmentId = null)
    {
        $applicant = Applicant::findOrFail($id);
        $attachments = $this->normalizeAttachments($applicant);

        if (empty($attachments)) {
            $applicant->update(['resume_path' => null, 'attachments' => []]);
            return response()->json(['message' => 'لا توجد مرفقات لحذفها.']);
        }

        $deleteIndex = null;
        if ($attachmentId) {
            foreach ($attachments as $idx => $att) {
                if (($att['id'] ?? '') === $attachmentId) {
                    $deleteIndex = $idx;
                    break;
                }
            }
        } else {
            foreach ($attachments as $idx => $att) {
                if (!empty($att['is_current'])) {
                    $deleteIndex = $idx;
                    break;
                }
            }
            if ($deleteIndex === null) {
                $deleteIndex = count($attachments) - 1;
            }
        }

        if ($deleteIndex === null) {
            return response()->json(['message' => 'السجل المطلوب غير موجود.'], 404);
        }

        $target = $attachments[$deleteIndex];
        $relPath = $target['storage_path'] ?? ltrim(preg_replace('#^/storage/#', '', $target['path'] ?? ''), '/');
        if ($relPath && Storage::disk('public')->exists($relPath)) {
            Storage::disk('public')->delete($relPath);
        }

        array_splice($attachments, $deleteIndex, 1);

        $newResumePath = null;
        if (!empty($attachments)) {
            $hasCurrent = false;
            foreach ($attachments as $att) {
                if (!empty($att['is_current'])) {
                    $hasCurrent = true;
                    $newResumePath = $att['path'];
                    break;
                }
            }
            if (!$hasCurrent) {
                $lastIdx = count($attachments) - 1;
                $attachments[$lastIdx]['is_current'] = true;
                $newResumePath = $attachments[$lastIdx]['path'];
            }
        }

        $applicant->update([
            'resume_path' => $newResumePath,
            'attachments' => array_values($attachments),
        ]);

        $fresh = $applicant->fresh(['statusLogs.changedByUser', 'interviews.interviewer', 'emailLogs.sentByUser']);
        $fresh->setAttribute('attachments', $this->normalizeAttachments($fresh));

        return response()->json([
            'message' => 'تم حذف المرفق بنجاح.',
            'applicant' => $fresh,
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
