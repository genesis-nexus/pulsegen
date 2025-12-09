# Implement AI-Powered Auto-Translation for Surveys

## Priority: P1 - High (Differentiator)
## Labels: `feature`, `ai`, `i18n`, `phase-3`, `differentiator`
## Estimated Effort: Medium

---

## Summary

Implement AI-powered automatic translation for surveys, allowing survey creators to instantly translate their surveys into multiple languages with high-quality, context-aware translations. This leverages PulseGen's existing multi-AI provider architecture.

---

## Background & Motivation

LimeSurvey supports multilingual surveys but requires manual translation for each language. PulseGen can leapfrog this by offering:
- One-click translation to any language
- Context-aware translations (survey terminology, not literal)
- Batch translation of entire surveys
- Translation quality scoring
- Human review workflow

This feature turns a tedious manual process into an instant, AI-powered workflow.

---

## Requirements

### Core Features

1. **One-Click Survey Translation**
   - Select target language(s)
   - AI translates all survey content
   - Preserves question types and logic
   - Maintains formatting and structure

2. **Translation Scope**
   - Survey title and description
   - Question text and descriptions
   - Answer options
   - Welcome/thank you messages
   - Validation error messages
   - Button labels (Next, Previous, Submit)

3. **Translation Quality**
   - Context-aware translations (survey context, not literal)
   - Preserve survey terminology
   - Handle cultural adaptations
   - Flag uncertain translations for review

4. **Translation Management**
   - Review and edit translations
   - Side-by-side comparison view
   - Mark translations as approved
   - Track translation status per language

5. **Supported Languages** (initial)
   - Spanish (es)
   - French (fr)
   - German (de)
   - Portuguese (pt)
   - Chinese Simplified (zh-CN)
   - Japanese (ja)
   - Korean (ko)
   - Arabic (ar)
   - Russian (ru)
   - Hindi (hi)
   - Italian (it)
   - Dutch (nl)

---

## Technical Implementation

### 1. Translation Service

**File: `backend/src/services/translationService.ts`**

```typescript
import { prisma } from '../lib/prisma';
import { getAIProvider } from './aiProviders';

interface TranslationRequest {
  surveyId: string;
  targetLanguages: string[];
  options?: {
    preserveFormatting?: boolean;
    contextHints?: string;
    formality?: 'formal' | 'informal' | 'neutral';
  };
}

interface TranslationResult {
  language: string;
  translations: {
    surveyTitle: string;
    surveyDescription: string | null;
    welcomeText: string | null;
    thankYouText: string | null;
    pages: Array<{
      id: string;
      title: string;
      questions: Array<{
        id: string;
        text: string;
        description: string | null;
        options: Array<{ id: string; text: string }>;
      }>;
    }>;
  };
  confidence: number;
  warnings: string[];
}

const TRANSLATION_SYSTEM_PROMPT = `You are an expert translator specializing in survey and questionnaire translation. Your translations should:

1. Be accurate and natural in the target language
2. Preserve the intent and tone of questions
3. Adapt cultural references appropriately
4. Maintain consistency in terminology throughout
5. Use appropriate formality level for surveys
6. Preserve any formatting or special characters

Important survey translation guidelines:
- Keep questions clear and unambiguous
- Maintain the same level of specificity
- Preserve scale semantics (e.g., "Strongly Agree" should have equivalent strength)
- Don't translate proper nouns or brand names unless specified
- Preserve placeholders like {{name}} or {variable}

Output your translation as JSON in the exact structure provided.`;

export class TranslationService {
  /**
   * Translate a survey to multiple languages
   */
  async translateSurvey(
    request: TranslationRequest,
    userId: string
  ): Promise<TranslationResult[]> {
    const survey = await this.getSurveyContent(request.surveyId);
    const aiProvider = await this.getUserAIProvider(userId);

    const results: TranslationResult[] = [];

    for (const language of request.targetLanguages) {
      const result = await this.translateToLanguage(
        survey,
        language,
        aiProvider,
        request.options
      );
      results.push(result);

      // Save translations to database
      await this.saveTranslations(request.surveyId, language, result.translations);
    }

    return results;
  }

  /**
   * Translate survey content to a single language
   */
  private async translateToLanguage(
    survey: any,
    targetLanguage: string,
    aiProvider: any,
    options?: TranslationRequest['options']
  ): Promise<TranslationResult> {
    const languageName = this.getLanguageName(targetLanguage);

    const prompt = `Translate the following survey content from English to ${languageName}.

${options?.contextHints ? `Context: ${options.contextHints}` : ''}
${options?.formality ? `Formality level: ${options.formality}` : ''}

Survey content to translate:
\`\`\`json
${JSON.stringify(this.extractTranslatableContent(survey), null, 2)}
\`\`\`

Respond with ONLY a JSON object in the exact same structure, with all text values translated to ${languageName}.
Also include a "translationNotes" array with any warnings or notes about the translation.`;

    const response = await aiProvider.chat([
      { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    // Parse response
    const { translations, notes, confidence } = this.parseTranslationResponse(response);

    return {
      language: targetLanguage,
      translations,
      confidence,
      warnings: notes,
    };
  }

  /**
   * Translate a single question (for real-time editing)
   */
  async translateQuestion(
    text: string,
    options: string[],
    sourceLanguage: string,
    targetLanguage: string,
    userId: string
  ): Promise<{ text: string; options: string[] }> {
    const aiProvider = await this.getUserAIProvider(userId);
    const languageName = this.getLanguageName(targetLanguage);

    const prompt = `Translate this survey question from ${this.getLanguageName(sourceLanguage)} to ${languageName}:

Question: "${text}"
${options.length > 0 ? `Options: ${JSON.stringify(options)}` : ''}

Respond with JSON: { "text": "translated question", "options": ["translated options"] }`;

    const response = await aiProvider.chat([
      { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        text: result.text || text,
        options: result.options || options,
      };
    }

    throw new Error('Failed to parse translation response');
  }

  /**
   * Get translation suggestions for a specific text
   */
  async getSuggestions(
    text: string,
    targetLanguage: string,
    context: string,
    userId: string
  ): Promise<string[]> {
    const aiProvider = await this.getUserAIProvider(userId);
    const languageName = this.getLanguageName(targetLanguage);

    const prompt = `Provide 3 alternative translations for this survey text in ${languageName}:

Original: "${text}"
Context: ${context}

Respond with JSON array: ["translation 1", "translation 2", "translation 3"]
Each translation should be slightly different in tone or wording while preserving meaning.`;

    const response = await aiProvider.chat([
      { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    const match = response.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }

    return [];
  }

  /**
   * Check translation quality and suggest improvements
   */
  async reviewTranslation(
    original: string,
    translation: string,
    targetLanguage: string,
    userId: string
  ): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const aiProvider = await this.getUserAIProvider(userId);
    const languageName = this.getLanguageName(targetLanguage);

    const prompt = `Review this survey translation for quality:

Original (English): "${original}"
Translation (${languageName}): "${translation}"

Evaluate:
1. Accuracy (does it convey the same meaning?)
2. Natural language (does it sound native?)
3. Survey appropriateness (is it clear and unambiguous?)

Respond with JSON:
{
  "score": 0-100,
  "issues": ["list of issues if any"],
  "suggestions": ["suggested improvements if any"]
}`;

    const response = await aiProvider.chat([
      { role: 'system', content: 'You are a translation quality reviewer.' },
      { role: 'user', content: prompt },
    ]);

    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }

    return { score: 0, issues: ['Failed to review'], suggestions: [] };
  }

  /**
   * Save translations to database
   */
  private async saveTranslations(
    surveyId: string,
    language: string,
    translations: TranslationResult['translations']
  ): Promise<void> {
    // Upsert survey translation
    await prisma.surveyTranslation.upsert({
      where: { surveyId_language: { surveyId, language } },
      create: {
        surveyId,
        language,
        title: translations.surveyTitle,
        description: translations.surveyDescription,
        welcomeText: translations.welcomeText,
        thankYouText: translations.thankYouText,
      },
      update: {
        title: translations.surveyTitle,
        description: translations.surveyDescription,
        welcomeText: translations.welcomeText,
        thankYouText: translations.thankYouText,
      },
    });

    // Upsert question translations
    for (const page of translations.pages) {
      for (const question of page.questions) {
        await prisma.questionTranslation.upsert({
          where: { questionId_language: { questionId: question.id, language } },
          create: {
            questionId: question.id,
            language,
            text: question.text,
            description: question.description,
          },
          update: {
            text: question.text,
            description: question.description,
          },
        });

        // Upsert option translations
        for (const option of question.options) {
          await prisma.questionOptionTranslation.upsert({
            where: { optionId_language: { optionId: option.id, language } },
            create: {
              optionId: option.id,
              language,
              text: option.text,
            },
            update: {
              text: option.text,
            },
          });
        }
      }
    }
  }

  // Helper methods
  private async getSurveyContent(surveyId: string) {
    return prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        pages: {
          include: {
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  private async getUserAIProvider(userId: string) {
    // Get user's configured AI provider
    return getAIProvider(userId);
  }

  private extractTranslatableContent(survey: any) {
    return {
      surveyTitle: survey.title,
      surveyDescription: survey.description,
      welcomeText: survey.welcomeText,
      thankYouText: survey.thankYouText,
      pages: survey.pages.map((page: any) => ({
        id: page.id,
        title: page.title,
        questions: page.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          description: q.description,
          options: q.options.map((o: any) => ({
            id: o.id,
            text: o.text,
          })),
        })),
      })),
    };
  }

  private parseTranslationResponse(response: string): {
    translations: any;
    notes: string[];
    confidence: number;
  } {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          translations: parsed,
          notes: parsed.translationNotes || [],
          confidence: parsed.confidence || 85,
        };
      }
    } catch (e) {
      console.error('Translation parse error:', e);
    }

    return {
      translations: null,
      notes: ['Failed to parse translation'],
      confidence: 0,
    };
  }

  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'pt': 'Portuguese',
      'zh-CN': 'Chinese (Simplified)',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'ru': 'Russian',
      'hi': 'Hindi',
      'it': 'Italian',
      'nl': 'Dutch',
    };
    return languages[code] || code;
  }
}

export const translationService = new TranslationService();
```

### 2. API Endpoints

**File: `backend/src/routes/translationRoutes.ts`**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { translationService } from '../services/translationService';

const router = Router();

// Translate entire survey
router.post('/surveys/:surveyId/translate', authenticate, async (req, res) => {
  const { targetLanguages, options } = req.body;

  try {
    const results = await translationService.translateSurvey(
      {
        surveyId: req.params.surveyId,
        targetLanguages,
        options,
      },
      req.user.id
    );

    res.json({ translations: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Translate single question (for real-time editing)
router.post('/translate/question', authenticate, async (req, res) => {
  const { text, options, sourceLanguage, targetLanguage } = req.body;

  try {
    const result = await translationService.translateQuestion(
      text,
      options || [],
      sourceLanguage || 'en',
      targetLanguage,
      req.user.id
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get translation suggestions
router.post('/translate/suggestions', authenticate, async (req, res) => {
  const { text, targetLanguage, context } = req.body;

  const suggestions = await translationService.getSuggestions(
    text,
    targetLanguage,
    context || 'survey question',
    req.user.id
  );

  res.json({ suggestions });
});

// Review translation quality
router.post('/translate/review', authenticate, async (req, res) => {
  const { original, translation, targetLanguage } = req.body;

  const review = await translationService.reviewTranslation(
    original,
    translation,
    targetLanguage,
    req.user.id
  );

  res.json(review);
});

// Get translation status for survey
router.get('/surveys/:surveyId/translations', authenticate, async (req, res) => {
  const translations = await prisma.surveyTranslation.findMany({
    where: { surveyId: req.params.surveyId },
    select: {
      language: true,
      title: true,
      updatedAt: true,
    },
  });

  res.json({ translations });
});

export default router;
```

### 3. Frontend: Translation Manager

**File: `frontend/src/components/survey/TranslationManager.tsx`**

```typescript
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Languages, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
];

interface TranslationManagerProps {
  surveyId: string;
}

export function TranslationManager({ surveyId }: TranslationManagerProps) {
  const queryClient = useQueryClient();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Get existing translations
  const { data: existingTranslations } = useQuery({
    queryKey: ['translations', surveyId],
    queryFn: () => api.get(`/surveys/${surveyId}/translations`).then(r => r.data.translations),
  });

  // Translate mutation
  const translateMutation = useMutation({
    mutationFn: (languages: string[]) =>
      api.post(`/surveys/${surveyId}/translate`, { targetLanguages: languages }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations', surveyId] });
      setSelectedLanguages([]);
    },
  });

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const existingCodes = existingTranslations?.map((t: any) => t.language) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Languages className="w-5 h-5" />
            AI Translation
          </h3>
          <p className="text-sm text-gray-500">
            Automatically translate your survey with AI
          </p>
        </div>
      </div>

      {/* Language Selection */}
      <div className="grid grid-cols-3 gap-3">
        {SUPPORTED_LANGUAGES.map(lang => {
          const exists = existingCodes.includes(lang.code);
          const selected = selectedLanguages.includes(lang.code);

          return (
            <button
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                selected
                  ? 'border-primary bg-primary/5'
                  : exists
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{lang.name}</div>
                {exists && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Translated
                  </div>
                )}
              </div>
              {selected && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Translation Actions */}
      {selectedLanguages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Translate to {selectedLanguages.length} language{selectedLanguages.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-600">
                {selectedLanguages.map(code =>
                  SUPPORTED_LANGUAGES.find(l => l.code === code)?.name
                ).join(', ')}
              </p>
            </div>
            <button
              onClick={() => translateMutation.mutate(selectedLanguages)}
              disabled={translateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
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
      {translateMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            <span className="font-medium">Translation complete!</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Your survey has been translated. You can review and edit translations in the survey settings.
          </p>
        </div>
      )}

      {/* Existing Translations */}
      {existingTranslations && existingTranslations.length > 0 && (
        <div className="border rounded-lg">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h4 className="font-medium">Existing Translations</h4>
          </div>
          <div className="divide-y">
            {existingTranslations.map((translation: any) => {
              const lang = SUPPORTED_LANGUAGES.find(l => l.code === translation.language);
              return (
                <div key={translation.language} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang?.flag}</span>
                    <div>
                      <div className="font-medium">{lang?.name}</div>
                      <div className="text-sm text-gray-500">
                        Updated {new Date(translation.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button className="text-sm text-primary hover:underline">
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] Can select multiple target languages
- [ ] One-click translation of entire survey
- [ ] All survey content translated (title, questions, options, etc.)
- [ ] Translations saved to database
- [ ] Existing translations displayed
- [ ] Can retranslate/update translations
- [ ] Translation quality confidence score shown
- [ ] Warnings for uncertain translations displayed
- [ ] Side-by-side comparison for review
- [ ] Individual text translation endpoint works
- [ ] Translation suggestions for alternatives
- [ ] Works with all configured AI providers
- [ ] Handles RTL languages (Arabic)
- [ ] Preserves placeholders and formatting
- [ ] Loading states during translation
- [ ] Error handling for failed translations

---

## Files to Create/Modify

### New Files
- `backend/src/services/translationService.ts`
- `backend/src/routes/translationRoutes.ts`
- `frontend/src/components/survey/TranslationManager.tsx`
- `frontend/src/components/survey/TranslationEditor.tsx`

### Modified Files
- `backend/src/routes/index.ts`
- `frontend/src/pages/SurveyBuilder.tsx` - Add translation tab

---

## Dependencies

- Issue #001 (i18n Framework) - Database schema for translations
- Working AI provider configuration
