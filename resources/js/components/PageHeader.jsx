import React from 'react';

export default function PageHeader({
    title,
    subtitle,
    icon,
    badge,
    children,
    className = '',
}) {
    return (
        <div
            className={`bg-white border border-slate-200 rounded-lg px-5 py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
        >
            {/* القسم الأيمن: الأيقونة + عنوان العرض + سطر التفاصيل */}
            <div className="flex items-center gap-3.5 min-w-0">
                {icon && (
                    <div className="w-9 h-9 rounded-lg bg-blue-50/80 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        {typeof icon === 'string' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
                            </svg>
                        ) : (
                            icon
                        )}
                    </div>
                )}

                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                            {title}
                        </h2>
                        {badge}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* القسم الأيسر: الإجراءات السريعة (أزرار أيقونية مع تلميحات) */}
            {children && (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {children}
                </div>
            )}
        </div>
    );
}
