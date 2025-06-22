<?php

namespace App\Http\Controllers;

use App\Models\RegisteredAttendee;
use App\Models\PublishEvent;
use App\Models\Profile;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;


class RegisteredAttendeeController extends Controller
{
    public function store(Request $request)
    {
        DB::beginTransaction();
        
        try 
        {
            // Validate input
            $validator = Validator::make($request->all(), [
                'publish_event_id' => 'required|exists:publish_events,id',
                'first_name' => 'required|string',
                'middle_name' => 'nullable|string',
                'last_name' => 'required|string',
                'barangay' => 'required|string',
                'attendee_type' => 'required|in:participant,volunteer',
                'account_id' => 'required|exists:accounts,id'
            ]);
    
            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
    
            // Check if user is already registered for this event
            $existingRegistration = RegisteredAttendee::where('publish_event_id', $request->publish_event_id)
                ->where('account_id', $request->account_id)
                ->first();
    
            if ($existingRegistration) {
                return response()->json([
                    'error' => 'Already registered',
                    'message' => 'You have already registered for this event'
                ], 409);
            }

            // Get the event
            $event = PublishEvent::with('event')->findOrFail($request->publish_event_id);

            // Get the eventmanage record from the publish event relationship
            $eventManage = $event->event;
            if (!$eventManage) {
                return response()->json([
                    'error' => 'Event not found',
                    'message' => 'The associated event could not be found'
                ], 404);
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
                $profile = Profile::where('account_id', $request->account_id)->first();
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
                    if (in_array($eventDemo, $userDemographics)) {
                        $hasMatch = true;
                        break;
                    }
                }

                if (!$hasMatch && !$isVolunteer) {
                    return response()->json([
                        'error' => 'Not eligible for event',
                        'message' => 'You do not match any of the required demographics for this event'
                    ], 403);
                }
            }

            // Create the registered attendee
            $registeredAttendee = RegisteredAttendee::create([
                'publish_event_id' => $request->publish_event_id,
                'eventmanage_id'   => $eventManage->id,
                'event_name'       => $eventManage->event,
                'first_name'       => $request->first_name,
                'middle_name'      => $request->middle_name,
                'last_name'        => $request->last_name,
                'barangay'         => $request->barangay,
                'attendee_type'    => $request->attendee_type,
                'account_id'       => $request->account_id
            ]);

            // Get the updated counts using the accessor methods
            $participantsCount = $event->participants_count;
            $volunteersCount = $event->volunteers_count;

            DB::commit();

            return response()->json([
                'message' => 'Successfully registered for the event',
                'registered_attendee' => $registeredAttendee,
                'participants_count' => $participantsCount,
                'volunteers_count' => $volunteersCount
            ], 201);
        } 
        catch (\Exception $e) 
        {
            DB::rollBack();
            Log::error('Error registering attendee: ' . $e->getMessage());
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
    
        // Add gender (convert to lowercase for matching)
        if (!empty($profile->gender)) {
            $demographics[] = strtolower($profile->gender);
        }
    
        // Add age-based demographic
        if ($profile->birthdate) {
            $age = \Carbon\Carbon::parse($profile->birthdate)->age;
            if ($age >= 15 && $age <= 17) {
                $demographics[] = 'child youth (15-17)';
            } elseif ($age >= 18 && $age <= 24) {
                $demographics[] = 'core youth (18-24)';
            } elseif ($age >= 25 && $age <= 30) {
                $demographics[] = 'young adult (25-30)';
            }
        }
    
        // Add other demographics (all converted to lowercase)
        $fields = [
            'educational_background',
            'work_status',
            'studying_level',
            'pwd',
            'athlete',
            'sk_voter',
            'national_voter',
            'civil_status',
            'lgbtqia_member'
        ];
    
        foreach ($fields as $field) {
            if (!empty($profile->$field)) {
                $value = strtolower($profile->$field);
                // Handle special cases
                if ($field === 'studying_level') {
                    if ($value !== 'not studying') {
                        $demographics[] = 'student';
                    } else {
                        $demographics[] = 'out of school youth';
                    }
                } elseif ($field === 'pwd' && $value === 'yes') {
                    $demographics[] = 'pwd';
                } elseif ($field === 'athlete' && $value === 'yes') {
                    $demographics[] = 'athlete';
                } elseif ($field === 'sk_voter' && $value === 'yes') {
                    $demographics[] = 'sk voter';
                } elseif ($field === 'national_voter' && $value === 'yes') {
                    $demographics[] = 'national voter';
                } elseif ($field === 'lgbtqia_member' && $value === 'yes') {
                    $demographics[] = 'lgbtqia+';
                } else {
                    $demographics[] = $value;
                }
            }
        }
    
        return $demographics;
    }

    public function checkProfileStatus($userId)
    {
        try 
        {
            // Get the account
            $account = Account::findOrFail($userId);

            // Check if account is verified
            if ($account->verification_status !== 'verified') {
                return response()->json([
                    'status' => 'not_verified',
                    'message' => 'Account is not verified'
                ]);
            }

            // Get the profile
            $profile = Profile::where('account_id', $userId)->first();

            if (!$profile) {
                return response()->json([
                    'status' => 'no_profile',
                    'message' => 'No profile found'
                ]);
            }

            // Check if profile is complete
            $requiredFields = [
                'first_name', 'last_name', 'gender', 'birthdate',
                'address', 'barangay', 'email', 'phone_number'
            ];

            $missingFields = [];
            foreach ($requiredFields as $field) {
                if (empty($profile->$field)) {
                    $missingFields[] = $field;
                }
            }

            if (!empty($missingFields)) {
                return response()->json([
                    'status' => 'incomplete',
                    'message' => 'Profile is incomplete',
                    'missing_fields' => $missingFields
                ]);
            }

            return response()->json([
                'status' => 'complete',
                'message' => 'Profile is complete',
                'profile' => $profile
            ]);
        } 
        catch (\Exception $e) 
        {
            Log::error('Error checking profile status: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to check profile status',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try 
        {
            $validator = Validator::make($request->all(), [
                'attended' => 'required|in:yes,no'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $attendee = RegisteredAttendee::findOrFail($id);
            $attendee->attended = $request->attended;
            $attendee->save();

            return response()->json([
                'message' => 'Attendance updated successfully',
                'attendee' => $attendee->load('eventManage') // Eager load the eventManage relationship
            ]);
        } 
        catch (\Exception $e) 
        {
            Log::error('Error updating attendance: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update attendance',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            Log::info('Starting to fetch registered attendees');
            
            // Check if the table exists
            if (!Schema::hasTable('registered_attendees')) {
                Log::error('registered_attendees table does not exist');
                return response()->json(['error' => 'Table not found'], 500);
            }

            // Get query builder instance
            $query = RegisteredAttendee::with([
                'eventManage:id,event,timeframe',
                'publishEvent:id,event_id',
                'publishEvent.event:id,event,timeframe'
            ]);

            // Filter by eventmanage_id if provided
            if ($request->has('eventmanage_id') && $request->eventmanage_id !== 'all') {
                $query->where('eventmanage_id', $request->eventmanage_id);
            }

            // Get all registered attendees with their relationships
            $attendees = $query->select([
                'id',
                'first_name',
                'middle_name',
                'last_name',
                'barangay',
                'attendee_type',
                'attended',
                'publish_event_id',
                'eventmanage_id',
                'event_name'
            ])->get();

            Log::info('Fetched attendees count:', ['count' => $attendees->count()]);

            // Map through attendees to ensure event name is set
            $attendees = $attendees->map(function ($attendee) {
                try {
                    Log::info('Processing attendee:', [
                        'id' => $attendee->id,
                        'eventmanage_id' => $attendee->eventmanage_id,
                        'publish_event_id' => $attendee->publish_event_id,
                        'event_name' => $attendee->event_name
                    ]);

                    // Get event name from either relationship
                    $eventName = $attendee->event_name;
                    if (!$eventName && $attendee->eventManage) {
                        $eventName = $attendee->eventManage->event;
                        Log::info('Got event name from eventManage:', ['event_name' => $eventName]);
                    } elseif (!$eventName && $attendee->publishEvent && $attendee->publishEvent->event) {
                        $eventName = $attendee->publishEvent->event->event;
                        Log::info('Got event name from publishEvent:', ['event_name' => $eventName]);
                    }

                    return [
                        'id' => $attendee->id,
                        'first_name' => $attendee->first_name,
                        'middle_name' => $attendee->middle_name,
                        'last_name' => $attendee->last_name,
                        'barangay' => $attendee->barangay,
                        'attendee_type' => $attendee->attendee_type,
                        'attended' => $attendee->attended,
                        'publish_event_id' => $attendee->publish_event_id,
                        'eventmanage_id' => $attendee->eventmanage_id,
                        'event_name' => $eventName ?? 'Unknown Event'
                    ];
                } catch (\Exception $e) {
                    Log::error('Error processing attendee:', [
                        'attendee_id' => $attendee->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }
            });

            Log::info('Successfully processed all attendees');
            return response()->json($attendees);
        } catch (\Exception $e) {
            Log::error('Error in RegisteredAttendeeController@index:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'An error occurred while fetching registered attendees',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
