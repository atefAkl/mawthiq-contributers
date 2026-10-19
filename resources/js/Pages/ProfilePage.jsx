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

    // Working Hours for Interviews State
    const initialWorkingHours = Array.isArray(user?.working_hours) && user.working_hours.length > 0
        ? user.working_hours
        : [
            {
                days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                all_day: false,
                from: '09:00',
                to: '17:00',
            }
        ];
    const [workingHours, setWorkingHours] = useState(initialWorkingHours);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const daysList = [
        { key: 'Sunday', label: t('daySunday') },
        { key: 'Monday', label: t('dayMonday') },
        { key: 'Tuesday', label: t('dayTuesday') },
        { key: 'Wednesday', label: t('dayWednesday') },
        { key: 'Thursday', label: t('dayThursday') },
        { key: 'Friday', label: t('dayFriday') },
        { key: 'Saturday', label: t('daySaturday') },
    ];

    const handleAddRule = () => {
        setWorkingHours([
            ...workingHours,
            {
                days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                all_day: false,
                from: '09:00',
                to: '17:00',
            }
        ]);
    };

    const handleRemoveRule = (index) => {
        setWorkingHours(workingHours.filter((_, i) => i !== index));
    };

    const handleToggleRuleDay = (ruleIndex, dayKey) => {
        setWorkingHours(workingHours.map((rule, idx) => {
            if (idx !== ruleIndex) return rule;
            const days = rule.days || [];
            const nextDays = days.includes(dayKey)
                ? days.filter(d => d !== dayKey)
                : [...days, dayKey];
            return { ...rule, days: nextDays };
        }));
    };

    const handleToggleAllDays = (ruleIndex) => {
        setWorkingHours(workingHours.map((rule, idx) => {
            if (idx !== ruleIndex) return rule;
            const allKeys = daysList.map(d => d.key);
            const isAll = (rule.days || []).length === allKeys.length;
            return { ...rule, days: isAll ? [] : allKeys };
        }));
    };

    const handleUpdateRuleField = (ruleIndex, field, value) => {
        setWorkingHours(workingHours.map((rule, idx) => {
            if (idx !== ruleIndex) return rule;
            return { ...rule, [field]: value };
        }));
    };

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        setUpdatingProfile(true);

        try {
            const res = await api.post('/auth/profile', {
                name,
                email,
                phone,
                locale,
                working_hours: workingHours,
            });
            updateProfileState(res.user);
            setLang(locale);
            showToast('تم تحديث بيانات الملف الشخصي وأوقات الدوام بنجاح!', 'success');
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
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
                        {user?.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div>
                        <h3 className="font-black text-base text-slate-900">{user?.name}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
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
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')} *</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500/20"
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
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-100 disabled:opacity-50 cursor-pointer"
                            >
                                {updatingProfile ? 'جاري الحفظ...' : t('save')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Form 2: Interviewer Working Hours (أوقات الدوام لحساب التقاطع مع المتقدمين) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                <span>🗓️</span> {t('interviewerWorkingHours')}
                                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full lowercase tracking-normal">
                                    توقيت الرياض (GMT+3)
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {t('interviewerWorkingHoursSubtitle')} (بتوقيت الشرق الأوسط / الرياض - GMT+3)
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddRule}
                            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer"
                        >
                            {t('addAvailabilityRule')}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {workingHours.map((rule, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-slate-700">
                                        فترة #{idx + 1}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAllDays(idx)}
                                            className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                                        >
                                            {t('allDays')}
                                        </button>
                                        {workingHours.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRule(idx)}
                                                className="text-slate-400 hover:text-rose-600 text-xs font-bold px-2 py-0.5 cursor-pointer"
                                                title={t('removeRule')}
                                            >
                                                ✕ {t('removeRule')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Days Selector Chips */}
                                <div className="flex flex-wrap gap-1.5">
                                    {daysList.map(d => {
                                        const isSelected = (rule.days || []).includes(d.key);
                                        return (
                                            <button
                                                key={d.key}
                                                type="button"
                                                onClick={() => handleToggleRuleDay(idx, d.key)}
                                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white shadow-2xs'
                                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {d.label} {isSelected && '✓'}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Times from/to and all day toggle */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 items-center">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`wh_allday_${idx}`}
                                            checked={rule.all_day || false}
                                            onChange={e => handleUpdateRuleField(idx, 'all_day', e.target.checked)}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor={`wh_allday_${idx}`} className="text-xs font-bold text-slate-700 cursor-pointer">
                                            {t('allDayFlexible')}
                                        </label>
                                    </div>

                                    {!rule.all_day && (
                                        <>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                    {t('fromTime')} <span className="text-[10px] text-blue-600 font-normal">(بتوقيت الرياض)</span>
                                                </label>
                                                <input
                                                    type="time"
                                                    value={rule.from || '09:00'}
                                                    onChange={e => handleUpdateRuleField(idx, 'from', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                    {t('toTime')} <span className="text-[10px] text-blue-600 font-normal">(بتوقيت الرياض)</span>
                                                </label>
                                                <input
                                                    type="time"
                                                    value={rule.to || '17:00'}
                                                    onChange={e => handleUpdateRuleField(idx, 'to', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={handleUpdateProfile}
                            disabled={updatingProfile}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-100 disabled:opacity-50 cursor-pointer"
                        >
                            {updatingProfile ? 'جاري الحفظ...' : 'حفظ أوقات الدوام'}
                        </button>
                    </div>
                </div>

                {/* Form 3: Change Password */}
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
