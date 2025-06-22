<?php

namespace App\Http\Controllers;

use App\Models\EventManage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class EventManageController extends Controller
{
    /**
     * Display a listing of the events.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        try {
            $events = EventManage::orderBy('timeframe', 'desc')->get();
            return response()->json($events);
        } catch (\Exception $e) {
            Log::error('Error fetching events: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch events'], 500);
        }
    }

    /**
     * Store a newly created event in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        try {
            Log::info('Attempting to create event with data:', $request->all());

            $validator = Validator::make($request->all(), [
                'event' => 'required|string|max:255',
                'timeframe' => 'required|date',
                'location' => 'required|string|max:255',
                'description' => 'required|string',
                'status' => 'required|in:upcoming,ongoing,completed',
                'barangay' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            try {
                $event = EventManage::create([
                    'event' => $request->event,
                    'timeframe' => $request->timeframe,
                    'location' => $request->location,
                    'description' => $request->description,
                    'status' => $request->status,
                    'barangay' => $request->barangay
                ]);

                Log::info('Event created successfully:', ['event' => $event->toArray()]);

                return response()->json([
                    'message' => 'Event created successfully',
                    'event' => $event
                ], 201);
            } catch (\Exception $e) {
                Log::error('Database error while creating event:', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'sql' => $e instanceof \Illuminate\Database\QueryException ? $e->getSql() : null,
                    'bindings' => $e instanceof \Illuminate\Database\QueryException ? $e->getBindings() : null
                ]);
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Error creating event:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to create event: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified event in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        // Validate the ID first
        if (!is_numeric($id)) {
            return response()->json(['error' => 'Invalid event ID'], 400);
        }

        $validated = $request->validate([
            'event' => 'required|string|max:255',
            'timeframe' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'required|string|in:upcoming,ongoing,completed',
            'barangay' => 'required|string|max:255'
        ]);

        try {
            $event = EventManage::findOrFail($id);
            $event->update($validated);

            return response()->json([
                'message' => 'Event updated successfully',
                'event' => $event
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating event: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update event: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $event = EventManage::findOrFail($id);
            $event->delete();

            return response()->json(['message' => 'Event deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting event: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete event'], 500);
        }
    }
}
