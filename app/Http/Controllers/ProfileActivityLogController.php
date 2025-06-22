<?php

namespace App\Http\Controllers;

use App\Models\ProfileActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProfileActivityLogController extends Controller
{
    /**
     * Log a profile activity
     *
     * @param int $profileId
     * @param string $activityType
     * @param string $action
     * @param array|null $details
     * @return ProfileActivityLog
     */
    public static function logActivity($profileId, $activityType, $action, $details = null)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            throw new \Exception('No authenticated SK user found');
        }

        $log = new ProfileActivityLog();
        $log->sk_account_id = $skUser->id;
        $log->profile_id = $profileId;
        $log->activity_type = $activityType;
        $log->action = $action;
        $log->details = $details ? json_encode($details) : null;
        $log->save();

        return $log;
    }

    /**
     * Get activity logs for a profile
     *
     * @param Request $request
     * @param int $profileId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProfileLogs(Request $request, $profileId)
    {
        $logs = ProfileActivityLog::with(['skAccount'])
            ->where('profile_id', $profileId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'logs' => $logs
        ]);
    }

    /**
     * Get all activity logs with optional filtering
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllLogs(Request $request)
    {
        try {
            $query = DB::table('profile_activity_logs')
                ->join('skaccounts', 'profile_activity_logs.sk_account_id', '=', 'skaccounts.id')
                ->leftJoin('profiles', 'profile_activity_logs.profile_id', '=', 'profiles.id')
                ->select(
                    'profile_activity_logs.*',
                    'skaccounts.first_name as sk_first_name',
                    'skaccounts.last_name as sk_last_name',
                    'skaccounts.sk_role as sk_role',
                    'skaccounts.sk_station as sk_barangay',
                    'profiles.first_name as profile_first_name',
                    'profiles.last_name as profile_last_name',
                    'profiles.barangay as profile_barangay'
                );

            // Only Federasyon can see all logs, others see only their barangay
            $skUser = session('sk_user');
            if ($skUser && $skUser->sk_role !== 'Federasyon') {
                $query->where('skaccounts.sk_station', $skUser->sk_station);
            }

            // Filter by barangay if provided (for Federasyon)
            if ($skUser && $skUser->sk_role === 'Federasyon' && $request->has('barangay') && $request->barangay !== 'all') {
                $query->whereRaw('LOWER(TRIM(profiles.barangay)) = ?', [strtolower(trim($request->barangay))]);
            }

            // Filter by activity type if provided
            if ($request->has('activity_type')) {
                $query->where('activity_type', $request->activity_type);
            }

            // Filter by date range if provided
            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            // Filter by SK account if provided
            if ($request->has('sk_account_id')) {
                $query->where('sk_account_id', $request->sk_account_id);
            }

            // Get total count before pagination
            $total = $query->count();

            // Apply pagination
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);
            $logs = $query->orderBy('created_at', 'desc')
                         ->skip(($page - 1) * $perPage)
                         ->take($perPage)
                         ->get();

            // Decode details for each log
            $logs->transform(function ($log) {
                if (isset($log->details) && is_string($log->details)) {
                    $decoded = json_decode($log->details, true);
                    $log->details = $decoded ?: $log->details;
                }
                return $log;
            });

            return response()->json([
                'success' => true,
                'logs' => [
                    'data' => $logs,
                    'total' => $total,
                    'per_page' => $perPage,
                    'current_page' => $page,
                    'last_page' => ceil($total / $perPage)
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching activity logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 