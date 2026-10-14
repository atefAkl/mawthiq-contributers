<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all()->groupBy('category');

        return response()->json([
            'roles' => $roles,
            'permissions_by_category' => $permissions,
            'all_permissions' => Permission::all(),
        ]);
    }

    public function updatePermissions(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        if ($role->name === 'super_admin') {
            return response()->json([
                'message' => 'دور مدير النظام يمتلك كافة الصلاحيات بشكل افتراضي ولا يمكن تعديله.'
            ], 422);
        }

        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role->permissions()->sync($request->permission_ids);

        return response()->json([
            'message' => 'تم تحديث مصفوفة الصلاحيات للدور بنجاح.',
            'role' => $role->load('permissions'),
        ]);
    }
}
