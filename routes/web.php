<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\YouthAuthController;
use App\Http\Controllers\Auth\SkAuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\KKProfileController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\BarangayPolicyController;
use App\Http\Controllers\AnnouncementController; 
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\SkFeedbackController;
use App\Http\Controllers\EventManageController;
use App\Http\Controllers\ProfVolunteerController;
use App\Http\Controllers\VolunteerStatusController;
use App\Http\Controllers\RegisteredAttendeeController;
use App\Http\Controllers\PublishProgramController;
use App\Http\Controllers\ProgramApplicantController;
use App\Http\Controllers\PublishEventController;
use App\Http\Controllers\EventAttendeeController;
use App\Http\Controllers\ProjectMonitoringController;
use App\Http\Controllers\AnnouncementActivityLogController;
use App\Http\Controllers\PolicyActivityLogController;
use App\Http\Controllers\BarangayPolicyActivityLogController;
use App\Http\Controllers\ProfileActivityLogController;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;


// Authentication routes
Route::middleware('web')->group(function () {
    // Youth auth routes
    Route::post('/login', [YouthAuthController::class, 'login']);
    Route::post('/logout', [YouthAuthController::class, 'logout']);
    Route::post('/register', [YouthAuthController::class, 'register']);
    Route::get('/user', [YouthAuthController::class, 'user']);

    // User Profile Routes - Add these to web.php
    Route::post('/user/profile', [UserProfileController::class, 'store']);
    Route::get('/user/profile', [UserProfileController::class, 'getUserProfile']);

    // Youth verification routes
    Route::post('/verify-otp', [YouthAuthController::class, 'verifyOtp']);
    Route::post('/resend-otp', [YouthAuthController::class, 'resendOtp']);
    Route::post('/get-otp-status', [YouthAuthController::class, 'getOtpStatus']);
    
    // SK auth routes
    Route::post('/sk-login', [SkAuthController::class, 'login']);
    Route::post('/sk-register', [SkAuthController::class, 'register']);
    Route::post('/sk-logout', [SkAuthController::class, 'logout']);
    Route::get('/sk-user', [SkAuthController::class, 'user']);
    
    // SK verification routes
    Route::post('/sk-verify-otp', [SkAuthController::class, 'verifyOtp']);
    Route::post('/sk-resend-otp', [SkAuthController::class, 'resendOtp']);
    Route::post('/sk-get-otp-status', [SkAuthController::class, 'getOtpStatus']);
    
    // Password reset routes for Youth users (with rate limiting)
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/forgot-password', [ForgotPasswordController::class, 'forgotPasswordYouth']);
        Route::post('/resend-reset-otp', [ForgotPasswordController::class, 'resendResetOtpYouth']);
    });
    
    Route::post('/verify-reset-otp', [ForgotPasswordController::class, 'verifyResetOtpYouth']);
    Route::post('/reset-password', [ForgotPasswordController::class, 'resetPasswordYouth']);
    Route::post('/get-reset-otp-status', [ForgotPasswordController::class, 'getResetOtpStatusYouth']);
    
    // Password reset routes for SK users (with rate limiting)
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/sk-forgot-password', [ForgotPasswordController::class, 'forgotPasswordSk']);
        Route::post('/sk-resend-reset-otp', [ForgotPasswordController::class, 'resendResetOtpSk']);
    });
    
    Route::post('/sk-verify-reset-otp', [ForgotPasswordController::class, 'verifyResetOtpSk']);
    Route::post('/sk-reset-password', [ForgotPasswordController::class, 'resetPasswordSk']);
    Route::post('/sk-get-reset-otp-status', [ForgotPasswordController::class, 'getResetOtpStatusSk']);

    // Add these routes to the SK auth routes group
    Route::post('/sk-verify-2fa', [SkAuthController::class, 'verify2FA']);
    Route::post('/sk-resend-2fa', [SkAuthController::class, 'resend2FA']);
    Route::post('/sk-get-2fa-status', [SkAuthController::class, 'get2FAStatus']);

    // KK Profile Routes (SK authenticated routes)
    Route::middleware('web')->group(function () {
        Route::get('/api/profiles', [KKProfileController::class, 'index']);
        Route::post('/api/profiles', [KKProfileController::class, 'store']);
        Route::put('/api/profiles/{id}', [KKProfileController::class, 'update']);
        Route::delete('/api/profiles/{id}', [KKProfileController::class, 'destroy']);
        Route::put('/api/profiles/{id}/archive', [KKProfileController::class, 'archive']);
        Route::put('/api/profiles/{id}/restore', [KKProfileController::class, 'restore']);
    });

    Route::middleware('web')->group(function () {
        // SK user authentication routes
        Route::get('/api/sk-pending-users', [App\Http\Controllers\SkAuthenticationController::class, 'getPendingUsers']);
        Route::put('/api/sk-authenticate/{id}', [App\Http\Controllers\SkAuthenticationController::class, 'authenticateUser']);
        Route::get('/api/sk-auth-stats', [App\Http\Controllers\SkAuthenticationController::class, 'getAuthStats']);
        Route::get('/api/sk-auth-logs', [App\Http\Controllers\SkAuthenticationController::class, 'getAuthLogs']);
        Route::get('/api/sk-user-profile/{id}', [App\Http\Controllers\SkAuthenticationController::class, 'getUserProfile']);
        Route::post('/api/sk-user-note/{id}', [App\Http\Controllers\SkAuthenticationController::class, 'addUserNote']);
        Route::post('/api/sk-bulk-authenticate', [App\Http\Controllers\SkAuthenticationController::class, 'bulkAuthenticate']);
        Route::post('/api/sk-renew-term/{id}', [App\Http\Controllers\SkAuthenticationController::class, 'renewTerm']);
        
        Route::get('/api/youth-users', [App\Http\Controllers\YouthAuthenticationController::class, 'getYouthUsers']);
        Route::get('/api/youth-user-detail/{id}', [App\Http\Controllers\YouthAuthenticationController::class, 'getYouthUserDetail']);
        Route::put('/api/youth-authenticate/{id}', [App\Http\Controllers\YouthAuthenticationController::class, 'authenticateUser']);
        Route::put('/api/youth-update-residency/{id}', [App\Http\Controllers\YouthAuthenticationController::class, 'updateResidency']);
        Route::post('/api/youth-bulk-authenticate', [App\Http\Controllers\YouthAuthenticationController::class, 'bulkAuthenticate']);
        Route::get('/api/youth-stats', [App\Http\Controllers\YouthAuthenticationController::class, 'getYouthStats']);
    });

    // Template Management Routes (SK authenticated routes)
    Route::middleware('web')->group(function () {
        Route::prefix('api/templates')->group(function () {
            Route::get('/', [App\Http\Controllers\TemplateController::class, 'index']);
            Route::post('/', [App\Http\Controllers\TemplateController::class, 'store']);
            Route::put('/{template}', [App\Http\Controllers\TemplateController::class, 'update']);
            Route::delete('/{template}', [App\Http\Controllers\TemplateController::class, 'destroy']);
            Route::put('/{template}/archive', [App\Http\Controllers\TemplateController::class, 'archive']);
            Route::put('/{template}/restore', [App\Http\Controllers\TemplateController::class, 'restore']);
            Route::get('/{template}/download', [App\Http\Controllers\TemplateController::class, 'download']);
            Route::get('/{template}/preview', [App\Http\Controllers\TemplateController::class, 'preview']); // New preview route
            Route::post('/bulk-archive', [App\Http\Controllers\TemplateController::class, 'bulkArchive']);
            Route::post('/bulk-restore', [App\Http\Controllers\TemplateController::class, 'bulkRestore']);
            Route::post('/bulk-delete', [App\Http\Controllers\TemplateController::class, 'bulkDelete']);
        });

        Route::get('/api/templates/audit-trail', [App\Http\Controllers\TemplateController::class, 'getAuditTrail']);
    });

    Route::prefix('api/sk-user-logs')->group(function () {
        Route::post('/', [App\Http\Controllers\SkUserLogController::class, 'store']);
        Route::get('/', [App\Http\Controllers\SkUserLogController::class, 'index']);
        Route::get('/summary', [App\Http\Controllers\SkUserLogController::class, 'summary']);
    });

    // Youth feedback routes (authenticated)
    Route::middleware(['web', 'auth'])->group(function () {
        Route::get('/api/user/conversations', [FeedbackController::class, 'getUserConversations']);
        Route::post('/api/user/conversations', [FeedbackController::class, 'createConversation']);
        Route::get('/api/user/conversations/{id}/messages', [FeedbackController::class, 'getConversationMessages']);
        Route::post('/api/user/conversations/{id}/messages', [FeedbackController::class, 'sendMessage']);
        Route::put('/api/user/conversations/{id}/close', [FeedbackController::class, 'closeConversation']);
        Route::put('/api/user/conversations/{id}/reopen', [FeedbackController::class, 'reopenConversation']);
    });

    // SK feedback routes (authenticated)
    Route::middleware(['web'])->group(function () {
        Route::get('/api/sk/conversations/active', [SkFeedbackController::class, 'getActiveConversations']);
        Route::get('/api/sk/conversations/closed', [SkFeedbackController::class, 'getClosedConversations']);
        Route::get('/api/sk/conversations/{id}', [SkFeedbackController::class, 'getConversationDetails']);
        Route::post('/api/sk/conversations/{id}/messages', [SkFeedbackController::class, 'sendAgentMessage']);
        Route::put('/api/sk/conversations/{id}/status', [SkFeedbackController::class, 'changeConversationStatus']);
        Route::put('/api/sk/conversations/{id}/assign', [SkFeedbackController::class, 'assignConversation']);
        Route::get('/api/sk/agents', [SkFeedbackController::class, 'getSkAgents']);
        Route::get('/api/sk/canned-responses', [SkFeedbackController::class, 'getCannedResponses']);
        Route::post('/api/sk/canned-responses', [SkFeedbackController::class, 'createCannedResponse']);
        Route::put('/api/sk/canned-responses/{id}', [SkFeedbackController::class, 'updateCannedResponse']);
        Route::delete('/api/sk/canned-responses/{id}', [SkFeedbackController::class, 'deleteCannedResponse']);
        Route::get('/api/sk/analytics/feedback', [SkFeedbackController::class, 'getFeedbackAnalytics']);
    });

    Route::middleware('web')->group(function () {
        Route::prefix('api/directories')->group(function () {
            Route::get('/statistics', [App\Http\Controllers\DirectoryController::class, 'getStatistics']);
            Route::get('/audit-trail', [App\Http\Controllers\DirectoryController::class, 'getAuditTrail']);
            Route::get('/org-chart/{station}', [App\Http\Controllers\DirectoryController::class, 'getOrgChartData']);
            Route::get('/', [App\Http\Controllers\DirectoryController::class, 'index']);
            Route::post('/', [App\Http\Controllers\DirectoryController::class, 'store']);
            Route::post('/bulk', [App\Http\Controllers\DirectoryController::class, 'bulkOperations']);
            Route::get('/{id}', [App\Http\Controllers\DirectoryController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\DirectoryController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\DirectoryController::class, 'destroy']);
            Route::put('/{id}/archive', [App\Http\Controllers\DirectoryController::class, 'archive']);
            Route::put('/{id}/restore', [App\Http\Controllers\DirectoryController::class, 'restore']);
        });
        
        // Public API for Youth page
        Route::get('/api/public-directory', [App\Http\Controllers\DirectoryController::class, 'getPublicDirectories']);
    });

    Route::get('/api/public/awards', [App\Http\Controllers\AwardController::class, 'getPublicAwards']);

    Route::prefix('api/awards')->group(function () {
        Route::get('/statistics', [App\Http\Controllers\AwardController::class, 'getStatistics']);
        Route::get('/{id}/view', [App\Http\Controllers\AwardController::class, 'viewAward']);
        Route::get('/', [App\Http\Controllers\AwardController::class, 'index']);
        Route::post('/', [App\Http\Controllers\AwardController::class, 'store']);
        Route::put('/{id}', [App\Http\Controllers\AwardController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\AwardController::class, 'destroy']);
        Route::put('/{id}/archive', [App\Http\Controllers\AwardController::class, 'archive']);
        Route::put('/{id}/restore', [App\Http\Controllers\AwardController::class, 'restore']);
        Route::post('/bulk-archive', [App\Http\Controllers\AwardController::class, 'bulkArchive']);
        Route::post('/bulk-restore', [App\Http\Controllers\AwardController::class, 'bulkRestore']);
        Route::post('/bulk-delete', [App\Http\Controllers\AwardController::class, 'bulkDelete']);
        Route::get('/audit-trail', [App\Http\Controllers\AwardController::class, 'getAuditTrail']);
    });
});

// API routes
Route::prefix('api')->group(function () {
    // Event endpoint for calendar component
    Route::get('/event', function() {
        // Temporary mock data - replace with your controller later
        return response()->json([
            ['event' => 'Youth Forum', 'timeframe' => '2024-06-25', 'status' => 'upcoming'],
            ['event' => 'Environmental Workshop', 'timeframe' => '2024-07-03', 'status' => 'upcoming'],
            ['event' => 'Sports Festival', 'timeframe' => '2024-07-10', 'status' => 'upcoming']
        ]);
    });
    
     // Add profile activity logs routes
     Route::get('/profile-activity-logs', [ProfileActivityLogController::class, 'getAllLogs']);
     Route::get('/profiles/{profileId}/activity-logs', [ProfileActivityLogController::class, 'getProfileLogs']);
     
     Route::prefix('policies')->group(function () {
         Route::get('/', [PolicyController::class, 'index']);
         Route::post('/', [PolicyController::class, 'store']);
         Route::put('/{policy}', [PolicyController::class, 'update']);
         Route::delete('/{policy}', [PolicyController::class, 'destroy']);
         Route::put('/{policy}/archive', [PolicyController::class, 'archive']);
         Route::put('/{policy}/restore', [PolicyController::class, 'restore']);
         // Add policy activity logs routes
         Route::get('/logs', [PolicyActivityLogController::class, 'getAllLogs']);
         Route::get('/{policy}/logs', [PolicyActivityLogController::class, 'getPolicyLogs']);
     });
 

     Route::prefix('barangay-policies')->group(function () {
        Route::get('/', [BarangayPolicyController::class, 'index']);        
        Route::post('/', [BarangayPolicyController::class, 'store']);       
        Route::put('/{barangayPolicy}', [BarangayPolicyController::class, 'update']);   
        Route::delete('/{barangayPolicy}', [BarangayPolicyController::class, 'destroy']); 
        Route::put('/{barangayPolicy}/archive', [BarangayPolicyController::class, 'archive']);  
        Route::put('/{barangayPolicy}/restore', [BarangayPolicyController::class, 'restore']);  
        // Add barangay policy activity logs route
        Route::get('/logs', [BarangayPolicyActivityLogController::class, 'getAllLogs']);
    });

    Route::prefix('announcements')->group(function () {
        Route::get('/', [AnnouncementController::class, 'index']);
        Route::post('/', [AnnouncementController::class, 'store']);
        Route::put('/{id}', [AnnouncementController::class, 'update']);
        Route::delete('/{id}', [AnnouncementController::class, 'destroy']);
        Route::put('/{id}/archive', [AnnouncementController::class, 'archive']);
        Route::put('/{id}/restore', [AnnouncementController::class, 'restore']);
        Route::get('/active', [AnnouncementController::class, 'getActiveAnnouncements']);
        Route::get('/logs', [AnnouncementActivityLogController::class, 'getAllLogs']);
        // Add test route
        Route::get('/test-logs', function() {
            try {
                $logs = DB::table('announcement_activity_logs')
                    ->join('skaccounts', 'announcement_activity_logs.sk_account_id', '=', 'skaccounts.id')
                    ->join('announcements', 'announcement_activity_logs.announcement_id', '=', 'announcements.id')
                    ->select(
                        'announcement_activity_logs.*',
                        'skaccounts.first_name as sk_first_name',
                        'skaccounts.last_name as sk_last_name',
                        'announcements.title as announcement_title'
                    )
                    ->get();
                
                return response()->json([
                    'count' => $logs->count(),
                    'logs' => $logs,
                    'table_exists' => Schema::hasTable('announcement_activity_logs'),
                    'columns' => Schema::getColumnListing('announcement_activity_logs')
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ], 500);
            }
        });
    });

        // Event Management Routes
    Route::prefix('eventmanage')->group(function () {
        Route::get('/', [EventManageController::class, 'index']);
        Route::post('/', [EventManageController::class, 'store'])->name('eventmanage.store');
        Route::put('/{id}', [EventManageController::class, 'update'])->name('eventmanage.update');
        Route::delete('/{id}', [EventManageController::class, 'destroy'])->name('eventmanage.destroy');
    });
    
    // Event Publishing Routes
    Route::prefix('events')->group(function () {
        Route::post('/matching-profiles', [PublishEventController::class, 'countMatchingProfiles']);
        Route::post('/publish', [PublishEventController::class, 'store']);
        Route::get('/published-events', [PublishEventController::class, 'index']);
        Route::get('/{publishEventId}/attendees', [EventAttendeeController::class, 'index']);
        Route::post('/register-attendee', [RegisteredAttendeeController::class, 'store']);
        Route::get('/check-profile-status/{userId}', [RegisteredAttendeeController::class, 'checkProfileStatus']);
    });

    // Program routes
    Route::prefix('publish-programs')->group(function () {
        Route::post('/', [PublishProgramController::class, 'store']);
        Route::get('/', [PublishProgramController::class, 'index']);
        Route::post('/register', [PublishProgramController::class, 'register']);
    });

    // Volunteer status check
    Route::get('/volunteer-status/{userId}', [VolunteerStatusController::class, 'checkStatus']);
    Route::post('/event-attendees', [EventAttendeeController::class, 'store']);

    // Projects routes
    Route::prefix('projects')->group(function () {
        Route::get('/', [ProjectMonitoringController::class, 'index']);
        Route::post('/', [ProjectMonitoringController::class, 'store']);
        Route::get('/{id}', [ProjectMonitoringController::class, 'show']);
        Route::put('/{id}', [ProjectMonitoringController::class, 'update']);
        Route::delete('/{id}', [ProjectMonitoringController::class, 'destroy']);
    });

    // Professional Volunteer routes
    Route::apiResource('prof-volunteers', ProfVolunteerController::class);

    // Event Attendee routes
    Route::apiResource('attendees', EventAttendeeController::class);
    Route::get('/events/{publishEventId}/attendees', [EventAttendeeController::class, 'index']);

    // Registered Attendees route
    Route::get('/registered-attendees', [RegisteredAttendeeController::class, 'index']);
    Route::patch('/registered-attendees/{id}', [RegisteredAttendeeController::class, 'update']);
    Route::get('/test-registered-attendees', function() {
        try {
            return response()->json([
                'message' => 'Test route working',
                'table_exists' => Schema::hasTable('registered_attendees'),
                'columns' => Schema::getColumnListing('registered_attendees')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    });

    // Program Applicant Routes
    Route::apiResource('program-applicants', ProgramApplicantController::class);
    Route::get('program-applicants/by-program/{programId}', [ProgramApplicantController::class, 'getByProgram']);


    
});

// Barangay Policy Activity Logs Routes
Route::middleware(['auth', 'check.sk.role'])->group(function () {
    Route::get('/barangay-policy-logs', [BarangayPolicyActivityLogController::class, 'getAllLogs'])->name('barangay.policy.logs');
    Route::get('/barangay-policy/{id}/logs', [BarangayPolicyActivityLogController::class, 'getBarangayPolicyLogs'])->name('barangay.policy.logs.single');
    Route::get('/profile-activity-logs', [ProfileActivityLogController::class, 'getAllLogs']);
});


// Single entry point for SPA - this captures all routes and sends to React Router
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');