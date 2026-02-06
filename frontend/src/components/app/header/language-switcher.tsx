'use client';

import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import '@/lib/i18n'; // Import i18n config

export function LanguageSwitcher() {
    const { i18n, t } = useTranslation();

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    ];

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 h-10 max-h-10 hover:bg-gray-100 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
                        <Languages className="h-4 w-4" />
                    </div>
                    <span className="hidden md:inline font-medium text-sm text-gray-700 leading-none">
                        {currentLanguage.nativeName}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 p-1">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className="flex items-center justify-between cursor-pointer rounded-md"
                    >
                        <span className={i18n.language === lang.code ? 'font-bold text-blue-600' : ''}>
                            {lang.nativeName}
                        </span>
                        {i18n.language === lang.code && <Check className="h-4 w-4 text-blue-600" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
