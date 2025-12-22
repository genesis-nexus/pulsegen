import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Languages,
  Sparkles,
  Check,
  RefreshCw,
  ChevronRight,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface TranslationManagerProps {
  surveyId: string;
}

interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

interface ExistingTranslation {
  id: string;
  language: string;
  title: string;
  updatedAt: string;
}

interface TranslationStatus {
  baseLanguage: string;
  translations: Array<{
    language: string;
    languageName: string;
    completeness: number;
    updatedAt: Date;
  }>;
}

const FLAG_EMOJIS: Record<string, string> = {
  es: '\uD83C\uDDEA\uD83C\uDDF8',
  fr: '\uD83C\uDDEB\uD83C\uDDF7',
  de: '\uD83C\uDDE9\uD83C\uDDEA',
  pt: '\uD83C\uDDF5\uD83C\uDDF9',
  'zh-CN': '\uD83C\uDDE8\uD83C\uDDF3',
  ja: '\uD83C\uDDEF\uD83C\uDDF5',
  ko: '\uD83C\uDDF0\uD83C\uDDF7',
  ar: '\uD83C\uDDF8\uD83C\uDDE6',
  ru: '\uD83C\uDDF7\uD83C\uDDFA',
  hi: '\uD83C\uDDEE\uD83C\uDDF3',
  it: '\uD83C\uDDEE\uD83C\uDDF9',
  nl: '\uD83C\uDDF3\uD83C\uDDF1',
};

export default function TranslationManager({ surveyId }: TranslationManagerProps) {
  const queryClient = useQueryClient();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [formality, setFormality] = useState<'formal' | 'informal' | 'neutral'>('neutral');
  const [showResults, setShowResults] = useState(false);

  // Get supported languages
  const { data: languages = [] } = useQuery<SupportedLanguage[]>({
    queryKey: ['supported-languages'],
    queryFn: async () => {
      const response = await api.get('/translations/languages');
      return response.data;
    },
  });

  // Get existing translations
  const { data: existingTranslations = [] } = useQuery<ExistingTranslation[]>({
    queryKey: ['translations', surveyId],
    queryFn: async () => {
      const response = await api.get(`/translations/surveys/${surveyId}/translations`);
      return response.data.translations;
    },
  });

  // Get translation status
  const { data: translationStatus } = useQuery<TranslationStatus>({
    queryKey: ['translation-status', surveyId],
    queryFn: async () => {
      const response = await api.get(`/translations/surveys/${surveyId}/translation-status`);
      return response.data;
    },
  });

  // Translate mutation
  const translateMutation = useMutation({
    mutationFn: async (targetLanguages: string[]) => {
      const response = await api.post(`/translations/surveys/${surveyId}/translate`, {
        targetLanguages,
        options: { formality },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['translations', surveyId] });
      queryClient.invalidateQueries({ queryKey: ['translation-status', surveyId] });
      setSelectedLanguages([]);
      setShowResults(true);

      const successful = data.translations.filter((t: any) => t.confidence > 0).length;
      const failed = data.translations.filter((t: any) => t.confidence === 0).length;

      if (failed > 0) {
        toast.error(`${failed} translation(s) failed. ${successful} succeeded.`);
      } else {
        toast.success(`Successfully translated to ${successful} language(s)!`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Translation failed');
    },
  });

  // Delete translation mutation
  const deleteMutation = useMutation({
    mutationFn: async (language: string) => {
      await api.delete(`/translations/surveys/${surveyId}/translations/${language}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations', surveyId] });
      queryClient.invalidateQueries({ queryKey: ['translation-status', surveyId] });
      toast.success('Translation deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete translation');
    },
  });

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const existingCodes = existingTranslations.map((t) => t.language);

  const handleTranslate = () => {
    if (selectedLanguages.length === 0) {
      toast.error('Please select at least one language');
      return;
    }
    translateMutation.mutate(selectedLanguages);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Languages className="w-5 h-5 text-primary-600" />
            AI Translation
          </h3>
          <p className="text-sm text-gray-500">
            Automatically translate your survey with AI
          </p>
        </div>
        {translationStatus && (
          <div className="text-sm text-gray-500">
            Base language:{' '}
            <span className="font-medium">{translationStatus.baseLanguage.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Formality Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Translation Style
        </label>
        <div className="flex gap-2">
          {(['formal', 'neutral', 'informal'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setFormality(style)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                formality === style
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Languages
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {languages.map((lang) => {
            const exists = existingCodes.includes(lang.code);
            const selected = selectedLanguages.includes(lang.code);
            const status = translationStatus?.translations.find(
              (t) => t.language === lang.code
            );

            return (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  selected
                    ? 'border-primary-500 bg-primary-50'
                    : exists
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-2xl">{FLAG_EMOJIS[lang.code] || lang.code}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{lang.name}</div>
                  <div className="text-xs text-gray-500">{lang.nativeName}</div>
                  {exists && status && (
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3" />
                      {status.completeness}% complete
                    </div>
                  )}
                </div>
                {selected && (
                  <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Translation Actions */}
      {selectedLanguages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">
                Translate to {selectedLanguages.length} language
                {selectedLanguages.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-blue-700">
                {selectedLanguages
                  .map((code) => languages.find((l) => l.code === code)?.name)
                  .join(', ')}
              </p>
            </div>
            <button
              onClick={handleTranslate}
              disabled={translateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 hover:bg-primary-700 transition-colors"
            >
              {translateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Translate with AI
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Translation Results */}
      {showResults && translateMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="w-5 h-5" />
              <span className="font-medium">Translation complete!</span>
            </div>
            <button onClick={() => setShowResults(false)} className="text-green-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Your survey has been translated. You can review and edit translations below.
          </p>
        </div>
      )}

      {/* Existing Translations */}
      {existingTranslations.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h4 className="font-medium">Existing Translations</h4>
          </div>
          <div className="divide-y">
            {existingTranslations.map((translation) => {
              const lang = languages.find((l) => l.code === translation.language);
              const status = translationStatus?.translations.find(
                (t) => t.language === translation.language
              );

              return (
                <div
                  key={translation.language}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {FLAG_EMOJIS[translation.language] || translation.language}
                    </span>
                    <div>
                      <div className="font-medium">{lang?.name || translation.language}</div>
                      <div className="text-sm text-gray-500">
                        Updated {new Date(translation.updatedAt).toLocaleDateString()}
                        {status && ` \u00B7 ${status.completeness}% complete`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLanguage(translation.language)}
                      className="text-sm text-primary-600 hover:text-primary-700 px-3 py-1 rounded hover:bg-primary-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete ${lang?.name || translation.language} translation?`
                          )
                        ) {
                          deleteMutation.mutate(translation.language);
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">About AI Translation</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            <ChevronRight className="w-4 h-4 inline text-gray-400" />
            All survey content is translated including questions, options, and messages
          </li>
          <li>
            <ChevronRight className="w-4 h-4 inline text-gray-400" />
            Context-aware translations optimized for survey terminology
          </li>
          <li>
            <ChevronRight className="w-4 h-4 inline text-gray-400" />
            Placeholders like {'{{name}}'} are preserved in translations
          </li>
          <li>
            <ChevronRight className="w-4 h-4 inline text-gray-400" />
            You can manually edit translations after AI generation
          </li>
        </ul>
      </div>
    </div>
  );
}
