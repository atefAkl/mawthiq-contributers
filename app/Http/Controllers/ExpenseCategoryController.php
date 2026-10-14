<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Http\Requests\StoreExpenseCategoryRequest;
use App\Http\Requests\UpdateExpenseCategoryRequest;

class ExpenseCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(\App\Models\ExpenseCategory::all());
    }

    public function store(StoreExpenseCategoryRequest $request)
    {
        $category = \App\Models\ExpenseCategory::create(
            array_merge($request->validated(), ['created_by' => auth()->id() ?? 1])
        );

        return response()->json($category, 201);
    }

    public function show(\App\Models\ExpenseCategory $expenseCategory)
    {
        return response()->json($expenseCategory);
    }

    public function update(UpdateExpenseCategoryRequest $request, \App\Models\ExpenseCategory $expenseCategory)
    {
        $expenseCategory->update($request->validated());
        return response()->json($expenseCategory);
    }

    public function destroy(\App\Models\ExpenseCategory $expenseCategory)
    {
        $expenseCategory->delete();
        return response()->json(null, 204);
    }
}
