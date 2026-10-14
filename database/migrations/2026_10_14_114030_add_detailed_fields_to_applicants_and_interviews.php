<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            $table->integer('age')->nullable()->after('national_id');
            $table->date('birth_date')->nullable()->after('age');
            $table->string('gender')->nullable()->after('birth_date');
            $table->string('governorate')->nullable()->after('city'); // المحافظة
            $table->text('address')->nullable()->after('governorate');
            $table->string('marital_status')->nullable()->after('address');
            $table->json('social_links')->nullable()->after('skills'); // Multiple social profiles
            $table->json('portfolio_items')->nullable()->after('social_links'); // Multiple portfolio projects/images
        });

        Schema::table('interviews', function (Blueprint $table) {
            $table->json('questions')->nullable()->after('feedback'); // Custom interview questions & scores
        });
    }

    public function down(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn([
                'age',
                'birth_date',
                'gender',
                'governorate',
                'address',
                'marital_status',
                'social_links',
                'portfolio_items',
            ]);
        });

        Schema::table('interviews', function (Blueprint $table) {
            $table->dropColumn('questions');
        });
    }
};
