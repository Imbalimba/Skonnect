<?php

namespace App\Http\Controllers;

use App\Models\AnnouncementActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AnnouncementActivityLogController extends Controller
{
    /**
     * Log an announcement activity
     *
     * @param int $announcementId
     * @param string $activityType
     * @param string $action
     * @param array|null $details
     * @return AnnouncementActivityLog
     */
    public static function logActivity($announcementId, $activityType, $action, $details = null)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            throw new \Exception('No authenticated SK user found');
        }

        $log = new AnnouncementActivityLog();
        $log->sk_account_id = $skUser->id;
        $log->announcement_id = $announcementId;
        $log->activity_type = $activityType;
        $log->action = $action;
        $log->details = $details ? json_encode($details) : null;
        $log->save();

        return $log;
    }

    /**
     * Get activity logs for an announcement
     *
     * @param Request $request
     * @param int $announcementId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAnnouncementLogs(Request $request, $announcementId)
    {
        $logs = AnnouncementActivityLog::with(['skAccount'])
            ->where('announcement_id', $announcementId)
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
            $query = DB::table('announcement_activity_logs')
                ->join('skaccounts', 'announcement_activity_logs.sk_account_id', '=', 'skaccounts.id')
                ->join('announcements', 'announcement_activity_logs.announcement_id', '=', 'announcements.id')
                ->select(
                    'announcement_activity_logs.*',
                    'skaccounts.first_name as sk_first_name',
                    'skaccounts.last_name as sk_last_name',
                    'skaccounts.sk_role as sk_role',
                    'skaccounts.sk_station as sk_barangay',
                    'announcements.title as announcement_title',
                    'announcements.barangay as announcement_barangay'
                );

            // Only Federasyon can see all logs, others see only their barangay
            $skUser = session('sk_user');
            if ($skUser && $skUser->sk_role !== 'Federasyon') {
                $query->where('skaccounts.sk_station', $skUser->sk_station);
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