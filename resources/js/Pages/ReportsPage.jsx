import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function ReportsPage({ currentRoute, navigate }) {
    const { t } = useLanguage();
    const { showToast } = useToast();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadReportData = async () => {
        try {
            const res = await api.get('/reports/dashboard');
            setData(res);
        } catch (e) {
            showToast('فشل تحميل بيانات التقارير.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReportData();
    }, []);

    const printReport = () => {
        window.print();
    };

    if (loading) {
        return (
            <AppLayout currentRoute={currentRoute} navigate={navigate}>
                <div className="py-24 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    جاري إعداد التقارير والإحصائيات...
                </div>
            </AppLayout>
        );
    }

    const { overview, funnel, by_position, trends } = data || {};

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6 print:space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                            {t('reports')}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            مؤشرات الأداء، مراحل قمع الاستقطاب، نسب القبول، وتوزيع الأدوار.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={printReport}
                            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>طباعة التقرير (Print / PDF)</span>
                        </button>
                        <a
                            href="/api/applicants/export"
                            download
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5"
                        >
                            <span>تصدير البيانات (CSV)</span>
                        </a>
                    </div>
                </div>

                {/* Print Title Only */}
                <div className="hidden print:block text-center pb-4 border-b border-slate-300">
                    <h1 className="text-2xl font-black text-slate-900">{t('appName')}</h1>
                    <p className="text-xs text-slate-600">تقرير أداء دورة حياة المتقدمين والمساهمين - تاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                </div>

                {/* KPI Metrics Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-xs">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">إجمالي المتقدمين</span>
                        <span className="text-2xl font-black text-slate-800">{overview?.total_applicants ?? 0}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-xs">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">مرحلة مشارك</span>
                        <span className="text-2xl font-black text-indigo-600">{overview?.participant_count ?? 0}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-xs">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">تحت الاختبار</span>
                        <span className="text-2xl font-black text-amber-600">{overview?.probation_count ?? 0}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-xs">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">المقبولون نهائياً</span>
                        <span className="text-2xl font-black text-emerald-600">{overview?.accepted_count ?? 0}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-xs">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">{t('acceptanceRate')}</span>
                        <span className="text-2xl font-black text-emerald-600">{overview?.acceptance_rate ?? 0}%</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-xs">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">معدل التقييم</span>
                        <span className="text-2xl font-black text-indigo-700">{overview?.avg_interview_score ? `${overview.avg_interview_score}/10` : '—'}</span>
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                    <h3 className="font-bold text-sm text-slate-800 mb-2">
                        {t('pipelineFunnel')}
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">
                        تتبع تقدم المرشحين عبر محطات الدورة من التقديم الأولي حتى القبول النهائي.
                    </p>

                    <div className="space-y-4 max-w-2xl mx-auto">
                        {funnel?.map((stage, idx) => {
                            const max = overview?.total_applicants || 1;
                            const pct = Math.round((stage.count / max) * 100);

                            return (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>{stage.label_ar} ({stage.label_en})</span>
                                        <span>{stage.count} مرشح ({pct}%)</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.max(pct, 5)}%`,
                                                backgroundColor: stage.color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Applicants by Position & Roles */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                    <h3 className="font-bold text-sm text-slate-800 mb-4">
                        {t('positionDistribution')} (الطلبات ونسب القبول حسب التخصص)
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs text-slate-700">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-start">الدور / التخصص</th>
                                    <th className="px-4 py-3 text-center">عدد المتقدمين</th>
                                    <th className="px-4 py-3 text-center">المقبولون</th>
                                    <th className="px-4 py-3 text-start">النسبة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {by_position?.map((row, idx) => {
                                    const totalApps = overview?.total_applicants || 1;
                                    const sharePct = Math.round((row.count / totalApps) * 100);

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-bold text-slate-800">
                                                {row.position}
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold">
                                                {row.count}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600">
                                                {row.accepted_count}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-600 rounded-full"
                                                            style={{ width: `${sharePct}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono">{sharePct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Monthly Trends */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                    <h3 className="font-bold text-sm text-slate-800 mb-4">
                        {t('monthlyTrends')}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        {trends?.map((tItem, idx) => (
                            <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                                <span className="text-[11px] font-bold text-slate-500 block mb-1 truncate">{tItem.month}</span>
                                <span className="text-xl font-black text-slate-800 block">{tItem.total} طلب</span>
                                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">{tItem.accepted} مقبول</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
