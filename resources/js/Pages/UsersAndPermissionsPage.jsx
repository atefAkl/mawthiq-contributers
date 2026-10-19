import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import IconButton from '../components/IconButton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { formatRiyadhDate } from '../utils/date';

export default function UsersAndPermissionsPage({ currentRoute, navigate }) {
    const { t, isRtl } = useLanguage();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'roles'
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissionsByCategory, setPermissionsByCategory] = useState({});
    const [loading, setLoading] = useState(true);

    // User Create/Edit Modal
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '',
        role_id: 2,
        phone: '',
        status: 'active',
    });

    // Role Permissions State
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
    const [savingPermissions, setSavingPermissions] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/roles'),
            ]);
            setUsers(usersRes.users || []);
            setRoles(rolesRes.roles || []);
            setPermissionsByCategory(rolesRes.permissions_by_category || {});

            if (rolesRes.roles?.length > 0 && !selectedRole) {
                const nonAdminRole = rolesRes.roles.find(r => r.name !== 'super_admin') || rolesRes.roles[0];
                setSelectedRole(nonAdminRole);
                setSelectedPermissionIds(nonAdminRole.permissions?.map(p => p.id) || []);
            }
        } catch (e) {
            showToast('فشل تحميل المستخدمين والصلاحيات.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openCreateUserModal = () => {
        setEditingUser(null);
        setUserForm({
            name: '',
            email: '',
            password: '',
            role_id: roles[0]?.id || 1,
            phone: '',
            status: 'active',
        });
        setUserModalOpen(true);
    };

    const openEditUserModal = (u) => {
        setEditingUser(u);
        setUserForm({
            name: u.name,
            email: u.email,
            password: '',
            role_id: u.role_id || (roles[0]?.id || 1),
            phone: u.phone || '',
            status: u.status || 'active',
        });
        setUserModalOpen(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, userForm);
                showToast('تم تحديث بيانات المستخدم بنجاح!', 'success');
            } else {
                await api.post('/users', userForm);
                showToast('تم إنشاء المستخدم الجديد بنجاح!', 'success');
            }
            setUserModalOpen(false);
            loadData();
        } catch (err) {
            showToast(err.message || 'فشل حفظ بيانات المستخدم.', 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            await api.delete(`/users/${id}`);
            showToast('تم حذف المستخدم بنجاح.', 'success');
            loadData();
        } catch (err) {
            showToast(err.message || 'تعذر حذف المستخدم.', 'error');
        }
    };

    const handleSelectRole = (r) => {
        setSelectedRole(r);
        setSelectedPermissionIds(r.permissions?.map(p => p.id) || []);
    };

    const togglePermission = (permId) => {
        if (selectedRole?.name === 'super_admin') return;
        setSelectedPermissionIds(prev =>
            prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
        );
    };

    const handleSaveRolePermissions = async () => {
        if (!selectedRole) return;
        setSavingPermissions(true);
        try {
            await api.put(`/roles/${selectedRole.id}/permissions`, {
                permission_ids: selectedPermissionIds,
            });
            showToast(`تم حفظ صلاحيات دور (${selectedRole.display_name_ar}) بنجاح!`, 'success');
            loadData();
        } catch (err) {
            showToast(err.message || 'فشل تحديث الصلاحيات.', 'error');
        } finally {
            setSavingPermissions(false);
        }
    };

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6">
                {/* Standardized Page Header Box */}
                <PageHeader
                    title={t('usersAndRoles')}
                    subtitle={t('usersSubtitle')}
                    icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                >
                    {/* Sub-Tab: Users */}
                    <IconButton
                        variant={activeTab === 'users' ? 'active' : 'secondary'}
                        onClick={() => setActiveTab('users')}
                        tooltip={`${t('manageUsers')} (${users.length})`}
                        icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />

                    {/* Sub-Tab: Roles & Permissions Matrix */}
                    <IconButton
                        variant={activeTab === 'roles' ? 'active' : 'secondary'}
                        onClick={() => setActiveTab('roles')}
                        tooltip={`${t('permissionsMatrix')} (${roles.length})`}
                        icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />

                    {/* Refresh */}
                    <IconButton
                        onClick={loadData}
                        tooltip={t('refresh')}
                        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />

                    {/* Primary Action: Add User or Save Role Permissions */}
                    {activeTab === 'users' && (
                        <IconButton
                            variant="primary"
                            onClick={openCreateUserModal}
                            tooltip={t('addUser')}
                            icon="M12 4v16m8-8H4"
                        />
                    )}
                    {activeTab === 'roles' && selectedRole?.name !== 'super_admin' && (
                        <IconButton
                            variant="primary"
                            onClick={handleSaveRolePermissions}
                            disabled={savingPermissions}
                            tooltip={savingPermissions ? t('saving') : t('save')}
                            icon="M5 13l4 4L19 7"
                        />
                    )}
                </PageHeader>

                {/* 4 KPI Metrics Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">{t('manageUsers')}</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900">{users.length}</span>
                            <span className="text-xs text-slate-400 font-semibold">{t('status_all')}</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">{t('active')}</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-blue-600">{users.filter(u => u.status === 'active').length}</span>
                            <span className="text-xs text-emerald-600 font-bold">نشط</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">{t('permissionsMatrix')}</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-slate-900">{roles.length}</span>
                            <span className="text-xs text-slate-400 font-semibold">أدوار</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">{t('role')}</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-lg font-black text-blue-600 truncate">{selectedRole?.display_name_ar || '—'}</span>
                            <span className="text-xs text-slate-400 font-semibold">محدد</span>
                        </div>
                    </div>
                </div>

                {/* Tab 1: Users Table */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-start text-xs text-slate-700">
                                <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3.5 text-start">الاسم والبريد</th>
                                        <th className="px-5 py-3.5 text-start">الدور الوظيفي</th>
                                        <th className="px-5 py-3.5 text-start">الهاتف</th>
                                        <th className="px-5 py-3.5 text-start">الحالة</th>
                                        <th className="px-5 py-3.5 text-start">تاريخ الإنشاء</th>
                                        <th className="px-5 py-3.5 text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900">{u.name}</div>
                                                <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                    {u.role?.display_name_ar || u.role?.name || 'مستخدم'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-slate-600">
                                                {u.phone || '—'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {u.status === 'active' ? t('active') : t('inactive')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                                                {formatRiyadhDate(u.created_at, isRtl, { dateStyle: 'medium' })}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="inline-flex items-center gap-1">
                                                    <IconButton
                                                        size="sm"
                                                        variant="ghost"
                                                        tooltipPosition="top"
                                                        onClick={() => openEditUserModal(u)}
                                                        tooltip={t('edit')}
                                                        icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                    {u.id !== currentUser?.id && (
                                                        <IconButton
                                                            size="sm"
                                                            variant="danger"
                                                            tooltipPosition="top"
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            tooltip={t('delete')}
                                                            icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 2: RBAC Roles and Permissions Matrix */}
                {activeTab === 'roles' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Roles Selection Column */}
                        <div className="lg:col-span-1 space-y-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">الأدوار المتاحة</h3>
                            {roles.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => handleSelectRole(r)}
                                    className={`w-full p-4 rounded-2xl border text-start transition-all ${
                                        selectedRole?.id === r.id
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="font-bold text-xs">{r.display_name_ar}</div>
                                    <div className={`text-[11px] mt-0.5 ${selectedRole?.id === r.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {r.display_name_en}
                                    </div>
                                    <div className={`text-[10px] mt-2 line-clamp-2 ${selectedRole?.id === r.id ? 'text-blue-200' : 'text-slate-500'}`}>
                                        {r.description}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Permissions Matrix Column */}
                        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                                <div>
                                    <h3 className="font-black text-sm text-slate-800">
                                        صلاحيات: {selectedRole?.display_name_ar}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {selectedRole?.name === 'super_admin'
                                            ? 'يمتلك مدير النظام كافة الصلاحيات بدون قيود افتراضياً.'
                                            : 'حدد الصلاحيات المصرح لهذا الدور بالوصول إليها:'}
                                    </p>
                                </div>

                                {selectedRole?.name !== 'super_admin' && (
                                    <IconButton
                                        variant="primary"
                                        onClick={handleSaveRolePermissions}
                                        disabled={savingPermissions}
                                        tooltip={savingPermissions ? 'جاري الحفظ...' : t('save')}
                                        icon="M5 13l4 4L19 7"
                                    />
                                )}
                            </div>

                            {/* Permissions Groups */}
                            <div className="space-y-6">
                                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                    <div key={category} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
                                            {category === 'applicants' ? '📄 إدارة المتقدمين والمراحل' :
                                             category === 'interviews' ? '📅 المقابلات الشخصية والتقييم' :
                                             category === 'reports' ? '📊 التقارير والإحصائيات' :
                                             category === 'emails' ? '✉️ المراسلات والبريد' :
                                             category === 'users' ? '👥 المستخدمون والأدوار' : '⚙️ إعدادات النظام'}
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {perms.map(p => {
                                                const checked = selectedRole?.name === 'super_admin' || selectedPermissionIds.includes(p.id);
                                                return (
                                                    <label
                                                        key={p.id}
                                                        className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                            checked
                                                                ? 'bg-white border-blue-300 text-slate-900 shadow-xs'
                                                                : 'bg-transparent border-transparent text-slate-500 hover:bg-white/60'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            disabled={selectedRole?.name === 'super_admin'}
                                                            checked={checked}
                                                            onChange={() => togglePermission(p.id)}
                                                            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                                        />
                                                        <div>
                                                            <span className="font-bold text-xs block">{p.display_name_ar}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">{p.name}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Create / Edit User */}
            {userModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                {editingUser ? 'تعديل بيانات المستخدم' : t('addUser')}
                            </h3>
                            <button
                                onClick={() => setUserModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={userForm.name}
                                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')} *</label>
                                <input
                                    type="email"
                                    required
                                    value={userForm.email}
                                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('password')} {editingUser && '(اتركه فارغاً إذا لم ترغب بالتغيير)'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={userForm.password}
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('role')} *</label>
                                <select
                                    value={userForm.role_id}
                                    onChange={e => setUserForm({ ...userForm, role_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.display_name_ar} ({r.name})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
                                <input
                                    type="tel"
                                    value={userForm.phone}
                                    onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('userStatus')}</label>
                                <select
                                    value={userForm.status}
                                    onChange={e => setUserForm({ ...userForm, status: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="active">{t('active')}</option>
                                    <option value="inactive">{t('inactive')}</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setUserModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-100"
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
