import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function InterviewsPage({ currentRoute, navigate }) {
    const { t } = useLanguage();
    const { hasPermission, user } = useAuth();
    const { showToast } = useToast();

    const [interviews, setInterviews] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState('all');

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
            showToast('تم حفظ تقييم ونتائج المقابلة وترقية المتقدم بنجاح!', 'success');
            setResultsModalOpen(false);
            loadInterviews(activeStatus);
        } catch (err) {
            showToast(err.message || 'فشل حفظ نتائج المقابلة.', 'error');
        } finally {
            setSavingResult(false);
        }
    };

    const overallCalculated = Math.round(((Number(resultForm.technical_score) + Number(resultForm.communication_score) + Number(resultForm.commitment_score)) / 3) * 10) / 10;

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                            {t('interviews')}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            جدولة المواعيد، روابط الاجتماعات، وتسجيل تقييمات ودرجات المحكمين.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('#/applicants')}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100"
                        >
                            + اختيار متقدم وجدولة مقابلة
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-3 shadow-xs flex items-center gap-1.5 overflow-x-auto">
                    {[
                        { id: 'all', label: 'الكل', count: stats.total || 0 },
                        { id: 'scheduled', label: 'المجدولة (القادمة)', count: stats.scheduled || 0 },
                        { id: 'completed', label: 'المكتملة والمقيمة', count: stats.completed || 0 },
                        { id: 'cancelled', label: 'الملغاة', count: stats.cancelled || 0 },
                    ].map(tab => (
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

                {/* Interviews List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full py-16 text-center text-slate-400">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            جاري تحميل المقابلات...
                        </div>
                    ) : interviews.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                            لا توجد مقابلات مسجلة في هذا القسم حالياً.
                        </div>
                    ) : (
                        interviews.map(item => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            item.status === 'completed'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : item.status === 'cancelled'
                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        }`}>
                                            {item.status === 'completed' ? 'مكتملة' : item.status === 'cancelled' ? 'ملغاة' : 'مجدولة'}
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-400">
                                            {new Date(item.scheduled_at).toLocaleDateString('ar-EG', { dateStyle: 'short' })}
                                        </span>
                                    </div>

                                    <h4
                                        className="font-bold text-sm text-slate-800 hover:text-indigo-600 cursor-pointer transition-colors"
                                        onClick={() => navigate(`#/applicants/${item.applicant_id}`)}
                                        title="عرض صفحة المتقدم المستقلة"
                                    >
                                        {item.applicant?.full_name} &rarr;
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {item.applicant?.position}
                                    </p>

                                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">الموعد:</span>
                                            <span className="font-semibold text-slate-800">
                                                {new Date(item.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">نوع المقابلة:</span>
                                            <span className="font-semibold text-slate-800">
                                                {item.interview_type === 'online' ? 'أونلاين (عبر الإنترنت)' : 'حضوري'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">المحكّم:</span>
                                            <span className="font-semibold text-slate-800">
                                                {item.interviewer?.name || 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Evaluation Results if completed */}
                                    {item.status === 'completed' && (
                                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-700">النتيجة الإجمالية:</span>
                                                <span className="font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                                    {item.overall_score} / 10
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                <span>التوصية:</span>
                                                <span className="font-semibold text-emerald-700">{t(`recommendation_${item.recommendation}`) || item.recommendation}</span>
                                            </div>
                                            {item.feedback && (
                                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 italic">
                                                    "{item.feedback}"
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    {item.meeting_link ? (
                                        <a
                                            href={item.meeting_link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors"
                                        >
                                            🌐 رابط الاجتماع
                                        </a>
                                    ) : (
                                        <span className="text-[11px] text-slate-400">حضوري في المقر</span>
                                    )}

                                    {/* Record Results Button */}
                                    {hasPermission('record_interview_results') && (
                                        <button
                                            onClick={() => openRecordResults(item)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
                                        >
                                            {item.status === 'completed' ? 'تعديل التقييم' : 'تسجيل النتيجة'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal: Record Interview Results & Evaluation Form */}
            {resultsModalOpen && selectedInterview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                {t('recordResults')} &bull; بطاقة التقييم
                            </h3>
                            <button
                                onClick={() => setResultsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                            <p className="font-bold">{selectedInterview.applicant?.full_name}</p>
                            <p className="text-[11px] text-indigo-700 mt-0.5">{selectedInterview.applicant?.position}</p>
                        </div>

                        <form onSubmit={handleSaveResult} className="space-y-4">
                            {/* Technical Score Slider */}
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>{t('technicalScore')}</span>
                                    <span className="text-indigo-600 font-mono text-sm">{resultForm.technical_score} / 10</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={resultForm.technical_score}
                                    onChange={e => setResultForm({ ...resultForm, technical_score: e.target.value })}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            {/* Communication Score Slider */}
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>{t('communicationScore')}</span>
                                    <span className="text-indigo-600 font-mono text-sm">{resultForm.communication_score} / 10</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={resultForm.communication_score}
                                    onChange={e => setResultForm({ ...resultForm, communication_score: e.target.value })}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            {/* Commitment Score Slider */}
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>{t('commitmentScore')}</span>
                                    <span className="text-indigo-600 font-mono text-sm">{resultForm.commitment_score} / 10</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={resultForm.commitment_score}
                                    onChange={e => setResultForm({ ...resultForm, commitment_score: e.target.value })}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            {/* Calculated Overall Score */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">المعدل الإجمالي المحسوب:</span>
                                <span className="text-lg font-black text-indigo-700 font-mono">{overallCalculated} / 10</span>
                            </div>

                            {/* Recommendation */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('recommendation')} *
                                </label>
                                <select
                                    value={resultForm.recommendation}
                                    onChange={e => setResultForm({ ...resultForm, recommendation: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="strong_hire">{t('recommendation_strong_hire')}</option>
                                    <option value="hire">{t('recommendation_hire')}</option>
                                    <option value="under_consideration">{t('recommendation_under_consideration')}</option>
                                    <option value="reject">{t('recommendation_reject')}</option>
                                </select>
                            </div>

                            {/* Auto promote stage */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('autoPromoteOnResult')}
                                </label>
                                <select
                                    value={resultForm.promote_to_status}
                                    onChange={e => setResultForm({ ...resultForm, promote_to_status: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="probation">{t('status_probation')} (نقل لفترة الاختبار والتجربة)</option>
                                    <option value="accepted">{t('status_accepted')} (قبول واعتماد نهائي)</option>
                                    <option value="rejected">{t('status_rejected')} (رفض واعتذار)</option>
                                    <option value="participant">{t('status_participant')} (إبقاء كمشارك)</option>
                                </select>
                            </div>

                            {/* Feedback notes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('feedbackNotes')} *
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={resultForm.feedback}
                                    onChange={e => setResultForm({ ...resultForm, feedback: e.target.value })}
                                    placeholder="سجل نقاط القوة، مجالات التحسين، وأبرز الملاحظات أثناء المقابلة..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setResultsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingResult}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 disabled:opacity-50"
                                >
                                    {savingResult ? 'جاري الحفظ...' : 'اعتماد وحفظ النتيجة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
