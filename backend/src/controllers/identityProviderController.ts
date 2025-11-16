import { Request, Response } from 'express';
import { identityProviderService } from '../services/identityProviderService';
import { IdentityProvider } from '@prisma/client';

export const identityProviderController = {
  async getAll(req: Request, res: Response) {
    try {
      const configs = await identityProviderService.getAllConfigs();
      res.json({
        success: true,
        data: configs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getAvailable(req: Request, res: Response) {
    res.json({
      success: true,
      data: [
        {
          provider: IdentityProvider.GOOGLE,
          name: 'Google',
          description: 'Sign in with Google OAuth 2.0',
          requiresCallbackUrl: true,
          defaultScopes: ['profile', 'email'],
        },
        {
          provider: IdentityProvider.MICROSOFT,
          name: 'Microsoft',
          description: 'Sign in with Microsoft Azure AD',
          requiresCallbackUrl: true,
          defaultScopes: ['user.read'],
        },
        {
          provider: IdentityProvider.GITHUB,
          name: 'GitHub',
          description: 'Sign in with GitHub',
          requiresCallbackUrl: true,
          defaultScopes: ['user:email'],
        },
        {
          provider: IdentityProvider.GITLAB,
          name: 'GitLab',
          description: 'Sign in with GitLab',
          requiresCallbackUrl: true,
          defaultScopes: ['read_user'],
        },
        {
          provider: IdentityProvider.OKTA,
          name: 'Okta',
          description: 'Enterprise SSO with Okta',
          requiresCallbackUrl: true,
          requiresIssuer: true,
        },
        {
          provider: IdentityProvider.AUTH0,
          name: 'Auth0',
          description: 'Enterprise SSO with Auth0',
          requiresCallbackUrl: true,
          requiresIssuer: true,
        },
        {
          provider: IdentityProvider.SAML,
          name: 'SAML 2.0',
          description: 'Generic SAML 2.0 provider',
          requiresCallbackUrl: true,
          requiresIssuer: true,
          requiresCertificate: true,
        },
        {
          provider: IdentityProvider.OIDC,
          name: 'OpenID Connect',
          description: 'Generic OIDC provider',
          requiresCallbackUrl: true,
          requiresIssuer: true,
        },
      ],
    });
  },

  async create(req: Request, res: Response) {
    try {
      const config = await identityProviderService.createConfig(req.body);
      res.status(201).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      const config = await identityProviderService.updateConfig(
        provider as IdentityProvider,
        req.body
      );
      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      await identityProviderService.deleteConfig(provider as IdentityProvider);
      res.json({
        success: true,
        message: 'Identity provider configuration deleted',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async toggleEnabled(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      const { isEnabled } = req.body;
      const config = await identityProviderService.toggleEnabled(
        provider as IdentityProvider,
        isEnabled
      );
      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};
