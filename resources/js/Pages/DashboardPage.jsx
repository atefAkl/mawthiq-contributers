import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function DashboardPage({ currentRoute, navigate }) {
    const { t, isRtl } = useLanguage();
    const { user, hasPermission } = useAuth();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        try {
            const data = await api.get('/reports/dashboard');
            setStats(data);
        } catch (e) {
            console.error('Failed to load dashboard stats', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const getStatusBadge = (status) => {
        const styles = {
            applicant: 'bg-blue-50 text-blue-700 border-blue-200',
            participant: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            probation: 'bg-amber-50 text-amber-700 border-amber-200',
            accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rejected: 'bg-rose-50 text-rose-700 border-rose-200',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                {t(`status_${status}`) || status}
            </span>
        );
    };

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-slate-200/50">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-xs mb-3 border border-white/10">
                            <span>👋</span>
                            <span>{t('dashboard')} &bull; {user?.role?.display_name_ar || 'مدير'}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black mb-2">
                            مرحباً بك، {user?.name || 'زميلنا العزيز'}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            لوحة متابعة وإدارة المتقدمين والمساهمين. يمكنك هنا فحص مسار المرشحين، جدولة المقابلات، تسجيل نتائج التقييم، وتوليد التقارير.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2.5">
                            {hasPermission('create_applicants') && (
                                <button
                                    onClick={() => navigate('#/applicants?action=new')}
                                    className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-sm"
                                >
                                    + {t('addApplicant')}
                                </button>
                            )}
                            <button
                                onClick={() => navigate('#/interviews')}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
                            >
                                📅 {t('interviews')}
                            </button>
                            <button
                                onClick={() => navigate('#/reports')}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
                            >
                                📊 {t('reports')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Applicants */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold">{t('totalApplicants')}</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-800">
                            {stats?.overview?.total_applicants ?? (loading ? '...' : 0)}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {stats?.overview?.applicant_count ?? 0} في مرحلة المتقدم الأولي
                        </p>
                    </div>

                    {/* Acceptance Rate */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold">{t('acceptanceRate')}</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-600">
                            {stats?.overview?.acceptance_rate ?? 0}%
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {stats?.overview?.accepted_count ?? 0} متقدم تم قبولهم رسمياً
                        </p>
                    </div>

                    {/* In Pipeline (Participant & Probation) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold">تحت الفرز والاختبار</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-800">
                            {(stats?.overview?.participant_count ?? 0) + (stats?.overview?.probation_count ?? 0)}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {stats?.overview?.probation_count ?? 0} في فترة التجربة
                        </p>
                    </div>

                    {/* Interviews & Average Score */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold">{t('avgInterviewScore')}</span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-indigo-600">
                            {stats?.overview?.avg_interview_score ? `${stats.overview.avg_interview_score} / 10` : '—'}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {stats?.overview?.completed_interviews ?? 0} مقابلة مقيّمة
                        </p>
                    </div>
                </div>

                {/* Pipeline Stages Progress Funnel */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm text-slate-800">
                            {t('pipelineFunnel')}
                        </h3>
                        <span className="text-xs text-slate-500">
                            الدورة الحالية
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            { key: 'applicant', label: t('status_applicant'), count: stats?.overview?.applicant_count ?? 0, bg: 'bg-blue-50 border-blue-100 text-blue-700' },
                            { key: 'participant', label: t('status_participant'), count: stats?.overview?.participant_count ?? 0, bg: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
                            { key: 'probation', label: t('status_probation'), count: stats?.overview?.probation_count ?? 0, bg: 'bg-amber-50 border-amber-100 text-amber-700' },
                            { key: 'accepted', label: t('status_accepted'), count: stats?.overview?.accepted_count ?? 0, bg: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                            { key: 'rejected', label: t('status_rejected'), count: stats?.overview?.rejected_count ?? 0, bg: 'bg-rose-50 border-rose-100 text-rose-700' },
                        ].map((stage, idx) => (
                            <div
                                key={stage.key}
                                onClick={() => navigate(`#/applicants?status=${stage.key}`)}
                                className={`p-4 rounded-2xl border ${stage.bg} text-center cursor-pointer hover:shadow-xs transition-all`}
                            >
                                <span className="text-[11px] font-bold block mb-1 opacity-80">
                                    {stage.label}
                                </span>
                                <span className="text-2xl font-black block">
                                    {stage.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Two Column Grid: Recent Applicants & Upcoming Interviews */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Applicants */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                أحدث المتقدمين للمنصة
                            </h3>
                            <button
                                onClick={() => navigate('#/applicants')}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                                عرض الكل &larr;
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {stats?.recent_applicants?.length === 0 ? (
                                <p className="py-6 text-center text-xs text-slate-400">لا يوجد متقدمون مسجلون حالياً.</p>
                            ) : (
                                stats?.recent_applicants?.map(app => (
                                    <div
                                        key={app.id}
                                        onClick={() => navigate(`#/applicants/${app.id}`)}
                                        className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-slate-800 truncate">
                                                    {app.full_name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {app.application_no}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 block truncate">
                                                {app.position}
                                            </span>
                                        </div>
                                        <div>
                                            {getStatusBadge(app.status)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upcoming Interviews */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                المقابلات القادمة المجدولة
                            </h3>
                            <button
                                onClick={() => navigate('#/interviews')}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                                جدول المقابلات &larr;
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {stats?.upcoming_interviews?.length === 0 ? (
                                <p className="py-6 text-center text-xs text-slate-400">لا توجد مقابلات مجدولة قادمة.</p>
                            ) : (
                                stats?.upcoming_interviews?.map(item => (
                                    <div
                                        key={item.id}
                                        className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="font-bold text-xs text-slate-800 truncate">
                                                {item.applicant?.full_name} &bull; <span className="font-normal text-slate-500">{item.applicant?.position}</span>
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {new Date(item.scheduled_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        {item.meeting_link ? (
                                            <a
                                                href={item.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                            >
                                                دخول الرابط
                                            </a>
                                        ) : (
                                            <span className="text-[11px] text-slate-400">حضوري</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
