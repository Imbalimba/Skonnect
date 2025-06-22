<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AuthenticationLog;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class YouthAuthenticationController extends Controller
{
    /**
     * Get all youth users
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getYouthUsers(Request $request)
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
            
            // Query to get youth users
            $query = Account::query();
            
            // If the user is a Chairman, only show youth users from their barangay
            if ($skUser->sk_role === 'Chairman') {
                $query->where('baranggay', $skUser->sk_station);
            }
            // Federasyon and Admin can see all youth users
            
            // Apply filters if provided
            if ($request->has('barangay') && $request->barangay !== 'All') {
                $query->where('baranggay', $request->barangay);
            }
            
            if ($request->has('is_pasig_resident') && $request->is_pasig_resident !== 'All') {
                $query->where('is_pasig_resident', $request->is_pasig_resident === 'pasig');
            }
            
            if ($request->has('is_authenticated') && $request->is_authenticated !== 'All') {
                $query->where('is_authenticated', $request->is_authenticated === 'authenticated');
            }
            
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('baranggay', 'like', "%{$search}%");
                });
            }
            
            // Sort by created_at by default
            $sortBy = $request->input('sort_by', 'created_at');
            $sortDirection = $request->input('sort_direction', 'desc');
            $query->orderBy($sortBy, $sortDirection);
            
            $users = $query->get();
            
            // Map to add formatted address and proof of address URL
            $users = $users->map(function($user) {
                if ($user->proof_of_address) {
                    $user->proof_of_address_url = asset('storage/' . $user->proof_of_address);
                    $user->proof_of_address_filename = basename($user->proof_of_address);
                    $user->proof_of_address_extension = pathinfo($user->proof_of_address, PATHINFO_EXTENSION);
                    
                    // Check if file exists
                    $fullPath = storage_path('app/public/' . $user->proof_of_address);
                    $user->proof_of_address_exists = file_exists($fullPath);
                }
                
                // Format address components for display
                $address = [];
                if ($user->house_number) $address[] = $user->house_number;
                if ($user->street) $address[] = $user->street;
                if ($user->subdivision) $address[] = $user->subdivision;
                $user->formatted_address = implode(', ', $address) . "\n" . 
                                          $user->baranggay . ', ' . 
                                          $user->city . ', ' . 
                                          $user->province;
                
                return $user;
            });
            
            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch youth users: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get youth user details
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getYouthUserDetail(Request $request, $id)
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
            
            // Find the youth user
            $user = Account::findOrFail($id);
            
            // Chairman can only view youth users from their barangay
            if ($skUser->sk_role === 'Chairman' && $user->baranggay !== $skUser->sk_station) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only view youth users from your own barangay.'
                ], 403);
            }
            
            // Add proof of address URL if exists
            if ($user->proof_of_address) {
                $user->proof_of_address_url = asset('storage/' . $user->proof_of_address);
                $user->proof_of_address_filename = basename($user->proof_of_address);
                $user->proof_of_address_extension = pathinfo($user->proof_of_address, PATHINFO_EXTENSION);
                
                // Check if file exists
                $fullPath = storage_path('app/public/' . $user->proof_of_address);
                $user->proof_of_address_exists = file_exists($fullPath);
            }
            
            // Format address components for display
            $address = [];
            if ($user->house_number) $address[] = $user->house_number;
            if ($user->street) $address[] = $user->street;
            if ($user->subdivision) $address[] = $user->subdivision;
            $user->formatted_address = implode(', ', $address) . "\n" . 
                                      $user->baranggay . ', ' . 
                                      $user->city . ', ' . 
                                      $user->province;
            
            // Add volunteer profile if it exists
            if ($user->volunteerProfile) {
                $user->volunteer_profile = $user->volunteerProfile;
            }
            
            return response()->json([
                'success' => true,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user details: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Authenticate or deauthenticate a youth user
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
                'is_authenticated' => 'required|boolean',
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
            $account = Account::findOrFail($id);
            
            // Chairman can only authenticate youth users from their barangay
            if ($skUser->sk_role === 'Chairman' && $account->baranggay !== $skUser->sk_station) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only authenticate youth users from your own barangay.'
                ], 403);
            }
            
            // Update authentication status
            $oldStatus = $account->is_authenticated;
            $account->is_authenticated = $request->is_authenticated;
            
            // Add updated_at and updated_by information
            $account->updated_at = Carbon::now();
            $account->updated_by_sk = $skUser->id; // Track which SK user made the change
            $account->save();
            
            // Create detailed log entry
            $log = new AuthenticationLog();
            $log->user_id = $skUser->id; // SK user performing the action
            $log->authenticator_id = $skUser->id;
            $log->log_type = $request->is_authenticated ? 'authentication' : 'deauthentication';
            
            // More detailed action description
            $actionText = $request->is_authenticated ? 'Authenticated' : 'De-authenticated';
            $log->action = $actionText . ' youth user: ' . $account->first_name . ' ' . $account->last_name . ' (' . $account->baranggay . ')';
            
            // Include detailed information
            $details = [];
            if ($request->reason) {
                $details[] = 'Reason: ' . $request->reason;
            }
            $details[] = 'User: ' . $account->first_name . ' ' . $account->last_name;
            $details[] = 'Email: ' . $account->email;
            $details[] = 'Barangay: ' . $account->baranggay;
            $details[] = 'Residency: ' . ($account->is_pasig_resident ? 'Pasig Resident' : 'Non-Pasig Resident');
            $details[] = 'Previous status: ' . ($oldStatus ? 'Authenticated' : 'Not Authenticated');
            $details[] = 'New status: ' . ($request->is_authenticated ? 'Authenticated' : 'Not Authenticated');
            
            $log->details = implode("\n", $details);
            $log->save();
            
            // TODO: Send email notification if requested
            if ($request->notify_user) {
                // Implementation for email notification here
            }
            
            return response()->json([
                'success' => true,
                'message' => $request->is_authenticated 
                    ? 'Youth user has been authenticated successfully.' 
                    : 'Youth user has been de-authenticated successfully.',
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
     * Update youth user residency status
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateResidency(Request $request, $id)
    {
        try {
            // Validate request
            $request->validate([
                'is_pasig_resident' => 'required|boolean',
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
            
            // Find the account to update
            $account = Account::findOrFail($id);
            
            // Chairman can only update residency for youth users from their barangay
            if ($skUser->sk_role === 'Chairman' && $account->baranggay !== $skUser->sk_station) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only update residency for youth users from your own barangay.'
                ], 403);
            }
            
            // Update residency status
            $oldStatus = $account->is_pasig_resident;
            $account->is_pasig_resident = $request->is_pasig_resident;
            
            // Add updated_at and updated_by information
            $account->updated_at = Carbon::now();
            $account->updated_by_sk = $skUser->id; // Track which SK user made the change
            $account->save();
            
            // Create detailed log entry
            $log = new AuthenticationLog();
            $log->user_id = $skUser->id; // SK user performing the action
            $log->authenticator_id = $skUser->id;
            $log->log_type = 'note'; // Using note type for residency updates
            
            // More detailed action description
            $actionText = $request->is_pasig_resident ? 'Confirmed as Pasig resident' : 'Updated to non-Pasig resident';
            $log->action = $actionText . ' - youth user: ' . $account->first_name . ' ' . $account->last_name . ' (' . $account->baranggay . ')';
            
            // Include detailed information
            $details = [];
            if ($request->reason) {
                $details[] = 'Reason: ' . $request->reason;
            }
            $details[] = 'User: ' . $account->first_name . ' ' . $account->last_name;
            $details[] = 'Email: ' . $account->email;
            $details[] = 'Barangay: ' . $account->baranggay;
            $details[] = 'Previous residency: ' . ($oldStatus ? 'Pasig Resident' : 'Non-Pasig Resident');
            $details[] = 'New residency: ' . ($request->is_pasig_resident ? 'Pasig Resident' : 'Non-Pasig Resident');
            $details[] = 'Authentication status: ' . ($account->is_authenticated ? 'Authenticated' : 'Not Authenticated');
            
            $log->details = implode("\n", $details);
            $log->save();
            
            // TODO: Send email notification if requested
            if ($request->notify_user) {
                // Implementation for email notification here
            }
            
            return response()->json([
                'success' => true,
                'message' => $request->is_pasig_resident 
                    ? 'User has been confirmed as a Pasig resident.' 
                    : 'User has been updated to non-Pasig resident.',
                'user' => $account,
                'log' => $log
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update residency status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Bulk authenticate or deauthenticate youth users
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
                'user_ids.*' => 'required|integer|exists:accounts,id',
                'is_authenticated' => 'required|boolean',
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
            $userIds = $request->user_ids;
            $processedUsers = [];
            $processedUserDetails = [];
            $skippedUserDetails = [];
            $now = Carbon::now();
            
            // Process each user
            foreach ($userIds as $userId) {
                try {
                    // Find the account
                    $account = Account::findOrFail($userId);
                    $userDetail = $account->first_name . ' ' . $account->last_name . ' (' . $account->baranggay . ') - ' . $account->email;
                    
                    // Check authorization based on role
                    $authorized = false;
                    
                    if ($skUser->sk_role === 'Chairman') {
                        // Chairman can only authenticate youth users from their barangay
                        if ($account->baranggay === $skUser->sk_station) {
                            $authorized = true;
                        }
                    } else if ($skUser->sk_role === 'Federasyon' || $skUser->sk_role === 'Admin') {
                        // Federasyon and Admin can authenticate all youth users
                        $authorized = true;
                    }
                    
                    if (!$authorized) {
                        $skippedCount++;
                        $skippedUserDetails[] = $userDetail . ' - No permission (not from your barangay)';
                        continue;
                    }
                    
                    // Skip if current status is already the target status
                    if ($account->is_authenticated === $request->is_authenticated) {
                        $skippedCount++;
                        $skippedUserDetails[] = $userDetail . ' - Already ' . ($request->is_authenticated ? 'authenticated' : 'not authenticated');
                        continue;
                    }
                    
                    // Update authentication status
                    $account->is_authenticated = $request->is_authenticated;
                    $account->updated_at = $now;
                    $account->updated_by_sk = $skUser->id; // Track which SK user made the change
                    $account->save();
                    
                    $processedUsers[] = $account->id;
                    $processedUserDetails[] = $userDetail . ' - ' . ($request->is_authenticated ? 'Authenticated' : 'De-authenticated');
                    $processedCount++;
                    
                } catch (\Exception $e) {
                    $skippedCount++;
                    $skippedUserDetails[] = ($userDetail ?? 'User ID: ' . $userId) . ' - Error: ' . $e->getMessage();
                    continue;
                }
            }
            
            // Create a detailed log entry for bulk action
            if ($processedCount > 0 || $skippedCount > 0) {
                $actionText = $request->is_authenticated ? 'Bulk authenticated' : 'Bulk de-authenticated';
                
                $log = new AuthenticationLog();
                $log->user_id = $skUser->id; // SK user performing the action
                $log->authenticator_id = $skUser->id;
                $log->log_type = $request->is_authenticated ? 'bulk_authentication' : 'bulk_deauthentication';
                $log->action = $actionText . ' ' . $processedCount . ' youth users';
                
                // Create detailed log message
                $detailsArray = [];
                
                if ($request->reason) {
                    $detailsArray[] = 'Reason: ' . $request->reason;
                }
                
                $detailsArray[] = 'Summary: ' . $processedCount . ' processed, ' . $skippedCount . ' skipped';
                
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
                
                $log->details = implode("\n", $detailsArray);
                $log->save();
            }
            
            return response()->json([
                'success' => true,
                'message' => $processedCount . ' youth users processed successfully. ' . 
                            $skippedCount . ' users skipped.',
                'processed_count' => $processedCount,
                'skipped_count' => $skippedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process bulk action: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get youth user statistics
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getYouthStats(Request $request)
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
            $baseQuery = Account::query();
            
            // If the user is a Chairman, only show stats for youth users from their barangay
            if ($skUser->sk_role === 'Chairman') {
                $baseQuery->where('baranggay', $skUser->sk_station);
            }
            // Federasyon and Admin can see stats for all youth users
            
            // Count of total users
            $totalCount = (clone $baseQuery)->count();
            
            // Count by residency
            $pasigResidents = (clone $baseQuery)->where('is_pasig_resident', true)->count();
            $nonPasigResidents = (clone $baseQuery)->where('is_pasig_resident', false)->count();
            
            // Count by authentication status
            $authenticatedCount = (clone $baseQuery)->where('is_authenticated', true)->count();
            $unauthenticatedCount = (clone $baseQuery)->where('is_authenticated', false)->count();
            
            // Recent registrations (last 7 days)
            $recentRegistrations = (clone $baseQuery)
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->count();
            
            // Recent authentications (last 7 days) - users updated by SK
            $recentAuthentications = (clone $baseQuery)
                ->where('is_authenticated', true)
                ->where('updated_by_sk', '!=', null)
                ->where('updated_at', '>=', Carbon::now()->subDays(7))
                ->count();
            
            // Barangay breakdown
            $barangayBreakdown = (clone $baseQuery)
                ->select('baranggay')
                ->selectRaw('count(*) as count')
                ->groupBy('baranggay')
                ->get()
                ->pluck('count', 'baranggay')
                ->toArray();
            
            return response()->json([
                'success' => true,
                'stats' => [
                    'total' => $totalCount,
                    'pasig_residents' => $pasigResidents,
                    'non_pasig_residents' => $nonPasigResidents,
                    'authenticated' => $authenticatedCount,
                    'unauthenticated' => $unauthenticatedCount,
                    'recent_registrations' => $recentRegistrations,
                    'recent_authentications' => $recentAuthentications,
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
}