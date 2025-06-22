<?php

namespace App\Http\Controllers;

use App\Models\RegisteredAttendee;
use App\Models\PublishEvent;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    public function registerAttendee(Request $request)
    {
        DB::beginTransaction();
        try {
            Log::info('Attempting to register attendee:', [
                'request_data' => $request->all(),
                'user' => $request->user(),
                'auth_check' => Auth::check(),
                'auth_guard' => Auth::getDefaultDriver(),
                'user_id_from_request' => $request->input('user_id'),
                'user_id_from_auth' => Auth::id()
            ]);

            // Validate input
            $validator = Validator::make($request->all(), [
                'publish_event_id' => 'required|exists:publish_events,id',
                'first_name' => 'required|string',
                'middle_name' => 'nullable|string',
                'last_name' => 'required|string',
                'barangay' => 'required|string',
                'attendee_type' => 'required|in:participant,volunteer'
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', [
                    'errors' => $validator->errors()->toArray(),
                    'request_data' => $request->all()
                ]);
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get the event
            $event = PublishEvent::findOrFail($request->publish_event_id);

            // Check if user is already registered
            $existingRegistration = RegisteredAttendee::where('publish_event_id', $request->publish_event_id)
                ->where('user_id', Auth::id())
                ->first();

            if ($existingRegistration) {
                return response()->json([
                    'error' => 'Already registered',
                    'message' => 'You are already registered for this event'
                ], 409);
            }

            // Check if user is a volunteer
            $isVolunteer = false;
            if ($request->attendee_type === 'volunteer') {
                // Check if the event needs volunteers
                if ($event->need_volunteers !== 'yes') {
                    return response()->json([
                        'error' => 'This event does not require volunteers',
                        'message' => 'You cannot register as a volunteer for this event'
                    ], 403);
                }
                $isVolunteer = true;
            }

            // If not a volunteer, check demographic eligibility
            if (!$isVolunteer) {
                // Get user's profile
                $profile = Profile::where('account_id', Auth::id())->first();
                if (!$profile) {
                    return response()->json([
                        'error' => 'Profile not found',
                        'message' => 'Please complete your profile before registering'
                    ], 404);
                }

                // Get event demographics
                $eventDemographics = is_string($event->selected_tags)
                    ? json_decode($event->selected_tags, true)
                    : $event->selected_tags;

                if (!is_array($eventDemographics)) {
                    $eventDemographics = [];
                }

                // Extract user demographics
                $userDemographics = $this->extractUserDemographics($profile);

                // Check if user matches at least one demographic requirement
                $hasMatch = false;
                foreach ($eventDemographics as $eventDemo) {
                    $eventDemo = strtolower(trim($eventDemo));
                    foreach ($userDemographics as $userDemo) {
                        $userDemo = strtolower(trim($userDemo));
                        if (strpos($userDemo, $eventDemo) !== false ||
                            strpos($eventDemo, $userDemo) !== false) {
                            $hasMatch = true;
                            break 2;
                        }
                    }
                }

                if (!$hasMatch) {
                    return response()->json([
                        'error' => 'Not eligible for event',
                        'message' => 'You do not match any of the required demographics for this event'
                    ], 403);
                }
            }

            // Create the registered attendee
            $registeredAttendee = RegisteredAttendee::create([
                'publish_event_id' => $request->publish_event_id,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'barangay' => $request->barangay,
                'attendee_type' => $request->attendee_type,
                'user_id' => Auth::id()
            ]);

            // Get updated counts
            $participantsCount = $event->participants_count;
            $volunteersCount = $event->volunteers_count;

            DB::commit();

            Log::info('Successfully registered attendee:', [
                'registered_attendee' => $registeredAttendee,
                'participants_count' => $participantsCount,
                'volunteers_count' => $volunteersCount
            ]);

            return response()->json([
                'message' => 'Successfully registered for the event',
                'registered_attendee' => $registeredAttendee,
                'participants_count' => $participantsCount,
                'volunteers_count' => $volunteersCount
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error registering attendee: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to register for event',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract user demographics from profile
     */
    private function extractUserDemographics($profile)
    {
        $demographics = [];

        // Age group
        $age = \Carbon\Carbon::parse($profile->dob)->age;
        if ($age >= 15 && $age <= 17) {
            $demographics[] = 'child youth(15-17 yrs old)';
        } elseif ($age >= 18 && $age <= 24) {
            $demographics[] = 'core youth(18-24 yrs old)';
        } elseif ($age >= 25 && $age <= 30) {
            $demographics[] = 'young adult(25-30 yrs old)';
        }

        // Gender
        if ($profile->gender) {
            $demographics[] = strtolower($profile->gender);
        }

        // Education
        if ($profile->educational_background) {
            $demographics[] = strtolower($profile->educational_background);
        }

        // Employment
        if ($profile->work_status) {
            $demographics[] = strtolower($profile->work_status);
        }

        // Special categories
        if ($profile->studying_level !== 'Not Studying' || !empty($profile->school_name)) {
            $demographics[] = 'student';
        }
        if ($profile->studying_level === 'Not Studying' && empty($profile->school_name)) {
            $demographics[] = 'out of school youth';
        }
        if ($profile->pwd === 'Yes') {
            $demographics[] = 'pwd';
        }
        if ($profile->athlete === 'Yes') {
            $demographics[] = 'athlete';
        }
        if ($profile->sk_voter === 'Yes') {
            $demographics[] = 'sk voter';
        }
        if ($profile->national_voter === 'Yes') {
            $demographics[] = 'national voter';
        }

        // Civil status
        if ($profile->civil_status) {
            $demographics[] = strtolower($profile->civil_status);
        }

        return array_unique($demographics);
    }
}
