<?php

namespace App\Services;

use App\Models\Applicant;
use App\Models\AppNotification;
use App\Models\EmailLog;
use App\Models\Setting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Exception;

class MailService
{
    /**
     * Dynamically configure Laravel's mailer from database settings (with fallback to config/.env)
     */
    public static function applyMailConfig(): array
    {
        $mailer = Setting::get('mail_mailer', config('mail.default', 'smtp'));
        $host = Setting::get('mail_host', config('mail.mailers.smtp.host', 'smtp.gmail.com'));
        $port = (int) Setting::get('mail_port', config('mail.mailers.smtp.port', 587));
        $encryption = Setting::get('mail_encryption', config('mail.mailers.smtp.encryption', 'tls'));
        $username = Setting::get('mail_username', config('mail.mailers.smtp.username', 'mawthiqtr@gmail.com'));
        $password = Setting::get('mail_password', config('mail.mailers.smtp.password', 'Shaza@2020'));
        $fromAddress = Setting::get('mail_from_address', config('mail.from.address', 'mawthiqtr@gmail.com'));
        $fromName = Setting::get('mail_from_name', config('mail.from.name', 'Contributors Platform'));

        Config::set('mail.default', $mailer);
        Config::set('mail.mailers.smtp.transport', 'smtp');
        Config::set('mail.mailers.smtp.host', $host);
        Config::set('mail.mailers.smtp.port', $port);
        Config::set('mail.mailers.smtp.encryption', $encryption);
        Config::set('mail.mailers.smtp.scheme', ($encryption === 'ssl' || $port === 465) ? 'smtps' : null);
        Config::set('mail.mailers.smtp.username', $username);
        Config::set('mail.mailers.smtp.password', $password);
        Config::set('mail.from.address', $fromAddress);
        Config::set('mail.from.name', $fromName);

        // Purge existing mailer instance so new settings take effect immediately
        app()->forgetInstance('mail.manager');

        return [
            'mailer' => $mailer,
            'host' => $host,
            'port' => $port,
            'encryption' => $encryption,
            'username' => $username,
            'from_address' => $fromAddress,
            'from_name' => $fromName,
        ];
    }

    /**
     * Send email dynamically and log to database
     */
    public static function send(
        string $recipientEmail,
        string $subject,
        string $body,
        ?int $applicantId = null,
        ?int $userId = null,
        string $templateName = 'custom'
    ): array {
        $config = self::applyMailConfig();
        $senderEmail = $config['from_address'];
        $fromName = $config['from_name'];

        $emailLog = EmailLog::create([
            'applicant_id' => $applicantId,
            'sender_email' => $senderEmail,
            'recipient_email' => $recipientEmail,
            'subject' => $subject,
            'body' => $body,
            'type' => 'sent',
            'status' => 'sent',
            'template_name' => $templateName,
            'sent_by' => $userId,
        ]);

        try {
            Mail::raw($body, function ($message) use ($recipientEmail, $subject, $senderEmail, $fromName) {
                $message->to($recipientEmail)
                        ->from($senderEmail, $fromName)
                        ->subject($subject);
            });

            $emailLog->update(['status' => 'delivered']);

            return [
                'success' => true,
                'message' => 'تم إرسال البريد الإلكتروني بنجاح وتسليمه إلى الخادم.',
                'email' => $emailLog->fresh(['applicant', 'sentByUser']),
            ];
        } catch (Exception $e) {
            $errorMessage = $e->getMessage();
            $friendlyNote = '';
            if (str_contains($errorMessage, 'Application-specific password required') || str_contains($errorMessage, '534')) {
                $friendlyNote = ' (تنبيه Google: حساب Gmail هذا مفعل به التحقق بخطوتين 2FA، وتشترط Google إنشاء "كلمة مرور تطبيقات App Password" من 16 حرفاً من إعدادات حساب Google لوضعها في خانة كلمة المرور بدلاً من كلمة المرور العادية).';
            }

            $displayMessage = 'فشل إرسال البريد عبر الخادم: ' . $errorMessage . $friendlyNote;

            $emailLog->update([
                'status' => 'failed',
                'body' => $body . "\n\n[خطأ الإرسال]: " . $displayMessage,
            ]);

            return [
                'success' => false,
                'message' => $displayMessage,
                'error' => $errorMessage,
                'friendly_tip' => $friendlyNote,
                'email' => $emailLog->fresh(['applicant', 'sentByUser']),
            ];
        }
    }

    /**
     * Fetch unread emails from IMAP inbox (e.g. Gmail / cPanel)
     */
    public static function fetchImapInbox(): array
    {
        if (!function_exists('imap_open')) {
            return [
                'success' => false,
                'message' => 'إضافة PHP IMAP غير مفعلة على هذا الخادم.',
                'count' => 0,
            ];
        }

        $host = Setting::get('imap_host', 'imap.gmail.com');
        $port = Setting::get('imap_port', 993);
        $encryption = Setting::get('imap_encryption', 'ssl');
        $username = Setting::get('imap_username', Setting::get('mail_username', 'mawthiqtr@gmail.com'));
        $password = Setting::get('imap_password', Setting::get('mail_password', 'Shaza@2020'));

        $flags = "/imap/{$encryption}/novalidate-cert";
        $mailbox = "{" . "{$host}:{$port}{$flags}" . "}INBOX";

        // Suppress warnings to catch clean error
        $inbox = @imap_open($mailbox, $username, $password, 0, 1);

        if (!$inbox) {
            $lastError = imap_last_error();
            return [
                'success' => false,
                'message' => 'تعذر الاتصال بصندوق الوارد IMAP: ' . ($lastError ?: 'يرجى التأكد من بيانات الاعتماد أو إنشاء كلمة مرور تطبيقات في حساب Google.'),
                'error' => $lastError,
                'count' => 0,
            ];
        }

        $emails = imap_search($inbox, 'UNSEEN');
        $importedCount = 0;

        if ($emails) {
            rsort($emails);
            foreach (array_slice($emails, 0, 20) as $emailNumber) {
                $overview = imap_fetch_overview($inbox, $emailNumber, 0);
                $header = imap_headerinfo($inbox, $emailNumber);

                $from = $header->from[0] ?? null;
                $senderEmail = $from ? ($from->mailbox . '@' . $from->host) : 'unknown@example.com';
                $senderName = $from ? (isset($from->personal) ? imap_utf8($from->personal) : $senderEmail) : $senderEmail;

                $rawSubject = $overview[0]->subject ?? '(بدون موضوع)';
                $subject = imap_utf8($rawSubject);

                $body = imap_fetchbody($inbox, $emailNumber, 1.1);
                if (empty($body)) {
                    $body = imap_fetchbody($inbox, $emailNumber, 1);
                }
                $body = strip_tags(imap_utf8($body) ?: 'رسالة واردة عبر البريد الإلكتروني.');

                // Match with an existing applicant if possible
                $applicant = Applicant::where('email', $senderEmail)->first();

                // Avoid duplicate import by checking subject and sender
                $alreadyLogged = EmailLog::where('sender_email', $senderEmail)
                    ->where('subject', $subject)
                    ->where('type', 'received')
                    ->where('created_at', '>=', now()->subHours(24))
                    ->exists();

                if (!$alreadyLogged) {
                    EmailLog::create([
                        'applicant_id' => $applicant?->id,
                        'sender_email' => $senderEmail,
                        'recipient_email' => $username,
                        'subject' => $subject,
                        'body' => $body,
                        'type' => 'received',
                        'status' => 'received',
                        'template_name' => 'imap_inbound',
                    ]);

                    AppNotification::create([
                        'user_id' => 1, // Super admin
                        'title' => 'رسالة بريد إلكتروني واردة: ' . $senderName,
                        'message' => $subject,
                        'type' => 'info',
                        'action_url' => '/emails',
                        'is_read' => false,
                    ]);

                    $importedCount++;
                }
            }
        }

        imap_close($inbox);

        return [
            'success' => true,
            'message' => "تم فحص صندوق الوارد بنجاح، تم استيراد {$importedCount} رسائل واردة جديدة.",
            'count' => $importedCount,
        ];
    }
}
