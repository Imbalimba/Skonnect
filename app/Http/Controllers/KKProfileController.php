<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\ArchivedProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\ProfileActivityLogController;

class KKProfileController extends Controller
{
    /**
     * Fetch all profiles from the database (active or archived)
     */
    public function index(Request $request)
    {
        $archived = $request->query('archived', '0');
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json([
                'success' => false,
                'message' => 'Not authenticated'
            ], 401);
        }
        
        // Base query
        $query = Profile::query();
        
        // Filter by barangay (station) if not federation admin
        if ($skUser->sk_role !== 'Federasyon') {
            $query->where('barangay', $skUser->sk_station);
        } else if ($request->has('barangay') && $request->barangay !== 'All') {
            $query->where('barangay', $request->barangay);
        }
        
        if ($archived === '1') {
            // Get profiles that have an entry in archived_profiles table
            $profiles = $query->with('archivedRecord')
                ->whereHas('archivedRecord')
                ->get();
                
            // Add archived_date and archive_reason to the response
            $profiles = $profiles->map(function($profile) {
                if ($profile->archivedRecord) {
                    $profile->setAttribute('archive_date', $profile->archivedRecord->archived_date->format('Y-m-d'));
                    $profile->setAttribute('archive_reason', $profile->archivedRecord->archive_reason);
                }
                return $profile;
            });
        } else {
            // Get profiles that don't have an entry in archived_profiles table
            $profiles = $query->whereDoesntHave('archivedRecord')->get();
        }
    
        return response()->json($profiles);
    }
    
    /**
     * Store profile information
     */
    public function store(Request $request)
    {
        try {
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

            $profile = Profile::create($validatedData);

            // Log the creation activity
            ProfileActivityLogController::logActivity(
                $profile->id,
                'create',
                'Created new profile',
                [
                    'first_name' => $profile->first_name,
                    'last_name' => $profile->last_name,
                    'barangay' => $profile->barangay
                ]
            );

            return response()->json([
                'message' => 'Profile successfully created!',
                'profile' => $profile
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Profile creation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Profile creation failed. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a profile
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $profile = Profile::find($id);

            if (!$profile) {
                return response()->json([
                    'message' => 'Profile not found.'
                ], 404);
            }

            // Store profile info for logging before deletion
            $profileInfo = [
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'barangay' => $profile->barangay
            ];

            // Log the deletion activity before deleting
            ProfileActivityLogController::logActivity(
                $profile->id,
                'delete',
                'Deleted profile',
                $profileInfo
            );

            // Delete any archived record first
            if ($profile->isArchived()) {
                $profile->archivedRecord()->delete();
            }

            // Delete the profile
            $profile->delete();

            DB::commit();

            return response()->json([
                'message' => 'Profile deleted successfully.'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Profile deletion failed: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Profile deletion failed. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a profile
     */
    public function update(Request $request, $id)
    {
        try {
            $profile = Profile::find($id);

            if (!$profile) {
                return response()->json([
                    'message' => 'Profile not found.'
                ], 404);
            }

            // Store old values for logging
            $oldValues = $profile->toArray();

            // Validate the incoming request
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
                'email' => 'required|email|max:255|unique:profiles,email,' . $id, 
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

            // Update the profile's attributes
            $profile->update($validatedData);

            // Log the update activity with changed fields
            $changes = array_diff_assoc($profile->toArray(), $oldValues);
            ProfileActivityLogController::logActivity(
                $profile->id,
                'edit',
                'Updated profile',
                [
                    'changes' => $changes,
                    'old_values' => $oldValues,
                    'new_values' => $profile->toArray()
                ]
            );

            return response()->json([
                'message' => 'Profile successfully updated!',
                'profile' => $profile
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed during update: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Profile update failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Profile update failed. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive a profile
     */
    public function archive(Request $request, $id)
    {
        try {
            $profile = Profile::find($id);
            
            if (!$profile) {
                return response()->json([
                    'message' => 'Profile not found.'
                ], 404);
            }
            
            // Check if profile is already archived
            if ($profile->isArchived()) {
                return response()->json([
                    'message' => 'Profile is already archived.'
                ], 400);
            }

            // Validate archive reason
            $request->validate([
                'archive_reason' => 'nullable|string|max:500'
            ]);

            DB::transaction(function () use ($profile, $request) {
                ArchivedProfile::create([
                    'profile_id' => $profile->id,
                    'archive_reason' => $request->input('archive_reason'),
                    'archived_date' => now()
                ]);

                // Log the archive activity
                ProfileActivityLogController::logActivity(
                    $profile->id,
                    'archive',
                    'Archived profile',
                    [
                        'first_name' => $profile->first_name,
                        'last_name' => $profile->last_name,
                        'barangay' => $profile->barangay,
                        'archive_reason' => $request->input('archive_reason')
                    ]
                );
            });

            return response()->json([
                'message' => 'Profile archived successfully.'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Profile archiving failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Profile archiving failed. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore a profile
     */
    public function restore($id)
    {
        try {
            $profile = Profile::find($id);
            
            if (!$profile) {
                return response()->json([
                    'message' => 'Profile not found.'
                ], 404);
            }
            
            // Check if profile is actually archived
            if (!$profile->isArchived()) {
                return response()->json([
                    'message' => 'Profile is not archived.'
                ], 400);
            }

            // Get archive reason before deleting the record
            $archiveReason = $profile->archivedRecord->archive_reason;
            
            $profile->archivedRecord()->delete();

            // Log the restore activity
            ProfileActivityLogController::logActivity(
                $profile->id,
                'restore',
                'Restored profile',
                [
                    'first_name' => $profile->first_name,
                    'last_name' => $profile->last_name,
                    'barangay' => $profile->barangay,
                    'previous_archive_reason' => $archiveReason
                ]
            );
            
            return response()->json([
                'message' => 'Profile restored successfully.'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Profile restoration failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Profile restoration failed. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}