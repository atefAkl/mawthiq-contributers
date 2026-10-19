<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            if (!Schema::hasIndex('applicants', 'applicants_email_unique')) {
                $table->unique('email', 'applicants_email_unique');
            }
            if (!Schema::hasIndex('applicants', 'applicants_phone_unique')) {
                $table->unique('phone', 'applicants_phone_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            if (Schema::hasIndex('applicants', 'applicants_email_unique')) {
                $table->dropUnique('applicants_email_unique');
            }
            if (Schema::hasIndex('applicants', 'applicants_phone_unique')) {
                $table->dropUnique('applicants_phone_unique');
            }
        });
    }
};
