import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import IconButton from '../components/IconButton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { formatRiyadhDateTime, formatUtcCalendar, RIYADH_TIMEZONE } from '../utils/date';

export default function InterviewsPage({ currentRoute, navigate }) {
    const { t, isRtl } = useLanguage();
    const { hasPermission } = useAuth();
    const { showToast } = useToast();

    const [interviews, setInterviews] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState('all');
    const [search, setSearch] = useState('');

    // Record Results Modal
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [resultsModalOpen, setResultsModalOpen] = useState(false);
    const [savingResult, setSavingResult] = useState(false);
    const [resultForm, setResultForm] = useState({
        technical_score: 8,
        communication_score: 8,
        commitment_score: 8,
        recommendation: 'hire',
        feedback: '',
        promote_to_status: 'probation',
    });

    const loadInterviews = async (status = activeStatus) => {
        setLoading(true);
        try {
            const res = await api.get('/interviews', {
                status: status === 'all' ? '' : status,
            });
            setInterviews(res.data || []);
            setStats(res.stats || {});
        } catch (e) {
            showToast('فشل تحميل قائمة المقابلات.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInterviews(activeStatus);
    }, [activeStatus]);

    const openRecordResults = (interview) => {
        setSelectedInterview(interview);
        setResultForm({
            technical_score: interview.technical_score || 8,
            communication_score: interview.communication_score || 8,
            commitment_score: interview.commitment_score || 8,
            recommendation: interview.recommendation || 'hire',
            feedback: interview.feedback || '',
            promote_to_status: 'probation',
        });
        setResultsModalOpen(true);
    };

    const handleSaveResult = async (e) => {
        e.preventDefault();
        if (!selectedInterview) return;
        setSavingResult(true);

        try {
            await api.post(`/interviews/${selectedInterview.id}/result`, resultForm);
            showToast('تم حفظ تقييم المقابلة بنجاح!', 'success');
            setResultsModalOpen(false);
            loadInterviews(activeStatus);
        } catch (err) {
            showToast(err.message || 'فشل حفظ نتائج المقابلة.', 'error');
        } finally {
            setSavingResult(false);
        }
    };

    const handleDeleteInterview = async (id) => {
        if (!window.confirm(t('confirmDeleteInterview'))) return;
        try {
            await api.delete(`/interviews/${id}`);
            showToast(t('interviewDeletedSuccess'), 'success');
            loadInterviews(activeStatus);
        } catch (err) {
            showToast(err.message || 'فشل حذف المقابلة.', 'error');
        }
    };

    const overallCalculated = Math.round(((Number(resultForm.technical_score) + Number(resultForm.communication_score) + Number(resultForm.commitment_score)) / 3) * 10) / 10;

    const getGoogleCalendarUrl = (item) => {
        if (!item || !item.scheduled_at) return '#';
        const applicantName = item.applicant?.full_name || 'متقدم';
        const title = encodeURIComponent(`مقابلة توظيف: ${applicantName} (${item.applicant?.position || 'مساهم'})`);
        const start = new Date(item.scheduled_at);
        const end = new Date(start.getTime() + 25 * 60 * 1000);
        const dates = `${formatUtcCalendar(start)}/${formatUtcCalendar(end)}`;
        const details = encodeURIComponent(`مقابلة المرشح ${applicantName}\nرقم الطلب: ${item.applicant?.application_no || ''}\nرابط المقابلة: ${item.meeting_link || ''}\n(الموعد بتوقيت الرياض - GMT+3)`);
        const location = encodeURIComponent(item.meeting_link || item.location || 'Online');
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&ctz=${RIYADH_TIMEZONE}`;
    };

    const downloadIcs = (item) => {
        if (!item || !item.scheduled_at) return;
        const applicantName = item.applicant?.full_name || 'applicant';
        const start = new Date(item.scheduled_at);
        const end = new Date(start.getTime() + 25 * 60 * 1000);
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Mawthiq Contributors//Interview Scheduler//AR',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            `X-WR-TIMEZONE:${RIYADH_TIMEZONE}`,
            'BEGIN:VTIMEZONE',
            `TZID:${RIYADH_TIMEZONE}`,
            'X-LIC-LOCATION:Asia/Riyadh',
            'BEGIN:STANDARD',
            'TZOFFSETFROM:+0300',
            'TZOFFSETTO:+0300',
            'TZNAME:+03',
            'DTSTART:19700101T000000',
            'END:STANDARD',
            'END:VTIMEZONE',
            'BEGIN:VEVENT',
            `UID:interview-${item.id}-${Date.now()}@mawthiq.com`,
            `DTSTAMP:${formatUtcCalendar(new Date())}`,
            `DTSTART:${formatUtcCalendar(start)}`,
            `DTEND:${formatUtcCalendar(end)}`,
            `SUMMARY:مقابلة توظيف: ${applicantName}`,
            `DESCRIPTION:مقابلة المرشح ${applicantName}\\nرابط الاجتماع: ${item.meeting_link || ''}\\nبتوقيت الرياض (GMT+3)`,
            `LOCATION:${item.meeting_link || item.location || 'Online'}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `interview_${item.id}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(t('downloadIcsCalendar'), 'info');
    };

    const filteredInterviews = interviews.filter(item => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        const applicantName = (item.applicant?.full_name || '').toLowerCase();
        const position = (item.applicant?.position || '').toLowerCase();
        const interviewerName = (item.interviewer?.name || '').toLowerCase();
        const appNo = (item.applicant?.application_no || '').toLowerCase();
        return applicantName.includes(q) || position.includes(q) || interviewerName.includes(q) || appNo.includes(q);
    });

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-4">
                {/* 1. Standardized Page Header Box */}
                <PageHeader
                    title={t('interviews')}
                    subtitle={t('interviewsSubtitle')}
                    icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                >
                    <IconButton
                        onClick={() => loadInterviews(activeStatus)}
                        tooltip={t('refreshInterviews')}
                        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                    <IconButton
                        onClick={() => navigate('#/scorecards')}
                        tooltip={t('navScorecards')}
                        icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                    <IconButton
                        variant="primary"
                        onClick={() => navigate('#/applicants')}
                        tooltip={t('selectApplicantToSchedule')}
                        icon="M12 4v16m8-8H4"
                    />
                </PageHeader>

                {/* 2. KPI Summary Cards Row (4 Stat Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between">
                        <div>
                            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1.5">{t('interviews')}</p>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats.total || 0}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between">
                        <div>
                            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1.5">{t('interview_scheduled')}</p>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats.scheduled || 0}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between">
                        <div>
                            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1.5">{t('interview_completed')}</p>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats.completed || 0}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between">
                        <div>
                            <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1.5">{t('interview_cancelled')}</p>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats.cancelled || 0}
                        </div>
                    </div>
                </div>

                {/* 3. Unified Data Card (Toolbar + Filter Pills + Table) */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                    {/* Top Toolbar Row */}
                    <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                                className="w-full ps-9 pe-8 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute start-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute end-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        <IconButton
                            size="sm"
                            onClick={() => loadInterviews(activeStatus)}
                            tooltip={t('refreshInterviews')}
                            icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </div>

                    {/* Filter Pills Row */}
                    <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto">
                        {[
                            { id: 'all', label: t('status_all') },
                            { id: 'scheduled', label: t('interview_scheduled') },
                            { id: 'completed', label: t('interview_completed') },
                            { id: 'cancelled', label: t('interview_cancelled') },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveStatus(tab.id)}
                                className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                                    activeStatus === tab.id
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Interviews Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs text-slate-700">
                            <thead className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-start">{t('fullName')}</th>
                                    <th className="px-4 py-3 text-start">{t('position')}</th>
                                    <th className="px-4 py-3 text-start">
                                        {t('scheduledAt')} <span className="text-[10px] text-blue-600 font-normal">(بتوقيت الرياض)</span>
                                    </th>
                                    <th className="px-4 py-3 text-start">{t('interviewType')}</th>
                                    <th className="px-4 py-3 text-start">{t('assignedInterviewer')}</th>
                                    <th className="px-4 py-3 text-start">{t('overallScore')}</th>
                                    <th className="px-4 py-3 text-start">{t('statusCol')}</th>
                                    <th className="px-4 py-3 text-center">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="py-12 text-center text-slate-400">
                                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        </td>
                                    </tr>
                                ) : filteredInterviews.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-12 text-center text-slate-400">
                                            {t('noUpcomingInterviews')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInterviews.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`#/applicants/${item.applicant_id}?tab=interviews`)}
                                                    className="font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer text-start"
                                                >
                                                    {item.applicant?.full_name}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                <div>{item.applicant?.position}</div>
                                                {item.scorecard_template && (
                                                    <span className="inline-block text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-0.5">
                                                        📋 {item.scorecard_template.title}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                                                <div>{formatRiyadhDateTime(item.scheduled_at, isRtl, { dateStyle: 'short', timeStyle: 'short' })}</div>
                                                <div className="text-[10px] text-slate-400">بتوقيت الرياض</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.interview_type === 'online' ? t('interviewType_online') : t('interviewType_in_person')}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.interviewer?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 font-mono font-bold text-slate-800">
                                                {item.status === 'completed'
                                                    ? (item.overall_percentage != null ? `${item.overall_percentage}%` : `${item.overall_score} / 10`)
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                                    item.status === 'completed'
                                                         ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                         : item.status === 'cancelled'
                                                         ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                         : 'bg-blue-50 text-blue-700 border-blue-200'
                                                 }`}>
                                                     {item.status === 'completed' ? t('status_completed_badge') : item.status === 'cancelled' ? t('status_cancelled_badge') : t('status_scheduled_badge')}
                                                 </span>
                                             </td>
                                             <td className="px-4 py-3 text-center">
                                                 <div className="inline-flex items-center gap-1">
                                                     {item.meeting_link && (
                                                         <IconButton
                                                             size="sm"
                                                             variant="ghost"
                                                             tooltipPosition="top"
                                                             href={item.meeting_link}
                                                             target="_blank"
                                                             rel="noreferrer"
                                                             tooltip={t('openMeetingLink')}
                                                             icon="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                         />
                                                     )}
                                                     <IconButton
                                                         size="sm"
                                                         variant="ghost"
                                                         tooltipPosition="top"
                                                         href={getGoogleCalendarUrl(item)}
                                                         target="_blank"
                                                         rel="noreferrer"
                                                         tooltip={t('addToGoogleCalendar')}
                                                         icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                     />
                                                     <IconButton
                                                         size="sm"
                                                         variant="ghost"
                                                         tooltipPosition="top"
                                                         onClick={() => downloadIcs(item)}
                                                         tooltip={t('downloadIcsCalendar')}
                                                         icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                     />
                                                     <IconButton
                                                         size="sm"
                                                         variant="ghost"
                                                         tooltipPosition="top"
                                                         onClick={() => navigate(`#/applicants/${item.applicant_id}?tab=interviews`)}
                                                         tooltip={t('viewInterviewCandidate')}
                                                         icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                     />
                                                     {hasPermission('record_interview_results') && (
                                                         <IconButton
                                                             size="sm"
                                                             variant="ghost"
                                                             tooltipPosition="top"
                                                             onClick={() => openRecordResults(item)}
                                                             tooltip={t('recordResults')}
                                                             icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                         />
                                                     )}
                                                     {hasPermission('delete_interviews') && (
                                                         <IconButton
                                                             size="sm"
                                                             variant="ghost"
                                                             tooltipPosition="top"
                                                             onClick={() => handleDeleteInterview(item.id)}
                                                             tooltip={t('deleteInterview')}
                                                             className="hover:text-rose-600 hover:bg-rose-50"
                                                             icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                         />
                                                     )}
                                                 </div>
                                             </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal: Record Interview Results */}
            {resultsModalOpen && selectedInterview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-900">
                                {t('recordResults')}
                            </h3>
                            <button
                                onClick={() => setResultsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <p className="font-bold text-slate-900">{selectedInterview.applicant?.full_name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{selectedInterview.applicant?.position}</p>
                        </div>

                        <form onSubmit={handleSaveResult} className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>{t('technicalScore')}</span>
                                    <span className="text-blue-600 font-mono">{resultForm.technical_score} / 10</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={resultForm.technical_score}
                                    onChange={e => setResultForm({ ...resultForm, technical_score: e.target.value })}
                                    className="w-full accent-blue-600 cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>{t('communicationScore')}</span>
                                    <span className="text-blue-600 font-mono">{resultForm.communication_score} / 10</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={resultForm.communication_score}
                                    onChange={e => setResultForm({ ...resultForm, communication_score: e.target.value })}
                                    className="w-full accent-blue-600 cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>{t('commitmentScore')}</span>
                                    <span className="text-blue-600 font-mono">{resultForm.commitment_score} / 10</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={resultForm.commitment_score}
                                    onChange={e => setResultForm({ ...resultForm, commitment_score: e.target.value })}
                                    className="w-full accent-blue-600 cursor-pointer"
                                />
                            </div>

                            <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">{t('overallScore')}:</span>
                                <span className="text-base font-black text-blue-600 font-mono">{overallCalculated} / 10</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('recommendation')} *
                                </label>
                                <select
                                    value={resultForm.recommendation}
                                    onChange={e => setResultForm({ ...resultForm, recommendation: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="strong_hire">{t('recommendation_strong_hire')}</option>
                                    <option value="hire">{t('recommendation_hire')}</option>
                                    <option value="under_consideration">{t('recommendation_under_consideration')}</option>
                                    <option value="reject">{t('recommendation_reject')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('autoPromoteOnResult')}
                                </label>
                                <select
                                    value={resultForm.promote_to_status}
                                    onChange={e => setResultForm({ ...resultForm, promote_to_status: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="probation">{t('status_probation')}</option>
                                    <option value="accepted">{t('status_accepted')}</option>
                                    <option value="rejected">{t('status_rejected')}</option>
                                    <option value="participant">{t('status_participant')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('feedbackNotes')} *
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={resultForm.feedback}
                                    onChange={e => setResultForm({ ...resultForm, feedback: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs leading-relaxed"
                                />
                            </div>

                            <div className="pt-3 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setResultsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingResult}
                                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                                >
                                    {savingResult ? t('saving') : t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
