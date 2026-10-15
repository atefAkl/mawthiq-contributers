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
        Schema::table('email_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('email_logs', 'is_read')) {
                $table->boolean('is_read')->default(false)->after('status');
                $table->index('is_read');
            }
            if (!Schema::hasColumn('email_logs', 'is_starred')) {
                $table->boolean('is_starred')->default(false)->after('is_read');
                $table->index('is_starred');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('email_logs', function (Blueprint $table) {
            if (Schema::hasColumn('email_logs', 'is_read')) {
                $table->dropColumn('is_read');
            }
            if (Schema::hasColumn('email_logs', 'is_starred')) {
                $table->dropColumn('is_starred');
            }
        });
    }
};
