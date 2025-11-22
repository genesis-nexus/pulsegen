/**
 * Sentiment Analyzer
 *
 * Analyzes sentiment in open-ended survey responses.
 * Can use MindsDB for ML-powered analysis or fallback to rule-based lexicon analysis.
 *
 * Features:
 * - Positive/Negative/Neutral/Mixed classification
 * - Sentiment score (-1 to 1)
 * - Emotion detection (joy, anger, sadness, etc.)
 * - Keyword extraction
 */

import { PrismaClient } from '@prisma/client';
import {
  SentimentInput,
  SentimentResult,
  MLFeatureType,
  PredictionRequest,
} from '../mlProviders/types';
import { BaseMLProvider } from '../mlProviders/baseProvider';
import { getOrCreateProvider } from '../mlProviders/providerFactory';

const prisma = new PrismaClient();

// Settings for sentiment analysis
export interface SentimentAnalysisSettings {
  // Confidence thresholds
  confidenceThreshold: number; // Minimum confidence to trust result
  mixedSentimentThreshold: number; // Score range to classify as "mixed"

  // Feature flags
  includeEmotions: boolean;
  extractKeywords: boolean;
  detectSarcasm: boolean;

  // Language settings
  defaultLanguage: string;
  supportedLanguages: string[];

  // Processing
  maxTextLength: number; // Truncate text longer than this
  minTextLength: number; // Minimum text length to analyze

  // Lexicon weights (for rule-based fallback)
  lexiconWeights: {
    positive: number;
    negative: number;
    intensifier: number;
    negation: number;
  };
}

const DEFAULT_SETTINGS: SentimentAnalysisSettings = {
  confidenceThreshold: 0.6,
  mixedSentimentThreshold: 0.2, // Scores between -0.2 and 0.2 are "mixed"
  includeEmotions: true,
  extractKeywords: true,
  detectSarcasm: false,
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'de'],
  maxTextLength: 5000,
  minTextLength: 3,
  lexiconWeights: {
    positive: 1.0,
    negative: -1.0,
    intensifier: 1.5,
    negation: -1.0,
  },
};

// Simple sentiment lexicons for rule-based fallback
const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like',
  'best', 'happy', 'pleased', 'satisfied', 'awesome', 'perfect', 'outstanding',
  'brilliant', 'superb', 'helpful', 'friendly', 'easy', 'quick', 'efficient',
  'recommend', 'impressed', 'enjoyable', 'positive', 'thanks', 'thank', 'appreciate',
  'beautiful', 'nice', 'lovely', 'valuable', 'useful', 'reliable', 'professional',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate', 'dislike',
  'disappointed', 'frustrating', 'annoying', 'difficult', 'slow', 'confusing',
  'unhappy', 'angry', 'upset', 'problem', 'issue', 'bug', 'broken', 'fail',
  'failed', 'useless', 'waste', 'expensive', 'overpriced', 'rude', 'unprofessional',
  'complicated', 'impossible', 'never', 'horrible', 'disgusting', 'ridiculous',
]);

const INTENSIFIERS = new Set([
  'very', 'really', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely',
  'highly', 'definitely', 'certainly', 'particularly', 'especially', 'exceptionally',
]);

const NEGATIONS = new Set([
  'not', "n't", 'no', 'never', 'none', 'neither', 'nobody', 'nothing', 'nowhere',
  'hardly', 'barely', 'scarcely', 'without', "don't", "doesn't", "didn't", "won't",
]);

// Emotion keywords
const EMOTION_KEYWORDS: Record<string, Set<string>> = {
  joy: new Set(['happy', 'joy', 'delighted', 'pleased', 'excited', 'thrilled', 'wonderful']),
  anger: new Set(['angry', 'furious', 'annoyed', 'frustrated', 'irritated', 'outraged']),
  sadness: new Set(['sad', 'disappointed', 'unhappy', 'depressed', 'miserable', 'upset']),
  fear: new Set(['afraid', 'scared', 'worried', 'anxious', 'nervous', 'concerned']),
  surprise: new Set(['surprised', 'amazed', 'astonished', 'shocked', 'unexpected']),
  disgust: new Set(['disgusted', 'revolted', 'appalled', 'horrible', 'gross']),
};

export class SentimentAnalyzer {
  private provider: BaseMLProvider | null = null;
  private settings: SentimentAnalysisSettings;
  private modelName: string | null = null;
  private useMLModel: boolean = false;

  constructor(settings?: Partial<SentimentAnalysisSettings>) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }

  /**
   * Initialize with ML provider (optional)
   */
  async initializeWithProvider(
    providerConfig: any,
    modelName: string
  ): Promise<void> {
    try {
      this.provider = await getOrCreateProvider(providerConfig);
      this.modelName = modelName;

      const isReady = await this.provider.isModelReady(modelName);
      this.useMLModel = isReady;
    } catch (error) {
      console.error('Failed to initialize ML provider for sentiment analysis:', error);
      this.useMLModel = false;
    }
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(input: SentimentInput): Promise<SentimentResult> {
    const { text, context } = input;

    // Validate input
    if (!text || text.length < this.settings.minTextLength) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.3,
        emotions: {},
        keywords: [],
      };
    }

    // Truncate if too long
    const processedText = text.length > this.settings.maxTextLength
      ? text.substring(0, this.settings.maxTextLength)
      : text;

    // If ML model is available, use it
    if (this.useMLModel && this.provider && this.modelName) {
      try {
        return await this.analyzeWithML(processedText, context);
      } catch (error) {
        console.error('ML-based sentiment analysis failed, falling back to lexicon:', error);
      }
    }

    // Fallback to lexicon-based analysis
    return this.analyzeWithLexicon(processedText);
  }

  /**
   * Batch analyze multiple texts
   */
  async analyzeBatch(inputs: SentimentInput[]): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];

    // Process in parallel with concurrency limit
    const concurrencyLimit = 10;
    for (let i = 0; i < inputs.length; i += concurrencyLimit) {
      const batch = inputs.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(input => this.analyzeSentiment(input))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * ML-based sentiment analysis
   */
  private async analyzeWithML(
    text: string,
    context?: SentimentInput['context']
  ): Promise<SentimentResult> {
    if (!this.provider || !this.modelName) {
      throw new Error('ML provider not initialized');
    }

    const features: Record<string, any> = {
      text,
      text_length: text.length,
      word_count: text.split(/\s+/).length,
    };

    if (context) {
      if (context.questionText) features.question_context = context.questionText;
      if (context.language) features.language = context.language;
    }

    const request: PredictionRequest = {
      modelName: this.modelName,
      input: features,
    };

    const prediction = await this.provider.predict(request);
    return this.parseMLPrediction(prediction, text);
  }

  /**
   * Lexicon-based sentiment analysis (fallback)
   */
  private analyzeWithLexicon(text: string): SentimentResult {
    const words = this.tokenize(text);
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let isNegated = false;
    let intensifierMultiplier = 1;
    const detectedEmotions: Record<string, number> = {};
    const keywords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();

      // Check for negation
      if (NEGATIONS.has(word)) {
        isNegated = true;
        continue;
      }

      // Check for intensifiers
      if (INTENSIFIERS.has(word)) {
        intensifierMultiplier = this.settings.lexiconWeights.intensifier;
        continue;
      }

      // Check sentiment
      let wordScore = 0;
      if (POSITIVE_WORDS.has(word)) {
        wordScore = this.settings.lexiconWeights.positive;
        positiveCount++;
        keywords.push(word);
      } else if (NEGATIVE_WORDS.has(word)) {
        wordScore = this.settings.lexiconWeights.negative;
        negativeCount++;
        keywords.push(word);
      }

      // Apply modifiers
      if (wordScore !== 0) {
        if (isNegated) {
          wordScore *= this.settings.lexiconWeights.negation;
        }
        wordScore *= intensifierMultiplier;
        score += wordScore;
      }

      // Check emotions
      if (this.settings.includeEmotions) {
        for (const [emotion, emotionWords] of Object.entries(EMOTION_KEYWORDS)) {
          if (emotionWords.has(word)) {
            detectedEmotions[emotion] = (detectedEmotions[emotion] || 0) + 1;
          }
        }
      }

      // Reset modifiers after processing a sentiment word
      if (wordScore !== 0) {
        isNegated = false;
        intensifierMultiplier = 1;
      }
    }

    // Normalize score to -1 to 1 range
    const totalSentimentWords = positiveCount + negativeCount;
    const normalizedScore = totalSentimentWords > 0
      ? Math.max(-1, Math.min(1, score / (totalSentimentWords * 2)))
      : 0;

    // Determine sentiment category
    const sentiment = this.scoreToSentiment(normalizedScore);

    // Normalize emotion scores
    const normalizedEmotions: Record<string, number> = {};
    const maxEmotionCount = Math.max(...Object.values(detectedEmotions), 1);
    for (const [emotion, count] of Object.entries(detectedEmotions)) {
      normalizedEmotions[emotion] = count / maxEmotionCount;
    }

    // Calculate confidence based on evidence
    const confidence = this.calculateConfidence(words.length, totalSentimentWords);

    return {
      sentiment,
      score: normalizedScore,
      confidence,
      emotions: this.settings.includeEmotions ? normalizedEmotions : undefined,
      keywords: this.settings.extractKeywords ? [...new Set(keywords)].slice(0, 10) : undefined,
    };
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  /**
   * Convert score to sentiment category
   */
  private scoreToSentiment(score: number): SentimentResult['sentiment'] {
    const threshold = this.settings.mixedSentimentThreshold;

    if (score > threshold) {
      return 'positive';
    } else if (score < -threshold) {
      return 'negative';
    } else if (Math.abs(score) < threshold * 0.5) {
      return 'neutral';
    } else {
      return 'mixed';
    }
  }

  /**
   * Calculate confidence based on evidence
   */
  private calculateConfidence(wordCount: number, sentimentWordCount: number): number {
    // Base confidence
    let confidence = 0.5;

    // More words = more confidence (up to a point)
    const wordFactor = Math.min(1, wordCount / 50);
    confidence += wordFactor * 0.2;

    // More sentiment words = more confidence
    const sentimentFactor = Math.min(1, sentimentWordCount / 10);
    confidence += sentimentFactor * 0.2;

    // Cap at threshold
    confidence = Math.min(confidence, 0.85);

    return confidence;
  }

  /**
   * Parse ML prediction into result format
   */
  private parseMLPrediction(prediction: any, originalText: string): SentimentResult {
    const output = prediction.prediction;
    const confidence = prediction.confidence || 0.8;

    let sentiment: SentimentResult['sentiment'] = 'neutral';
    let score = 0;
    let emotions: Record<string, number> | undefined;
    let keywords: string[] | undefined;

    if (typeof output === 'string') {
      // Output is sentiment label
      sentiment = this.normalizeSentimentLabel(output);
      score = this.sentimentToScore(sentiment);
    } else if (typeof output === 'number') {
      // Output is score
      score = Math.max(-1, Math.min(1, output));
      sentiment = this.scoreToSentiment(score);
    } else if (output && typeof output === 'object') {
      // Output is structured object
      if (output.sentiment) {
        sentiment = this.normalizeSentimentLabel(output.sentiment);
      }
      if (typeof output.score === 'number') {
        score = Math.max(-1, Math.min(1, output.score));
      } else {
        score = this.sentimentToScore(sentiment);
      }
      emotions = output.emotions;
      keywords = output.keywords;
    }

    // Fallback to extract keywords if not provided by ML
    if (!keywords && this.settings.extractKeywords) {
      keywords = this.extractKeywordsFromText(originalText);
    }

    return {
      sentiment,
      score,
      confidence,
      emotions,
      keywords,
    };
  }

  /**
   * Normalize sentiment label to our standard format
   */
  private normalizeSentimentLabel(label: string): SentimentResult['sentiment'] {
    const normalized = label.toLowerCase().trim();

    if (['positive', 'pos', '1', 'good'].includes(normalized)) {
      return 'positive';
    } else if (['negative', 'neg', '-1', 'bad'].includes(normalized)) {
      return 'negative';
    } else if (['neutral', '0', 'none'].includes(normalized)) {
      return 'neutral';
    } else {
      return 'mixed';
    }
  }

  /**
   * Convert sentiment label to score
   */
  private sentimentToScore(sentiment: SentimentResult['sentiment']): number {
    const scores: Record<SentimentResult['sentiment'], number> = {
      positive: 0.7,
      negative: -0.7,
      neutral: 0,
      mixed: 0.1,
    };
    return scores[sentiment];
  }

  /**
   * Simple keyword extraction
   */
  private extractKeywordsFromText(text: string): string[] {
    const words = this.tokenize(text);
    const keywords: string[] = [];

    for (const word of words) {
      if (POSITIVE_WORDS.has(word) || NEGATIVE_WORDS.has(word)) {
        keywords.push(word);
      }
    }

    return [...new Set(keywords)].slice(0, 10);
  }

  /**
   * Get aggregated sentiment statistics for multiple results
   */
  getAggregatedStats(results: SentimentResult[]): {
    averageScore: number;
    sentimentDistribution: Record<string, number>;
    topEmotions: Array<{ emotion: string; count: number }>;
    topKeywords: Array<{ keyword: string; count: number }>;
  } {
    const sentimentCounts: Record<string, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
    };
    const emotionCounts: Record<string, number> = {};
    const keywordCounts: Record<string, number> = {};
    let totalScore = 0;

    for (const result of results) {
      sentimentCounts[result.sentiment]++;
      totalScore += result.score;

      if (result.emotions) {
        for (const [emotion, score] of Object.entries(result.emotions)) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + score;
        }
      }

      if (result.keywords) {
        for (const keyword of result.keywords) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      }
    }

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    return {
      averageScore: results.length > 0 ? totalScore / results.length : 0,
      sentimentDistribution: sentimentCounts,
      topEmotions,
      topKeywords,
    };
  }

  /**
   * Get current settings
   */
  getSettings(): SentimentAnalysisSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<SentimentAnalysisSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
}

// Export singleton instance with default settings
export const sentimentAnalyzer = new SentimentAnalyzer();
