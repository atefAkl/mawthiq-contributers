<?php

namespace Database\Seeders;

use App\Models\Applicant;
use App\Models\ApplicantStatusLog;
use App\Models\AppNotification;
use App\Models\EmailLog;
use App\Models\Interview;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Permissions
        $permissions = [
            ['name' => 'view_applicants', 'category' => 'applicants', 'display_name_ar' => 'عرض المتقدمين', 'display_name_en' => 'View Applicants'],
            ['name' => 'create_applicants', 'category' => 'applicants', 'display_name_ar' => 'إضافة متقدم جديد', 'display_name_en' => 'Create Applicants'],
            ['name' => 'edit_applicants', 'category' => 'applicants', 'display_name_ar' => 'تعديل بيانات المتقدم', 'display_name_en' => 'Edit Applicants'],
            ['name' => 'delete_applicants', 'category' => 'applicants', 'display_name_ar' => 'حذف متقدم', 'display_name_en' => 'Delete Applicants'],
            ['name' => 'promote_applicants', 'category' => 'applicants', 'display_name_ar' => 'ترقية وتغيير حالة المتقدم', 'display_name_en' => 'Change Status & Promote'],
            
            ['name' => 'schedule_interviews', 'category' => 'interviews', 'display_name_ar' => 'جدولة المقابلات', 'display_name_en' => 'Schedule Interviews'],
            ['name' => 'record_interview_results', 'category' => 'interviews', 'display_name_ar' => 'تسجيل نتائج وتقييم المقابلة', 'display_name_en' => 'Record Interview Results'],
            ['name' => 'delete_interviews', 'category' => 'interviews', 'display_name_ar' => 'إلغاء وحذف المقابلة', 'display_name_en' => 'Delete Interviews'],

            ['name' => 'view_reports', 'category' => 'reports', 'display_name_ar' => 'عرض التقارير والإحصائيات', 'display_name_en' => 'View Reports & Statistics'],
            ['name' => 'export_reports', 'category' => 'reports', 'display_name_ar' => 'تصدير التقارير', 'display_name_en' => 'Export Reports'],

            ['name' => 'send_emails', 'category' => 'emails', 'display_name_ar' => 'إرسال وتصفح البريد', 'display_name_en' => 'Send & View Emails'],

            ['name' => 'manage_users', 'category' => 'users', 'display_name_ar' => 'إدارة المستخدمين والصلاحيات', 'display_name_en' => 'Manage Users & Permissions'],
            ['name' => 'manage_settings', 'category' => 'settings', 'display_name_ar' => 'إدارة إعدادات النظام', 'display_name_en' => 'Manage System Settings'],
        ];

        $permMap = [];
        foreach ($permissions as $p) {
            $created = Permission::firstOrCreate(['name' => $p['name']], $p);
            $permMap[$p['name']] = $created->id;
        }

        // 2. Roles
        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin'], [
            'display_name_ar' => 'مدير النظام (Super Admin)',
            'display_name_en' => 'Super Administrator',
            'description' => 'كامل الصلاحيات والتحكم في كل مفاصل النظام والمستخدمين والإعدادات.'
        ]);
        $superAdminRole->permissions()->sync(array_values($permMap));

        $hrRole = Role::firstOrCreate(['name' => 'hr'], [
            'display_name_ar' => 'مسؤول توظيف (HR Manager)',
            'display_name_en' => 'HR / Recruiter',
            'description' => 'إدارة المتقدمين، ترقية الحالات، جدولة المقابلات وإرسال الإيميلات وعرض التقارير.'
        ]);
        $hrRole->permissions()->sync([
            $permMap['view_applicants'], $permMap['create_applicants'], $permMap['edit_applicants'],
            $permMap['promote_applicants'], $permMap['schedule_interviews'], $permMap['record_interview_results'],
            $permMap['view_reports'], $permMap['export_reports'], $permMap['send_emails']
        ]);

        $interviewerRole = Role::firstOrCreate(['name' => 'interviewer'], [
            'display_name_ar' => 'محكّم ومسؤول مقابلات (Interviewer)',
            'display_name_en' => 'Interviewer / Evaluator',
            'description' => 'عرض المتقدمين المحالين للمقابلة وتسجيل نتائج التقييم والملاحظات الفنية.'
        ]);
        $interviewerRole->permissions()->sync([
            $permMap['view_applicants'], $permMap['record_interview_results']
        ]);

        $viewerRole = Role::firstOrCreate(['name' => 'viewer'], [
            'display_name_ar' => 'مشاهد (Viewer)',
            'display_name_en' => 'Viewer (Read-only)',
            'description' => 'صلاحية للاطلاع والمشاهدة فقط بدون تعديل.'
        ]);
        $viewerRole->permissions()->sync([
            $permMap['view_applicants'], $permMap['view_reports']
        ]);

        $contributorRole = Role::firstOrCreate(['name' => 'contributor'], [
            'display_name_ar' => 'مساهم / متقدم (Contributor)',
            'display_name_en' => 'Contributor / Applicant',
            'description' => 'الدور الافتراضي التلقائي للمتقدمين والمساهمين لإدارة ملفاتهم الشخصية وأوقات تفرغهم ومقابلاتهم الخاصة.'
        ]);

        // 3. Admin Users
        $admin = User::firstOrCreate(['email' => 'admin@contributors.app'], [
            'name' => 'أحمد منصور (Admin)',
            'password' => Hash::make('password'),
            'role_id' => $superAdminRole->id,
            'phone' => '+201001234567',
            'status' => 'active',
            'locale' => 'ar'
        ]);

        $hrUser = User::firstOrCreate(['email' => 'hr@contributors.app'], [
            'name' => 'سارة السيد (HR)',
            'password' => Hash::make('password'),
            'role_id' => $hrRole->id,
            'phone' => '+201019876543',
            'status' => 'active',
            'locale' => 'ar'
        ]);

        $interviewerUser = User::firstOrCreate(['email' => 'interviewer@contributors.app'], [
            'name' => 'طارق مصطفى (Tech Lead)',
            'password' => Hash::make('password'),
            'role_id' => $interviewerRole->id,
            'phone' => '+201123456789',
            'status' => 'active',
            'locale' => 'ar'
        ]);

        $viewerUser = User::firstOrCreate(['email' => 'viewer@contributors.app'], [
            'name' => 'نور خالد (Auditor)',
            'password' => Hash::make('password'),
            'role_id' => $viewerRole->id,
            'phone' => '+201234567890',
            'status' => 'active',
            'locale' => 'ar'
        ]);

        // 4. Settings
        $settings = [
            'app_name' => ['value' => 'منصة إدارة المتقدمين والمساهمين', 'type' => 'string', 'group' => 'general'],
            'app_name_en' => ['value' => 'Contributors & Applicants Management', 'type' => 'string', 'group' => 'general'],
            'organization_name' => ['value' => 'منظومة التطوير والمساهمة الرقمية', 'type' => 'string', 'group' => 'general'],
            'contact_email' => ['value' => 'recruitment@contributors.app', 'type' => 'string', 'group' => 'general'],
            'contact_phone' => ['value' => '+20 100 000 0000', 'type' => 'string', 'group' => 'general'],
            'default_language' => ['value' => 'ar', 'type' => 'string', 'group' => 'general'],
            'applications_open' => ['value' => '1', 'type' => 'boolean', 'group' => 'recruitment'],
            'application_deadline' => ['value' => Carbon::now()->addMonths(2)->format('Y-m-d'), 'type' => 'string', 'group' => 'recruitment'],
            'allowed_positions' => [
                'value' => json_encode([
                    'Full Stack Developer (Laravel & React)',
                    'Backend Developer (PHP/Laravel)',
                    'Frontend Developer (React/Tailwind)',
                    'UI/UX Product Designer',
                    'Mobile Developer (Flutter)',
                    'DevOps & Cloud Engineer',
                    'Technical Project Manager',
                    'Content & Community Contributor'
                ]),
                'type' => 'json',
                'group' => 'recruitment'
            ],
            'mail_mailer' => ['value' => env('MAIL_MAILER', 'smtp'), 'type' => 'string', 'group' => 'email'],
            'mail_host' => ['value' => env('MAIL_HOST', 'smtp.gmail.com'), 'type' => 'string', 'group' => 'email'],
            'mail_port' => ['value' => (string) env('MAIL_PORT', '587'), 'type' => 'string', 'group' => 'email'],
            'mail_encryption' => ['value' => env('MAIL_ENCRYPTION', 'tls'), 'type' => 'string', 'group' => 'email'],
            'mail_username' => ['value' => env('MAIL_USERNAME', 'mawthiqtr@gmail.com'), 'type' => 'string', 'group' => 'email'],
            'mail_password' => ['value' => env('MAIL_PASSWORD', 'Shaza@2020'), 'type' => 'string', 'group' => 'email'],
            'mail_from_address' => ['value' => env('MAIL_FROM_ADDRESS', 'mawthiqtr@gmail.com'), 'type' => 'string', 'group' => 'email'],
            'mail_from_name' => ['value' => env('MAIL_FROM_NAME', 'منصة إدارة المتقدمين والمساهمين'), 'type' => 'string', 'group' => 'email'],
            'imap_host' => ['value' => env('IMAP_HOST', 'imap.gmail.com'), 'type' => 'string', 'group' => 'email'],
            'imap_port' => ['value' => (string) env('IMAP_PORT', '993'), 'type' => 'string', 'group' => 'email'],
            'imap_encryption' => ['value' => env('IMAP_ENCRYPTION', 'ssl'), 'type' => 'string', 'group' => 'email'],
            'imap_username' => ['value' => env('IMAP_USERNAME', env('MAIL_USERNAME', 'mawthiqtr@gmail.com')), 'type' => 'string', 'group' => 'email'],
            'imap_password' => ['value' => env('IMAP_PASSWORD', env('MAIL_PASSWORD', 'Shaza@2020')), 'type' => 'string', 'group' => 'email'],
        ];

        foreach ($settings as $key => $data) {
            Setting::set($key, $data['value'], $data['type'], $data['group']);
        }

        // 5. Applicants Data across stages:
        // 'applicant' (متقدم), 'participant' (مشارك), 'probation' (تحت الاختبار), 'accepted' (مقبول), 'rejected' (مرفوض)
        $candidates = [
            [
                'application_no' => 'APP-2026-0001',
                'full_name' => 'عمر عبد الله السعيد',
                'email' => 'omar.saeed@example.com',
                'phone' => '+201011122233',
                'country' => 'مصر',
                'city' => 'القاهرة',
                'position' => 'Full Stack Developer (Laravel & React)',
                'experience_years' => 5,
                'education_level' => 'بكالوريوس حاسبات ومعلومات',
                'portfolio_url' => 'https://github.com/omar-saeed',
                'github_url' => 'https://github.com/omar-saeed',
                'linkedin_url' => 'https://linkedin.com/in/omar-saeed',
                'skills' => ['Laravel', 'React', 'Tailwind CSS', 'MySQL', 'Docker', 'REST API'],
                'status' => 'accepted',
                'rating' => 4.9,
                'cover_letter' => 'شغوف بالمساهمة وتطوير المنظومات مفتوحة المصدر والحلول التقنية المتكاملة.',
                'created_at' => Carbon::now()->subDays(25),
                'history' => [
                    ['from' => null, 'to' => 'applicant', 'note' => 'تم التقديم عبر النموذج الإلكتروني'],
                    ['from' => 'applicant', 'to' => 'participant', 'note' => 'اجتاز الفرز الأولي وسيرته الذاتية ممتازة'],
                    ['from' => 'participant', 'to' => 'probation', 'note' => 'نجح في المقابلة الفنية وبدأ فترة التجربة'],
                    ['from' => 'probation', 'to' => 'accepted', 'note' => 'أتم مهمة التجربة باقتدار وتم قبوله رسمياً!'],
                ]
            ],
            [
                'application_no' => 'APP-2026-0002',
                'full_name' => 'مريم يوسف الشناوي',
                'email' => 'mariam.shenawy@example.com',
                'phone' => '+201022233344',
                'country' => 'مصر',
                'city' => 'الإسكندرية',
                'position' => 'UI/UX Product Designer',
                'experience_years' => 4,
                'education_level' => 'بكالوريوس فنون تطبيقية',
                'portfolio_url' => 'https://behance.net/mariam-ux',
                'linkedin_url' => 'https://linkedin.com/in/mariam-shenawy',
                'skills' => ['Figma', 'Design Systems', 'User Research', 'Wireframing', 'Prototyping'],
                'status' => 'probation',
                'rating' => 4.6,
                'cover_letter' => 'لدي خبرة عميقة في تصميم واجهات وتجارب المستخدم للمنصات الرقمية والتطبيقات الحديثة.',
                'created_at' => Carbon::now()->subDays(18),
                'history' => [
                    ['from' => null, 'to' => 'applicant', 'note' => 'تقديم جديد'],
                    ['from' => 'applicant', 'to' => 'participant', 'note' => 'معرض الأعمال متميز جداً'],
                    ['from' => 'participant', 'to' => 'probation', 'note' => 'أحرزت 9/10 في المقابلة وبدأت فترة الاختبار'],
                ]
            ],
            [
                'application_no' => 'APP-2026-0003',
                'full_name' => 'خالد عبد الرحمن الدوسري',
                'email' => 'khaled.dossary@example.com',
                'phone' => '+966501234567',
                'country' => 'السعودية',
                'city' => 'الرياض',
                'position' => 'Backend Developer (PHP/Laravel)',
                'experience_years' => 3,
                'education_level' => 'بكالوريوس علوم حاسب',
                'portfolio_url' => 'https://github.com/kdossary',
                'github_url' => 'https://github.com/kdossary',
                'skills' => ['PHP', 'Laravel', 'Redis', 'PostgreSQL', 'Microservices'],
                'status' => 'participant',
                'rating' => 4.2,
                'cover_letter' => 'أرغب في الانضمام للمشروع والمساهمة في بناء بنية تحتية برمجية قوية.',
                'created_at' => Carbon::now()->subDays(12),
                'history' => [
                    ['from' => null, 'to' => 'applicant', 'note' => 'تقديم عبر المنصة'],
                    ['from' => 'applicant', 'to' => 'participant', 'note' => 'تم الترقية لمشارك وتحديد موعد المقابلة'],
                ]
            ],
            [
                'application_no' => 'APP-2026-0004',
                'full_name' => 'فاطمة الزهراء إبراهيم',
                'email' => 'fatima.zahra@example.com',
                'phone' => '+201033344455',
                'country' => 'مصر',
                'city' => 'المنصورة',
                'position' => 'Frontend Developer (React/Tailwind)',
                'experience_years' => 2,
                'education_level' => 'بكالوريوس هندسة حاسبات',
                'portfolio_url' => 'https://fatimaz.dev',
                'github_url' => 'https://github.com/fatima-zahra',
                'skills' => ['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'Next.js'],
                'status' => 'applicant',
                'rating' => 3.8,
                'cover_letter' => 'متحمسة للعمل على تطبيقات تفاعلية ذات أداء عالي وسرعة فائقة.',
                'created_at' => Carbon::now()->subDays(4),
                'history' => [
                    ['from' => null, 'to' => 'applicant', 'note' => 'تم استلام الطلب وبانتظار الفرز'],
                ]
            ],
            [
                'application_no' => 'APP-2026-0005',
                'full_name' => 'محمود كمال النجار',
                'email' => 'mahmoud.najjar@example.com',
                'phone' => '+201044455566',
                'country' => 'مصر',
                'city' => 'طنطا',
                'position' => 'Mobile Developer (Flutter)',
                'experience_years' => 1,
                'education_level' => 'دبلوم تقني',
                'skills' => ['Flutter', 'Dart', 'Firebase'],
                'status' => 'rejected',
                'rating' => 2.1,
                'rejection_reason' => 'الخبرة العملية أقل من الحد الأدنى المطلوب للمشروع في المرحلة الراهنة.',
                'cover_letter' => 'حديث التخرج ومتحمس للتعلم والتدرب.',
                'created_at' => Carbon::now()->subDays(20),
                'history' => [
                    ['from' => null, 'to' => 'applicant', 'note' => 'تقديم جديد'],
                    ['from' => 'applicant', 'to' => 'rejected', 'note' => 'اعتذار لعدم توافر الخبرة المطلوبة'],
                ]
            ],
            [
                'application_no' => 'APP-2026-0006',
                'full_name' => 'هدى عبد المنعم الباز',
                'email' => 'huda.elbaz@example.com',
                'phone' => '+201055566677',
                'country' => 'مصر',
                'city' => 'الجيزة',
                'position' => 'Technical Project Manager',
                'experience_years' => 6,
                'education_level' => 'ماجستير إدارة مشاريع تقنية',
                'linkedin_url' => 'https://linkedin.com/in/huda-elbaz',
                'skills' => ['Scrum', 'Agile', 'Jira', 'Sprint Planning', 'Risk Management'],
                'status' => 'accepted',
                'rating' => 4.8,
                'cover_letter' => 'خبرة قيادية في توجيه الفرق البرمجية وتحقيق الأهداف في المواعيد المحددة.',
                'created_at' => Carbon::now()->subDays(30),
                'history' => [
                    ['from' => null, 'to' => 'applicant', 'note' => 'تقديم أولي'],
                    ['from' => 'applicant', 'to' => 'participant', 'note' => 'مقابلة أولية ممتازة'],
                    ['from' => 'participant', 'to' => 'probation', 'note' => 'اختبار عملي في إدارة نموذج مصغر'],
                    ['from' => 'probation', 'to' => 'accepted', 'note' => 'تم اعتماد القبول النهائي'],
                ]
            ],
            [
                'application_no' => 'APP-2026-0007',
                'full_name' => 'ياسين حسن العوضي',
                'email' => 'yassin.awadi@example.com',
                'phone' => '+971501239876',
                'country' => 'الإمارات',
                'city' => 'دبي',
                'position' => 'DevOps & Cloud Engineer',
                'experience_years' => 4,
                'education_level' => 'بكالوريوس هندسة شبكات',
                'github_url' => 'https://github.com/yassin-ops',
                'skills' => ['AWS', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'],
                'status' => 'probation',
                'rating' => 4.5,
                'cover_letter' => 'متخصص في بناء خطوط النشر الآلي وتأمين الخوادم السحابية.',
                'created_at' => Carbon::now()->subDays(15),
                'history' => [
                    ['from' => null, 'to' => 'applicant', 'note' => 'طلب مساهمة جديد'],
                    ['from' => 'applicant', 'to' => 'participant', 'note' => 'مؤهلات متميزة'],
                    ['from' => 'participant', 'to' => 'probation', 'note' => 'بدء مهمة إعداد خادم الاختبار'],
                ]
            ],
            [
                'application_no' => 'APP-2026-0008',
                'full_name' => 'سلمى ناصر الزهراني',
                'email' => 'salma.zahrani@example.com',
                'phone' => '+966559871234',
                'country' => 'السعودية',
                'city' => 'جدة',
                'position' => 'Content & Community Contributor',
                'experience_years' => 3,
                'education_level' => 'بكالوريوس إعلام واتصال',
                'portfolio_url' => 'https://medium.com/@salma_writer',
                'skills' => ['Technical Writing', 'Copywriting', 'SEO', 'Community Engagement'],
                'status' => 'participant',
                'rating' => 4.0,
                'cover_letter' => 'لدي كتابات تقنية وشغف ببناء المحتوى العربي المتخصص.',
                'created_at' => Carbon::now()->subDays(8),
                'history' => [
                    ['from' => null, 'to' => 'applicant', 'note' => 'تسجيل جديد'],
                    ['from' => 'applicant', 'to' => 'participant', 'note' => 'المحتوى المنشور مشجع جداً'],
                ]
            ],
            [
                'application_no' => 'APP-2026-0009',
                'full_name' => 'أنس طارق الصاوي',
                'email' => 'anas.sawy@example.com',
                'phone' => '+201066677788',
                'country' => 'مصر',
                'city' => 'أسيوط',
                'position' => 'Full Stack Developer (Laravel & React)',
                'experience_years' => 2,
                'education_level' => 'بكالوريوس نظم معلومات',
                'github_url' => 'https://github.com/anas-sawy',
                'skills' => ['Laravel', 'React', 'Livewire', 'MySQL'],
                'status' => 'applicant',
                'rating' => 3.5,
                'cover_letter' => 'أرغب في صقل خبراتي والمساهمة مع فريق عمل محترف.',
                'created_at' => Carbon::now()->subDays(2),
                'history' => [
                    ['from' => null, 'to' => 'applicant', 'note' => 'طلب مسجل جديد'],
                ]
            ]
        ];

        \Illuminate\Support\Facades\Storage::disk('public')->makeDirectory('resumes');

        foreach ($candidates as $candData) {
            $history = $candData['history'] ?? [];
            unset($candData['history']);

            $applicant = Applicant::create($candData);

            // Generate a valid PDF resume file for the seeded applicant
            $pdfFilename = 'cv_' . $applicant->id . '_v1.pdf';
            $pdfRelPath = 'resumes/' . $pdfFilename;
            $pdfTitle = 'Curriculum Vitae - ' . $applicant->application_no . ' (' . $applicant->position . ')';
            $streamContent = "BT /F1 16 Tf 50 750 Td (" . addslashes($pdfTitle) . ") Tj 0 -30 Td /F1 12 Tf (Email: " . addslashes($applicant->email) . " | Phone: " . addslashes($applicant->phone) . ") Tj 0 -22 Td (Experience: " . (int)$applicant->experience_years . " Years | Status: " . strtoupper($applicant->status) . ") Tj ET";
            $streamLen = strlen($streamContent);
            $validPdf = "%PDF-1.4\n"
                . "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
                . "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
                . "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
                . "4 0 obj\n<< /Length {$streamLen} >>\nstream\n{$streamContent}\nendstream\nendobj\n"
                . "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
                . "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000229 00000 n \n"
                . sprintf("%010d 00000 n \n", 280 + $streamLen)
                . "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" . (350 + $streamLen) . "\n%%EOF";

            \Illuminate\Support\Facades\Storage::disk('public')->put($pdfRelPath, $validPdf);
            $applicant->update([
                'resume_path' => '/storage/' . $pdfRelPath,
                'attachments' => [[
                    'id' => 'att_seed_' . $applicant->id,
                    'version' => 1,
                    'filename' => $pdfFilename,
                    'original_name' => 'CV_' . $applicant->application_no . '.pdf',
                    'path' => '/storage/' . $pdfRelPath,
                    'storage_path' => $pdfRelPath,
                    'mime_type' => 'application/pdf',
                    'size' => strlen($validPdf),
                    'notes' => 'النسخة الأولية المرفقة مع طلب التقديم',
                    'uploaded_by' => $applicant->full_name,
                    'uploaded_at' => $candData['created_at']->toIso8601String(),
                    'is_current' => true,
                    'file_exists' => true,
                ]],
            ]);

            // Log status transitions
            foreach ($history as $h) {
                ApplicantStatusLog::create([
                    'applicant_id' => $applicant->id,
                    'from_status' => $h['from'],
                    'to_status' => $h['to'],
                    'changed_by' => $admin->id,
                    'notes' => $h['note'],
                    'created_at' => $candData['created_at']->copy()->addDays(2),
                ]);
            }

            // Create sample interviews for applicants who progressed to participant / probation / accepted
            if (in_array($applicant->status, ['participant', 'probation', 'accepted'])) {
                $isCompleted = in_array($applicant->status, ['probation', 'accepted']);
                Interview::create([
                    'applicant_id' => $applicant->id,
                    'interviewer_id' => $interviewerUser->id,
                    'scheduled_at' => $isCompleted ? Carbon::now()->subDays(10) : Carbon::now()->addDays(2),
                    'interview_type' => 'online',
                    'meeting_link' => 'https://meet.google.com/xyz-' . strtolower(substr(md5($applicant->id), 0, 7)),
                    'status' => $isCompleted ? 'completed' : 'scheduled',
                    'technical_score' => $isCompleted ? rand(8, 10) : null,
                    'communication_score' => $isCompleted ? rand(8, 10) : null,
                    'commitment_score' => $isCompleted ? rand(7, 10) : null,
                    'overall_score' => $isCompleted ? rand(85, 98) / 10 : null,
                    'recommendation' => $isCompleted ? 'hire' : null,
                    'feedback' => $isCompleted ? 'مرشح ذو إمكانيات قوية، لديه فهم عميق لأساسيات المعمارية والعمل الجماعي.' : 'تم تحديد المقابلة وإرسال رابط جوجل ميت للمتقدم.',
                    'conducted_at' => $isCompleted ? Carbon::now()->subDays(10) : null,
                ]);

                // Create email log for interview invitation
                EmailLog::create([
                    'applicant_id' => $applicant->id,
                    'sender_email' => 'recruitment@contributors.app',
                    'recipient_email' => $applicant->email,
                    'subject' => 'دعوة لحضور المقابلة الشخصية - ' . $applicant->position,
                    'body' => "عزيزي {$applicant->full_name}، يسعدنا دعوتك لإجراء المقابلة الشخصية عبر الرابط التالي: https://meet.google.com/xyz",
                    'type' => 'sent',
                    'status' => 'delivered',
                    'template_name' => 'interview_invitation',
                    'sent_by' => $hrUser->id,
                    'created_at' => Carbon::now()->subDays(11),
                ]);
            }

            // If accepted, add acceptance email
            if ($applicant->status === 'accepted') {
                EmailLog::create([
                    'applicant_id' => $applicant->id,
                    'sender_email' => 'recruitment@contributors.app',
                    'recipient_email' => $applicant->email,
                    'subject' => 'تهانينا! تم قبولك رسمياً في المنصة - ' . $applicant->application_no,
                    'body' => "مرحباً {$applicant->full_name}، يسعدنا إعلامك باجتيازك لكافة المراحل بنجاح وقبولك رسمياً معنا في المشروع. سيتم تزويدك بكافة تفاصيل البدء قريباً.",
                    'type' => 'sent',
                    'status' => 'delivered',
                    'template_name' => 'acceptance_letter',
                    'sent_by' => $admin->id,
                    'created_at' => Carbon::now()->subDays(3),
                ]);

                // Received reply log
                EmailLog::create([
                    'applicant_id' => $applicant->id,
                    'sender_email' => $applicant->email,
                    'recipient_email' => 'recruitment@contributors.app',
                    'subject' => 'رد: تهانينا! تم قبولك رسمياً في المنصة',
                    'body' => 'أشكركم جزيل الشكر على هذه الثقة الغالية، ومتحمس جداً لبدء العمل والمساهمة مع الفريق الموقر.',
                    'type' => 'received',
                    'status' => 'received',
                    'created_at' => Carbon::now()->subDays(2),
                ]);
            }
        }

        // 6. In-App Notifications
        AppNotification::create([
            'user_id' => $admin->id,
            'title' => 'متقدم جديد سجل في المنصة',
            'message' => 'قام أنس طارق الصاوي بتقديم طلب جديد لوظيفة Full Stack Developer.',
            'type' => 'info',
            'action_url' => '/applicants',
            'is_read' => false,
        ]);

        AppNotification::create([
            'user_id' => $admin->id,
            'title' => 'تم ترقية متقدم لمقبول',
            'message' => 'تم إتمام قبول عمر عبد الله السعيد رسمياً كـ Full Stack Developer.',
            'type' => 'success',
            'action_url' => '/applicants',
            'is_read' => true,
        ]);

        AppNotification::create([
            'user_id' => $interviewerUser->id,
            'title' => 'مقابلة مجدولة قادمة',
            'message' => 'لديك مقابلة فنية قادمة مع خالد عبد الرحمن الدوسري.',
            'type' => 'warning',
            'action_url' => '/interviews',
            'is_read' => false,
        ]);
    }
}
