import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function AppLayout({ currentRoute, navigate, children }) {
    const { user, logout, hasPermission } = useAuth();
    const { t, lang, toggleLang } = useLanguage();
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
        const interval = setInterval(fetchNotifications, 30000);
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

    const mainNavItems = [
        { id: '#/dashboard', label: t('dashboard'), icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { id: '#/applicants', label: t('applicants'), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', perm: 'view_applicants' },
        { id: '#/interviews', label: t('interviews'), icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: '#/reports', label: t('reports'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', perm: 'view_reports' },
        { id: '#/emails', label: t('emails'), icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', perm: 'send_emails' },
        { id: '#/users', label: t('usersAndRoles'), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', perm: 'manage_users' },
    ];

    const filteredNavItems = mainNavItems.filter(item => !item.perm || hasPermission(item.perm));

    // Resolve current page title for Breadcrumbs
    const getBreadcrumbLabel = () => {
        if (currentRoute.startsWith('#/applicants/')) return t('applicantProfileTitle');
        if (currentRoute.startsWith('#/applicants')) return t('applicants');
        if (currentRoute.startsWith('#/interviews')) return t('interviews');
        if (currentRoute.startsWith('#/reports')) return t('reports');
        if (currentRoute.startsWith('#/emails')) return t('emails');
        if (currentRoute.startsWith('#/users')) return t('usersAndRoles');
        if (currentRoute.startsWith('#/settings')) return t('settings');
        if (currentRoute.startsWith('#/profile')) return t('profile');
        return t('dashboard');
    };

    const isSettingsActive = currentRoute.startsWith('#/settings');

    return (
        <div className="min-h-screen bg-slate-50/80 flex antialiased text-slate-800">
            {/* Desktop Full-Height Sidebar (Right in RTL, Left in LTR) */}
            <aside className="hidden lg:flex w-60 shrink-0 bg-white border-e border-slate-200 flex-col sticky top-0 h-screen z-30">
                {/* Brand Header */}
                <div
                    onClick={() => navigate('#/dashboard')}
                    className="h-14 px-4 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                            M
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xs font-bold text-slate-900 truncate leading-tight">
                                {t('appNameShort')}
                            </h1>
                            <p className="text-[10px] text-slate-400 font-medium truncate">
                                {t('dashboard')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {filteredNavItems.map(item => {
                        const active = currentRoute.startsWith(item.id);
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-start cursor-pointer ${
                                    active
                                        ? 'bg-blue-50/90 text-blue-600 font-bold'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                }`}
                            >
                                <svg className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                                </svg>
                                <span className="truncate">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Fixed Settings Link (Matches Reference Layout) */}
                <div className="p-3 border-t border-slate-100">
                    <button
                        onClick={() => navigate('#/settings')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-start cursor-pointer ${
                            isSettingsActive
                                ? 'bg-blue-50/90 text-blue-600 font-bold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                    >
                        <svg className={`w-4 h-4 shrink-0 ${isSettingsActive ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{t('settings')}</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="relative w-64 bg-white h-full shadow-xl flex flex-col z-10">
                        <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                    M
                                </div>
                                <span className="font-bold text-xs text-slate-900">{t('appNameShort')}</span>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                            {filteredNavItems.map(item => {
                                const active = currentRoute.startsWith(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            navigate(item.id);
                                            setSidebarOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all text-start ${
                                            active
                                                ? 'bg-blue-50 text-blue-600 font-bold'
                                                : 'text-slate-600 hover:bg-slate-50 font-medium'
                                        }`}
                                    >
                                        <svg className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                                        </svg>
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="p-3 border-t border-slate-100 space-y-1.5">
                            <button
                                onClick={() => {
                                    navigate('#/settings');
                                    setSidebarOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                <span>⚙️</span>
                                <span>{t('settings')}</span>
                            </button>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100"
                            >
                                {t('logout')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Viewport Column */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header Bar (Matches Reference Layout) */}
                <header className="sticky top-0 z-20 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
                    {/* Start Side: Mobile Menu + Breadcrumbs + Quick Portal Badge */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-xs">
                            <button
                                onClick={() => navigate('#/dashboard')}
                                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                            >
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="hidden sm:inline">{t('dashboard')}</span>
                            </button>

                            <span className="text-slate-300 font-bold">‹</span>

                            <span className="font-bold text-blue-600 truncate">
                                {getBreadcrumbLabel()}
                            </span>
                        </div>

                        {/* Public Portal Badge Pill */}
                        <a
                            href="#/apply"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100/70 transition-colors border border-blue-200/70"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>{t('applyPublic')}</span>
                        </a>
                    </div>

                    {/* End Side: Language Button, Notifications, User Profile Box */}
                    <div className="flex items-center gap-2.5">
                        {/* Compact Language Toggle Box (EN / AR) */}
                        <button
                            onClick={toggleLang}
                            className="px-2.5 py-1 text-xs font-bold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            aria-label={t('switchLanguage')}
                        >
                            {lang === 'ar' ? 'EN' : 'AR'}
                        </button>

                        {/* In-App Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setNotificationsOpen(!notificationsOpen);
                                    setProfileMenuOpen(false);
                                }}
                                aria-label={t('notifications')}
                                className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 end-1 w-2 h-2 bg-blue-600 rounded-full" />
                                )}
                            </button>

                            {notificationsOpen && (
                                <div className="absolute end-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50">
                                    <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                                        <div className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                            <span>{t('notifications')}</span>
                                            {unreadCount > 0 && (
                                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                                            >
                                                {t('markAllRead')}
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                        {notifications.length === 0 ? (
                                            <div className="py-6 text-center text-xs text-slate-400">
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
                                                    className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className="text-xs font-bold text-slate-800 mb-0.5">
                                                        {notif.title}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 leading-relaxed">
                                                        {notif.message}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

                        {/* User Profile Box (Matches Reference Top-Left Box) */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setProfileMenuOpen(!profileMenuOpen);
                                    setNotificationsOpen(false);
                                }}
                                className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <div className="hidden sm:block text-end">
                                    <div className="text-xs font-bold text-slate-800 leading-none">
                                        {user?.name || 'Admin'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        {user?.email || ''}
                                    </div>
                                </div>
                                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </button>

                            {profileMenuOpen && (
                                <div className="absolute end-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50">
                                    <div className="px-3.5 py-2 border-b border-slate-100">
                                        <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigate('#/profile');
                                            setProfileMenuOpen(false);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-start cursor-pointer"
                                    >
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {t('profile')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('#/settings');
                                            setProfileMenuOpen(false);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-start cursor-pointer"
                                    >
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        </svg>
                                        {t('settings')}
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                        onClick={logout}
                                        className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-start cursor-pointer"
                                    >
                                        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        {t('logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
