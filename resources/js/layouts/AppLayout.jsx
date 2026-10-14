import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function AppLayout({ currentRoute, navigate, children }) {
    const { user, logout, hasPermission } = useAuth();
    const { t, lang, toggleLang, isRtl } = useLanguage();
    const { showToast } = useToast();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.notifications || []);
            setUnreadCount(res.unread_count || 0);
        } catch (e) {
            // silent fail
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // 30s poll
        return () => clearInterval(interval);
    }, []);

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            showToast(t('markAllRead'), 'info');
        } catch (e) {
            // silent
        }
    };

    const navItems = [
        { id: '#/dashboard', label: t('dashboard'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: '#/applicants', label: t('applicants'), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', perm: 'view_applicants' },
        { id: '#/interviews', label: t('interviews'), icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: '#/reports', label: t('reports'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', perm: 'view_reports' },
        { id: '#/emails', label: t('emails'), icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', perm: 'send_emails' },
        { id: '#/users', label: t('usersAndRoles'), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', perm: 'manage_users' },
        { id: '#/settings', label: t('settings'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ];

    const filteredNavItems = navItems.filter(item => !item.perm || hasPermission(item.perm));

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Left side (or Right side in RTL): Brand & Mobile Menu Button */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div
                            onClick={() => navigate('#/dashboard')}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-base font-bold text-slate-800 leading-tight">
                                    {t('appName')}
                                </h1>
                                <p className="text-xs text-slate-500 font-medium">
                                    {t('appSubtitle')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Actions, Language Toggle, Notifications, Profile */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Public Apply Portal Link */}
                        <a
                            href="#/apply"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-200"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {t('applyPublic')}
                        </a>

                        {/* Multi-lingual Layout Switcher */}
                        <button
                            onClick={toggleLang}
                            className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
                            title="تبديل اللغة / Switch Language"
                        >
                            <span className="text-sm">🌐</span>
                            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
                        </button>

                        {/* Flash / In-app Notifications Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setNotificationsOpen(!notificationsOpen);
                                    setProfileMenuOpen(false);
                                }}
                                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 end-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown Panel */}
                            {notificationsOpen && (
                                <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                        <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                            <span>{t('notifications')}</span>
                                            {unreadCount > 0 && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                                            >
                                                {t('markAllRead')}
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                                        {notifications.length === 0 ? (
                                            <div className="py-8 text-center text-xs text-slate-400">
                                                {t('noNotifications')}
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => {
                                                        if (notif.action_url) navigate('#' + notif.action_url);
                                                        setNotificationsOpen(false);
                                                    }}
                                                    className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-indigo-50/40' : ''}`}
                                                >
                                                    <div className="text-xs font-bold text-slate-800 mb-0.5">
                                                        {notif.title}
                                                    </div>
                                                    <div className="text-xs text-slate-600 leading-relaxed">
                                                        {notif.message}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Active User Profile Menu */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setProfileMenuOpen(!profileMenuOpen);
                                    setNotificationsOpen(false);
                                }}
                                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                                    {user?.name ? user.name.charAt(0) : 'U'}
                                </div>
                                <div className="hidden lg:block text-start">
                                    <div className="text-xs font-bold text-slate-800 leading-none">
                                        {user?.name || 'مستخدم'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                        {user?.role?.display_name_ar || user?.role?.name || 'Super Admin'}
                                    </div>
                                </div>
                                <svg className="w-4 h-4 text-slate-400 hidden lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Profile Dropdown Panel */}
                            {profileMenuOpen && (
                                <div className="absolute end-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {user?.role?.display_name_ar || 'نشط'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigate('#/profile');
                                            setProfileMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-start"
                                    >
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {t('profile')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('#/settings');
                                            setProfileMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-start"
                                    >
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        </svg>
                                        {t('settings')}
                                    </button>
                                    <div className="border-t border-slate-100 my-1"></div>
                                    <button
                                        onClick={logout}
                                        className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-start"
                                    >
                                        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        {t('logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Layout Body: Sidebar + Main Content */}
            <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm space-y-1">
                        {filteredNavItems.map(item => {
                            const active = currentRoute.startsWith(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.id)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start ${
                                        active
                                            ? 'bg-gradient-to-r from-indigo-50 to-sky-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <svg className={`w-5 h-5 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                    </svg>
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Mobile Drawer (Dynamic Display on Mobile) */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        <div
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                            onClick={() => setSidebarOpen(false)}
                        ></div>
                        <div className="relative w-72 bg-white h-full shadow-2xl p-5 flex flex-col z-10">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                                        C
                                    </div>
                                    <span className="font-bold text-sm text-slate-800">{t('appName')}</span>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <nav className="flex-1 space-y-1 overflow-y-auto">
                                {filteredNavItems.map(item => {
                                    const active = currentRoute.startsWith(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                navigate(item.id);
                                                setSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-start ${
                                                active
                                                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <svg className={`w-5 h-5 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                            </svg>
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                <a
                                    href="#/apply"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200"
                                >
                                    {t('applyPublic')}
                                </a>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100"
                                >
                                    {t('logout')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Viewport */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
