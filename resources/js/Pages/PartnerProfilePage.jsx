import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import InterviewAgendaModal from '../components/InterviewAgendaModal';

export default function PartnerProfilePage({ navigate }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [partnerData, setPartnerData] = useState(null);
    const [interviews, setInterviews] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'interviews', 'availability', 'security'

    // Agenda modal state
    const [agendaModalOpen, setAgendaModalOpen] = useState(false);
    const [selectedInterviewId, setSelectedInterviewId] = useState(null);

    // Edit form state
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        country: '',
        city: '',
        bio: '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/partner/profile');
            setPartnerData(res);
            const app = res.applicant || {};
            setFormData(prev => ({
                ...prev,
                full_name: app.full_name || '',
                phone: app.phone || '',
                country: app.country || '',
                city: app.city || '',
                bio: app.bio || '',
            }));

            // Load partner interviews
            const intvRes = await api.get('/partner/my-interviews');
            setInterviews(intvRes.interviews || []);
        } catch (err) {
            showToast('تعذر تحميل بيانات البروفايل أو انتهت الجلسة.', 'error');
            navigate('#/partner/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/partner/profile', formData);
            showToast('تم تحديث بيانات البروفايل بنجاح!', 'success');
            loadProfile();
        } catch (err) {
            showToast(err.message || 'فشل تحديث البيانات.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('partner_applicant');
        showToast('تم تسجيل الخروج بنجاح.', 'info');
        navigate('#/partner/login');
    };

    const openAgenda = (intvId) => {
        setSelectedInterviewId(intvId);
        setAgendaModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white" dir="rtl">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-slate-400">جاري تحميل بوابة الشريك...</p>
                </div>
            </div>
        );
    }

    const applicant = partnerData?.applicant || {};

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16" dir="rtl">
            {/* Top Navbar */}
            <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-xl">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg">
                            ⚜️
                        </span>
                        <div>
                            <h1 className="text-base font-black text-white">منصة موثِق | بوابة الشركاء</h1>
                            <p className="text-[11px] text-amber-400">مرحباً بك، {applicant.full_name || 'الشريك المساهم'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {applicant.position || 'شريك استراتيجي'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                        >
                            تسجيل خروج
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-800 gap-2 text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
                            activeTab === 'overview' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        الملف التعريفي
                    </button>
                    <button
                        onClick={() => setActiveTab('interviews')}
                        className={`pb-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'interviews' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>المقابلات والأجندة</span>
                        {interviews.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px]">
                                {interviews.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
                            activeTab === 'security' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        الأمان وتعديل البيانات
                    </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Profile Card */}
                        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                            <div className="text-center space-y-2 pb-4 border-b border-slate-800">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-600 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto shadow-lg">
                                    {(applicant.full_name || 'M')[0]}
                                </div>
                                <h3 className="text-lg font-bold text-white">{applicant.full_name}</h3>
                                <p className="text-xs text-slate-400">{applicant.email}</p>
                                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
                                    الرقم المرجعي: {applicant.application_no || `APP-${applicant.id}`}
                                </span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">رقم الهاتف:</span>
                                    <span className="font-mono text-slate-200">{applicant.phone || 'غير مسجل'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">الدولة / المدينة:</span>
                                    <span className="text-slate-200">{applicant.country || ''} - {applicant.city || ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">تاريخ الانضمام:</span>
                                    <span className="font-mono text-slate-200">{applicant.created_at || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bio & Details */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                                    <span>📝</span>
                                    <span>نبذة عن الشريك والخبرات:</span>
                                </h4>
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {applicant.bio || 'لم يتم تسجيل نبذة تعريفية بعد.'}
                                </p>
                            </div>

                            {/* Next Action Box */}
                            <div className="bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-500/20 rounded-3xl p-6 space-y-3">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <span>🚀</span>
                                    <span>مرحلتك الحالية في المنظومة:</span>
                                </h4>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    مرحباً بك في منصة موثق. يمكنك مراجعة مواعيد مقابلتك الشخصية المجدولة واستعراض وثيقة أجندة اللقاء الرسمية (المكونة من 4 صفحات) للتحضير لمناقشة أبعاد الشراكة والاستثمار.
                                </p>
                                <button
                                    onClick={() => setActiveTab('interviews')}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer"
                                >
                                    استعراض المقابلات والأجندة
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: INTERVIEWS & AGENDA */}
                {activeTab === 'interviews' && (
                    <div className="space-y-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div>
                                    <h3 className="text-base font-bold text-white">لقاءات التعارف والتقييم المجدولة</h3>
                                    <p className="text-xs text-slate-400">جميع المواعيد تعرض بتوقيت الشرق الأوسط (الرياض - GMT+3)</p>
                                </div>
                            </div>

                            {interviews.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 text-xs">
                                    لا توجد مقابلات مجدولة حالياً. سيتم إشعارك فور تحديد موعد لقاء التعارف.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {interviews.map((intv) => (
                                        <div
                                            key={intv.id}
                                            className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <h5 className="font-bold text-sm text-white">
                                                        لقاء التعارف والتمكين التقني
                                                    </h5>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                                        {intv.interview_type === 'online' ? 'عبر الإنترنت' : 'حضورياً'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-amber-400 font-mono">
                                                    الموعد المعتمد: {intv.scheduled_at || 'قريباً'} بتوقيت الرياض
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    المحكّم / المحاور: {intv.interviewer_name}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {intv.meeting_link && (
                                                    <a
                                                        href={intv.meeting_link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5"
                                                    >
                                                        <span>🔗</span>
                                                        <span>رابط الاجتماع</span>
                                                    </a>
                                                )}

                                                <button
                                                    onClick={() => openAgenda(intv.id)}
                                                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                                                >
                                                    <span>📄</span>
                                                    <span>وثيقة الأجندة (PDF)</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: SECURITY & EDIT */}
                {activeTab === 'security' && (
                    <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                            تحديث البيانات وكلمة المرور
                        </h3>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">الدولة</label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">المدينة</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">النبذة التعريفية</label>
                                <textarea
                                    rows={3}
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-800 space-y-4">
                                <h4 className="text-xs font-bold text-amber-400">تغيير كلمة المرور (اختياري):</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">كلمة المرور الجديدة</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">تأكيد كلمة المرور الجديدة</label>
                                        <input
                                            type="password"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </button>
                        </form>
                    </div>
                )}
            </main>

            {/* Agenda Document Modal */}
            <InterviewAgendaModal
                isOpen={agendaModalOpen}
                interviewId={selectedInterviewId}
                onClose={() => setAgendaModalOpen(false)}
            />
        </div>
    );
}
