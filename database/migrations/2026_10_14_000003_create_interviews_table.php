<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('applicants')->cascadeOnDelete();
            $table->dateTime('scheduled_at');
            $table->string('interview_type')->default('online'); // online, in_person, phone
            $table->string('meeting_link')->nullable(); // Google Meet, Zoom link, etc.
            $table->string('location')->nullable();
            $table->foreignId('interviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
            
            // Evaluation & Results Recording
            $table->integer('technical_score')->nullable(); // 1 - 10
            $table->integer('communication_score')->nullable(); // 1 - 10
            $table->integer('commitment_score')->nullable(); // 1 - 10
            $table->decimal('overall_score', 4, 2)->nullable(); // e.g. 8.5
            $table->enum('recommendation', ['strong_hire', 'hire', 'under_consideration', 'reject'])->nullable();
            $table->text('feedback')->nullable();
            $table->dateTime('conducted_at')->nullable();
            $table->timestamps();

            $table->index('applicant_id');
            $table->index('status');
            $table->index('scheduled_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
