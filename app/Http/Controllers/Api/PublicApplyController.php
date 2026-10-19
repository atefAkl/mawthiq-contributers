<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\ApplicantStatusLog;
use App\Models\AppNotification;
use App\Models\EmailLog;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Exception;

class PublicApplyController extends Controller
{
    public function getConfig()
    {
        $appOpen = Setting::get('applications_open', true);
        $positions = Setting::get('allowed_positions', [
            'Full Stack Developer (Laravel & React)',
            'Backend Developer (PHP/Laravel)',
            'Frontend Developer (React/Tailwind)',
            'UI/UX Product Designer',
            'Mobile Developer (Flutter)',
            'DevOps & Cloud Engineer',
            'Technical Project Manager',
            'Content & Community Contributor'
        ]);

        return response()->json([
            'app_name_ar' => Setting::get('app_name', 'منصة إدارة المتقدمين والمساهمين'),
            'app_name_en' => Setting::get('app_name_en', 'Contributors & Applicants Management'),
            'organization_name' => Setting::get('organization_name', 'منظومة التطوير والمساهمة الرقمية'),
            'contact_email' => Setting::get('contact_email', 'recruitment@contributors.app'),
            'contact_phone' => Setting::get('contact_phone', '+20 100 000 0000'),
            'applications_open' => (bool)$appOpen,
            'allowed_positions' => is_array($positions) ? $positions : json_decode($positions, true) ?? [],
            'application_deadline' => Setting::get('application_deadline', ''),
        ]);
    }

    public function apply(Request $request)
    {
        $isOpen = Setting::get('applications_open', true);
        if (!$isOpen) {
            return response()->json([
                'message' => 'عذراً، باب التقديم والمساهمة مغلق حالياً.'
            ], 403);
        }

        // Clean & Normalize inputs before validation
        if ($request->has('email')) {
            $request->merge(['email' => trim(strtolower($request->email))]);
        }
        if ($request->has('phone')) {
            $request->merge(['phone' => trim($request->phone)]);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:applicants,email',
            'phone' => 'required|string|max:30|unique:applicants,phone',
            'phone_code' => 'nullable|string|max:10',
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
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:50',
        ], [
            'email.unique' => 'البريد الإلكتروني المدخل مسجل بالفعل مسبقاً لدى متقدم آخر.',
            'phone.unique' => 'رقم الهاتف المدخل مسجل بالفعل مسبقاً لدى متقدم آخر.',
        ]);

        // Atomic Concurrency Lock (prevents race-condition double-clicks)
        $lockKey = 'apply_lock_' . md5($validated['email'] . '_' . $validated['phone']);
        $lock = Cache::lock($lockKey, 15);

        if (!$lock->get()) {
            return response()->json([
                'message' => 'طلبك قيد المعالجة بالفعل حالياً، يرجى الانتظار بضع ثوانٍ وعدم تكرار الضغط.'
            ], 429);
        }

        try {
            return DB::transaction(function () use ($validated) {
                // Generate Application Number safely with pessimistic lock on year counter
                $year = date('Y');
                $lastApplicant = Applicant::whereYear('created_at', $year)
                    ->lockForUpdate()
                    ->latest('id')
                    ->first();

                $nextNumber = $lastApplicant ? ((int)substr($lastApplicant->application_no, -4) + 1) : 1;
                $appNo = sprintf("APP-%s-%04d", $year, $nextNumber);

                $applicant = Applicant::create([
                    'application_no' => $appNo,
                    'full_name' => $validated['full_name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'phone_code' => $validated['phone_code'] ?? null,
                    'national_id' => $validated['national_id'] ?? null,
                    'country' => $validated['country'] ?? 'مصر',
                    'city' => $validated['city'] ?? null,
                    'position' => $validated['position'],
                    'experience_years' => $validated['experience_years'] ?? 0,
                    'education_level' => $validated['education_level'] ?? null,
                    'portfolio_url' => $validated['portfolio_url'] ?? null,
                    'linkedin_url' => $validated['linkedin_url'] ?? null,
                    'github_url' => $validated['github_url'] ?? null,
                    'cover_letter' => $validated['cover_letter'] ?? null,
                    'skills' => $validated['skills'] ?? [],
                    'status' => 'applicant',
                    'rating' => 0.0,
                ]);

                // Initial status log
                ApplicantStatusLog::create([
                    'applicant_id' => $applicant->id,
                    'from_status' => null,
                    'to_status' => 'applicant',
                    'changed_by' => null,
                    'notes' => 'تم استلام طلب التقديم عبر البوابة الإلكترونية.',
                ]);

                // Confirmation Email Log
                EmailLog::create([
                    'applicant_id' => $applicant->id,
                    'sender_email' => Setting::get('mail_from_address', 'recruitment@contributors.app'),
                    'recipient_email' => $applicant->email,
                    'subject' => "تم استلام طلب التقديم بنجاح [{$appNo}]",
                    'body' => "عزيزي/عزيزتي {$applicant->full_name}،\n\nنشكرك على رغبتك في الانضمام والمساهمة معنا كـ ({$applicant->position}).\nرقم طلبك هو: {$appNo}.\nسيقوم فريق الفرز والتطوير بمراجعة ملفك والتواصل معك عبر البريد الإلكتروني في حال التأهل للمراحل القادمة.\n\nمع أطيب التمنيات،\nفريق العمل",
                    'type' => 'sent',
                    'status' => 'delivered',
                    'template_name' => 'application_received',
                    'is_read' => true,
                    'is_starred' => false,
                ]);

                // In-app Notification for Admin and HR
                $adminUsers = User::whereHas('role', function ($q) {
                    $q->whereIn('name', ['super_admin', 'hr']);
                })->get();

                foreach ($adminUsers as $admin) {
                    AppNotification::create([
                        'user_id' => $admin->id,
                        'title' => 'متقدم جديد: ' . $applicant->full_name,
                        'message' => "تم استلام طلب تقديم جديد لوظيفة ({$applicant->position}) برقم {$appNo}.",
                        'type' => 'info',
                        'action_url' => '/applicants/' . $applicant->id,
                        'is_read' => false,
                    ]);
                }

                return response()->json([
                    'message' => 'تم تقديم طلبك بنجاح! تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.',
                    'application_no' => $appNo,
                    'applicant' => $applicant,
                ], 201);
            });
        } finally {
            optional($lock)->release();
        }
    }
}
