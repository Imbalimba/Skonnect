<?php

namespace App\Http\Controllers;

use App\Models\PublishProgram;
use App\Models\ProjectMonitoring;
use App\Models\ProgramAttendee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PublishProgramController extends Controller
{
    public function index()
    {
        $publishedPrograms = PublishProgram::with(['project', 'applicants'])->get();
        return response()->json($publishedPrograms);
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'project_id' => 'required|exists:project_monitoring,id',
                'barangay' => 'required|string',
                'time_start' => 'required|date',
                'time_end' => 'required|date|after:time_start',
                'description' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            Log::info('Publishing program with data:', $request->all());

            $publishedProgram = PublishProgram::create([
                'project_id' => $request->project_id,
                'barangay' => $request->barangay,
                'time_start' => $request->time_start,
                'time_end' => $request->time_end,
                'description' => $request->description
            ]);

            return response()->json($publishedProgram, 201);
        } catch (\Exception $e) {
            Log::error('Error publishing program: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Error publishing program: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $publishedProgram = PublishProgram::with(['project', 'applicants'])->findOrFail($id);
        return response()->json($publishedProgram);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'exists:project_monitorings,id',
            'selected_tags' => 'array',
            'barangay' => 'string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $publishedProgram = PublishProgram::findOrFail($id);
        $publishedProgram->update($request->all());
        return response()->json($publishedProgram);
    }

    public function destroy($id)
    {
        $publishedProgram = PublishProgram::findOrFail($id);
        $publishedProgram->delete();
        return response()->json(null, 204);
    }

    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'publish_program_id' => 'required|exists:publish_programs,id',
                'account_id' => 'required|exists:accounts,id',
                'firstname' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'lastname' => 'required|string|max:255',
                'barangay' => 'required|string|max:255',
                'reason_for_applying' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Check if user has already registered for this program
            $existingRegistration = ProgramAttendee::where('publish_program_id', $request->publish_program_id)
                ->where('account_id', $request->account_id)
                ->first();

            if ($existingRegistration) {
                return response()->json(['message' => 'You have already registered for this program'], 409);
            }

            // Create the registration
            $registration = ProgramAttendee::create([
                'publish_program_id' => $request->publish_program_id,
                'account_id' => $request->account_id,
                'firstname' => $request->firstname,
                'middlename' => $request->middlename,
                'lastname' => $request->lastname,
                'barangay' => $request->barangay,
                'reason_for_applying' => $request->reason_for_applying
            ]);

            return response()->json([
                'message' => 'Successfully registered for the program',
                'data' => $registration
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error registering for program: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Error registering for program: ' . $e->getMessage()], 500);
        }
    }
}
