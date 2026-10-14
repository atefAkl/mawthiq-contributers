import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function GuestLayout({ children, title, subtitle }) {
    const { toggleLang, lang, t } = useLanguage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-sky-50/40 flex flex-col antialiased py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            {/* Top Navbar */}
            <div className="max-w-4xl w-full mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight">
                            {t('appName')}
                        </span>
                        <p className="text-xs text-slate-500 font-medium">
                            {t('appSubtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleLang}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white/80 shadow-xs hover:bg-white text-slate-700 transition-all flex items-center gap-1.5"
                    >
                        <span>🌐</span>
                        <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
                    </button>
                    {window.location.hash !== '#/login' ? (
                        <a
                            href="#/login"
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
                        >
                            {t('signIn')}
                        </a>
                    ) : (
                        <a
                            href="#/apply"
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
                        >
                            {t('applyPublic')}
                        </a>
                    )}
                </div>
            </div>

            {/* Main Container */}
            <div className="max-w-4xl w-full mx-auto">
                {children}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-xs text-slate-400">
                &copy; {new Date().getFullYear()} {t('appName')} &mdash; {t('appSubtitle')}
            </div>
        </div>
    );
}
