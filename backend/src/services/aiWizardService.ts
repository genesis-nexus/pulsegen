/**
 * AI Survey Wizard Service
 * Conversational AI interface for building surveys through natural language
 */

import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { AIProviderService } from './aiProviderService';
import { ChatMessage } from './aiProviders/base';
import logger from '../utils/logger';

// Types
interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface WizardState {
  conversationId: string;
  messages: ConversationMessage[];
  surveyDraft: SurveyDraft | null;
  currentStep: WizardStep;
  context: WizardContext;
}

interface SurveyDraft {
  title: string;
  description: string;
  pages: PageDraft[];
  settings?: SurveySettings;
}

interface PageDraft {
  title: string;
  questions: QuestionDraft[];
}

interface QuestionDraft {
  text: string;
  type: string;
  options?: { text: string; value?: string }[];
  settings?: Record<string, any>;
  isRequired: boolean;
}

interface SurveySettings {
  welcomeText?: string;
  thankYouText?: string;
  showProgressBar?: boolean;
}

interface WizardContext {
  industry?: string;
  surveyType?: string;
  targetAudience?: string;
  goals?: string[];
  desiredLength?: 'quick' | 'standard' | 'comprehensive';
  productName?: string;
}

type WizardStep =
  | 'initial'
  | 'gathering_requirements'
  | 'generating_draft'
  | 'refining'
  | 'finalizing';

type WizardAction =
  | { type: 'add_section'; payload: { topic: string } }
  | { type: 'remove_section'; payload: { index: number; title: string } }
  | { type: 'add_question'; payload: { sectionIndex: number; topic: string } }
  | { type: 'remove_question'; payload: { sectionIndex: number; questionIndex: number } }
  | { type: 'modify_question'; payload: { sectionIndex: number; questionIndex: number; instruction: string } }
  | { type: 'reorder_sections'; payload: { order: number[] } }
  | { type: 'change_length'; payload: { length: 'quick' | 'standard' | 'comprehensive' } };

const SYSTEM_PROMPT = `You are an expert survey designer helping users create effective surveys. Your role is to:

1. Understand the user's survey goals and requirements
2. Ask clarifying questions to gather necessary information
3. Generate well-structured, unbiased survey questions
4. Provide recommendations based on survey best practices
5. Help refine and improve the survey iteratively

Guidelines:
- Ask one set of questions at a time (max 3-4 questions)
- Use clear, professional language
- Suggest appropriate question types
- Consider survey length and respondent fatigue
- Avoid leading or biased questions
- Group related questions into logical sections

Available question types:
- MULTIPLE_CHOICE: Single selection from options
- CHECKBOXES: Multiple selections allowed
- DROPDOWN: Dropdown selection
- RATING_SCALE: 1-5 or 1-10 rating scale
- NPS: Net Promoter Score (0-10)
- LIKERT_SCALE: Agreement scale (Strongly Disagree to Strongly Agree)
- SHORT_TEXT: Brief text input
- LONG_TEXT: Extended text/paragraph input
- EMAIL: Email address input
- NUMBER: Numeric input
- DATE: Date picker
- YES_NO: Yes/No toggle
- MATRIX: Grid of questions with same scale
- RANKING: Rank items in order
- SLIDER: Numeric slider
- IMAGE_SELECT: Select from images
- GENDER: Gender selection
- GEO_LOCATION: Location picker

When generating surveys, output them in the following JSON format when requested:
\`\`\`json
{
  "title": "Survey Title",
  "description": "Survey description",
  "pages": [
    {
      "title": "Section Name",
      "questions": [
        {
          "text": "Question text",
          "type": "MULTIPLE_CHOICE",
          "options": [{"text": "Option 1"}, {"text": "Option 2"}],
          "isRequired": true
        }
      ]
    }
  ]
}
\`\`\``;

export class AIWizardService {
  private static CACHE_KEY_PREFIX = 'wizard:';
  private static CACHE_TTL = 86400; // 24 hours

  /**
   * Start a new wizard conversation
   */
  async startConversation(userId: string): Promise<WizardState> {
    const conversationId = this.generateId();

    const initialMessage = `Hello! I'm your AI survey assistant. I'll help you create a professional survey in just a few minutes.

To get started, tell me:
- What type of survey do you want to create? (e.g., customer satisfaction, employee engagement, market research, event feedback)
- What's the main goal or question you want to answer?

Or simply describe what you need, and I'll guide you through the process!`;

    const state: WizardState = {
      conversationId,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'assistant', content: initialMessage },
      ],
      surveyDraft: null,
      currentStep: 'initial',
      context: {},
    };

    await this.saveState(userId, state);
    return state;
  }

  /**
   * Process a user message and generate response
   */
  async processMessage(
    userId: string,
    message: string
  ): Promise<{
    response: string;
    surveyDraft: SurveyDraft | null;
    state: WizardState;
  }> {
    const state = await this.getState(userId);
    if (!state) {
      throw new Error('No active conversation. Please start a new one.');
    }

    // Add user message
    state.messages.push({ role: 'user', content: message });

    // Update context from conversation
    this.updateContext(state, message);

    // Determine if we should generate/update survey
    const shouldGenerateSurvey = this.shouldGenerateSurvey(state, message);

    let systemInstruction = '';
    if (shouldGenerateSurvey) {
      systemInstruction = `

Based on the conversation, generate or update the survey. Include the JSON in your response using this format:
\`\`\`json
{survey JSON here}
\`\`\`

After the JSON, provide a summary of what was created/changed and ask if they want to make any modifications.`;
    }

    try {
      // Get user's AI provider
      const provider = await AIProviderService.getUserProvider(userId);

      // Prepare messages for the AI
      const chatMessages: ChatMessage[] = state.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      if (systemInstruction) {
        chatMessages.push({ role: 'system', content: systemInstruction });
      }

      // Generate AI response
      const result = await provider.chat({ messages: chatMessages });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get AI response');
      }

      const response = result.data;

      // Parse response for survey JSON
      const { textResponse, surveyJson } = this.parseResponse(response);

      if (surveyJson) {
        state.surveyDraft = surveyJson;
        state.currentStep = 'refining';
      }

      // Add assistant response
      state.messages.push({ role: 'assistant', content: response });

      // Save state
      await this.saveState(userId, state);

      return {
        response: textResponse,
        surveyDraft: state.surveyDraft,
        state,
      };
    } catch (error: any) {
      logger.error('AI Wizard processMessage error:', error);
      throw error;
    }
  }

  /**
   * Apply a specific action to the survey draft
   */
  async applyAction(
    userId: string,
    action: WizardAction
  ): Promise<{
    response: string;
    surveyDraft: SurveyDraft | null;
  }> {
    const state = await this.getState(userId);
    if (!state?.surveyDraft) {
      throw new Error('No survey draft to modify');
    }

    switch (action.type) {
      case 'add_section':
        return this.processMessage(
          userId,
          `Add a new section about: ${action.payload.topic}`
        );

      case 'remove_section':
        state.surveyDraft.pages = state.surveyDraft.pages.filter(
          (_, i) => i !== action.payload.index
        );
        await this.saveState(userId, state);
        return {
          response: `Removed section "${action.payload.title}".`,
          surveyDraft: state.surveyDraft,
        };

      case 'add_question':
        return this.processMessage(
          userId,
          `Add a question about: ${action.payload.topic} in section ${action.payload.sectionIndex + 1}`
        );

      case 'remove_question':
        const page = state.surveyDraft.pages[action.payload.sectionIndex];
        if (page) {
          page.questions = page.questions.filter(
            (_, i) => i !== action.payload.questionIndex
          );
        }
        await this.saveState(userId, state);
        return {
          response: `Removed question.`,
          surveyDraft: state.surveyDraft,
        };

      case 'modify_question':
        return this.processMessage(
          userId,
          `Modify question ${action.payload.questionIndex + 1} in section ${action.payload.sectionIndex + 1}: ${action.payload.instruction}`
        );

      case 'reorder_sections':
        const newOrder = action.payload.order;
        state.surveyDraft.pages = newOrder.map(i => state.surveyDraft!.pages[i]);
        await this.saveState(userId, state);
        return {
          response: 'Sections reordered.',
          surveyDraft: state.surveyDraft,
        };

      case 'change_length':
        return this.processMessage(
          userId,
          `Adjust the survey to be ${action.payload.length} (${
            action.payload.length === 'quick' ? '5-8 questions' :
            action.payload.length === 'standard' ? '10-15 questions' :
            '20+ questions'
          })`
        );

      default:
        throw new Error('Unknown action type');
    }
  }

  /**
   * Finalize and create the survey
   */
  async finalizeSurvey(
    userId: string,
    workspaceId?: string
  ): Promise<{ surveyId: string }> {
    const state = await this.getState(userId);
    if (!state?.surveyDraft) {
      throw new Error('No survey draft to finalize');
    }

    // Generate a unique slug
    const slug = this.generateSlug(state.surveyDraft.title);

    // Create the survey in the database
    const survey = await prisma.survey.create({
      data: {
        title: state.surveyDraft.title,
        description: state.surveyDraft.description,
        createdBy: userId,
        workspaceId,
        status: 'DRAFT',
        slug,
        welcomeText: state.surveyDraft.settings?.welcomeText,
        thankYouText: state.surveyDraft.settings?.thankYouText,
        showProgressBar: state.surveyDraft.settings?.showProgressBar ?? true,
        pages: {
          create: state.surveyDraft.pages.map((page, pageIndex) => ({
            title: page.title,
            order: pageIndex,
            questions: {
              create: page.questions.map((q, qIndex) => ({
                surveyId: '', // Will be set by Prisma relation
                text: q.text,
                type: q.type as any,
                isRequired: q.isRequired,
                order: qIndex,
                settings: q.settings || {},
                options: q.options ? {
                  create: q.options.map((opt, optIndex) => ({
                    text: opt.text,
                    value: opt.value || opt.text,
                    order: optIndex,
                  })),
                } : undefined,
              })),
            },
          })),
        },
      },
      include: {
        pages: {
          include: {
            questions: true,
          },
        },
      },
    });

    // Update questions with surveyId (Prisma nested create doesn't auto-set this)
    for (const page of survey.pages) {
      for (const question of page.questions) {
        await prisma.question.update({
          where: { id: question.id },
          data: { surveyId: survey.id },
        });
      }
    }

    // Clear the wizard state
    await this.clearState(userId);

    return { surveyId: survey.id };
  }

  /**
   * Get improvement suggestions for current draft
   */
  async getSuggestions(userId: string): Promise<string[]> {
    const state = await this.getState(userId);
    if (!state?.surveyDraft) {
      return [];
    }

    try {
      const provider = await AIProviderService.getUserProvider(userId);

      const prompt = `Analyze this survey and provide 3-5 specific, actionable suggestions to improve it:

${JSON.stringify(state.surveyDraft, null, 2)}

Format your response as a JSON array of strings:
["suggestion 1", "suggestion 2", ...]`;

      const result = await provider.chat({
        messages: [
          { role: 'system', content: 'You are a survey design expert. Provide specific, actionable suggestions.' },
          { role: 'user', content: prompt },
        ],
      });

      if (result.success && result.data) {
        const match = result.data.match(/\[[\s\S]*\]/);
        if (match) {
          return JSON.parse(match[0]);
        }
      }
    } catch (error) {
      logger.error('AI Wizard getSuggestions error:', error);
    }

    return [];
  }

  /**
   * Estimate survey completion time
   */
  estimateCompletionTime(draft: SurveyDraft): { minutes: number; label: string } {
    let totalSeconds = 0;

    for (const page of draft.pages) {
      for (const question of page.questions) {
        // Estimate based on question type
        switch (question.type) {
          case 'SHORT_TEXT':
            totalSeconds += 20;
            break;
          case 'LONG_TEXT':
            totalSeconds += 60;
            break;
          case 'MULTIPLE_CHOICE':
          case 'DROPDOWN':
          case 'YES_NO':
            totalSeconds += 10;
            break;
          case 'CHECKBOXES':
            totalSeconds += 15;
            break;
          case 'RATING_SCALE':
          case 'NPS':
          case 'SLIDER':
            totalSeconds += 8;
            break;
          case 'MATRIX':
            const rows = (question.settings as any)?.rows?.length || 3;
            totalSeconds += rows * 8;
            break;
          case 'RANKING':
            const items = question.options?.length || 4;
            totalSeconds += items * 5;
            break;
          default:
            totalSeconds += 15;
        }
      }
    }

    const minutes = Math.ceil(totalSeconds / 60);
    let label = 'Quick';
    if (minutes > 3) label = 'Standard';
    if (minutes > 7) label = 'Detailed';
    if (minutes > 12) label = 'Comprehensive';

    return { minutes, label };
  }

  /**
   * Get current wizard state
   */
  async getState(userId: string): Promise<WizardState | null> {
    const data = await redis.get(`${AIWizardService.CACHE_KEY_PREFIX}${userId}`);
    return data ? JSON.parse(data) : null;
  }

  // Private helper methods
  private shouldGenerateSurvey(state: WizardState, message: string): boolean {
    const generateTriggers = [
      'create', 'generate', 'make', 'build', 'start',
      'looks good', 'perfect', 'yes', 'go ahead', 'do it',
      'add section', 'add question', 'include',
      'that sounds good', 'let\'s do it', 'proceed',
    ];

    const lowerMessage = message.toLowerCase();

    // If we have context and user confirms, generate
    if (state.context.surveyType && generateTriggers.some(t => lowerMessage.includes(t))) {
      return true;
    }

    // If already refining, any modification request triggers update
    if (state.currentStep === 'refining') {
      return true;
    }

    // Check if message contains enough information to generate
    if (state.messages.length >= 4 && !state.surveyDraft) {
      return true;
    }

    return false;
  }

  private parseResponse(response: string): { textResponse: string; surveyJson: SurveyDraft | null } {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);

    if (jsonMatch) {
      try {
        const surveyJson = JSON.parse(jsonMatch[1]);
        const textResponse = response.replace(/```json[\s\S]*?```/, '').trim();
        return { textResponse, surveyJson };
      } catch {
        // JSON parse failed
      }
    }

    return { textResponse: response, surveyJson: null };
  }

  private updateContext(state: WizardState, message: string): void {
    const lower = message.toLowerCase();

    // Detect survey type
    const surveyTypes: Record<string, string> = {
      'customer satisfaction': 'customer_satisfaction',
      'csat': 'customer_satisfaction',
      'nps': 'nps',
      'employee engagement': 'employee_engagement',
      'employee satisfaction': 'employee_satisfaction',
      'market research': 'market_research',
      'product feedback': 'product_feedback',
      'event feedback': 'event_feedback',
      'course evaluation': 'course_evaluation',
      'user experience': 'user_experience',
      'website feedback': 'website_feedback',
    };

    for (const [phrase, type] of Object.entries(surveyTypes)) {
      if (lower.includes(phrase)) {
        state.context.surveyType = type;
        break;
      }
    }

    // Detect length preference
    if (lower.includes('quick') || lower.includes('short') || lower.includes('brief')) {
      state.context.desiredLength = 'quick';
    } else if (lower.includes('comprehensive') || lower.includes('detailed') || lower.includes('thorough')) {
      state.context.desiredLength = 'comprehensive';
    } else if (lower.includes('standard') || lower.includes('normal') || lower.includes('medium')) {
      state.context.desiredLength = 'standard';
    }
  }

  private async saveState(userId: string, state: WizardState): Promise<void> {
    await redis.setex(
      `${AIWizardService.CACHE_KEY_PREFIX}${userId}`,
      AIWizardService.CACHE_TTL,
      JSON.stringify(state)
    );
  }

  private async clearState(userId: string): Promise<void> {
    await redis.del(`${AIWizardService.CACHE_KEY_PREFIX}${userId}`);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    return `${base}-${this.generateId().substring(0, 8)}`;
  }
}

export const aiWizardService = new AIWizardService();
