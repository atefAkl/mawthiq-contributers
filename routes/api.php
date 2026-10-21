<?php

use App\Http\Controllers\Api\ApplicantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CountryController;
use App\Http\Controllers\Api\EmailController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PublicApplyController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ScorecardTemplateController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

Route::prefix('public')->group(function () {
    Route::get('/config', [PublicApplyController::class, 'getConfig']);
    Route::post('/apply', [PublicApplyController::class, 'apply']);
    Route::get('/countries', [CountryController::class, 'index']);
    Route::get('/countries/{id}/cities', [CountryController::class, 'getCities']);
});

Route::get('/countries', [CountryController::class, 'index']);
Route::get('/countries/{id}/cities', [CountryController::class, 'getCities']);
Route::get('/applicants/export', [ApplicantController::class, 'export']);

/*
|--------------------------------------------------------------------------
| Protected Authenticated Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Active User Profile
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Notifications (Flash / Bell)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllRead']);
    });

    // Reports & Statistics
    Route::prefix('reports')->group(function () {
        Route::get('/dashboard', [ReportController::class, 'getDashboardStats']);
    });

    // Applicants Management & Status/Promotion
    Route::prefix('applicants')->group(function () {
        Route::get('/', [ApplicantController::class, 'index']);
        Route::post('/', [ApplicantController::class, 'store']);
        Route::get('/{id}', [ApplicantController::class, 'show']);
        Route::put('/{id}', [ApplicantController::class, 'update']);
        Route::delete('/{id}', [ApplicantController::class, 'destroy']);
        Route::post('/{id}/status', [ApplicantController::class, 'updateStatus']);
        Route::patch('/{id}/availability', [ApplicantController::class, 'updateAvailability']);
        Route::put('/{id}/availability', [ApplicantController::class, 'updateAvailability']);
        Route::post('/{id}/resume', [ApplicantController::class, 'uploadResume']);
        Route::patch('/{id}/resume/{attachmentId}/activate', [ApplicantController::class, 'activateResume']);
        Route::delete('/{id}/resume/{attachmentId?}', [ApplicantController::class, 'deleteResume']);
    });

    // Interviews & Evaluation Results
    Route::prefix('interviews')->group(function () {
        Route::get('/', [InterviewController::class, 'index']);
        Route::get('/interviewers', [InterviewController::class, 'getInterviewers']);
        Route::get('/available-slots', [InterviewController::class, 'getAvailableSlots']);
        Route::post('/', [InterviewController::class, 'store']);
        Route::get('/{id}', [InterviewController::class, 'show']);
        Route::put('/{id}', [InterviewController::class, 'update']);
        Route::delete('/{id}', [InterviewController::class, 'destroy']);
        Route::post('/{id}/result', [InterviewController::class, 'recordResult']);
        Route::post('/{id}/questions', [InterviewController::class, 'updateQuestions']);
    });

    // Scorecard Templates
    Route::prefix('scorecard-templates')->group(function () {
        Route::get('/', [ScorecardTemplateController::class, 'index']);
        Route::post('/', [ScorecardTemplateController::class, 'store']);
        Route::get('/{id}', [ScorecardTemplateController::class, 'show']);
        Route::put('/{id}', [ScorecardTemplateController::class, 'update']);
        Route::delete('/{id}', [ScorecardTemplateController::class, 'destroy']);
    });

    // Send and Receive Emails
    Route::prefix('emails')->group(function () {
        Route::get('/', [EmailController::class, 'index']);
        Route::post('/send', [EmailController::class, 'send']);
        Route::post('/simulate-reply', [EmailController::class, 'simulateReceiveReply']);
        Route::post('/sync-imap', [EmailController::class, 'syncImap']);
        Route::post('/inbound', [EmailController::class, 'inbound']);
        Route::get('/templates', [EmailController::class, 'getTemplates']);
        Route::patch('/{id}/read', [EmailController::class, 'toggleRead']);
        Route::patch('/{id}/star', [EmailController::class, 'toggleStar']);
        Route::delete('/{id}', [EmailController::class, 'destroy']);
        Route::post('/bulk-action', [EmailController::class, 'bulkAction']);
    });

    // User Management & RBAC
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
    });

    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::put('/{id}/permissions', [RoleController::class, 'updatePermissions']);
    });

    // General & System Settings
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingController::class, 'index']);
        Route::post('/', [SettingController::class, 'update']);
        Route::post('/test-email', [SettingController::class, 'testEmail']);
    });
});
