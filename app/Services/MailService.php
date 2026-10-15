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
        $dbMailer = Setting::get('mail_mailer');
        $mailer = (!empty($dbMailer) && $dbMailer !== 'mailtrap') ? $dbMailer : config('mail.default', 'smtp');

        $dbHost = Setting::get('mail_host');
        $host = (!empty($dbHost) && $dbHost !== 'smtp.mailtrap.io') ? $dbHost : config('mail.mailers.smtp.host', 'smtp.gmail.com');
        if ($host === 'mail.mawthiq.tech') {
            $host = 'mawthiq.tech';
        }

        $dbPort = Setting::get('mail_port');
        $port = (!empty($dbPort) && (int)$dbPort !== 2525) ? (int)$dbPort : (int)config('mail.mailers.smtp.port', 587);

        $dbEncryption = Setting::get('mail_encryption');
        $encryption = !empty($dbEncryption) ? $dbEncryption : config('mail.mailers.smtp.encryption', 'tls');

        $dbUsername = Setting::get('mail_username');
        $username = (!empty($dbUsername) && $dbUsername !== 'demo_smtp_user') ? $dbUsername : config('mail.mailers.smtp.username', 'mawthiqtr@gmail.com');
        if ($username === 'dmin@mawthiq.tech') {
            $username = 'admin@mawthiq.tech';
        }

        $dbPassword = Setting::get('mail_password');
        $password = (!empty($dbPassword) && $dbPassword !== 'demo_secret_pass') ? $dbPassword : config('mail.mailers.smtp.password', 'Shaza@2020');

        $dbFromAddress = Setting::get('mail_from_address');
        $fromAddress = (!empty($dbFromAddress) && $dbFromAddress !== 'recruitment@contributors.app') ? $dbFromAddress : config('mail.from.address', 'mawthiqtr@gmail.com');
        if ($fromAddress === 'dmin@mawthiq.tech') {
            $fromAddress = 'admin@mawthiq.tech';
        }

        $dbFromName = Setting::get('mail_from_name');
        $fromName = !empty($dbFromName) ? $dbFromName : config('mail.from.name', 'منصة إدارة المتقدمين والمساهمين');

        Config::set('mail.default', $mailer);
        Config::set('mail.mailers.smtp.transport', 'smtp');
        Config::set('mail.mailers.smtp.host', $host);
        Config::set('mail.mailers.smtp.port', $port);
        Config::set('mail.mailers.smtp.encryption', $encryption);
        Config::set('mail.mailers.smtp.scheme', ($encryption === 'ssl' || $port === 465) ? 'smtps' : null);
        Config::set('mail.mailers.smtp.username', $username);
        Config::set('mail.mailers.smtp.password', $password);
        Config::set('mail.mailers.smtp.stream', [
            'ssl' => [
                'allow_self_signed' => true,
                'verify_peer' => false,
                'verify_peer_name' => false,
            ],
        ]);
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
            'is_read' => true,
            'is_starred' => false,
        ]);

        $htmlContent = '
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; line-height: 1.6; }
                .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%); color: #ffffff; padding: 24px 28px; }
                .header h1 { margin: 0; font-size: 18px; font-weight: 700; }
                .content { padding: 28px; font-size: 14px; color: #334155; line-height: 1.7; }
                .footer { padding: 18px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 11px; color: #64748b; text-align: center; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <h1>' . htmlspecialchars($fromName) . '</h1>
                </div>
                <div class="content">
                    ' . nl2br(htmlspecialchars($body)) . '
                </div>
                <div class="footer">
                    هذه رسالة آلية صادرة من ' . htmlspecialchars($fromName) . ' &bull; mawthiq.tech
                </div>
            </div>
        </body>
        </html>';

        try {
            Mail::html($htmlContent, function ($message) use ($recipientEmail, $subject, $senderEmail, $fromName, $body) {
                $message->to($recipientEmail)
                        ->from($senderEmail, $fromName)
                        ->subject($subject)
                        ->text($body);
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
            if (str_contains($errorMessage, 'Application-specific password required') || str_contains($errorMessage, '534') || str_contains($errorMessage, 'InvalidSecondFactor') || str_contains($errorMessage, '535 5.7.8') || str_contains($errorMessage, '535')) {
                $friendlyNote = ' (تنبيه Google: نظراً لتفعيل التحقق بخطوتين 2FA في حسابات Gmail، ترفض Google كلمة المرور العادية عبر SMTP وتشترط إنشاء "كلمة مرور تطبيقات App Password" مكونة من 16 حرفاً من: https://myaccount.google.com/apppasswords ووضعها في خانة كلمة المرور).';
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

        $mailHost = Setting::get('mail_host');
        if ($mailHost === 'mail.mawthiq.tech') $mailHost = 'mawthiq.tech';
        $mailUsername = Setting::get('mail_username');
        if ($mailUsername === 'dmin@mawthiq.tech') $mailUsername = 'admin@mawthiq.tech';
        $mailPassword = Setting::get('mail_password');

        $dbHost = Setting::get('imap_host');
        $host = (!empty($dbHost) && $dbHost !== 'imap.mailtrap.io') ? $dbHost : 'imap.gmail.com';
        if ($host === 'mail.mawthiq.tech') {
            $host = 'mawthiq.tech';
        }
        $port = (int) Setting::get('imap_port', 993);
        $encryption = Setting::get('imap_encryption', 'ssl');

        $dbUser = Setting::get('imap_username');
        if (empty($dbUser) || $dbUser === 'demo_smtp_user' || $dbUser === 'mawthiqtr@gmail.com' || $host === $mailHost) {
            $username = $mailUsername ?: config('mail.mailers.smtp.username', 'admin@mawthiq.tech');
        } else {
            $username = $dbUser;
        }
        if ($username === 'dmin@mawthiq.tech') {
            $username = 'admin@mawthiq.tech';
        }

        $dbPass = Setting::get('imap_password');
        if (empty($dbPass) || $dbPass === 'demo_secret_pass' || $dbPass === 'Shaza@2020' || $host === $mailHost) {
            $password = $mailPassword ?: config('mail.mailers.smtp.password', 'Mawthiq@2020');
        } else {
            $password = $dbPass;
        }

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
