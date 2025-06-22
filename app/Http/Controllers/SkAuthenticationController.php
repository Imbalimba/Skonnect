<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Skaccount;
use App\Models\AuthenticationLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SkAuthenticationController extends Controller
{
    /**
     * Get all pending SK users
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPendingUsers(Request $request)
    {
        try {
            // Check if user has permission (Federasyon, Chairman, or Admin)
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman', 'Admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.'
                ], 403);
            }
            
            // Query to get users
            $query = Skaccount::query();
            
            // If the user is a Chairman, only show Kagawads from their barangay
            if ($skUser->sk_role === 'Chairman') {
                $query->where('sk_station', $skUser->sk_station)
                      ->where('sk_role', 'Kagawad'); // Chairman can only see Kagawads
            } 
            // If the user is a Federasyon, they can see Chairmen and Kagawads, but not other Federasyon or Admin
            else if ($skUser->sk_role === 'Federasyon') {
                $query->whereIn('sk_role', ['Chairman', 'Kagawad']);
            }
            // If the user is Admin, they can see everyone except themselves
            else if ($skUser->sk_role === 'Admin') {
                $query->where('id', '!=', $skUser->id);
            }
            
            // If a specific barangay is requested, filter by that barangay
            if ($request->has('barangay') && $request->barangay !== 'All') {
                $query->where('sk_station', $request->barangay);
            }
            
            // Additional filters
            if ($request->has('role') && $request->role !== 'All') {
                $query->where('sk_role', $request->role);
            }
            
            // Add status filter
            if ($request->has('status')) {
                $query->where('authentication_status', $request->status);
            } else {
                // Default to showing not_active users for pending
                if ($request->input('view', 'pending') === 'pending') {
                    $query->where('authentication_status', 'not_active');
                } else {
                    $query->where('authentication_status', 'active');
                }
            }
            
            // Add term status filter
            if ($request->has('term_status')) {
                $now = Carbon::now();
                
                if ($request->term_status === 'active') {
                    $query->where('term_end', '>=', $now);
                } else if ($request->term_status === 'expired') {
                    $query->where('term_end', '<', $now);
                }
            }
            
            // Add age filter
            if ($request->has('age_status')) {
                if ($request->age_status === 'eligible') {
                    $query->where('age', '>=', 15)->where('age', '<', 25);
                } else if ($request->age_status === 'ineligible') {
                    $query->where(function($q) {
                        $q->where('age', '<', 15)->orWhere('age', '>=', 25);
                    });
                }
            }
            
            if ($request->has('date_range')) {
                $dates = explode(',', $request->date_range);
                if (count($dates) === 2) {
                    $query->whereBetween('created_at', [$dates[0], $dates[1]]);
                }
            }
            
            // Sort by most recent by default
            $sortBy = $request->input('sort_by', 'created_at');
            $sortDirection = $request->input('sort_direction', 'desc');
            $query->orderBy($sortBy, $sortDirection);
            
            $users = $query->get();
            
            // Map the users to include file URLs and eligibility info
            $users = $users->map(function($user) {
                if ($user->valid_id) {
                    // The valid_id is stored as the path relative to storage/app/public
                    // We need to construct the public URL properly
                    $user->valid_id_url = asset('storage/' . $user->valid_id);
                    $user->valid_id_filename = basename($user->valid_id);
                    $user->valid_id_extension = pathinfo($user->valid_id, PATHINFO_EXTENSION);
                    
                    // Alternative: Check if file exists and provide full path
                    $fullPath = storage_path('app/public/' . $user->valid_id);
                    $user->valid_id_exists = file_exists($fullPath);
                }
                
                // Add eligibility information
                $user->term_expired = $user->isTermExpired();
                $user->over_age = $user->isOverAge();
                $user->eligible = $user->isEligible();
                
                // Format address components for display
                $address = [];
                if ($user->house_number) $address[] = $user->house_number;
                if ($user->street) $address[] = $user->street;
                if ($user->subdivision) $address[] = $user->subdivision;
                $user->formatted_address = implode(', ', $address) . "\n" . 
                                          $user->sk_station . ', ' . 
                                          $user->city . ', ' . 
                                          $user->province;
                
                return $user;
            });
            
            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get authentication statistics
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAuthStats(Request $request)
    {
        try {
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman', 'Admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.'
                ], 403);
            }
            
            // Base query
            $baseQuery = Skaccount::query();
            
            // If Chairman, restrict to Kagawads in their barangay
            if ($skUser->sk_role === 'Chairman') {
                $baseQuery->where('sk_station', $skUser->sk_station)
                          ->where('sk_role', 'Kagawad');
            } else if ($skUser->sk_role === 'Federasyon') {
                // Federasyon can see Chairmen and Kagawads
                $baseQuery->whereIn('sk_role', ['Chairman', 'Kagawad']);
            } else if ($skUser->sk_role === 'Admin') {
                // Admin can see everyone except themselves
                $baseQuery->where('id', '!=', $skUser->id);
            }
            
            // Count of non-authenticated users
            $pendingCount = (clone $baseQuery)
                ->where('authentication_status', 'not_active')
                ->count();
            
            // Count of authenticated users
            $authenticatedCount = (clone $baseQuery)
                ->where('authentication_status', 'active')
                ->count();
            
            // Recent authentications (last 7 days)
            $recentAuthentications = (clone $baseQuery)
                ->where('authentication_status', 'active')
                ->where('authenticated_at', '>=', Carbon::now()->subDays(7))
                ->count();
            
            // Additional stats for term and age
            $now = Carbon::now();
            
            // Users with expired terms
            $expiredTermCount = (clone $baseQuery)
                ->where('term_end', '<', $now)
                ->count();
            
            // Users nearing term expiration (within 30 days)
            $nearingExpirationCount = (clone $baseQuery)
                ->where('term_end', '>=', $now)
                ->where('term_end', '<=', $now->copy()->addDays(30))
                ->count();
            
            // Users over age or nearing max age
            $overAgeCount = (clone $baseQuery)
                ->where('age', '>=', 25)
                ->count();
            
            $nearingMaxAgeCount = (clone $baseQuery)
                ->where('age', '=', 24)
                ->count();
            
            // Barangay breakdown of pending users
            $barangayBreakdown = [];
            
            if ($skUser->sk_role === 'Federasyon' || $skUser->sk_role === 'Admin') {
                $barangayBreakdown = (clone $baseQuery)
                    ->where('authentication_status', 'not_active')
                    ->select('sk_station')
                    ->selectRaw('count(*) as count')
                    ->groupBy('sk_station')
                    ->get()
                    ->pluck('count', 'sk_station')
                    ->toArray();
            }
            
            return response()->json([
                'success' => true,
                'stats' => [
                    'pending' => $pendingCount,
                    'authenticated' => $authenticatedCount,
                    'recent_authentications' => $recentAuthentications,
                    'expired_terms' => $expiredTermCount,
                    'nearing_expiration' => $nearingExpirationCount,
                    'over_age' => $overAgeCount,
                    'nearing_max_age' => $nearingMaxAgeCount,
                    'barangay_breakdown' => $barangayBreakdown
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Authenticate or deauthenticate a SK user
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function authenticateUser(Request $request, $id)
    {
        try {
            // Validate request
            $request->validate([
                'status' => 'required|in:active,not_active',
                'reason' => 'nullable|string|max:500',
                'notify_user' => 'boolean'
            ]);
            
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman', 'Admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.'
                ], 403);
            }
            
            // Find the account to authenticate
            $account = Skaccount::findOrFail($id);
            
            // Chairman-specific restrictions
            if ($skUser->sk_role === 'Chairman') {
                // Chairman can only authenticate Kagawads from their barangay
                if ($account->sk_station !== $skUser->sk_station || $account->sk_role !== 'Kagawad') {
                    return response()->json([
                        'success' => false,
                        'message' => 'You can only authenticate Kagawads from your own barangay.'
                    ], 403);
                }
            } else if ($skUser->sk_role === 'Federasyon') {
                // Federasyon restrictions
                // Cannot authenticate another Federasyon or Admin
                if ($account->sk_role === 'Federasyon' || $account->sk_role === 'Admin') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Federasyon cannot authenticate other Federasyon or Admin accounts.'
                    ], 403);
                }
                
                // Cannot authenticate themselves
                if ($skUser->id === $account->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You cannot authenticate your own account.'
                    ], 403);
                }
            } else if ($skUser->sk_role === 'Admin') {
                // Admin restrictions
                // Cannot authenticate themselves
                if ($skUser->id === $account->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You cannot authenticate your own account.'
                    ], 403);
                }
            }
            
            // Check eligibility before authenticating
            if ($request->status === 'active' && $account->sk_role !== 'Admin') {
                if ($account->isTermExpired()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot authenticate user with expired term.'
                    ], 422);
                }
                
                if ($account->isOverAge()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot authenticate user who exceeds age limit (25 years).'
                    ], 422);
                }
                
                if ($account->terms_served > 3) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot authenticate user who has exceeded term limits (3 consecutive terms).'
                    ], 422);
                }
            }
            
            // Update authentication status
            $oldStatus = $account->authentication_status;
            $account->authentication_status = $request->status;
            
            // If authenticated, set the timestamp
            if ($request->status === 'active') {
                $account->authenticated_at = Carbon::now();
            } else {
                // If deauthenticated, clear the timestamp
                $account->authenticated_at = null;
            }
            
            // Add updated_by information
            $account->updated_at = Carbon::now();
            $account->updated_by = $skUser->id;
            
            $account->save();
            
            // Create detailed log entry
            $log = new AuthenticationLog();
            $log->user_id = $account->id;
            $log->authenticator_id = $skUser->id;
            $log->log_type = $request->status === 'active' ? 'authentication' : 'deauthentication';
            
            // More detailed action description
            $actionText = $request->status === 'active' ? 'Authenticated' : 'De-authenticated';
            $log->action = $actionText . ' SK user: ' . $account->first_name . ' ' . $account->last_name . ' (' . $account->sk_role . ' - ' . $account->sk_station . ')';
            
            // Include reason and additional details
            $details = [];
            if ($request->reason) {
                $details[] = 'Reason: ' . $request->reason;
            }
            $details[] = 'Previous status: ' . ucfirst($oldStatus);
            $details[] = 'New status: ' . ucfirst($request->status);
            $details[] = 'User email: ' . $account->email;
            
            $log->details = implode("\n", $details);
            $log->save();
            
            // Load relationships for response
            $log->load(['authenticator', 'user']);
            
            return response()->json([
                'success' => true,
                'message' => $request->status === 'active' 
                    ? 'User has been authenticated successfully.' 
                    : 'User has been de-authenticated successfully.',
                'user' => $account,
                'log' => $log
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Bulk authenticate or deauthenticate users
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkAuthenticate(Request $request)
    {
        try {
            // Validate request
            $request->validate([
                'user_ids' => 'required|array',
                'user_ids.*' => 'required|integer|exists:skaccounts,id',
                'status' => 'required|in:active,not_active',
                'reason' => 'nullable|string|max:500',
                'notify_users' => 'boolean'
            ]);
            
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman', 'Admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.'
                ], 403);
            }
            
            $processedCount = 0;
            $skippedCount = 0;
            $ineligibleCount = 0;
            $userIds = $request->user_ids;
            $processedUsers = [];
            $processedUserDetails = [];
            $skippedUserDetails = [];
            $ineligibleUserDetails = [];
            $now = Carbon::now();
            
            // Process each user
            foreach ($userIds as $userId) {
                try {
                    // Find the account
                    $account = Skaccount::findOrFail($userId);
                    $userDetail = $account->first_name . ' ' . $account->last_name . ' (' . $account->sk_role . ' - ' . $account->sk_station . ')';
                    
                    // Skip if current status is already the target status
                    if ($account->authentication_status === $request->status) {
                        $skippedCount++;
                        $skippedUserDetails[] = $userDetail . ' - Already ' . ($request->status === 'active' ? 'authenticated' : 'de-authenticated');
                        continue;
                    }
                    
                    // Check authorization based on role
                    $authorized = false;
                    
                    if ($skUser->sk_role === 'Chairman') {
                        // Chairman can only authenticate Kagawads from their barangay
                        if ($account->sk_station === $skUser->sk_station && $account->sk_role === 'Kagawad') {
                            $authorized = true;
                        }
                    } else if ($skUser->sk_role === 'Federasyon') {
                        // Federasyon can authenticate Chairman and Kagawad, but not other Federasyon or Admin
                        if (in_array($account->sk_role, ['Chairman', 'Kagawad']) && $account->id !== $skUser->id) {
                            $authorized = true;
                        }
                    } else if ($skUser->sk_role === 'Admin') {
                        // Admin can authenticate anyone except themselves
                        if ($account->id !== $skUser->id) {
                            $authorized = true;
                        }
                    }
                    
                    if (!$authorized) {
                        $skippedCount++;
                        $skippedUserDetails[] = $userDetail . ' - No permission';
                        continue;
                    }
                    
                    // Check eligibility for authentication
                    if ($request->status === 'active' && $account->sk_role !== 'Admin') {
                        if (!$account->isEligible()) {
                            $ineligibleCount++;
                            $reasons = [];
                            if ($account->isTermExpired()) $reasons[] = 'expired term';
                            if ($account->isOverAge()) $reasons[] = 'over age';
                            if ($account->terms_served > 3) $reasons[] = 'exceeded term limits';
                            $ineligibleUserDetails[] = $userDetail . ' - ' . implode(', ', $reasons);
                            continue;
                        }
                    }
                    
                    // Update authentication status
                    $account->authentication_status = $request->status;
                    
                    // If authenticated, set the timestamp
                    if ($request->status === 'active') {
                        $account->authenticated_at = $now;
                    } else {
                        // If deauthenticated, clear the timestamp
                        $account->authenticated_at = null;
                    }
                    
                    // Update updated_at and updated_by fields
                    $account->updated_at = $now;
                    $account->updated_by = $skUser->id;
                    
                    $account->save();
                    $processedUsers[] = $account->id;
                    $processedUserDetails[] = $userDetail . ' - ' . ($request->status === 'active' ? 'Authenticated' : 'De-authenticated');
                    $processedCount++;
                    
                } catch (\Exception $e) {
                    $skippedCount++;
                    $skippedUserDetails[] = ($userDetail ?? 'User ID: ' . $userId) . ' - Error: ' . $e->getMessage();
                    continue;
                }
            }
            
            // Create a detailed log entry for bulk action
            if ($processedCount > 0 || $skippedCount > 0 || $ineligibleCount > 0) {
                $actionText = $request->status === 'active' ? 'Bulk authenticated' : 'Bulk de-authenticated';
                
                $log = new AuthenticationLog();
                $log->user_id = $processedUsers[0] ?? $skUser->id; // Use first processed user ID or SK user ID
                $log->authenticator_id = $skUser->id;
                $log->log_type = $request->status === 'active' ? 'bulk_authentication' : 'bulk_deauthentication';
                $log->action = $actionText . ' ' . $processedCount . ' SK users';
                
                // Create detailed log message
                $detailsArray = [];
                
                if ($request->reason) {
                    $detailsArray[] = 'Reason: ' . $request->reason;
                }
                
                $detailsArray[] = 'Summary: ' . $processedCount . ' processed, ' . $skippedCount . ' skipped, ' . $ineligibleCount . ' ineligible';
                
                if (!empty($processedUserDetails)) {
                    $detailsArray[] = "\nProcessed Users:";
                    foreach ($processedUserDetails as $detail) {
                        $detailsArray[] = '✓ ' . $detail;
                    }
                }
                
                if (!empty($skippedUserDetails)) {
                    $detailsArray[] = "\nSkipped Users:";
                    foreach ($skippedUserDetails as $detail) {
                        $detailsArray[] = '⚠ ' . $detail;
                    }
                }
                
                if (!empty($ineligibleUserDetails)) {
                    $detailsArray[] = "\nIneligible Users:";
                    foreach ($ineligibleUserDetails as $detail) {
                        $detailsArray[] = '✗ ' . $detail;
                    }
                }
                
                $log->details = implode("\n", $detailsArray);
                $log->save();
            }
            
            return response()->json([
                'success' => true,
                'message' => $processedCount . ' users processed successfully. ' . 
                            $skippedCount . ' users skipped. ' .
                            $ineligibleCount . ' users were ineligible.',
                'processed_count' => $processedCount,
                'skipped_count' => $skippedCount,
                'ineligible_count' => $ineligibleCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process bulk action: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Renew a user's term
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function renewTerm(Request $request, $id)
    {
        try {
            // Validate request
            $request->validate([
                'term_start' => 'required|date',
                'term_end' => 'required|date|after:term_start',
                'terms_served' => 'required|integer|min:1|max:3',
            ]);
            
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.'
                ], 403);
            }
            
            // Find the account to renew
            $account = Skaccount::findOrFail($id);
            
            // Validate term dates
            $termStart = Carbon::parse($request->term_start);
            $termEnd = Carbon::parse($request->term_end);
            
            if ($termEnd->diffInYears($termStart) > 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Term length cannot exceed 3 years.'
                ], 422);
            }
            
            // Validate terms served
            if ($request->terms_served > 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Maximum of 3 consecutive terms allowed.'
                ], 422);
            }
            
            // Store old values for logging
            $oldTermStart = $account->term_start;
            $oldTermEnd = $account->term_end;
            $oldTermsServed = $account->terms_served;
            $oldAuthStatus = $account->authentication_status;
            
            // Update the account
            $account->term_start = $request->term_start;
            $account->term_end = $request->term_end;
            $account->terms_served = $request->terms_served;
            
            // Reset authentication status - require re-authentication
            $account->authentication_status = 'not_active';
            $account->authenticated_at = null;
            
            // Update timestamps
            $account->updated_at = Carbon::now();
            $account->updated_by = $skUser->id;
            
            $account->save();
            
            // Create detailed log entry
            $log = new AuthenticationLog();
            $log->user_id = $account->id;
            $log->authenticator_id = $skUser->id;
            $log->log_type = 'note';
            $log->action = 'Term renewed for SK user: ' . $account->first_name . ' ' . $account->last_name . ' (' . $account->sk_role . ' - ' . $account->sk_station . ')';
            
            // Create detailed description of changes
            $details = [];
            $details[] = 'User: ' . $account->first_name . ' ' . $account->last_name;
            $details[] = 'Email: ' . $account->email;
            $details[] = 'Role: ' . $account->sk_role . ' (' . $account->sk_station . ')';
            $details[] = '';
            $details[] = 'Previous Term: ' . Carbon::parse($oldTermStart)->format('M d, Y') . ' - ' . Carbon::parse($oldTermEnd)->format('M d, Y');
            $details[] = 'New Term: ' . $termStart->format('M d, Y') . ' - ' . $termEnd->format('M d, Y');
            $details[] = 'Terms Served: ' . $oldTermsServed . ' → ' . $request->terms_served;
            $details[] = 'Authentication Status: ' . ucfirst($oldAuthStatus) . ' → Not Active (requires re-authentication)';
            
            $log->details = implode("\n", $details);
            $log->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Term renewed successfully. User will need to be re-authenticated.',
                'user' => $account
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to renew term: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed user profile
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserProfile(Request $request, $id)
    {
        try {
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman', 'Admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.'
                ], 403);
            }
            
            // Find the user
            $user = Skaccount::findOrFail($id);
            
            // Chairman can only view Kagawads from their barangay
            if ($skUser->sk_role === 'Chairman' && 
                ($user->sk_station !== $skUser->sk_station || $user->sk_role !== 'Kagawad')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only view Kagawads from your own barangay.'
                ], 403);
            }
            
            // Add file URL if valid ID exists
            if ($user->valid_id) {
                // The valid_id is stored as the path relative to storage/app/public
                // We need to construct the public URL properly
                $user->valid_id_url = asset('storage/' . $user->valid_id);
                $user->valid_id_filename = basename($user->valid_id);
                $user->valid_id_extension = pathinfo($user->valid_id, PATHINFO_EXTENSION);
                
                // Alternative: Check if file exists and provide full path
                $fullPath = storage_path('app/public/' . $user->valid_id);
                $user->valid_id_exists = file_exists($fullPath);
            }
            
            // Add eligibility information
            $user->term_expired = $user->isTermExpired();
            $user->over_age = $user->isOverAge();
            $user->eligible = $user->isEligible();
            
            // Format address components for display
            $address = [];
            if ($user->house_number) $address[] = $user->house_number;
            if ($user->street) $address[] = $user->street;
            if ($user->subdivision) $address[] = $user->subdivision;
            $user->formatted_address = implode(', ', $address) . "\n" . 
                                    $user->sk_station . ', ' . 
                                    $user->city . ', ' . 
                                    $user->province;
            
            // Get any existing admin notes for this user
            $notes = AuthenticationLog::where('user_id', $id)
                ->where('log_type', 'note')
                ->with('authenticator')
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'user' => $user,
                'notes' => $notes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user profile: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a note to a user
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function addUserNote(Request $request, $id)
    {
        try {
            // Validate request
            $request->validate([
                'note' => 'required|string|max:500',
            ]);
            
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman', 'Admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.'
                ], 403);
            }
            
            // Find the user
            $user = Skaccount::findOrFail($id);
            
            // Chairman can only add notes to Kagawads from their barangay
            if ($skUser->sk_role === 'Chairman' && 
                ($user->sk_station !== $skUser->sk_station || $user->sk_role !== 'Kagawad')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only add notes to Kagawads from your own barangay.'
                ], 403);
            }
            
            // Create the note
            $note = new AuthenticationLog();
            $note->user_id = $id;
            $note->authenticator_id = $skUser->id;
            $note->log_type = 'note';
            $note->action = 'Added note for SK user: ' . $user->first_name . ' ' . $user->last_name . ' (' . $user->sk_role . ' - ' . $user->sk_station . ')';
            $note->details = 'User: ' . $user->first_name . ' ' . $user->last_name . ' (' . $user->email . ")\nNote: " . $request->note;
            $note->save();
            
            // Update the user's updated_at timestamp
            $user->updated_at = Carbon::now();
            $user->updated_by = $skUser->id;
            $user->save();
            
            // Load authenticator relationship
            $note->load('authenticator');
            
            return response()->json([
                'success' => true,
                'message' => 'Note added successfully.',
                'note' => $note
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authentication logs
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAuthLogs(Request $request)
    {
        try {
            // Check if user has permission
            $skUser = session('sk_user');
            
            if (!$skUser || !in_array($skUser->sk_role, ['Federasyon', 'Chairman', 'Admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.'
                ], 403);
            }
            
            // Query for logs
            $query = AuthenticationLog::with(['authenticator', 'user'])
                ->orderBy('created_at', 'desc');
            
            // If Chairman, only show logs from their barangay
            if ($skUser->sk_role === 'Chairman') {
                $query->whereHas('user', function($q) use ($skUser) {
                    $q->where('sk_station', $skUser->sk_station);
                });
            }
            
            // Pagination
            $perPage = $request->input('per_page', 10);
            $logs = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'logs' => $logs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch authentication logs: ' . $e->getMessage()
            ], 500);
        }
    }
}