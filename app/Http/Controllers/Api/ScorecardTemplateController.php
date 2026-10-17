<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScorecardTemplate;
use Illuminate\Http\Request;

class ScorecardTemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = ScorecardTemplate::with('creator:id,name,email')
            ->orderBy('created_at', 'desc');

        if ($request->filled('position')) {
            $query->where('position', 'like', '%' . $request->position . '%');
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%");
            });
        }

        $templates = $query->get();

        $stats = [
            'total' => ScorecardTemplate::count(),
            'active' => ScorecardTemplate::where('is_active', true)->count(),
            'total_questions' => ScorecardTemplate::all()->sum(function ($t) {
                return is_array($t->questions) ? count($t->questions) : 0;
            }),
            'avg_score' => round(ScorecardTemplate::where('is_active', true)->avg('total_max_score') ?? 100, 1),
        ];

        return response()->json([
            'data' => $templates,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'position' => 'nullable|string|max:255',
            'total_max_score' => 'nullable|numeric|min:1|max:1000',
            'questions' => 'required|array|min:1',
            'questions.*.id' => 'nullable|string',
            'questions.*.question' => 'required|string|max:500',
            'questions.*.category' => 'nullable|string|max:100',
            'questions.*.expected_answer' => 'nullable|string|max:5000',
            'questions.*.answer_weaknesses' => 'nullable|string|max:5000',
            'questions.*.max_score' => 'required|numeric|min:1|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        // Auto-calculate total_max_score from sum of question max_scores if not explicitly given or for accuracy
        $sumMaxScores = array_sum(array_column($validated['questions'], 'max_score'));
        $totalMaxScore = $sumMaxScores > 0 ? $sumMaxScores : ($validated['total_max_score'] ?? 100);

        // Ensure each question has a unique ID
        $formattedQuestions = array_map(function ($q, $index) {
            return [
                'id' => $q['id'] ?? ('q_' . ($index + 1) . '_' . time()),
                'question' => trim($q['question']),
                'category' => !empty($q['category']) ? trim($q['category']) : 'عام',
                'expected_answer' => $q['expected_answer'] ?? '',
                'answer_weaknesses' => $q['answer_weaknesses'] ?? '',
                'max_score' => (float)$q['max_score'],
            ];
        }, $validated['questions'], array_keys($validated['questions']));

        $template = ScorecardTemplate::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'position' => $validated['position'] ?? null,
            'total_max_score' => $totalMaxScore,
            'questions' => $formattedQuestions,
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => $request->user() ? $request->user()->id : null,
        ]);

        return response()->json([
            'message' => 'تم إنشاء كرت التقييم بنجاح.',
            'template' => $template->load('creator:id,name,email'),
        ], 201);
    }

    public function show($id)
    {
        $template = ScorecardTemplate::with(['creator:id,name,email', 'interviews'])->findOrFail($id);

        return response()->json([
            'template' => $template,
        ]);
    }

    public function update(Request $request, $id)
    {
        $template = ScorecardTemplate::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'position' => 'nullable|string|max:255',
            'total_max_score' => 'nullable|numeric|min:1|max:1000',
            'questions' => 'required|array|min:1',
            'questions.*.id' => 'nullable|string',
            'questions.*.question' => 'required|string|max:500',
            'questions.*.category' => 'nullable|string|max:100',
            'questions.*.expected_answer' => 'nullable|string|max:5000',
            'questions.*.answer_weaknesses' => 'nullable|string|max:5000',
            'questions.*.max_score' => 'required|numeric|min:1|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $sumMaxScores = array_sum(array_column($validated['questions'], 'max_score'));
        $totalMaxScore = $sumMaxScores > 0 ? $sumMaxScores : ($validated['total_max_score'] ?? 100);

        $formattedQuestions = array_map(function ($q, $index) {
            return [
                'id' => $q['id'] ?? ('q_' . ($index + 1) . '_' . time()),
                'question' => trim($q['question']),
                'category' => !empty($q['category']) ? trim($q['category']) : 'عام',
                'expected_answer' => $q['expected_answer'] ?? '',
                'answer_weaknesses' => $q['answer_weaknesses'] ?? '',
                'max_score' => (float)$q['max_score'],
            ];
        }, $validated['questions'], array_keys($validated['questions']));

        $template->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'position' => $validated['position'] ?? null,
            'total_max_score' => $totalMaxScore,
            'questions' => $formattedQuestions,
            'is_active' => $request->has('is_active') ? $validated['is_active'] : $template->is_active,
        ]);

        return response()->json([
            'message' => 'تم تحديث كرت التقييم بنجاح.',
            'template' => $template->load('creator:id,name,email'),
        ]);
    }

    public function destroy($id)
    {
        $template = ScorecardTemplate::findOrFail($id);
        
        // Detach from interviews if any
        $template->interviews()->update(['scorecard_template_id' => null]);
        
        $template->delete();

        return response()->json([
            'message' => 'تم حذف كرت التقييم بنجاح.',
        ]);
    }
}
