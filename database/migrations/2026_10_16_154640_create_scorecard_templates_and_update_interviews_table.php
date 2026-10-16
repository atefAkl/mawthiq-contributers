<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scorecard_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('position')->nullable(); // Target position/role e.g. Frontend Developer, Content Writer
            $table->decimal('total_max_score', 6, 2)->default(100.00);
            $table->json('questions')->nullable(); // Array of questions with category, max_score, expected_answer
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('interviews', function (Blueprint $table) {
            $table->foreignId('scorecard_template_id')->nullable()->after('applicant_id')->constrained('scorecard_templates')->nullOnDelete();
            $table->decimal('total_score', 6, 2)->nullable()->after('questions');
            $table->decimal('max_score', 6, 2)->nullable()->after('total_score');
            $table->decimal('overall_percentage', 5, 2)->nullable()->after('max_score');
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->dropForeign(['scorecard_template_id']);
            $table->dropColumn(['scorecard_template_id', 'total_score', 'max_score', 'overall_percentage']);
        });

        Schema::dropIfExists('scorecard_templates');
    }
};
