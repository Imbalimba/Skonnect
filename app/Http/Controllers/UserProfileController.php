<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UserProfileController extends Controller
{
    /**
     * Store user profile information
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Validate the request data
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'address' => 'required|string|max:255',
                'barangay' => 'required|string|max:255',
                'gender' => 'required|string|max:10',
                'age' => 'required|integer|min:0',
                'birthdate' => 'required|date',
                'phone_number' => 'required|string|max:15',
                'email' => 'required|email|max:255',
                'civil_status' => 'required|string|max:255',
                'youth_classification' => 'required|string|max:255',
                'youth_age_group' => 'required|string|max:255',
                'educational_background' => 'required|string|max:255',
                'work_status' => 'required|string|max:255',
                'sk_voter' => 'required|string|max:255',
                'national_voter' => 'required|string|max:255',
                'kk_assembly_attendance' => 'required|string|max:255',
                'did_vote_last_election' => 'required|string|max:255',
                'kk_assembly_attendance_times' => 'required|string|max:255',
                'reason_for_not_attending' => 'nullable|string|max:255',
                'soloparent' => 'nullable|string|max:255',
                'num_of_children' => 'nullable|integer|min:0',
                'pwd' => 'nullable|string|max:255',
                'pwd_years' => 'nullable|integer|min:1',
                'athlete' => 'nullable|string|max:255',
                'sport_name' => 'nullable|string|max:255',
                'scholar' => 'nullable|string|max:255',
                'pasigscholar' => 'nullable|string|max:255',
                'scholarship_name' => 'nullable|string|max:255',
                'studying_level' => 'nullable|string|max:255',
                'yearlevel' => 'nullable|string|max:255',
                'school_name' => 'nullable|string|max:255',
                'working_status' => 'nullable|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'position_name' => 'nullable|string|max:255',
                'licensed_professional' => 'nullable|string|max:255',
                'employment_yrs' => 'nullable|integer|min:1',
                'monthly_income' => 'nullable|string|max:255',
                'youth_org' => 'nullable|string|max:255',
                'org_name' => 'nullable|string|max:255',
                'org_position' => 'nullable|string|max:255',
                'lgbtqia_member' => 'nullable|string|max:255',
                'osyranking' => 'nullable|string',
            ]);
            
            // Get the authenticated user from session instead of auth guard
            $user = Auth::guard('web')->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be logged in to create a profile.'
                ], 401);
            }
            
            // Create a new profile
            $profile = Profile::create($validatedData);
            
            // Link profile to account
            $account = Account::find($user->id);
            if ($account) {
                $profile->account_id = $account->id;
                $profile->save();
                
                // Update account profile status
                $account->profile_status = 'profiled';
                $account->save();
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Profile created successfully!',
                'profile' => $profile
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed: ' . json_encode($e->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Profile creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Profile creation failed. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the authenticated user's profile
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserProfile()
    {
        try {
            $user = Auth::guard('web')->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            // Find profile associated with this account
            $profile = Profile::where('account_id', $user->id)->first();
            
            if (!$profile) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profile not found',
                    'needs_profiling' => true
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'profile' => $profile
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching user profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching profile information'
            ], 500);
        }
    }
}