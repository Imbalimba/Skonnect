<?php

namespace App\Http\Controllers;

use App\Models\Template;
use App\Models\TemplateAuditTrail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Log;

class TemplateController extends Controller
{
    /**
     * Display a listing of the templates.
     */
    public function index(Request $request)
    {
        $query = Template::query();
        
        // Apply filters
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        // Include archived if requested
        if ($request->has('include_archived') && $request->include_archived) {
            // Include all
        } else {
            $query->where('status', 'active');
        }
        
        $templates = $query->orderBy('created_at', 'desc')->get();
        
        return response()->json($templates);
    }

    /**
     * Store a newly created template with duplicate detection.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:reports,forms,letters,budget,events',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Check for duplicates by title
            $existingTemplate = Template::where('title', $request->title)
                ->where('category', $request->category)
                ->first();
                
            if ($existingTemplate) {
                return response()->json([
                    'success' => false,
                    'message' => 'A template with this title already exists in the selected category.',
                    'duplicate' => true
                ], 422);
            }
            
            // Handle file upload
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('templates', $fileName, 'public');
            
            // Get file type and size
            $fileType = strtolower($file->getClientOriginalExtension());
            $fileSize = $this->formatFileSize($file->getSize());
            
            // Get SK user from session - using the same approach as DirectoryController
            $skUser = session('sk_user');
            Log::info('SK User in session:', ['sk_user' => $skUser]);
            
            $userId = $skUser ? $skUser->id : null;
            
            // Create template record
            $template = Template::create([
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category,
                'file_type' => $fileType,
                'file_path' => $filePath,
                'file_size' => $fileSize,
                'status' => 'active',
                'created_by' => $userId,
                'updated_by' => $userId
            ]);
            
            // Log audit trail
            $this->logAuditTrail(
                $template->id,
                $template->title,
                'create',
                $userId,
                $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                [
                    'title' => $template->title,
                    'description' => $template->description,
                    'category' => $template->category,
                    'file_type' => $template->file_type,
                    'file_size' => $template->file_size
                ]
            );
            
            return response()->json([
                'success' => true,
                'template' => $template
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Error creating template:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified template with duplicate detection.
     */
    public function update(Request $request, Template $template)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:reports,forms,letters,budget,events',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Check for duplicates by title (excluding the current template)
            $existingTemplate = Template::where('title', $request->title)
                ->where('category', $request->category)
                ->where('id', '!=', $template->id)
                ->first();
                
            if ($existingTemplate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Another template with this title already exists in the selected category.',
                    'duplicate' => true
                ], 422);
            }
            
            // Get SK user from session - using the same approach as DirectoryController
            $skUser = session('sk_user');
            Log::info('SK User in session for update:', ['sk_user' => $skUser]);
            
            $userId = $skUser ? $skUser->id : null;
            
            // Capture the state before update for audit trail
            $beforeState = [
                'title' => $template->title,
                'description' => $template->description,
                'category' => $template->category,
                'file_type' => $template->file_type,
                'file_size' => $template->file_size
            ];
            
            $updateData = [
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category,
                'updated_by' => $userId
            ];

            // Handle file update
            if ($request->hasFile('file')) {
                // Delete old file
                if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
                    Storage::disk('public')->delete($template->file_path);
                }
                
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('templates', $fileName, 'public');
                
                $updateData['file_path'] = $filePath;
                $updateData['file_type'] = strtolower($file->getClientOriginalExtension());
                $updateData['file_size'] = $this->formatFileSize($file->getSize());
            }

            $template->update($updateData);
            
            // Capture the state after update for audit trail
            $afterState = [
                'title' => $template->title,
                'description' => $template->description,
                'category' => $template->category,
                'file_type' => $template->file_type,
                'file_size' => $template->file_size
            ];
            
            // Log audit trail
            $this->logAuditTrail(
                $template->id,
                $template->title,
                'update',
                $userId,
                $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                [
                    'before' => $beforeState,
                    'after' => $afterState,
                    'file_updated' => $request->hasFile('file')
                ]
            );

            return response()->json([
                'success' => true,
                'template' => $template
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating template:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk archive templates
     */
    public function bulkArchive(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:templates,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Get SK user from session
            $skUser = session('sk_user');
            $userId = $skUser ? $skUser->id : null;
            
            // Get template titles for audit trail
            $templates = Template::whereIn('id', $request->ids)->get();
            
            Template::whereIn('id', $request->ids)->update([
                'status' => 'archived',
                'updated_by' => $userId
            ]);
            
            // Log audit trails for each template
            foreach ($templates as $template) {
                $this->logAuditTrail(
                    $template->id,
                    $template->title,
                    'archive',
                    $userId,
                    $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                    ['template_title' => $template->title]
                );
            }
            
            return response()->json([
                'success' => true,
                'message' => count($request->ids) . ' templates archived successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error bulk archiving templates:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to archive templates: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Bulk restore templates
     */
    public function bulkRestore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:templates,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Get SK user from session
            $skUser = session('sk_user');
            $userId = $skUser ? $skUser->id : null;
            
            // Get template titles for audit trail
            $templates = Template::whereIn('id', $request->ids)->get();
            
            Template::whereIn('id', $request->ids)->update([
                'status' => 'active',
                'updated_by' => $userId
            ]);
            
            // Log audit trails for each template
            foreach ($templates as $template) {
                $this->logAuditTrail(
                    $template->id,
                    $template->title,
                    'restore',
                    $userId,
                    $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                    ['template_title' => $template->title]
                );
            }
            
            return response()->json([
                'success' => true,
                'message' => count($request->ids) . ' templates restored successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error bulk restoring templates:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore templates: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Bulk delete templates
     */
    public function bulkDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:templates,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Get SK user from session
            $skUser = session('sk_user');
            $userId = $skUser ? $skUser->id : null;
            
            $templates = Template::whereIn('id', $request->ids)->get();
            
            foreach ($templates as $template) {
                // Delete associated files
                if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
                    Storage::disk('public')->delete($template->file_path);
                }
                
                // Log audit trail before deleting
                $this->logAuditTrail(
                    $template->id,
                    $template->title,
                    'delete',
                    $userId,
                    $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                    [
                        'template_title' => $template->title,
                        'template_category' => $template->category,
                        'template_file_type' => $template->file_type
                    ]
                );
                
                $template->delete();
            }
            
            return response()->json([
                'success' => true,
                'message' => count($request->ids) . ' templates deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error bulk deleting templates:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete templates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified template.
     */
    public function destroy(Template $template)
    {
        try {
            // Get SK user from session
            $skUser = session('sk_user');
            $userId = $skUser ? $skUser->id : null;
            
            // Capture template details before deletion for audit trail
            $templateDetails = [
                'template_id' => $template->id,
                'template_title' => $template->title,
                'template_description' => $template->description,
                'template_category' => $template->category,
                'template_file_type' => $template->file_type,
                'template_file_size' => $template->file_size
            ];            
            
            // Delete associated files
            if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
                Storage::disk('public')->delete($template->file_path);
            }
            
            // Log audit trail before deleting
            $this->logAuditTrail(
                $template->id,
                $template->title,
                'delete',
                $userId,
                $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                $templateDetails
            );
            
            $template->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Template deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error deleting template:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive a template.
     */
    public function archive(Template $template)
    {
        try {
            // Get SK user from session
            $skUser = session('sk_user');
            $userId = $skUser ? $skUser->id : null;
            
            $template->update([
                'status' => 'archived',
                'updated_by' => $userId
            ]);
            
            // Log audit trail
            $this->logAuditTrail(
                $template->id,
                $template->title,
                'archive',
                $userId,
                $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                ['template_title' => $template->title]
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Template archived successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error archiving template:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to archive template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore an archived template.
     */
    public function restore(Template $template)
    {
        try {
            // Get SK user from session
            $skUser = session('sk_user');
            $userId = $skUser ? $skUser->id : null;
            
            $template->update([
                'status' => 'active',
                'updated_by' => $userId
            ]);
            
            // Log audit trail
            $this->logAuditTrail(
                $template->id,
                $template->title,
                'restore',
                $userId,
                $skUser ? $skUser->first_name . ' ' . $skUser->last_name : 'Unknown',
                ['template_title' => $template->title]
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Template restored successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error restoring template:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview a template file.
     */
    public function preview(Template $template)
    {
        try {
            $filePath = storage_path('app/public/' . $template->file_path);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }
            
            $fileType = $template->file_type;
            $mimeType = $this->getMimeType($fileType);
            
            return Response::make(file_get_contents($filePath), 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $template->title . '.' . $fileType . '"',
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error previewing template:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to preview template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a template.
     */
    public function download(Template $template)
    {
        try {
            // Increment download count
            $template->incrementDownloadCount();
            
            // Get file path
            $filePath = storage_path('app/public/' . $template->file_path);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }
            
            // Return file download
            return response()->download($filePath, $template->title . '.' . $template->file_type);
            
        } catch (\Exception $e) {
            Log::error('Error downloading template:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to download template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audit trail for templates
     */
    public function getAuditTrail(Request $request)
    {
        try {
            $query = TemplateAuditTrail::query()->orderBy('created_at', 'desc');
            
            // Filter by template ID if provided
            if ($request->has('template_id') && $request->template_id) {
                $query->where('template_id', $request->template_id);
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
            Log::error('Error fetching template audit trail:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit trail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format file size to human readable format.
     */
    private function formatFileSize($bytes)
    {
        if ($bytes === 0) return '0 B';
        
        $k = 1024;
        $sizes = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes) / log($k));
        
        return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
    }

    /**
     * Get MIME type based on file extension.
     */
    private function getMimeType($extension)
    {
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }
    
    /**
     * Log template action to audit trail
     */
    private function logAuditTrail($templateId, $templateTitle, $action, $userId, $userName, $details = null)
    {
        try {
            TemplateAuditTrail::create([
                'template_id' => $templateId,
                'template_title' => $templateTitle,
                'action' => $action,
                'user_id' => $userId,
                'user_name' => $userName,
                'details' => $details ? json_encode($details) : null
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            Log::error('Error creating audit trail record:', [
                'error' => $e->getMessage(),
                'templateId' => $templateId,
                'action' => $action
            ]);
        }
    }
}