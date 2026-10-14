import React, { useState, useEffect } from 'react';
import GuestLayout from '../layouts/GuestLayout';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function PublicApplyPage({ navigate }) {
    const { t, lang, isRtl } = useLanguage();
    const { showToast } = useToast();

    const [config, setConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [copied, setCopied] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        national_id: '',
        country: 'مصر',
        city: '',
        position: '',
        experience_years: 1,
        education_level: 'بكالوريوس',
        portfolio_url: '',
        linkedin_url: '',
        github_url: '',
        cover_letter: '',
        skills: ['Laravel', 'React'],
    });

    const [currentSkill, setCurrentSkill] = useState('');

    useEffect(() => {
        api.get('/public/config')
            .then(res => {
                setConfig(res);
                if (res.allowed_positions?.length > 0) {
                    setFormData(prev => ({ ...prev, position: res.allowed_positions[0] }));
                }
            })
            .catch(() => {
                // fallback
                setConfig({
                    applications_open: true,
                    allowed_positions: ['Full Stack Developer (Laravel & React)', 'Backend Developer (PHP/Laravel)', 'Frontend Developer (React/Tailwind)', 'UI/UX Product Designer']
                });
            })
            .finally(() => setLoadingConfig(false));
    }, []);

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            const trimmed = currentSkill.trim();
            if (trimmed && !formData.skills.includes(trimmed)) {
                setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
                setCurrentSkill('');
            }
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skillToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await api.post('/public/apply', formData);
            setSuccessData(res);
            showToast(res.message || 'تم تقديم طلبك بنجاح!', 'success');
        } catch (err) {
            showToast(err.message || 'حدث خطأ أثناء إرسال الطلب.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const copyReference = () => {
        if (successData?.application_no) {
            navigator.clipboard.writeText(successData.application_no);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
            showToast(t('copied'), 'info');
        }
    };

    if (loadingConfig) {
        return (
            <GuestLayout>
                <div className="py-24 text-center">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-slate-500 font-semibold">جاري تحميل بوابة التقديم...</p>
                </div>
            </GuestLayout>
        );
    }

    if (config && !config.applications_open) {
        return (
            <GuestLayout>
                <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">باب التقديم مغلق حالياً</h2>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                        نشكر اهتمامك، ولكن باب استقبال طلبات المساهمين والمتقدمين مغلق في هذه الدورة. يرجى متابعتنا لاحقاً عند فتح الدورة القادمة.
                    </p>
                    <a
                        href="#/login"
                        className="inline-block py-2.5 px-6 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
                    >
                        {t('signIn')}
                    </a>
                </div>
            </GuestLayout>
        );
    }

    // Success Screen
    if (successData) {
        return (
            <GuestLayout>
                <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">
                        {t('applicationSuccessTitle')}
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-md mx-auto">
                        {t('applicationSuccessDesc')}
                    </p>

                    {/* Reference Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 max-w-sm mx-auto">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                            {t('applicationReferenceNo')}
                        </p>
                        <div className="text-2xl font-black text-indigo-700 font-mono tracking-widest my-1">
                            {successData.application_no}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                            تم إرسال رسالة تأكيد إلى بريدك الإلكتروني ({formData.email})
                        </p>
                        <button
                            type="button"
                            onClick={copyReference}
                            className="mt-4 w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>{copied ? t('copied') : t('copyNumber')}</span>
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                setSuccessData(null);
                                setFormData(prev => ({
                                    ...prev,
                                    full_name: '',
                                    email: '',
                                    phone: '',
                                    cover_letter: '',
                                }));
                            }}
                            className="py-2.5 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            تقديم طلب آخر
                        </button>
                        <a
                            href="#/login"
                            className="py-2.5 px-5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                        >
                            دخول المشرفين
                        </a>
                    </div>
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 px-6 sm:px-10 py-8 text-white">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs mb-3">
                        ✨ {t('appName')}
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black">
                        {t('publicWelcome')}
                    </h2>
                    <p className="text-xs sm:text-sm text-indigo-100 mt-2 max-w-2xl leading-relaxed">
                        {t('publicSubtitle')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('fullName')} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="محمد أحمد مصطفى"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('email')} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="name@example.com"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('phone')} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+20 100 123 4567"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('nationalId')}
                            </label>
                            <input
                                type="text"
                                value={formData.national_id}
                                onChange={e => setFormData({ ...formData, national_id: e.target.value })}
                                placeholder="2950101XXXXXXX"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Location & Position */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('country')}
                            </label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                placeholder="مصر، السعودية، الإمارات..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('city')}
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                placeholder="القاهرة، الرياض..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('position')} <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.position}
                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white"
                            >
                                {config.allowed_positions?.map((pos, idx) => (
                                    <option key={idx} value={pos}>{pos}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Experience & Education */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('experienceYears')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="40"
                                value={formData.experience_years}
                                onChange={e => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('educationLevel')}
                            </label>
                            <input
                                type="text"
                                value={formData.education_level}
                                onChange={e => setFormData({ ...formData, education_level: e.target.value })}
                                placeholder="بكالوريوس حاسبات، هندسة، فنون..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('portfolioUrl')}
                            </label>
                            <input
                                type="url"
                                value={formData.portfolio_url}
                                onChange={e => setFormData({ ...formData, portfolio_url: e.target.value })}
                                placeholder="https://myportfolio.com"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('githubUrl')}
                            </label>
                            <input
                                type="url"
                                value={formData.github_url}
                                onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                                placeholder="https://github.com/username"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('linkedinUrl')}
                            </label>
                            <input
                                type="url"
                                value={formData.linkedin_url}
                                onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                                placeholder="https://linkedin.com/in/username"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Skills Tag Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t('skills')}
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={currentSkill}
                                onChange={e => setCurrentSkill(e.target.value)}
                                onKeyDown={handleAddSkill}
                                placeholder="اكتب مهارة واضغط إضافة (مثل: React, PHP, Docker...)"
                                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                            />
                            <button
                                type="button"
                                onClick={handleAddSkill}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                            >
                                إضافة
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {formData.skills.map(skill => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="text-indigo-400 hover:text-indigo-700"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Cover Letter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t('coverLetter')}
                        </label>
                        <textarea
                            rows={4}
                            value={formData.cover_letter}
                            onChange={e => setFormData({ ...formData, cover_letter: e.target.value })}
                            placeholder="تحدث بإيجاز عن خبراتك، وأبرز مشاريعك، ولماذا ترغب بالمساهمة معنا..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm leading-relaxed"
                        ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting && (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            <span>{t('submitApplication')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
