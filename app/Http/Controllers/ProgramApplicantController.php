<?php

namespace App\Http\Controllers;

use App\Models\ProgramApplicant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProgramApplicantController extends Controller
{
    public function index()
    {
        $applicants = ProgramApplicant::with('publishProgram')->get();
        return response()->json($applicants);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'publish_program_id' => 'required|exists:publish_programs,id',
            'firstname' => 'required|string',
            'middlename' => 'nullable|string',
            'lastname' => 'required|string',
            'barangay' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $applicant = ProgramApplicant::create($request->all());
        return response()->json($applicant, 201);
    }

    public function show($id)
    {
        $applicant = ProgramApplicant::with('publishProgram')->findOrFail($id);
        return response()->json($applicant);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'publish_program_id' => 'exists:publish_programs,id',
            'firstname' => 'string',
            'middlename' => 'nullable|string',
            'lastname' => 'string',
            'barangay' => 'string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $applicant = ProgramApplicant::findOrFail($id);
        $applicant->update($request->all());
        return response()->json($applicant);
    }

    public function destroy($id)
    {
        $applicant = ProgramApplicant::findOrFail($id);
        $applicant->delete();
        return response()->json(null, 204);
    }

    public function getByProgram($programId)
    {
        $applicants = ProgramApplicant::where('publish_program_id', $programId)->get();
        return response()->json($applicants);
    }
}
