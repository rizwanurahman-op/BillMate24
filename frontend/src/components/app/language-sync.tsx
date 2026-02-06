'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export function LanguageSync() {
    const { i18n } = useTranslation();

    useEffect(() => {
        const updateLang = (lang: string) => {
            document.documentElement.lang = lang;
            // Also add a data attribute as a fallback or for more specific CSS
            document.documentElement.setAttribute('data-lang', lang);
        };

        // Initial set
        updateLang(i18n.language);

        // Listen for changes
        const handleLanguageChanged = (lang: string) => {
            updateLang(lang);
        };

        i18n.on('languageChanged', handleLanguageChanged);

        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, [i18n]);

    return null;
}
