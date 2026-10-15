<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\AppNotification;
use App\Models\EmailLog;
use App\Models\Setting;
use App\Services\MailService;
use Illuminate\Http\Request;

class EmailController extends Controller
{
    public function index(Request $request)
    {
        $query = EmailLog::with(['applicant', 'sentByUser'])->orderBy('created_at', 'desc');

        if ($request->filled('type') && $request->type !== 'all') {
            if ($request->type === 'unread') {
                $query->where('is_read', false);
            } elseif ($request->type === 'starred') {
                $query->where('is_starred', true);
            } else {
                $query->where('type', $request->type);
            }
        }

        if ($request->filled('applicant_id')) {
            $query->where('applicant_id', $request->applicant_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                  ->orWhere('recipient_email', 'like', "%{$search}%")
                  ->orWhere('sender_email', 'like', "%{$search}%")
                  ->orWhere('body', 'like', "%{$search}%");
            });
        }

        $emails = $query->paginate($request->get('per_page', 20));

        $stats = [
            'total' => EmailLog::count(),
            'sent' => EmailLog::where('type', 'sent')->count(),
            'received' => EmailLog::where('type', 'received')->count(),
            'unread' => EmailLog::where('is_read', false)->count(),
            'starred' => EmailLog::where('is_starred', true)->count(),
        ];

        return response()->json([
            'data' => $emails->items(),
            'current_page' => $emails->currentPage(),
            'last_page' => $emails->lastPage(),
            'total' => $emails->total(),
            'stats' => $stats,
        ]);
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'applicant_id' => 'nullable|exists:applicants,id',
            'recipient_email' => 'required|email',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'template_name' => 'nullable|string|max:100',
        ]);

        $result = MailService::send(
            $validated['recipient_email'],
            $validated['subject'],
            $validated['body'],
            $validated['applicant_id'] ?? null,
            $request->user()->id,
            $validated['template_name'] ?? 'custom'
        );

        if (!$result['success']) {
            return response()->json([
                'message' => $result['message'],
                'error' => $result['error'],
                'email' => $result['email'],
            ], 422);
        }

        return response()->json([
            'message' => $result['message'],
            'email' => $result['email'],
        ], 201);
    }

    public function syncImap(Request $request)
    {
        $result = MailService::fetchImapInbox();

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    public function inbound(Request $request)
    {
        $validated = $request->validate([
            'sender_email' => 'required|email',
            'subject' => 'required|string',
            'body' => 'required|string',
            'recipient_email' => 'nullable|email',
        ]);

        $applicant = Applicant::where('email', $validated['sender_email'])->first();

        $email = EmailLog::create([
            'applicant_id' => $applicant?->id,
            'sender_email' => $validated['sender_email'],
            'recipient_email' => $validated['recipient_email'] ?? Setting::get('mail_from_address', 'mawthiqtr@gmail.com'),
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'type' => 'received',
            'status' => 'received',
            'template_name' => 'webhook_inbound',
        ]);

        AppNotification::create([
            'user_id' => 1,
            'title' => 'بريد وارد جديد من: ' . ($applicant?->full_name ?: $validated['sender_email']),
            'message' => $validated['subject'],
            'type' => 'info',
            'action_url' => '/emails',
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'تم استلام البريد بنجاح وتسجيله في صندوق الوارد.',
            'email' => $email,
        ], 201);
    }

    public function simulateReceiveReply(Request $request)
    {
        $validated = $request->validate([
            'applicant_id' => 'required|exists:applicants,id',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
        ]);

        $applicant = Applicant::findOrFail($validated['applicant_id']);

        $email = EmailLog::create([
            'applicant_id' => $applicant->id,
            'sender_email' => $applicant->email,
            'recipient_email' => Setting::get('mail_from_address', 'recruitment@contributors.app'),
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'type' => 'received',
            'status' => 'received',
            'template_name' => 'applicant_reply',
            'sent_by' => null,
        ]);

        // Create In-App Notification
        AppNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'رسالة بريد جديدة من: ' . $applicant->full_name,
            'message' => 'وصل رد جديد بخصوص: ' . $validated['subject'],
            'type' => 'info',
            'action_url' => '/emails',
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'تم استلام الرسالة وتسجيلها في صندوق الوارد بنجاح.',
            'email' => $email->load('applicant'),
        ], 201);
    }

    public function getTemplates()
    {
        return response()->json([
            [
                'id' => 'interview_invitation',
                'title_ar' => 'دعوة لمقابلة شخصية',
                'title_en' => 'Interview Invitation',
                'subject' => 'دعوة لحضور المقابلة الشخصية - {POSITION}',
                'body' => "عزيزي {NAME}،\n\nيسرنا دعوتك لحضور المقابلة الشخصية لوظيفة ({POSITION}).\nالموعد: {DATE}\nالرابط: {LINK}\n\nنتطلع للحديث معك قريباً.\nمع التحية،\nفريق التوظيف"
            ],
            [
                'id' => 'acceptance_letter',
                'title_ar' => 'خطاب القبول الرسمي',
                'title_en' => 'Acceptance Letter',
                'subject' => 'تهانينا! تم قبولك رسمياً في المنصة - {APP_NO}',
                'body' => "مرحباً {NAME}،\n\nيسعدنا جداً إعلامك باجتيازك كافة مراحل التقييم والمقابلة، وقبولك رسمياً في المنصة كـ ({POSITION}).\nسيتم التواصل معك لتحديد موعد انطلاق أولى المهام.\n\nأهلاً بك معنا!\nفريق العمل"
            ],
            [
                'id' => 'probation_task',
                'title_ar' => 'تكليف مرحلة الاختبار (Probation)',
                'title_en' => 'Probation Task Assignment',
                'subject' => 'المهمة التجريبية لفترة الاختبار - {POSITION}',
                'body' => "عزيزي {NAME}،\n\nبناءً على نتائج المقابلة، يسعدنا انتقالك لمرحلة تحت الاختبار (Probation).\nيرجى الاطلاع على متطلبات المهمة التجريبية وتسليمها خلال أسبوع من تاريخه.\n\nبالتوفيق،\nالفريق الفني"
            ],
            [
                'id' => 'rejection_letter',
                'title_ar' => 'خطاب اعتذار (عدم القبول)',
                'title_en' => 'Rejection / Regret Letter',
                'subject' => 'بخصوص طلب انضمامك - {POSITION} [{APP_NO}]',
                'body' => "عزيزي {NAME}،\n\nنشكرك على اهتمامك ووقتك في التقدم لوظيفة ({POSITION}).\nنظراً للإقبال الكبير وتفضيل مطابقة المعايير بدقة للمرحلة الحالية، نعتذر عن عدم المضي قدماً في طلبك في الوقت الراهن، مع الاحتفاظ ببياناتك للفرص المستقبلية.\n\nمع تمنياتنا لك بالتوفيق والنجاح.\nفريق الاستقطاب"
            ],
        ]);
    }

    public function toggleRead(Request $request, $id)
    {
        $email = EmailLog::findOrFail($id);
        $isRead = $request->has('is_read') ? $request->boolean('is_read') : !$email->is_read;
        $email->update(['is_read' => $isRead]);

        return response()->json([
            'message' => $isRead ? 'تم تعليم الرسالة كمقروءة.' : 'تم تعليم الرسالة كغير مقروءة.',
            'email' => $email->load(['applicant', 'sentByUser']),
        ]);
    }

    public function toggleStar(Request $request, $id)
    {
        $email = EmailLog::findOrFail($id);
        $isStarred = $request->has('is_starred') ? $request->boolean('is_starred') : !$email->is_starred;
        $email->update(['is_starred' => $isStarred]);

        return response()->json([
            'message' => $isStarred ? 'تمت إضافة الرسالة إلى المميزة بنجمة.' : 'تمت إزالة الرسالة من المميزة بنجمة.',
            'email' => $email->load(['applicant', 'sentByUser']),
        ]);
    }

    public function destroy($id)
    {
        $email = EmailLog::findOrFail($id);
        $email->delete();

        return response()->json([
            'message' => 'تم حذف الرسالة بنجاح.',
        ]);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:email_logs,id',
            'action' => 'required|string|in:delete,mark_read,mark_unread,star,unstar',
        ]);

        $ids = $validated['ids'];
        $count = count($ids);

        switch ($validated['action']) {
            case 'delete':
                EmailLog::whereIn('id', $ids)->delete();
                $msg = "تم حذف {$count} رسائل بنجاح.";
                break;
            case 'mark_read':
                EmailLog::whereIn('id', $ids)->update(['is_read' => true]);
                $msg = "تم تعليم {$count} رسائل كمقروءة.";
                break;
            case 'mark_unread':
                EmailLog::whereIn('id', $ids)->update(['is_read' => false]);
                $msg = "تم تعليم {$count} رسائل كغير مقروءة.";
                break;
            case 'star':
                EmailLog::whereIn('id', $ids)->update(['is_starred' => true]);
                $msg = "تمت إضافة {$count} رسائل إلى المميزة بنجمة.";
                break;
            case 'unstar':
                EmailLog::whereIn('id', $ids)->update(['is_starred' => false]);
                $msg = "تمت إزالة {$count} رسائل من المميزة بنجمة.";
                break;
        }

        $stats = [
            'total' => EmailLog::count(),
            'sent' => EmailLog::where('type', 'sent')->count(),
            'received' => EmailLog::where('type', 'received')->count(),
            'unread' => EmailLog::where('is_read', false)->count(),
            'starred' => EmailLog::where('is_starred', true)->count(),
        ];

        return response()->json([
            'message' => $msg,
            'stats' => $stats,
        ]);
    }
}
