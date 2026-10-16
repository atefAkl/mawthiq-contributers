import React, { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import IconButton from '../components/IconButton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function ProfilePage({ currentRoute, navigate }) {
    const { t, lang, setLang } = useLanguage();
    const { user, updateProfileState } = useAuth();
    const { showToast } = useToast();

    // Profile Info State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [locale, setLocale] = useState(user?.locale || lang || 'ar');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        setUpdatingProfile(true);

        try {
            const res = await api.post('/auth/profile', {
                name,
                email,
                phone,
                locale,
            });
            updateProfileState(res.user);
            setLang(locale);
            showToast('تم تحديث بيانات الملف الشخصي بنجاح!', 'success');
        } catch (err) {
            showToast(err.message || 'فشل تحديث البيانات.', 'error');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== newPasswordConfirmation) {
            showToast('كلمتا المرور غير متطابقتين.', 'error');
            return;
        }

        setChangingPassword(true);
        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirmation,
            });
            showToast('تم تغيير كلمة المرور بنجاح!', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirmation('');
        } catch (err) {
            showToast(err.message || 'فشل تغيير كلمة المرور.', 'error');
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6 max-w-3xl">
                {/* Standardized Page Header Box */}
                <PageHeader
                    title={t('myProfile')}
                    subtitle={t('profileSubtitle')}
                    icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                >
                    <IconButton
                        variant="primary"
                        onClick={handleUpdateProfile}
                        disabled={updatingProfile}
                        tooltip={updatingProfile ? t('saving') : t('saveProfile')}
                        icon="M5 13l4 4L19 7"
                    />
                </PageHeader>

                {/* Account Summary Banner */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-indigo-100">
                        {user?.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-slate-800">{user?.name}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {lang === 'en' ? (user?.role?.display_name_en || user?.role?.name) : (user?.role?.display_name_ar || user?.role?.name || 'مدير')}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {t('activeAccount')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form 1: Profile Information */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                    <h3 className="font-bold text-sm text-slate-800 pb-3 border-b border-slate-100 mb-5">
                        👤 {t('myProfile')}
                    </h3>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')} *</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('preferredLanguage')}</label>
                                <select
                                    value={locale}
                                    onChange={e => setLocale(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="ar">العربية (Arabic)</option>
                                    <option value="en">English (الإنجليزية)</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={updatingProfile}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                            >
                                {updatingProfile ? 'جاري الحفظ...' : t('save')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Form 2: Change Password */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                    <h3 className="font-bold text-sm text-slate-800 pb-3 border-b border-slate-100 mb-5">
                        🔑 {t('changePassword')}
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{t('currentPassword')} *</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('newPassword')} *</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('confirmPassword')} *</label>
                                <input
                                    type="password"
                                    required
                                    value={newPasswordConfirmation}
                                    onChange={e => setNewPasswordConfirmation(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={changingPassword}
                                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all disabled:opacity-50"
                            >
                                {changingPassword ? 'جاري التغيير...' : t('changePassword')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
