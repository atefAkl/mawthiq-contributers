<?php

use Illuminate\Support\Facades\Route;

// Catch-all route to serve the Single Page Application (React)
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
