<?php

namespace App\Http\Controllers;

use App\Models\Directory;
use App\Models\DirectoryAuditTrail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DirectoryController extends Controller
{
    /**
     * Get all directories with filtering based on user role
     */
    public function index(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        try {
            $query = Directory::with(['creator', 'supervisor', 'updater']);
            
            // Apply filtering based on SK role
            if ($skUser->sk_role === 'Federasyon') {
                // Federasyon can see all entries
                // No additional filtering
            } elseif ($skUser->sk_role === 'Chairman') {
                // Chairman sees directories from their station OR from 'Federation'
                $query->where(function($q) use ($skUser) {
                    $q->where('sk_station', $skUser->sk_station)
                    ->orWhere('sk_station', 'Federation');
                });
            } elseif ($skUser->sk_role === 'Kagawad') {
                // Kagawad sees their own directories, published ones from their station, or any created by Federasyon
                $query->where(function($q) use ($skUser) {
                    $q->where('created_by', $skUser->id)
                    ->orWhere(function($sq) use ($skUser) {
                        $sq->where('sk_station', $skUser->sk_station)
                            ->where('status', 'published');
                    })
                    ->orWhere('sk_station', 'Federation')
                    ->orWhereHas('creator', function($sq) {
                        $sq->where('sk_role', 'Federasyon');
                    });
                });
            }
            
            $directories = $query->get();
            
            Log::info('Directories retrieved successfully', [
                'user_id' => $skUser->id,
                'user_role' => $skUser->sk_role,
                'count' => $directories->count()
            ]);
            
            return response()->json($directories);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve directories', [
                'user_id' => $skUser->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => 'Failed to load directories'], 500);
        }
    }
    
    /**
     * Store a new directory
     */
    public function store(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        Log::info('Directory store attempt', [
            'user_id' => $skUser->id,
            'user_role' => $skUser->sk_role,
            'request_data' => $request->except(['_token'])
        ]);
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'category' => 'required|in:executive,committee,barangay,partner',
            'sk_station' => 'required|in:Federation,Dela Paz,Manggahan,Maybunga,Pinagbuhatan,Rosario,San Miguel,Santa Lucia,Santolan',
            'position_order' => 'nullable|integer|min:1',
            'reports_to' => 'nullable|exists:directories,id',
        ]);
        
        if ($validator->fails()) {
            Log::warning('Directory validation failed', [
                'user_id' => $skUser->id,
                'errors' => $validator->errors()->toArray()
            ]);
            
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            // Enforce station based on role
            if ($skUser->sk_role !== 'Federasyon') {
                // Non-Federasyon users can only create entries for their own station
                $request->merge(['sk_station' => $skUser->sk_station]);
            }
            
            // Check if position is available
            if ($request->position_order && $request->position_order < 999) {
                $existingPosition = Directory::where('sk_station', $request->sk_station)
                    ->where('position_order', $request->position_order)
                    ->where('status', 'published')
                    ->exists();
                    
                // If position is already taken, find next available position
                if ($existingPosition) {
                    $request->merge(['position_order' => 999]); // Default to bottom
                }
            }
            
            $directory = Directory::create([
                'name' => $request->name,
                'role' => $request->role,
                'email' => $request->email,
                'phone' => $request->phone,
                'location' => $request->location,
                'category' => $request->category,
                'created_by' => $skUser->id,
                'updated_by' => $skUser->id, // Set updated_by to creator initially
                'sk_station' => $request->sk_station,
                'status' => 'published',
                'position_order' => $request->position_order ?? 999,
                'reports_to' => $request->reports_to ?: null,
            ]);
            
            // Log audit trail
            $this->logAuditTrail(
                $directory->id,
                $directory->name,
                'create',
                $skUser->id,
                $skUser->first_name . ' ' . $skUser->last_name,
                [
                    'name' => $directory->name,
                    'role' => $directory->role,
                    'email' => $directory->email,
                    'phone' => $directory->phone,
                    'location' => $directory->location,
                    'category' => $directory->category,
                    'sk_station' => $directory->sk_station,
                    'position_order' => $directory->position_order,
                    'reports_to' => $directory->reports_to
                ]
            );
            
            Log::info('Directory created successfully', [
                'user_id' => $skUser->id,
                'directory_id' => $directory->id,
                'name' => $directory->name
            ]);
            
            return response()->json($directory, 201);
        } catch (\Exception $e) {
            Log::error('Failed to create directory', [
                'user_id' => $skUser->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['_token'])
            ]);
            
            return response()->json(['error' => 'Failed to create directory: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Show a single directory
     */
    public function show($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        try {
            $directory = Directory::with(['creator', 'supervisor', 'subordinates', 'updater'])->find($id);
            
            if (!$directory) {
                Log::warning('Directory not found', [
                    'user_id' => $skUser->id,
                    'directory_id' => $id
                ]);
                
                return response()->json(['error' => 'Directory not found'], 404);
            }
            
            // Check permissions based on role
            if ($skUser->sk_role === 'Federasyon') {
                // Federasyon can view any directory
                Log::info('Directory viewed by Federasyon', [
                    'user_id' => $skUser->id,
                    'directory_id' => $directory->id
                ]);
                
                return response()->json($directory);
            } elseif ($skUser->sk_role === 'Chairman') {
                // Chairman can view directories from their station or created by Federasyon
                if ($directory->sk_station === $skUser->sk_station || 
                    ($directory->creator && $directory->creator->sk_role === 'Federasyon') ||
                    $directory->sk_station === 'Federation') {
                    
                    Log::info('Directory viewed by Chairman', [
                        'user_id' => $skUser->id,
                        'directory_id' => $directory->id
                    ]);
                    
                    return response()->json($directory);
                }
            } else {
                // Kagawad can view their own directories, published ones from their station, or created by Federasyon
                if ($directory->created_by === $skUser->id || 
                    ($directory->sk_station === $skUser->sk_station && $directory->status === 'published') ||
                    ($directory->creator && $directory->creator->sk_role === 'Federasyon') ||
                    $directory->sk_station === 'Federation') {
                    
                    Log::info('Directory viewed by Kagawad', [
                        'user_id' => $skUser->id,
                        'directory_id' => $directory->id
                    ]);
                    
                    return response()->json($directory);
                }
            }
            
            Log::warning('Unauthorized directory access attempt', [
                'user_id' => $skUser->id,
                'directory_id' => $directory->id,
                'user_role' => $skUser->sk_role,
                'user_station' => $skUser->sk_station,
                'directory_station' => $directory->sk_station
            ]);
            
            return response()->json(['error' => 'Unauthorized'], 403);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve directory', [
                'user_id' => $skUser->id,
                'directory_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => 'Failed to retrieve directory'], 500);
        }
    }
    
    /**
     * Update a directory
     */
    public function update(Request $request, $id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        Log::info('Directory update attempt', [
            'user_id' => $skUser->id,
            'directory_id' => $id,
            'request_data' => $request->except(['_token'])
        ]);
        
        try {
            $directory = Directory::with('creator')->find($id);
            
            if (!$directory) {
                Log::warning('Directory not found for update', [
                    'user_id' => $skUser->id,
                    'directory_id' => $id
                ]);
                
                return response()->json(['error' => 'Directory not found'], 404);
            }
            
            // Check if user has permission to update
            $canUpdate = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canUpdate = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canUpdate = $directory->sk_station === $skUser->sk_station && 
                    ($directory->created_by === $skUser->id || 
                    ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
            } else {
                // Kagawad can only update their own entries
                $canUpdate = $directory->created_by === $skUser->id;
            }
            
            if (!$canUpdate) {
                Log::warning('Unauthorized directory update attempt', [
                    'user_id' => $skUser->id,
                    'directory_id' => $directory->id,
                    'user_role' => $skUser->sk_role,
                    'directory_creator' => $directory->created_by
                ]);
                
                return response()->json(['error' => 'You do not have permission to update this directory'], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'role' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:50',
                'location' => 'nullable|string|max:255',
                'category' => 'required|in:executive,committee,barangay,partner',
                'sk_station' => 'required|in:Federation,Dela Paz,Manggahan,Maybunga,Pinagbuhatan,Rosario,San Miguel,Santa Lucia,Santolan',
                'position_order' => 'nullable|integer|min:1',
                'reports_to' => 'nullable|exists:directories,id',
            ]);
            
            if ($validator->fails()) {
                Log::warning('Directory validation failed for update', [
                    'user_id' => $skUser->id,
                    'directory_id' => $id,
                    'errors' => $validator->errors()->toArray()
                ]);
                
                return response()->json(['errors' => $validator->errors()], 422);
            }
            
            // Enforce station based on role
            if ($skUser->sk_role !== 'Federasyon') {
                // Non-Federasyon users cannot change the station
                $request->merge(['sk_station' => $directory->sk_station]);
            }
            
            // Don't allow the "reports_to" to create a circular reference
            if ($request->reports_to && $request->reports_to == $directory->id) {
                Log::warning('Circular reference attempt in reports_to', [
                    'user_id' => $skUser->id,
                    'directory_id' => $id
                ]);
                
                return response()->json(['error' => 'A directory entry cannot report to itself'], 422);
            }
            
            // Check position order
            if ($request->position_order != $directory->position_order && $request->position_order < 999) {
                $existingPosition = Directory::where('sk_station', $request->sk_station)
                    ->where('position_order', $request->position_order)
                    ->where('status', 'published')
                    ->where('id', '!=', $directory->id)
                    ->exists();
                    
                // If position is already taken, find next available position
                if ($existingPosition && $skUser->sk_role !== 'Federasyon') {
                    $request->merge(['position_order' => $directory->position_order]); // Keep existing
                }
            }
            
            // Capture the state before update for audit trail
            $beforeState = [
                'name' => $directory->name,
                'role' => $directory->role,
                'email' => $directory->email,
                'phone' => $directory->phone,
                'location' => $directory->location,
                'category' => $directory->category,
                'sk_station' => $directory->sk_station,
                'position_order' => $directory->position_order,
                'reports_to' => $directory->reports_to
            ];
            
            $directory->update([
                'name' => $request->name,
                'role' => $request->role,
                'email' => $request->email,
                'phone' => $request->phone,
                'location' => $request->location,
                'category' => $request->category,
                'sk_station' => $request->sk_station,
                'position_order' => $request->position_order,
                'reports_to' => $request->reports_to ?: null,
                'updated_by' => $skUser->id, // Set updated_by to current user
            ]);
            
            // Capture the state after update for audit trail
            $afterState = [
                'name' => $directory->name,
                'role' => $directory->role,
                'email' => $directory->email,
                'phone' => $directory->phone,
                'location' => $directory->location,
                'category' => $directory->category,
                'sk_station' => $directory->sk_station,
                'position_order' => $directory->position_order,
                'reports_to' => $directory->reports_to
            ];
            
            // Log audit trail
            $this->logAuditTrail(
                $directory->id,
                $directory->name,
                'update',
                $skUser->id,
                $skUser->first_name . ' ' . $skUser->last_name,
                [
                    'before' => $beforeState,
                    'after' => $afterState
                ]
            );
            
            Log::info('Directory updated successfully', [
                'user_id' => $skUser->id,
                'directory_id' => $directory->id,
                'name' => $directory->name
            ]);
            
            return response()->json($directory);
        } catch (\Exception $e) {
            Log::error('Failed to update directory', [
                'user_id' => $skUser->id,
                'directory_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['_token'])
            ]);
            
            return response()->json(['error' => 'Failed to update directory: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete a directory
     */
    public function destroy($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        Log::info('Directory delete attempt', [
            'user_id' => $skUser->id,
            'directory_id' => $id
        ]);
        
        try {
            $directory = Directory::with('creator')->find($id);
            
            if (!$directory) {
                Log::warning('Directory not found for deletion', [
                    'user_id' => $skUser->id,
                    'directory_id' => $id
                ]);
                
                return response()->json(['error' => 'Directory not found'], 404);
            }
            
            // Check if user has permission to delete
            $canDelete = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canDelete = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canDelete = $directory->sk_station === $skUser->sk_station && 
                    ($directory->created_by === $skUser->id || 
                    ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
            } else {
                $canDelete = $directory->created_by === $skUser->id;
            }
            
            if (!$canDelete) {
                Log::warning('Unauthorized directory delete attempt', [
                    'user_id' => $skUser->id,
                    'directory_id' => $directory->id,
                    'user_role' => $skUser->sk_role,
                    'directory_creator' => $directory->created_by
                ]);
                
                return response()->json(['error' => 'You do not have permission to delete this directory'], 403);
            }
            
            // Capture directory details before deletion for audit trail
            $directoryDetails = [
                'id' => $directory->id,
                'name' => $directory->name,
                'role' => $directory->role,
                'email' => $directory->email,
                'phone' => $directory->phone,
                'location' => $directory->location,
                'category' => $directory->category,
                'sk_station' => $directory->sk_station,
                'position_order' => $directory->position_order,
                'reports_to' => $directory->reports_to
            ];
            
            // Log audit trail before deleting
            $this->logAuditTrail(
                $directory->id,
                $directory->name,
                'delete',
                $skUser->id,
                $skUser->first_name . ' ' . $skUser->last_name,
                $directoryDetails
            );
            
            // Update any entries that report to this one
            Directory::where('reports_to', $directory->id)->update(['reports_to' => null]);
            
            $directory->delete();
            
            Log::info('Directory deleted successfully', [
                'user_id' => $skUser->id,
                'directory_id' => $id,
                'name' => $directory->name
            ]);
            
            return response()->json(['message' => 'Directory deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete directory', [
                'user_id' => $skUser->id,
                'directory_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => 'Failed to delete directory: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Archive a directory
     */
    public function archive($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        Log::info('Directory archive attempt', [
            'user_id' => $skUser->id,
            'directory_id' => $id
        ]);
        
        try {
            $directory = Directory::with('creator')->find($id);
            
            if (!$directory) {
                Log::warning('Directory not found for archiving', [
                    'user_id' => $skUser->id,
                    'directory_id' => $id
                ]);
                
                return response()->json(['error' => 'Directory not found'], 404);
            }
            
            // Check if user has permission to archive
            $canArchive = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canArchive = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canArchive = $directory->sk_station === $skUser->sk_station && 
                    ($directory->created_by === $skUser->id || 
                    ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
            } else {
                $canArchive = $directory->created_by === $skUser->id;
            }
            
            if (!$canArchive) {
                Log::warning('Unauthorized directory archive attempt', [
                    'user_id' => $skUser->id,
                    'directory_id' => $directory->id
                ]);
                
                return response()->json(['error' => 'You do not have permission to archive this directory'], 403);
            }
            
            // Check if already archived
            if ($directory->status === 'archived') {
                Log::warning('Already archived directory', [
                    'user_id' => $skUser->id,
                    'directory_id' => $directory->id
                ]);
                
                return response()->json(['error' => 'This directory is already archived'], 400);
            }
            
            // Update the status to archived and set updated_by
            $directory->status = 'archived';
            $directory->updated_by = $skUser->id;
            $directory->save();
            
            // Log audit trail
            $this->logAuditTrail(
                $directory->id,
                $directory->name,
                'archive',
                $skUser->id,
                $skUser->first_name . ' ' . $skUser->last_name,
                [
                    'directory_name' => $directory->name,
                    'directory_role' => $directory->role,
                    'directory_category' => $directory->category
                ]
            );
            
            Log::info('Directory archived successfully', [
                'user_id' => $skUser->id,
                'directory_id' => $directory->id,
                'name' => $directory->name
            ]);
            
            return response()->json(['message' => 'Directory archived successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to archive directory', [
                'user_id' => $skUser->id,
                'directory_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => 'Failed to archive directory: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Restore an archived directory
     */
    public function restore($id)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        Log::info('Directory restore attempt', [
            'user_id' => $skUser->id,
            'directory_id' => $id
        ]);
        
        try {
            $directory = Directory::with('creator')->find($id);
            
            if (!$directory) {
                Log::warning('Directory not found for restoring', [
                    'user_id' => $skUser->id,
                    'directory_id' => $id
                ]);
                
                return response()->json(['error' => 'Directory not found'], 404);
            }
            
            // Check if user has permission to restore
            $canRestore = false;
            
            if ($skUser->sk_role === 'Federasyon') {
                $canRestore = true;
            } elseif ($skUser->sk_role === 'Chairman') {
                $canRestore = $directory->sk_station === $skUser->sk_station && 
                    ($directory->created_by === $skUser->id || 
                    ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
            } else {
                $canRestore = $directory->created_by === $skUser->id;
            }
            
            if (!$canRestore) {
                Log::warning('Unauthorized directory restore attempt', [
                    'user_id' => $skUser->id,
                    'directory_id' => $directory->id
                ]);
                
                return response()->json(['error' => 'You do not have permission to restore this directory'], 403);
            }
            
            // Check if already published
            if ($directory->status === 'published') {
                Log::warning('Already published directory', [
                    'user_id' => $skUser->id,
                    'directory_id' => $directory->id
                ]);
                
                return response()->json(['error' => 'This directory is already published'], 400);
            }
            
            // Update the status to published and set updated_by
            $directory->status = 'published';
            $directory->updated_by = $skUser->id;
            $directory->save();
            
            // Log audit trail
            $this->logAuditTrail(
                $directory->id,
                $directory->name,
                'restore',
                $skUser->id,
                $skUser->first_name . ' ' . $skUser->last_name,
                [
                    'directory_name' => $directory->name,
                    'directory_role' => $directory->role,
                    'directory_category' => $directory->category
                ]
            );
            
            Log::info('Directory restored successfully', [
                'user_id' => $skUser->id,
                'directory_id' => $directory->id,
                'name' => $directory->name
            ]);
            
            return response()->json(['message' => 'Directory restored successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to restore directory', [
                'user_id' => $skUser->id,
                'directory_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => 'Failed to restore directory: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get published directories for the Youth page
     */
    public function getPublicDirectories()
    {
        try {
            $directories = Directory::where('status', 'published')->get();
            
            Log::info('Public directories retrieved successfully', [
                'count' => $directories->count()
            ]);
            
            return response()->json($directories);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve public directories', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => 'Failed to load directories'], 500);
        }
    }
    
    /**
     * Get organization chart data for a specific station
     */
    public function getOrgChartData($station)
    {
        try {
            // Get all published directories for the station or Federation
            $directories = Directory::with(['supervisor', 'subordinates'])
                ->where('status', 'published')
                ->where(function($query) use ($station) {
                    $query->where('sk_station', $station)
                          ->orWhere('sk_station', 'Federation');
                })
                ->orderBy('position_order', 'asc')
                ->get();
            
            Log::info('Organization chart data retrieved successfully', [
                'station' => $station,
                'count' => $directories->count()
            ]);
            
            return response()->json($directories);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve organization chart data', [
                'station' => $station,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => 'Failed to load organization chart data'], 500);
        }
    }
    
    /**
     * Bulk operations to improve performance
     */
    public function bulkOperations(Request $request)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        Log::info('Bulk operation attempt', [
            'user_id' => $skUser->id,
            'operation' => $request->operation,
            'count' => count($request->ids ?? [])
        ]);
        
        $validator = Validator::make($request->all(), [
            'operation' => 'required|in:archive,restore,delete',
            'ids' => 'required|array',
            'ids.*' => 'required|exists:directories,id',
        ]);
        
        if ($validator->fails()) {
            Log::warning('Bulk operation validation failed', [
                'user_id' => $skUser->id,
                'errors' => $validator->errors()->toArray()
            ]);
            
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $operation = $request->operation;
        $ids = $request->ids;
        $successCount = 0;
        $errorCount = 0;
        
        // Perform bulk operation in a transaction for better performance
        DB::beginTransaction();
        
        try {
            foreach ($ids as $id) {
                $directory = Directory::find($id);
                
                if (!$directory) {
                    $errorCount++;
                    Log::warning('Directory not found for bulk operation', [
                        'user_id' => $skUser->id,
                        'directory_id' => $id,
                        'operation' => $operation
                    ]);
                    continue;
                }
                
                // Check permission
                $canPerform = false;
                
                if ($skUser->sk_role === 'Federasyon') {
                    $canPerform = true;
                } elseif ($skUser->sk_role === 'Chairman') {
                    $canPerform = $directory->sk_station === $skUser->sk_station && 
                        ($directory->created_by === $skUser->id || 
                        ($directory->creator && $directory->creator->sk_role === 'Kagawad'));
                } else {
                    $canPerform = $directory->created_by === $skUser->id;
                }
                
                if (!$canPerform) {
                    $errorCount++;
                    Log::warning('Unauthorized bulk operation attempt', [
                        'user_id' => $skUser->id,
                        'directory_id' => $id,
                        'operation' => $operation
                    ]);
                    continue;
                }
                
                // Perform the operation
                switch ($operation) {
                    case 'archive':
                        // Only archive if currently published
                        if ($directory->status === 'published') {
                            $directory->status = 'archived';
                            $directory->updated_by = $skUser->id;
                            $directory->save();
                            $successCount++;
                            
                            // Log audit trail
                            $this->logAuditTrail(
                                $directory->id,
                                $directory->name,
                                'archive',
                                $skUser->id,
                                $skUser->first_name . ' ' . $skUser->last_name,
                                [
                                    'directory_name' => $directory->name,
                                    'directory_role' => $directory->role,
                                    'directory_category' => $directory->category
                                ]
                            );
                            
                            Log::info('Directory archived successfully in bulk', [
                                'user_id' => $skUser->id,
                                'directory_id' => $directory->id
                            ]);
                        } else {
                            $errorCount++;
                            Log::warning('Cannot archive already archived directory', [
                                'user_id' => $skUser->id,
                                'directory_id' => $directory->id
                            ]);
                        }
                        break;
                        
                    case 'restore':
                        // Only restore if currently archived
                        if ($directory->status === 'archived') {
                            $directory->status = 'published';
                            $directory->updated_by = $skUser->id;
                            $directory->save();
                            $successCount++;
                            
                            // Log audit trail
                            $this->logAuditTrail(
                                $directory->id,
                                $directory->name,
                                'restore',
                                $skUser->id,
                                $skUser->first_name . ' ' . $skUser->last_name,
                                [
                                    'directory_name' => $directory->name,
                                    'directory_role' => $directory->role,
                                    'directory_category' => $directory->category
                                ]
                            );
                            
                            Log::info('Directory restored successfully in bulk', [
                                'user_id' => $skUser->id,
                                'directory_id' => $directory->id
                            ]);
                        } else {
                            $errorCount++;
                            Log::warning('Cannot restore already published directory', [
                                'user_id' => $skUser->id,
                                'directory_id' => $directory->id
                            ]);
                        }
                        break;
                        
                    case 'delete':
                        // Capture directory details before deletion for audit trail
                        $directoryDetails = [
                            'id' => $directory->id,
                            'name' => $directory->name,
                            'role' => $directory->role,
                            'email' => $directory->email,
                            'phone' => $directory->phone,
                            'location' => $directory->location,
                            'category' => $directory->category,
                            'sk_station' => $directory->sk_station,
                            'position_order' => $directory->position_order,
                            'reports_to' => $directory->reports_to
                        ];
                        
                        // Log audit trail before deleting
                        $this->logAuditTrail(
                            $directory->id,
                            $directory->name,
                            'delete',
                            $skUser->id,
                            $skUser->first_name . ' ' . $skUser->last_name,
                            $directoryDetails
                        );
                        
                        // Update any entries that report to this one
                        Directory::where('reports_to', $directory->id)->update(['reports_to' => null]);
                        $directory->delete();
                        $successCount++;
                        
                        Log::info('Directory deleted successfully in bulk', [
                            'user_id' => $skUser->id,
                            'directory_id' => $directory->id
                        ]);
                        break;
                }
            }
            
            DB::commit();
            
            Log::info('Bulk operation completed', [
                'user_id' => $skUser->id,
                'operation' => $operation,
                'success_count' => $successCount,
                'error_count' => $errorCount
            ]);
            
            return response()->json([
                'message' => "Bulk {$operation} completed successfully",
                'success_count' => $successCount,
                'error_count' => $errorCount
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to perform bulk operation', [
                'user_id' => $skUser->id,
                'operation' => $operation,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => "Failed to perform bulk {$operation}",
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get statistics for the directory management dashboard
     */
    public function getStatistics()
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        try {
            // Build query based on user role
            $query = Directory::query();
            
            if ($skUser->sk_role === 'Federasyon') {
                // Federasyon can see all entries
                // No additional filtering
            } elseif ($skUser->sk_role === 'Chairman') {
                // Chairman sees directories from their station OR from 'Federation'
                $query->where(function($q) use ($skUser) {
                    $q->where('sk_station', $skUser->sk_station)
                    ->orWhere('sk_station', 'Federation');
                });
            } elseif ($skUser->sk_role === 'Kagawad') {
                // Kagawad sees their own directories, published ones from their station, or any created by Federasyon
                $query->where(function($q) use ($skUser) {
                    $q->where('created_by', $skUser->id)
                    ->orWhere(function($sq) use ($skUser) {
                        $sq->where('sk_station', $skUser->sk_station)
                            ->where('status', 'published');
                    })
                    ->orWhere('sk_station', 'Federation')
                    ->orWhereHas('creator', function($sq) {
                        $sq->where('sk_role', 'Federasyon');
                    });
                });
            }
            
            // Count by status
            $totalPublished = (clone $query)->where('status', 'published')->count();
            $totalArchived = (clone $query)->where('status', 'archived')->count();
            
            // Count by category
            $executiveCount = (clone $query)->where('category', 'executive')->count();
            $committeeCount = (clone $query)->where('category', 'committee')->count();
            $barangayCount = (clone $query)->where('category', 'barangay')->count();
            $partnerCount = (clone $query)->where('category', 'partner')->count();
            
            // Count by station
            $stationCounts = (clone $query)
                ->select('sk_station', DB::raw('count(*) as total'))
                ->groupBy('sk_station')
                ->get()
                ->pluck('total', 'sk_station')
                ->toArray();
            
            // Get most recently updated entries
            $recentUpdates = (clone $query)
                ->with(['creator', 'updater'])
                ->orderBy('updated_at', 'desc')
                ->take(5)
                ->get();
            
            // Get station with the most entries
            $topStation = null;
            $topStationCount = 0;
            
            foreach ($stationCounts as $station => $count) {
                if ($count > $topStationCount) {
                    $topStation = $station;
                    $topStationCount = $count;
                }
            }
            
            $stats = [
                'total' => $totalPublished + $totalArchived,
                'published' => $totalPublished,
                'archived' => $totalArchived,
                'categories' => [
                    'executive' => $executiveCount,
                    'committee' => $committeeCount,
                    'barangay' => $barangayCount,
                    'partner' => $partnerCount
                ],
                'stations' => $stationCounts,
                'topStation' => $topStation,
                'recentUpdates' => $recentUpdates
            ];
            
            Log::info('Directory statistics retrieved successfully', [
                'user_id' => $skUser->id,
                'total_directories' => $stats['total']
            ]);
            
            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve directory statistics', [
                'user_id' => $skUser->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => 'Failed to load statistics'], 500);
        }
    }
    
    /**
     * Get audit trail for directories
     */
    public function getAuditTrail(Request $request)
    {
        try {
            $query = DirectoryAuditTrail::query()->orderBy('created_at', 'desc');
            
            // Filter by directory ID if provided
            if ($request->has('directory_id') && $request->directory_id) {
                $query->where('directory_id', $request->directory_id);
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
            Log::error('Error fetching directory audit trail:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit trail: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Log directory action to audit trail
     */
    private function logAuditTrail($directoryId, $directoryName, $action, $userId, $userName, $details = null)
    {
        try {
            DirectoryAuditTrail::create([
                'directory_id' => $directoryId,
                'directory_name' => $directoryName,
                'action' => $action,
                'user_id' => $userId,
                'user_name' => $userName,
                'details' => $details ? json_encode($details) : null
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            Log::error('Error creating directory audit trail record:', [
                'error' => $e->getMessage(),
                'directoryId' => $directoryId,
                'action' => $action
            ]);
        }
    }
}