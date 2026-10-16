import './bootstrap';
import '../css/app.css';

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './Pages/LoginPage';
import PublicApplyPage from './Pages/PublicApplyPage';
import DashboardPage from './Pages/DashboardPage';
import ApplicantsPage from './Pages/ApplicantsPage';
import ApplicantDetailPage from './Pages/ApplicantDetailPage';
import InterviewsPage from './Pages/InterviewsPage';
import ReportsPage from './Pages/ReportsPage';
import EmailsPage from './Pages/EmailsPage';
import UsersAndPermissionsPage from './Pages/UsersAndPermissionsPage';
import SettingsPage from './Pages/SettingsPage';
import ProfilePage from './Pages/ProfilePage';

function Router() {
    const { isAuthenticated, loading } = useAuth();
    const [route, setRoute] = useState(() => window.location.hash || '#/');

    useEffect(() => {
        const handleHashChange = () => {
            setRoute(window.location.hash || '#/');
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigate = (newRoute) => {
        window.location.hash = newRoute;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-bold text-slate-500">جاري تشغيل المنصة...</p>
                </div>
            </div>
        );
    }

    // Public Portal
    if (route.startsWith('#/apply')) {
        return <PublicApplyPage navigate={navigate} />;
    }

    // Login Route
    if (route === '#/login' || !isAuthenticated) {
        if (!isAuthenticated && route !== '#/login' && !route.startsWith('#/apply')) {
            window.location.hash = '#/login';
        }
        return <LoginPage navigate={navigate} />;
    }

    // Default authenticated home
    if (route === '#/' || route === '#') {
        window.location.hash = '#/dashboard';
        return <DashboardPage currentRoute="#/dashboard" navigate={navigate} />;
    }

    // Authenticated Routes
    if (route.startsWith('#/dashboard')) {
        return <DashboardPage currentRoute={route} navigate={navigate} />;
    }
    if (route.startsWith('#/applicants/') && route.split('#/applicants/')[1]) {
        return <ApplicantDetailPage currentRoute={route} navigate={navigate} />;
    }
    if (route.startsWith('#/applicants')) {
        return <ApplicantsPage currentRoute={route} navigate={navigate} />;
    }
    if (route.startsWith('#/interviews')) {
        return <InterviewsPage currentRoute={route} navigate={navigate} />;
    }
    if (route.startsWith('#/reports')) {
        return <ReportsPage currentRoute={route} navigate={navigate} />;
    }
    if (route.startsWith('#/emails')) {
        return <EmailsPage currentRoute={route} navigate={navigate} />;
    }
    if (route.startsWith('#/users')) {
        return <UsersAndPermissionsPage currentRoute={route} navigate={navigate} />;
    }
    if (route.startsWith('#/settings')) {
        return <SettingsPage currentRoute={route} navigate={navigate} />;
    }
    if (route.startsWith('#/profile')) {
        return <ProfilePage currentRoute={route} navigate={navigate} />;
    }

    // Fallback to Dashboard
    return <DashboardPage currentRoute="#/dashboard" navigate={navigate} />;
}

export default function App() {
    return (
        <LanguageProvider>
            <ToastProvider>
                <AuthProvider>
                    <Router />
                </AuthProvider>
            </ToastProvider>
        </LanguageProvider>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<App />);
}
