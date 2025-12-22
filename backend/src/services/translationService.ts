/**
 * AI-Powered Translation Service
 * Automatic survey translation with context-aware AI translations
 */

import { prisma } from '../config/database';
import { AIProviderService } from './aiProviderService';
import logger from '../utils/logger';

// Types
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

interface TranslatableContent {
  surveyTitle: string;
  surveyDescription: string | null;
  welcomeText: string | null;
  thankYouText: string | null;
  pages: Array<{
    id: string;
    title: string | null;
    questions: Array<{
      id: string;
      text: string;
      description: string | null;
      options: Array<{ id: string; text: string }>;
    }>;
  }>;
}

// Supported languages
export const SUPPORTED_LANGUAGES: Record<string, { name: string; nativeName: string; dir: 'ltr' | 'rtl' }> = {
  'es': { name: 'Spanish', nativeName: 'Espanol', dir: 'ltr' },
  'fr': { name: 'French', nativeName: 'Francais', dir: 'ltr' },
  'de': { name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  'pt': { name: 'Portuguese', nativeName: 'Portugues', dir: 'ltr' },
  'zh-CN': { name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr' },
  'ja': { name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  'ko': { name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  'ar': { name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  'ru': { name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  'it': { name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  'nl': { name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr' },
};

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
    if (!survey) {
      throw new Error('Survey not found');
    }

    const results: TranslationResult[] = [];

    for (const language of request.targetLanguages) {
      try {
        const result = await this.translateToLanguage(
          survey,
          language,
          userId,
          request.options
        );
        results.push(result);

        // Save translations to database
        await this.saveTranslations(request.surveyId, language, result.translations);
      } catch (error: any) {
        logger.error(`Translation to ${language} failed:`, error);
        results.push({
          language,
          translations: null as any,
          confidence: 0,
          warnings: [`Translation failed: ${error.message}`],
        });
      }
    }

    return results;
  }

  /**
   * Translate survey content to a single language
   */
  private async translateToLanguage(
    survey: any,
    targetLanguage: string,
    userId: string,
    options?: TranslationRequest['options']
  ): Promise<TranslationResult> {
    const languageName = this.getLanguageName(targetLanguage);
    const provider = await AIProviderService.getUserProvider(userId);

    const translatableContent = this.extractTranslatableContent(survey);

    const prompt = `Translate the following survey content from English to ${languageName}.

${options?.contextHints ? `Context: ${options.contextHints}` : ''}
${options?.formality ? `Formality level: ${options.formality}` : ''}

Survey content to translate:
\`\`\`json
${JSON.stringify(translatableContent, null, 2)}
\`\`\`

Respond with ONLY a JSON object in the exact same structure, with all text values translated to ${languageName}.
Also include a "translationNotes" array with any warnings or notes about the translation, and a "confidence" number from 0-100.`;

    const result = await provider.chat({
      messages: [
        { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Translation failed');
    }

    // Parse response
    const { translations, notes, confidence } = this.parseTranslationResponse(result.data);

    if (!translations) {
      throw new Error('Failed to parse translation response');
    }

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
    const provider = await AIProviderService.getUserProvider(userId);
    const languageName = this.getLanguageName(targetLanguage);
    const sourceLangName = this.getLanguageName(sourceLanguage);

    const prompt = `Translate this survey question from ${sourceLangName} to ${languageName}:

Question: "${text}"
${options.length > 0 ? `Options: ${JSON.stringify(options)}` : ''}

Respond with JSON only: { "text": "translated question", "options": ["translated options"] }`;

    const result = await provider.chat({
      messages: [
        { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Translation failed');
    }

    const match = result.data.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        text: parsed.text || text,
        options: parsed.options || options,
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
    const provider = await AIProviderService.getUserProvider(userId);
    const languageName = this.getLanguageName(targetLanguage);

    const prompt = `Provide 3 alternative translations for this survey text in ${languageName}:

Original: "${text}"
Context: ${context}

Respond with JSON array only: ["translation 1", "translation 2", "translation 3"]
Each translation should be slightly different in tone or wording while preserving meaning.`;

    const result = await provider.chat({
      messages: [
        { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    if (!result.success || !result.data) {
      return [];
    }

    const match = result.data.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return [];
      }
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
    const provider = await AIProviderService.getUserProvider(userId);
    const languageName = this.getLanguageName(targetLanguage);

    const prompt = `Review this survey translation for quality:

Original (English): "${original}"
Translation (${languageName}): "${translation}"

Evaluate:
1. Accuracy (does it convey the same meaning?)
2. Natural language (does it sound native?)
3. Survey appropriateness (is it clear and unambiguous?)

Respond with JSON only:
{
  "score": 0-100,
  "issues": ["list of issues if any"],
  "suggestions": ["suggested improvements if any"]
}`;

    const result = await provider.chat({
      messages: [
        { role: 'system', content: 'You are a translation quality reviewer.' },
        { role: 'user', content: prompt },
      ],
    });

    if (!result.success || !result.data) {
      return { score: 0, issues: ['Failed to review'], suggestions: [] };
    }

    const match = result.data.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return { score: 0, issues: ['Failed to parse review'], suggestions: [] };
      }
    }

    return { score: 0, issues: ['Failed to review'], suggestions: [] };
  }

  /**
   * Get translation status for a survey
   */
  async getTranslationStatus(surveyId: string): Promise<{
    baseLanguage: string;
    translations: Array<{
      language: string;
      languageName: string;
      completeness: number;
      updatedAt: Date;
    }>;
  }> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: {
        baseLanguage: true,
        translations: {
          select: {
            language: true,
            updatedAt: true,
          },
        },
        questions: {
          select: { id: true },
        },
      },
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    const totalQuestions = survey.questions.length;

    // Calculate completeness for each translation
    const translationDetails = await Promise.all(
      survey.translations.map(async (t) => {
        const questionTranslations = await prisma.questionTranslation.count({
          where: {
            question: { surveyId },
            language: t.language,
          },
        });

        return {
          language: t.language,
          languageName: this.getLanguageName(t.language),
          completeness: totalQuestions > 0
            ? Math.round((questionTranslations / totalQuestions) * 100)
            : 100,
          updatedAt: t.updatedAt,
        };
      })
    );

    return {
      baseLanguage: survey.baseLanguage,
      translations: translationDetails,
    };
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

    // Upsert question and option translations
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

  private extractTranslatableContent(survey: any): TranslatableContent {
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
    translations: TranslationResult['translations'] | null;
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
      logger.error('Translation parse error:', e);
    }

    return {
      translations: null,
      notes: ['Failed to parse translation'],
      confidence: 0,
    };
  }

  private getLanguageName(code: string): string {
    return SUPPORTED_LANGUAGES[code]?.name || code;
  }
}

export const translationService = new TranslationService();
