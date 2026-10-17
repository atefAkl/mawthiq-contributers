import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function SmartEditor({
    value = '',
    onChange,
    placeholder,
    minHeight = '90px',
    className = '',
    dir,
    readOnly = false,
}) {
    const { t, isRtl } = useLanguage();
    const editorRef = useRef(null);
    const lastHtmlRef = useRef(value || '');
    const [currentFormat, setCurrentFormat] = useState('p');
    const [isBold, setIsBold] = useState(false);
    const [isOrderedList, setIsOrderedList] = useState(false);
    const [isUnorderedList, setIsUnorderedList] = useState(false);
    const [currentAlign, setCurrentAlign] = useState(isRtl ? 'right' : 'left');
    const [isEmpty, setIsEmpty] = useState(!value || value === '<p><br></p>' || value === '<br>');

    const resolvedDir = dir || (isRtl ? 'rtl' : 'ltr');
    const resolvedPlaceholder = placeholder || t('smartEditorPlaceholder');

    // Update active toolbar states based on current selection
    const updateActiveStates = useCallback(() => {
        if (!editorRef.current || readOnly) return;
        try {
            setIsBold(document.queryCommandState('bold'));
            setIsOrderedList(document.queryCommandState('insertOrderedList'));
            setIsUnorderedList(document.queryCommandState('insertUnorderedList'));

            if (document.queryCommandState('justifyCenter')) {
                setCurrentAlign('center');
            } else if (document.queryCommandState('justifyLeft')) {
                setCurrentAlign('left');
            } else if (document.queryCommandState('justifyRight')) {
                setCurrentAlign('right');
            } else {
                setCurrentAlign(resolvedDir === 'rtl' ? 'right' : 'left');
            }

            const format = (document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, '');
            if (format === 'h3' || format === 'h4') {
                setCurrentFormat(format);
            } else {
                setCurrentFormat('p');
            }
        } catch {
            // ignore selection query errors
        }
    }, [readOnly, resolvedDir]);

    // Synchronize external value changes if not matching internal state
    useEffect(() => {
        if (editorRef.current && value !== lastHtmlRef.current) {
            editorRef.current.innerHTML = value || '';
            lastHtmlRef.current = value || '';
            const textContent = editorRef.current.textContent || '';
            setIsEmpty(!textContent.trim() && !editorRef.current.querySelector('img, hr, table'));
        }
    }, [value]);

    const handleInput = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        lastHtmlRef.current = html;
        const textContent = editorRef.current.textContent || '';
        const empty = !textContent.trim() && !editorRef.current.querySelector('img, hr, table');
        setIsEmpty(empty);

        if (onChange) {
            onChange(empty ? '' : html);
        }
        updateActiveStates();
    };

    const exec = (command, value = null) => {
        if (readOnly) return;
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        handleInput();
        updateActiveStates();
    };

    const handleFormatBlock = (tag) => {
        if (readOnly) return;
        editorRef.current?.focus();
        // Wraps current line/block in <p>, <h3>, or <h4>
        document.execCommand('formatBlock', false, tag);
        handleInput();
        updateActiveStates();
    };

    return (
        <div className={`border border-slate-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600 transition-all ${className}`}>
            {/* Toolbar */}
            {!readOnly && (
                <div
                    className="bg-slate-50/90 border-b border-slate-200 px-2 py-1 flex flex-wrap items-center gap-1 select-none text-xs"
                    dir={resolvedDir}
                >
                    {/* Heading Selector (عادي - عنوان رئيسي - عنوان ثانوي) */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5">
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleFormatBlock('p');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                currentFormat === 'p'
                                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                            title={t('normalText')}
                        >
                            {t('normalText')}
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleFormatBlock('h3');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                currentFormat === 'h3'
                                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                            title={t('headingMain')}
                        >
                            {t('headingMain')}
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleFormatBlock('h4');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                currentFormat === 'h4'
                                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                            title={t('headingSub')}
                        >
                            {t('headingSub')}
                        </button>
                    </div>

                    <div className="h-4 w-px bg-slate-200 mx-0.5" />

                    {/* Bold Button */}
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            exec('bold');
                        }}
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs transition-colors cursor-pointer border ${
                            isBold
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-blue-600'
                        }`}
                        title={t('bold')}
                        aria-label={t('bold')}
                    >
                        <span className="font-extrabold text-[13px]">B</span>
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-0.5" />

                    {/* List Buttons (قائمة مرتبة وغير مرتبة) */}
                    <div className="flex items-center gap-1">
                        {/* Unordered List */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                exec('insertUnorderedList');
                            }}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${
                                isUnorderedList
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-blue-600'
                            }`}
                            title={t('unorderedList')}
                            aria-label={t('unorderedList')}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16M2 6h.01M2 12h.01M2 18h.01" />
                            </svg>
                        </button>

                        {/* Ordered List */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                exec('insertOrderedList');
                            }}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${
                                isOrderedList
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-blue-600'
                            }`}
                            title={t('orderedList')}
                            aria-label={t('orderedList')}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" />
                            </svg>
                        </button>
                    </div>

                    <div className="h-4 w-px bg-slate-200 mx-0.5" />

                    {/* Alignment Buttons (يمين - وسط - يسار) */}
                    <div className="flex items-center gap-1">
                        {/* Align Right */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                exec('justifyRight');
                            }}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${
                                currentAlign === 'right'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-blue-600'
                            }`}
                            title={t('alignRight')}
                            aria-label={t('alignRight')}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                            </svg>
                        </button>

                        {/* Align Center */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                exec('justifyCenter');
                            }}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${
                                currentAlign === 'center'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-blue-600'
                            }`}
                            title={t('alignCenter')}
                            aria-label={t('alignCenter')}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                            </svg>
                        </button>

                        {/* Align Left */}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                exec('justifyLeft');
                            }}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${
                                currentAlign === 'left'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-blue-600'
                            }`}
                            title={t('alignLeft')}
                            aria-label={t('alignLeft')}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Editable Content Area */}
            <div className="relative">
                {isEmpty && !readOnly && (
                    <div
                        className="absolute start-3 top-2.5 text-xs text-slate-400 pointer-events-none select-none"
                        dir={resolvedDir}
                    >
                        {resolvedPlaceholder}
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable={!readOnly}
                    onInput={handleInput}
                    onKeyUp={updateActiveStates}
                    onMouseUp={updateActiveStates}
                    dir={resolvedDir}
                    style={{ minHeight }}
                    className="p-3 text-xs text-slate-700 leading-relaxed focus:outline-none overflow-y-auto [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mb-1 [&_h4]:text-xs [&_h4]:font-bold [&_h4]:text-slate-800 [&_h4]:mb-1 [&_p]:mb-1 [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:mb-1.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:mb-1.5 [&_li]:mb-0.5 [&_strong]:font-bold [&_strong]:text-slate-900"
                />
            </div>
        </div>
    );
}
