import { useState } from 'react';
import { Question } from '../../types';
import { Globe } from 'lucide-react';

interface LanguageSwitcherQuestionProps {
  question: Question;
  onChange?: (value: any) => void;
  value?: any;
  disabled?: boolean;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  hi: 'हिन्दी',
};

const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  ru: '🇷🇺',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ar: '🇸🇦',
  hi: '🇮🇳',
};

export default function LanguageSwitcherQuestion({
  question,
  onChange,
  value,
  disabled,
}: LanguageSwitcherQuestionProps) {
  const settings = question.settings || {};
  const availableLanguages: string[] = settings.availableLanguages || ['en', 'es', 'fr', 'de'];
  const displayStyle = settings.displayStyle || 'dropdown';

  const [selectedLanguage, setSelectedLanguage] = useState(
    value?.textValue || availableLanguages[0] || 'en'
  );

  const handleLanguageChange = (langCode: string) => {
    if (disabled) return;

    setSelectedLanguage(langCode);

    if (onChange) {
      onChange({
        textValue: langCode,
        metadata: {
          languageName: LANGUAGE_NAMES[langCode] || langCode,
        },
      });
    }

    // In a real implementation, this would trigger survey language change
    // For now, just store the selection
  };

  if (displayStyle === 'dropdown') {
    return (
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-gray-400" />
        <select
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={disabled}
          className="block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          {availableLanguages.map((langCode) => (
            <option key={langCode} value={langCode}>
              {LANGUAGE_FLAGS[langCode] || ''} {LANGUAGE_NAMES[langCode] || langCode}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (displayStyle === 'flags') {
    return (
      <div className="flex flex-wrap gap-2">
        {availableLanguages.map((langCode) => (
          <button
            key={langCode}
            type="button"
            onClick={() => handleLanguageChange(langCode)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all
              ${selectedLanguage === langCode
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 bg-white hover:border-primary-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={LANGUAGE_NAMES[langCode]}
          >
            <span className="text-2xl">{LANGUAGE_FLAGS[langCode] || '🌐'}</span>
            <span className="text-sm font-medium">{langCode.toUpperCase()}</span>
          </button>
        ))}
      </div>
    );
  }

  // buttons style
  return (
    <div className="flex flex-wrap gap-2">
      {availableLanguages.map((langCode) => (
        <button
          key={langCode}
          type="button"
          onClick={() => handleLanguageChange(langCode)}
          disabled={disabled}
          className={`
            px-4 py-2 border-2 rounded-lg transition-all text-sm font-medium
            ${selectedLanguage === langCode
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {LANGUAGE_NAMES[langCode] || langCode}
        </button>
      ))}
    </div>
  );
}
