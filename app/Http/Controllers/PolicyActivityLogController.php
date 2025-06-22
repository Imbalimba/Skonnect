<?php

namespace App\Http\Controllers;

use App\Models\PolicyActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PolicyActivityLogController extends Controller
{
    /**
     * Log a policy activity
     *
     * @param int $policyId
     * @param string $activityType
     * @param string $action
     * @param array|null $details
     * @return PolicyActivityLog
     */
    public static function logActivity($policyId, $activityType, $action, $details = null)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            throw new \Exception('No authenticated SK user found');
        }

        $log = new PolicyActivityLog();
        $log->sk_account_id = $skUser->id;
        $log->policy_id = $policyId;
        $log->activity_type = $activityType;
        $log->action = $action;
        $log->details = $details ? json_encode($details) : null;
        $log->save();

        return $log;
    }

    /**
     * Get activity logs for a policy
     *
     * @param Request $request
     * @param int $policyId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPolicyLogs(Request $request, $policyId)
    {
        $logs = PolicyActivityLog::with(['skAccount'])
            ->where('policy_id', $policyId)
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
            $query = DB::table('policy_activity_logs')
                ->join('skaccounts', 'policy_activity_logs.sk_account_id', '=', 'skaccounts.id')
                ->leftJoin('policies', 'policy_activity_logs.policy_id', '=', 'policies.id')
                ->select(
                    'policy_activity_logs.*',
                    'skaccounts.first_name as sk_first_name',
                    'skaccounts.last_name as sk_last_name',
                    'skaccounts.sk_role as sk_role',
                    'skaccounts.sk_station as sk_barangay',
                    'policies.title as policy_title',
                    'policies.category as policy_category'
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