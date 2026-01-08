import { QuestionType } from '@prisma/client';
import { prisma } from '../setup';

export const questionFixtures = {
  /**
   * Create a basic question
   */
  createQuestion: async (surveyId: string, overrides: any = {}) => {
    const questionsCount = await prisma.question.count({ where: { surveyId } });

    const defaultData = {
      surveyId,
      type: QuestionType.SHORT_TEXT,
      text: `Question ${questionsCount + 1}`,
      order: questionsCount,
      isRequired: false,
    };

    return await prisma.question.create({
      data: { ...defaultData, ...overrides },
    });
  },

  /**
   * Create a multiple choice question with options
   */
  createMultipleChoiceQuestion: async (surveyId: string, options: string[], overrides: any = {}) => {
    const question = await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.MULTIPLE_CHOICE,
      ...overrides,
    });

    for (let i = 0; i < options.length; i++) {
      await prisma.questionOption.create({
        data: {
          questionId: question.id,
          text: options[i],
          value: options[i],
          order: i,
        },
      });
    }

    return await prisma.question.findUnique({
      where: { id: question.id },
      include: { options: true },
    });
  },

  /**
   * Create a checkboxes question with options
   */
  createCheckboxesQuestion: async (surveyId: string, options: string[], overrides: any = {}) => {
    const question = await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.CHECKBOXES,
      ...overrides,
    });

    for (let i = 0; i < options.length; i++) {
      await prisma.questionOption.create({
        data: {
          questionId: question.id,
          text: options[i],
          value: options[i],
          order: i,
        },
      });
    }

    return await prisma.question.findUnique({
      where: { id: question.id },
      include: { options: true },
    });
  },

  /**
   * Create a rating scale question
   */
  createRatingScaleQuestion: async (surveyId: string, minValue: number = 1, maxValue: number = 5, overrides: any = {}) => {
    return await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.RATING_SCALE,
      settings: {
        minValue,
        maxValue,
        minLabel: 'Poor',
        maxLabel: 'Excellent',
      },
      ...overrides,
    });
  },

  /**
   * Create an NPS question
   */
  createNPSQuestion: async (surveyId: string, overrides: any = {}) => {
    return await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.NPS,
      text: 'How likely are you to recommend us to a friend or colleague?',
      ...overrides,
    });
  },

  /**
   * Create a Likert scale question
   */
  createLikertScaleQuestion: async (surveyId: string, overrides: any = {}) => {
    return await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.LIKERT_SCALE,
      settings: {
        labels: [
          'Strongly Disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly Agree'
        ],
      },
      ...overrides,
    });
  },

  /**
   * Create a matrix question
   */
  createMatrixQuestion: async (surveyId: string, rows: string[], columns: string[], overrides: any = {}) => {
    return await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.MATRIX,
      settings: {
        rows,
        columns,
      },
      ...overrides,
    });
  },

  /**
   * Create a ranking question with options
   */
  createRankingQuestion: async (surveyId: string, options: string[], overrides: any = {}) => {
    const question = await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.RANKING,
      ...overrides,
    });

    for (let i = 0; i < options.length; i++) {
      await prisma.questionOption.create({
        data: {
          questionId: question.id,
          text: options[i],
          value: options[i],
          order: i,
        },
      });
    }

    return await prisma.question.findUnique({
      where: { id: question.id },
      include: { options: true },
    });
  },

  /**
   * Create a date question
   */
  createDateQuestion: async (surveyId: string, overrides: any = {}) => {
    return await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.DATE,
      ...overrides,
    });
  },

  /**
   * Create an email question
   */
  createEmailQuestion: async (surveyId: string, overrides: any = {}) => {
    return await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.EMAIL,
      ...overrides,
    });
  },

  /**
   * Create a file upload question
   */
  createFileUploadQuestion: async (surveyId: string, overrides: any = {}) => {
    return await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.FILE_UPLOAD,
      settings: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedFileTypes: ['image/png', 'image/jpeg', 'application/pdf'],
      },
      ...overrides,
    });
  },

  /**
   * Create all question types for comprehensive testing
   */
  createAllQuestionTypes: async (surveyId: string) => {
    const questions = [];

    // Basic input types
    questions.push(await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.SHORT_TEXT,
      text: 'Short text question',
    }));

    questions.push(await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.LONG_TEXT,
      text: 'Long text question',
    }));

    questions.push(await questionFixtures.createEmailQuestion(surveyId, {
      text: 'Email question',
    }));

    questions.push(await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.NUMBER,
      text: 'Number question',
    }));

    questions.push(await questionFixtures.createDateQuestion(surveyId, {
      text: 'Date question',
    }));

    questions.push(await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.TIME,
      text: 'Time question',
    }));

    // Choice-based types
    questions.push(await questionFixtures.createMultipleChoiceQuestion(surveyId,
      ['Option 1', 'Option 2', 'Option 3'],
      { text: 'Multiple choice question' }
    ));

    questions.push(await questionFixtures.createCheckboxesQuestion(surveyId,
      ['Option A', 'Option B', 'Option C'],
      { text: 'Checkboxes question' }
    ));

    questions.push(await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.YES_NO,
      text: 'Yes/No question',
    }));

    // Rating types
    questions.push(await questionFixtures.createRatingScaleQuestion(surveyId, 1, 5, {
      text: 'Rating scale question',
    }));

    questions.push(await questionFixtures.createQuestion(surveyId, {
      type: QuestionType.SLIDER,
      text: 'Slider question',
      settings: { min: 0, max: 100, step: 1 },
    }));

    questions.push(await questionFixtures.createNPSQuestion(surveyId));

    questions.push(await questionFixtures.createLikertScaleQuestion(surveyId, {
      text: 'Likert scale question',
    }));

    // Advanced types
    questions.push(await questionFixtures.createMatrixQuestion(surveyId,
      ['Row 1', 'Row 2', 'Row 3'],
      ['Col 1', 'Col 2', 'Col 3'],
      { text: 'Matrix question' }
    ));

    questions.push(await questionFixtures.createRankingQuestion(surveyId,
      ['Item 1', 'Item 2', 'Item 3'],
      { text: 'Ranking question' }
    ));

    return questions;
  },
};

export default questionFixtures;
