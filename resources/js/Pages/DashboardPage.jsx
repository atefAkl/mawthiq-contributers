import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import IconButton from '../components/IconButton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function DashboardPage({ currentRoute, navigate }) {
    const { t, isRtl } = useLanguage();
    const { user, hasPermission } = useAuth();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        setLoading(true);
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
                {/* Standardized Page Header Box */}
                <PageHeader
                    title={t('dashboard')}
                    subtitle={`${t('dashboardWelcome')} ${user?.name || ''} — ${t('dashboardSubtitle')}`}
                    icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                >
                    <IconButton
                        onClick={loadStats}
                        tooltip={t('refreshStats')}
                        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                    <IconButton
                        onClick={() => navigate('#/reports')}
                        tooltip={t('reports')}
                        icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                    <IconButton
                        onClick={() => navigate('#/interviews')}
                        tooltip={t('interviews')}
                        icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                    {hasPermission('create_applicants') && (
                        <IconButton
                            variant="primary"
                            onClick={() => navigate('#/applicants?action=new')}
                            tooltip={t('addApplicant')}
                            icon="M12 4v16m8-8H4"
                        />
                    )}
                </PageHeader>

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
                            {stats?.overview?.applicant_count ?? 0} {t('inInitialStage')}
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
                            {stats?.overview?.accepted_count ?? 0} {t('officiallyAcceptedCount')}
                        </p>
                    </div>

                    {/* In Pipeline (Participant & Probation) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold">{t('inScreeningAndProbation')}</span>
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
                            {stats?.overview?.probation_count ?? 0} {t('inProbationPeriod')}
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
                            {stats?.overview?.completed_interviews ?? 0} {t('evaluatedInterviewsCount')}
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
                            {t('currentCycle')}
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
                                {t('recentApplicants')}
                            </h3>
                            <IconButton
                                size="sm"
                                onClick={() => navigate('#/applicants')}
                                tooltip={t('viewAllApplicants')}
                                icon="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </div>

                        <div className="divide-y divide-slate-100">
                            {stats?.recent_applicants?.length === 0 ? (
                                <p className="py-6 text-center text-xs text-slate-400">{t('noApplicantsYet')}</p>
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
                                {t('upcomingScheduledInterviews')}
                            </h3>
                            <IconButton
                                size="sm"
                                onClick={() => navigate('#/interviews')}
                                tooltip={t('viewInterviewsSchedule')}
                                icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </div>

                        <div className="divide-y divide-slate-100">
                            {stats?.upcoming_interviews?.length === 0 ? (
                                <p className="py-6 text-center text-xs text-slate-400">{t('noUpcomingInterviews')}</p>
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
                                                {new Date(item.scheduled_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        {item.meeting_link ? (
                                            <IconButton
                                                size="sm"
                                                variant="active"
                                                href={item.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                tooltip={t('openMeetingLink')}
                                                icon="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        ) : (
                                            <span className="text-[11px] text-slate-400">{t('inPersonShort')}</span>
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
