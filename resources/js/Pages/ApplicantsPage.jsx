import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function ApplicantsPage({ currentRoute, navigate }) {
    const { t, isRtl } = useLanguage();
    const { hasPermission, user } = useAuth();
    const { showToast } = useToast();

    // Data State
    const [applicants, setApplicants] = useState([]);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters & Search
    const [activeStatus, setActiveStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'

    // Modals
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [interviewModalOpen, setInterviewModalOpen] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [applicantToDelete, setApplicantToDelete] = useState(null);
    const [deletingApplicant, setDeletingApplicant] = useState(false);

    // Status Change Form
    const [toStatus, setToStatus] = useState('participant');
    const [statusNote, setStatusNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [sendEmailNotification, setSendEmailNotification] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Create Applicant Form
    const [newApplicant, setNewApplicant] = useState({
        full_name: '',
        email: '',
        phone: '',
        country: 'مصر',
        city: '',
        position: 'Full Stack Developer (Laravel & React)',
        experience_years: 1,
        education_level: 'بكالوريوس',
        status: 'applicant',
        cover_letter: '',
        internal_notes: '',
    });

    // Schedule Interview Form
    const [interviewForm, setInterviewForm] = useState({
        scheduled_at: '',
        interview_type: 'online',
        meeting_link: '',
        location: '',
        send_invitation_email: true,
    });

    // Direct Email Form
    const [emailForm, setEmailForm] = useState({
        subject: '',
        body: '',
    });

    const loadApplicants = async (page = 1, status = activeStatus, q = search) => {
        setLoading(true);
        try {
            const res = await api.get('/applicants', {
                page,
                status: status === 'all' ? '' : status,
                search: q,
                per_page: 20
            });
            setApplicants(res.data || []);
            setCounts(res.counts || {});
            setCurrentPage(res.current_page || 1);
            setLastPage(res.last_page || 1);
            setTotal(res.total || 0);
        } catch (e) {
            showToast(e.message || 'فشل تحميل بيانات المتقدمين.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplicants(1, activeStatus, search);
    }, [activeStatus]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadApplicants(1, activeStatus, search);
    };

    const openStatusModal = (app, nextStage = null) => {
        setSelectedApplicant(app);
        setToStatus(nextStage || (app.status === 'applicant' ? 'participant' : app.status === 'participant' ? 'probation' : 'accepted'));
        setStatusNote('');
        setRejectionReason('');
        setStatusModalOpen(true);
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!selectedApplicant) return;
        setUpdatingStatus(true);

        try {
            await api.post(`/applicants/${selectedApplicant.id}/status`, {
                to_status: toStatus,
                notes: statusNote,
                rejection_reason: rejectionReason,
                send_email: sendEmailNotification,
            });
            showToast('تم ترقية وتحديث حالة المتقدم بنجاح!', 'success');
            setStatusModalOpen(false);
            loadApplicants(currentPage, activeStatus, search);
            if (detailModalOpen) {
                openDetailModal(selectedApplicant.id);
            }
        } catch (err) {
            showToast(err.message || 'فشل تغيير الحالة.', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const openDetailModal = async (applicantId) => {
        try {
            const res = await api.get(`/applicants/${applicantId}`);
            setSelectedApplicant(res.applicant);
            setDetailModalOpen(true);
        } catch (e) {
            showToast('تعذر جلب تفاصيل المتقدم.', 'error');
        }
    };

    const confirmDeleteApplicant = (app) => {
        setApplicantToDelete(app);
        setDeleteModalOpen(true);
    };

    const handleDeleteApplicant = async () => {
        if (!applicantToDelete) return;
        setDeletingApplicant(true);
        try {
            const res = await api.delete(`/applicants/${applicantToDelete.id}`);
            showToast(res.message || 'تم حذف المتقدم بنجاح.', 'success');
            setDeleteModalOpen(false);
            setApplicantToDelete(null);
            if (detailModalOpen && selectedApplicant?.id === applicantToDelete.id) {
                setDetailModalOpen(false);
            }
            loadApplicants(currentPage, activeStatus, search);
        } catch (err) {
            showToast(err.message || 'فشل حذف المتقدم.', 'error');
        } finally {
            setDeletingApplicant(false);
        }
    };

    const handleCreateApplicant = async (e) => {
        e.preventDefault();
        try {
            await api.post('/applicants', newApplicant);
            showToast('تمت إضافة المتقدم بنجاح!', 'success');
            setCreateModalOpen(false);
            loadApplicants(1, activeStatus, search);
        } catch (err) {
            showToast(err.message || 'فشل إنشاء المتقدم.', 'error');
        }
    };

    const handleScheduleInterview = async (e) => {
        e.preventDefault();
        if (!selectedApplicant) return;

        try {
            await api.post('/interviews', {
                ...interviewForm,
                applicant_id: selectedApplicant.id,
            });
            showToast('تمت جدولة المقابلة وإرسال الإشعار بنجاح!', 'success');
            setInterviewModalOpen(false);
            loadApplicants(currentPage, activeStatus, search);
        } catch (err) {
            showToast(err.message || 'فشل جدولة المقابلة.', 'error');
        }
    };

    const handleSendDirectEmail = async (e) => {
        e.preventDefault();
        if (!selectedApplicant) return;

        try {
            await api.post('/emails/send', {
                applicant_id: selectedApplicant.id,
                recipient_email: selectedApplicant.email,
                subject: emailForm.subject,
                body: emailForm.body,
            });
            showToast('تم إرسال البريد الإلكتروني بنجاح!', 'success');
            setEmailModalOpen(false);
            setEmailForm({ subject: '', body: '' });
        } catch (err) {
            showToast(err.message || 'فشل إرسال البريد.', 'error');
        }
    };

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

    const statusTabs = [
        { id: 'all', label: t('status_all'), count: counts.all || 0 },
        { id: 'applicant', label: t('status_applicant'), count: counts.applicant || 0 },
        { id: 'participant', label: t('status_participant'), count: counts.participant || 0 },
        { id: 'probation', label: t('status_probation'), count: counts.probation || 0 },
        { id: 'accepted', label: t('status_accepted'), count: counts.accepted || 0 },
        { id: 'rejected', label: t('status_rejected'), count: counts.rejected || 0 },
    ];

    const kanbanStages = ['applicant', 'participant', 'probation', 'accepted', 'rejected'];

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6">
                {/* Header Title & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                            {t('applicants')}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            إدارة طلبات المتقدمين، متابعة المقابلات، والترقية عبر المراحل الخمس.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* View Switcher */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                📋 {t('tableView')}
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                🗂️ {t('kanbanView')}
                            </button>
                        </div>

                        {/* Export CSV */}
                        <a
                            href="/api/applicants/export"
                            download
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>{t('exportCsv')}</span>
                        </a>

                        {/* Add Applicant Button */}
                        {hasPermission('create_applicants') && (
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5"
                            >
                                <span>+</span>
                                <span>{t('addApplicant')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs & Search */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveStatus(tab.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                    activeStatus === tab.id
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    activeStatus === tab.id ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="ابحث بالاسم، البريد، الهاتف، رقم الطلب، أو التخصص..."
                                className="w-full px-3.5 py-2 pe-10 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        loadApplicants(1, activeStatus, '');
                                    }}
                                    className="absolute end-3 top-2 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                            {t('search')}
                        </button>
                    </form>
                </div>

                {/* Content View: Table View OR Kanban View */}
                {viewMode === 'table' ? (
                    /* Table View */
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-start text-xs text-slate-700">
                                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3.5 text-start">رقم الطلب / الاسم</th>
                                        <th className="px-4 py-3.5 text-start">الدور / الوظيفة</th>
                                        <th className="px-4 py-3.5 text-start">الخبرة والموقع</th>
                                        <th className="px-4 py-3.5 text-start">الحالة</th>
                                        <th className="px-4 py-3.5 text-start">التقييم</th>
                                        <th className="px-4 py-3.5 text-start">تاريخ التقديم</th>
                                        <th className="px-4 py-3.5 text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-slate-400">
                                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                جاري تحميل المتقدمين...
                                            </td>
                                        </tr>
                                    ) : applicants.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-slate-400">
                                                لا يوجد متقدمون يطابقون معايير البحث الحالية.
                                            </td>
                                        </tr>
                                    ) : (
                                        applicants.map(app => (
                                             <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div
                                                        onClick={() => navigate(`#/applicants/${app.id}`)}
                                                        className="font-bold text-slate-800 text-xs hover:text-indigo-600 cursor-pointer transition-colors"
                                                    >
                                                        {app.full_name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                        {app.application_no} &bull; {app.email}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <span className="font-semibold text-slate-700 block">
                                                        {app.position}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">
                                                        {app.education_level || '—'}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div>{app.experience_years} سنوات خبرة</div>
                                                    <div className="text-[11px] text-slate-400">{app.city ? `${app.city}، ` : ''}{app.country}</div>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    {getStatusBadge(app.status)}
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    {app.rating > 0 ? (
                                                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                                            ★ {app.rating}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">بدون تقييم</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                                                    {new Date(app.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                                                </td>

                                                <td className="px-4 py-3.5 text-center">
                                                    <div className="inline-flex items-center gap-1">
                                                        {/* View Details Standalone Page */}
                                                        <button
                                                            onClick={() => navigate(`#/applicants/${app.id}`)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                            title="عرض وتعديل ملف المتقدم"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>

                                                        {/* Change Status / Promote (Icon Button) */}
                                                        {hasPermission('promote_applicants') && (
                                                            <button
                                                                onClick={() => openStatusModal(app)}
                                                                className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors border border-amber-200/70"
                                                                title="ترقية وتغيير حالة المتقدم"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        {/* Schedule Interview */}
                                                        {hasPermission('schedule_interviews') && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedApplicant(app);
                                                                    setInterviewForm({
                                                                        scheduled_at: '',
                                                                        interview_type: 'online',
                                                                        meeting_link: '',
                                                                        location: '',
                                                                        send_invitation_email: true,
                                                                    });
                                                                    setInterviewModalOpen(true);
                                                                }}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                                title="جدولة مقابلة شخصية"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        {/* Send Email */}
                                                        {hasPermission('send_emails') && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedApplicant(app);
                                                                    setEmailForm({ subject: '', body: '' });
                                                                    setEmailModalOpen(true);
                                                                }}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                                                                title="إرسال رسالة بريد إلكتروني"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        {/* Delete Applicant */}
                                                        {hasPermission('delete_applicants') && (
                                                            <button
                                                                onClick={() => confirmDeleteApplicant(app)}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                title="حذف المتقدم نهائياً"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {lastPage > 1 && (
                            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <div>
                                    إجمالي {total} متقدم &bull; الصفحة {currentPage} من {lastPage}
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        disabled={currentPage <= 1}
                                        onClick={() => loadApplicants(currentPage - 1, activeStatus, search)}
                                        className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                                    >
                                        السابق
                                    </button>
                                    <button
                                        disabled={currentPage >= lastPage}
                                        onClick={() => loadApplicants(currentPage + 1, activeStatus, search)}
                                        className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                                    >
                                        التالي
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Kanban Board View (Pipeline stages visual representation) */
                    <div className="overflow-x-auto pb-6 pt-2">
                        <div className="flex gap-4 min-w-max pb-2">
                            {kanbanStages.map(stage => {
                                const stageApplicants = applicants.filter(a => a.status === stage);
                                const titles = {
                                    applicant: { label: t('status_applicant'), color: 'border-t-blue-500 bg-blue-50/30' },
                                    participant: { label: t('status_participant'), color: 'border-t-indigo-500 bg-indigo-50/30' },
                                    probation: { label: t('status_probation'), color: 'border-t-amber-500 bg-amber-50/30' },
                                    accepted: { label: t('status_accepted'), color: 'border-t-emerald-500 bg-emerald-50/30' },
                                    rejected: { label: t('status_rejected'), color: 'border-t-rose-500 bg-rose-50/30' },
                                };

                                return (
                                    <div
                                        key={stage}
                                        className={`bg-white rounded-2xl border border-slate-200 border-t-4 ${titles[stage]?.color || ''} p-3.5 flex flex-col w-[300px] shrink-0 shadow-xs`}
                                    >
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <h4 className="font-bold text-xs text-slate-800">
                                                {titles[stage]?.label}
                                            </h4>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                                {stageApplicants.length}
                                            </span>
                                        </div>

                                        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[620px] pr-1">
                                            {stageApplicants.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-slate-300">
                                                    فارغ
                                                </div>
                                            ) : (
                                                stageApplicants.map(app => (
                                                    <div
                                                        key={app.id}
                                                        className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer space-y-2"
                                                        onClick={() => navigate(`#/applicants/${app.id}`)}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="font-bold text-xs text-slate-800 leading-tight">
                                                                {app.full_name}
                                                            </div>
                                                            {app.rating > 0 && (
                                                                <span className="text-[10px] font-bold text-amber-600 shrink-0">
                                                                    ★ {app.rating}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 truncate">
                                                            {app.position}
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                                                            <span className="truncate max-w-[130px]">{app.city || app.country || 'غير محدد'}</span>
                                                            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                                                {hasPermission('promote_applicants') && (
                                                                    <button
                                                                        onClick={() => openStatusModal(app)}
                                                                        className="p-1 rounded-md text-amber-600 hover:bg-amber-50 font-bold flex items-center gap-0.5"
                                                                        title="ترقية وتغيير الحالة"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                        </svg>
                                                                        <span>ترقية</span>
                                                                    </button>
                                                                )}
                                                                {hasPermission('delete_applicants') && (
                                                                    <button
                                                                        onClick={() => confirmDeleteApplicant(app)}
                                                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                                        title="حذف المتقدم"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Change Status & Promote */}
            {statusModalOpen && selectedApplicant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                {t('changeStatus')}
                            </h3>
                            <button
                                onClick={() => setStatusModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                            <p className="font-bold">{selectedApplicant.full_name} ({selectedApplicant.application_no})</p>
                            <p className="text-slate-500 mt-0.5">الحالة الحالية: <span className="font-semibold">{t(`status_${selectedApplicant.status}`)}</span></p>
                        </div>

                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    الحالة الجديدة المستهدفة <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={toStatus}
                                    onChange={e => setToStatus(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="applicant">{t('status_applicant')} (متقدم جديد)</option>
                                    <option value="participant">{t('status_participant')} (مشارك في الفرز والمقابلات)</option>
                                    <option value="probation">{t('status_probation')} (تحت الاختبار / تجربة)</option>
                                    <option value="accepted">{t('status_accepted')} (مقبول ومعتمد)</option>
                                    <option value="rejected">{t('status_rejected')} (مرفوض / اعتذار)</option>
                                </select>
                            </div>

                            {toStatus === 'rejected' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        {t('rejectionReason')}
                                    </label>
                                    <input
                                        type="text"
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        placeholder="سبب الاعتذار (مثلاً: عدم تطابق سنوات الخبرة...)"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {t('notes')}
                                </label>
                                <textarea
                                    rows={2}
                                    value={statusNote}
                                    onChange={e => setStatusNote(e.target.value)}
                                    placeholder="ملاحظات توثيقية عن سبب الترقية أو النقل..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="sendEmail"
                                    checked={sendEmailNotification}
                                    onChange={e => setSendEmailNotification(e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                <label htmlFor="sendEmail" className="text-xs text-slate-700 cursor-pointer">
                                    {t('notifyApplicantByEmail')}
                                </label>
                            </div>

                            <div className="pt-3 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setStatusModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingStatus}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 disabled:opacity-50"
                                >
                                    {updatingStatus ? 'جاري الحفظ...' : t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Applicant by Admin */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                {t('addApplicant')}
                            </h3>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateApplicant} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')} *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newApplicant.full_name}
                                        onChange={e => setNewApplicant({ ...newApplicant, full_name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')} *</label>
                                    <input
                                        type="email"
                                        required
                                        value={newApplicant.email}
                                        onChange={e => setNewApplicant({ ...newApplicant, email: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')} *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newApplicant.phone}
                                        onChange={e => setNewApplicant({ ...newApplicant, phone: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('position')} *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newApplicant.position}
                                        onChange={e => setNewApplicant({ ...newApplicant, position: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('experienceYears')}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newApplicant.experience_years}
                                        onChange={e => setNewApplicant({ ...newApplicant, experience_years: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">الحالة المبدئية</label>
                                    <select
                                        value={newApplicant.status}
                                        onChange={e => setNewApplicant({ ...newApplicant, status: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                    >
                                        <option value="applicant">{t('status_applicant')}</option>
                                        <option value="participant">{t('status_participant')}</option>
                                        <option value="probation">{t('status_probation')}</option>
                                        <option value="accepted">{t('status_accepted')}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('internalNotes')}</label>
                                <textarea
                                    rows={2}
                                    value={newApplicant.internal_notes}
                                    onChange={e => setNewApplicant({ ...newApplicant, internal_notes: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Schedule Interview */}
            {interviewModalOpen && selectedApplicant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                {t('scheduleInterview')}
                            </h3>
                            <button
                                onClick={() => setInterviewModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                            <p className="font-bold">{selectedApplicant.full_name} &bull; {selectedApplicant.position}</p>
                        </div>

                        <form onSubmit={handleScheduleInterview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('scheduledAt')} *
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={interviewForm.scheduled_at}
                                    onChange={e => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('interviewType')}
                                </label>
                                <select
                                    value={interviewForm.interview_type}
                                    onChange={e => setInterviewForm({ ...interviewForm, interview_type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="online">{t('interviewType_online')}</option>
                                    <option value="in_person">{t('interviewType_in_person')}</option>
                                    <option value="phone">{t('interviewType_phone')}</option>
                                </select>
                            </div>

                            {interviewForm.interview_type === 'online' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {t('meetingLink')} (اتركه فارغاً للتوليد التلقائي)
                                    </label>
                                    <input
                                        type="url"
                                        value={interviewForm.meeting_link}
                                        onChange={e => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                                        placeholder="https://meet.google.com/..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="sendInvitation"
                                    checked={interviewForm.send_invitation_email}
                                    onChange={e => setInterviewForm({ ...interviewForm, send_invitation_email: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                <label htmlFor="sendInvitation" className="text-xs text-slate-700 cursor-pointer">
                                    إرسال بريد إلكتروني تلقائي للمتقدم برابط وموعد المقابلة
                                </label>
                            </div>

                            <div className="pt-3 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setInterviewModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                                >
                                    تأكيد الجدولة
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Direct Email Composer */}
            {emailModalOpen && selectedApplicant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                {t('composeEmail')}
                            </h3>
                            <button
                                onClick={() => setEmailModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSendDirectEmail} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('recipient')}</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={`${selectedApplicant.full_name} <${selectedApplicant.email}>`}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('subject')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={emailForm.subject}
                                    onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                                    placeholder="موضوع الرسالة..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('body')} *</label>
                                <textarea
                                    rows={5}
                                    required
                                    value={emailForm.body}
                                    onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                                    placeholder="اكتب رسالتك هنا..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setEmailModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                                >
                                    {t('sendEmail')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Full Applicant Profile & History Drawer */}
            {detailModalOpen && selectedApplicant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-lg border border-indigo-100">
                                    {selectedApplicant.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-slate-800">
                                        {selectedApplicant.full_name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono">
                                        {selectedApplicant.application_no} &bull; {selectedApplicant.position}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {getStatusBadge(selectedApplicant.status)}
                                <button
                                    onClick={() => setDetailModalOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-xl leading-none"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Candidate Information Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-6">
                            <div>
                                <span className="text-slate-400 block mb-0.5">البريد الإلكتروني:</span>
                                <span className="font-semibold text-slate-800">{selectedApplicant.email}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5">رقم الهاتف:</span>
                                <span className="font-semibold text-slate-800">{selectedApplicant.phone}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5">الموقع:</span>
                                <span className="font-semibold text-slate-800">{selectedApplicant.city ? `${selectedApplicant.city}، ` : ''}{selectedApplicant.country}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5">المؤهل والخبرة:</span>
                                <span className="font-semibold text-slate-800">{selectedApplicant.education_level || '—'} ({selectedApplicant.experience_years} سنوات)</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5">التقييم العام:</span>
                                <span className="font-bold text-amber-600">★ {selectedApplicant.rating || 'لم يُحدد'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5">تاريخ التقديم:</span>
                                <span className="font-semibold text-slate-800">{new Date(selectedApplicant.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                        </div>

                        {/* Skills Chips */}
                        {selectedApplicant.skills?.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-700 mb-2">{t('skills')}</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedApplicant.skills.map((s, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Links */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {selectedApplicant.portfolio_url && (
                                <a
                                    href={selectedApplicant.portfolio_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-indigo-600 hover:bg-slate-50 flex items-center gap-1"
                                >
                                    🌐 معرض الأعمال
                                </a>
                            )}
                            {selectedApplicant.github_url && (
                                <a
                                    href={selectedApplicant.github_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-1"
                                >
                                    🐙 حساب GitHub
                                </a>
                            )}
                            {selectedApplicant.linkedin_url && (
                                <a
                                    href={selectedApplicant.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-blue-700 hover:bg-slate-50 flex items-center gap-1"
                                >
                                    💼 ملف LinkedIn
                                </a>
                            )}
                        </div>

                        {/* Cover Letter */}
                        {selectedApplicant.cover_letter && (
                            <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 text-xs">
                                <h4 className="font-bold text-slate-700 mb-1.5">{t('coverLetter')}</h4>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedApplicant.cover_letter}</p>
                            </div>
                        )}

                        {/* Status Transition History (مسار الترقية والحالة) */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-800 mb-3">سجل وتاريخ الترقيات وتغيير الحالة:</h4>
                            <div className="border-s-2 border-indigo-200 ms-3 ps-4 space-y-4 text-xs">
                                {selectedApplicant.status_logs?.map((log, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -start-[23px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white"></div>
                                        <p className="font-bold text-slate-800">
                                            {log.notes || `تم التحويل إلى ${t(`status_${log.to_status}`)}`}
                                        </p>
                                        <span className="text-[10px] text-slate-400">
                                            بواسطة: {log.changed_by_user?.name || 'النظام'} &bull; {new Date(log.created_at).toLocaleString('ar-EG')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            {hasPermission('delete_applicants') && (
                                <button
                                    onClick={() => confirmDeleteApplicant(selectedApplicant)}
                                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold"
                                >
                                    {t('delete')}
                                </button>
                            )}

                            <div className="flex gap-2 ms-auto">
                                {hasPermission('promote_applicants') && (
                                    <button
                                        onClick={() => openStatusModal(selectedApplicant)}
                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                                    >
                                        ترقية وتغيير المرحلة
                                    </button>
                                )}
                                <button
                                    onClick={() => setDetailModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    {t('close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Confirm Delete Applicant */}
            {deleteModalOpen && applicantToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-base text-slate-800 mb-2">تأكيد حذف المتقدم</h3>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                            هل أنت متأكد من رغبتك في حذف المتقدم <strong className="text-slate-800 font-bold">"{applicantToDelete.full_name}"</strong> نهائياً من المنصة؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setApplicantToDelete(null);
                                }}
                                disabled={deletingApplicant}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleDeleteApplicant}
                                disabled={deletingApplicant}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all disabled:opacity-50"
                            >
                                {deletingApplicant ? 'جاري الحذف...' : 'نعم، احذف'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
