import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function InterviewReportModal({ interviewId, isOpen, onClose }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [generatingAi, setGeneratingAi] = useState(false);
    const [reportData, setReportData] = useState(null);

    const loadData = async () => {
        if (!interviewId) return;
        setLoading(true);
        try {
            const res = await api.get(`/interviews/${interviewId}/report-data`);
            setReportData(res);
        } catch (err) {
            showToast('تعذر تحميل بيانات التقرير والشهادة.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && interviewId) {
            loadData();
        }
    }, [isOpen, interviewId]);

    const handleGenerateAi = async () => {
        setGeneratingAi(true);
        try {
            const res = await api.post(`/interviews/${interviewId}/generate-ai-report`);
            showToast('تم تحديث التقرير والشهادة بالذكاء الاصطناعي بنجاح!', 'success');
            await loadData();
        } catch (err) {
            showToast(err.message || 'فشل توليد تقرير الذكاء الاصطناعي.', 'error');
        } finally {
            setGeneratingAi(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    const interview = reportData?.interview || {};
    const applicant = reportData?.applicant || {};
    const interviewer = reportData?.interviewer || {};
    const aiReport = reportData?.ai_report || {};
    const dates = reportData?.dates || {};
    const questions = Array.isArray(interview?.questions) ? interview.questions : [];

    const percentage = Number(interview.overall_percentage || aiReport.overall_percentage || 0);
    const totalScore = interview.total_score ?? questions.reduce((s, q) => s + (Number(q.score) || 0), 0);
    const maxScore = interview.max_score ?? questions.reduce((s, q) => s + (Number(q.max_score) || 10), 0);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex justify-center p-0 sm:p-4 print:p-0 print:bg-white print:static">
            {/* Top Toolbar (Hidden on print) */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-amber-500/40 text-white px-4 py-3 flex items-center justify-between shadow-xl print:hidden">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                        ⚜️
                    </span>
                    <div>
                        <h3 className="text-sm font-black text-amber-300">منظومة موثِق | التقرير التنفيذي والشهادة الملكية</h3>
                        <p className="text-[11px] text-slate-300">مرشح الشراكة: {applicant.full_name || '...'} ({applicant.position || '...'})</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleGenerateAi}
                        disabled={generatingAi}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                        <span>✨</span>
                        <span>{generatingAi ? 'جاري التحليل بالذكاء الاصطناعي...' : 'إعادة توليد بالذكاء الاصطناعي'}</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                        <span>🖨️</span>
                        <span>طباعة / حفظ كـ PDF</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                        إغلاق
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div className="mt-16 sm:mt-16 w-full max-w-[210mm] space-y-6 print:m-0 print:w-full print:max-w-none">
                {loading ? (
                    <div className="bg-white rounded-2xl p-16 text-center shadow-2xl">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-bold text-slate-700">جاري إعداد وتجميع التقرير التنفيذي والشهادة الملكية...</p>
                    </div>
                ) : (
                    <>
                        {/* ================= PAGE 1: COVER PAGE ================= */}
                        <div className="bg-white w-[210mm] min-h-[297mm] p-12 mx-auto shadow-2xl relative flex flex-col justify-between print:shadow-none print:w-full print:min-h-screen print:p-8 print:m-0 print:break-after-page">
                            {/* Decorative Corner Ornaments */}
                            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-amber-500 pointer-events-none"></div>
                            <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-amber-500 pointer-events-none"></div>
                            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-amber-500 pointer-events-none"></div>
                            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-amber-500 pointer-events-none"></div>

                            {/* Header */}
                            <div className="text-center pt-6 space-y-2">
                                <div className="inline-block px-4 py-1 rounded-full bg-slate-900 text-amber-300 text-xs font-bold border border-amber-400/50 mb-2">
                                    وثيقة تقييم واعتماد سرية ورسمية
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">منصة «مـوثِـق»</h1>
                                <p className="text-xs font-bold text-amber-600 tracking-widest uppercase">Mawthiq Contributor Evaluation & Competence Protocol</p>
                            </div>

                            {/* Center Content */}
                            <div className="my-auto text-center space-y-8">
                                <div className="space-y-3">
                                    <h2 className="text-2xl font-black text-slate-900">تقرير نتائج مقابلة الشراكة والتقييم الفني</h2>
                                    <p className="text-sm text-slate-500">Executive Partner Assessment & Competence Dossier</p>
                                </div>

                                <div className="max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-amber-50/30 border border-amber-200/80 shadow-xs space-y-3 text-start">
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">اسم الشريك / المرشح:</span>
                                        <strong className="text-xs font-bold text-slate-900">{applicant.full_name}</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">المسار التخصصي:</span>
                                        <strong className="text-xs font-bold text-slate-900">{applicant.position}</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">المحكّم / رئيس اللجنة:</span>
                                        <strong className="text-xs font-bold text-slate-900">{interviewer.name || 'فريق الاعتماد'}</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">تاريخ المقابلة:</span>
                                        <strong className="text-xs font-mono font-bold text-slate-900">{dates.scheduled_riyadh || dates.date_arabic}</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">النتيجة الإجمالية:</span>
                                        <strong className="text-xs font-mono font-black text-amber-700">{totalScore} / {maxScore} ({percentage}%)</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">التوصية النهائية:</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                            {interview.recommendation === 'strong_hire' ? 'قبول واعتماد فوري (Strong Hire)' : (interview.recommendation === 'hire' ? 'قبول شريك (Hire)' : 'تحت الدراسة والتأهيل')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                                <span>إصدار منصة موثِق التقنية © {new Date().getFullYear()}</span>
                                <span>الرمز المرجعي: {applicant.application_no || `APP-${applicant.id}`}</span>
                            </div>
                        </div>

                        {/* ================= PAGE 2: EXECUTIVE REPORT ================= */}
                        <div className="bg-white w-[210mm] min-h-[297mm] p-10 mx-auto shadow-2xl relative flex flex-col justify-between print:shadow-none print:w-full print:min-h-screen print:p-8 print:m-0 print:break-after-page text-xs leading-relaxed">
                            <div className="space-y-6">
                                {/* Page Header */}
                                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                                    <div>
                                        <h2 className="text-base font-black text-slate-900">أولاً: ملخص التقييم التنفيذي والتحليل المعياري</h2>
                                        <p className="text-[11px] text-slate-500">تحليل محاور المقابلة بناءً على مؤشرات قائمة التحقق (Checklist Items)</p>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                                        {dates.date_arabic}
                                    </span>
                                </div>

                                {/* Executive Summary Statement */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span>📋</span>
                                        <span>الملخص التشغيلي لنتائج المقابلة:</span>
                                    </h4>
                                    <p className="text-slate-700 leading-relaxed font-normal">
                                        {aiReport.executive_summary || 'أظهر المرشح كفاءة متميزة في محاور المقابلة الفنية والسلوكية مع التزامه بمعايير الشراكة المقررة.'}
                                    </p>
                                </div>

                                {/* Scorecard Checklist Breakdown Table */}
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2">جدول الأبعاد التقييمية ومؤشرات الإجابة المحققة:</h4>
                                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                                        <table className="w-full text-[11px] text-start">
                                            <thead className="bg-slate-900 text-white font-bold">
                                                <tr>
                                                    <th className="p-2 w-8 text-center">#</th>
                                                    <th className="p-2 w-32">المحور / السؤال</th>
                                                    <th className="p-2">عناصر التحقق المحققة والمفقودة</th>
                                                    <th className="p-2 w-20 text-center">الدرجة</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 bg-white">
                                                {questions.map((q, idx) => {
                                                    const checkedIds = q.checked_items || [];
                                                    const items = q.checklist_items || [];
                                                    return (
                                                        <tr key={q.id || idx} className="hover:bg-slate-50">
                                                            <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                                                            <td className="p-2 font-bold text-slate-800">
                                                                <div>{q.question}</div>
                                                                <span className="text-[10px] text-slate-400 font-normal">{q.category}</span>
                                                            </td>
                                                            <td className="p-2">
                                                                {items.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {items.map((it, iIdx) => {
                                                                            const isDone = checkedIds.includes(it.id);
                                                                            return (
                                                                                <div key={it.id || iIdx} className="flex items-center gap-1.5">
                                                                                    <span className={isDone ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                                                                                        {isDone ? '✓' : '✗'}
                                                                                    </span>
                                                                                    <span className={isDone ? 'text-slate-800' : 'text-slate-400 line-through'}>
                                                                                        {it.text}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 italic">تم التقييم المباشر وفق تقدير المحكّم</span>
                                                                )}
                                                                {q.notes && (
                                                                    <div className="mt-1 text-[10px] text-blue-800 bg-blue-50/70 p-1 rounded">
                                                                        ملاحظة: {q.notes}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-2 text-center font-mono font-bold text-slate-900">
                                                                {q.score ?? '-'} / {q.max_score}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Strengths and Development Areas */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                                        <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                                            <span>🌟</span>
                                            <span>نقاط القوة التنافسية المحققة:</span>
                                        </h4>
                                        <ul className="space-y-1 text-emerald-950 ps-4 list-disc text-[11px]">
                                            {(aiReport.strengths || []).map((s, idx) => (
                                                <li key={idx}>{s}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                                        <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                                            <span>🎯</span>
                                            <span>مجالات التطوير والتأهيل الموصى بها:</span>
                                        </h4>
                                        <ul className="space-y-1 text-amber-950 ps-4 list-disc text-[11px]">
                                            {(aiReport.areas_for_development || []).map((d, idx) => (
                                                <li key={idx}>{d}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Signatures Box */}
                                <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-[10px] text-slate-400">رئيس لجنة المقابلات والتحكيم</p>
                                        <p className="font-bold text-slate-800 mt-1">{interviewer.name || 'فريق الاعتماد'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400">المدير العام والتشغيلي</p>
                                        <p className="font-bold text-slate-800 mt-1">إدارة منصة موثِق</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400">الختم والاعتماد المؤسسي</p>
                                        <div className="inline-block px-3 py-1 mt-1 rounded border border-amber-500/60 text-amber-700 text-[10px] font-bold">
                                            مُعتمد رسمياً ⚜️
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                <span>تقرير داخلي معتمد - منصة موثِق</span>
                                <span>الصفحة 2 من 3</span>
                            </div>
                        </div>

                        {/* ================= PAGE 3: ROYAL GOLDEN CERTIFICATE (#letterPage) ================= */}
                        <div
                            id="letterPage"
                            className="w-[210mm] min-h-[297mm] p-10 mx-auto shadow-2xl relative flex flex-col justify-between print:shadow-none print:w-full print:min-h-screen print:p-8 print:m-0 print:break-after-page text-center select-none"
                            style={{
                                background: 'radial-gradient(ellipse at center, #11284a 0%, #071326 100%)',
                                color: '#FFF8DC',
                                border: '12px double #D4AF37',
                                boxShadow: '0 0 35px rgba(212, 175, 55, 0.35)',
                            }}
                        >
                            {/* Inner Golden Border */}
                            <div className="absolute inset-3 border border-amber-400/40 pointer-events-none"></div>

                            {/* Top Golden Emblem */}
                            <div className="space-y-3 pt-6">
                                <div className="text-4xl text-amber-400 drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]">
                                    ⚜️
                                </div>
                                <h1
                                    className="text-2xl font-black tracking-wider uppercase"
                                    style={{
                                        fontFamily: "'Amiri', serif",
                                        background: 'linear-gradient(90deg, #D4AF37 0%, #FFF3C4 50%, #C9991A 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    مـنـظـومـة مــوثِــق
                                </h1>
                                <p className="text-xs text-cyan-300 font-semibold tracking-widest uppercase">
                                    Mawthiq High Council of Strategic Partnerships
                                </p>
                            </div>

                            {/* Certificate Title */}
                            <div className="my-auto space-y-6 px-6">
                                <div className="inline-block px-6 py-1 rounded-full border border-amber-400/60 bg-amber-500/10 text-amber-300 text-sm font-bold tracking-widest">
                                    شـهــادة جـــدارة واعـتـمــاد شــريـك
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-slate-300 font-serif">يَـسُـرّ إدارة المـنـصـة ولَـجْـنَـة التـحـكِـيـم مَـنْـح هـذه الشَّـهـادَة إلـى:</p>
                                    <h2
                                        className="text-3xl font-black py-2 tracking-wide"
                                        style={{
                                            fontFamily: "'Amiri', serif",
                                            color: '#FFF8DC',
                                            textShadow: '0 0 15px rgba(212,175,55,0.7)',
                                        }}
                                    >
                                        {applicant.full_name}
                                    </h2>
                                    <p className="text-xs text-amber-400 font-bold">
                                        في مسار: ({applicant.position || 'الشراكة التقنية والاستثمارية'})
                                    </p>
                                </div>

                                {/* Calligraphy Golden Body */}
                                <div
                                    className="max-w-xl mx-auto text-sm leading-loose px-4 text-slate-200"
                                    style={{ fontFamily: "'Amiri', serif" }}
                                >
                                    {aiReport.certificate_text ||
                                        `تشهد إدارة منصة «موثِق» ومجلس التحكيم والاعتماد بأنّ الشريك: ${applicant.full_name}، قد اجتاز بنجاح واقتدار كافة مراحل التقييم والمقابلة المقررة لمسار (${applicant.position}) بمعدل جدارة (${percentage}%)، واستوفى معايير الكفاءة المهنية والالتزام المؤسسي المقررة للشراكة، وبناءً عليه مُنح هذه الشهادة المعتمدة تقديراً لتميزه وجدارته في منظومتنا.`}
                                </div>

                                {/* Meta Badges */}
                                <div className="flex items-center justify-center gap-6 pt-2">
                                    <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-amber-400/30 text-amber-300 text-xs font-mono">
                                        معدل الجدارة: {percentage}%
                                    </div>
                                    <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-amber-400/30 text-amber-300 text-xs font-mono">
                                        تاريخ الاعتماد: {dates.date_arabic}
                                    </div>
                                </div>
                            </div>

                            {/* Signatures & Seal */}
                            <div className="pb-6 pt-6 border-t border-amber-400/30 grid grid-cols-3 gap-4 items-center">
                                <div className="space-y-1">
                                    <p className="text-[11px] text-slate-400">رئيس مجلس التحكيم</p>
                                    <p className="text-xs font-bold text-amber-300 font-serif">{interviewer.name || 'فريق الاعتماد'}</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400 text-amber-400 flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                                        ختم الاعتماد
                                    </div>
                                    <span className="text-[10px] text-amber-300/70 mt-1 font-mono">VERIFIED • MOAWTHIQ</span>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[11px] text-slate-400">المدير التنفيذي العام</p>
                                    <p className="text-xs font-bold text-amber-300 font-serif">منصة مــوثِــق</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
