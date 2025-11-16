import { PrismaClient, IdentityProvider } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();

export interface IdentityProviderConfigInput {
  provider: IdentityProvider;
  name: string;
  clientId: string;
  clientSecret: string;
  issuer?: string;
  authUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  callbackUrl?: string;
  scopes?: string[];
  isEnabled?: boolean;
  isDefault?: boolean;
  metadata?: any;
}

export const identityProviderService = {
  async getAllConfigs() {
    const configs = await prisma.identityProviderConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Don't expose client secrets
    return configs.map(config => ({
      ...config,
      clientSecret: '***ENCRYPTED***',
    }));
  },

  async getConfig(provider: IdentityProvider) {
    const config = await prisma.identityProviderConfig.findFirst({
      where: { provider, isEnabled: true },
    });

    if (!config) {
      return null;
    }

    // Decrypt client secret for actual use
    return {
      ...config,
      clientSecret: decrypt(config.clientSecret),
    };
  },

  async getDefaultConfig() {
    const config = await prisma.identityProviderConfig.findFirst({
      where: { isDefault: true, isEnabled: true },
    });

    if (!config) {
      return null;
    }

    return {
      ...config,
      clientSecret: decrypt(config.clientSecret),
    };
  },

  async createConfig(data: IdentityProviderConfigInput) {
    // Check if provider already exists
    const existing = await prisma.identityProviderConfig.findFirst({
      where: { provider: data.provider },
    });

    if (existing) {
      throw new Error(`Configuration for ${data.provider} already exists`);
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.identityProviderConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // Encrypt client secret
    const encryptedSecret = encrypt(data.clientSecret);

    const config = await prisma.identityProviderConfig.create({
      data: {
        ...data,
        clientSecret: encryptedSecret,
      },
    });

    return {
      ...config,
      clientSecret: '***ENCRYPTED***',
    };
  },

  async updateConfig(provider: IdentityProvider, data: Partial<IdentityProviderConfigInput>) {
    const existing = await prisma.identityProviderConfig.findFirst({
      where: { provider },
    });

    if (!existing) {
      throw new Error(`Configuration for ${provider} not found`);
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.identityProviderConfig.updateMany({
        where: { isDefault: true, provider: { not: provider } },
        data: { isDefault: false },
      });
    }

    // Encrypt new client secret if provided
    const updateData: any = { ...data };
    if (data.clientSecret) {
      updateData.clientSecret = encrypt(data.clientSecret);
    }

    const config = await prisma.identityProviderConfig.update({
      where: { id: existing.id },
      data: updateData,
    });

    return {
      ...config,
      clientSecret: '***ENCRYPTED***',
    };
  },

  async deleteConfig(provider: IdentityProvider) {
    const config = await prisma.identityProviderConfig.findFirst({
      where: { provider },
    });

    if (!config) {
      throw new Error(`Configuration for ${provider} not found`);
    }

    await prisma.identityProviderConfig.delete({
      where: { id: config.id },
    });

    return { message: 'Configuration deleted successfully' };
  },

  async toggleEnabled(provider: IdentityProvider, isEnabled: boolean) {
    const config = await prisma.identityProviderConfig.findFirst({
      where: { provider },
    });

    if (!config) {
      throw new Error(`Configuration for ${provider} not found`);
    }

    const updated = await prisma.identityProviderConfig.update({
      where: { id: config.id },
      data: { isEnabled },
    });

    return {
      ...updated,
      clientSecret: '***ENCRYPTED***',
    };
  },
};
