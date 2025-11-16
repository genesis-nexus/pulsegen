import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger';
import { redis } from '../config/redis';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerateSurveyOptions {
  prompt: string;
  questionCount?: number;
  includeLogic?: boolean;
}

interface AnalyzeResponsesOptions {
  responses: any[];
  questions: any[];
  analysisType?: 'summary' | 'sentiment' | 'themes' | 'recommendations';
}

export class AIService {
  private static CACHE_TTL = 3600; // 1 hour

  static async generateSurvey(options: GenerateSurveyOptions) {
    const cacheKey = `ai:survey:${JSON.stringify(options)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const systemPrompt = `You are an expert survey designer. Create well-structured, unbiased surveys that gather meaningful insights. Follow best practices for question design:
- Use clear, concise language
- Avoid leading or loaded questions
- Include appropriate response options
- Consider logical flow
- Ensure questions are relevant to the survey goal`;

    const userPrompt = `Create a survey based on this description: ${options.prompt}

Requirements:
- Generate ${options.questionCount || 10} questions
- Include a mix of question types (multiple choice, rating scales, text, etc.)
- ${options.includeLogic ? 'Add skip logic where appropriate' : 'No skip logic needed'}
- Return ONLY valid JSON in this format:

{
  "title": "Survey Title",
  "description": "Survey description",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE|CHECKBOXES|RATING_SCALE|SHORT_TEXT|LONG_TEXT|etc",
      "text": "Question text",
      "description": "Optional description",
      "isRequired": true|false,
      "options": [
        {"text": "Option 1", "value": "option1"},
        {"text": "Option 2", "value": "option2"}
      ],
      "settings": {
        "min": 1,
        "max": 5,
        "step": 1
      }
    }
  ],
  "logic": [
    {
      "type": "SKIP_LOGIC",
      "sourceQuestionIndex": 0,
      "conditions": [{"optionValue": "option1", "operator": "equals"}],
      "actions": [{"type": "skip_to", "targetQuestionIndex": 3}]
    }
  ]
}`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      });

      const content = message.content[0];
      if (content.type === 'text') {
        // Extract JSON from response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }

        const result = JSON.parse(jsonMatch[0]);

        // Cache the result
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

        return result;
      }

      throw new Error('Unexpected AI response format');
    } catch (error) {
      logger.error('AI survey generation error:', error);
      throw new Error('Failed to generate survey');
    }
  }

  static async suggestQuestions(context: {
    surveyTitle: string;
    existingQuestions: string[];
    targetAudience?: string;
  }) {
    const cacheKey = `ai:questions:${JSON.stringify(context)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const prompt = `Survey: ${context.surveyTitle}
${context.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}

Existing questions:
${context.existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Suggest 5 additional questions that would provide valuable insights for this survey. Return ONLY valid JSON:

{
  "suggestions": [
    {
      "type": "QUESTION_TYPE",
      "text": "Question text",
      "reasoning": "Why this question is valuable",
      "options": [...]
    }
  ]
}`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }

        const result = JSON.parse(jsonMatch[0]);
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        return result;
      }

      throw new Error('Unexpected AI response format');
    } catch (error) {
      logger.error('AI question suggestion error:', error);
      throw new Error('Failed to suggest questions');
    }
  }

  static async analyzeResponses(options: AnalyzeResponsesOptions) {
    const cacheKey = `ai:analysis:${JSON.stringify(options).substring(0, 100)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const analysisTypePrompts = {
      summary: 'Provide a comprehensive executive summary of the survey results, highlighting key findings and overall trends.',
      sentiment: 'Analyze the sentiment expressed in the responses. Identify positive, negative, and neutral sentiment patterns.',
      themes: 'Extract the main themes and topics from the responses. Group similar feedback and identify patterns.',
      recommendations: 'Based on the survey results, provide actionable recommendations and next steps.',
    };

    const type = options.analysisType || 'summary';

    const prompt = `Analyze these survey responses:

Questions:
${JSON.stringify(options.questions, null, 2)}

Responses (first 100):
${JSON.stringify(options.responses.slice(0, 100), null, 2)}

Task: ${analysisTypePrompts[type]}

Return ONLY valid JSON:

{
  "type": "${type}",
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed description",
      "confidence": 0.95,
      "supportingData": {...}
    }
  ],
  "summary": "Overall summary",
  "keyFindings": ["Finding 1", "Finding 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }

        const result = JSON.parse(jsonMatch[0]);
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        return result;
      }

      throw new Error('Unexpected AI response format');
    } catch (error) {
      logger.error('AI response analysis error:', error);
      throw new Error('Failed to analyze responses');
    }
  }

  static async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    emotions?: string[];
  }> {
    const cacheKey = `ai:sentiment:${text.substring(0, 100)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const prompt = `Analyze the sentiment of this text: "${text}"

Return ONLY valid JSON:
{
  "sentiment": "positive|negative|neutral",
  "score": 0.85,
  "emotions": ["happy", "satisfied"]
}`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }

        const result = JSON.parse(jsonMatch[0]);
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        return result;
      }

      throw new Error('Unexpected AI response format');
    } catch (error) {
      logger.error('AI sentiment analysis error:', error);
      return { sentiment: 'neutral', score: 0.5 };
    }
  }

  static async generateReport(data: {
    surveyTitle: string;
    analytics: any;
    insights: any[];
  }): Promise<string> {
    const prompt = `Generate a comprehensive survey report for: ${data.surveyTitle}

Analytics:
${JSON.stringify(data.analytics, null, 2)}

AI Insights:
${JSON.stringify(data.insights, null, 2)}

Create a well-formatted markdown report with:
1. Executive Summary
2. Key Metrics
3. Detailed Analysis
4. Insights and Findings
5. Recommendations
6. Conclusion`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      throw new Error('Unexpected AI response format');
    } catch (error) {
      logger.error('AI report generation error:', error);
      throw new Error('Failed to generate report');
    }
  }

  static async optimizeQuestion(question: {
    text: string;
    type: string;
    options?: any[];
  }): Promise<{
    improvedText: string;
    suggestions: string[];
    improvedOptions?: any[];
  }> {
    const prompt = `Optimize this survey question:

Type: ${question.type}
Text: ${question.text}
${question.options ? `Options: ${JSON.stringify(question.options)}` : ''}

Provide improvements for clarity, neutrality, and effectiveness. Return ONLY valid JSON:

{
  "improvedText": "Optimized question text",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "improvedOptions": [...]
}`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid AI response format');
        }

        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Unexpected AI response format');
    } catch (error) {
      logger.error('AI question optimization error:', error);
      throw new Error('Failed to optimize question');
    }
  }
}

export default AIService;
