<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\Interview;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function getDashboardStats()
    {
        $total = Applicant::count();
        $applicantCount = Applicant::where('status', 'applicant')->count();
        $participantCount = Applicant::where('status', 'participant')->count();
        $probationCount = Applicant::where('status', 'probation')->count();
        $acceptedCount = Applicant::where('status', 'accepted')->count();
        $rejectedCount = Applicant::where('status', 'rejected')->count();

        $acceptanceRate = $total > 0 ? round(($acceptedCount / $total) * 100, 1) : 0;
        $rejectionRate = $total > 0 ? round(($rejectedCount / $total) * 100, 1) : 0;

        // Interview metrics
        $totalInterviews = Interview::count();
        $completedInterviews = Interview::where('status', 'completed')->count();
        $scheduledInterviews = Interview::where('status', 'scheduled')->count();
        $avgScore = Interview::where('status', 'completed')->avg('overall_score') ?? 0;

        // Applicants by Position
        $byPosition = Applicant::select('position', DB::raw('count(*) as count'), DB::raw("SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count"))
            ->groupBy('position')
            ->orderBy('count', 'desc')
            ->get();

        // Conversion Pipeline Funnel
        $funnel = [
            ['stage' => 'applicant', 'label_ar' => 'متقدم', 'label_en' => 'Applicant', 'count' => $total, 'color' => '#3b82f6'],
            ['stage' => 'participant', 'label_ar' => 'مشارك', 'label_en' => 'Participant', 'count' => $participantCount + $probationCount + $acceptedCount, 'color' => '#6366f1'],
            ['stage' => 'probation', 'label_ar' => 'تحت الاختبار', 'label_en' => 'Probation', 'count' => $probationCount + $acceptedCount, 'color' => '#f59e0b'],
            ['stage' => 'accepted', 'label_ar' => 'مقبول', 'label_en' => 'Accepted', 'count' => $acceptedCount, 'color' => '#10b981'],
        ];

        // Monthly trends (last 6 months)
        $trends = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();
            $label = $monthStart->translatedFormat('F Y');

            $trends[] = [
                'month' => $label,
                'total' => Applicant::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
                'accepted' => Applicant::where('status', 'accepted')->whereBetween('created_at', [$monthStart, $monthEnd])->count(),
                'interviews' => Interview::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
            ];
        }

        // Recent 5 applicants
        $recentApplicants = Applicant::latest()->take(5)->get();

        // Upcoming interviews
        $upcomingInterviews = Interview::with(['applicant', 'interviewer'])
            ->where('status', 'scheduled')
            ->where('scheduled_at', '>=', Carbon::now())
            ->orderBy('scheduled_at', 'asc')
            ->take(5)
            ->get();

        return response()->json([
            'overview' => [
                'total_applicants' => $total,
                'applicant_count' => $applicantCount,
                'participant_count' => $participantCount,
                'probation_count' => $probationCount,
                'accepted_count' => $acceptedCount,
                'rejected_count' => $rejectedCount,
                'acceptance_rate' => $acceptanceRate,
                'rejection_rate' => $rejectionRate,
                'total_interviews' => $totalInterviews,
                'completed_interviews' => $completedInterviews,
                'scheduled_interviews' => $scheduledInterviews,
                'avg_interview_score' => round($avgScore, 1),
            ],
            'funnel' => $funnel,
            'by_position' => $byPosition,
            'trends' => $trends,
            'recent_applicants' => $recentApplicants,
            'upcoming_interviews' => $upcomingInterviews,
        ]);
    }
}
