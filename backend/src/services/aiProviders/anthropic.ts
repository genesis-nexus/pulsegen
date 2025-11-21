import Anthropic from '@anthropic-ai/sdk';
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
} from './base';
import logger from '../../utils/logger';

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic;
  private defaultModel: string;

  constructor(config: AIProviderConfig) {
    super(config, 'Anthropic');
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.defaultModel = config.modelName || 'claude-sonnet-4-20250514';
  }

  async generateSurvey(request: GenerateSurveyRequest): Promise<AIResponse> {
    try {
      const systemPrompt = `You are an expert survey designer. Create well-structured, unbiased surveys that gather meaningful insights. Follow best practices for question design.`;

      const userPrompt = `Create a survey based on this description: ${request.prompt}

Requirements:
- Generate ${request.questionCount || 10} questions
- Include a mix of question types
- ${request.includeLogic ? 'Add skip logic where appropriate' : 'No skip logic needed'}
- Return ONLY valid JSON in this format:

{
  "title": "Survey Title",
  "description": "Survey description",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE|CHECKBOXES|RATING_SCALE|SHORT_TEXT|etc",
      "text": "Question text",
      "isRequired": true|false,
      "options": [{"text": "Option 1", "value": "option1"}]
    }
  ]
}`;

      const message = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 4096,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const data = this.extractJSON(content.text);
        return {
          success: true,
          data,
          provider: this.providerName,
          model: this.defaultModel,
          tokensUsed: message.usage ? message.usage.input_tokens + message.usage.output_tokens : undefined,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic generateSurvey error:', error);
      return this.formatError(error);
    }
  }

  async suggestQuestions(request: SuggestQuestionsRequest): Promise<AIResponse> {
    try {
      const prompt = `Survey: ${request.surveyTitle}
${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ''}

Existing questions:
${request.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Suggest 5 additional questions. Return ONLY valid JSON:
{"suggestions": [{"type": "QUESTION_TYPE", "text": "Question text", "reasoning": "Why valuable", "options": [...]}]}`;

      const message = await this.client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const data = this.extractJSON(content.text);
        return {
          success: true,
          data,
          provider: this.providerName,
          tokensUsed: message.usage ? message.usage.input_tokens + message.usage.output_tokens : undefined,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic suggestQuestions error:', error);
      return this.formatError(error);
    }
  }

  async analyzeResponses(request: AnalyzeResponsesRequest): Promise<AIResponse> {
    try {
      const analysisTypes = {
        summary: 'Provide a comprehensive executive summary',
        sentiment: 'Analyze sentiment patterns',
        themes: 'Extract main themes and topics',
        recommendations: 'Provide actionable recommendations',
      };

      const type = request.analysisType || 'summary';
      const prompt = `Analyze these survey responses:

Questions: ${JSON.stringify(request.questions, null, 2)}
Responses (first 100): ${JSON.stringify(request.responses.slice(0, 100), null, 2)}

Task: ${analysisTypes[type]}

Return ONLY valid JSON:
{
  "type": "${type}",
  "insights": [{"title": "...", "description": "...", "confidence": 0.95}],
  "summary": "...",
  "keyFindings": ["..."],
  "recommendations": ["..."]
}`;

      const message = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const data = this.extractJSON(content.text);
        return {
          success: true,
          data,
          provider: this.providerName,
          tokensUsed: message.usage ? message.usage.input_tokens + message.usage.output_tokens : undefined,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic analyzeResponses error:', error);
      return this.formatError(error);
    }
  }

  async optimizeQuestion(request: OptimizeQuestionRequest): Promise<AIResponse> {
    try {
      const prompt = `Optimize this survey question:
Type: ${request.type}
Text: ${request.text}
${request.options ? `Options: ${JSON.stringify(request.options)}` : ''}

Return ONLY valid JSON:
{"improvedText": "...", "suggestions": ["..."], "improvedOptions": [...]}`;

      const message = await this.client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const data = this.extractJSON(content.text);
        return {
          success: true,
          data,
          provider: this.providerName,
          tokensUsed: message.usage ? message.usage.input_tokens + message.usage.output_tokens : undefined,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic optimizeQuestion error:', error);
      return this.formatError(error);
    }
  }

  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<AIResponse> {
    try {
      const prompt = `Analyze sentiment: "${request.text}"
Return ONLY JSON: {"sentiment": "positive|negative|neutral", "score": 0.85, "emotions": ["..."]}`;

      const message = await this.client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const data = this.extractJSON(content.text);
        return {
          success: true,
          data,
          provider: this.providerName,
          tokensUsed: message.usage ? message.usage.input_tokens + message.usage.output_tokens : undefined,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic analyzeSentiment error:', error);
      return this.formatError(error);
    }
  }

  async generateReport(request: GenerateReportRequest): Promise<AIResponse> {
    try {
      const prompt = `Generate a comprehensive survey report for: ${request.surveyTitle}

Analytics: ${JSON.stringify(request.analytics, null, 2)}
AI Insights: ${JSON.stringify(request.insights, null, 2)}

Create a well-formatted markdown report with:
1. Executive Summary
2. Key Metrics
3. Detailed Analysis
4. Insights and Findings
5. Recommendations
6. Conclusion`;

      const message = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return {
          success: true,
          data: content.text,
          provider: this.providerName,
          tokensUsed: message.usage ? message.usage.input_tokens + message.usage.output_tokens : undefined,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic generateReport error:', error);
      return this.formatError(error);
    }
  }

  async generateSurveyIdeas(request: GenerateSurveyIdeasRequest): Promise<AIResponse> {
    try {
      const prompt = `Generate ${request.count || 5} survey ideas for: "${request.topic}"
${request.targetAudience ? `Target: ${request.targetAudience}` : ''}
${request.purpose ? `Purpose: ${request.purpose}` : ''}

Return ONLY valid JSON with survey ideas including title, description, key areas, and expected insights.`;

      const message = await this.client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const data = this.extractJSON(content.text);
        return {
          success: true,
          data,
          provider: this.providerName,
          tokensUsed: message.usage?.total_tokens,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic generateSurveyIdeas error:', error);
      return this.formatError(error);
    }
  }

  async improveSurvey(request: ImproveSurveyRequest): Promise<AIResponse> {
    try {
      const prompt = `Analyze and improve this survey: ${JSON.stringify(request.survey)}
Provide assessment, improvements, and suggestions. Return ONLY valid JSON.`;

      const message = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const data = this.extractJSON(content.text);
        return {
          success: true,
          data,
          provider: this.providerName,
          tokensUsed: message.usage?.total_tokens,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic improveSurvey error:', error);
      return this.formatError(error);
    }
  }

  async generateAnalyticsSummary(request: GenerateAnalyticsSummaryRequest): Promise<AIResponse> {
    try {
      const prompt = `Generate analytics summary for "${request.surveyTitle}": ${JSON.stringify(request.analytics)}
Include executive summary, key metrics, highlights, and action items. Return ONLY valid JSON.`;

      const message = await this.client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const data = this.extractJSON(content.text);
        return {
          success: true,
          data,
          provider: this.providerName,
          tokensUsed: message.usage?.total_tokens,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic generateAnalyticsSummary error:', error);
      return this.formatError(error);
    }
  }

  async crossSurveyAnalysis(request: CrossSurveyAnalysisRequest): Promise<AIResponse> {
    try {
      const prompt = `Analyze patterns across ${request.surveys.length} surveys: ${JSON.stringify(request.surveys)}
${request.analysisGoal || 'Find common themes, trends, and correlations'}
Return ONLY valid JSON with overview, themes, trends, correlations, and recommendations.`;

      const message = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const data = this.extractJSON(content.text);
        return {
          success: true,
          data,
          provider: this.providerName,
          tokensUsed: message.usage?.total_tokens,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      logger.error('Anthropic crossSurveyAnalysis error:', error);
      return this.formatError(error);
    }
  }
}
