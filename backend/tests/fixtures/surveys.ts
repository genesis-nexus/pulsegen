import { SurveyStatus, SurveyVisibility } from '@prisma/client';
import { prisma } from '../setup';

export const surveyFixtures = {
  /**
   * Create a basic survey
   */
  createSurvey: async (userId: string, overrides: any = {}) => {
    // Generate a unique slug with timestamp + random string
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const defaultData = {
      title: `Test Survey ${uniqueId}`,
      description: 'This is a test survey',
      slug: `test-survey-${uniqueId}`,
      createdBy: userId,
      status: SurveyStatus.DRAFT,
      visibility: SurveyVisibility.PUBLIC,
      isAnonymous: true,
      paginationMode: 'all',
      showProgressBar: true,
      progressBarPosition: 'top',
      progressBarStyle: 'bar',
      progressBarFormat: 'percentage',
    };

    const survey = await prisma.survey.create({
      data: { ...defaultData, ...overrides },
    });

    // Create associated analytics and theme
    await prisma.surveyAnalytics.create({
      data: {
        surveyId: survey.id,
      },
    });

    await prisma.surveyTheme.create({
      data: {
        surveyId: survey.id,
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
    });

    return survey;
  },

  /**
   * Create an active (published) survey
   */
  createActiveSurvey: async (userId: string, overrides: any = {}) => {
    return await surveyFixtures.createSurvey(userId, {
      status: SurveyStatus.ACTIVE,
      publishedAt: new Date(),
      ...overrides,
    });
  },

  /**
   * Create a private survey
   */
  createPrivateSurvey: async (userId: string, overrides: any = {}) => {
    return await surveyFixtures.createSurvey(userId, {
      visibility: SurveyVisibility.PRIVATE,
      isAnonymous: false,
      ...overrides,
    });
  },

  /**
   * Create a password-protected survey
   */
  createPasswordProtectedSurvey: async (userId: string, password: string, overrides: any = {}) => {
    return await surveyFixtures.createSurvey(userId, {
      visibility: SurveyVisibility.PASSWORD_PROTECTED,
      password,
      ...overrides,
    });
  },

  /**
   * Create a survey with response limit
   */
  createSurveyWithResponseLimit: async (userId: string, responseLimit: number, overrides: any = {}) => {
    return await surveyFixtures.createSurvey(userId, {
      responseLimit,
      ...overrides,
    });
  },

  /**
   * Create a survey with close date
   */
  createSurveyWithCloseDate: async (userId: string, closeDate: Date, overrides: any = {}) => {
    return await surveyFixtures.createSurvey(userId, {
      closeDate,
      ...overrides,
    });
  },
};

export default surveyFixtures;
