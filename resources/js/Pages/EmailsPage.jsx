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

    // Compose Modal
    const [composeModalOpen, setComposeModalOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [composeForm, setComposeForm] = useState({
        recipient_email: '',
        subject: '',
        body: '',
        template_name: 'custom',
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
            setComposeForm({ recipient_email: '', subject: '', body: '', template_name: 'custom' });
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

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                            {t('emails')} &bull; مركز المراسلات
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            سجل وإدارة الرسائل الصادرة والواردة، القوالب الجاهزة، وإشعارات المتقدمين.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
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
                            onClick={() => setComposeModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5"
                        >
                            <span>✍️</span>
                            <span>{t('composeEmail')}</span>
                        </button>
                    </div>
                </div>

                {/* Filter Tabs & Search */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-1.5">
                        {[
                            { id: 'all', label: 'كافة الرسائل', count: stats.total || 0 },
                            { id: 'sent', label: t('sentEmails'), count: stats.sent || 0 },
                            { id: 'received', label: t('receivedEmails'), count: stats.received || 0 },
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
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    activeType === tab.id ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
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
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                        >
                            {t('search')}
                        </button>
                    </form>
                </div>

                {/* Emails List */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
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
                            emails.map(email => (
                                <div
                                    key={email.id}
                                    onClick={() => setViewEmail(email)}
                                    className="p-4 sm:px-6 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-4"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                            email.type === 'received'
                                                ? 'bg-amber-50 text-amber-600'
                                                : 'bg-indigo-50 text-indigo-600'
                                        }`}>
                                            {email.type === 'received' ? '📥' : '📤'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-bold text-xs text-slate-800">
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
                                            </div>
                                            <h4 className="font-bold text-xs text-slate-700 truncate">
                                                {email.subject}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                {email.body}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-end shrink-0 text-[11px] text-slate-400">
                                        {new Date(email.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: View Full Email */}
            {viewEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                viewEmail.type === 'received' ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-800'
                            }`}>
                                {viewEmail.type === 'received' ? '📥 رسالة واردة' : '📤 رسالة صادرة'}
                            </span>
                            <button
                                onClick={() => setViewEmail(null)}
                                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-3 mb-6 text-xs text-slate-600">
                            <div>
                                <span className="font-bold text-slate-400 block mb-0.5">الموضوع:</span>
                                <h3 className="font-black text-sm text-slate-800">{viewEmail.subject}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                                <div>
                                    <span className="text-slate-400 block">من:</span>
                                    <span className="font-semibold text-slate-700">{viewEmail.sender_email}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">إلى:</span>
                                    <span className="font-semibold text-slate-700">{viewEmail.recipient_email}</span>
                                </div>
                            </div>
                            <div>
                                <span className="font-bold text-slate-400 block mb-1">نص الرسالة:</span>
                                <div className="p-4 rounded-2xl bg-white border border-slate-200 whitespace-pre-line leading-relaxed text-slate-800">
                                    {viewEmail.body}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setViewEmail(null)}
                                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Compose New Email */}
            {composeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                {t('composeEmail')}
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
