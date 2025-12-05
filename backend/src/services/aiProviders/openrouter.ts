import OpenAI from 'openai';
import {
  BaseAIProvider,
  AIProviderConfig,
  AIResponse,
  GenerateSurveyRequest,
  SuggestQuestionsRequest,
  AnalyzeResponsesRequest,
  OptimizeQuestionRequest,
  SentimentAnalysisRequest,
  GenerateReportRequest,
  GenerateSurveyIdeasRequest,
  ImproveSurveyRequest,
  GenerateAnalyticsSummaryRequest,
  CrossSurveyAnalysisRequest,
  ChatRequest,
} from './base';
import logger from '../../utils/logger';

/**
 * OpenRouter AI Provider
 * OpenRouter provides access to multiple AI models through a unified API
 * Compatible with OpenAI API format but offers free tier and multiple model options
 * Learn more: https://openrouter.ai
 */
export class OpenRouterProvider extends BaseAIProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: AIProviderConfig) {
    super(config, 'OpenRouter');

    // OpenRouter uses OpenAI-compatible API with custom endpoint
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.endpoint || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'https://pulsegen.io',
        'X-Title': 'PulseGen Survey Platform',
      },
    });

    // Default to a free model (can be overridden by user)
    this.defaultModel = config.modelName || 'google/gemini-2.0-flash-exp:free';
  }

  async generateSurvey(request: GenerateSurveyRequest): Promise<AIResponse> {
    try {
      const systemPrompt = `You are an expert survey designer. Create well-structured, unbiased surveys that gather meaningful insights. Follow best practices for question design, including:
- Clear, concise wording
- Unbiased language
- Appropriate question types for the data being collected
- Logical flow and organization`;

      const userPrompt = `Create a survey based on this description: ${request.prompt}

Requirements:
- Generate ${request.questionCount || 10} questions
- Include a mix of question types (multiple choice, rating scales, text responses, etc.)
- ${request.includeLogic ? 'Add skip logic where appropriate' : 'No skip logic needed'}
- Return ONLY valid JSON in this exact format:

{
  "title": "Survey Title",
  "description": "Survey description",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE|CHECKBOXES|RATING_SCALE|SHORT_TEXT|LONG_TEXT|NPS|LIKERT_SCALE",
      "text": "Question text",
      "isRequired": true|false,
      "options": [{"text": "Option 1", "value": "option1"}]
    }
  ]
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      // Extract JSON from response (handles markdown code blocks)
      const data = this.extractJSON(content);

      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter generateSurvey error:', error);
      return this.formatError(error);
    }
  }

  async suggestQuestions(request: SuggestQuestionsRequest): Promise<AIResponse> {
    try {
      const prompt = `Survey: ${request.surveyTitle}
${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ''}

Existing questions:
${request.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Suggest 5 additional questions that would provide valuable insights and complement the existing questions. Consider gaps in the current survey and what additional data would be useful.

Return as JSON:
{
  "suggestions": [
    {
      "type": "QUESTION_TYPE",
      "text": "Question text",
      "reasoning": "Why this question adds value",
      "options": [{"text": "Option", "value": "value"}]
    }
  ]
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      const data = this.extractJSON(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter suggestQuestions error:', error);
      return this.formatError(error);
    }
  }

  async analyzeResponses(request: AnalyzeResponsesRequest): Promise<AIResponse> {
    try {
      const analysisTypes = {
        summary: 'Provide a comprehensive executive summary of the survey results',
        sentiment: 'Analyze sentiment patterns across all responses',
        themes: 'Extract main themes, topics, and patterns from the responses',
        recommendations: 'Provide actionable recommendations based on the survey data',
      };

      const type = request.analysisType || 'summary';
      const prompt = `Analyze these survey responses:

Questions: ${JSON.stringify(request.questions, null, 2)}
Responses (sample): ${JSON.stringify(request.responses.slice(0, 100), null, 2)}

Task: ${analysisTypes[type]}

Provide detailed, data-driven insights. Return as JSON with this structure:
{
  "type": "${type}",
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed description",
      "confidence": 0.95,
      "supportingData": "Key data points"
    }
  ],
  "summary": "Overall summary paragraph",
  "keyFindings": ["Finding 1", "Finding 2", "..."],
  "recommendations": ["Recommendation 1", "Recommendation 2", "..."]
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      const data = this.extractJSON(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter analyzeResponses error:', error);
      return this.formatError(error);
    }
  }

  async optimizeQuestion(request: OptimizeQuestionRequest): Promise<AIResponse> {
    try {
      const prompt = `Optimize this survey question for maximum clarity, effectiveness, and engagement:

Type: ${request.type}
Current Text: ${request.text}
${request.options ? `Current Options: ${JSON.stringify(request.options)}` : ''}

Improve the question by:
1. Making it clearer and more concise
2. Removing bias or leading language
3. Ensuring it's appropriate for the question type
4. Improving options if applicable

Return as JSON:
{
  "improvedText": "Improved question text",
  "suggestions": ["Specific improvement 1", "Specific improvement 2"],
  "reasoning": "Why these changes improve the question",
  "improvedOptions": [{"text": "Option", "value": "value"}]
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      const data = this.extractJSON(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter optimizeQuestion error:', error);
      return this.formatError(error);
    }
  }

  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<AIResponse> {
    try {
      const prompt = `Analyze the sentiment and emotional tone of this text: "${request.text}"

Provide:
1. Overall sentiment (positive, negative, or neutral)
2. Confidence score (0-1)
3. Specific emotions detected
4. Brief explanation

Return as JSON:
{
  "sentiment": "positive|negative|neutral",
  "score": 0.85,
  "emotions": ["emotion1", "emotion2"],
  "explanation": "Brief explanation of the sentiment analysis"
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      const data = this.extractJSON(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter analyzeSentiment error:', error);
      return this.formatError(error);
    }
  }

  async generateReport(request: GenerateReportRequest): Promise<AIResponse> {
    try {
      const prompt = `Generate a comprehensive, professional survey report for: ${request.surveyTitle}

Analytics Data: ${JSON.stringify(request.analytics, null, 2)}
AI-Generated Insights: ${JSON.stringify(request.insights, null, 2)}

Create a well-formatted markdown report with:

# Executive Summary
High-level overview of key findings and outcomes

# Survey Overview
- Purpose and objectives
- Response metrics (completion rate, total responses, etc.)

# Key Metrics
Present the most important statistics and numbers

# Detailed Analysis
In-depth analysis of results, broken down by question or theme

# Insights and Findings
Key discoveries and patterns identified in the data

# Recommendations
Actionable next steps based on the findings

# Conclusion
Summary and final thoughts

Make the report professional, data-driven, and actionable. Use markdown formatting for structure.`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      return {
        success: true,
        data: content,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter generateReport error:', error);
      return this.formatError(error);
    }
  }

  /**
   * Generate survey ideas based on a topic
   * Useful for brainstorming and getting started with survey creation
   */
  async generateSurveyIdeas(request: GenerateSurveyIdeasRequest): Promise<AIResponse> {
    try {
      const prompt = `Generate ${request.count || 5} survey ideas for the topic: "${request.topic}"
${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ''}
${request.purpose ? `Purpose: ${request.purpose}` : ''}

For each survey idea, provide:
- A compelling title
- A brief description
- Key question areas to cover
- Expected insights

Return as JSON:
{
  "surveyIdeas": [
    {
      "title": "Survey title",
      "description": "What this survey aims to discover",
      "keyAreas": ["Area 1", "Area 2", "Area 3"],
      "expectedInsights": "What you'll learn from this survey",
      "estimatedQuestions": 10
    }
  ]
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8, // Higher temperature for more creative ideas
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      const data = this.extractJSON(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter generateSurveyIdeas error:', error);
      return this.formatError(error);
    }
  }

  /**
   * Analyze and improve an existing survey
   * Provides suggestions for better questions, structure, and overall quality
   */
  async improveSurvey(request: ImproveSurveyRequest): Promise<AIResponse> {
    try {
      const prompt = `Analyze and provide improvements for this survey:

Title: ${request.survey.title}
Description: ${request.survey.description || 'N/A'}
Questions: ${JSON.stringify(request.survey.questions, null, 2)}

Analyze the survey for:
1. Question quality and clarity
2. Logical flow and organization
3. Response bias or leading questions
4. Missing important areas
5. Overall survey length and engagement

Provide specific, actionable improvements. Return as JSON:
{
  "overallAssessment": {
    "score": 7.5,
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"]
  },
  "improvements": [
    {
      "type": "question|structure|addition|removal",
      "target": "Question ID or section",
      "issue": "What's wrong",
      "suggestion": "How to fix it",
      "priority": "high|medium|low"
    }
  ],
  "improvedSurvey": {
    "title": "Improved title if needed",
    "description": "Improved description if needed",
    "suggestedChanges": "Summary of key changes"
  }
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      const data = this.extractJSON(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter improveSurvey error:', error);
      return this.formatError(error);
    }
  }

  /**
   * Generate a quick analytics summary
   * Perfect for dashboard views and quick insights
   */
  async generateAnalyticsSummary(request: GenerateAnalyticsSummaryRequest): Promise<AIResponse> {
    try {
      const prompt = `Generate a concise analytics summary for: ${request.surveyTitle}
${request.timeRange ? `Time Range: ${request.timeRange}` : ''}

Analytics Data: ${JSON.stringify(request.analytics, null, 2)}

Create a brief, executive-friendly summary highlighting:
- Overall performance metrics
- Key trends
- Notable findings
- Quick wins or action items

Return as JSON:
{
  "executiveSummary": "One paragraph overview",
  "keyMetrics": [
    {"name": "Metric name", "value": "Value", "trend": "up|down|stable", "insight": "What it means"}
  ],
  "highlights": ["Key finding 1", "Key finding 2", "Key finding 3"],
  "actionItems": ["Action 1", "Action 2"],
  "sentiment": "positive|neutral|negative"
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      const data = this.extractJSON(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter generateAnalyticsSummary error:', error);
      return this.formatError(error);
    }
  }

  /**
   * Analyze patterns across multiple surveys
   * Useful for finding trends and correlations across different surveys
   */
  async crossSurveyAnalysis(request: CrossSurveyAnalysisRequest): Promise<AIResponse> {
    try {
      const prompt = `Analyze patterns and insights across these ${request.surveys.length} surveys:
${request.analysisGoal ? `Analysis Goal: ${request.analysisGoal}` : ''}

Surveys:
${request.surveys.map((s, i) => `
Survey ${i + 1}: ${s.title}
Questions: ${JSON.stringify(s.questions, null, 2)}
Response Count: ${s.responses.length}
Sample Responses: ${JSON.stringify(s.responses.slice(0, 20), null, 2)}
`).join('\n')}

Identify:
1. Common themes across surveys
2. Trend patterns over time (if applicable)
3. Correlations between different data points
4. Unique insights that emerge from combined analysis
5. Actionable recommendations based on cross-survey patterns

Return as JSON:
{
  "overview": "High-level summary of cross-survey analysis",
  "commonThemes": [
    {"theme": "Theme name", "prevalence": "How common", "significance": "Why important"}
  ],
  "trends": [
    {"trend": "Trend description", "direction": "increasing|decreasing|stable", "insight": "What it means"}
  ],
  "correlations": [
    {"factor1": "Factor A", "factor2": "Factor B", "relationship": "Description", "strength": "strong|moderate|weak"}
  ],
  "uniqueInsights": ["Insight 1", "Insight 2"],
  "recommendations": [
    {"recommendation": "What to do", "priority": "high|medium|low", "rationale": "Why"}
  ]
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      const data = this.extractJSON(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter crossSurveyAnalysis error:', error);
      return this.formatError(error);
    }
  }

  /**
   * General purpose chat for asking questions
   * Supports conversation history for contextual responses
   */
  async chat(request: ChatRequest): Promise<AIResponse<string>> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Add system prompt if provided
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      } else {
        // Default system prompt for PulseGen context
        messages.push({
          role: 'system',
          content: `You are a helpful AI assistant for PulseGen, a survey platform. You can help users with:
- Creating and designing surveys
- Analyzing survey results
- Understanding survey best practices
- General questions about data collection and analysis
- Any other questions the user may have

Be helpful, concise, and professional. If asked about something outside your knowledge, be honest about it.`,
        });
      }

      // Add conversation history
      for (const msg of request.messages) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages,
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenRouter');

      return {
        success: true,
        data: content,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
        inputTokens: completion.usage?.prompt_tokens,
        outputTokens: completion.usage?.completion_tokens,
      };
    } catch (error: any) {
      logger.error('OpenRouter chat error:', error);
      return this.formatError(error);
    }
  }

  /**
   * Helper method to extract JSON from markdown code blocks or plain text
   */
  protected extractJSON(text: string): any {
    try {
      // Try to parse directly first
      return JSON.parse(text);
    } catch {
      // Look for JSON in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  }
}
