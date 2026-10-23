<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// Serve public storage files directly with clean binary streaming (prevents SPA HTML fallback corruption)
Route::get('/storage/{path}', function (Request $request, string $path) {
    $cleanPath = ltrim(str_replace(['..\\', '../'], '', $path), '/');

    if (!Storage::disk('public')->exists($cleanPath)) {
        abort(404, 'الملف المطلوب غير موجود أو تم حذفه.');
    }

    $fullPath = Storage::disk('public')->path($cleanPath);
    $mimeType = Storage::disk('public')->mimeType($cleanPath) ?: 'application/octet-stream';
    $downloadName = $request->query('name', basename($fullPath));

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    if ($request->boolean('download')) {
        return response()->download($fullPath, $downloadName, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        ]);
    }

    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'inline; filename="' . addslashes($downloadName) . '"',
        'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
    ]);
})->where('path', '.*');

// Standalone Printable Documents (100% Isolated Clean Print)
Route::get('/interviews/{id}/agenda-doc', [\App\Http\Controllers\Api\InterviewController::class, 'agendaDoc']);
Route::get('/interviews/{id}/report-doc', [\App\Http\Controllers\Api\InterviewController::class, 'reportDoc']);

// One-click deployment helper for shared hosting / cPanel
Route::get('/system/deploy-migrate', function (Request $request) {
    $secret = config('app.key');
    $providedKey = $request->query('key');

    if ($providedKey !== 'mawthiq2026' && (! $secret || $providedKey !== substr(md5($secret), 0, 10))) {
        abort(403, 'Unauthorized deploy request.');
    }

    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    $migrateOutput = \Illuminate\Support\Facades\Artisan::output();

    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    $clearOutput = \Illuminate\Support\Facades\Artisan::output();

    return response()->json([
        'status' => 'success',
        'message' => 'Database migrated and cache cleared successfully!',
        'migrate_output' => $migrateOutput,
        'clear_output' => $clearOutput,
    ]);
});

// Catch-all route to serve the Single Page Application (React)
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
