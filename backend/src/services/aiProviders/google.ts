import { GoogleGenerativeAI } from '@google/generative-ai';
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
} from './base';
import logger from '../../utils/logger';

export class GoogleProvider extends BaseAIProvider {
  private client: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(config: AIProviderConfig) {
    super(config, 'Google');
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.defaultModel = config.modelName || 'gemini-pro';
  }

  async generateSurvey(request: GenerateSurveyRequest): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });

      const prompt = `You are an expert survey designer. Create a survey based on this description: ${request.prompt}

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

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const data = this.extractJSON(text);
      return {
        success: true,
        data,
        provider: this.providerName,
        model: this.defaultModel,
      };
    } catch (error: any) {
      logger.error('Google generateSurvey error:', error);
      return this.formatError(error);
    }
  }

  async suggestQuestions(request: SuggestQuestionsRequest): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });

      const prompt = `Survey: ${request.surveyTitle}
${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ''}

Existing questions:
${request.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Suggest 5 additional questions. Return ONLY valid JSON:
{"suggestions": [{"type": "QUESTION_TYPE", "text": "Question text", "reasoning": "Why valuable", "options": [...]}]}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const data = this.extractJSON(text);
      return {
        success: true,
        data,
        provider: this.providerName,
      };
    } catch (error: any) {
      logger.error('Google suggestQuestions error:', error);
      return this.formatError(error);
    }
  }

  async analyzeResponses(request: AnalyzeResponsesRequest): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });

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

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const data = this.extractJSON(text);
      return {
        success: true,
        data,
        provider: this.providerName,
      };
    } catch (error: any) {
      logger.error('Google analyzeResponses error:', error);
      return this.formatError(error);
    }
  }

  async optimizeQuestion(request: OptimizeQuestionRequest): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });

      const prompt = `Optimize this survey question:
Type: ${request.type}
Text: ${request.text}
${request.options ? `Options: ${JSON.stringify(request.options)}` : ''}

Return ONLY valid JSON:
{"improvedText": "...", "suggestions": ["..."], "improvedOptions": [...]}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const data = this.extractJSON(text);
      return {
        success: true,
        data,
        provider: this.providerName,
      };
    } catch (error: any) {
      logger.error('Google optimizeQuestion error:', error);
      return this.formatError(error);
    }
  }

  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });

      const prompt = `Analyze sentiment: "${request.text}"
Return ONLY JSON: {"sentiment": "positive|negative|neutral", "score": 0.85, "emotions": ["..."]}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const data = this.extractJSON(text);
      return {
        success: true,
        data,
        provider: this.providerName,
      };
    } catch (error: any) {
      logger.error('Google analyzeSentiment error:', error);
      return this.formatError(error);
    }
  }

  async generateReport(request: GenerateReportRequest): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.defaultModel });

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

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return {
        success: true,
        data: text,
        provider: this.providerName,
      };
    } catch (error: any) {
      logger.error('Google generateReport error:', error);
      return this.formatError(error);
    }
  }
}
