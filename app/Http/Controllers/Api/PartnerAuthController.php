<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\Interview;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Services\MailService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PartnerAuthController extends Controller
{
    /**
     * Requirement 2.1: تسجيل دخول الشركاء / الأعضاء
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        // If user doesn't exist, check if an Applicant exists with this email
        if (!$user) {
            $applicant = Applicant::where('email', $validated['email'])->first();
            if ($applicant) {
                // Auto-create Contributor account for this applicant
                $contributorRole = Role::firstOrCreate(
                    ['name' => 'contributor'],
                    [
                        'display_name_ar' => 'شريك / مساهم',
                        'display_name_en' => 'Partner / Contributor',
                        'description' => 'بوابة الشركاء والمساهمين التقنيين',
                        'permissions' => ['partner.view', 'partner.update_profile']
                    ]
                );

                $tempPass = substr(md5(uniqid(rand(), true)), 0, 8);
                $user = User::create([
                    'name' => $applicant->full_name,
                    'email' => $applicant->email,
                    'password' => Hash::make($tempPass),
                    'role_id' => $contributorRole->id,
                    'status' => 'active',
                    'must_change_password' => true,
                ]);

                $applicant->update(['user_id' => $user->id]);

                // Send welcome email with credentials
                try {
                    $platformName = Setting::get('platform_name', 'منصة موثِق');
                    MailService::send(
                        $applicant->email,
                        "بيانات الدخول إلى بوابة الشركاء - {$platformName}",
                        "عزيزي {$applicant->full_name}،\n\nتم تفعيل حسابك في بوابة الشركاء بنجاح.\nالبريد الإلكتروني: {$applicant->email}\nكلمة المرور المؤقتة: {$tempPass}\n\nيمكنك تسجيل الدخول وتغيير كلمة المرور في أي وقت.\nمع تحيات فريق العمل",
                        'partner_welcome',
                        $applicant->id,
                        null
                    );
                } catch (\Throwable $e) {
                    Log::warning('Failed to send partner welcome email: ' . $e->getMessage());
                }

                // If user entered this new temp pass, accept it; otherwise require the temp pass
                if (!Hash::check($validated['password'], $user->password)) {
                    return response()->json([
                        'message' => 'تم إنشاء حساب شريك جديد لك وإرسال كلمة المرور المؤقتة إلى بريدك الإلكتروني. يرجى مراجعة بريدك.',
                        'account_created' => true,
                    ], 401);
                }
            }
        }

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'بيانات الاعتماد غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'حسابك غير نشط حالياً. يرجى التواصل مع إدارة المنصة.',
            ], 403);
        }

        // Link with applicant if not already linked
        $applicant = $user->applicant ?? Applicant::where('email', $user->email)->first();
        if ($applicant && empty($applicant->user_id)) {
            $applicant->update(['user_id' => $user->id]);
        }

        $token = $user->createToken('partner-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'تم تسجيل الدخول بنجاح.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'must_change_password' => (bool)$user->must_change_password,
            ],
            'applicant' => $applicant ? $this->sanitizeApplicantForPartner($applicant) : null,
        ]);
    }

    /**
     * Requirement 2.3: إرسال كود OTP عبر البريد الإلكتروني
     */
    public function sendOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $validated['email'])->first();
        $applicant = Applicant::where('email', $validated['email'])->first();

        if (!$user && !$applicant) {
            return response()->json([
                'message' => 'لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني.',
            ], 404);
        }

        if (!$user && $applicant) {
            $contributorRole = Role::firstOrCreate(
                ['name' => 'contributor'],
                [
                    'display_name_ar' => 'شريك / مساهم',
                    'display_name_en' => 'Partner / Contributor',
                    'description' => 'بوابة الشركاء والمساهمين التقنيين',
                    'permissions' => ['partner.view', 'partner.update_profile']
                ]
            );

            $user = User::create([
                'name' => $applicant->full_name,
                'email' => $applicant->email,
                'password' => Hash::make(substr(md5(uniqid()), 0, 10)),
                'role_id' => $contributorRole->id,
                'status' => 'active',
                'must_change_password' => true,
            ]);
            $applicant->update(['user_id' => $user->id]);
        }

        $otp = (string)random_int(100000, 999999);
        $user->update([
            'otp_code' => $otp,
            'otp_expires_at' => Carbon::now()->addMinutes(15),
        ]);

        $platformName = Setting::get('platform_name', 'منصة موثِق');
        try {
            MailService::send(
                $user->email,
                "رمز التحقق والمصادقة (OTP) - {$platformName}",
                "عزيزي {$user->name}،\n\nرمز التحقق الخاص بك لتسجيل الدخول إلى بوابة الشركاء هو: {$otp}\nصلاحية الرمز 15 دقيقة فقط.\nإذا لم تقم بطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.\n\nمنصة موثِق",
                'partner_otp',
                $applicant ? $applicant->id : null,
                null
            );
        } catch (\Throwable $e) {
            Log::warning('Failed sending OTP email: ' . $e->getMessage());
        }

        $responseData = [
            'message' => 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.',
        ];
        if (config('app.debug') || app()->environment('local')) {
            $responseData['debug_otp'] = $otp;
        }

        return response()->json($responseData);
    }

    /**
     * Requirement 2.3: التحقق من كود OTP وتسجيل الدخول
     */
    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp_code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || empty($user->otp_code)) {
            return response()->json([
                'message' => 'لم يتم طلب رمز تحقق لهذا الحساب.',
            ], 422);
        }

        if ($user->otp_code !== $validated['otp_code']) {
            return response()->json([
                'message' => 'رمز التحقق غير صحيح.',
            ], 422);
        }

        if (!$user->otp_expires_at || Carbon::now()->gt($user->otp_expires_at)) {
            return response()->json([
                'message' => 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.',
            ], 422);
        }

        // Clear OTP on successful verification
        $user->update([
            'otp_code' => null,
            'otp_expires_at' => null,
        ]);

        $token = $user->createToken('partner-auth-token')->plainTextToken;
        $applicant = $user->applicant ?? Applicant::where('email', $user->email)->first();

        return response()->json([
            'message' => 'تم التحقق من الرمز بنجاح.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'must_change_password' => (bool)$user->must_change_password,
            ],
            'applicant' => $applicant ? $this->sanitizeApplicantForPartner($applicant) : null,
        ]);
    }

    /**
     * Requirement 2.4: استعادة وتعيين كلمة مرور جديدة باستخدام الـ OTP
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp_code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || empty($user->otp_code) || $user->otp_code !== $validated['otp_code']) {
            return response()->json(['message' => 'رمز التحقق غير صحيح أو غير صالح.'], 422);
        }

        if (!$user->otp_expires_at || Carbon::now()->gt($user->otp_expires_at)) {
            return response()->json(['message' => 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.'], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
            'otp_code' => null,
            'otp_expires_at' => null,
            'must_change_password' => false,
        ]);

        return response()->json([
            'message' => 'تم تغيير وتعيين كلمة المرور الجديدة بنجاح. يمكنك الآن تسجيل الدخول.',
        ]);
    }

    /**
     * Requirement 2.2 & 2.5: عرض بروفايل الشريك مع تطبيق الخصوصية الصارمة
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        $applicant = $user->applicant ?? Applicant::where('email', $user->email)->first();

        if (!$applicant) {
            return response()->json([
                'message' => 'لم يتم العثور على ملف شريك مرتبط بهذا الحساب.',
                'user' => $user,
            ], 404);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'applicant' => $this->sanitizeApplicantForPartner($applicant),
        ]);
    }

    /**
     * Requirement 2.2: تحديث بيانات بروفايل الشريك
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $applicant = $user->applicant ?? Applicant::where('email', $user->email)->first();

        if (!$applicant) {
            return response()->json(['message' => 'الملف الشخصي غير موجود.'], 404);
        }

        $validated = $request->validate([
            'full_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'bio' => 'nullable|string|max:2000',
            'social_links' => 'nullable|array',
            'portfolio_items' => 'nullable|array',
            'availability' => 'nullable|array',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (!empty($validated['full_name'])) {
            $user->update(['name' => $validated['full_name']]);
        }

        if (!empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
                'must_change_password' => false,
            ]);
        }

        $applicantUpdateData = [];
        foreach (['full_name', 'phone', 'country', 'city', 'bio', 'social_links', 'portfolio_items', 'availability'] as $field) {
            if (array_key_exists($field, $validated)) {
                $applicantUpdateData[$field] = $validated[$field];
            }
        }

        if (!empty($applicantUpdateData)) {
            $applicant->update($applicantUpdateData);
        }

        return response()->json([
            'message' => 'تم حفظ وتحديث بيانات البروفايل بنجاح.',
            'applicant' => $this->sanitizeApplicantForPartner($applicant->fresh()),
        ]);
    }

    /**
     * Requirement 2.5: استعراض مقابلات ومواعيد الشريك مع حجب التقييمات والملاحظات الداخلية
     */
    public function getMyInterviews(Request $request)
    {
        $user = $request->user();
        $applicant = $user->applicant ?? Applicant::where('email', $user->email)->first();

        if (!$applicant) {
            return response()->json(['interviews' => []]);
        }

        $interviews = Interview::where('applicant_id', $applicant->id)
            ->with('interviewer:id,name')
            ->orderBy('scheduled_at', 'desc')
            ->get()
            ->map(function ($intv) {
                $scheduledRiyadh = $intv->scheduled_at
                    ? $intv->scheduled_at->copy()->setTimezone('Asia/Riyadh')->format('Y-m-d H:i')
                    : null;

                return [
                    'id' => $intv->id,
                    'scheduled_at' => $scheduledRiyadh,
                    'interview_type' => $intv->interview_type,
                    'meeting_link' => $intv->meeting_link,
                    'status' => $intv->status,
                    'interviewer_name' => $intv->interviewer->name ?? 'فريق الاعتماد',
                ];
            });

        return response()->json([
            'interviews' => $interviews,
        ]);
    }

    /**
     * Requirement 2.5: Strict Privacy Sanitizer for Partner view
     * Completely strips: internal_notes, rejection_reason, rating, evaluator notes, scorecard questions, and internal scores.
     */
    protected function sanitizeApplicantForPartner(Applicant $applicant): array
    {
        return [
            'id' => $applicant->id,
            'application_no' => $applicant->application_no,
            'full_name' => $applicant->full_name,
            'email' => $applicant->email,
            'phone' => $applicant->phone,
            'country' => $applicant->country,
            'city' => $applicant->city,
            'position' => $applicant->position,
            'bio' => $applicant->bio,
            'status' => $applicant->status,
            'availability' => $applicant->availability,
            'social_links' => $applicant->social_links,
            'portfolio_items' => $applicant->portfolio_items,
            'resume_path' => $applicant->resume_path,
            'created_at' => $applicant->created_at ? $applicant->created_at->format('Y-m-d') : null,
        ];
    }
}
