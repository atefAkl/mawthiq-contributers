<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applicants', function (Blueprint $table) {
            $table->id();
            $table->string('application_no')->unique(); // e.g. APP-2026-0001
            $table->string('full_name');
            $table->string('email');
            $table->string('phone');
            $table->string('national_id')->nullable();
            $table->string('country')->nullable()->default('Egypt');
            $table->string('city')->nullable();
            $table->string('position'); // الدور المطلوب
            $table->integer('experience_years')->default(0);
            $table->string('education_level')->nullable(); // ثانوي، بكالوريوس، ماجستير...
            $table->string('portfolio_url')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('github_url')->nullable();
            $table->string('resume_path')->nullable();
            $table->text('cover_letter')->nullable();
            $table->json('skills')->nullable(); // Array of tags e.g. ["PHP", "Laravel", "React"]
            $table->enum('status', [
                'applicant',    // متقدم
                'participant',  // مشارك
                'probation',    // تحت الاختبار
                'accepted',     // مقبول
                'rejected'      // مرفوض
            ])->default('applicant');
            $table->decimal('rating', 3, 1)->nullable()->default(0.0); // 0.0 to 5.0
            $table->text('rejection_reason')->nullable();
            $table->text('internal_notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('position');
            $table->index('email');
            $table->index('created_at');
        });

        Schema::create('applicant_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('applicants')->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['applicant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicant_status_logs');
        Schema::dropIfExists('applicants');
    }
};
