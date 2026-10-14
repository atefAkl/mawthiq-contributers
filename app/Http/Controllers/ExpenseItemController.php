<?php

namespace App\Http\Controllers;

use App\Models\ExpenseItem;
use App\Http\Requests\StoreExpenseItemRequest;
use App\Http\Requests\UpdateExpenseItemRequest;

class ExpenseItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(\App\Models\ExpenseItem::all());
    }

    public function store(StoreExpenseItemRequest $request)
    {
        $item = \App\Models\ExpenseItem::create(
            array_merge($request->validated(), ['created_by' => auth()->id() ?? 1])
        );

        return response()->json($item, 201);
    }

    public function show(\App\Models\ExpenseItem $expenseItem)
    {
        return response()->json($expenseItem);
    }

    public function update(UpdateExpenseItemRequest $request, \App\Models\ExpenseItem $expenseItem)
    {
        $expenseItem->update($request->validated());
        return response()->json($expenseItem);
    }

    public function destroy(\App\Models\ExpenseItem $expenseItem)
    {
        $expenseItem->delete();
        return response()->json(null, 204);
    }
}
