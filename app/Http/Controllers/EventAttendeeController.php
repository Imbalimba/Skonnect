<?php

namespace App\Http\Controllers;

use App\Models\EventAttendee;
use App\Models\PublishEvent;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EventAttendeeController extends Controller
{
    /**
     * Display attendees for a specific published event
     */
    public function index($publishEventId)
    {
        try {
            $publishEvent = PublishEvent::findOrFail($publishEventId);

            $attendees = EventAttendee::where('publish_event_id', $publishEventId)
                ->with('profile')
                ->get();

            return response()->json($attendees);
        } catch (\Exception $e) {
            Log::error('Error fetching event attendees: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch attendees'], 500);
        }
    }

    /**
     * Register a new attendee
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            // 1. Validate input
            $validator = Validator::make($request->all(), [
                'publish_event_id' => 'required|exists:publish_events,id',
                'profile_id' => 'required|exists:profiles,id',
                'attendees_email' => 'required|email|exists:accounts,email',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // 2. Find profile with account relation
            $profile = Profile::with(['account'])->find($request->profile_id);
            if (!$profile) {
                throw new \Exception("Profile not found", 404);
            }

            // 3. Verify account
            if (!$profile->account) {
                throw new \Exception("Account not found for profile", 404);
            }

            if ($profile->account->verification_status !== 'verified') {
                throw new \Exception("Account not verified", 403);
            }

            // 4. Check for existing registration
            if (EventAttendee::where('publish_event_id', $request->publish_event_id)
                ->where('profile_id', $request->profile_id)
                ->exists()
            ) {
                throw new \Exception("Already registered for this event", 409);
            }

            // 5. Check demographic matching for the event
            $eventRequirements = PublishEvent::with('event')->find($request->publish_event_id);

            // If the event has demographic requirements (selected_tags)
            if ($eventRequirements && !empty($eventRequirements->selected_tags)) {
                $selectedTags = is_string($eventRequirements->selected_tags)
                    ? json_decode($eventRequirements->selected_tags, true)
                    : $eventRequirements->selected_tags;

                if (!empty($selectedTags)) {
                    // Extract user demographics
                    $userDemographics = $this->extractUserDemographics($profile);

                    // Check if user matches at least one demographic requirement
                    $hasMatch = false;
                    foreach ($selectedTags as $tag) {
                        if ($this->matchesDemographic($profile, $tag)) {
                            $hasMatch = true;
                            break;
                        }

                        // Case-insensitive partial match with user demographics
                        $tag = strtolower(trim($tag));
                        foreach ($userDemographics as $userDemographic) {
                            $userDemographic = strtolower(trim($userDemographic));
                            if (
                                strpos($userDemographic, $tag) !== false ||
                                strpos($tag, $userDemographic) !== false
                            ) {
                                $hasMatch = true;
                                break 2;
                            }
                        }
                    }

                    if (!$hasMatch) {
                        throw new \Exception("User does not match any of the required demographics for this event", 403);
                    }
                }
            }

            // 6. Create registration
            $attendee = EventAttendee::create([
                'publish_event_id' => $request->publish_event_id,
                'profile_id' => $request->profile_id,
                'attendees_email' => $request->attendees_email,
                'status' => 'registered'
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Registration successful',
                'data' => $attendee
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            $statusCode = in_array($e->getCode(), [403, 404, 409]) ? $e->getCode() : 500;

            return response()->json([
                'error' => $e->getMessage(),
                'details' => $statusCode === 500 ? 'Internal server error' : null
            ], $statusCode);
        }
    }

    /**
     * Extract user demographics from profile
     */
    private function extractUserDemographics($profile)
    {
        $demographics = [];

        // Add gender
        if (!empty($profile->gender)) {
            $demographics[] = $profile->gender;
        }

        // Add age-based demographic
        if ($profile->dob) {
            $age = Carbon::parse($profile->dob)->age;
            if ($age >= 15 && $age <= 17) {
                $demographics[] = 'child youth(15-17 yrs old)';
            } elseif ($age >= 18 && $age <= 24) {
                $demographics[] = 'core youth(18-24 yrs old)';
            } elseif ($age >= 25 && $age <= 30) {
                $demographics[] = 'young adult(25-30 yrs old)';
            }
        }

        // Add education status
        if (!empty($profile->educational_background)) {
            $demographics[] = strtolower($profile->educational_background);
        }

        // Add employment status
        if (!empty($profile->work_status)) {
            $demographics[] = strtolower($profile->work_status);
        }

        // Add special categories
        if (!empty($profile->studying_level) && $profile->studying_level !== 'Not Studying') {
            $demographics[] = 'student';
        }

        if (!empty($profile->studying_level) && $profile->studying_level === 'Not Studying') {
            $demographics[] = 'out of school youth';
        }

        if (!empty($profile->pwd) && $profile->pwd === 'Yes') {
            $demographics[] = 'pwd';
        }

        if (!empty($profile->athlete) && $profile->athlete === 'Yes') {
            $demographics[] = 'athlete';
        }

        if (!empty($profile->sk_voter) && $profile->sk_voter === 'Yes') {
            $demographics[] = 'sk voter';
        }

        if (!empty($profile->national_voter) && $profile->national_voter === 'Yes') {
            $demographics[] = 'national voter';
        }

        // Add civil status
        if (!empty($profile->civil_status)) {
            $demographics[] = strtolower($profile->civil_status);
        }

        return $demographics;
    }

    /**
     * Helper method to check demographic matching
     */
    private function matchesDemographic($profile, $demographic)
    {
        $demographic = strtolower(trim($demographic));

        // Age groups
        if (in_array($demographic, ['child youth(15-17 yrs old)', 'core youth(18-24 yrs old)', 'young adult(25-30 yrs old)'])) {
            $age = Carbon::parse($profile->dob)->age;
            switch ($demographic) {
                case 'child youth(15-17 yrs old)':
                    return $age >= 15 && $age <= 17;
                case 'core youth(18-24 yrs old)':
                    return $age >= 18 && $age <= 24;
                case 'young adult(25-30 yrs old)':
                    return $age >= 25 && $age <= 30;
            }
        }

        // Gender
        if (in_array($demographic, ['male', 'female'])) {
            return strtolower($profile->gender) === $demographic;
        }

        // Education
        $educationMap = [
            'elementary level' => 'Elementary Level',
            'elementary grad' => 'Elementary Grad',
            'high school level' => 'High School Level',
            'high school grad' => 'High School Grad',
            'vocational grad' => 'Vocational Grad',
            'college level' => 'College Level',
            'college grad' => 'College Grad',
            'masters level' => 'Masters Level',
            'masters grad' => 'Masters Grad',
            'doctorate level' => 'Doctorate Level',
            'doctorate grad' => 'Doctorate Grad'
        ];
        if (array_key_exists($demographic, $educationMap)) {
            return $profile->educational_background === $educationMap[$demographic];
        }

        // Employment
        $employmentMap = [
            'employed' => 'Employed',
            'unemployed' => 'Unemployed',
            'self employed' => 'Self Employed'
        ];
        if (array_key_exists($demographic, $employmentMap)) {
            return $profile->work_status === $employmentMap[$demographic];
        }

        // Special categories
        switch ($demographic) {
            case 'student':
                return $profile->studying_level !== 'Not Studying' || !empty($profile->school_name);
            case 'out of school youth':
                return $profile->studying_level === 'Not Studying' && empty($profile->school_name);
            case 'pwd':
                return $profile->pwd === 'Yes';
            case 'athlete':
                return $profile->athlete === 'Yes';
            case 'sk voter':
                return $profile->sk_voter === 'Yes';
            case 'national voter':
                return $profile->national_voter === 'Yes';
        }

        // Civil status
        $civilStatusMap = [
            'single' => 'Single',
            'married' => 'Married',
            'widowed' => 'Widowed',
            'divorced' => 'Divorced',
            'separated' => 'Separated'
        ];
        if (array_key_exists($demographic, $civilStatusMap)) {
            return $profile->civil_status === $civilStatusMap[$demographic];
        }

        return false;
    }

    /**
     * Show a specific attendee
     */
    public function show($id)
    {
        try {
            $attendee = EventAttendee::with('profile')->findOrFail($id);
            return response()->json($attendee);
        } catch (\Exception $e) {
            Log::error('Error retrieving attendee: ' . $e->getMessage());
            return response()->json(['error' => 'Attendee not found'], 404);
        }
    }

    /**
     * Update attendee status
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:invited,attending,declined,maybe',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $attendee = EventAttendee::findOrFail($id);
            $attendee->update(['status' => $request->status]);

            return response()->json([
                'message' => 'Status updated',
                'attendee' => $attendee
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating attendee: ' . $e->getMessage());
            return response()->json(['error' => 'Update failed'], 500);
        }
    }

    /**
     * Remove an attendee
     */
    public function destroy($id)
    {
        try {
            $attendee = EventAttendee::findOrFail($id);
            $attendee->delete();
            return response()->json(['message' => 'Attendee removed']);
        } catch (\Exception $e) {
            Log::error('Error deleting attendee: ' . $e->getMessage());
            return response()->json(['error' => 'Deletion failed'], 500);
        }
    }
}
