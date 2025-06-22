<?php

namespace App\Http\Controllers;

use App\Models\SkUserLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SkUserLogController extends Controller
{
    /**
     * Log a user action
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sk_account_id' => 'nullable|exists:skaccounts,id',
            'action' => 'required|string',
            'description' => 'nullable|string',
            'page' => 'nullable|string',
        ]);

        // Add IP address and user agent
        $validated['ip_address'] = $request->ip();
        $validated['user_agent'] = $request->userAgent();

        $log = SkUserLog::create($validated);

        return response()->json([
            'success' => true,
            'log' => $log
        ]);
    }

    /**
     * Get logs with filtering
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = SkUserLog::with('skaccount');

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('sk_account_id', $request->user_id);
        }

        // Filter by action
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('page', 'like', "%{$search}%")
                  ->orWhereHas('skaccount', function($subq) use ($search) {
                      $subq->where('first_name', 'like', "%{$search}%")
                           ->orWhere('last_name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Order by latest first
        $query->orderBy('created_at', 'desc');

        // Paginate results
        $perPage = $request->input('per_page', 15);
        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'logs' => $logs
        ]);
    }

    /**
     * Get activity summary for dashboard
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function summary()
    {
        $today = now()->startOfDay();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();

        $summary = [
            'today' => SkUserLog::whereDate('created_at', '>=', $today)->count(),
            'this_week' => SkUserLog::whereDate('created_at', '>=', $thisWeek)->count(),
            'this_month' => SkUserLog::whereDate('created_at', '>=', $thisMonth)->count(),
            'total' => SkUserLog::count(),
            'top_actions' => SkUserLog::selectRaw('action, count(*) as count')
                ->groupBy('action')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get(),
            'recent_activities' => SkUserLog::with('skaccount')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
        ];

        return response()->json([
            'success' => true,
            'summary' => $summary
        ]);
    }
}