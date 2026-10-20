<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Changes interviews.status from rigid ENUM to VARCHAR(50)
     * to safely support 'missed' and future statuses without truncation errors in MySQL.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `interviews` MODIFY `status` VARCHAR(50) NOT NULL DEFAULT 'scheduled'");
        } else {
            Schema::table('interviews', function (Blueprint $table) {
                $table->string('status', 50)->default('scheduled')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `interviews` MODIFY `status` ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') NOT NULL DEFAULT 'scheduled'");
        } else {
            Schema::table('interviews', function (Blueprint $table) {
                $table->string('status', 50)->default('scheduled')->change();
            });
        }
    }
};
