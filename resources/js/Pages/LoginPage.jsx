import React, { useState } from 'react';
import GuestLayout from '../layouts/GuestLayout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage({ navigate }) {
    const { login } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await login(email, password);
            showToast('تم تسجيل الدخول بنجاح! مرحباً بك.', 'success');
            navigate('#/dashboard');
        } catch (err) {
            setError(err.message || 'فشل تسجيل الدخول.');
            showToast(err.message || 'فشل تسجيل الدخول.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fillCredentials = (userEmail, userPass) => {
        setEmail(userEmail);
        setPassword(userPass);
    };

    return (
        <GuestLayout>
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8">
                <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                        {t('loginTitle')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {t('loginSubtitle')}
                    </p>
                </div>

                {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t('email')}
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@contributors.app"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {t('password')}
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        <span>{t('signIn')}</span>
                    </button>
                </form>

                {/* Quick 1-Click Demo Accounts */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider text-center">
                        {t('demoLoginTitle')}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            type="button"
                            onClick={() => fillCredentials('admin@contributors.app', 'password')}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/60 hover:border-indigo-200 text-xs font-semibold text-slate-700 transition-all text-start"
                        >
                            <span>👑 {t('loginAsAdmin')}</span>
                            <span className="text-[10px] text-slate-400 font-mono">admin@contributors.app</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => fillCredentials('hr@contributors.app', 'password')}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/60 hover:border-indigo-200 text-xs font-semibold text-slate-700 transition-all text-start"
                        >
                            <span>💼 {t('loginAsHR')}</span>
                            <span className="text-[10px] text-slate-400 font-mono">hr@contributors.app</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => fillCredentials('interviewer@contributors.app', 'password')}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/60 hover:border-indigo-200 text-xs font-semibold text-slate-700 transition-all text-start"
                        >
                            <span>🎯 {t('loginAsInterviewer')}</span>
                            <span className="text-[10px] text-slate-400 font-mono">interviewer@...</span>
                        </button>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
