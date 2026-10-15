import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function EmailsPage({ currentRoute, navigate }) {
    const { t } = useLanguage();
    const { hasPermission } = useAuth();
    const { showToast } = useToast();

    const [emails, setEmails] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('all');
    const [search, setSearch] = useState('');
    const [templates, setTemplates] = useState([]);

    // Selection & Bulk Actions
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: 'single', id: null, count: 0 });

    // Compose Modal
    const [composeModalOpen, setComposeModalOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [composeForm, setComposeForm] = useState({
        recipient_email: '',
        subject: '',
        body: '',
        template_name: 'custom',
        applicant_id: null,
    });

    // Simulate Reply Modal
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyForm, setReplyForm] = useState({
        applicant_id: '',
        subject: 'رد: استفسار بخصوص المقابلة والمهام',
        body: 'السلام عليكم، أود التأكيد على استلامي لموعد المقابلة، وجاهزيتي للمشاركة في الموعد المحدد. شكراً لكم.',
    });
    const [applicantsList, setApplicantsList] = useState([]);

    // View Modal
    const [viewEmail, setViewEmail] = useState(null);
    const [syncingImap, setSyncingImap] = useState(false);

    const handleSyncImap = async () => {
        setSyncingImap(true);
        try {
            const res = await api.post('/emails/sync-imap');
            showToast(res.message, 'success');
            loadEmails(activeType, search);
        } catch (err) {
            showToast(err.message || 'فشل فحص صندوق الوارد IMAP.', 'error');
        } finally {
            setSyncingImap(false);
        }
    };

    const loadEmails = async (type = activeType, q = search) => {
        setLoading(true);
        try {
            const res = await api.get('/emails', {
                type: type === 'all' ? '' : type,
                search: q,
            });
            setEmails(res.data || []);
            setStats(res.stats || {});
            setSelectedIds([]);
        } catch (e) {
            showToast('تعذر تحميل سجل البريد.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await api.get('/emails/templates');
            setTemplates(res || []);
        } catch (e) {}
    };

    const loadApplicantsForReply = async () => {
        try {
            const res = await api.get('/applicants', { per_page: 50 });
            setApplicantsList(res.data || []);
            if (res.data?.length > 0) {
                setReplyForm(prev => ({ ...prev, applicant_id: res.data[0].id }));
            }
        } catch (e) {}
    };

    useEffect(() => {
        loadEmails(activeType, search);
        loadTemplates();
        loadApplicantsForReply();
    }, [activeType]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadEmails(activeType, search);
    };

    const handleSelectTemplate = (templateId) => {
        const found = templates.find(t => t.id === templateId);
        if (found) {
            setComposeForm(prev => ({
                ...prev,
                template_name: found.id,
                subject: found.subject,
                body: found.body,
            }));
        }
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        setSending(true);

        try {
            await api.post('/emails/send', composeForm);
            showToast('تم إرسال البريد الإلكتروني بنجاح وتسجيله!', 'success');
            setComposeModalOpen(false);
            setComposeForm({ recipient_email: '', subject: '', body: '', template_name: 'custom', applicant_id: null });
            loadEmails(activeType, search);
        } catch (err) {
            showToast(err.message || 'فشل إرسال البريد.', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleSimulateReply = async (e) => {
        e.preventDefault();
        try {
            await api.post('/emails/simulate-reply', replyForm);
            showToast('تمت محاكاة استلام رسالة واردة جديدة من المتقدم!', 'success');
            setReplyModalOpen(false);
            loadEmails(activeType, search);
        } catch (err) {
            showToast(err.message || 'فشل محاكاة الرد.', 'error');
        }
    };

    // Single item actions
    const handleToggleRead = async (email, e) => {
        if (e) e.stopPropagation();
        try {
            const nextVal = !email.is_read;
            const res = await api.patch(`/emails/${email.id}/read`, { is_read: nextVal });
            setEmails(prev => prev.map(item => item.id === email.id ? { ...item, is_read: nextVal } : item));
            setStats(prev => ({
                ...prev,
                unread: Math.max(0, (prev.unread || 0) + (nextVal ? -1 : 1))
            }));
            if (viewEmail && viewEmail.id === email.id) {
                setViewEmail(prev => ({ ...prev, is_read: nextVal }));
            }
            showToast(res.message, 'success');
        } catch (err) {
            showToast('فشل تحديث حالة القراءة', 'error');
        }
    };

    const handleToggleStar = async (email, e) => {
        if (e) e.stopPropagation();
        try {
            const nextVal = !email.is_starred;
            const res = await api.patch(`/emails/${email.id}/star`, { is_starred: nextVal });
            setEmails(prev => prev.map(item => item.id === email.id ? { ...item, is_starred: nextVal } : item));
            setStats(prev => ({
                ...prev,
                starred: Math.max(0, (prev.starred || 0) + (nextVal ? 1 : -1))
            }));
            if (viewEmail && viewEmail.id === email.id) {
                setViewEmail(prev => ({ ...prev, is_starred: nextVal }));
            }
            showToast(res.message, 'success');
        } catch (err) {
            showToast('فشل تحديث التمييز بنجمة', 'error');
        }
    };

    const handleReply = (email, e) => {
        if (e) e.stopPropagation();
        const targetRecipient = email.type === 'received' ? email.sender_email : email.recipient_email;
        const cleanSubject = email.subject.toLowerCase().startsWith('re:') ? email.subject : `Re: ${email.subject}`;
        const quotedBody = `\n\n\n--- في ${new Date(email.created_at).toLocaleString('ar-EG')}، كتب ${email.sender_email} ---\n> ${email.body.replace(/\n/g, '\n> ')}`;

        setComposeForm({
            recipient_email: targetRecipient,
            subject: cleanSubject,
            body: quotedBody,
            template_name: 'custom',
            applicant_id: email.applicant_id || null,
        });
        setViewEmail(null);
        setComposeModalOpen(true);
    };

    const handleForward = (email, e) => {
        if (e) e.stopPropagation();
        const cleanSubject = email.subject.toLowerCase().startsWith('fwd:') ? email.subject : `Fwd: ${email.subject}`;
        const quotedBody = `\n\n\n---------- رسالة موجهة ----------\nمن: ${email.sender_email}\nالتاريخ: ${new Date(email.created_at).toLocaleString('ar-EG')}\nالموضوع: ${email.subject}\nإلى: ${email.recipient_email}\n\n${email.body}`;

        setComposeForm({
            recipient_email: '',
            subject: cleanSubject,
            body: quotedBody,
            template_name: 'custom',
            applicant_id: email.applicant_id || null,
        });
        setViewEmail(null);
        setComposeModalOpen(true);
    };

    const handleOpenView = async (email) => {
        setViewEmail(email);
        if (!email.is_read) {
            try {
                await api.patch(`/emails/${email.id}/read`, { is_read: true });
                setEmails(prev => prev.map(item => item.id === email.id ? { ...item, is_read: true } : item));
                setStats(prev => ({
                    ...prev,
                    unread: Math.max(0, (prev.unread || 0) - 1)
                }));
            } catch (e) {}
        }
    };

    const handleSingleDelete = (email, e) => {
        if (e) e.stopPropagation();
        setDeleteConfirm({ open: true, type: 'single', id: email.id, count: 1 });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setDeleteConfirm({ open: true, type: 'bulk', id: null, count: selectedIds.length });
    };

    const executeDelete = async () => {
        try {
            if (deleteConfirm.type === 'single') {
                await api.delete(`/emails/${deleteConfirm.id}`);
                setEmails(prev => prev.filter(item => item.id !== deleteConfirm.id));
                setSelectedIds(prev => prev.filter(id => id !== deleteConfirm.id));
                if (viewEmail && viewEmail.id === deleteConfirm.id) {
                    setViewEmail(null);
                }
                showToast('تم حذف الرسالة بنجاح.', 'success');
            } else {
                const res = await api.post('/emails/bulk-action', { ids: selectedIds, action: 'delete' });
                setEmails(prev => prev.filter(item => !selectedIds.includes(item.id)));
                if (viewEmail && selectedIds.includes(viewEmail.id)) {
                    setViewEmail(null);
                }
                setSelectedIds([]);
                if (res.stats) setStats(res.stats);
                showToast(res.message, 'success');
            }
        } catch (err) {
            showToast(err.message || 'فشل حذف الرسائل.', 'error');
        } finally {
            setDeleteConfirm({ open: false, type: 'single', id: null, count: 0 });
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;
        try {
            const res = await api.post('/emails/bulk-action', { ids: selectedIds, action });
            setEmails(prev => prev.map(item => {
                if (!selectedIds.includes(item.id)) return item;
                if (action === 'mark_read') return { ...item, is_read: true };
                if (action === 'mark_unread') return { ...item, is_read: false };
                if (action === 'star') return { ...item, is_starred: true };
                if (action === 'unstar') return { ...item, is_starred: false };
                return item;
            }));
            if (res.stats) setStats(res.stats);
            showToast(res.message, 'success');
            setSelectedIds([]);
        } catch (err) {
            showToast(err.message || 'فشل تنفيذ الإجراء الجماعي.', 'error');
        }
    };

    const handleToggleSelectAll = () => {
        if (selectedIds.length === emails.length && emails.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(emails.map(e => e.id));
        }
    };

    const handleToggleSelectOne = (id, e) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                            <span>{t('emails')}</span>
                            <span className="text-slate-300 font-light">&bull;</span>
                            <span className="text-indigo-600 font-bold text-lg">مركز إدارة المراسلات</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            سجل وإدارة الرسائل الصادرة والواردة، الرد وإعادة التوجيه، التمييز والحذف الجماعي.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* IMAP Sync Button */}
                        <button
                            onClick={handleSyncImap}
                            disabled={syncingImap}
                            className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                            title="فحص واستيراد الرسائل الجديدة من خادم البريد (IMAP)"
                        >
                            <span>🔄</span>
                            <span>{syncingImap ? 'جاري الفحص...' : 'فحص الوارد (IMAP)'}</span>
                        </button>

                        {/* Simulate Received Reply Button */}
                        <button
                            onClick={() => setReplyModalOpen(true)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                            title="محاكاة استقبال رد من متقدم لتجربة استقبال الرسائل"
                        >
                            <span>📥</span>
                            <span>{t('simulateApplicantReply')}</span>
                        </button>

                        {/* Compose Email Button */}
                        <button
                            onClick={() => {
                                setComposeForm({ recipient_email: '', subject: '', body: '', template_name: 'custom', applicant_id: null });
                                setComposeModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5"
                        >
                            <span>✍️</span>
                            <span>{t('composeEmail')}</span>
                        </button>
                    </div>
                </div>

                {/* Filter Tabs & Search */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {[
                            { id: 'all', label: 'كافة الرسائل', count: stats.total || 0, icon: '📬' },
                            { id: 'sent', label: t('sentEmails'), count: stats.sent || 0, icon: '📤' },
                            { id: 'received', label: t('receivedEmails'), count: stats.received || 0, icon: '📥' },
                            { id: 'unread', label: t('unreadEmails'), count: stats.unread || 0, icon: '✉️', highlight: (stats.unread || 0) > 0 },
                            { id: 'starred', label: t('starredEmails'), count: stats.starred || 0, icon: '⭐' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveType(tab.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                    activeType === tab.id
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                                    activeType === tab.id
                                        ? 'bg-indigo-800 text-white'
                                        : tab.highlight
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ابحث بموضوع الرسالة، البريد الإلكتروني، أو المحتوى..."
                            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
                        >
                            {t('search')}
                        </button>
                    </form>
                </div>

                {/* Bulk Actions Floating / Top Bar */}
                {selectedIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-200 shadow-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                            <span className="text-xs font-black text-indigo-950">
                                تم تحديد {selectedIds.length} من {emails.length} رسائل
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                onClick={() => handleBulkAction('mark_read')}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                                title={t('markAsRead')}
                            >
                                <span>📖</span>
                                <span>{t('markAsRead')}</span>
                            </button>
                            <button
                                onClick={() => handleBulkAction('mark_unread')}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                                title={t('markAsUnread')}
                            >
                                <span>✉️</span>
                                <span>{t('markAsUnread')}</span>
                            </button>
                            <button
                                onClick={() => handleBulkAction('star')}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                                title={t('starEmail')}
                            >
                                <span>⭐</span>
                                <span>{t('starEmail')}</span>
                            </button>
                            <button
                                onClick={() => handleBulkAction('unstar')}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                                title={t('unstarEmail')}
                            >
                                <span>☆</span>
                                <span>{t('unstarEmail')}</span>
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                                title={t('deleteSelected')}
                            >
                                <span>🗑️</span>
                                <span>{t('deleteSelected')}</span>
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold"
                            >
                                إلغاء التحديد
                            </button>
                        </div>
                    </div>
                )}

                {/* Emails List */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* List Header with Select All */}
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={emails.length > 0 && selectedIds.length === emails.length}
                                    onChange={handleToggleSelectAll}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="font-bold text-slate-700">تحديد الكل</span>
                            </label>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                            عدد الرسائل: {emails.length}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="py-16 text-center text-slate-400">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                جاري تحميل الرسائل...
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="py-16 text-center text-slate-400">
                                لا توجد رسائل مطابقة.
                            </div>
                        ) : (
                            emails.map(email => {
                                const isUnread = !email.is_read;
                                const isSelected = selectedIds.includes(email.id);

                                return (
                                    <div
                                        key={email.id}
                                        onClick={() => handleOpenView(email)}
                                        className={`group p-4 sm:px-6 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                                            isSelected ? 'bg-indigo-50/50' : isUnread ? 'bg-indigo-50/15' : 'bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => handleToggleSelectOne(email.id, e)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-2 shrink-0"
                                            />

                                            {/* Star Toggle */}
                                            <button
                                                onClick={(e) => handleToggleStar(email, e)}
                                                className={`text-lg transition-transform hover:scale-125 mt-1 shrink-0 p-0.5 ${
                                                    email.is_starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'
                                                }`}
                                                title={email.is_starred ? 'إزالة التمييز بنجمة' : 'تمييز بنجمة'}
                                            >
                                                {email.is_starred ? '★' : '☆'}
                                            </button>

                                            {/* Direction Icon */}
                                            <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                email.type === 'received'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                                {email.type === 'received' ? '📥' : '📤'}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    {/* Unread indicator dot */}
                                                    {isUnread && (
                                                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="غير مقروءة"></span>
                                                    )}

                                                    <span className={`text-xs ${isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                        {email.type === 'received' ? email.sender_email : email.recipient_email}
                                                    </span>

                                                    {email.applicant && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                                            {email.applicant.full_name}
                                                        </span>
                                                    )}

                                                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                                        email.type === 'received' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                                                    }`}>
                                                        {email.type === 'received' ? 'وارد' : 'صادر'}
                                                    </span>

                                                    {isUnread && (
                                                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700">
                                                            جديدة
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className={`text-xs truncate ${isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                    {email.subject}
                                                </h4>

                                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                    {email.body}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Row Right: Date & Quick Actions on hover */}
                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                                            {/* Quick Actions (Always visible on mobile or hover on desktop) */}
                                            <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleToggleRead(email, e)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all text-xs"
                                                    title={email.is_read ? t('markAsUnread') : t('markAsRead')}
                                                >
                                                    {email.is_read ? '✉️' : '📖'}
                                                </button>
                                                <button
                                                    onClick={(e) => handleReply(email, e)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all text-xs"
                                                    title={t('reply')}
                                                >
                                                    ↩️
                                                </button>
                                                <button
                                                    onClick={(e) => handleForward(email, e)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all text-xs"
                                                    title={t('forward')}
                                                >
                                                    ↪️
                                                </button>
                                                <button
                                                    onClick={(e) => handleSingleDelete(email, e)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all text-xs"
                                                    title={t('deleteEmail')}
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            <div className="text-end text-[11px] text-slate-400 whitespace-nowrap">
                                                {new Date(email.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: View Full Email */}
            {viewEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        {/* Modal Header & Quick Actions */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    viewEmail.type === 'received' ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-800'
                                }`}>
                                    {viewEmail.type === 'received' ? '📥 رسالة واردة' : '📤 رسالة صادرة'}
                                </span>
                                {viewEmail.is_starred && (
                                    <span className="text-amber-400 text-sm">★</span>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handleToggleStar(viewEmail)}
                                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-amber-500 transition-all"
                                    title={viewEmail.is_starred ? 'إزالة التمييز بنجمة' : 'تمييز بنجمة'}
                                >
                                    {viewEmail.is_starred ? '★ مميزة' : '☆ تمييز'}
                                </button>
                                <button
                                    onClick={() => handleToggleRead(viewEmail)}
                                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 transition-all"
                                    title={viewEmail.is_read ? 'تعليم كغير مقروء' : 'تعليم كمقروء'}
                                >
                                    {viewEmail.is_read ? '✉️ غير مقروء' : '📖 مقروء'}
                                </button>
                                <button
                                    onClick={() => handleSingleDelete(viewEmail)}
                                    className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs text-rose-600 transition-all"
                                    title="حذف الرسالة"
                                >
                                    🗑️
                                </button>
                                <button
                                    onClick={() => setViewEmail(null)}
                                    className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-3 mb-6 text-xs text-slate-600">
                            <div>
                                <span className="font-bold text-slate-400 block mb-0.5">الموضوع:</span>
                                <h3 className="font-black text-sm text-slate-800">{viewEmail.subject}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                                <div>
                                    <span className="text-slate-400 block">من:</span>
                                    <span className="font-semibold text-slate-700 break-all">{viewEmail.sender_email}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">إلى:</span>
                                    <span className="font-semibold text-slate-700 break-all">{viewEmail.recipient_email}</span>
                                </div>
                                <div className="col-span-2 pt-1 border-t border-slate-200/60 text-slate-400 text-[11px] flex justify-between">
                                    <span>التاريخ: {new Date(viewEmail.created_at).toLocaleString('ar-EG')}</span>
                                    {viewEmail.applicant && (
                                        <span className="font-bold text-indigo-600">
                                            المتقدم: {viewEmail.applicant.full_name} ({viewEmail.applicant.application_number})
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <span className="font-bold text-slate-400 block mb-1">نص الرسالة:</span>
                                <div className="p-4 rounded-2xl bg-white border border-slate-200 whitespace-pre-line leading-relaxed text-slate-800 max-h-64 overflow-y-auto">
                                    {viewEmail.body}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer with Reply & Forward */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleReply(viewEmail)}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                                >
                                    <span>↩️</span>
                                    <span>{t('reply')}</span>
                                </button>
                                <button
                                    onClick={() => handleForward(viewEmail)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                                >
                                    <span>↪️</span>
                                    <span>{t('forward')}</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setViewEmail(null)}
                                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {deleteConfirm.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xl mx-auto mb-3">
                            🗑️
                        </div>
                        <h3 className="font-bold text-sm text-slate-800 mb-1">
                            تأكيد حذف الرسائل
                        </h3>
                        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                            {deleteConfirm.type === 'single'
                                ? 'هل أنت متأكد من رغبتك في حذف هذه الرسالة من السجل نهائياً؟'
                                : `هل أنت متأكد من رغبتك في حذف (${deleteConfirm.count}) رسائل محددة نهائياً؟`}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => setDeleteConfirm({ open: false, type: 'single', id: null, count: 0 })}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all"
                            >
                                نعم، احذف الآن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Compose New Email (or Reply / Forward) */}
            {composeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                <span>✍️</span>
                                <span>{t('composeEmail')}</span>
                            </h3>
                            <button
                                onClick={() => setComposeModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Template Picker */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                {t('selectTemplate')} (اختياري)
                            </label>
                            <select
                                onChange={e => handleSelectTemplate(e.target.value)}
                                defaultValue=""
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                            >
                                <option value="">-- رسالة مخصصة (Custom Message) --</option>
                                {templates.map(tpl => (
                                    <option key={tpl.id} value={tpl.id}>{tpl.title_ar} ({tpl.title_en})</option>
                                ))}
                            </select>
                        </div>

                        <form onSubmit={handleSendEmail} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('recipient')} *</label>
                                <input
                                    type="email"
                                    required
                                    value={composeForm.recipient_email}
                                    onChange={e => setComposeForm({ ...composeForm, recipient_email: e.target.value })}
                                    placeholder="candidate@example.com"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('subject')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={composeForm.subject}
                                    onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })}
                                    placeholder="موضوع الرسالة..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('body')} *</label>
                                <textarea
                                    rows={5}
                                    required
                                    value={composeForm.body}
                                    onChange={e => setComposeForm({ ...composeForm, body: e.target.value })}
                                    placeholder="اكتب محتوى الرسالة هنا..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setComposeModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 disabled:opacity-50"
                                >
                                    {sending ? 'جاري الإرسال...' : t('sendEmail')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Simulate Applicant Reply */}
            {replyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                {t('simulateApplicantReply')}
                            </h3>
                            <button
                                onClick={() => setReplyModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            هذه الميزة تمكنك من تجربة دورة المراسلات كاملة واستقبال ردود وهمية من المتقدمين تظهر فوراً في صندوق الوارد وقائمة الإشعارات.
                        </p>

                        <form onSubmit={handleSimulateReply} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">المتقدم المرسل *</label>
                                <select
                                    value={replyForm.applicant_id}
                                    onChange={e => setReplyForm({ ...replyForm, applicant_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                >
                                    {applicantsList.map(app => (
                                        <option key={app.id} value={app.id}>
                                            {app.full_name} ({app.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('subject')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={replyForm.subject}
                                    onChange={e => setReplyForm({ ...replyForm, subject: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('body')} *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={replyForm.body}
                                    onChange={e => setReplyForm({ ...replyForm, body: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setReplyModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-100"
                                >
                                    تسجيل الرد الوارد
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
