import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import IconButton from '../components/IconButton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function SettingsPage({ currentRoute, navigate }) {
    const { t } = useLanguage();
    const { hasPermission } = useAuth();
    const { showToast } = useToast();

    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Positions Tag Manager
    const [positions, setPositions] = useState([]);
    const [newPosition, setNewPosition] = useState('');

    // Test Email
    const [testEmailAddress, setTestEmailAddress] = useState('admin@example.com');
    const [testingEmail, setTestingEmail] = useState(false);
    const [syncingImap, setSyncingImap] = useState(false);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings');
            const flat = res.flat || {};
            setSettings(flat);

            let posList = [];
            try {
                posList = typeof flat.allowed_positions === 'string'
                    ? JSON.parse(flat.allowed_positions)
                    : flat.allowed_positions || [];
            } catch (e) {
                posList = [];
            }
            setPositions(posList);
        } catch (e) {
            showToast('تعذر تحميل الإعدادات.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleChange = (key, val) => {
        setSettings(prev => ({ ...prev, [key]: val }));
    };

    const handleAddPosition = (e) => {
        e.preventDefault();
        const trimmed = newPosition.trim();
        if (trimmed && !positions.includes(trimmed)) {
            const updated = [...positions, trimmed];
            setPositions(updated);
            setSettings(prev => ({ ...prev, allowed_positions: JSON.stringify(updated) }));
            setNewPosition('');
        }
    };

    const handleRemovePosition = (posToRemove) => {
        const updated = positions.filter(p => p !== posToRemove);
        setPositions(updated);
        setSettings(prev => ({ ...prev, allowed_positions: JSON.stringify(updated) }));
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...settings,
                imap_username: settings.imap_username || settings.mail_username,
                imap_password: settings.imap_password || settings.mail_password,
                imap_host: settings.imap_host || settings.mail_host || 'mawthiq.tech',
                allowed_positions: JSON.stringify(positions),
            };
            await api.post('/settings', { settings: payload });
            showToast('تم حفظ كافة الإعدادات بنجاح!', 'success');
        } catch (err) {
            showToast(err.message || 'فشل حفظ الإعدادات.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestEmail = async (e) => {
        e.preventDefault();
        setTestingEmail(true);
        try {
            // Auto-save current form settings before testing
            const payload = {
                ...settings,
                imap_username: settings.imap_username || settings.mail_username,
                imap_password: settings.imap_password || settings.mail_password,
                imap_host: settings.imap_host || settings.mail_host || 'mawthiq.tech',
                allowed_positions: JSON.stringify(positions),
            };
            await api.post('/settings', { settings: payload });

            await api.post('/settings/test-email', { test_email: testEmailAddress });
            showToast(`تم إرسال رسالة الاختبار بنجاح إلى (${testEmailAddress})!`, 'success');
        } catch (err) {
            showToast(err.message || 'فشل اختبار البريد.', 'error');
        } finally {
            setTestingEmail(false);
        }
    };

    const handleSyncImap = async () => {
        setSyncingImap(true);
        try {
            // Auto-save current form settings before syncing
            const payload = {
                ...settings,
                imap_username: settings.imap_username || settings.mail_username,
                imap_password: settings.imap_password || settings.mail_password,
                imap_host: settings.imap_host || settings.mail_host || 'mawthiq.tech',
                allowed_positions: JSON.stringify(positions),
            };
            await api.post('/settings', { settings: payload });

            const res = await api.post('/emails/sync-imap');
            showToast(res.message || 'تم فحص صندوق الوارد بنجاح!', res.success ? 'success' : 'warning');
        } catch (err) {
            showToast(err.message || 'فشل فحص صندوق الوارد IMAP.', 'error');
        } finally {
            setSyncingImap(false);
        }
    };

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6 max-w-4xl">
                {/* Standardized Page Header Box */}
                <PageHeader
                    title={t('settings')}
                    subtitle={t('settingsSubtitle')}
                    icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                >
                    <IconButton
                        onClick={loadSettings}
                        tooltip={t('reloadSettings')}
                        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                    <IconButton
                        variant="primary"
                        onClick={handleSaveSettings}
                        disabled={saving}
                        tooltip={saving ? t('saving') : t('save')}
                        icon="M5 13l4 4L19 7"
                    />
                </PageHeader>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                    {/* General Settings */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                        <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100">
                            🏢 {t('systemSettings')}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنصة (بالعربية)</label>
                                <input
                                    type="text"
                                    value={settings.app_name || ''}
                                    onChange={e => handleChange('app_name', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Platform Name (English)</label>
                                <input
                                    type="text"
                                    value={settings.app_name_en || ''}
                                    onChange={e => handleChange('app_name_en', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-sans"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنظمة / الكيان</label>
                                <input
                                    type="text"
                                    value={settings.organization_name || ''}
                                    onChange={e => handleChange('organization_name', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">بريد التواصل والدعم</label>
                                <input
                                    type="email"
                                    value={settings.contact_email || ''}
                                    onChange={e => handleChange('contact_email', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recruitment Portal Settings */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                        <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100">
                            🎯 {t('recruitmentSettings')}
                        </h3>

                        {/* Open/Close Applications Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <div>
                                <h4 className="font-bold text-xs text-slate-800">{t('applicationsOpenToggle')}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">عند الإغلاق، لن يتمكن الزوار من تقديم طلبات جديدة عبر النموذج الخارجي.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.applications_open === '1' || settings.applications_open === true || settings.applications_open === 1}
                                    onChange={e => handleChange('applications_open', e.target.checked ? '1' : '0')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Available Positions Tags Manager */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                {t('allowedPositionsList')}
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newPosition}
                                    onChange={e => setNewPosition(e.target.value)}
                                    placeholder="أضف تخصص أو دور جديد (مثلاً: Data Scientist)..."
                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddPosition}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold"
                                >
                                    إضافة تخصص
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {positions.map((pos, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold"
                                    >
                                        <span>{pos}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePosition(pos)}
                                            className="text-indigo-400 hover:text-indigo-800 font-bold"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Email Server SMTP & IMAP Settings */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-sm text-slate-800">
                                    ✉️ {t('emailSettings')} &bull; خادم البريد (SMTP & IMAP)
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    إعدادات ديناميكية مرنة بالكامل من قاعدة البيانات للإرسال والاستقبال، قابلة للتعديل بأي وقت دون تعديل الكود.
                                </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                إعدادات ديناميكية نشطة
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('smtpHost')}</label>
                                <input
                                    type="text"
                                    value={settings.mail_host || ''}
                                    onChange={e => handleChange('mail_host', e.target.value)}
                                    placeholder="smtp.gmail.com"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('smtpPort')}</label>
                                <input
                                    type="text"
                                    value={settings.mail_port || ''}
                                    onChange={e => handleChange('mail_port', e.target.value)}
                                    placeholder="587"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">نوع التشفير (Encryption)</label>
                                <select
                                    value={settings.mail_encryption || 'tls'}
                                    onChange={e => handleChange('mail_encryption', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                >
                                    <option value="tls">TLS (منفذ 587 - افتراضي)</option>
                                    <option value="ssl">SSL (منفذ 465)</option>
                                    <option value="null">بدون تشفير (None)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('smtpUser')}</label>
                                <input
                                    type="text"
                                    value={settings.mail_username || ''}
                                    onChange={e => handleChange('mail_username', e.target.value)}
                                    placeholder="mawthiqtr@gmail.com"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('smtpPass')}</label>
                                <input
                                    type="password"
                                    value={settings.mail_password || ''}
                                    onChange={e => handleChange('mail_password', e.target.value)}
                                    placeholder="كلمة المرور أو App Password"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('fromEmail')}</label>
                                <input
                                    type="email"
                                    value={settings.mail_from_address || ''}
                                    onChange={e => handleChange('mail_from_address', e.target.value)}
                                    placeholder="mawthiqtr@gmail.com"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('fromName')}</label>
                                <input
                                    type="text"
                                    value={settings.mail_from_name || ''}
                                    onChange={e => handleChange('mail_from_name', e.target.value)}
                                    placeholder="منصة إدارة المتقدمين والمساهمين"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>
                        </div>

                        {/* IMAP Incoming Mail Configuration */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="font-bold text-xs text-slate-800 mb-2">
                                📥 إعدادات استلام البريد الوارد (IMAP Inbox Fetcher):
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">خادم IMAP Host</label>
                                    <input
                                        type="text"
                                        value={settings.imap_host || ''}
                                        onChange={e => handleChange('imap_host', e.target.value)}
                                        placeholder="imap.gmail.com"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">منفذ IMAP Port</label>
                                    <input
                                        type="text"
                                        value={settings.imap_port || ''}
                                        onChange={e => handleChange('imap_port', e.target.value)}
                                        placeholder="993"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">تشفير IMAP</label>
                                    <select
                                        value={settings.imap_encryption || 'ssl'}
                                        onChange={e => handleChange('imap_encryption', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                    >
                                        <option value="ssl">SSL (منفذ 993 - افتراضي)</option>
                                        <option value="tls">TLS</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم مستخدم IMAP (اتركه فارغاً لاستخدام بريد SMTP)</label>
                                    <input
                                        type="text"
                                        value={settings.imap_username || ''}
                                        onChange={e => handleChange('imap_username', e.target.value)}
                                        placeholder={settings.mail_username || 'admin@mawthiq.tech'}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">كلمة مرور IMAP (اتركها فارغة لاستخدام كلمة مرور SMTP)</label>
                                    <input
                                        type="password"
                                        value={settings.imap_password || ''}
                                        onChange={e => handleChange('imap_password', e.target.value)}
                                        placeholder="مطابقة لكلمة مرور SMTP"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Test Email Box & IMAP Check */}
                        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    تجربة إرسال بريد حقيقي عبر SMTP:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={testEmailAddress}
                                        onChange={e => setTestEmailAddress(e.target.value)}
                                        placeholder="your-email@example.com"
                                        className="w-full sm:w-72 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendTestEmail}
                                        disabled={testingEmail}
                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                                    >
                                        {testingEmail ? 'جاري الإرسال...' : '🚀 إرسال تجريبي (SMTP)'}
                                    </button>
                                </div>
                            </div>

                            <div className="border-t md:border-t-0 md:border-s border-slate-200 pt-3 md:pt-0 md:ps-4 shrink-0">
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    فحص استلام الرسائل:
                                </label>
                                <button
                                    type="button"
                                    onClick={handleSyncImap}
                                    disabled={syncingImap}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    {syncingImap ? 'جاري الفحص...' : '📥 فحص صندوق الوارد (IMAP)'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
