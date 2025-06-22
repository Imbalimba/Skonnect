<?php

namespace App\Http\Controllers;

use App\Models\ProjectMonitoring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProjectMonitoringController extends Controller
{
   public function index()
{
    try {
        Log::info('Fetching projects');
        $projects = ProjectMonitoring::all();
        
        // Ensure we always return an array, even if empty
        return response()->json([
            'success' => true,
            'data' => $projects->toArray(),
            'count' => $projects->count()
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error fetching projects: ' . $e->getMessage());
        Log::error($e->getTraceAsString());
        return response()->json([
            'success' => false,
            'message' => 'Error fetching projects',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'ppas' => 'required|string',
                'description' => 'required|string',
                'expected_output' => 'required|string',
                'performance_target' => 'required|string',
                'period_implementation_start' => 'required|string|max:50',
                'period_implementation_end' => 'required|string|max:50',
                'total_budget' => 'required|numeric',
                'person_responsible' => 'required|string',
                'center_of_participation' => 'required|string',
                'barangay' => 'nullable|string',
            ]);

            // Log the received data for debugging
            Log::info('Received project data:', $validatedData);

            $project = ProjectMonitoring::create($validatedData);
            return response()->json(['message' => 'Project created successfully', 'data' => $project], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating project: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating project',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $project = ProjectMonitoring::findOrFail($id);
            return response()->json($project);
        } catch (\Exception $e) {
            Log::error('Error fetching project: ' . $e->getMessage());
            return response()->json(['message' => 'Project not found'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $project = ProjectMonitoring::findOrFail($id);
            $validatedData = $request->validate([
                'ppas' => 'required|string',
                'description' => 'required|string',
                'expected_output' => 'required|string',
                'performance_target' => 'required|string',
                'period_implementation_start' => 'required|string',
                'period_implementation_end' => 'required|string',
                'total_budget' => 'required|numeric',
                'person_responsible' => 'required|string',
                'center_of_participation' => 'required|string',
                'barangay' => 'nullable|string',
            ]);

            $project->update($validatedData);
            return response()->json(['message' => 'Project updated successfully', 'data' => $project]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating project: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating project', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $project = ProjectMonitoring::findOrFail($id);
            $project->delete();
            return response()->json(['message' => 'Project deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting project: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting project'], 500);
        }
    }
}
