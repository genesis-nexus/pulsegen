/**
 * Automation Service
 * Handles automated survey creation, configuration, and response generation
 */

import { PrismaClient, QuestionType } from '@prisma/client';
import { INDUSTRY_PERSONAS, IndustryPersona, PersonaAttribute, generateUserScenarios, getPersonaById } from '../data/personas';
import { SurveyService } from './surveyService';
import { ResponseService } from './responseService';
import { AIService } from './aiService';

const prisma = new PrismaClient();

interface AutomationConfig {
  personaId: string;
  surveyTitle?: string;
  questionCount?: number;
  useAI?: boolean;
  includeLogic?: boolean;
  scenarioCount?: number;
}

interface GeneratedSurvey {
  surveyId: string;
  slug: string;
  title: string;
  questionCount: number;
  url: string;
}

interface SimulatedResponse {
  responseId: string;
  scenario: PersonaAttribute;
  completionTime: number;
  completed: boolean;
}

interface AutomationResult {
  survey: GeneratedSurvey;
  responses: SimulatedResponse[];
  analytics: any;
  summary: {
    totalResponses: number;
    completedResponses: number;
    averageCompletionTime: number;
    completionRate: number;
  };
}

export class AutomationService {
  /**
   * Get all available personas
   */
  static async getPersonas() {
    return INDUSTRY_PERSONAS;
  }

  /**
   * Get a specific persona by ID
   */
  static async getPersona(personaId: string) {
    const persona = getPersonaById(personaId);
    if (!persona) {
      throw new Error(`Persona not found: ${personaId}`);
    }
    return persona;
  }

  /**
   * Main automation workflow
   */
  static async runAutomation(
    userId: string,
    config: AutomationConfig
  ): Promise<AutomationResult> {
    const persona = getPersonaById(config.personaId);
    if (!persona) {
      throw new Error(`Persona not found: ${config.personaId}`);
    }

    console.log(`Starting automation for persona: ${persona.name}`);

    // Step 1: Create survey
    const survey = await this.createSurveyForPersona(userId, persona, config);
    console.log(`Survey created: ${survey.surveyId}`);

    // Step 2: Generate user scenarios
    const scenarioCount = config.scenarioCount || 20;
    const scenarios = this.generateScenarios(persona, scenarioCount);
    console.log(`Generated ${scenarios.length} user scenarios`);

    // Step 3: Simulate responses
    const responses = await this.simulateResponses(survey.surveyId, persona, scenarios);
    console.log(`Simulated ${responses.length} responses`);

    // Step 4: Calculate analytics
    const analytics = await this.calculateAnalytics(survey.surveyId);

    // Step 5: Generate summary
    const summary = this.generateSummary(responses);

    return {
      survey,
      responses,
      analytics,
      summary
    };
  }

  /**
   * Create a survey tailored to the persona
   */
  private static async createSurveyForPersona(
    userId: string,
    persona: IndustryPersona,
    config: AutomationConfig
  ): Promise<GeneratedSurvey> {
    const title = config.surveyTitle || `${persona.name} - Automated`;
    const description = `${persona.description}\n\nTarget Audience: ${persona.targetAudience}`;

    // Create survey
    const survey = await SurveyService.create(userId, {
      title,
      description,
      visibility: 'PUBLIC',
      isAnonymous: true,
      allowMultiple: false,
      welcomeText: `Welcome to our ${persona.industry} survey! Your feedback is valuable to us.`,
      thankYouText: 'Thank you for taking the time to complete this survey!',
      status: 'ACTIVE' // Make sure survey is active to accept responses
    });

    // Add questions based on persona
    await this.addQuestionsToSurvey(survey.id, userId, persona, config);

    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    return {
      surveyId: survey.id,
      slug: survey.slug,
      title: survey.title,
      questionCount: persona.typicalQuestions.length,
      url: `${appUrl}/s/${survey.slug}`
    };
  }

  /**
   * Add questions to survey based on persona
   */
  private static async addQuestionsToSurvey(
    surveyId: string,
    userId: string,
    persona: IndustryPersona,
    config: AutomationConfig
  ) {
    // Special handling for QA Testing persona to ensure all types are created
    if (persona.id === 'qa-testing-all-types') {
      const types = persona.questionTypes;
      const texts = persona.typicalQuestions;

      for (let i = 0; i < types.length; i++) {
        const type = types[i];
        const text = texts[i] || `Test Question for ${type}`;

        const questionData: any = {
          text,
          type: type as QuestionType,
          isRequired: false,
          order: i
        };

        if (this.needsOptions(type)) {
          questionData.options = this.generateOptions(text, type, persona);
        }

        // Add specific settings for types that need them
        if (type === 'RATING_SCALE') {
          questionData.settings = { minValue: 1, maxValue: 5, minLabel: 'Poor', maxLabel: 'Excellent' };
        } else if (type === 'NPS') {
          questionData.settings = { minValue: 0, maxValue: 10, minLabel: 'Not likely', maxLabel: 'Likely' };
        } else if (type === 'SLIDER') {
          questionData.settings = { minValue: 0, maxValue: 100, step: 1 };
        } else if (type === 'DATE') {
          questionData.settings = { format: 'MM/DD/YYYY' };
        } else if (type === 'TIME') {
          questionData.settings = { format: '12h' };
        } else if (type === 'FILE_UPLOAD') {
          questionData.settings = { maxSize: 10, allowedTypes: ['image/png', 'image/jpeg', 'application/pdf'] };
        } else if (type === 'GEO_LOCATION') {
          questionData.settings = { accuracy: 'high' };
        } else if (type === 'MATRIX') {
          questionData.settings = {
            rows: ['Row 1', 'Row 2', 'Row 3'],
            multiSelect: false
          };
        } else if (type === 'MULTIPLE_NUMERICAL') {
          questionData.settings = {
            fields: [{ name: 'num1', label: 'First Number', min: 0, max: 100 }, { name: 'num2', label: 'Second Number', min: 0, max: 100 }]
          };
        }

        await SurveyService.addQuestion(surveyId, userId, questionData);
      }
      return;
    }

    const questions = persona.typicalQuestions;
    const questionTypes = persona.questionTypes;

    for (let i = 0; i < questions.length; i++) {
      const questionText = questions[i];
      const questionType = this.selectQuestionType(questionText, questionTypes);

      const questionData: any = {
        text: questionText,
        type: questionType as QuestionType,
        isRequired: i < 3, // First 3 questions are required
        order: i
      };

      // Add options for question types that need them
      if (this.needsOptions(questionType)) {
        questionData.options = this.generateOptions(questionText, questionType, persona);
      }

      // Add settings for specific question types
      if (questionType === 'RATING_SCALE') {
        questionData.settings = {
          minValue: 1,
          maxValue: 5,
          minLabel: 'Very Dissatisfied',
          maxLabel: 'Very Satisfied'
        };
      } else if (questionType === 'NPS') {
        questionData.settings = {
          minValue: 0,
          maxValue: 10,
          minLabel: 'Not at all likely',
          maxLabel: 'Extremely likely'
        };
      } else if (questionType === 'SLIDER') {
        questionData.settings = {
          minValue: 0,
          maxValue: 100,
          step: 10
        };
      }

      await SurveyService.addQuestion(surveyId, userId, questionData);
    }
  }

  /**
   * Select appropriate question type based on question text
   */
  private static selectQuestionType(questionText: string, allowedTypes: string[]): string {
    const text = questionText.toLowerCase();

    // NPS detection
    if (text.includes('recommend') && text.includes('likely')) {
      return 'NPS';
    }

    // Rating scale detection
    if (text.includes('rate') || text.includes('satisfaction')) {
      return 'RATING_SCALE';
    }

    // Yes/No detection
    if (text.startsWith('did') || text.startsWith('was') || text.startsWith('were') || text.startsWith('is') || text.startsWith('are')) {
      if (allowedTypes.includes('YES_NO')) {
        return 'YES_NO';
      }
    }

    // Multiple choice for "which" or "what"
    if (text.startsWith('which') || text.startsWith('what')) {
      if (text.includes('improve') || text.includes('like most') || text.includes('enjoy')) {
        return 'LONG_TEXT';
      }
      return 'MULTIPLE_CHOICE';
    }

    // Long text for open-ended
    if (text.includes('improve') || text.includes('suggest') || text.includes('comment')) {
      return 'LONG_TEXT';
    }

    // Default to rating scale if allowed
    if (allowedTypes.includes('RATING_SCALE')) {
      return 'RATING_SCALE';
    }

    return allowedTypes[0];
  }

  /**
   * Check if question type needs options
   */
  private static needsOptions(questionType: string): boolean {
    return [
      'MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN', 'RANKING',
      'LIKERT_SCALE', 'IMAGE_SELECT', 'SEMANTIC_DIFFERENTIAL',
      'ARRAY_DUAL_SCALE', 'GENDER', 'MATRIX'
    ].includes(questionType);
  }

  /**
   * Generate options for question types
   */
  private static generateOptions(questionText: string, questionType: string, persona: IndustryPersona): any[] {
    const text = questionText.toLowerCase();

    // QA Testing defaults
    if (persona.id === 'qa-testing-all-types') {
      if (questionType === 'MATRIX' || questionType === 'LIKERT_SCALE') {
        return [
          { text: 'Strongly Disagree', order: 0 },
          { text: 'Disagree', order: 1 },
          { text: 'Neutral', order: 2 },
          { text: 'Agree', order: 3 },
          { text: 'Strongly Agree', order: 4 }
        ];
      }
      if (questionType === 'IMAGE_SELECT') {
        return [
          { text: 'Option A', value: 'opt_a', imageUrl: 'https://placehold.co/400?text=Option+A', order: 0 },
          { text: 'Option B', value: 'opt_b', imageUrl: 'https://placehold.co/400?text=Option+B', order: 1 }
        ];
      }
      if (questionType === 'SEMANTIC_DIFFERENTIAL') {
        return [
          { text: 'Efficient', value: 'Inefficient', order: 0 },
          { text: 'Modern', value: 'Outdated', order: 1 },
          { text: 'Friendly', value: 'Unfriendly', order: 2 }
        ];
      }
      if (questionType === 'RANKING') {
        return [
          { text: 'Item 1', order: 0 },
          { text: 'Item 2', order: 1 },
          { text: 'Item 3', order: 2 }
        ];
      }
      if (questionType === 'GENDER') {
        return [
          { text: 'Male', order: 0 },
          { text: 'Female', order: 1 },
          { text: 'Non-binary', order: 2 },
          { text: 'Prefer not to say', order: 3 }
        ];
      }
      if (questionType === 'ARRAY_DUAL_SCALE') {
        return [
          { text: 'Feature A', value: 'feature_a', order: 0 },
          { text: 'Feature B', value: 'feature_b', order: 1 },
          { text: 'Feature C', value: 'feature_c', order: 2 }
        ];
      }
      if (['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(questionType)) {
        return [
          { text: 'Option 1', order: 0 },
          { text: 'Option 2', order: 1 },
          { text: 'Option 3', order: 2 },
          { text: 'Option 4', order: 3 }
        ];
      }
    }

    // Industry-specific options
    if (persona.industry === 'Healthcare') {
      if (text.includes('wait')) {
        return [
          { text: 'Less than 15 minutes', order: 0 },
          { text: '15-30 minutes', order: 1 },
          { text: '30-60 minutes', order: 2 },
          { text: 'More than 1 hour', order: 3 }
        ];
      }
    }

    if (persona.industry === 'Retail' || persona.industry === 'E-commerce') {
      if (text.includes('product') || text.includes('stock')) {
        return [
          { text: 'Yes, everything I wanted', order: 0 },
          { text: 'Mostly, with some exceptions', order: 1 },
          { text: 'Some items were out of stock', order: 2 },
          { text: 'No, key items were unavailable', order: 3 }
        ];
      }
    }

    // Generic satisfaction options
    if (text.includes('satisfied') || text.includes('quality')) {
      return [
        { text: 'Very Satisfied', order: 0 },
        { text: 'Satisfied', order: 1 },
        { text: 'Neutral', order: 2 },
        { text: 'Dissatisfied', order: 3 },
        { text: 'Very Dissatisfied', order: 4 }
      ];
    }

    // Default options
    return [
      { text: 'Excellent', order: 0 },
      { text: 'Good', order: 1 },
      { text: 'Fair', order: 2 },
      { text: 'Poor', order: 3 }
    ];
  }

  /**
   * Generate user scenarios based on persona
   */
  private static generateScenarios(persona: IndustryPersona, count: number): PersonaAttribute[] {
    return generateUserScenarios(persona).slice(0, count);
  }

  /**
   * Simulate responses for all scenarios
   */
  private static async simulateResponses(
    surveyId: string,
    persona: IndustryPersona,
    scenarios: PersonaAttribute[]
  ): Promise<SimulatedResponse[]> {
    const results: SimulatedResponse[] = [];

    // Get survey questions
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    for (const scenario of scenarios) {
      const startTime = Date.now();

      // Determine if this scenario completes the survey
      const willComplete = Math.random() * 100 < persona.responsePatterns.completionRate;

      // Generate answers
      const answers = [];
      const questionCount = willComplete ? survey.questions.length : Math.floor(survey.questions.length * 0.6);

      for (let i = 0; i < questionCount; i++) {
        const question = survey.questions[i];
        const answer = this.generateAnswer(question, scenario, persona);
        answers.push(answer);
      }

      // Submit response
      try {
        const response = await ResponseService.submit(surveyId, { answers });

        const completionTime = this.calculateCompletionTime(persona, scenario, willComplete);

        results.push({
          responseId: response.id,
          scenario,
          completionTime,
          completed: willComplete
        });
      } catch (error) {
        console.error(`Failed to submit response for scenario:`, error);
      }

      // Small delay between responses
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Generate a realistic answer based on question type and scenario
   */
  private static generateAnswer(question: any, scenario: PersonaAttribute, persona: IndustryPersona): any {
    const answer: any = {
      questionId: question.id
    };

    switch (question.type) {
      case 'RATING_SCALE':
        // Vary ratings based on scenario attributes
        const baseRating = scenario.techSavviness === 'high' ? 4 : scenario.techSavviness === 'medium' ? 3 : 3;
        const variation = Math.floor(Math.random() * 3) - 1; // -1 to 1
        answer.numberValue = Math.max(1, Math.min(5, baseRating + variation));
        break;

      case 'NPS':
        // NPS scores based on experience level
        const experienceBonus = scenario.experience.includes('Regular') || scenario.experience.includes('Frequent') ? 2 : 0;
        const npsBase = 7 + experienceBonus;
        const npsVariation = Math.floor(Math.random() * 4) - 1;
        answer.numberValue = Math.max(0, Math.min(10, npsBase + npsVariation));
        break;

      case 'YES_NO':
        // 70% yes, 30% no
        answer.optionId = question.options[Math.random() < 0.7 ? 0 : 1]?.id;
        break;

      case 'MULTIPLE_CHOICE':
      case 'DROPDOWN':
        // Select random option, weighted towards positive
        const mcOptions = question.options;
        if (mcOptions.length > 0) {
          const weights = mcOptions.map((_: any, idx: number) =>
            idx === 0 ? 0.4 : idx === mcOptions.length - 1 ? 0.1 : 0.5 / (mcOptions.length - 2)
          );
          answer.optionId = this.weightedRandom(mcOptions, weights).id;
        }
        break;

      case 'CHECKBOXES':
        // Select 1-3 random options
        const checkCount = Math.floor(Math.random() * 3) + 1;
        const selectedOptions = this.shuffleArray([...question.options]).slice(0, checkCount);
        answer.optionIds = selectedOptions.map((opt: any) => opt.id);
        break;

      case 'SHORT_TEXT':
        answer.textValue = this.generateShortText(question.text, scenario, persona);
        break;

      case 'LONG_TEXT':
        answer.textValue = this.generateLongText(question.text, scenario, persona);
        break;

      case 'EMAIL':
        answer.textValue = `${scenario.occupation.toLowerCase().replace(/\s/g, '.')}.${Math.random().toString(36).substring(7)}@example.com`;
        break;

      case 'NUMBER':
        answer.numberValue = Math.floor(Math.random() * 100) + 1;
        break;

      case 'SLIDER':
        const sliderBase = 60;
        const sliderVariation = Math.floor(Math.random() * 40) - 20;
        answer.numberValue = Math.max(0, Math.min(100, sliderBase + sliderVariation));
        break;

      case 'LIKERT_SCALE':
        // 1-5 Likert scale
        const likertOptions = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
        const likertIndex = Math.floor(Math.random() * 5);
        answer.optionId = question.options.find((opt: any) => opt.text.includes(likertOptions[likertIndex]))?.id;
        break;

      default:
        // Default to text response
        answer.textValue = 'N/A';
    }

    return answer;
  }

  /**
   * Generate realistic short text responses
   */
  private static generateShortText(questionText: string, scenario: PersonaAttribute, persona: IndustryPersona): string {
    const text = questionText.toLowerCase();

    if (text.includes('dish') || text.includes('meal')) {
      const dishes = ['Grilled Salmon', 'Caesar Salad', 'Margherita Pizza', 'Beef Burger', 'Pasta Carbonara'];
      return dishes[Math.floor(Math.random() * dishes.length)];
    }

    if (text.includes('product') || text.includes('item')) {
      const products = ['Wireless Headphones', 'Running Shoes', 'Coffee Maker', 'Laptop Bag', 'Fitness Tracker'];
      return products[Math.floor(Math.random() * products.length)];
    }

    return 'Great experience overall';
  }

  /**
   * Generate realistic long text responses
   */
  private static generateLongText(questionText: string, scenario: PersonaAttribute, persona: IndustryPersona): string {
    const text = questionText.toLowerCase();
    const responses = [];

    if (text.includes('improve')) {
      responses.push(
        'More staff during peak hours would help reduce wait times.',
        'Better communication about delays or changes would be appreciated.',
        'Offering more options or customization would enhance the experience.',
        'Improving the mobile app or website usability.',
        'Extended hours of operation would be convenient.'
      );
    } else if (text.includes('like most') || text.includes('enjoy')) {
      responses.push(
        'The quality of service exceeded my expectations.',
        'Staff were professional and attentive to my needs.',
        'The overall atmosphere was welcoming and comfortable.',
        'Everything was clean and well-organized.',
        'The value for money was excellent.'
      );
    } else {
      responses.push(
        'Overall, it was a positive experience.',
        'I appreciate the attention to detail.',
        'Everything met my expectations.',
        'The staff were helpful and friendly.',
        'I would recommend this to others.'
      );
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Calculate realistic completion time based on persona and scenario
   */
  private static calculateCompletionTime(
    persona: IndustryPersona,
    scenario: PersonaAttribute,
    completed: boolean
  ): number {
    let baseTime = persona.responsePatterns.averageTime;

    // Adjust based on tech savviness
    if (scenario.techSavviness === 'high') {
      baseTime *= 0.8;
    } else if (scenario.techSavviness === 'low') {
      baseTime *= 1.3;
    }

    // Add random variation
    const variation = (Math.random() * 0.4) - 0.2; // -20% to +20%
    baseTime *= (1 + variation);

    // If not completed, reduce time
    if (!completed) {
      baseTime *= 0.6;
    }

    return Math.floor(baseTime);
  }

  /**
   * Calculate analytics for the survey
   */
  private static async calculateAnalytics(surveyId: string) {
    // The analytics are automatically calculated by the ResponseService
    // Fetch the latest analytics
    const analytics = await prisma.surveyAnalytics.findUnique({
      where: { surveyId }
    });

    return analytics;
  }

  /**
   * Generate summary statistics
   */
  private static generateSummary(responses: SimulatedResponse[]) {
    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => r.completed).length;
    const totalTime = responses.reduce((sum, r) => sum + r.completionTime, 0);
    const averageCompletionTime = totalTime / totalResponses;
    const completionRate = (completedResponses / totalResponses) * 100;

    return {
      totalResponses,
      completedResponses,
      averageCompletionTime: Math.floor(averageCompletionTime),
      completionRate: Math.round(completionRate * 10) / 10
    };
  }

  /**
   * Utility: Weighted random selection
   */
  private static weightedRandom(items: any[], weights: number[]): any {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[0];
  }

  /**
   * Utility: Shuffle array
   */
  private static shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get automation status
   */
  static async getAutomationStatus(surveyId: string) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: true,
        responses: true,
        analytics: true
      }
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    return {
      surveyId: survey.id,
      title: survey.title,
      questionCount: survey.questions.length,
      responseCount: survey.responses.length,
      analytics: survey.analytics
    };
  }
}
