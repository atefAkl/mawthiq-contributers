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

// Catch-all route to serve the Single Page Application (React)
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
