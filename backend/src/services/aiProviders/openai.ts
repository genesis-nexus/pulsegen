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
} from './base';
import logger from '../../utils/logger';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: AIProviderConfig) {
    super(config, 'OpenAI');
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.defaultModel = config.modelName || 'gpt-4-turbo-preview';
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

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      const data = JSON.parse(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI generateSurvey error:', error);
      return this.formatError(error);
    }
  }

  async suggestQuestions(request: SuggestQuestionsRequest): Promise<AIResponse> {
    try {
      const prompt = `Survey: ${request.surveyTitle}
${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ''}

Existing questions:
${request.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Suggest 5 additional questions that would provide valuable insights. Return as JSON:
{"suggestions": [{"type": "QUESTION_TYPE", "text": "Question text", "reasoning": "Why valuable", "options": [...]}]}`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      const data = JSON.parse(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI suggestQuestions error:', error);
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

Return as JSON with this structure:
{
  "type": "${type}",
  "insights": [{"title": "...", "description": "...", "confidence": 0.95}],
  "summary": "...",
  "keyFindings": ["..."],
  "recommendations": ["..."]
}`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      const data = JSON.parse(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI analyzeResponses error:', error);
      return this.formatError(error);
    }
  }

  async optimizeQuestion(request: OptimizeQuestionRequest): Promise<AIResponse> {
    try {
      const prompt = `Optimize this survey question for clarity and effectiveness:
Type: ${request.type}
Text: ${request.text}
${request.options ? `Options: ${JSON.stringify(request.options)}` : ''}

Return as JSON:
{"improvedText": "...", "suggestions": ["..."], "improvedOptions": [...]}`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      const data = JSON.parse(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI optimizeQuestion error:', error);
      return this.formatError(error);
    }
  }

  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<AIResponse> {
    try {
      const prompt = `Analyze the sentiment of this text: "${request.text}"
Return as JSON: {"sentiment": "positive|negative|neutral", "score": 0.85, "emotions": ["..."]}`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      const data = JSON.parse(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI analyzeSentiment error:', error);
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

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      return {
        success: true,
        data: content,
        provider: this.providerName,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI generateReport error:', error);
      return this.formatError(error);
    }
  }

  async generateSurveyIdeas(request: GenerateSurveyIdeasRequest): Promise<AIResponse> {
    try {
      const prompt = `Generate ${request.count || 5} survey ideas for: "${request.topic}"
${request.targetAudience ? `Target: ${request.targetAudience}` : ''}
${request.purpose ? `Purpose: ${request.purpose}` : ''}

Return as JSON with survey ideas including title, description, key areas, and expected insights.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      const data = JSON.parse(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI generateSurveyIdeas error:', error);
      return this.formatError(error);
    }
  }

  async improveSurvey(request: ImproveSurveyRequest): Promise<AIResponse> {
    try {
      const prompt = `Analyze and improve this survey: ${JSON.stringify(request.survey)}
Provide assessment, improvements, and suggestions. Return as JSON.`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      const data = JSON.parse(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI improveSurvey error:', error);
      return this.formatError(error);
    }
  }

  async generateAnalyticsSummary(request: GenerateAnalyticsSummaryRequest): Promise<AIResponse> {
    try {
      const prompt = `Generate analytics summary for "${request.surveyTitle}": ${JSON.stringify(request.analytics)}
Include executive summary, key metrics, highlights, and action items. Return as JSON.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      const data = JSON.parse(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI generateAnalyticsSummary error:', error);
      return this.formatError(error);
    }
  }

  async crossSurveyAnalysis(request: CrossSurveyAnalysisRequest): Promise<AIResponse> {
    try {
      const prompt = `Analyze patterns across ${request.surveys.length} surveys: ${JSON.stringify(request.surveys)}
${request.analysisGoal || 'Find common themes, trends, and correlations'}
Return as JSON with overview, themes, trends, correlations, and recommendations.`;

      const completion = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      const data = JSON.parse(content);
      return {
        success: true,
        data,
        provider: this.providerName,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error: any) {
      logger.error('OpenAI crossSurveyAnalysis error:', error);
      return this.formatError(error);
    }
  }
}
