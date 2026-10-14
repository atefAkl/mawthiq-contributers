import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('app_locale') || 'ar';
    });

    const isRtl = lang === 'ar';

    useEffect(() => {
        localStorage.setItem('app_locale', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    }, [lang, isRtl]);

    const toggleLang = () => {
        setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
    };

    const t = (key, fallback = '') => {
        return translations[lang]?.[key] ?? translations['ar']?.[key] ?? fallback ?? key;
    };

    return (
        <LanguageContext.Provider value={{ lang, isRtl, setLang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
