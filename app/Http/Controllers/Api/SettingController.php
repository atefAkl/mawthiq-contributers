<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->groupBy('group');

        return response()->json([
            'settings' => $settings,
            'flat' => Setting::all()->pluck('value', 'key'),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            $existing = Setting::where('key', $key)->first();
            $type = $existing ? $existing->type : (is_bool($value) ? 'boolean' : (is_array($value) ? 'json' : 'string'));
            $group = $existing ? $existing->group : 'general';

            Setting::set($key, $value, $type, $group);
        }

        return response()->json([
            'message' => 'تم حفظ الإعدادات العامة بنجاح.',
            'flat' => Setting::all()->pluck('value', 'key'),
        ]);
    }

    public function testEmail(Request $request)
    {
        $request->validate([
            'test_email' => 'required|email',
        ]);

        $recipient = $request->test_email;
        $subject = 'رسالة اختبار إعدادات خادم البريد (SMTP Test)';
        $body = "مرحباً،\n\nتم إرسال هذه الرسالة بنجاح للتحقق من تكوين إعدادات خادم البريد (SMTP) في المنصة.\n\nالخادم: " . Setting::get('mail_host', 'smtp.gmail.com') . "\nالمستخدم: " . Setting::get('mail_username', 'mawthiqtr@gmail.com') . "\nالوقت والتاريخ: " . now()->toDateTimeString() . "\n\nمع التحية،\nفريق منصة إدارة المساهمين";

        $result = \App\Services\MailService::send(
            $recipient,
            $subject,
            $body,
            null,
            $request->user()->id,
            'smtp_test'
        );

        if (!$result['success']) {
            return response()->json([
                'message' => 'فشل اختبار إرسال البريد: ' . $result['error'],
                'error' => $result['error'],
                'email' => $result['email'],
            ], 422);
        }

        return response()->json([
            'message' => 'تم إرسال بريد الاختبار بنجاح وتم التحقق من اتصال SMTP والتسليم!',
            'email' => $result['email'],
        ]);
    }
}
