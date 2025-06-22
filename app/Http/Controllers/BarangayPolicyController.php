<?php

namespace App\Http\Controllers;

use App\Models\BarangayPolicy;
use App\Http\Controllers\BarangayPolicyActivityLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BarangayPolicyController extends Controller
{
    public function index(Request $request)
    {
        try {
            $archived = $request->query('archived', '0');
            $barangay = $request->query('barangay', 'all');
            
            $query = BarangayPolicy::with('skaccount');

            // Filter by archived status
            if ($archived === '1') {
                $query->archived();
            } else {
                $query->where('archived', false);
            }

            // Filter by barangay
            if ($barangay !== 'all') {
                $query->forBarangay($barangay);
            }

            $policies = $query->orderBy('created_at', 'desc')->get();

            return response()->json($policies);
        } catch (\Exception $e) {
            Log::error('Error fetching barangay policies: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching barangay policies',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $skUser = session('sk_user');
            if (!$skUser) {
                return response()->json([
                    'message' => 'Unauthorized. Please login again.'
                ], 401);
            }

            $validatedData = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'category' => 'required|string',
                'file' => 'required|file|mimes:pdf|max:20480',
                'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            ]);

            // Set barangay based on user role
            if ($skUser->sk_role === 'Federasyon') {
                $validatedData['barangay'] = $request->barangay;
            } else {
                $validatedData['barangay'] = $skUser->sk_station;
            }

            $validatedData['skaccount_id'] = $skUser->id;
            $validatedData['archived'] = false;

            // Handle file upload
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('public/barangay_policies', $fileName);
                $validatedData['file_path'] = 'barangay_policies/' . $fileName;
            }

            $policy = BarangayPolicy::create($validatedData);

            // Log the creation activity
            BarangayPolicyActivityLogController::logActivity(
                $policy->id,
                'create',
                'Created new barangay policy',
                [
                    'title' => $policy->title,
                    'category' => $policy->category,
                    'barangay' => $policy->barangay
                ]
            );

            return response()->json([
                'message' => 'Barangay policy created successfully',
                'policy' => $policy->load('skaccount')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating barangay policy: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating barangay policy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, BarangayPolicy $barangayPolicy)
    {
        try {
            $skUser = session('sk_user');
            if (!$skUser) {
                return response()->json([
                    'message' => 'Unauthorized. Please login again.'
                ], 401);
            }

            // Store old values for logging
            $oldValues = $barangayPolicy->toArray();

            $validatedData = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'category' => 'required|string',
                'file' => 'nullable|file|mimes:pdf|max:20480',
                'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            ]);

            // Handle file upload if new file is provided
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('public/barangay_policies', $fileName);
                $validatedData['file_path'] = 'barangay_policies/' . $fileName;
            }

            $barangayPolicy->update($validatedData);

            // Log the update activity with changed fields
            $changes = array_diff_assoc($barangayPolicy->toArray(), $oldValues);
            BarangayPolicyActivityLogController::logActivity(
                $barangayPolicy->id,
                'edit',
                'Updated barangay policy',
                [
                    'changes' => $changes,
                    'old_values' => $oldValues,
                    'new_values' => $barangayPolicy->toArray()
                ]
            );

            return response()->json([
                'message' => 'Barangay policy updated successfully',
                'policy' => $barangayPolicy->load('skaccount')
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating barangay policy: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating barangay policy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(BarangayPolicy $barangayPolicy)
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
                'title' => $barangayPolicy->title,
                'description' => $barangayPolicy->description,
                'category' => $barangayPolicy->category,
                'barangay' => $barangayPolicy->barangay,
                'year' => $barangayPolicy->year,
                'file_path' => $barangayPolicy->file_path
            ];

            // Create the log entry BEFORE deleting the policy
            $log = BarangayPolicyActivityLogController::logActivity(
                $barangayPolicy->id,
                'delete',
                'Deleted barangay policy',
                $policyDetails
            );

            // Only delete the policy if the log was created successfully
            if ($log) {
                // Delete the policy file from storage
                if ($barangayPolicy->file_path) {
                    Storage::disk('public')->delete($barangayPolicy->file_path);
                }
                
                // Now delete the policy
                $barangayPolicy->delete();

                return response()->json([
                    'message' => 'Barangay policy deleted successfully'
                ], 200);
            } else {
                throw new \Exception('Failed to create activity log');
            }
        } catch (\Exception $e) {
            Log::error('Error deleting barangay policy: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting barangay policy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function archive(Request $request, BarangayPolicy $barangayPolicy)
    {
        try {
            if ($barangayPolicy->archived) {
                return response()->json([
                    'message' => 'Barangay policy is already archived'
                ], 400);
            }

            $validatedData = $request->validate([
                'archive_reason' => 'nullable|string|max:500'
            ]);

            $barangayPolicy->update([
                'archived' => true,
                'archive_reason' => $validatedData['archive_reason'] ?? null,
                'archived_at' => now()
            ]);

            // Log the archive activity
            BarangayPolicyActivityLogController::logActivity(
                $barangayPolicy->id,
                'archive',
                'Archived barangay policy',
                [
                    'title' => $barangayPolicy->title,
                    'archive_reason' => $validatedData['archive_reason'] ?? null
                ]
            );

            return response()->json([
                'message' => 'Barangay policy archived successfully',
                'policy' => $barangayPolicy->load('skaccount')
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving barangay policy: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error archiving barangay policy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function restore(BarangayPolicy $barangayPolicy)
    {
        try {
            if (!$barangayPolicy->archived) {
                return response()->json([
                    'message' => 'Barangay policy is not archived'
                ], 400);
            }

            $barangayPolicy->update([
                'archived' => false,
                'archive_reason' => null,
                'archived_at' => null
            ]);

            // Log the restore activity
            BarangayPolicyActivityLogController::logActivity(
                $barangayPolicy->id,
                'restore',
                'Restored barangay policy',
                [
                    'title' => $barangayPolicy->title,
                    'previous_archive_reason' => $barangayPolicy->archive_reason
                ]
            );

            return response()->json([
                'message' => 'Barangay policy restored successfully',
                'policy' => $barangayPolicy->load('skaccount')
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error restoring barangay policy: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error restoring barangay policy',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}