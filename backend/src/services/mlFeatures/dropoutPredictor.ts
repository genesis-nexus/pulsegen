/**
 * Survey Dropout Predictor
 *
 * Predicts the probability that a respondent will abandon a survey
 * before completion. Uses real-time signals to enable interventions.
 *
 * Features:
 * - Real-time dropout probability prediction
 * - Risk level classification (low/medium/high/critical)
 * - Intervention recommendations
 * - Contributing factor analysis
 */

import { PrismaClient } from '@prisma/client';
import {
  DropoutPredictionInput,
  DropoutPredictionResult,
  MLFeatureType,
  PredictionRequest,
} from '../mlProviders/types';
import { BaseMLProvider } from '../mlProviders/baseProvider';
import { getOrCreateProvider } from '../mlProviders/providerFactory';

const prisma = new PrismaClient();

// Settings for dropout prediction
export interface DropoutPredictionSettings {
  // Risk thresholds (dropout probability)
  lowRiskThreshold: number; // Below this = low risk
  mediumRiskThreshold: number; // Below this = medium risk
  highRiskThreshold: number; // Below this = high risk (above = critical)

  // Intervention settings
  enableInterventions: boolean;
  interventionDelay: number; // Seconds to wait before showing intervention
  maxInterventionsPerSession: number;

  // Time thresholds
  expectedTimePerQuestion: number; // Expected seconds per question
  slowThresholdMultiplier: number; // Above this multiplier = slow
  fastThresholdMultiplier: number; // Below this multiplier = fast (suspicious)

  // Device adjustments
  mobileDropoutMultiplier: number; // Mobile users have higher base dropout
  tabletDropoutMultiplier: number;

  // Time-of-day adjustments (hours in 24h format)
  peakHours: number[]; // Hours with lower dropout
  offPeakMultiplier: number; // Multiplier for off-peak hours

  // Day-of-week adjustments (0 = Sunday)
  weekendMultiplier: number;

  // Survey length adjustments
  longSurveyThreshold: number; // Questions count considered "long"
  longSurveyMultiplier: number;

  // Feature weights for rule-based prediction
  weights: {
    progress: number;
    timeSpent: number;
    deviceType: number;
    timeOfDay: number;
    dayOfWeek: number;
    surveyLength: number;
    historicalDropout: number;
  };
}

const DEFAULT_SETTINGS: DropoutPredictionSettings = {
  lowRiskThreshold: 0.25,
  mediumRiskThreshold: 0.5,
  highRiskThreshold: 0.75,
  enableInterventions: true,
  interventionDelay: 30,
  maxInterventionsPerSession: 3,
  expectedTimePerQuestion: 15,
  slowThresholdMultiplier: 3,
  fastThresholdMultiplier: 0.3,
  mobileDropoutMultiplier: 1.3,
  tabletDropoutMultiplier: 1.1,
  peakHours: [9, 10, 11, 14, 15, 16, 19, 20],
  offPeakMultiplier: 1.15,
  weekendMultiplier: 1.1,
  longSurveyThreshold: 20,
  longSurveyMultiplier: 1.2,
  weights: {
    progress: 0.3,
    timeSpent: 0.2,
    deviceType: 0.1,
    timeOfDay: 0.1,
    dayOfWeek: 0.05,
    surveyLength: 0.15,
    historicalDropout: 0.1,
  },
};

// Intervention types
export type InterventionType =
  | 'NONE'
  | 'PROGRESS_BAR'
  | 'ENCOURAGEMENT'
  | 'SIMPLIFY'
  | 'SAVE_PROGRESS'
  | 'TIME_ESTIMATE'
  | 'BREAK_SUGGESTION';

// Intervention messages
const INTERVENTION_MESSAGES: Record<InterventionType, string[]> = {
  NONE: [],
  PROGRESS_BAR: [
    "You're making great progress!",
    'Almost there! Just a few more questions.',
    "You're halfway through!",
  ],
  ENCOURAGEMENT: [
    'Your feedback is really valuable to us!',
    'Thank you for taking the time to share your thoughts.',
    'Every answer helps us improve!',
  ],
  SIMPLIFY: [
    "Feel free to skip questions you're unsure about.",
    'Short answers are perfectly fine!',
  ],
  SAVE_PROGRESS: [
    'Your progress has been saved. You can continue later if needed.',
    "Don't worry, we've saved your answers.",
  ],
  TIME_ESTIMATE: [
    'Just 2 more minutes to complete!',
    'Only 5 questions remaining.',
  ],
  BREAK_SUGGESTION: [
    'Taking a short break? Your progress is saved.',
    'Need a moment? We\'ll be here when you\'re ready.',
  ],
};

export class DropoutPredictor {
  private provider: BaseMLProvider | null = null;
  private settings: DropoutPredictionSettings;
  private modelName: string | null = null;
  private useMLModel: boolean = false;

  constructor(settings?: Partial<DropoutPredictionSettings>) {
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
      console.error('Failed to initialize ML provider for dropout prediction:', error);
      this.useMLModel = false;
    }
  }

  /**
   * Predict dropout probability
   */
  async predictDropout(input: DropoutPredictionInput): Promise<DropoutPredictionResult> {
    // If ML model is available, use it
    if (this.useMLModel && this.provider && this.modelName) {
      try {
        return await this.predictWithML(input);
      } catch (error) {
        console.error('ML-based dropout prediction failed, falling back to rules:', error);
      }
    }

    // Fallback to rule-based prediction
    return this.predictWithRules(input);
  }

  /**
   * ML-based dropout prediction
   */
  private async predictWithML(input: DropoutPredictionInput): Promise<DropoutPredictionResult> {
    if (!this.provider || !this.modelName) {
      throw new Error('ML provider not initialized');
    }

    const features = this.extractFeatures(input);

    const request: PredictionRequest = {
      modelName: this.modelName,
      input: features,
    };

    const prediction = await this.provider.predict(request);
    return this.parseMLPrediction(prediction, input);
  }

  /**
   * Rule-based dropout prediction (fallback)
   */
  private predictWithRules(input: DropoutPredictionInput): DropoutPredictionResult {
    const factors: DropoutPredictionResult['factors'] = [];
    let baseDropoutProbability = 0.3; // Base dropout rate for surveys

    // Factor 1: Progress (most important)
    const progressRatio = input.currentPage / input.totalPages;
    const questionsRatio = input.questionsAnswered / input.totalQuestions;
    const progressFactor = this.calculateProgressFactor(progressRatio, questionsRatio);
    baseDropoutProbability *= progressFactor.multiplier;
    factors.push({
      factor: 'progress',
      impact: progressFactor.impact,
      description: progressFactor.description,
    });

    // Factor 2: Time spent
    const timeFactor = this.calculateTimeFactor(input);
    baseDropoutProbability *= timeFactor.multiplier;
    factors.push({
      factor: 'time_spent',
      impact: timeFactor.impact,
      description: timeFactor.description,
    });

    // Factor 3: Device type
    const deviceFactor = this.calculateDeviceFactor(input.deviceType);
    baseDropoutProbability *= deviceFactor.multiplier;
    factors.push({
      factor: 'device_type',
      impact: deviceFactor.impact,
      description: deviceFactor.description,
    });

    // Factor 4: Time of day
    const timeDayFactor = this.calculateTimeOfDayFactor(input.hourOfDay);
    baseDropoutProbability *= timeDayFactor.multiplier;
    factors.push({
      factor: 'time_of_day',
      impact: timeDayFactor.impact,
      description: timeDayFactor.description,
    });

    // Factor 5: Day of week
    const dayWeekFactor = this.calculateDayOfWeekFactor(input.dayOfWeek);
    baseDropoutProbability *= dayWeekFactor.multiplier;
    factors.push({
      factor: 'day_of_week',
      impact: dayWeekFactor.impact,
      description: dayWeekFactor.description,
    });

    // Factor 6: Survey length
    const lengthFactor = this.calculateSurveyLengthFactor(input.totalQuestions);
    baseDropoutProbability *= lengthFactor.multiplier;
    factors.push({
      factor: 'survey_length',
      impact: lengthFactor.impact,
      description: lengthFactor.description,
    });

    // Factor 7: Historical dropout (if available)
    if (input.previousDropouts !== undefined && input.previousDropouts > 0) {
      const historyFactor = this.calculateHistoricalFactor(input.previousDropouts);
      baseDropoutProbability *= historyFactor.multiplier;
      factors.push({
        factor: 'historical_behavior',
        impact: historyFactor.impact,
        description: historyFactor.description,
      });
    }

    // Normalize probability to 0-1
    const dropoutProbability = Math.max(0, Math.min(1, baseDropoutProbability));

    // Determine risk level
    const riskLevel = this.probabilityToRiskLevel(dropoutProbability);

    // Determine intervention
    const intervention = this.determineIntervention(dropoutProbability, riskLevel, input);

    // Calculate confidence based on amount of data
    const confidence = this.calculateConfidence(input);

    return {
      dropoutProbability,
      riskLevel,
      suggestedIntervention: intervention,
      confidence,
      factors,
    };
  }

  /**
   * Calculate progress factor
   */
  private calculateProgressFactor(
    pageProgress: number,
    questionProgress: number
  ): { multiplier: number; impact: number; description: string } {
    const avgProgress = (pageProgress + questionProgress) / 2;

    // Dropout is much more likely early in the survey
    // and decreases significantly as users progress
    if (avgProgress < 0.1) {
      return {
        multiplier: 1.5,
        impact: 0.5,
        description: 'Very early in survey - high dropout risk',
      };
    } else if (avgProgress < 0.25) {
      return {
        multiplier: 1.3,
        impact: 0.3,
        description: 'Early stage - elevated dropout risk',
      };
    } else if (avgProgress < 0.5) {
      return {
        multiplier: 1.1,
        impact: 0.1,
        description: 'Mid-survey - moderate completion expected',
      };
    } else if (avgProgress < 0.75) {
      return {
        multiplier: 0.7,
        impact: -0.3,
        description: 'Past halfway - good completion likelihood',
      };
    } else {
      return {
        multiplier: 0.3,
        impact: -0.7,
        description: 'Near completion - very likely to finish',
      };
    }
  }

  /**
   * Calculate time factor
   */
  private calculateTimeFactor(input: DropoutPredictionInput): {
    multiplier: number;
    impact: number;
    description: string;
  } {
    const expectedTime = input.questionsAnswered * this.settings.expectedTimePerQuestion;
    const timeRatio = input.timeSpentSoFar / Math.max(expectedTime, 1);

    if (timeRatio < this.settings.fastThresholdMultiplier) {
      // Too fast - might be rushing or clicking randomly
      return {
        multiplier: 1.2,
        impact: 0.2,
        description: 'Responding very quickly - possible disengagement',
      };
    } else if (timeRatio > this.settings.slowThresholdMultiplier) {
      // Very slow - might be distracted or having difficulty
      return {
        multiplier: 1.4,
        impact: 0.4,
        description: 'Taking much longer than expected - possible difficulty',
      };
    } else if (timeRatio > 2) {
      // Somewhat slow
      return {
        multiplier: 1.15,
        impact: 0.15,
        description: 'Taking longer than average',
      };
    } else {
      // Normal pace
      return {
        multiplier: 0.9,
        impact: -0.1,
        description: 'Good pace - engaged respondent',
      };
    }
  }

  /**
   * Calculate device factor
   */
  private calculateDeviceFactor(deviceType: string): {
    multiplier: number;
    impact: number;
    description: string;
  } {
    const normalizedDevice = deviceType.toLowerCase();

    if (normalizedDevice.includes('mobile') || normalizedDevice.includes('phone')) {
      return {
        multiplier: this.settings.mobileDropoutMultiplier,
        impact: 0.3,
        description: 'Mobile device - higher dropout tendency',
      };
    } else if (normalizedDevice.includes('tablet') || normalizedDevice.includes('ipad')) {
      return {
        multiplier: this.settings.tabletDropoutMultiplier,
        impact: 0.1,
        description: 'Tablet device - slightly elevated dropout',
      };
    } else {
      return {
        multiplier: 1.0,
        impact: 0,
        description: 'Desktop device - typical completion rate',
      };
    }
  }

  /**
   * Calculate time of day factor
   */
  private calculateTimeOfDayFactor(hour: number): {
    multiplier: number;
    impact: number;
    description: string;
  } {
    const isPeakHour = this.settings.peakHours.includes(hour);

    if (isPeakHour) {
      return {
        multiplier: 0.95,
        impact: -0.05,
        description: 'Peak engagement hour',
      };
    } else if (hour >= 0 && hour < 6) {
      // Late night / early morning
      return {
        multiplier: 1.25,
        impact: 0.25,
        description: 'Late night hours - lower attention',
      };
    } else if (hour >= 12 && hour < 14) {
      // Lunch time
      return {
        multiplier: 1.1,
        impact: 0.1,
        description: 'Lunch hours - slight distraction risk',
      };
    } else {
      return {
        multiplier: this.settings.offPeakMultiplier,
        impact: 0.15,
        description: 'Off-peak hours',
      };
    }
  }

  /**
   * Calculate day of week factor
   */
  private calculateDayOfWeekFactor(dayOfWeek: number): {
    multiplier: number;
    impact: number;
    description: string;
  } {
    // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      return {
        multiplier: this.settings.weekendMultiplier,
        impact: 0.1,
        description: 'Weekend - slightly lower completion',
      };
    } else if (dayOfWeek === 1) {
      // Monday
      return {
        multiplier: 1.05,
        impact: 0.05,
        description: 'Monday - busy start of week',
      };
    } else if (dayOfWeek === 5) {
      // Friday
      return {
        multiplier: 1.05,
        impact: 0.05,
        description: 'Friday - end of week distraction',
      };
    } else {
      return {
        multiplier: 0.95,
        impact: -0.05,
        description: 'Mid-week - good engagement',
      };
    }
  }

  /**
   * Calculate survey length factor
   */
  private calculateSurveyLengthFactor(totalQuestions: number): {
    multiplier: number;
    impact: number;
    description: string;
  } {
    if (totalQuestions <= 5) {
      return {
        multiplier: 0.7,
        impact: -0.3,
        description: 'Very short survey - high completion expected',
      };
    } else if (totalQuestions <= 10) {
      return {
        multiplier: 0.85,
        impact: -0.15,
        description: 'Short survey - good completion expected',
      };
    } else if (totalQuestions <= this.settings.longSurveyThreshold) {
      return {
        multiplier: 1.0,
        impact: 0,
        description: 'Medium length survey',
      };
    } else if (totalQuestions <= 30) {
      return {
        multiplier: this.settings.longSurveyMultiplier,
        impact: 0.2,
        description: 'Long survey - elevated dropout risk',
      };
    } else {
      return {
        multiplier: 1.4,
        impact: 0.4,
        description: 'Very long survey - high dropout risk',
      };
    }
  }

  /**
   * Calculate historical factor
   */
  private calculateHistoricalFactor(previousDropouts: number): {
    multiplier: number;
    impact: number;
    description: string;
  } {
    if (previousDropouts === 0) {
      return {
        multiplier: 0.9,
        impact: -0.1,
        description: 'No previous dropouts',
      };
    } else if (previousDropouts === 1) {
      return {
        multiplier: 1.2,
        impact: 0.2,
        description: 'One previous dropout',
      };
    } else {
      return {
        multiplier: 1.3 + (previousDropouts - 2) * 0.1,
        impact: 0.3 + (previousDropouts - 2) * 0.1,
        description: `${previousDropouts} previous dropouts - high risk`,
      };
    }
  }

  /**
   * Convert probability to risk level
   */
  private probabilityToRiskLevel(probability: number): DropoutPredictionResult['riskLevel'] {
    if (probability < this.settings.lowRiskThreshold) {
      return 'low';
    } else if (probability < this.settings.mediumRiskThreshold) {
      return 'medium';
    } else if (probability < this.settings.highRiskThreshold) {
      return 'high';
    } else {
      return 'critical';
    }
  }

  /**
   * Determine appropriate intervention
   */
  private determineIntervention(
    probability: number,
    riskLevel: DropoutPredictionResult['riskLevel'],
    input: DropoutPredictionInput
  ): DropoutPredictionResult['suggestedIntervention'] {
    if (!this.settings.enableInterventions || riskLevel === 'low') {
      return {
        type: 'NONE',
      };
    }

    let interventionType: InterventionType = 'NONE';
    const progressRatio = input.questionsAnswered / input.totalQuestions;

    if (riskLevel === 'critical') {
      // For critical risk, use save progress
      interventionType = 'SAVE_PROGRESS';
    } else if (riskLevel === 'high') {
      // For high risk, show time estimate or encouragement
      if (progressRatio > 0.5) {
        interventionType = 'TIME_ESTIMATE';
      } else {
        interventionType = 'ENCOURAGEMENT';
      }
    } else if (riskLevel === 'medium') {
      // For medium risk, show progress bar or simplify
      if (progressRatio > 0.3) {
        interventionType = 'PROGRESS_BAR';
      } else {
        interventionType = 'SIMPLIFY';
      }
    }

    // Select a random message for variety
    const messages = INTERVENTION_MESSAGES[interventionType];
    const message = messages.length > 0
      ? messages[Math.floor(Math.random() * messages.length)]
      : undefined;

    return {
      type: interventionType,
      message,
    };
  }

  /**
   * Calculate confidence based on available data
   */
  private calculateConfidence(input: DropoutPredictionInput): number {
    let confidence = 0.6; // Base confidence

    // More progress = more confidence
    const progressRatio = input.questionsAnswered / input.totalQuestions;
    confidence += progressRatio * 0.2;

    // Historical data increases confidence
    if (input.previousDropouts !== undefined) {
      confidence += 0.1;
    }

    // More time spent = more behavioral data
    if (input.timeSpentSoFar > 60) {
      confidence += 0.05;
    }

    return Math.min(confidence, 0.9);
  }

  /**
   * Extract features for ML model
   */
  private extractFeatures(input: DropoutPredictionInput): Record<string, any> {
    return {
      current_page: input.currentPage,
      total_pages: input.totalPages,
      page_progress: input.currentPage / input.totalPages,
      questions_answered: input.questionsAnswered,
      total_questions: input.totalQuestions,
      question_progress: input.questionsAnswered / input.totalQuestions,
      time_spent_seconds: input.timeSpentSoFar,
      avg_time_per_question: input.averageTimePerQuestion,
      device_type: input.deviceType,
      hour_of_day: input.hourOfDay,
      day_of_week: input.dayOfWeek,
      is_weekend: input.dayOfWeek === 0 || input.dayOfWeek === 6 ? 1 : 0,
      is_mobile: input.deviceType.toLowerCase().includes('mobile') ? 1 : 0,
      previous_dropouts: input.previousDropouts || 0,
    };
  }

  /**
   * Parse ML prediction into result format
   */
  private parseMLPrediction(
    prediction: any,
    input: DropoutPredictionInput
  ): DropoutPredictionResult {
    const output = prediction.prediction;
    const confidence = prediction.confidence || 0.8;

    let dropoutProbability = 0.5;
    let factors: DropoutPredictionResult['factors'];

    if (typeof output === 'number') {
      dropoutProbability = Math.max(0, Math.min(1, output));
    } else if (output && typeof output === 'object') {
      dropoutProbability = output.dropout_probability || output.probability || 0.5;
      factors = output.factors;
    }

    const riskLevel = this.probabilityToRiskLevel(dropoutProbability);
    const intervention = this.determineIntervention(dropoutProbability, riskLevel, input);

    return {
      dropoutProbability,
      riskLevel,
      suggestedIntervention: intervention,
      confidence,
      factors,
    };
  }

  /**
   * Get statistics for dropout predictions
   */
  async getDropoutStats(surveyId: string): Promise<{
    totalPredictions: number;
    averageDropoutProbability: number;
    riskDistribution: Record<string, number>;
    interventionsShown: number;
    dropoutsByPage: Array<{ page: number; count: number; avgProbability: number }>;
  }> {
    const predictions = await prisma.dropoutPrediction.findMany({
      where: {
        response: {
          surveyId,
        },
      },
    });

    const riskDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const pageStats: Record<number, { count: number; totalProb: number }> = {};
    let totalProb = 0;
    let interventionsShown = 0;

    for (const pred of predictions) {
      riskDistribution[pred.riskLevel]++;
      totalProb += pred.dropoutProbability;

      if (pred.interventionShown) {
        interventionsShown++;
      }

      if (!pageStats[pred.currentPage]) {
        pageStats[pred.currentPage] = { count: 0, totalProb: 0 };
      }
      pageStats[pred.currentPage].count++;
      pageStats[pred.currentPage].totalProb += pred.dropoutProbability;
    }

    const dropoutsByPage = Object.entries(pageStats)
      .map(([page, stats]) => ({
        page: parseInt(page),
        count: stats.count,
        avgProbability: stats.totalProb / stats.count,
      }))
      .sort((a, b) => a.page - b.page);

    return {
      totalPredictions: predictions.length,
      averageDropoutProbability: predictions.length > 0 ? totalProb / predictions.length : 0,
      riskDistribution,
      interventionsShown,
      dropoutsByPage,
    };
  }

  /**
   * Get current settings
   */
  getSettings(): DropoutPredictionSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<DropoutPredictionSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
}

// Export singleton instance with default settings
export const dropoutPredictor = new DropoutPredictor();
