import { PrismaClient, AIProvider, AIFeatureType } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Pricing per 1K tokens (estimated, as of 2024)
const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

  // Anthropic
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-3.5-sonnet': { input: 0.003, output: 0.015 },

  // Google
  'gemini-pro': { input: 0.00025, output: 0.0005 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },

  // OpenRouter free models
  'google/gemini-2.0-flash-exp:free': { input: 0, output: 0 },
  'meta-llama/llama-3.2-3b-instruct:free': { input: 0, output: 0 },
  'qwen/qwen-2-7b-instruct:free': { input: 0, output: 0 },
  'mistralai/mistral-7b-instruct:free': { input: 0, output: 0 },

  // Default for unknown models
  'default': { input: 0.001, output: 0.002 },
};

// Free model identifiers
const FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen-2-7b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'huggingfaceh4/zephyr-7b-beta:free',
  'openchat/openchat-7b:free',
  'nousresearch/nous-capybara-7b:free',
];

interface LogUsageParams {
  userId: string;
  provider: AIProvider;
  model?: string;
  feature: AIFeatureType;
  inputTokens?: number;
  outputTokens?: number;
  requestSize?: number;
  responseSize?: number;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  averageLatencyMs: number;
  byProvider: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byFeature: Record<string, {
    requests: number;
    tokens: number;
  }>;
  dailyUsage: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

export class AIUsageService {
  /**
   * Calculate estimated cost for token usage
   */
  static calculateCost(model: string | undefined, inputTokens: number, outputTokens: number): number {
    const normalizedModel = model?.toLowerCase() || 'default';

    // Find matching pricing
    let pricing = TOKEN_PRICING['default'];
    for (const [key, value] of Object.entries(TOKEN_PRICING)) {
      if (normalizedModel.includes(key.toLowerCase())) {
        pricing = value;
        break;
      }
    }

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;

    return Math.round((inputCost + outputCost) * 1000000) / 1000000; // Round to 6 decimal places
  }

  /**
   * Check if model is a free model
   */
  static isFreeModel(model: string | undefined): boolean {
    if (!model) return false;
    const normalizedModel = model.toLowerCase();
    return FREE_MODELS.some(freeModel => normalizedModel.includes(freeModel.toLowerCase()));
  }

  /**
   * Log AI usage
   */
  static async logUsage(params: LogUsageParams): Promise<void> {
    try {
      const {
        userId,
        provider,
        model,
        feature,
        inputTokens = 0,
        outputTokens = 0,
        requestSize,
        responseSize,
        latencyMs,
        success = true,
        errorMessage,
        metadata,
      } = params;

      const totalTokens = inputTokens + outputTokens;
      const isFreeModel = this.isFreeModel(model);
      const estimatedCost = isFreeModel ? 0 : this.calculateCost(model, inputTokens, outputTokens);

      await prisma.aIUsageLog.create({
        data: {
          userId,
          provider,
          model,
          feature,
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCost,
          isFreeModel,
          requestSize,
          responseSize,
          latencyMs,
          success,
          errorMessage,
          metadata,
        },
      });

      logger.debug(`AI usage logged: ${feature} using ${provider}/${model}, ${totalTokens} tokens`);
    } catch (error) {
      // Don't fail the main operation if logging fails
      logger.error('Failed to log AI usage:', error);
    }
  }

  /**
   * Get usage statistics for a user
   */
  static async getUserStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageStats> {
    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.aIUsageLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // Calculate aggregated stats
    const stats: UsageStats = {
      totalRequests: logs.length,
      successfulRequests: logs.filter(l => l.success).length,
      failedRequests: logs.filter(l => !l.success).length,
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      averageLatencyMs: 0,
      byProvider: {},
      byFeature: {},
      dailyUsage: [],
    };

    let totalLatency = 0;
    let latencyCount = 0;
    const dailyMap = new Map<string, { requests: number; tokens: number; cost: number }>();

    for (const log of logs) {
      stats.totalTokens += log.totalTokens;
      stats.inputTokens += log.inputTokens;
      stats.outputTokens += log.outputTokens;
      stats.estimatedCost += log.estimatedCost;

      if (log.latencyMs) {
        totalLatency += log.latencyMs;
        latencyCount++;
      }

      // By provider
      if (!stats.byProvider[log.provider]) {
        stats.byProvider[log.provider] = { requests: 0, tokens: 0, cost: 0 };
      }
      stats.byProvider[log.provider].requests++;
      stats.byProvider[log.provider].tokens += log.totalTokens;
      stats.byProvider[log.provider].cost += log.estimatedCost;

      // By feature
      if (!stats.byFeature[log.feature]) {
        stats.byFeature[log.feature] = { requests: 0, tokens: 0 };
      }
      stats.byFeature[log.feature].requests++;
      stats.byFeature[log.feature].tokens += log.totalTokens;

      // Daily usage
      const dateKey = log.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { requests: 0, tokens: 0, cost: 0 });
      }
      const daily = dailyMap.get(dateKey)!;
      daily.requests++;
      daily.tokens += log.totalTokens;
      daily.cost += log.estimatedCost;
    }

    stats.averageLatencyMs = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
    stats.estimatedCost = Math.round(stats.estimatedCost * 1000000) / 1000000;

    // Convert daily map to array
    stats.dailyUsage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        requests: data.requests,
        tokens: data.tokens,
        cost: Math.round(data.cost * 1000000) / 1000000,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return stats;
  }

  /**
   * Get recent usage logs for a user
   */
  static async getRecentLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const [logs, total] = await Promise.all([
      prisma.aIUsageLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.aIUsageLog.count({ where: { userId } }),
    ]);

    return { logs, total };
  }

  /**
   * Get usage summary for current month
   */
  static async getMonthlyUsage(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return this.getUserStats(userId, startOfMonth, endOfMonth);
  }

  /**
   * Get usage comparison with previous period
   */
  static async getUsageComparison(userId: string, days: number = 30) {
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

    const [current, previous] = await Promise.all([
      this.getUserStats(userId, currentStart, now),
      this.getUserStats(userId, previousStart, currentStart),
    ]);

    return {
      current,
      previous,
      changes: {
        requests: previous.totalRequests > 0
          ? ((current.totalRequests - previous.totalRequests) / previous.totalRequests) * 100
          : current.totalRequests > 0 ? 100 : 0,
        tokens: previous.totalTokens > 0
          ? ((current.totalTokens - previous.totalTokens) / previous.totalTokens) * 100
          : current.totalTokens > 0 ? 100 : 0,
        cost: previous.estimatedCost > 0
          ? ((current.estimatedCost - previous.estimatedCost) / previous.estimatedCost) * 100
          : current.estimatedCost > 0 ? 100 : 0,
      },
    };
  }
}

export default AIUsageService;
