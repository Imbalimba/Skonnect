<?php

namespace App\Http\Controllers;

use App\Models\ProfileVolunteer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VolunteerStatusController extends Controller
{
    /**
     * Check if a user is a volunteer
     *
     * @param int $userId
     * @return \Illuminate\Http\Response
     */
    public function checkStatus($userId)
    {
        try {
            $volunteerProfile = ProfileVolunteer::where('account_id', $userId)
                ->where('is_volunteer', 'yes')
                ->first();

            return response()->json([
                'isVolunteer' => (bool) $volunteerProfile
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking volunteer status: ' . $e->getMessage());
            return response()->json([
                'isVolunteer' => false,
                'error' => 'Failed to check volunteer status'
            ], 500);
        }
    }
}
