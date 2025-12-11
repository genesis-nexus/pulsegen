import { AIProvider } from '@prisma/client';
import { BaseAIProvider, AIProviderConfig } from './base';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleProvider } from './google';
import { OpenRouterProvider } from './openrouter';
import logger from '../../utils/logger';

export class AIProviderFactory {
  static createProvider(
    provider: AIProvider,
    config: AIProviderConfig
  ): BaseAIProvider {
    switch (provider) {
      case 'ANTHROPIC':
        return new AnthropicProvider(config);

      case 'OPENAI':
        return new OpenAIProvider(config);

      case 'GOOGLE':
        return new GoogleProvider(config);

      case 'AZURE_OPENAI':
        // Azure OpenAI uses OpenAI SDK with custom endpoint
        return new OpenAIProvider({
          ...config,
          endpoint: config.endpoint || process.env.AZURE_OPENAI_ENDPOINT,
        });

      case 'OPENROUTER':
        return new OpenRouterProvider(config);

      case 'COHERE':
      case 'HUGGINGFACE':
      case 'CUSTOM':
        throw new Error(`Provider ${provider} not yet implemented`);

      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }

  static getSupportedProviders(): AIProvider[] {
    return ['OPENAI', 'ANTHROPIC', 'GOOGLE', 'AZURE_OPENAI', 'OPENROUTER'];
  }

  static getProviderInfo(provider: AIProvider) {
    const providerInfo = {
      OPENAI: {
        name: 'OpenAI',
        models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4-turbo-preview',
        requiresEndpoint: false,
      },
      ANTHROPIC: {
        name: 'Anthropic Claude',
        models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514', 'claude-opus-4-20250514'],
        defaultModel: 'claude-sonnet-4-20250514',
        requiresEndpoint: false,
      },
      GOOGLE: {
        name: 'Google Gemini',
        models: ['gemini-pro', 'gemini-pro-vision'],
        defaultModel: 'gemini-pro',
        requiresEndpoint: false,
      },
      AZURE_OPENAI: {
        name: 'Azure OpenAI',
        models: ['gpt-4', 'gpt-35-turbo'],
        defaultModel: 'gpt-4',
        requiresEndpoint: true,
      },
      OPENROUTER: {
        name: 'OpenRouter',
        models: [
          'google/gemini-2.0-flash-exp:free',
          'meta-llama/llama-3.2-3b-instruct:free',
          'microsoft/phi-3-mini-128k-instruct:free',
          'openchat/openchat-7b:free',
          'gryphe/mythomist-7b:free',
          'openai/gpt-4-turbo',
          'anthropic/claude-3.5-sonnet',
          'google/gemini-pro-1.5',
        ],
        defaultModel: 'google/gemini-2.0-flash-exp:free',
        requiresEndpoint: true,
        defaultEndpoint: 'https://openrouter.ai/api/v1',
        description: 'Access multiple AI models through OpenRouter. Free tier available with models marked ":free"',
      },
      COHERE: {
        name: 'Cohere',
        models: ['command', 'command-light'],
        defaultModel: 'command',
        requiresEndpoint: false,
      },
      HUGGINGFACE: {
        name: 'Hugging Face',
        models: [],
        defaultModel: '',
        requiresEndpoint: true,
      },
      CUSTOM: {
        name: 'Custom Provider',
        models: [],
        defaultModel: '',
        requiresEndpoint: true,
      },
    };

    return providerInfo[provider];
  }
}
