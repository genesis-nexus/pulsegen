import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AIProvider } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';
import { BaseAIProvider } from './aiProviders/base';
import { AIProviderFactory } from './aiProviders/factory';
import logger from '../utils/logger';

export class AIProviderService {
  // Get user's AI provider (default or specific)
  static async getUserProvider(userId: string, provider?: AIProvider): Promise<BaseAIProvider> {
    let providerConfig;

    if (provider) {
      // Get specific provider
      providerConfig = await prisma.userAIProvider.findUnique({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
      });
    } else {
      // Get default provider
      providerConfig = await prisma.userAIProvider.findFirst({
        where: {
          userId,
          isDefault: true,
          isActive: true,
        },
      });
    }

    if (!providerConfig) {
      throw new AppError(404, 'No AI provider configured. Please add an API key in settings.');
    }

    if (!providerConfig.isActive) {
      throw new AppError(400, 'AI provider is disabled');
    }

    // Decrypt API key
    const apiKey = decrypt(providerConfig.apiKey);

    // Create provider instance
    return AIProviderFactory.createProvider(providerConfig.provider, {
      apiKey,
      modelName: providerConfig.modelName || undefined,
      endpoint: providerConfig.endpoint || undefined,
      settings: providerConfig.settings as any,
    });
  }

  // Add AI provider for user
  static async addProvider(userId: string, data: {
    provider: AIProvider;
    apiKey: string;
    modelName?: string;
    endpoint?: string;
    isDefault?: boolean;
    settings?: any;
  }) {
    // Encrypt API key
    const encryptedApiKey = encrypt(data.apiKey);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.userAIProvider.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create provider
    const provider = await prisma.userAIProvider.create({
      data: {
        userId,
        provider: data.provider,
        apiKey: encryptedApiKey,
        modelName: data.modelName,
        endpoint: data.endpoint,
        isDefault: data.isDefault ?? false,
        settings: data.settings,
      },
    });

    return {
      ...provider,
      apiKey: undefined, // Don't return API key
    };
  }

  // Update AI provider
  static async updateProvider(userId: string, provider: AIProvider, data: {
    apiKey?: string;
    modelName?: string;
    endpoint?: string;
    isDefault?: boolean;
    isActive?: boolean;
    settings?: any;
  }) {
    const existing = await prisma.userAIProvider.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!existing) {
      throw new AppError(404, 'AI provider not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault && !existing.isDefault) {
      await prisma.userAIProvider.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: any = {
      modelName: data.modelName,
      endpoint: data.endpoint,
      isDefault: data.isDefault,
      isActive: data.isActive,
      settings: data.settings,
    };

    // Encrypt new API key if provided
    if (data.apiKey) {
      updateData.apiKey = encrypt(data.apiKey);
    }

    const updated = await prisma.userAIProvider.update({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      data: updateData,
    });

    return {
      ...updated,
      apiKey: undefined, // Don't return API key
    };
  }

  // Delete AI provider
  static async deleteProvider(userId: string, provider: AIProvider) {
    const existing = await prisma.userAIProvider.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!existing) {
      throw new AppError(404, 'AI provider not found');
    }

    await prisma.userAIProvider.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }

  // List user's AI providers
  static async listProviders(userId: string) {
    const providers = await prisma.userAIProvider.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        modelName: true,
        endpoint: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // apiKey is excluded
      },
    });

    return providers;
  }

  // Get available providers and their info
  static getAvailableProviders() {
    const supported = AIProviderFactory.getSupportedProviders();
    return supported.map((provider) => ({
      provider,
      ...AIProviderFactory.getProviderInfo(provider),
    }));
  }
}

export default AIProviderService;
