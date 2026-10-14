<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Category;
use App\Models\User;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Resources\ExpenseResource;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::with('category', 'recorder', 'relatedParty')
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Expenses/Index', [
            'expenses' => ExpenseResource::collection($expenses)
        ]);
    }

    public function create()
    {
        return Inertia::render('Expenses/Create', [
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'employees' => User::orderBy('name')->get(['id', 'name']),
            'relatedParties' => \App\Models\RelatedParty::all(),
        ]);
    }

    public function store(StoreExpenseRequest $request)
    {
        $expense = Expense::create($request->validated());

        return redirect()->route('expenses.index')
            ->with('success', 'Expense created successfully.');
    }

    public function show(Expense $expense)
    {
        $expense->load(['category', 'recorder', 'relatedParty']);

        return Inertia::render('Expenses/Show', [
            'expense' => new ExpenseResource($expense)
        ]);
    }
}
