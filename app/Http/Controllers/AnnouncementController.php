<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Http\Controllers\AnnouncementActivityLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the announcements.
     */
    public function index(Request $request)
    {
        try {
            $archived = $request->query('archived', '0');
            $visibility = $request->query('visibility', 'all');
            $barangay = $request->query('barangay', 'all');
            
            $query = Announcement::with('skaccount');

            // Filter by archived status
            if ($archived === '1') {
                $query->archived();
            } else {
                $query->where('is_archived', false);
            }

            // Filter by visibility
            if ($visibility !== 'all') {
                $query->where('visibility', $visibility);
            }

            // Filter by barangay
            if ($barangay !== 'all') {
                $query->forBarangay($barangay);
            }

            // Order by start_date desc, then by created_at desc
            $announcements = $query->orderBy('start_date', 'desc')
                                  ->orderBy('created_at', 'desc')
                                  ->get();

            return response()->json($announcements);
        } catch (\Exception $e) {
            Log::error('Error fetching announcements: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching announcements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created announcement in storage.
     */
    public function store(Request $request)
    {
        try {
            $skUser = session('sk_user');
            if (!$skUser) {
                return response()->json([
                    'message' => 'Unauthorized. Please login again.'
                ], 401);
            }

            // Validation rules based on user role
            $validationRules = [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'visibility' => 'required|in:public,sk_only',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ];

            // If user is federation (has permission to select barangay)
            if ($skUser->sk_role === 'Federasyon') {
                $validationRules['barangay'] = 'required|string';
            }

            $validatedData = $request->validate($validationRules);

            // Set barangay based on user role
            if ($skUser->sk_role === 'Federasyon') {
                $validatedData['barangay'] = $request->barangay;
            } else {
                // Regular SK users can only create announcements for their own barangay
                $validatedData['barangay'] = $skUser->sk_station;
            }

            $validatedData['skaccount_id'] = $skUser->id;
            $validatedData['is_archived'] = false;

            $announcement = Announcement::create($validatedData);

            // Log the creation activity
            AnnouncementActivityLogController::logActivity(
                $announcement->id,
                'create',
                'Created new announcement',
                [
                    'title' => $announcement->title,
                    'visibility' => $announcement->visibility,
                    'barangay' => $announcement->barangay
                ]
            );

            return response()->json([
                'message' => 'Announcement created successfully',
                'announcement' => $announcement->load('skaccount')
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating announcement: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified announcement in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $announcement = Announcement::findOrFail($id);
            $skUser = session('sk_user');
            
            if (!$skUser) {
                return response()->json([
                    'message' => 'Unauthorized. Please login again.'
                ], 401);
            }

            // Store old values for logging
            $oldValues = $announcement->toArray();

            // Validation rules
            $validationRules = [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'visibility' => 'required|in:public,sk_only',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ];

            // Federation can update barangay
            if ($skUser->sk_role === 'Federasyon') {
                $validationRules['barangay'] = 'required|string';
            }

            $validatedData = $request->validate($validationRules);

            // Update barangay based on user role
            if ($skUser->sk_role === 'Federasyon') {
                $validatedData['barangay'] = $request->barangay;
            } else {
                $validatedData['barangay'] = $skUser->sk_station;
            }

            $announcement->update($validatedData);

            // Log the update activity with changed fields
            $changes = array_diff_assoc($announcement->toArray(), $oldValues);
            AnnouncementActivityLogController::logActivity(
                $announcement->id,
                'edit',
                'Updated announcement',
                [
                    'changes' => $changes,
                    'old_values' => $oldValues,
                    'new_values' => $announcement->toArray()
                ]
            );

            return response()->json([
                'message' => 'Announcement updated successfully',
                'announcement' => $announcement->load('skaccount')
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating announcement: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Remove the specified announcement from storage.
     */
    public function destroy($id)
    {
        try {
            $announcement = Announcement::findOrFail($id);
            
            // Log the deletion activity before soft deleting
            AnnouncementActivityLogController::logActivity(
                $announcement->id,
                'delete',
                'Deleted announcement',
                [
                    'title' => $announcement->title,
                    'visibility' => $announcement->visibility,
                    'barangay' => $announcement->barangay
                ]
            );

            // Soft delete
            $announcement->delete();

            return response()->json([
                'message' => 'Announcement deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting announcement: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive the specified announcement.
     */
    public function archive(Request $request, $id)
    {
        try {
            $announcement = Announcement::findOrFail($id);

            if ($announcement->is_archived) {
                return response()->json([
                    'message' => 'Announcement is already archived'
                ], 400);
            }

            $validatedData = $request->validate([
                'archive_reason' => 'nullable|string|max:500'
            ]);

            $announcement->update([
                'is_archived' => true,
                'archive_reason' => $validatedData['archive_reason'] ?? null,
                'archived_at' => now()
            ]);

            // Log the archive activity
            AnnouncementActivityLogController::logActivity(
                $announcement->id,
                'archive',
                'Archived announcement',
                [
                    'title' => $announcement->title,
                    'archive_reason' => $validatedData['archive_reason'] ?? null
                ]
            );

            return response()->json([
                'message' => 'Announcement archived successfully',
                'announcement' => $announcement->load('skaccount')
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving announcement: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error archiving announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore the specified announcement.
     */
    public function restore($id)
    {
        try {
            $announcement = Announcement::findOrFail($id);

            if (!$announcement->is_archived) {
                return response()->json([
                    'message' => 'Announcement is not archived'
                ], 400);
            }

            $announcement->update([
                'is_archived' => false,
                'archive_reason' => null,
                'archived_at' => null
            ]);

            // Log the restore activity
            AnnouncementActivityLogController::logActivity(
                $announcement->id,
                'restore',
                'Restored announcement',
                [
                    'title' => $announcement->title,
                    'previous_archive_reason' => $announcement->archive_reason
                ]
            );

            return response()->json([
                'message' => 'Announcement restored successfully',
                'announcement' => $announcement->load('skaccount')
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error restoring announcement: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error restoring announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active announcements for public display.
     */
    public function getActiveAnnouncements(Request $request)
{
    try {
        $barangay = $request->query('barangay', null);
        
        $query = Announcement::active()->public();

        // Filter by barangay if specified
        if ($barangay && $barangay !== 'all') {
            $query->where('barangay', $barangay);
        } else if ($barangay === 'all') {
            // Show all public announcements (both barangay-specific and all barangays)
            $query->where(function($q) {
                $q->where('barangay', 'all')
                  ->orWhereNotNull('barangay');
            });
        }

        $announcements = $query->orderBy('start_date', 'desc')
                              ->orderBy('created_at', 'desc')
                              ->get();

        return response()->json($announcements);
    } catch (\Exception $e) {
        Log::error('Error fetching active announcements: ' . $e->getMessage());
        return response()->json([
            'message' => 'Error fetching active announcements',
            'error' => $e->getMessage()
        ], 500);
    }
}

}