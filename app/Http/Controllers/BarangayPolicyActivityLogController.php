<?php

namespace App\Http\Controllers;

use App\Models\BarangayPolicyActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BarangayPolicyActivityLogController extends Controller
{
    /**
     * Log a barangay policy activity
     *
     * @param int $barangayPolicyId
     * @param string $activityType
     * @param string $action
     * @param array|null $details
     * @return BarangayPolicyActivityLog
     */
    public static function logActivity($barangayPolicyId, $activityType, $action, $details = null)
    {
        $skUser = session('sk_user');
        
        if (!$skUser) {
            throw new \Exception('No authenticated SK user found');
        }

        $log = new BarangayPolicyActivityLog();
        $log->sk_account_id = $skUser->id;
        $log->barangay_policy_id = $barangayPolicyId;
        $log->activity_type = $activityType;
        $log->action = $action;
        $log->details = $details;
        $log->save();

        return $log;
    }

    /**
     * Get activity logs for a barangay policy
     *
     * @param Request $request
     * @param int $barangayPolicyId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBarangayPolicyLogs(Request $request, $barangayPolicyId)
    {
        $logs = BarangayPolicyActivityLog::with(['skAccount'])
            ->where('barangay_policy_id', $barangayPolicyId)
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
            $query = DB::table('barangay_policy_activity_logs')
                ->join('skaccounts', 'barangay_policy_activity_logs.sk_account_id', '=', 'skaccounts.id')
                ->leftJoin('barangay_policies', 'barangay_policy_activity_logs.barangay_policy_id', '=', 'barangay_policies.id')
                ->select(
                    'barangay_policy_activity_logs.*',
                    'skaccounts.first_name as sk_first_name',
                    'skaccounts.last_name as sk_last_name',
                    'skaccounts.sk_role as sk_role',
                    'skaccounts.sk_station as sk_barangay',
                    'barangay_policies.barangay as policy_barangay'
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

            // For Federasyon, allow filtering by any barangay using the dropdown
            if ($skUser && $skUser->sk_role === 'Federasyon' && $request->has('barangay') && $request->barangay !== 'all') {
                $query->whereRaw('LOWER(TRIM(barangay_policies.barangay)) = ?', [strtolower(trim($request->barangay))]);
            }

            // For non-Federasyon, only show logs for their own barangay (using sk_station)
            if ($skUser && $skUser->sk_role !== 'Federasyon') {
                $query->where('barangay_policies.barangay', $skUser->sk_station);
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