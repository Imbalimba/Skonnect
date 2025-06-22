<?php

namespace App\Http\Controllers;

use App\Models\Award;
use App\Models\AwardAuditTrail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AwardController extends Controller
{
    // Get all awards with filtering based on user role
    public function index(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $query = Award::with('creator');
        
        // Apply filters
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }
        
        if ($request->has('year') && $request->year !== 'all') {
            $query->where('year', $request->year);
        }
        
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('sk_station') && $request->sk_station !== 'all') {
            $query->where('sk_station', $request->sk_station);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('recipients', 'like', "%{$search}%");
            });
        }
        
        // Filter based on user role
        if ($skUser->sk_role === 'Federasyon') {
            // Federasyon can see all entries
            // No additional filtering needed
        } elseif ($skUser->sk_role === 'Chairman') {
            // Chairman sees awards from their station OR 'Federation'
            $query->where(function($q) use ($skUser) {
                $q->where('sk_station', $skUser->sk_station)
                ->orWhere('sk_station', 'Federation');
            });
        } elseif ($skUser->sk_role === 'Kagawad') {
            // Kagawad sees their own awards, published awards from their station, OR awards from 'Federation'
            $query->where(function($q) use ($skUser) {
                $q->where('created_by', $skUser->id)
                ->orWhere(function($sub) use ($skUser) {
                    $sub->where('sk_station', $skUser->sk_station)
                        ->where('status', 'published');
                })
                ->orWhere('sk_station', 'Federation');
            });
        }

        // Pagination parameters
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 12);
        
        // Get total count before pagination
        $totalCount = $query->count();

        // Get paginated results
        $awards = $query->orderBy('created_at', 'desc')
                        ->skip(($page - 1) * $perPage)
                        ->take($perPage)
                        ->get();
        
        // Calculate total pages
        $totalPages = ceil($totalCount / $perPage);
        
        // Calculate bookmark status for each award
        $awards = $awards->map(function($award) {
            $award->bookmarkStatus = $award->getBookmarkStatus();
            return $award;
        });
        
        return response()->json([
            'awards' => $awards,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$perPage,
                'total_items' => $totalCount,
                'total_pages' => $totalPages
            ]
        ]);
    }
    
    // Get award statistics
    public function getStatistics()
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        // Base query depending on role
        $query = Award::query();
        
        if ($skUser->sk_role === 'Federasyon') {
            // Federasyon can see all entries
            // No additional filtering needed
        } elseif ($skUser->sk_role === 'Chairman') {
            // Chairman sees awards from their station OR 'Federation'
            $query->where(function($q) use ($skUser) {
                $q->where('sk_station', $skUser->sk_station)
                ->orWhere('sk_station', 'Federation');
            });
        } elseif ($skUser->sk_role === 'Kagawad') {
            // Kagawad sees their own awards, published awards from their station, OR awards from 'Federation'
            $query->where(function($q) use ($skUser) {
                $q->where('created_by', $skUser->id)
                ->orWhere(function($sub) use ($skUser) {
                    $sub->where('sk_station', $skUser->sk_station)
                        ->where('status', 'published');
                })
                ->orWhere('sk_station', 'Federation');
            });
        }
        
        // Get overall counts
        $totalAwards = $query->count();
        $publishedCount = $query->where('status', 'published')->count();
        $archivedCount = $query->where('status', 'archived')->count();
        
        // Get category counts
        $categories = [
            'leadership', 'innovation', 'service', 'environment', 
            'education', 'arts', 'sports', 'technology'
        ];
        
        $categoryCounts = [];
        foreach ($categories as $category) {
            $categoryCounts[$category] = $query->where('category', $category)
                                             ->where('status', 'published')
                                             ->count();
        }
        
        // Get recently updated awards
        $recentUpdates = $query->orderBy('updated_at', 'desc')->take(5)->get();
        
        return response()->json([
            'success' => true,
            'statistics' => [
                'totalAwards' => $totalAwards,
                'publishedCount' => $publishedCount,
                'archivedCount' => $archivedCount,
                'categoryCounts' => $categoryCounts,
                'recentUpdates' => $recentUpdates
            ]
        ]);
    }
    
    // Log actions to the audit trail - NEW
    private function logAuditTrail($awardId, $awardTitle, $action, $userId, $userName, $details = null)
    {
        try {
            AwardAuditTrail::create([
                'award_id' => $awardId,
                'award_title' => $awardTitle,
                'action' => $action,
                'user_id' => $userId,
                'user_name' => $userName,
                'details' => $details
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            Log::error('Error creating award audit trail record:', [
                'error' => $e->getMessage(),
                'awardId' => $awardId,
                'action' => $action
            ]);
        }
    }

    // Get audit trail data - NEW
    public function getAuditTrail(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        try {
            $query = AwardAuditTrail::query()->orderBy('created_at', 'desc');
            
            // Filter by award ID if provided
            if ($request->has('award_id') && $request->award_id) {
                $query->where('award_id', $request->award_id);
            }
            
            // Filter by action if provided
            if ($request->has('action') && $request->action) {
                $query->where('action', $request->action);
            }
            
            // Filter by user if provided
            if ($request->has('user_id') && $request->user_id) {
                $query->where('user_id', $request->user_id);
            }
            
            // Filter by date range if provided
            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            
            // Paginate results
            $perPage = $request->input('per_page', 15);
            $auditTrail = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'audit_trail' => $auditTrail
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching award audit trail:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit trail: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // View award details (and increment view count)
    public function viewAward($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $award = Award::with('creator')->find($id);
        
        if (!$award) {
            return response()->json(['error' => 'Award not found'], 404);
        }
        
        // Increment view count
        $award->incrementViewCount();
        
        // Add bookmark status
        $award->bookmarkStatus = $award->getBookmarkStatus();
        
        return response()->json([
            'success' => true,
            'award' => $award
        ]);
    }
    
    // Store a new award
    public function store(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string|max:255',
            'recipients' => 'required|string|max:255',
            'date_awarded' => 'required|date',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'main_image' => 'required|image|max:5120', // 5MB max
            'media_files' => 'nullable|array',
            'media_files.*' => 'nullable|file|max:20480', // 20MB max for video/image files
            'media_captions' => 'nullable|array',
            'media_captions.*' => 'nullable|string|max:255',
            'media_subcaptions' => 'nullable|array',
            'media_subcaptions.*' => 'nullable|string',
            'media_types' => 'nullable|array',
            'media_types.*' => 'nullable|in:image,video',
            'sk_station' => 'required|in:Federation,Dela Paz,Manggahan,Maybunga,Pinagbuhatan,Rosario,San Miguel,Santa Lucia,Santolan',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Enforce station based on role
        if ($skUser->sk_role !== 'Federasyon') {
            // Non-Federasyon users can only create entries for their own station
            $request->merge(['sk_station' => $skUser->sk_station]);
        }
        
        // Upload main image
        $mainImagePath = $request->file('main_image')->store('awards', 'public');
        
        // Process media files (images and videos) if present
        $mediaData = [];
        if ($request->hasFile('media_files')) {
            $mediaFiles = $request->file('media_files');
            $mediaCaptions = $request->input('media_captions', []);
            $mediaSubcaptions = $request->input('media_subcaptions', []);
            $mediaTypes = $request->input('media_types', []);
            
            foreach ($mediaFiles as $index => $file) {
                $path = $file->store('awards/media', 'public');
                $fileType = isset($mediaTypes[$index]) ? $mediaTypes[$index] : 'image';
                
                // Determine file type if not explicitly provided
                if (!isset($mediaTypes[$index])) {
                    $mimeType = $file->getMimeType();
                    $fileType = strpos($mimeType, 'video/') !== false ? 'video' : 'image';
                }
                
                $mediaData[] = [
                    'path' => $path,
                    'caption' => $mediaCaptions[$index] ?? '',
                    'subcaption' => $mediaSubcaptions[$index] ?? '',
                    'type' => $fileType
                ];
            }
        }
        
        $award = Award::create([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'recipients' => $request->recipients,
            'date_awarded' => $request->date_awarded,
            'year' => $request->year,
            'main_image' => $mainImagePath,
            'media' => !empty($mediaData) ? $mediaData : null, // Renamed from 'gallery' to 'media'
            'sk_station' => $request->sk_station,
            'status' => 'published',
            'created_by' => $skUser->id,
            'updated_by' => $skUser->id,
            'view_count' => 0,
        ]);
        
        // Log to audit trail - NEW
        $this->logAuditTrail(
            $award->id, 
            $award->title,
            'create',
            $skUser->id,
            $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
            json_encode([
                'title' => $award->title,
                'description' => $award->description,
                'category' => $award->category,
                'recipients' => $award->recipients,
                'year' => $award->year,
                'sk_station' => $award->sk_station
            ])
        );
        
        return response()->json($award, 201);
    }
    
    // Update an award - Now supports video files
    public function update(Request $request, $id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        // Log the request data for debugging
        Log::info('Update Award Request Data:', [
            'id' => $id,
            'has_title' => $request->has('title'),
            'title' => $request->input('title'),
            'has_description' => $request->has('description'),
            'description' => $request->input('description'),
            'has_category' => $request->has('category'),
            'category' => $request->input('category'),
            'has_recipients' => $request->has('recipients'),
            'recipients' => $request->input('recipients'),
            'has_date_awarded' => $request->has('date_awarded'),
            'date_awarded' => $request->input('date_awarded'),
            'has_year' => $request->has('year'),
            'year' => $request->input('year'),
            'has_sk_station' => $request->has('sk_station'),
            'sk_station' => $request->input('sk_station'),
            'has_main_image' => $request->hasFile('main_image'),
            'has_remove_main_image' => $request->has('remove_main_image'),
            'remove_main_image' => $request->input('remove_main_image'),
            'has_media_files' => $request->hasFile('media_files'),
            'has_media_remove' => $request->has('media_remove'),
            'media_remove' => $request->input('media_remove'),
        ]);
        
        $award = Award::with('creator')->find($id);
        
        if (!$award) {
            return response()->json(['error' => 'Award not found'], 404);
        }
        
        // Check if user has permission to update
        $canUpdate = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canUpdate = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            // Chairman can update awards from their station (if created by them or Kagawad)
            $canUpdate = $award->sk_station === $skUser->sk_station && 
                ($award->created_by === $skUser->id || 
                ($award->creator && $award->creator->sk_role === 'Kagawad'));
                
            // Chairman cannot edit Federasyon's awards
            if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                $canUpdate = false;
            }
        } else {
            // Kagawad can only update their own entries
            $canUpdate = $award->created_by === $skUser->id;
            
            // Kagawad cannot edit Federasyon's or Chairman's awards
            if ($award->creator && ($award->creator->sk_role === 'Federasyon' || $award->creator->sk_role === 'Chairman')) {
                $canUpdate = false;
            }
        }
        
        if (!$canUpdate) {
            return response()->json(['error' => 'You do not have permission to update this award'], 403);
        }
        
        // Keep track of the state before update for audit trail - NEW
        $beforeState = [
            'title' => $award->title,
            'description' => $award->description,
            'category' => $award->category,
            'recipients' => $award->recipients,
            'year' => $award->year,
            'sk_station' => $award->sk_station
        ];
        
        // Start building the update data array
        $updateData = [];
        
        // Handle text fields - use has() instead of filled() for FormData
        if ($request->has('title')) {
            $updateData['title'] = $request->input('title');
        }
        
        if ($request->has('description')) {
            $updateData['description'] = $request->input('description');
        }
        
        if ($request->has('category')) {
            $updateData['category'] = $request->input('category');
        }
        
        if ($request->has('recipients')) {
            $updateData['recipients'] = $request->input('recipients');
        }
        
        if ($request->has('date_awarded')) {
            $updateData['date_awarded'] = $request->input('date_awarded');
        }
        
        if ($request->has('year')) {
            $updateData['year'] = $request->input('year');
        }
        
        // Handle station update - only Federasyon can change this
        if ($request->has('sk_station') && $skUser->sk_role === 'Federasyon') {
            $updateData['sk_station'] = $request->input('sk_station');
        }
        
        // Add updated_by field
        $updateData['updated_by'] = $skUser->id;
        
        // Handle main image update/removal
        $removeMainImage = $request->input('remove_main_image') === 'true';
        
        if ($request->hasFile('main_image')) {
            // Delete old image
            Storage::disk('public')->delete($award->main_image);
            
            // Store new image
            $mainImagePath = $request->file('main_image')->store('awards', 'public');
            $updateData['main_image'] = $mainImagePath;
        } elseif ($removeMainImage) {
            // Cannot remove main image without providing a new one
            return response()->json([
                'success' => false,
                'errors' => [
                    'main_image' => ['Main image is required. Please provide a new image.']
                ]
            ], 422);
        }
        
        // Process media files
        $mediaData = $award->media ?? []; // Renamed from 'gallery' to 'media'
        $mediaUpdated = false;

        // Handle removing media items
        if ($request->has('media_remove')) {
            $removeIndices = $request->input('media_remove');
            
            // Convert to array if it's a string
            if (!is_array($removeIndices)) {
                $removeIndices = explode(',', $removeIndices);
            }
            
            foreach ($removeIndices as $index) {
                if (isset($mediaData[$index])) {
                    // Delete the file
                    Storage::disk('public')->delete($mediaData[$index]['path']);
                    
                    // Remove entry from media data
                    unset($mediaData[$index]);
                }
            }
            
            // Reindex the array
            $mediaData = array_values($mediaData);
            $mediaUpdated = true;
        }
        
        // Handle adding new media files (images and videos)
        if ($request->hasFile('media_files')) {
            $mediaFiles = $request->file('media_files');
            $mediaCaptions = $request->input('media_captions', []);
            $mediaSubcaptions = $request->input('media_subcaptions', []);
            $mediaTypes = $request->input('media_types', []);
            
            foreach ($mediaFiles as $index => $file) {
                $path = $file->store('awards/media', 'public');
                $fileType = isset($mediaTypes[$index]) ? $mediaTypes[$index] : 'image';
                
                // Determine file type if not explicitly provided
                if (!isset($mediaTypes[$index])) {
                    $mimeType = $file->getMimeType();
                    $fileType = strpos($mimeType, 'video/') !== false ? 'video' : 'image';
                }
                
                $mediaData[] = [
                    'path' => $path,
                    'caption' => isset($mediaCaptions[$index]) ? $mediaCaptions[$index] : '',
                    'subcaption' => isset($mediaSubcaptions[$index]) ? $mediaSubcaptions[$index] : '',
                    'type' => $fileType
                ];
            }
            
            $mediaUpdated = true;
        }
        
        // Handle updating existing media captions
        if ($request->has('update_media_captions')) {
            $updateCaptions = $request->input('update_media_captions', []);
            $updateSubcaptions = $request->input('update_media_subcaptions', []);
            
            foreach ($updateCaptions as $index => $caption) {
                if (isset($mediaData[$index])) {
                    $mediaData[$index]['caption'] = $caption;
                    
                    if (isset($updateSubcaptions[$index])) {
                        $mediaData[$index]['subcaption'] = $updateSubcaptions[$index];
                    }
                    
                    $mediaUpdated = true;
                }
            }
        }
        
        // Only update media if we made changes
        if ($mediaUpdated) {
            $updateData['media'] = !empty($mediaData) ? $mediaData : null; // Renamed from 'gallery' to 'media'
        }
        
        // Log the update data
        Log::info('Award Update Data:', $updateData);
        
        // Only update if we have data to update
        if (!empty($updateData)) {
            $award->update($updateData);
            
            // Refresh the award data
            $award = Award::with('creator')->find($id);
            
            // Get the new state for audit trail - NEW
            $afterState = [
                'title' => $award->title,
                'description' => $award->description,
                'category' => $award->category,
                'recipients' => $award->recipients,
                'year' => $award->year,
                'sk_station' => $award->sk_station
            ];
            
            // Log to audit trail - NEW
            $this->logAuditTrail(
                $award->id,
                $award->title,
                'update',
                $skUser->id,
                $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                json_encode([
                    'before' => $beforeState,
                    'after' => $afterState,
                    'media_updated' => $mediaUpdated
                ])
            );
            
            Log::info('Award updated successfully');
        } else {
            Log::warning('No update data found for award');
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Award updated successfully',
            'award' => $award
        ]);
    }
    
    // Delete an award
    public function destroy($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $award = Award::with('creator')->find($id);
        
        if (!$award) {
            return response()->json(['error' => 'Award not found'], 404);
        }
        
        // Check if user has permission to delete
        $canDelete = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canDelete = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canDelete = $award->sk_station === $skUser->sk_station && 
                ($award->created_by === $skUser->id || 
                ($award->creator && $award->creator->sk_role === 'Kagawad'));
                
            // Chairman cannot delete Federasyon's awards
            if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                $canDelete = false;
            }
        } else {
            $canDelete = $award->created_by === $skUser->id;
        }
        
        if (!$canDelete) {
            return response()->json(['error' => 'You do not have permission to delete this award'], 403);
        }
        
        // Store award details for audit trail before deleting - NEW
        $awardDetails = [
            'id' => $award->id,
            'title' => $award->title,
            'description' => $award->description,
            'category' => $award->category,
            'recipients' => $award->recipients,
            'year' => $award->year,
            'sk_station' => $award->sk_station
        ];
        
        // Log to audit trail before deleting - NEW
        $this->logAuditTrail(
            $award->id,
            $award->title,
            'delete',
            $skUser->id,
            $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
            json_encode($awardDetails)
        );
        
        // Delete award files
        Storage::disk('public')->delete($award->main_image);
        
        if (!empty($award->media)) { // Renamed from 'gallery' to 'media'
            foreach ($award->media as $mediaItem) {
                Storage::disk('public')->delete($mediaItem['path']);
            }
        }
        
        $award->delete();
        
        return response()->json(['message' => 'Award deleted successfully']);
    }
    
    // Archive an award
    public function archive($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $award = Award::with('creator')->find($id);
        
        if (!$award) {
            return response()->json(['error' => 'Award not found'], 404);
        }
        
        // Check if user has permission to archive
        $canArchive = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canArchive = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canArchive = $award->sk_station === $skUser->sk_station && 
                ($award->created_by === $skUser->id || 
                ($award->creator && $award->creator->sk_role === 'Kagawad'));
                
            // Chairman cannot archive Federasyon's awards
            if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                $canArchive = false;
            }
        } else {
            $canArchive = $award->created_by === $skUser->id;
        }
        
        if (!$canArchive) {
            return response()->json(['error' => 'You do not have permission to archive this award'], 403);
        }
        
        $award->update([
            'status' => 'archived',
            'updated_by' => $skUser->id
        ]);
        
        // Log to audit trail - NEW
        $this->logAuditTrail(
            $award->id,
            $award->title,
            'archive',
            $skUser->id,
            $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
            json_encode(['award_title' => $award->title])
        );
        
        return response()->json(['message' => 'Award archived successfully']);
    }
    
    // Restore an archived award
    public function restore($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $award = Award::with('creator')->find($id);
        
        if (!$award) {
            return response()->json(['error' => 'Award not found'], 404);
        }
        
        // Check if user has permission to restore
        $canRestore = false;
        
        if ($skUser->sk_role === 'Federasyon') {
            $canRestore = true;
        } elseif ($skUser->sk_role === 'Chairman') {
            $canRestore = $award->sk_station === $skUser->sk_station && 
                ($award->created_by === $skUser->id || 
                ($award->creator && $award->creator->sk_role === 'Kagawad'));
                
            // Chairman cannot restore Federasyon's awards
            if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                $canRestore = false;
            }
        } else {
            $canRestore = $award->created_by === $skUser->id;
        }
        
        if (!$canRestore) {
            return response()->json(['error' => 'You do not have permission to restore this award'], 403);
        }
        
        $award->update([
            'status' => 'published',
            'updated_by' => $skUser->id
        ]);
        
        // Log to audit trail - NEW
        $this->logAuditTrail(
            $award->id,
            $award->title,
            'restore',
            $skUser->id,
            $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
            json_encode(['award_title' => $award->title])
        );
        
        return response()->json(['message' => 'Award restored successfully']);
    }
    
    /**
     * Get published awards for the Youth page
     * This method needs to be accessible without authentication
     */
    public function getPublicAwards()
    {
        try {
            $awards = Award::where('status', 'published')
                          ->orderBy('created_at', 'desc')
                          ->get();
            
            // Apply bookmark status to each award
            $awards = $awards->map(function($award) {
                $award->bookmarkStatus = $award->getBookmarkStatus();
                return $award;
            });
            
            return response()->json([
                'success' => true,
                'awards' => $awards
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Error fetching public awards: ' . $e->getMessage());
            
            // Return a user-friendly error
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch awards data',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    
    // Bulk archive awards
    public function bulkArchive(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:awards,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $ids = $request->ids;
        $success = 0;
        $failed = 0;
        
        foreach ($ids as $id) {
            $award = Award::with('creator')->find($id);
            
            if (!$award) {
                $failed++;
                continue;
            }
            
            // Check permission
            $canArchive = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canArchive = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canArchive = $award->sk_station === $skUser->sk_station && 
                    ($award->created_by === $skUser->id || 
                    ($award->creator && $award->creator->sk_role === 'Kagawad'));
                    
                // Chairman cannot archive Federasyon's awards
                if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                    $canArchive = false;
                }
            } else {
                $canArchive = $award->created_by === $skUser->id;
            }
            
            if ($canArchive) {
                $award->update([
                    'status' => 'archived',
                    'updated_by' => $skUser->id
                ]);
                
                // Log to audit trail - NEW
                $this->logAuditTrail(
                    $award->id,
                    $award->title,
                    'archive',
                    $skUser->id,
                    $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                    json_encode(['bulk_operation' => true, 'award_title' => $award->title])
                );
                
                $success++;
            } else {
                $failed++;
            }
        }
        
        return response()->json([
            'message' => "Archived $success awards successfully" . ($failed > 0 ? ", $failed failed due to permission issues" : "")
        ]);
    }
    
    // Bulk restore awards
    public function bulkRestore(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:awards,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $ids = $request->ids;
        $success = 0;
        $failed = 0;
        
        foreach ($ids as $id) {
            $award = Award::with('creator')->find($id);
            
            if (!$award) {
                $failed++;
                continue;
            }
            
            // Check permission
            $canRestore = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canRestore = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canRestore = $award->sk_station === $skUser->sk_station && 
                    ($award->created_by === $skUser->id || 
                    ($award->creator && $award->creator->sk_role === 'Kagawad'));
                    
                // Chairman cannot restore Federasyon's awards
                if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                    $canRestore = false;
                }
            } else {
                $canRestore = $award->created_by === $skUser->id;
            }
            
            if ($canRestore) {
                $award->update([
                    'status' => 'published',
                    'updated_by' => $skUser->id
                ]);
                
                // Log to audit trail - NEW
                $this->logAuditTrail(
                    $award->id,
                    $award->title,
                    'restore',
                    $skUser->id,
                    $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                    json_encode(['bulk_operation' => true, 'award_title' => $award->title])
                );
                
                $success++;
            } else {
                $failed++;
            }
        }
        
        return response()->json([
            'message' => "Restored $success awards successfully" . ($failed > 0 ? ", $failed failed due to permission issues" : "")
        ]);
    }
    
    // Bulk delete awards
    public function bulkDelete(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:awards,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $ids = $request->ids;
        $success = 0;
        $failed = 0;
        
        foreach ($ids as $id) {
            $award = Award::with('creator')->find($id);
            
            if (!$award) {
                $failed++;
                continue;
            }
            
            // Check permission
            $canDelete = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canDelete = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canDelete = $award->sk_station === $skUser->sk_station && 
                    ($award->created_by === $skUser->id || 
                    ($award->creator && $award->creator->sk_role === 'Kagawad'));
                    
                // Chairman cannot delete Federasyon's awards
                if ($award->creator && $award->creator->sk_role === 'Federasyon') {
                    $canDelete = false;
                }
            } else {
                $canDelete = $award->created_by === $skUser->id;
            }
            
            if ($canDelete) {
                // Store award details for audit trail before deleting - NEW
                $awardDetails = [
                    'id' => $award->id,
                    'title' => $award->title,
                    'bulk_operation' => true,
                    'category' => $award->category,
                    'recipients' => $award->recipients,
                    'year' => $award->year,
                    'sk_station' => $award->sk_station
                ];
                
                // Log to audit trail before deleting - NEW
                $this->logAuditTrail(
                    $award->id,
                    $award->title,
                    'delete',
                    $skUser->id,
                    $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                    json_encode($awardDetails)
                );
                
                // Delete award files
                Storage::disk('public')->delete($award->main_image);
                
                if (!empty($award->media)) { // Renamed from 'gallery' to 'media'
                    foreach ($award->media as $mediaItem) {
                        Storage::disk('public')->delete($mediaItem['path']);
                    }
                }
                
                $award->delete();
                $success++;
            } else {
                $failed++;
            }
        }
        
        return response()->json([
            'message' => "Deleted $success awards successfully" . ($failed > 0 ? ", $failed failed due to permission issues" : "")
        ]);
    }
}