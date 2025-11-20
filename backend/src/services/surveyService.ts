import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { SurveyStatus, QuestionType } from '@prisma/client';

interface CreateSurveyData {
  title: string;
  description?: string;
  workspaceId?: string;
  isAnonymous?: boolean;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED';
  allowMultiple?: boolean;
  responseLimit?: number;
  closeDate?: string;
  welcomeText?: string;
  thankYouText?: string;
}

interface CreateQuestionData {
  type: QuestionType;
  text: string;
  description?: string;
  pageId?: string;
  isRequired?: boolean;
  isRandomized?: boolean;
  settings?: any;
  validation?: any;
  options?: Array<{ text: string; value: string; imageUrl?: string }>;
}

export class SurveyService {
  static async create(userId: string, data: CreateSurveyData) {
    // Generate unique slug
    const slug = this.generateSlug(data.title);

    const survey = await prisma.survey.create({
      data: {
        title: data.title,
        description: data.description,
        slug,
        createdBy: userId,
        workspaceId: data.workspaceId,
        isAnonymous: data.isAnonymous ?? false,
        visibility: data.visibility ?? 'PUBLIC',
        allowMultiple: data.allowMultiple ?? false,
        responseLimit: data.responseLimit,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
        welcomeText: data.welcomeText,
        thankYouText: data.thankYouText,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create default theme
    await prisma.surveyTheme.create({
      data: {
        surveyId: survey.id,
      },
    });

    // Initialize analytics
    await prisma.surveyAnalytics.create({
      data: {
        surveyId: survey.id,
      },
    });

    return survey;
  }

  static async findAll(userId: string, filters?: {
    status?: SurveyStatus;
    workspaceId?: string;
  }) {
    const where: any = {
      createdBy: userId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.workspaceId) {
      where.workspaceId = filters.workspaceId;
    }

    const surveys = await prisma.survey.findMany({
      where,
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
        analytics: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return surveys;
  }

  static async findById(surveyId: string, userId?: string) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        pages: {
          include: {
            questions: {
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        theme: true,
        analytics: true,
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    // Check access
    if (userId && survey.createdBy !== userId && survey.visibility !== 'PUBLIC') {
      throw new AppError(403, 'Access denied');
    }

    return survey;
  }

  static async update(surveyId: string, userId: string, data: Partial<CreateSurveyData>) {
    // Check ownership
    const survey = await this.checkOwnership(surveyId, userId);

    const updated = await prisma.survey.update({
      where: { id: surveyId },
      data: {
        title: data.title,
        description: data.description,
        isAnonymous: data.isAnonymous,
        visibility: data.visibility,
        allowMultiple: data.allowMultiple,
        responseLimit: data.responseLimit,
        closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
        welcomeText: data.welcomeText,
        thankYouText: data.thankYouText,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        theme: true,
      },
    });

    return updated;
  }

  static async delete(surveyId: string, userId: string) {
    await this.checkOwnership(surveyId, userId);

    await prisma.survey.delete({
      where: { id: surveyId },
    });
  }

  static async duplicate(surveyId: string, userId: string) {
    const original = await this.findById(surveyId, userId);

    const slug = this.generateSlug(`${original.title} (Copy)`);

    // Create new survey
    const duplicate = await prisma.survey.create({
      data: {
        title: `${original.title} (Copy)`,
        description: original.description,
        slug,
        createdBy: userId,
        isAnonymous: original.isAnonymous,
        visibility: original.visibility,
        allowMultiple: original.allowMultiple,
        welcomeText: original.welcomeText,
        thankYouText: original.thankYouText,
      },
    });

    // Copy questions
    for (const question of original.questions) {
      await this.addQuestion(duplicate.id, userId, {
        type: question.type,
        text: question.text,
        description: question.description || undefined,
        isRequired: question.isRequired,
        isRandomized: question.isRandomized,
        settings: question.settings as any,
        validation: question.validation as any,
        options: question.options.map((opt) => ({
          text: opt.text,
          value: opt.value,
          imageUrl: opt.imageUrl || undefined,
        })),
      });
    }

    // Copy theme
    if (original.theme) {
      await prisma.surveyTheme.create({
        data: {
          surveyId: duplicate.id,
          primaryColor: original.theme.primaryColor,
          secondaryColor: original.theme.secondaryColor,
          backgroundColor: original.theme.backgroundColor,
          textColor: original.theme.textColor,
          fontFamily: original.theme.fontFamily,
          logoUrl: original.theme.logoUrl,
          customCss: original.theme.customCss,
        },
      });
    }

    // Initialize analytics
    await prisma.surveyAnalytics.create({
      data: {
        surveyId: duplicate.id,
      },
    });

    return this.findById(duplicate.id, userId);
  }

  static async publish(surveyId: string, userId: string, status: SurveyStatus) {
    await this.checkOwnership(surveyId, userId);

    // Validate survey has questions
    const questionCount = await prisma.question.count({
      where: { surveyId },
    });

    if (questionCount === 0) {
      throw new AppError(400, 'Cannot publish survey without questions');
    }

    const publishedAt = status === 'ACTIVE' ? new Date() : undefined;

    const survey = await prisma.survey.update({
      where: { id: surveyId },
      data: {
        status,
        publishedAt,
      },
    });

    return survey;
  }

  static async addQuestion(surveyId: string, userId: string, data: CreateQuestionData) {
    await this.checkOwnership(surveyId, userId);

    // Get the next order number
    const lastQuestion = await prisma.question.findFirst({
      where: { surveyId },
      orderBy: { order: 'desc' },
    });

    const order = (lastQuestion?.order ?? -1) + 1;

    const question = await prisma.question.create({
      data: {
        surveyId,
        pageId: data.pageId,
        type: data.type,
        text: data.text,
        description: data.description,
        order,
        isRequired: data.isRequired ?? false,
        isRandomized: data.isRandomized ?? false,
        settings: data.settings,
        validation: data.validation,
      },
    });

    // Add options if provided
    if (data.options && data.options.length > 0) {
      await prisma.questionOption.createMany({
        data: data.options.map((opt, index) => ({
          questionId: question.id,
          text: opt.text,
          value: opt.value,
          imageUrl: opt.imageUrl,
          order: index,
        })),
      });
    }

    return this.getQuestion(question.id);
  }

  static async updateQuestion(questionId: string, userId: string, data: Partial<CreateQuestionData>) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { survey: true },
    });

    if (!question) {
      throw new AppError(404, 'Question not found');
    }

    if (question.survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        type: data.type,
        text: data.text,
        description: data.description,
        isRequired: data.isRequired,
        isRandomized: data.isRandomized,
        settings: data.settings,
        validation: data.validation,
      },
    });

    // Update options if provided
    if (data.options) {
      // Delete existing options
      await prisma.questionOption.deleteMany({
        where: { questionId },
      });

      // Create new options
      await prisma.questionOption.createMany({
        data: data.options.map((opt, index) => ({
          questionId,
          text: opt.text,
          value: opt.value,
          imageUrl: opt.imageUrl,
          order: index,
        })),
      });
    }

    return this.getQuestion(questionId);
  }

  static async deleteQuestion(questionId: string, userId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { survey: true },
    });

    if (!question) {
      throw new AppError(404, 'Question not found');
    }

    if (question.survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    await prisma.question.delete({
      where: { id: questionId },
    });
  }

  static async reorderQuestions(surveyId: string, userId: string, questionIds: string[]) {
    await this.checkOwnership(surveyId, userId);

    // Update order for each question
    await Promise.all(
      questionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { order: index },
        })
      )
    );
  }

  private static async getQuestion(questionId: string) {
    return prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  private static async checkOwnership(surveyId: string, userId: string) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    if (survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    return survey;
  }

  private static generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const random = Math.random().toString(36).substring(2, 8);
    return `${base}-${random}`;
  }

  // Survey Logic methods
  static async addLogic(surveyId: string, userId: string, data: any) {
    await this.checkOwnership(surveyId, userId);

    // Verify source question exists and belongs to survey
    const sourceQuestion = await prisma.question.findFirst({
      where: { id: data.sourceQuestionId, surveyId },
    });

    if (!sourceQuestion) {
      throw new AppError(404, 'Source question not found');
    }

    // Verify target question exists if provided
    if (data.targetQuestionId) {
      const targetQuestion = await prisma.question.findFirst({
        where: { id: data.targetQuestionId, surveyId },
      });

      if (!targetQuestion) {
        throw new AppError(404, 'Target question not found');
      }
    }

    const logic = await prisma.surveyLogic.create({
      data: {
        surveyId,
        sourceQuestionId: data.sourceQuestionId,
        targetQuestionId: data.targetQuestionId,
        type: data.type,
        conditions: data.conditions,
        actions: data.actions,
      },
    });

    return logic;
  }

  static async getLogicForSurvey(surveyId: string, userId?: string) {
    // Check access if userId provided
    if (userId) {
      await this.checkOwnership(surveyId, userId);
    }

    const logicRules = await prisma.surveyLogic.findMany({
      where: { surveyId },
      include: {
        sourceQuestion: {
          select: {
            id: true,
            text: true,
            type: true,
          },
        },
        targetQuestion: {
          select: {
            id: true,
            text: true,
            type: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return logicRules;
  }

  static async updateLogic(logicId: string, userId: string, data: any) {
    const logic = await prisma.surveyLogic.findUnique({
      where: { id: logicId },
      include: { survey: true },
    });

    if (!logic) {
      throw new AppError(404, 'Logic rule not found');
    }

    if (logic.survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    // Verify target question exists if being updated
    if (data.targetQuestionId) {
      const targetQuestion = await prisma.question.findFirst({
        where: { id: data.targetQuestionId, surveyId: logic.surveyId },
      });

      if (!targetQuestion) {
        throw new AppError(404, 'Target question not found');
      }
    }

    const updated = await prisma.surveyLogic.update({
      where: { id: logicId },
      data: {
        targetQuestionId: data.targetQuestionId,
        type: data.type,
        conditions: data.conditions,
        actions: data.actions,
      },
    });

    return updated;
  }

  static async deleteLogic(logicId: string, userId: string) {
    const logic = await prisma.surveyLogic.findUnique({
      where: { id: logicId },
      include: { survey: true },
    });

    if (!logic) {
      throw new AppError(404, 'Logic rule not found');
    }

    if (logic.survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    await prisma.surveyLogic.delete({
      where: { id: logicId },
    });
  }
}

export default SurveyService;
