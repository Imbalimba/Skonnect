<?php

namespace App\Http\Controllers;

use App\Models\PublishEvent;
use App\Models\EventManage;
use App\Models\Profile;
use App\Models\EventAttendee;
use App\Models\ProfileVolunteer;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PublishEventController extends Controller
{
    /**
     * Display a listing of published events with barangay filtering
     */
    public function index(Request $request)
    {
        try {
            // Get query parameters
            $userId = $request->query('user_id');
            $userProfileId = $request->query('profile_id');
            $barangay = $request->query('barangay');

            Log::info('Fetching published events with params:', [
                'user_id' => $userId,
                'profile_id' => $userProfileId,
                'barangay' => $barangay
            ]);

            // Base query with relationships
            $query = PublishEvent::with([
                'event',
                'attendees.profile',
                'registeredAttendees'
            ]);

            // Apply barangay filter if provided and not 'All'
            if ($barangay && $barangay !== 'All') {
                try {
                    $query->where(function($q) use ($barangay) {
                        $q->where('barangay', $barangay)
                          ->orWhereHas('event', function($q) use ($barangay) {
                              $q->where('barangay', $barangay);
                          });
                    });
                } catch (\Exception $e) {
                    Log::error('Error applying barangay filter:', [
                        'barangay' => $barangay,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }
            }

            // User-specific filtering
            if ($userId || $userProfileId) {
                try {
                    // Check if user is a volunteer
                    $isVolunteer = false;

                    if ($userId) {
                        $volunteerRecord = ProfileVolunteer::where('account_id', $userId)
                            ->where('is_volunteer', 'yes')
                            ->first();
                        $isVolunteer = $volunteerRecord !== null;
                    } elseif ($userProfileId) {
                        $profile = Profile::find($userProfileId);
                        if ($profile) {
                            $volunteerRecord = ProfileVolunteer::where('account_id', $profile->account_id)
                                ->where('is_volunteer', 'yes')
                                ->first();
                            $isVolunteer = $volunteerRecord !== null;
                        }
                    }

                    // Show all events to all users
                    // The volunteer status will only affect registration, not visibility
                    Log::info('User volunteer status:', ['is_volunteer' => $isVolunteer]);
                } catch (\Exception $e) {
                    Log::error('Error checking volunteer status:', [
                        'user_id' => $userId,
                        'profile_id' => $userProfileId,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }
            }

            // Get the filtered results
            try {
                $publishedEvents = $query->get();
                Log::info('Successfully fetched published events', [
                    'count' => $publishedEvents->count()
                ]);

                // Transform the events to include counts and user registration status
                $events = $publishedEvents->map(function ($event) use ($userId) {
                    $participantsCount = $event->registeredAttendees()
                        ->where('attendee_type', 'participant')
                        ->count();
                    
                    $volunteersCount = $event->registeredAttendees()
                        ->where('attendee_type', 'volunteer')
                        ->count();

                    $isRegistered = false;
                    if ($userId) {
                        $isRegistered = $event->registeredAttendees()
                            ->where('account_id', $userId)
                            ->exists();
                    }

                    return [
                        'id' => $event->id,
                        'event' => $event->event,
                        'description' => $event->description,
                        'selected_tags' => $event->selected_tags,
                        'need_volunteers' => $event->need_volunteers,
                        'status' => $event->status,
                        'event_type' => $event->event_type,
                        'barangay' => $event->barangay,
                        'participants_count' => $participantsCount,
                        'volunteers_count' => $volunteersCount,
                        'isRegistered' => $isRegistered,
                    ];
                });

                return response()->json($events);
            } catch (\Exception $e) {
                Log::error('Error executing final query:', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Error in PublishEventController@index:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to fetch published events',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created published event in storage.
     */
    public function store(Request $request)
    {
        try {
            Log::info('Publishing event with data:', $request->all());

            $validator = Validator::make($request->all(), [
                'event_id' => 'required|exists:eventmanage,id',
                'selected_tags' => 'present|array',
                'filters' => 'present|array',
                'description' => 'nullable|string',
                'need_volunteers' => 'required|in:yes,no',
                'status' => 'sometimes|in:ongoing,upcoming,completed',
                'event_type' => 'sometimes|in:sk,youth',
                'barangay' => 'required|string'
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $existingPublish = PublishEvent::where('event_id', $request->event_id)->first();
            if ($existingPublish) {
                Log::warning('Event already published:', ['event_id' => $request->event_id]);
                return response()->json([
                    'error' => 'This event has already been published',
                    'published_event' => $existingPublish
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Create the published event
                $publishedEvent = PublishEvent::create([
                    'event_id' => $request->event_id,
                    'selected_tags' => $request->selected_tags,
                    'description' => $request->description ?? '',
                    'need_volunteers' => $request->need_volunteers,
                    'status' => $request->status ?? 'upcoming',
                    'event_type' => $request->event_type ?? 'sk',
                    'barangay' => $request->barangay
                ]);

                // Handle attendees creation
                if ($request->need_volunteers === 'yes') {
                    // Query for volunteers
                    $volunteers = Account::whereHas('volunteerProfile', function ($q) {
                        $q->where('is_volunteer', 'yes');
                    })->with(['profile', 'volunteerProfile'])->get();

                    foreach ($volunteers as $volunteer) {
                        if ($volunteer->profile) {
                            EventAttendee::create([
                                'publish_event_id' => $publishedEvent->id,
                                'profile_id' => $volunteer->profile->id,
                                'attendees_email' => $volunteer->email,
                                'status' => 'invited'
                            ]);
                        }
                    }
                } else {
                    // Handle non-volunteer attendees
                    $matchingProfiles = $this->findMatchingProfiles(
                        $request->selected_tags,
                        $request->filters,
                        $request->barangay
                    );

                    foreach ($matchingProfiles as $profile) {
                        EventAttendee::create([
                            'publish_event_id' => $publishedEvent->id,
                            'profile_id' => $profile->id,
                            'attendees_email' => $profile->email,
                            'status' => 'invited'
                        ]);
                    }
                }

                DB::commit();

                return response()->json([
                    'message' => 'Event published successfully',
                    'published_event' => $publishedEvent,
                    'attendees_count' => $publishedEvent->attendees()->count()
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error in transaction:', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Error publishing event:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to publish event',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified published event.
     */
    public function show($id)
    {
        try {
            $publishedEvent = PublishEvent::with(['event', 'attendees'])->findOrFail($id);
            return response()->json($publishedEvent);
        } catch (\Exception $e) {
            Log::error('Error retrieving published event: ' . $e->getMessage());
            return response()->json(['error' => 'Published event not found'], 404);
        }
    }

    /**
     * Update the specified published event in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'selected_tags' => 'required|array',
                'description' => 'nullable|string',
                'need_volunteers' => 'sometimes|in:yes,no',
                'barangay' => 'sometimes|string' // Add barangay update
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $publishedEvent = PublishEvent::findOrFail($id);

            $updateData = [
                'selected_tags' => $request->selected_tags,
                'description' => $request->description ?? $publishedEvent->description,
            ];

            // Update need_volunteers if provided
            if ($request->has('need_volunteers')) {
                $updateData['need_volunteers'] = $request->need_volunteers;
            }

            // Update barangay if provided
            if ($request->has('barangay')) {
                $updateData['barangay'] = $request->barangay;
            }

            $publishedEvent->update($updateData);

            return response()->json([
                'message' => 'Published event updated successfully',
                'published_event' => $publishedEvent
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating published event: ' . $e->getMessage());
            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json(['error' => 'Published event not found'], 404);
            }
            return response()->json(['error' => 'Failed to update published event'], 500);
        }
    }
    /**
     * Check if a user is eligible for an event
     * Enhanced to check for volunteer status
     */
    public function checkEventEligibility($publishEventId, $profileId)
    {
        try {
            // Fetch the published event
            $publishEvent = PublishEvent::findOrFail($publishEventId);

            // Check if the user is a volunteer
            $profile = Profile::find($profileId);
            if (!$profile) {
                return false;
            }

            $volunteerProfile = ProfileVolunteer::where('account_id', $profile->account_id)
                ->where('is_volunteer', 'yes')
                ->first();

            // If the event needs volunteers, only volunteers can register
            if ($publishEvent->need_volunteers === 'yes') {
                return (bool) $volunteerProfile;
            }

            // If the user is a volunteer, they can always register regardless of demographics
            if ($volunteerProfile) {
                return true;
            }

            // For non-volunteer events, check demographics as before
            // Get selected demographics for the event
            $eventDemographics = is_string($publishEvent->selected_tags)
                ? json_decode($publishEvent->selected_tags, true)
                : $publishEvent->selected_tags;

            // Validate input
            if (!is_array($eventDemographics)) {
                Log::warning('Invalid demographics format for event: ' . $publishEventId);
                return false;
            }

            // Check each demographic condition
            $isEligible = true;

            // Student-related checks
            if (in_array('Student', $eventDemographics)) {
                $isEligible = $isEligible && (
                    $profile->studying_level !== 'Not Studying' ||
                    !empty($profile->school_name)
                );
            }

            // Out of School Youth check
            if (in_array('Out of School Youth', $eventDemographics)) {
                $isEligible = $isEligible && (
                    $profile->studying_level === 'Not Studying' &&
                    empty($profile->school_name)
                );
            }

            // PWD (Persons with Disabilities) check
            if (in_array('PWD', $eventDemographics)) {
                $isEligible = $isEligible && $profile->pwd === 'Yes';
            }

            // Athlete check
            if (in_array('Athlete', $eventDemographics)) {
                $isEligible = $isEligible && $profile->athlete === 'Yes';
            }

            // Age group checks
            $age = $this->calculateAge($profile->dob);

            if (in_array('Child Youth(15-17 yrs old)', $eventDemographics)) {
                $isEligible = $isEligible && ($age >= 15 && $age <= 17);
            }

            if (in_array('Core Youth(18-24 yrs old)', $eventDemographics)) {
                $isEligible = $isEligible && ($age >= 18 && $age <= 24);
            }

            if (in_array('Young Adult(25-30 yrs old)', $eventDemographics)) {
                $isEligible = $isEligible && ($age >= 25 && $age <= 30);
            }

            // Gender check (if specified in demographics)
            if (in_array('Male', $eventDemographics)) {
                $isEligible = $isEligible && $profile->gender === 'male';
            }

            if (in_array('Female', $eventDemographics)) {
                $isEligible = $isEligible && $profile->gender === 'female';
            }

            // Civil status checks
            $civilStatusDemographics = array_intersect([
                'Single',
                'Married',
                'Divorced',
                'Widowed',
                'Separated'
            ], $eventDemographics);

            if (!empty($civilStatusDemographics)) {
                $isEligible = $isEligible && in_array($profile->civil_status, $civilStatusDemographics);
            }

            // Voter status checks
            if (in_array('SK Voter', $eventDemographics)) {
                $isEligible = $isEligible && $profile->sk_voter === 'Yes';
            }

            if (in_array('National Voter', $eventDemographics)) {
                $isEligible = $isEligible && $profile->national_voter === 'Yes';
            }

            // Educational background checks
            $educationDemographics = array_intersect([
                'Elementary Level',
                'Elementary Grad',
                'High School Level',
                'High School Grad',
                'Vocational Grad',
                'College Level',
                'College Grad',
                'Masters Level',
                'Masters Grad',
                'Doctorate Level',
                'Doctorate Grad'
            ], $eventDemographics);

            if (!empty($educationDemographics)) {
                $isEligible = $isEligible && in_array($profile->educational_background, $educationDemographics);
            }

            // Employment status checks
            $employmentDemographics = array_intersect([
                'Employed',
                'Unemployed',
                'Self Employed'
            ], $eventDemographics);

            if (!empty($employmentDemographics)) {
                $isEligible = $isEligible && in_array($profile->work_status, $employmentDemographics);
            }

            return $isEligible;
        } catch (\Exception $e) {
            Log::error('Error checking event eligibility: ' . $e->getMessage());
            return false;
        }
    }


    /**
     * Calculate age from date of birth
     *
     * @param string $dob Date of birth
     * @return int Calculated age
     */
    private function calculateAge($dob)
    {
        try {
            if (empty($dob)) {
                return 0;
            }
            $birthDate = new \DateTime($dob);
            $today = new \DateTime('today');
            return $birthDate->diff($today)->y;
        } catch (\Exception $e) {
            Log::error('Error calculating age: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count the profiles that match the selected demographics and filters.
     * Enhanced to include volunteer counting
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function countMatchingProfiles(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'demographics' => 'present|array',
                'filters' => 'present|array',
                'need_volunteers' => 'required|string|in:yes,no',
                'barangay' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // If event needs volunteers, count all volunteers
            if ($request->need_volunteers === 'yes') {
                $query = Account::whereHas('volunteerProfile', function ($q) {
                    $q->where('is_volunteer', 'yes');
                })->with('volunteerProfile');

                // Apply barangay filter if provided
                if ($request->barangay) {
                    $query->whereHas('profile', function ($q) use ($request) {
                        $q->where('barangay', $request->barangay);
                    });
                }

                $count = $query->count();
                return response()->json(['count' => $count]);
            }

            // Otherwise, count matching profiles based on demographics
            $matchingProfiles = $this->findMatchingProfiles($request->demographics, $request->filters, $request->barangay);

            return response()->json([
                'count' => count($matchingProfiles)
            ]);
        } catch (\Exception $e) {
            Log::error('Error counting matching profiles: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to count matching profiles: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified published event from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $publishedEvent = PublishEvent::findOrFail($id);

            // Begin transaction
            DB::beginTransaction();

            // Delete all attendees first
            $publishedEvent->attendees()->delete();

            // Delete the published event
            $publishedEvent->delete();

            // Commit transaction
            DB::commit();

            return response()->json([
                'message' => 'Published event deleted successfully'
            ]);
        } catch (\Exception $e) {
            // Rollback transaction
            DB::rollBack();

            Log::error('Error deleting published event: ' . $e->getMessage());

            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json(['error' => 'Published event not found'], 404);
            }

            return response()->json(['error' => 'Failed to delete published event'], 500);
        }
    }

    /**
     * Find profiles that match the selected demographics and filters.
     *
     * @param  array  $demographics
     * @param  array  $filters
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function findMatchingProfiles($demographics, $filters, $barangay = null)
    {
        $query = Profile::query();

        // Apply barangay filter if provided
        if ($barangay) {
            $query->where('barangay', $barangay);
        }

        // Process demographics tags
        if (in_array('Student', $demographics)) {
            $query->where(function ($q) {
                $q->where('studying_level', '!=', 'Not Studying')
                    ->orWhereNotNull('school_name');
            });
        }

        if (in_array('PWD', $demographics)) {
            $query->where('pwd', 'Yes');
        }

        if (in_array('Athlete', $demographics)) {
            $query->where('athlete', 'Yes');
        }

        // Process filters
        // Gender filter
        if (isset($filters['gender'])) {
            $genderFilters = [];

            if ($filters['gender']['male'] ?? false) {
                $genderFilters[] = 'Male';
            }

            if ($filters['gender']['female'] ?? false) {
                $genderFilters[] = 'Female';
            }

            if (!empty($genderFilters)) {
                $query->whereIn('gender', $genderFilters);
            }
        }

        // Age group filter
        if (isset($filters['ageGroup'])) {
            $query->where(function($q) use ($filters) {
                if ($filters['ageGroup']['child'] ?? false) {
                    $q->orWhereRaw('TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 15 AND 17');
                }
                if ($filters['ageGroup']['core'] ?? false) {
                    $q->orWhereRaw('TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 18 AND 24');
                }
                if ($filters['ageGroup']['young'] ?? false) {
                    $q->orWhereRaw('TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) BETWEEN 25 AND 30');
                }
            });
        }

        // Civil status filter
        if (isset($filters['civilStatus'])) {
            $civilStatusFilters = [];

            if ($filters['civilStatus']['single'] ?? false) {
                $civilStatusFilters[] = 'Single';
            }

            if ($filters['civilStatus']['married'] ?? false) {
                $civilStatusFilters[] = 'Married';
            }

            if ($filters['civilStatus']['widowed'] ?? false) {
                $civilStatusFilters[] = 'Widowed';
            }

            if ($filters['civilStatus']['divorced'] ?? false) {
                $civilStatusFilters[] = 'Divorced';
            }

            if ($filters['civilStatus']['separated'] ?? false) {
                $civilStatusFilters[] = 'Separated';
            }

            if (!empty($civilStatusFilters)) {
                $query->whereIn('civil_status', $civilStatusFilters);
            }
        }

        // Voter status filter
        if (isset($filters['voterStatus'])) {
            if ($filters['voterStatus']['skVoter'] ?? false) {
                $query->where('sk_voter', 'Yes');
            }

            if ($filters['voterStatus']['nationalVoter'] ?? false) {
                $query->where('national_voter', 'Yes');
            }
        }

        // Education filter
        if (isset($filters['education'])) {
            $educationFilters = [];

            if ($filters['education']['elementary'] ?? false) {
                $educationFilters[] = 'Elementary Level';
                $educationFilters[] = 'Elementary Grad';
            }

            if ($filters['education']['highSchool'] ?? false) {
                $educationFilters[] = 'High School Level';
                $educationFilters[] = 'High School Grad';
            }

            if ($filters['education']['vocational'] ?? false) {
                $educationFilters[] = 'Vocational Grad';
            }

            if ($filters['education']['college'] ?? false) {
                $educationFilters[] = 'College Level';
                $educationFilters[] = 'College Grad';
            }

            if ($filters['education']['masters'] ?? false) {
                $educationFilters[] = 'Masters Level';
                $educationFilters[] = 'Masters Grad';
            }

            if ($filters['education']['doctorate'] ?? false) {
                $educationFilters[] = 'Doctorate Level';
                $educationFilters[] = 'Doctorate Grad';
            }

            if (!empty($educationFilters)) {
                $query->whereIn('educational_background', $educationFilters);
            }
        }

        // Employment filter
        if (isset($filters['employment'])) {
            $employmentFilters = [];

            if ($filters['employment']['employed'] ?? false) {
                $employmentFilters[] = 'Employed';
            }

            if ($filters['employment']['unemployed'] ?? false) {
                $employmentFilters[] = 'Unemployed';
            }

            if ($filters['employment']['selfEmployed'] ?? false) {
                $employmentFilters[] = 'Self Employed';
            }

            if (!empty($employmentFilters)) {
                $query->whereIn('work_status', $employmentFilters);
            }
        }

        // Only return non-archived profiles
        $query->whereDoesntHave('archivedRecord');

        return $query->get();
    }
}
