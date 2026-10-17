import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import IconButton from '../components/IconButton';
import SmartEditor from '../components/SmartEditor';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function ScorecardsPage({ currentRoute, navigate }) {
    const { t, isRtl } = useLanguage();
    const { hasPermission } = useAuth();
    const { showToast } = useToast();

    const [templates, setTemplates] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        position: '',
        description: '',
        is_active: true,
        questions: [
            { id: 'q_1', question: '', category: 'المهارات الفنية', expected_answer: '', max_score: 25 },
            { id: 'q_2', question: '', category: 'حل المشكلات', expected_answer: '', max_score: 25 },
            { id: 'q_3', question: '', category: 'التواصل والعمل الجماعي', expected_answer: '', max_score: 25 },
            { id: 'q_4', question: '', category: 'الالتزام والانضباط', expected_answer: '', max_score: 25 },
        ]
    });

    const [expandedTemplateId, setExpandedTemplateId] = useState(null);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/scorecard-templates', { search });
            setTemplates(res.data || []);
            setStats(res.stats || {});
        } catch (e) {
            showToast('فشل تحميل كروت التقييم.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const openCreateModal = () => {
        setEditingTemplate(null);
        setFormData({
            title: '',
            position: '',
            description: '',
            is_active: true,
            questions: [
                { id: 'q_' + Date.now() + '_1', question: '', category: 'المهارات الفنية', expected_answer: '', max_score: 25 },
                { id: 'q_' + Date.now() + '_2', question: '', category: 'حل المشكلات', expected_answer: '', max_score: 25 },
                { id: 'q_' + Date.now() + '_3', question: '', category: 'التواصل والعمل الجماعي', expected_answer: '', max_score: 25 },
                { id: 'q_' + Date.now() + '_4', question: '', category: 'الالتزام والانضباط', expected_answer: '', max_score: 25 },
            ]
        });
        setModalOpen(true);
    };

    const openEditModal = (tpl) => {
        setEditingTemplate(tpl);
        setFormData({
            title: tpl.title || '',
            position: tpl.position || '',
            description: tpl.description || '',
            is_active: tpl.is_active ?? true,
            questions: Array.isArray(tpl.questions) && tpl.questions.length > 0
                ? tpl.questions.map((q, idx) => ({
                    id: q.id || ('q_' + (idx + 1)),
                    question: q.question || '',
                    category: q.category || 'عام',
                    expected_answer: q.expected_answer || '',
                    max_score: Number(q.max_score) || 10
                }))
                : [
                    { id: 'q_1', question: '', category: 'عام', expected_answer: '', max_score: 10 }
                ]
        });
        setModalOpen(true);
    };

    const handleAddQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    id: 'q_' + Date.now() + '_' + (prev.questions.length + 1),
                    question: '',
                    category: 'عام',
                    expected_answer: '',
                    max_score: 10
                }
            ]
        }));
    };

    const handleRemoveQuestion = (index) => {
        if (formData.questions.length <= 1) {
            showToast('يجب أن يحتوي كرت التقييم على سؤال واحد على الأقل.', 'warning');
            return;
        }
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const handleQuestionChange = (index, field, value) => {
        setFormData(prev => {
            const nextQuestions = [...prev.questions];
            nextQuestions[index] = {
                ...nextQuestions[index],
                [field]: field === 'max_score' ? (Number(value) || 0) : value
            };
            return { ...prev, questions: nextQuestions };
        });
    };

    const totalQuestionsMaxScore = formData.questions.reduce((sum, q) => sum + (Number(q.max_score) || 0), 0);

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            showToast('يرجى إدخال عنوان كرت التقييم.', 'warning');
            return;
        }
        const hasEmptyQuestions = formData.questions.some(q => !q.question.trim());
        if (hasEmptyQuestions) {
            showToast('يرجى إدخال نص جميع الأسئلة أو حذف الحقول الفارغة.', 'warning');
            return;
        }

        setSaving(true);
        try {
            if (editingTemplate) {
                await api.put(`/scorecard-templates/${editingTemplate.id}`, formData);
                showToast('تم تحديث كرت التقييم بنجاح!', 'success');
            } else {
                await api.post('/scorecard-templates', formData);
                showToast('تم إنشاء كرت التقييم بنجاح!', 'success');
            }
            setModalOpen(false);
            loadTemplates();
        } catch (err) {
            showToast(err.message || 'فشل حفظ كرت التقييم.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTemplate = async (tpl) => {
        if (!window.confirm(`هل أنت متأكد من حذف كرت التقييم (${tpl.title})؟`)) {
            return;
        }
        try {
            await api.delete(`/scorecard-templates/${tpl.id}`);
            showToast('تم حذف كرت التقييم بنجاح.', 'success');
            loadTemplates();
        } catch (err) {
            showToast(err.message || 'فشل حذف كرت التقييم.', 'error');
        }
    };

    const filteredTemplates = templates.filter(tpl => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            tpl.title?.toLowerCase().includes(q) ||
            tpl.position?.toLowerCase().includes(q) ||
            tpl.description?.toLowerCase().includes(q)
        );
    });

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-4">
                {/* 1. Standard Page Header Box (ADR-002) */}
                <PageHeader
                    title={t('navScorecards')}
                    subtitle={t('scorecardsSubtitle')}
                    icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                >
                    <IconButton
                        onClick={loadTemplates}
                        tooltip={t('refreshStats')}
                        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                    <IconButton
                        variant="primary"
                        onClick={openCreateModal}
                        tooltip={t('newScorecard')}
                        icon="M12 4v16m8-8H4"
                    />
                </PageHeader>

                {/* 2. KPI Summary Cards Row (ADR-005) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between shadow-2xs">
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('activeTemplates')}</p>
                            <h3 className="text-xl font-black text-slate-900 mt-1">{stats.total ?? templates.length}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between shadow-2xs">
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('totalQuestions')}</p>
                            <h3 className="text-xl font-black text-slate-900 mt-1">{stats.total_questions ?? 0}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between shadow-2xs">
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('avgMaxScore')}</p>
                            <h3 className="text-xl font-black text-slate-900 mt-1">{stats.avg_score ?? 100}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between shadow-2xs">
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('interviews')}</p>
                            <h3 className="text-xl font-black text-slate-900 mt-1">
                                <button
                                    onClick={() => navigate('#/interviews')}
                                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                >
                                    {t('navInterviewsList')} ←
                                </button>
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 3. Unified Data Card (ADR-005) */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                    {/* Top Toolbar */}
                    <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="بحث في كروت التقييم أو المسمى..."
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pe-8 focus:outline-none focus:border-blue-600 focus:bg-white"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute end-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                            عرض <span className="font-bold text-slate-900">{filteredTemplates.length}</span> نموذج تقييم
                        </div>
                    </div>

                    {/* Content List / Cards */}
                    {loading ? (
                        <div className="p-12 text-center text-xs font-bold text-slate-400">
                            جاري تحميل كروت التقييم...
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">لا توجد كروت تقييم مطابقة</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                يمكنك إنشاء كرت تقييم جديد بالضغط على زر الإضافة أعلاه وتحديد الأسئلة والأوزان.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredTemplates.map(tpl => {
                                const isExpanded = expandedTemplateId === tpl.id;
                                const questionsList = Array.isArray(tpl.questions) ? tpl.questions : [];
                                return (
                                    <div key={tpl.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="text-sm font-bold text-slate-900">
                                                        {tpl.title}
                                                    </h3>
                                                    {tpl.position && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                                            {tpl.position}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                                        الدرجة الكلية: {tpl.total_max_score}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        ({questionsList.length} أسئلة)
                                                    </span>
                                                </div>
                                                {tpl.description && (
                                                    <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                                                        {tpl.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                                                <IconButton
                                                    onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                                                    tooltip={isExpanded ? 'إخفاء تفاصيل الأسئلة' : 'معاينة الأسئلة والإجابات'}
                                                    icon={isExpanded
                                                        ? 'M5 15l7-7 7 7'
                                                        : 'M19 9l-7 7-7-7'
                                                    }
                                                />
                                                <IconButton
                                                    onClick={() => openEditModal(tpl)}
                                                    tooltip={t('editScorecard')}
                                                    icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                />
                                                <IconButton
                                                    onClick={() => handleDeleteTemplate(tpl)}
                                                    tooltip="حذف النموذج"
                                                    icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </div>
                                        </div>

                                        {/* Expanded Questions Details */}
                                        {isExpanded && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/80 rounded-lg p-3 space-y-2">
                                                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                                                    <span>قائمة الأسئلة وهيكل الإجابة المتوقعة:</span>
                                                    <span className="text-[11px] font-semibold text-slate-500">المجموع: {tpl.total_max_score} درجة</span>
                                                </h4>
                                                {questionsList.map((q, idx) => (
                                                    <div key={q.id || idx} className="bg-white border border-slate-200 rounded-md p-2.5 text-xs">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="font-bold text-slate-800">
                                                                <span className="text-blue-600 ms-1">س{idx + 1}:</span> {q.question}
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                                    {q.category || 'عام'}
                                                                </span>
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                                                    {q.max_score} درجة
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {q.expected_answer && (
                                                            <div className="mt-2 text-[11px] bg-slate-50 text-slate-600 p-2.5 rounded border border-slate-100">
                                                                <span className="font-bold text-slate-700 block mb-1">الإجابة / الهيكل النموذجي المتوقع:</span>
                                                                <div
                                                                    className="prose prose-xs max-w-none text-slate-700 leading-relaxed [&_h3]:font-bold [&_h3]:text-slate-900 [&_h4]:font-bold [&_h4]:text-slate-800 [&_ul]:list-disc [&_ul]:ps-4 [&_ol]:list-decimal [&_ol]:ps-4"
                                                                    dangerouslySetInnerHTML={{ __html: q.expected_answer }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Create / Edit Scorecard Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs">
                        <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {/* Modal Header */}
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        {editingTemplate ? t('editScorecard') : t('newScorecard')}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            {t('scorecardTitle')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="مثلاً: مقابلة مطور برمجيات، تقييم كاتب محتوى..."
                                            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            {t('scorecardPosition')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            placeholder="المسار المستهدف (اختياري)..."
                                            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {t('scorecardDesc')}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="وصف مختصر للغرض من هذا النموذج ومعايير المقابلة..."
                                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                                    />
                                </div>

                                {/* Questions Section */}
                                <div className="border-t border-slate-100 pt-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                                <span>أسئلة التقييم وأوزان الدرجات</span>
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                    إجمالي الدرجات: {totalQuestionsMaxScore}
                                                </span>
                                            </h4>
                                            <p className="text-[11px] text-slate-400">حدد نص كل سؤال، هيكل الإجابة المتوقعة لتوجيه المحكّم، ودرجة السؤال.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddQuestion}
                                            className="px-2.5 py-1.5 rounded-md text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span>{t('addQuestion')}</span>
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.questions.map((q, idx) => (
                                            <div key={q.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-black text-blue-600">سؤال {idx + 1}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <label className="text-[11px] font-semibold text-slate-500">الدرجة القصوى:</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="100"
                                                                value={q.max_score}
                                                                onChange={(e) => handleQuestionChange(idx, 'max_score', e.target.value)}
                                                                className="w-16 text-center text-xs font-bold bg-white border border-slate-300 rounded px-1.5 py-1"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveQuestion(idx)}
                                                            className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                                                            title="حذف هذا السؤال"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <div className="sm:col-span-2">
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="نص السؤال الذي يطرحه المقابل..."
                                                            value={q.question}
                                                            onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)}
                                                            className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="التصنيف (فني، تواصل، سلوكي...)"
                                                            value={q.category}
                                                            onChange={(e) => handleQuestionChange(idx, 'category', e.target.value)}
                                                            className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                        هيكل الإجابة المتوقعة والنقاط الرئيسية:
                                                    </label>
                                                    <SmartEditor
                                                        value={q.expected_answer || ''}
                                                        onChange={(val) => handleQuestionChange(idx, 'expected_answer', val)}
                                                        placeholder="هيكل الإجابة المتوقعة والنقاط الرئيسية التي يبحث عنها المحكّم في الإجابة..."
                                                        minHeight="85px"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {saving ? 'جاري الحفظ...' : 'حفظ كرت التقييم'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
