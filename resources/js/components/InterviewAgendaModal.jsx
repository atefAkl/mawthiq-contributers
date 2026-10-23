import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function InterviewAgendaModal({ interviewId, isOpen, onClose }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [agenda, setAgenda] = useState(null);

    useEffect(() => {
        if (isOpen && interviewId) {
            setLoading(true);
            api.get(`/interviews/${interviewId}/agenda-data`)
                .then(res => setAgenda(res))
                .catch(() => showToast('تعذر تحميل بيانات الأجندة.', 'error'))
                .finally(() => setLoading(false));
        }
    }, [isOpen, interviewId]);

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    const data = agenda || {};

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex justify-center p-0 sm:p-4 print:p-0 print:bg-white print:static">
            {/* Top Toolbar (Hidden on print) */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-amber-500/40 text-white px-4 py-3 flex items-center justify-between shadow-xl print:hidden">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                        📅
                    </span>
                    <div>
                        <h3 className="text-sm font-black text-amber-300">أجندة لقاء التعارف والتمكين التقني</h3>
                        <p className="text-[11px] text-slate-300">الشريك: {data.applicant_name || '...'} ({data.position || '...'})</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
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
            <div className="mt-16 sm:mt-16 w-full max-w-[210mm] space-y-6 print:m-0 print:w-full print:max-w-none text-slate-800">
                {loading ? (
                    <div className="bg-white rounded-2xl p-16 text-center shadow-2xl">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-bold text-slate-700">جاري إعداد وتحضير وثيقة أجندة اللقاء...</p>
                    </div>
                ) : (
                    <>
                        {/* ================= PAGE 1: AGENDA COVER ================= */}
                        <div className="bg-white w-[210mm] min-h-[297mm] p-12 mx-auto shadow-2xl relative flex flex-col justify-between print:shadow-none print:w-full print:min-h-screen print:p-8 print:m-0 print:break-after-page">
                            {/* Decorative background shapes */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/5 rounded-bl-full pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-tr-full pointer-events-none"></div>

                            {/* Header */}
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900">مـنـظـومـة مــوثِــق</h1>
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Mawthiq Partners Ecosystem</p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    أجندة لقاء التعارف والشراكة
                                </span>
                            </div>

                            {/* Main Body */}
                            <div className="my-auto space-y-8">
                                <div className="space-y-3 text-center">
                                    <div className="inline-block p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-700 text-4xl mb-2">
                                        🤝
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 leading-tight">
                                        أجندة لقاء التعارف<br />والتمكين التقني والاستثماري
                                    </h2>
                                    <p className="text-sm text-slate-500 max-w-lg mx-auto">
                                        وثيقة إرشادية تتضمن محاور اللقاء الزمني، نموذج الشراكة، وتطلعات التعاون المشترك بين منصة موثق والشريك المتقدم.
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-lg mx-auto space-y-3">
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">اسم الشريك:</span>
                                        <strong className="text-xs font-bold text-slate-900">{data.applicant_name}</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">المسار المستهدف:</span>
                                        <strong className="text-xs font-bold text-slate-900">{data.position}</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">اليوم والتاريخ:</span>
                                        <strong className="text-xs font-bold text-slate-900">{data.day_name_ar} - {data.scheduled_date}</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">التوقيت المعتمد:</span>
                                        <strong className="text-xs font-mono font-bold text-amber-700">{data.time_window}</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs text-slate-500">المدة الإجمالية:</span>
                                        <strong className="text-xs font-bold text-slate-900">{data.duration}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">رابط اللقاء:</span>
                                        <a href={data.meeting_link} target="_blank" rel="noreferrer" className="text-xs font-mono font-bold text-blue-600 hover:underline">
                                            {data.meeting_link}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t pt-4 flex items-center justify-between text-xs text-slate-400">
                                <span>إدارة الشراكات والتمكين - منصة موثِق</span>
                                <span>الصفحة 1 من 4</span>
                            </div>
                        </div>

                        {/* ================= PAGE 2: TIMELINE SCHEDULE ================= */}
                        <div className="bg-white w-[210mm] min-h-[297mm] p-10 mx-auto shadow-2xl relative flex flex-col justify-between print:shadow-none print:w-full print:min-h-screen print:p-8 print:m-0 print:break-after-page text-xs leading-relaxed">
                            <div className="space-y-6">
                                <div className="border-b pb-3">
                                    <h3 className="text-base font-black text-slate-900">ثانياً: خطة التدفق الزمني للقاء التعارف (25 دقيقة)</h3>
                                    <p className="text-[11px] text-slate-500">توزيع دقيق للوقت لضمان تحقيق أقصى قيمة وتوافق مهني واستثماري</p>
                                </div>

                                <div className="space-y-3">
                                    {/* Stage 1 */}
                                    <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                            5 د
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs">المحور الأول: الترحيب والتعريف برؤية موثق</h4>
                                            <p className="text-slate-600 mt-1">
                                                افتتاح اللقاء، والتعريف بفلسفة المنصة ومنظومة الشراكة القائمة على مشاركة النجاح وعوائد الحصص والمساهمة الفاعلة.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stage 2 */}
                                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                            7 د
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs">المحور الثاني: استعراض الخبرات والقدرات المحورية</h4>
                                            <p className="text-slate-600 mt-1">
                                                يستعرض الشريك أبرز محطات خبرته، المشاريع المنجزة، والتحديات المعمارية والبرمجية التي تغلب عليها ومهاراته الفريدة.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stage 3 */}
                                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                            5 د
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs">المحور الثالث: مناقشة نموذج الشراكة وحصص المساهمة</h4>
                                            <p className="text-slate-600 mt-1">
                                                شرح آلية العمل كشريك مساهم، ومصفوفة الحصص، وأسلوب التقييم المستمر، وحوافز الإنجاز المعتمدة في موثق.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stage 4 */}
                                    <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 flex items-start gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                            5 د
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs">المحور الرابع: حوار مفتوح والتطلعات المشتركة</h4>
                                            <p className="text-slate-600 mt-1">
                                                مساحة حرة للأسئلة المتبادلة، والإجابة عن استفسارات الشريك حول بيئة العمل، الأدوات التقنية، وآليات التنسيق.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stage 5 */}
                                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-slate-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                                            3 د
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs">المحور الخامس: الخطوات التالية وإصدار التقرير</h4>
                                            <p className="text-slate-600 mt-1">
                                                إيجاز مخرجات اللقاء وتوضيح الإجراءات اللاحقة لإصدار التقرير التنفيذي والشهادة المعتمدة عبر المنصة.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-3 flex items-center justify-between text-xs text-slate-400">
                                <span>أجندة لقاء التعارف - منصة موثِق</span>
                                <span>الصفحة 2 من 4</span>
                            </div>
                        </div>

                        {/* ================= PAGE 3: ABOUT US & VISION ================= */}
                        <div className="bg-white w-[210mm] min-h-[297mm] p-10 mx-auto shadow-2xl relative flex flex-col justify-between print:shadow-none print:w-full print:min-h-screen print:p-8 print:m-0 print:break-after-page text-xs leading-relaxed">
                            <div className="space-y-6">
                                <div className="border-b pb-3">
                                    <h3 className="text-base font-black text-slate-900">ثالثاً: من نحن وما هي رؤية منصة «موثِق»</h3>
                                    <p className="text-[11px] text-slate-500">بناء شراكات مستدامة ترتكز على القيمة الحقيقية والابتكار التقني</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-1">الرؤية والرسالة:</h4>
                                        <p className="text-slate-600 leading-relaxed">
                                            تسعى «موثِق» لأن تكون البيئة الريادية الأولى لتمكين الكفاءات النوعية وتحويل جهودهم البرمجية والتشغيلية إلى شراكات استثمارية ذات عوائد مجزية، بعيداً عن أطر التوظيف التقليدية، من خلال نموذج الشراكة في الحصص ونماء القيمة السوقية للمنظومة.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
                                            <h5 className="font-bold text-amber-900 mb-1">1. الجدارة والشفافية:</h5>
                                            <p className="text-slate-600 text-[11px]">معايير استحقاق واضحة ومقاسة بمؤشرات إنجاز دقيقة وقابلة للتحقق.</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
                                            <h5 className="font-bold text-blue-900 mb-1">2. الملكية والتمكين:</h5>
                                            <p className="text-slate-600 text-[11px]">كل شريك يملك حصة وله صوت فاعل في توجيه المنتج واستدامته.</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                                            <h5 className="font-bold text-emerald-900 mb-1">3. المرونة الاحترافية:</h5>
                                            <p className="text-slate-600 text-[11px]">إدارة أوقات مرنة تتناسب مع تفرغ الشريك مع الالتزام الصارم بمواعيد التسليم.</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40">
                                            <h5 className="font-bold text-purple-900 mb-1">4. الأثر والتوسع:</h5>
                                            <p className="text-slate-600 text-[11px]">مشاريعنا تخدم قطاعات واسعة واعدة داخل وخارج المملكة العربية السعودية.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-3 flex items-center justify-between text-xs text-slate-400">
                                <span>أجندة لقاء التعارف - منصة موثِق</span>
                                <span>الصفحة 3 من 4</span>
                            </div>
                        </div>

                        {/* ================= PAGE 4: COMPETENCIES & COMMITMENTS ================= */}
                        <div className="bg-white w-[210mm] min-h-[297mm] p-10 mx-auto shadow-2xl relative flex flex-col justify-between print:shadow-none print:w-full print:min-h-screen print:p-8 print:m-0 print:break-after-page text-xs leading-relaxed">
                            <div className="space-y-6">
                                <div className="border-b pb-3">
                                    <h3 className="text-base font-black text-slate-900">رابعاً: كفاءات الشريك والمخرجات المشتركة</h3>
                                    <p className="text-[11px] text-slate-500">التوقعات المتبادلة لضمان شراكة مثمرة ومستدامة</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-slate-900">ما نتوقعه من الشريك المساهم:</h4>
                                        <ul className="space-y-1.5 text-slate-700 ps-4 list-disc text-[11px]">
                                            <li>الالتزام بأعلى معايير جودة الكود البرمجي والتوثيق المعتمد.</li>
                                            <li>التواصل الاستباقي والشفافية التامة حيال مراحل الإنجاز والتقدم.</li>
                                            <li>المحافظة الصارمة على سرية البيانات والملكية الفكرية لمنصة موثق.</li>
                                            <li>المشاركة في الاجتماعات الدورية وحلقات مراجعة الأداء الأسبوعية.</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                                        <h4 className="font-bold text-amber-900">ما تلتزم به منصة «موثِق» تجاه الشريك:</h4>
                                        <ul className="space-y-1.5 text-slate-700 ps-4 list-disc text-[11px]">
                                            <li>توثيق رسمي لحصص ونسب المساهمة في عقود الشراكة المعتمدة.</li>
                                            <li>توفير البنية التحتية، السيرفرات، وأدوات العمل والذكاء الاصطناعي اللازمة.</li>
                                            <li>بيئة عمل داعمة تحفز الابتكار وتفتح آفاقاً استثمارية واسعة.</li>
                                        </ul>
                                    </div>

                                    <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-center">
                                        <div className="space-y-2">
                                            <p className="text-[11px] text-slate-400">توقيع وقبول الشريك</p>
                                            <p className="font-bold text-slate-800">{data.applicant_name}</p>
                                            <div className="h-10 border-b border-dashed border-slate-300 w-36 mx-auto"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] text-slate-400">اعتماد إدارة منصة موثِق</p>
                                            <p className="font-bold text-slate-800">مجلس الشراكات والتمكين</p>
                                            <div className="h-10 border-b border-dashed border-slate-300 w-36 mx-auto"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-3 flex items-center justify-between text-xs text-slate-400">
                                <span>أجندة لقاء التعارف - منصة موثِق</span>
                                <span>الصفحة 4 من 4</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
