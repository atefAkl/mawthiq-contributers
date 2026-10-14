<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;

class AccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(\App\Models\Account::all());
    }

    public function store(StoreAccountRequest $request)
    {
        $account = \App\Models\Account::create(
            array_merge($request->validated(), ['created_by' => auth()->id() ?? 1])
        );

        return response()->json($account, 201);
    }

    public function show(\App\Models\Account $account)
    {
        return response()->json($account);
    }

    public function update(UpdateAccountRequest $request, \App\Models\Account $account)
    {
        $account->update($request->validated());
        return response()->json($account);
    }

    public function destroy(\App\Models\Account $account)
    {
        $account->delete();
        return response()->json(null, 204);
    }
}
