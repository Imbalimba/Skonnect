<?php

namespace App\Http\Controllers;

use App\Models\ProfileVolunteer;
use Illuminate\Http\Request;

class ProfVolunteerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return ProfileVolunteer::with('account')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'is_volunteer' => 'required|string|in:yes,no',
        ]);

        // Create a profile even if 'no' was selected
        $existing = ProfileVolunteer::where('account_id', $validated['account_id'])->first();

        if ($existing) {
            // Update existing record
            $existing->update($validated);
            return response()->json($existing, 200);
        }

        // Create new record
        $profile = ProfileVolunteer::create($validated);
        return response()->json($profile, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ProfileVolunteer $profileVolunteer)
    {
        return $profileVolunteer->load('account');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProfileVolunteer $profileVolunteer)
    {
        $validated = $request->validate([
            'is_volunteer' => 'required|string|in:yes,no',
        ]);

        $profileVolunteer->update($validated);

        return response()->json($profileVolunteer);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProfileVolunteer $profileVolunteer)
    {
        $profileVolunteer->delete();

        return response()->json(null, 204);
    }
}
