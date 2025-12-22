# Implement AI Survey Wizard (Conversational Survey Builder)

## Priority: P0 - Critical (Differentiator)
## Labels: `feature`, `ai`, `phase-3`, `ux`, `differentiator`
## Estimated Effort: Large

---

## Summary

Create an AI-powered conversational survey wizard that allows users to build complete surveys through natural language conversation. This is PulseGen's key differentiator - no other open-source survey tool offers this capability.

---

## Background & Motivation

LimeSurvey and all other open-source competitors have **ZERO AI features**. PulseGen's existing AI capabilities (survey generation, question suggestions) can be elevated to a guided, conversational experience that:

- Eliminates the learning curve for new users
- Reduces survey creation time from hours to minutes
- Produces higher quality surveys through AI guidance
- Differentiates PulseGen from every competitor

This feature alone can position PulseGen as the "future of survey creation."

---

## Requirements

### User Experience Flow

```
User: "I want to create a customer satisfaction survey for my SaaS product"

AI: "Great! I'll help you create a customer satisfaction survey. Let me ask a few
questions to tailor it perfectly:

1. What's the name of your product?
2. What aspects do you want to measure? (e.g., usability, support, value, features)
3. How long should the survey be? (Quick: 2-3 min, Standard: 5-7 min, Comprehensive: 10+ min)
4. Will you offer any incentive for completion?"

User: "It's called TaskFlow. I want to measure usability, support satisfaction, and likelihood to recommend. Standard length. No incentive."

AI: "Perfect! I've created a 12-question customer satisfaction survey for TaskFlow.

Here's what I included:
📊 Overall Satisfaction (NPS question)
🖥️ Usability Section (4 questions)
💬 Support Satisfaction (3 questions)
🎯 Feature Usage (2 questions)
📝 Open Feedback (2 questions)

Would you like me to:
1. Show you a preview?
2. Add/remove any sections?
3. Adjust the question count?
4. Add demographic questions?"

User: "Add a section about pricing perception"

AI: "Done! I've added 3 questions about pricing perception:
- Value for money rating
- Price comparison to competitors
- Willingness to pay for additional features

Your survey is now 15 questions. Here's the updated structure..."
```

### Core Features

#### 1. Conversational Interface
- Natural language input
- Context-aware responses
- Multi-turn conversations
- Clarifying questions
- Suggestions and recommendations

#### 2. AI Capabilities
- Understand survey intent and goals
- Generate appropriate question types
- Suggest optimal question order
- Recommend best practices
- Optimize for response rates
- Detect potential bias in questions

#### 3. Survey Generation
- Complete surveys from descriptions
- Section-by-section building
- Question-by-question refinement
- Template-based starting points
- Industry-specific knowledge

#### 4. Iterative Refinement
- Add/remove sections conversationally
- Modify individual questions
- Reorder questions
- Change question types
- Adjust survey length

#### 5. Quality Assurance
- Suggest improvements
- Flag problematic questions
- Estimate completion time
- Preview respondent experience

---

## Technical Implementation

### 1. AI Wizard Service

**File: `backend/src/services/aiWizardService.ts`**

```typescript
import { prisma } from '../lib/prisma';
import { AIProvider, getAIProvider } from './aiProviders';
import { z } from 'zod';

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
  settings: SurveySettings;
}

interface PageDraft {
  title: string;
  questions: QuestionDraft[];
}

interface QuestionDraft {
  text: string;
  type: string;
  options?: { text: string }[];
  settings?: Record<string, any>;
  isRequired: boolean;
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

When generating surveys, output them in the following JSON format when requested:
{
  "title": "Survey Title",
  "description": "Survey description",
  "pages": [
    {
      "title": "Section Name",
      "questions": [
        {
          "text": "Question text",
          "type": "MULTIPLE_CHOICE|RATING_SCALE|NPS|SHORT_TEXT|LONG_TEXT|etc",
          "options": [{"text": "Option 1"}, {"text": "Option 2"}],
          "isRequired": true
        }
      ]
    }
  ]
}`;

export class AIWizardService {
  private provider: AIProvider;

  constructor() {
    this.provider = getAIProvider('default');
  }

  /**
   * Start a new wizard conversation
   */
  async startConversation(userId: string): Promise<WizardState> {
    const conversationId = crypto.randomUUID();

    const state: WizardState = {
      conversationId,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'assistant',
          content: `Hello! I'm your AI survey assistant. I'll help you create a professional survey in just a few minutes.

To get started, tell me:
- What type of survey do you want to create? (e.g., customer satisfaction, employee engagement, market research, event feedback)
- What's the main goal or question you want to answer?

Or simply describe what you need, and I'll guide you through the process!`,
        },
      ],
      surveyDraft: null,
      currentStep: 'initial',
      context: {},
    };

    // Store state in Redis for persistence
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

    // Determine if we should generate/update survey
    const shouldGenerateSurvey = await this.shouldGenerateSurvey(state, message);

    let systemInstruction = '';
    if (shouldGenerateSurvey) {
      systemInstruction = `\n\nBased on the conversation, generate or update the survey. Include the JSON in your response using this format:
\`\`\`json
{survey JSON here}
\`\`\`

After the JSON, provide a summary of what was created/changed and ask if they want to make any modifications.`;
    }

    // Generate AI response
    const response = await this.provider.chat([
      ...state.messages,
      ...(systemInstruction ? [{ role: 'system' as const, content: systemInstruction }] : []),
    ]);

    // Parse response for survey JSON
    const { textResponse, surveyJson } = this.parseResponse(response);

    if (surveyJson) {
      state.surveyDraft = surveyJson;
      state.currentStep = 'refining';
    }

    // Add assistant response
    state.messages.push({ role: 'assistant', content: response });

    // Update context from conversation
    this.updateContext(state, message);

    // Save state
    await this.saveState(userId, state);

    return {
      response: textResponse,
      surveyDraft: state.surveyDraft,
      state,
    };
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
        // Reorder pages based on new order
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

    // Create the survey in the database
    const survey = await prisma.survey.create({
      data: {
        title: state.surveyDraft.title,
        description: state.surveyDraft.description,
        createdById: userId,
        workspaceId,
        status: 'DRAFT',
        pages: {
          create: state.surveyDraft.pages.map((page, pageIndex) => ({
            title: page.title,
            order: pageIndex,
            questions: {
              create: page.questions.map((q, qIndex) => ({
                text: q.text,
                type: q.type as any,
                isRequired: q.isRequired,
                order: qIndex,
                settings: q.settings || {},
                options: q.options ? {
                  create: q.options.map((opt, optIndex) => ({
                    text: opt.text,
                    order: optIndex,
                  })),
                } : undefined,
              })),
            },
          })),
        },
      },
    });

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

    const prompt = `Analyze this survey and provide 3-5 specific, actionable suggestions to improve it:

${JSON.stringify(state.surveyDraft, null, 2)}

Format your response as a JSON array of strings:
["suggestion 1", "suggestion 2", ...]`;

    const response = await this.provider.chat([
      { role: 'system', content: 'You are a survey design expert. Provide specific, actionable suggestions.' },
      { role: 'user', content: prompt },
    ]);

    try {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {
      // Parse failed, extract suggestions manually
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
            const rows = question.settings?.rows?.length || 3;
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

  // Private helper methods
  private async shouldGenerateSurvey(state: WizardState, message: string): Promise<boolean> {
    const generateTriggers = [
      'create', 'generate', 'make', 'build', 'start',
      'looks good', 'perfect', 'yes', 'go ahead', 'do it',
      'add section', 'add question', 'include',
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
    const surveyTypes = {
      'customer satisfaction': 'customer_satisfaction',
      'csat': 'customer_satisfaction',
      'nps': 'nps',
      'employee engagement': 'employee_engagement',
      'employee satisfaction': 'employee_satisfaction',
      'market research': 'market_research',
      'product feedback': 'product_feedback',
      'event feedback': 'event_feedback',
      'course evaluation': 'course_evaluation',
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
    // Save to Redis with 24-hour expiry
    await redis.setex(
      `wizard:${userId}`,
      86400,
      JSON.stringify(state)
    );
  }

  private async getState(userId: string): Promise<WizardState | null> {
    const data = await redis.get(`wizard:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  private async clearState(userId: string): Promise<void> {
    await redis.del(`wizard:${userId}`);
  }
}

export const aiWizardService = new AIWizardService();

type WizardAction =
  | { type: 'add_section'; payload: { topic: string } }
  | { type: 'remove_section'; payload: { index: number; title: string } }
  | { type: 'add_question'; payload: { sectionIndex: number; topic: string } }
  | { type: 'remove_question'; payload: { sectionIndex: number; questionIndex: number } }
  | { type: 'modify_question'; payload: { sectionIndex: number; questionIndex: number; instruction: string } }
  | { type: 'reorder_sections'; payload: { order: number[] } }
  | { type: 'change_length'; payload: { length: 'quick' | 'standard' | 'comprehensive' } };
```

### 2. API Endpoints

**File: `backend/src/routes/wizardRoutes.ts`**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { aiWizardService } from '../services/aiWizardService';

const router = Router();

// Start new wizard conversation
router.post('/start', authenticate, async (req, res) => {
  const state = await aiWizardService.startConversation(req.user.id);
  res.json({
    conversationId: state.conversationId,
    message: state.messages[state.messages.length - 1].content,
  });
});

// Send message to wizard
router.post('/message', authenticate, async (req, res) => {
  const { message } = req.body;

  try {
    const result = await aiWizardService.processMessage(req.user.id, message);

    res.json({
      response: result.response,
      surveyDraft: result.surveyDraft,
      estimatedTime: result.surveyDraft
        ? aiWizardService.estimateCompletionTime(result.surveyDraft)
        : null,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Apply action to draft
router.post('/action', authenticate, async (req, res) => {
  const { action } = req.body;

  try {
    const result = await aiWizardService.applyAction(req.user.id, action);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get suggestions for current draft
router.get('/suggestions', authenticate, async (req, res) => {
  const suggestions = await aiWizardService.getSuggestions(req.user.id);
  res.json({ suggestions });
});

// Finalize and create survey
router.post('/finalize', authenticate, async (req, res) => {
  const { workspaceId } = req.body;

  try {
    const result = await aiWizardService.finalizeSurvey(req.user.id, workspaceId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
```

### 3. Frontend: Wizard Interface

**File: `frontend/src/pages/SurveyWizard.tsx`**

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Clock, ChevronRight, Check, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SurveyDraft {
  title: string;
  description: string;
  pages: Array<{
    title: string;
    questions: Array<{
      text: string;
      type: string;
      options?: Array<{ text: string }>;
      isRequired: boolean;
    }>;
  }>;
}

export function SurveyWizard() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [surveyDraft, setSurveyDraft] = useState<SurveyDraft | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<{ minutes: number; label: string } | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  // Start conversation
  const startMutation = useMutation({
    mutationFn: () => api.post('/wizard/start'),
    onSuccess: (res) => {
      setMessages([{
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date(),
      }]);
      setIsStarted(true);
    },
  });

  // Send message
  const sendMutation = useMutation({
    mutationFn: (message: string) => api.post('/wizard/message', { message }),
    onSuccess: (res) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date(),
      }]);
      if (res.data.surveyDraft) {
        setSurveyDraft(res.data.surveyDraft);
        setEstimatedTime(res.data.estimatedTime);
      }
    },
  });

  // Finalize survey
  const finalizeMutation = useMutation({
    mutationFn: () => api.post('/wizard/finalize'),
    onSuccess: (res) => {
      navigate(`/surveys/${res.data.surveyId}/edit`);
    },
  });

  useEffect(() => {
    if (!isStarted) {
      startMutation.mutate();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;

    setMessages(prev => [...prev, {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }]);

    sendMutation.mutate(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">AI Survey Wizard</h1>
          </div>
          <p className="text-sm text-gray-500">
            Describe your survey and I'll help you create it
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-primary-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-bounce">●</div>
                  <div className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</div>
                  <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your survey or ask for changes..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={sendMutation.isPending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-2">
            {['Make it shorter', 'Add demographics', 'More open-ended questions'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="text-xs px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {surveyDraft && (
        <div className="w-96 border-l bg-gray-50 flex flex-col">
          <div className="border-b p-4 bg-white">
            <h2 className="font-semibold">{surveyDraft.title}</h2>
            <p className="text-sm text-gray-500">{surveyDraft.description}</p>
            {estimatedTime && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                <Clock className="w-4 h-4" />
                <span>~{estimatedTime.minutes} min ({estimatedTime.label})</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {surveyDraft.pages.map((page, pageIndex) => (
              <div key={pageIndex} className="mb-6">
                <h3 className="font-medium text-sm text-gray-500 mb-2">
                  {page.title}
                </h3>
                {page.questions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="bg-white rounded-lg border p-3 mb-2 text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <span>{question.text}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {question.type.replace('_', ' ')}
                      </span>
                    </div>
                    {question.options && (
                      <div className="mt-2 space-y-1">
                        {question.options.map((opt, i) => (
                          <div key={i} className="text-xs text-gray-500">
                            • {opt.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t p-4 bg-white">
            <button
              onClick={() => finalizeMutation.mutate()}
              disabled={finalizeMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {finalizeMutation.isPending ? 'Creating...' : 'Create Survey'}
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">
              You can edit the survey after creation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] Can start a new wizard conversation
- [ ] AI understands survey intent from natural language
- [ ] AI asks clarifying questions appropriately
- [ ] AI generates complete survey drafts
- [ ] Survey draft displayed in real-time preview
- [ ] Can add/remove sections via conversation
- [ ] Can modify individual questions via conversation
- [ ] Estimated completion time calculated
- [ ] Can finalize and create survey
- [ ] Created survey opens in builder for refinement
- [ ] Conversation persists across page refreshes
- [ ] Works with all configured AI providers
- [ ] Handles AI errors gracefully
- [ ] Mobile-responsive interface
- [ ] Quick action suggestions provided
- [ ] Survey follows best practices (no bias, clear questions)

---

## Files to Create/Modify

### New Files
- `backend/src/services/aiWizardService.ts`
- `backend/src/routes/wizardRoutes.ts`
- `frontend/src/pages/SurveyWizard.tsx`
- `frontend/src/components/wizard/WizardChat.tsx`
- `frontend/src/components/wizard/SurveyPreview.tsx`

### Modified Files
- `backend/src/routes/index.ts`
- `frontend/src/App.tsx` - Add wizard route
- `frontend/src/components/layout/Sidebar.tsx` - Add wizard link

---

## Dependencies

- Working AI provider configuration
- Redis for conversation state persistence
- Issue #001 (i18n) for multi-language support

---

## Future Enhancements

- Voice input support
- Survey templates as starting points
- Industry-specific knowledge bases
- Learning from successful surveys
- A/B test suggestions
