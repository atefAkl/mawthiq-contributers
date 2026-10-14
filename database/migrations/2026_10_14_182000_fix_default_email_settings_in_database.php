<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Setting;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $dummy = Setting::where('key', 'mail_username')->where('value', 'demo_smtp_user')->first();
        if ($dummy) {
            Setting::set('mail_username', env('MAIL_USERNAME', 'mawthiqtr@gmail.com'), 'string', 'email');
            Setting::set('mail_password', env('MAIL_PASSWORD', 'Shaza@2020'), 'string', 'email');
            Setting::set('mail_host', env('MAIL_HOST', 'smtp.gmail.com'), 'string', 'email');
            Setting::set('mail_port', (string) env('MAIL_PORT', '587'), 'string', 'email');
            Setting::set('mail_encryption', env('MAIL_ENCRYPTION', 'tls'), 'string', 'email');
            Setting::set('mail_from_address', env('MAIL_FROM_ADDRESS', 'mawthiqtr@gmail.com'), 'string', 'email');
            Setting::set('mail_from_name', env('MAIL_FROM_NAME', 'منصة إدارة المتقدمين والمساهمين'), 'string', 'email');
            Setting::set('imap_host', env('IMAP_HOST', 'imap.gmail.com'), 'string', 'email');
            Setting::set('imap_port', (string) env('IMAP_PORT', '993'), 'string', 'email');
            Setting::set('imap_encryption', env('IMAP_ENCRYPTION', 'ssl'), 'string', 'email');
            Setting::set('imap_username', env('IMAP_USERNAME', env('MAIL_USERNAME', 'mawthiqtr@gmail.com')), 'string', 'email');
            Setting::set('imap_password', env('IMAP_PASSWORD', env('MAIL_PASSWORD', 'Shaza@2020')), 'string', 'email');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
