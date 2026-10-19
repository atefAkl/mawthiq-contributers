<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('countries')) {
            Schema::create('countries', function (Blueprint $table) {
                $table->id();
                $table->string('name_ar');
                $table->string('name_en');
                $table->string('code', 5)->unique(); // ISO 3166-1 alpha-2 (EG, SA, AE, etc.)
                $table->string('phone_code', 10); // +20, +966, +971, etc.
                $table->string('flag_emoji', 16)->nullable(); // 🇪🇬, 🇸🇦, etc.
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('cities')) {
            Schema::create('cities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('country_id')->constrained('countries')->cascadeOnDelete();
                $table->string('name_ar');
                $table->string('name_en');
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->index(['country_id', 'is_active']);
            });
        }

        Schema::table('interviews', function (Blueprint $table) {
            if (!Schema::hasColumn('interviews', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable()->after('recommendation');
            }
        });

        Schema::table('applicants', function (Blueprint $table) {
            if (!Schema::hasColumn('applicants', 'phone_code')) {
                $table->string('phone_code', 10)->nullable()->after('email');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            if (Schema::hasColumn('applicants', 'phone_code')) {
                $table->dropColumn('phone_code');
            }
        });

        Schema::table('interviews', function (Blueprint $table) {
            if (Schema::hasColumn('interviews', 'cancellation_reason')) {
                $table->dropColumn('cancellation_reason');
            }
        });

        Schema::dropIfExists('cities');
        Schema::dropIfExists('countries');
    }
};
