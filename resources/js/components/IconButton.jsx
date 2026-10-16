import React from 'react';

const VARIANT_STYLES = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-2xs',
    secondary: 'bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-2xs',
    active: 'bg-blue-50 hover:bg-blue-100/80 text-blue-600 border border-blue-200 shadow-2xs',
    success: 'bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-2xs',
    warning: 'bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-2xs',
    danger: 'bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 shadow-2xs',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-400 hover:text-blue-600 border border-transparent',
};

const SIZE_STYLES = {
    md: 'w-9 h-9 rounded-lg',
    sm: 'w-7 h-7 rounded-md',
};

export default function IconButton({
    icon,
    tooltip,
    onClick,
    href,
    download,
    target,
    rel,
    type = 'button',
    variant = 'secondary',
    size = 'md',
    disabled = false,
    tooltipPosition = 'bottom',
    className = '',
    children,
}) {
    const baseClasses = `relative group inline-flex items-center justify-center shrink-0 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
        SIZE_STYLES[size] || SIZE_STYLES.md
    } ${VARIANT_STYLES[variant] || VARIANT_STYLES.secondary} ${className}`;

    const renderIcon = () => {
        if (children) return children;
        if (typeof icon === 'string') {
            return (
                <svg className={size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
            );
        }
        return icon;
    };

    const tooltipPosClasses =
        tooltipPosition === 'top'
            ? 'bottom-full mb-2'
            : 'top-full mt-2';

    const arrowPosClasses =
        tooltipPosition === 'top'
            ? 'top-full -mt-1 border-t-slate-900 border-x-transparent border-b-transparent'
            : 'bottom-full -mb-1 border-b-slate-900 border-x-transparent border-t-transparent';

    const tooltipElement = tooltip ? (
        <span
            role="tooltip"
            className={`pointer-events-none absolute ${tooltipPosClasses} left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-lg`}
        >
            {tooltip}
            <span className={`absolute left-1/2 -translate-x-1/2 border-4 ${arrowPosClasses}`} />
        </span>
    ) : null;

    if (href) {
        return (
            <a
                href={href}
                download={download}
                target={target}
                rel={rel}
                onClick={onClick}
                aria-label={tooltip}
                className={baseClasses}
            >
                {renderIcon()}
                {tooltipElement}
            </a>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-label={tooltip}
            className={baseClasses}
        >
            {renderIcon()}
            {tooltipElement}
        </button>
    );
}
