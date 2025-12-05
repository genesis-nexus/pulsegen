/**
 * Response Quality Detector
 *
 * Detects low-quality survey responses including:
 * - Speeding (completing too quickly)
 * - Straight-lining (same answer for all questions)
 * - Low variance in responses
 * - Gibberish/random text
 * - Pattern detection
 *
 * Can use MindsDB for ML-powered detection or fallback to rule-based detection.
 */

import { PrismaClient, MLFeatureType as PrismaMLFeatureType } from '@prisma/client';
import {
  ResponseQualityInput,
  ResponseQualityResult,
  MLFeatureType,
  PredictionRequest,
} from '../mlProviders/types';
import { BaseMLProvider } from '../mlProviders/baseProvider';
import { getOrCreateProvider } from '../mlProviders/providerFactory';

const prisma = new PrismaClient();

// Default settings for response quality detection
export interface ResponseQualitySettings {
  // Time thresholds
  speedingThresholdSeconds: number; // Minimum seconds per question
  minimumTotalTimeSeconds: number; // Minimum time for entire survey

  // Variance thresholds
  straightLiningThreshold: number; // Max % of same answers to flag (0-1)
  minVarianceThreshold: number; // Minimum standard deviation for numeric answers

  // Score thresholds
  autoAcceptThreshold: number; // Score above this = auto accept (0-100)
  autoRejectThreshold: number; // Score below this = auto reject (0-100)
  reviewThreshold: number; // Scores in between need review

  // Text quality
  minTextLength: number; // Minimum characters for text responses
  gibberishThreshold: number; // Threshold for gibberish detection (0-1)

  // Pattern detection
  detectPatterns: boolean; // Enable pattern detection (e.g., 1,2,3,4,5,1,2,3,4,5)
  maxConsecutiveSame: number; // Max consecutive same answers

  // Weight factors for scoring
  weights: {
    speeding: number;
    straightLining: number;
    lowVariance: number;
    gibberish: number;
    patterns: number;
  };
}

const DEFAULT_SETTINGS: ResponseQualitySettings = {
  speedingThresholdSeconds: 2,
  minimumTotalTimeSeconds: 30,
  straightLiningThreshold: 0.8,
  minVarianceThreshold: 0.5,
  autoAcceptThreshold: 80,
  autoRejectThreshold: 30,
  reviewThreshold: 50,
  minTextLength: 10,
  gibberishThreshold: 0.3,
  detectPatterns: true,
  maxConsecutiveSame: 5,
  weights: {
    speeding: 0.25,
    straightLining: 0.25,
    lowVariance: 0.2,
    gibberish: 0.15,
    patterns: 0.15,
  },
};

export class ResponseQualityDetector {
  private provider: BaseMLProvider | null = null;
  private settings: ResponseQualitySettings;
  private modelName: string | null = null;
  private useMLModel: boolean = false;

  constructor(settings?: Partial<ResponseQualitySettings>) {
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

      // Check if model is ready
      const isReady = await this.provider.isModelReady(modelName);
      this.useMLModel = isReady;
    } catch (error) {
      console.error('Failed to initialize ML provider for quality detection:', error);
      this.useMLModel = false;
    }
  }

  /**
   * Analyze response quality
   */
  async analyzeQuality(input: ResponseQualityInput): Promise<ResponseQualityResult> {
    const startTime = Date.now();

    // If ML model is available, use it
    if (this.useMLModel && this.provider && this.modelName) {
      try {
        return await this.analyzeWithML(input);
      } catch (error) {
        console.error('ML-based quality analysis failed, falling back to rules:', error);
      }
    }

    // Fallback to rule-based analysis
    return this.analyzeWithRules(input);
  }

  /**
   * ML-based quality analysis
   */
  private async analyzeWithML(input: ResponseQualityInput): Promise<ResponseQualityResult> {
    if (!this.provider || !this.modelName) {
      throw new Error('ML provider not initialized');
    }

    // Prepare features for ML model
    const features = this.extractFeatures(input);

    const request: PredictionRequest = {
      modelName: this.modelName,
      input: features,
    };

    const prediction = await this.provider.predict(request);

    // Parse ML prediction into our result format
    return this.parseMLPrediction(prediction, input);
  }

  /**
   * Rule-based quality analysis (fallback)
   */
  private analyzeWithRules(input: ResponseQualityInput): ResponseQualityResult {
    const flags: ResponseQualityResult['flags'] = [];
    let totalPenalty = 0;

    // Check for speeding
    const speedingResult = this.checkSpeeding(input);
    if (speedingResult.flagged) {
      flags.push(speedingResult.flag!);
      totalPenalty += speedingResult.penalty * this.settings.weights.speeding;
    }

    // Check for straight-lining
    const straightLiningResult = this.checkStraightLining(input);
    if (straightLiningResult.flagged) {
      flags.push(straightLiningResult.flag!);
      totalPenalty += straightLiningResult.penalty * this.settings.weights.straightLining;
    }

    // Check for low variance
    const varianceResult = this.checkLowVariance(input);
    if (varianceResult.flagged) {
      flags.push(varianceResult.flag!);
      totalPenalty += varianceResult.penalty * this.settings.weights.lowVariance;
    }

    // Check for gibberish text
    const gibberishResult = this.checkGibberish(input);
    if (gibberishResult.flagged) {
      flags.push(gibberishResult.flag!);
      totalPenalty += gibberishResult.penalty * this.settings.weights.gibberish;
    }

    // Check for patterns
    if (this.settings.detectPatterns) {
      const patternResult = this.checkPatterns(input);
      if (patternResult.flagged) {
        flags.push(patternResult.flag!);
        totalPenalty += patternResult.penalty * this.settings.weights.patterns;
      }
    }

    // Calculate quality score (100 - weighted penalties)
    const qualityScore = Math.max(0, Math.min(100, 100 - totalPenalty));

    // Determine recommendation
    let recommendation: ResponseQualityResult['recommendation'];
    if (qualityScore >= this.settings.autoAcceptThreshold) {
      recommendation = 'ACCEPT';
    } else if (qualityScore <= this.settings.autoRejectThreshold) {
      recommendation = 'REJECT';
    } else {
      recommendation = 'REVIEW';
    }

    // Calculate confidence based on number of checks performed
    const confidence = Math.min(0.95, 0.7 + (flags.length * 0.05));

    return {
      qualityScore,
      flags,
      recommendation,
      confidence,
    };
  }

  /**
   * Check for speeding behavior
   */
  private checkSpeeding(input: ResponseQualityInput): {
    flagged: boolean;
    penalty: number;
    flag?: ResponseQualityResult['flags'][0];
  } {
    const { answers, metadata } = input;
    const totalTime = metadata.totalTimeSpent;
    const questionCount = answers.length;

    if (questionCount === 0) {
      return { flagged: false, penalty: 0 };
    }

    const avgTimePerQuestion = totalTime / questionCount;
    const minTotalTime = this.settings.minimumTotalTimeSeconds;
    const minPerQuestion = this.settings.speedingThresholdSeconds;

    let penalty = 0;
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Check total time
    if (totalTime < minTotalTime * 0.5) {
      penalty = 80;
      severity = 'high';
    } else if (totalTime < minTotalTime) {
      penalty = 50;
      severity = 'medium';
    }

    // Check per-question time
    if (avgTimePerQuestion < minPerQuestion * 0.5) {
      penalty = Math.max(penalty, 70);
      severity = 'high';
    } else if (avgTimePerQuestion < minPerQuestion) {
      penalty = Math.max(penalty, 40);
      severity = severity === 'high' ? 'high' : 'medium';
    }

    if (penalty === 0) {
      return { flagged: false, penalty: 0 };
    }

    return {
      flagged: true,
      penalty,
      flag: {
        type: 'SPEEDING',
        severity,
        message: `Response completed too quickly (${totalTime}s total, ${avgTimePerQuestion.toFixed(1)}s avg per question)`,
      },
    };
  }

  /**
   * Check for straight-lining (same answer for all questions)
   */
  private checkStraightLining(input: ResponseQualityInput): {
    flagged: boolean;
    penalty: number;
    flag?: ResponseQualityResult['flags'][0];
  } {
    const { answers } = input;

    // Only check choice-type questions
    const choiceAnswers = answers.filter(a =>
      ['MULTIPLE_CHOICE', 'RATING_SCALE', 'LIKERT_SCALE', 'NPS', 'SLIDER'].includes(a.questionType)
    );

    if (choiceAnswers.length < 3) {
      return { flagged: false, penalty: 0 };
    }

    // Count answer frequencies
    const valueCounts: Record<string, number> = {};
    for (const answer of choiceAnswers) {
      const key = String(answer.value);
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    }

    // Find most common answer
    const maxCount = Math.max(...Object.values(valueCounts));
    const straightLineRatio = maxCount / choiceAnswers.length;

    if (straightLineRatio < this.settings.straightLiningThreshold) {
      return { flagged: false, penalty: 0 };
    }

    let severity: 'low' | 'medium' | 'high' = 'low';
    let penalty = 0;

    if (straightLineRatio >= 0.95) {
      severity = 'high';
      penalty = 90;
    } else if (straightLineRatio >= 0.9) {
      severity = 'medium';
      penalty = 60;
    } else {
      severity = 'low';
      penalty = 35;
    }

    return {
      flagged: true,
      penalty,
      flag: {
        type: 'STRAIGHT_LINING',
        severity,
        message: `${(straightLineRatio * 100).toFixed(0)}% of choice questions have the same answer`,
      },
    };
  }

  /**
   * Check for low variance in numeric responses
   */
  private checkLowVariance(input: ResponseQualityInput): {
    flagged: boolean;
    penalty: number;
    flag?: ResponseQualityResult['flags'][0];
  } {
    const { answers } = input;

    // Get numeric answers
    const numericValues = answers
      .filter(a => ['RATING_SCALE', 'SLIDER', 'NPS', 'NUMBER'].includes(a.questionType))
      .map(a => Number(a.value))
      .filter(v => !isNaN(v));

    if (numericValues.length < 3) {
      return { flagged: false, penalty: 0 };
    }

    // Calculate standard deviation
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const squaredDiffs = numericValues.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    if (stdDev >= this.settings.minVarianceThreshold) {
      return { flagged: false, penalty: 0 };
    }

    let severity: 'low' | 'medium' | 'high' = 'low';
    let penalty = 0;

    if (stdDev < 0.1) {
      severity = 'high';
      penalty = 70;
    } else if (stdDev < 0.3) {
      severity = 'medium';
      penalty = 45;
    } else {
      severity = 'low';
      penalty = 25;
    }

    return {
      flagged: true,
      penalty,
      flag: {
        type: 'LOW_VARIANCE',
        severity,
        message: `Very low variance in numeric responses (std dev: ${stdDev.toFixed(2)})`,
      },
    };
  }

  /**
   * Check for gibberish text in open-ended responses
   */
  private checkGibberish(input: ResponseQualityInput): {
    flagged: boolean;
    penalty: number;
    flag?: ResponseQualityResult['flags'][0];
  } {
    const { answers } = input;

    // Get text answers
    const textAnswers = answers
      .filter(a => ['SHORT_TEXT', 'LONG_TEXT'].includes(a.questionType))
      .map(a => String(a.value || ''));

    if (textAnswers.length === 0) {
      return { flagged: false, penalty: 0 };
    }

    let gibberishCount = 0;
    const affectedQuestions: string[] = [];

    for (let i = 0; i < textAnswers.length; i++) {
      const text = textAnswers[i];
      const answer = answers.find(a =>
        ['SHORT_TEXT', 'LONG_TEXT'].includes(a.questionType) &&
        String(a.value || '') === text
      );

      if (this.isGibberish(text)) {
        gibberishCount++;
        if (answer) {
          affectedQuestions.push(answer.questionId);
        }
      }
    }

    const gibberishRatio = gibberishCount / textAnswers.length;

    if (gibberishRatio < this.settings.gibberishThreshold) {
      return { flagged: false, penalty: 0 };
    }

    let severity: 'low' | 'medium' | 'high' = 'low';
    let penalty = 0;

    if (gibberishRatio >= 0.8) {
      severity = 'high';
      penalty = 85;
    } else if (gibberishRatio >= 0.5) {
      severity = 'medium';
      penalty = 55;
    } else {
      severity = 'low';
      penalty = 30;
    }

    return {
      flagged: true,
      penalty,
      flag: {
        type: 'GIBBERISH',
        severity,
        message: `${gibberishCount} of ${textAnswers.length} text responses appear to be gibberish`,
        affectedQuestions,
      },
    };
  }

  /**
   * Simple gibberish detection
   */
  private isGibberish(text: string): boolean {
    if (!text || text.length < this.settings.minTextLength) {
      return true;
    }

    // Check for keyboard smashing patterns
    const keyboardPatterns = /(.)\1{4,}|asdf|qwer|zxcv|hjkl/i;
    if (keyboardPatterns.test(text)) {
      return true;
    }

    // Check consonant-to-vowel ratio (gibberish often has unusual ratios)
    const vowels = (text.match(/[aeiou]/gi) || []).length;
    const consonants = (text.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;

    if (consonants > 0 && vowels > 0) {
      const ratio = consonants / vowels;
      if (ratio > 8 || ratio < 0.2) {
        return true;
      }
    }

    // Check for random character sequences
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

    // Very long average word length suggests gibberish
    if (avgWordLength > 15 && words.length > 1) {
      return true;
    }

    return false;
  }

  /**
   * Check for suspicious patterns in responses
   */
  private checkPatterns(input: ResponseQualityInput): {
    flagged: boolean;
    penalty: number;
    flag?: ResponseQualityResult['flags'][0];
  } {
    const { answers } = input;

    // Sort by question order if available
    const orderedAnswers = answers
      .filter(a => ['MULTIPLE_CHOICE', 'RATING_SCALE', 'LIKERT_SCALE'].includes(a.questionType))
      .map(a => String(a.value));

    if (orderedAnswers.length < 5) {
      return { flagged: false, penalty: 0 };
    }

    // Check for consecutive same answers
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < orderedAnswers.length; i++) {
      if (orderedAnswers[i] === orderedAnswers[i - 1]) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    // Check for repeating patterns (e.g., 1,2,3,1,2,3)
    let hasRepeatingPattern = false;
    for (let patternLength = 2; patternLength <= 4; patternLength++) {
      if (orderedAnswers.length >= patternLength * 2) {
        const pattern = orderedAnswers.slice(0, patternLength).join(',');
        let matches = 0;

        for (let i = 0; i <= orderedAnswers.length - patternLength; i += patternLength) {
          const segment = orderedAnswers.slice(i, i + patternLength).join(',');
          if (segment === pattern) {
            matches++;
          }
        }

        if (matches >= 3) {
          hasRepeatingPattern = true;
          break;
        }
      }
    }

    if (maxConsecutive <= this.settings.maxConsecutiveSame && !hasRepeatingPattern) {
      return { flagged: false, penalty: 0 };
    }

    let severity: 'low' | 'medium' | 'high' = 'low';
    let penalty = 0;

    if (hasRepeatingPattern) {
      severity = 'high';
      penalty = 75;
    } else if (maxConsecutive > this.settings.maxConsecutiveSame + 3) {
      severity = 'high';
      penalty = 65;
    } else if (maxConsecutive > this.settings.maxConsecutiveSame) {
      severity = 'medium';
      penalty = 40;
    }

    return {
      flagged: true,
      penalty,
      flag: {
        type: 'PATTERN_DETECTED',
        severity,
        message: hasRepeatingPattern
          ? 'Repeating answer pattern detected'
          : `${maxConsecutive} consecutive identical answers detected`,
      },
    };
  }

  /**
   * Extract features for ML model
   */
  private extractFeatures(input: ResponseQualityInput): Record<string, any> {
    const { answers, metadata } = input;

    // Calculate various metrics
    const choiceAnswers = answers.filter(a =>
      ['MULTIPLE_CHOICE', 'RATING_SCALE', 'LIKERT_SCALE', 'NPS'].includes(a.questionType)
    );

    const textAnswers = answers.filter(a =>
      ['SHORT_TEXT', 'LONG_TEXT'].includes(a.questionType)
    );

    // Answer value frequencies
    const valueCounts: Record<string, number> = {};
    for (const answer of choiceAnswers) {
      const key = String(answer.value);
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    }
    const maxSameAnswer = Math.max(...Object.values(valueCounts), 0);
    const straightLineRatio = choiceAnswers.length > 0 ? maxSameAnswer / choiceAnswers.length : 0;

    // Numeric variance
    const numericValues = answers
      .filter(a => ['RATING_SCALE', 'SLIDER', 'NPS', 'NUMBER'].includes(a.questionType))
      .map(a => Number(a.value))
      .filter(v => !isNaN(v));

    let stdDev = 0;
    if (numericValues.length > 1) {
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const squaredDiffs = numericValues.map(v => Math.pow(v - mean, 2));
      stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length);
    }

    // Text metrics
    const avgTextLength = textAnswers.length > 0
      ? textAnswers.reduce((sum, a) => sum + String(a.value || '').length, 0) / textAnswers.length
      : 0;

    return {
      total_time_spent: metadata.totalTimeSpent,
      avg_time_per_question: answers.length > 0 ? metadata.totalTimeSpent / answers.length : 0,
      question_count: answers.length,
      device_type: metadata.deviceType,
      straight_line_ratio: straightLineRatio,
      numeric_std_dev: stdDev,
      avg_text_length: avgTextLength,
      text_question_count: textAnswers.length,
      choice_question_count: choiceAnswers.length,
    };
  }

  /**
   * Parse ML prediction into result format
   */
  private parseMLPrediction(
    prediction: any,
    input: ResponseQualityInput
  ): ResponseQualityResult {
    const output = prediction.prediction;
    const confidence = prediction.confidence || 0.8;

    // ML model should return quality_score and flags
    let qualityScore = 50;
    let flags: ResponseQualityResult['flags'] = [];

    if (typeof output === 'number') {
      qualityScore = output;
    } else if (output && typeof output === 'object') {
      qualityScore = output.quality_score || output.qualityScore || 50;

      if (output.flags && Array.isArray(output.flags)) {
        flags = output.flags;
      }
    }

    // Determine recommendation
    let recommendation: ResponseQualityResult['recommendation'];
    if (qualityScore >= this.settings.autoAcceptThreshold) {
      recommendation = 'ACCEPT';
    } else if (qualityScore <= this.settings.autoRejectThreshold) {
      recommendation = 'REJECT';
    } else {
      recommendation = 'REVIEW';
    }

    return {
      qualityScore,
      flags,
      recommendation,
      confidence,
    };
  }

  /**
   * Get current settings
   */
  getSettings(): ResponseQualitySettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<ResponseQualitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
}

// Export singleton instance with default settings
export const responseQualityDetector = new ResponseQualityDetector();
