import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import AIService from '../services/aiService';
import SurveyService from '../services/surveyService';
import AIUsageService from '../services/aiUsageService';
import { AIProviderService } from '../services/aiProviderService';
import { generateSurveySchema, analyzeResponsesSchema } from '../utils/validators';

const prisma = new PrismaClient();

export class AIController {
  static async generateSurvey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = generateSurveySchema.parse(req.body);

      const generated = await AIService.generateSurvey({
        userId: req.user!.id,
        prompt: data.prompt,
        questionCount: data.questionCount,
        includeLogic: data.includeLogic,
      });

      res.json({
        success: true,
        data: generated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async suggestQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;

      const survey = await SurveyService.findById(surveyId, req.user!.id);

      const suggestions = await AIService.suggestQuestions(
        req.user!.id,
        {
          surveyTitle: survey.title,
          existingQuestions: survey.questions.map((q) => q.text),
          targetAudience: req.body.targetAudience,
        }
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async optimizeQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questionId } = req.params;
      const { text, type, options } = req.body;

      const optimized = await AIService.optimizeQuestion(
        req.user!.id,
        {
          text,
          type,
          options,
        }
      );

      res.json({
        success: true,
        data: optimized,
      });
    } catch (error) {
      next(error);
    }
  }

  static async analyzeSentiment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required',
        });
      }

      const sentiment = await AIService.analyzeSentiment(req.user!.id, text);

      res.json({
        success: true,
        data: sentiment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;

      const survey = await SurveyService.findById(surveyId, req.user!.id);
      const analytics = await AnalyticsService.getSummary(surveyId, req.user!.id);
      const insights = await AnalyticsService.getInsights(surveyId, req.user!.id);

      const report = await AIService.generateReport(
        req.user!.id,
        {
          surveyTitle: survey.title,
          analytics,
          insights,
        }
      );

      res.json({
        success: true,
        data: {
          report,
          format: 'markdown',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async healthCheck(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;
      const { title, description, questions } = req.body;

      // Verify survey ownership
      await SurveyService.findById(surveyId, req.user!.id);

      const result = await AIService.improveSurvey(req.user!.id, {
        title,
        description,
        questions,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async analyzeSurvey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;
      const { analysisType, responses, questions, analytics } = req.body;

      // Verify survey ownership
      const survey = await SurveyService.findById(surveyId, req.user!.id);

      // If analysisType is 'summary', use generateAnalyticsSummary
      if (analysisType === 'summary') {
        const result = await AIService.generateAnalyticsSummary(req.user!.id, {
          surveyTitle: survey.title,
          analytics,
        });

        return res.json({
          success: true,
          data: result,
        });
      }

      // Otherwise use analyzeResponses
      const result = await AIService.analyzeResponses({
        userId: req.user!.id,
        responses: responses || [],
        questions: questions || survey.questions,
        analysisType,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Usage Tracking ====================

  static async getUsageStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, days } = req.query;

      let start: Date | undefined;
      let end: Date | undefined;

      if (days) {
        const daysNum = parseInt(days as string, 10);
        end = new Date();
        start = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
      } else {
        if (startDate) start = new Date(startDate as string);
        if (endDate) end = new Date(endDate as string);
      }

      const stats = await AIUsageService.getUserStats(req.user!.id, start, end);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlyUsage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await AIUsageService.getMonthlyUsage(req.user!.id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsageLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { limit = '50', offset = '0' } = req.query;

      const { logs, total } = await AIUsageService.getRecentLogs(
        req.user!.id,
        parseInt(limit as string, 10),
        parseInt(offset as string, 10)
      );

      res.json({
        success: true,
        data: {
          logs,
          total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Chat ====================

  static async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const conversations = await prisma.aIChatConversation.findMany({
        where: {
          userId: req.user!.id,
          isArchived: false,
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title } = req.body;

      const conversation = await prisma.aIChatConversation.create({
        data: {
          userId: req.user!.id,
          title: title || 'New Conversation',
        },
      });

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;

      const conversation = await prisma.aIChatConversation.findFirst({
        where: {
          id: conversationId,
          userId: req.user!.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required',
        });
      }

      // Verify conversation ownership
      const conversation = await prisma.aIChatConversation.findFirst({
        where: {
          id: conversationId,
          userId: req.user!.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50, // Last 50 messages for context
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }

      // Save user message
      const userMessage = await prisma.aIChatMessage.create({
        data: {
          conversationId,
          role: 'user',
          content: message,
        },
      });

      // Get AI provider and generate response
      const startTime = Date.now();
      const provider = await AIProviderService.getUserProvider(req.user!.id);

      // Build message history
      const messageHistory = conversation.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      messageHistory.push({ role: 'user', content: message });

      const aiResponse = await provider.chat({ messages: messageHistory });
      const latencyMs = Date.now() - startTime;

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'Failed to get AI response');
      }

      // Save assistant message
      const assistantMessage = await prisma.aIChatMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: aiResponse.data!,
          tokensUsed: aiResponse.tokensUsed,
        },
      });

      // Update conversation title if it's the first message
      if (conversation.messages.length === 0) {
        // Generate a title from the first message (first 50 chars)
        const autoTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        await prisma.aIChatConversation.update({
          where: { id: conversationId },
          data: {
            title: autoTitle,
            provider: aiResponse.provider as any,
            model: aiResponse.model,
          },
        });
      } else {
        await prisma.aIChatConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      }

      // Log usage
      await AIUsageService.logUsage({
        userId: req.user!.id,
        provider: aiResponse.provider as any,
        model: aiResponse.model,
        feature: 'CHAT',
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
        latencyMs,
        success: true,
        metadata: { conversationId },
      });

      res.json({
        success: true,
        data: {
          userMessage,
          assistantMessage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;

      // Verify ownership and delete
      const conversation = await prisma.aIChatConversation.findFirst({
        where: {
          id: conversationId,
          userId: req.user!.id,
        },
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }

      await prisma.aIChatConversation.delete({
        where: { id: conversationId },
      });

      res.json({
        success: true,
        message: 'Conversation deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Import AnalyticsService
import AnalyticsService from '../services/analyticsService';

export default AIController;
