<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Models\PolicyActivityLog;
use Illuminate\Support\Facades\Log;

class PolicyController extends Controller
{
    public function index(Request $request)
    {
        // Explicitly convert the string "true"/"false" to boolean
        $archived = filter_var($request->query('archived', 'false'), FILTER_VALIDATE_BOOLEAN);
        
        $policies = Policy::where('archived', $archived)->get();
        
        // Add file_url to each policy using Storage::url
        foreach ($policies as $policy) {
            $policy->file_url = $policy->file_path ? Storage::url($policy->file_path) : null;
        }
        
        return $policies;
    }

    public function store(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json([
                'message' => 'Unauthorized. Please login again.'
            ], 401);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:City Ordinance,City Resolution',
            'file' => 'required|file|mimes:pdf|max:20480', // 20MB max
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1)
        ]);

        // Handle file upload
        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('policies', $fileName, 'public');

        $policy = Policy::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'file_path' => $filePath,
            'year' => $validated['year'],
            'archived' => false
        ]);

        // Log the activity
        PolicyActivityLog::create([
            'policy_id' => $policy->id,
            'sk_account_id' => $skUser->id,
            'activity_type' => 'create',
            'action' => 'Created new policy',
            'details' => [
                'title' => $policy->title,
                'category' => $policy->category,
                'year' => $policy->year
            ]
        ]);

        return response()->json($policy, 201);
    }

    public function update(Request $request, Policy $policy)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json([
                'message' => 'Unauthorized. Please login again.'
            ], 401);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:City Ordinance,City Resolution',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'file' => 'nullable|file|mimes:pdf|max:20480' // Optional file update
        ]);

        // Get the changes before updating
        $changes = array_diff_assoc($validated, $policy->toArray());

        // Handle file upload if a new file is provided
        if ($request->hasFile('file')) {
            // Delete old file
            if ($policy->file_path) {
                Storage::disk('public')->delete($policy->file_path);
            }
            
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('policies', $fileName, 'public');
            $validated['file_path'] = $filePath;
        }

        $policy->update($validated);

        // Log the activity
        PolicyActivityLog::create([
            'policy_id' => $policy->id,
            'sk_account_id' => $skUser->id,
            'activity_type' => 'edit',
            'action' => 'Updated policy',
            'details' => [
                'changes' => $changes
            ]
        ]);

        return response()->json($policy);
    }

    public function destroy(Policy $policy)
    {
        try {
            $skUser = session('sk_user');
            
            if (!$skUser) {
                return response()->json([
                    'message' => 'Unauthorized. Please login again.'
                ], 401);
            }

            // Store policy details before deletion
            $policyDetails = [
                'title' => $policy->title,
                'description' => $policy->description,
                'category' => $policy->category,
                'year' => $policy->year,
                'file_path' => $policy->file_path
            ];

            // Create the log entry BEFORE deleting the policy
            $log = PolicyActivityLog::create([
                'policy_id' => $policy->id,
                'sk_account_id' => $skUser->id,
                'activity_type' => 'delete',
                'action' => 'Deleted policy',
                'details' => $policyDetails
            ]);

            // Only delete the policy if the log was created successfully
            if ($log) {
                // Delete the policy file from storage
                if ($policy->file_path) {
                    Storage::disk('public')->delete($policy->file_path);
                }
                
                // Now delete the policy
                $policy->delete();

                return response()->json([
                    'message' => 'Policy deleted successfully'
                ], 200);
            } else {
                throw new \Exception('Failed to create activity log');
            }
        } catch (\Exception $e) {
            Log::error('Error deleting policy: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting policy',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function archive(Request $request, Policy $policy)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json([
                'message' => 'Unauthorized. Please login again.'
            ], 401);
        }

        $validated = $request->validate([
            'archive_reason' => 'nullable|string|max:500'
        ]);

        $policy->update([
            'archived' => true,
            'archive_reason' => $validated['archive_reason'] ?? null,
            'archived_at' => now()
        ]);

        // Log the activity
        PolicyActivityLog::create([
            'policy_id' => $policy->id,
            'sk_account_id' => $skUser->id,
            'activity_type' => 'archive',
            'action' => 'Archived policy',
            'details' => [
                'title' => $policy->title,
                'category' => $policy->category,
                'archive_reason' => $validated['archive_reason'] ?? null
            ]
        ]);

        return response()->json($policy);
    }
    
    public function restore(Policy $policy)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json([
                'message' => 'Unauthorized. Please login again.'
            ], 401);
        }

        $policy->update([
            'archived' => false,
            'archive_reason' => null,
            'archived_at' => null
        ]);

        // Log the activity
        PolicyActivityLog::create([
            'policy_id' => $policy->id,
            'sk_account_id' => $skUser->id,
            'activity_type' => 'restore',
            'action' => 'Restored policy',
            'details' => [
                'title' => $policy->title,
                'category' => $policy->category
            ]
        ]);

        return response()->json($policy);
    }
    
    public function show(Policy $policy)
    {
        // Add file_url to the response
        $policy->file_url = Storage::url($policy->file_path);
        
        return $policy;
    }
}