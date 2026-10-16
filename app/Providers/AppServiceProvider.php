<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Prevent Laravel's FilesystemServiceProvider from hijacking /storage/{path}
        // for the private 'local' disk and returning 403 Forbidden on unsigned URLs
        config(['filesystems.disks.local.serve' => false]);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
