import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../lib/i18n';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        const lang = supportedLanguages.find(l => l.code === langCode);
        if (lang) {
            document.documentElement.dir = lang.dir;
            document.documentElement.lang = langCode;
        }
    };

    const currentLang = supportedLanguages.find(l => l.code === i18n.language) || supportedLanguages[0];

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLang.name}</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-800 invisible group-hover:visible z-50 opacity-0 group-hover:opacity-100 transition-all">
                <div className="py-1">
                    {supportedLanguages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${i18n.language === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                                }`}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
