import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as SamlStrategy, type VerifyWithoutRequest } from '@node-saml/passport-saml';
import type { Profile as SamlProfile } from '@node-saml/node-saml';
import { PrismaClient, IdentityProvider } from '@prisma/client';
import { identityProviderService } from '../services/identityProviderService';

const prisma = new PrismaClient();

interface SSOProfile {
  provider: IdentityProvider;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

async function findOrCreateUser(profile: SSOProfile) {
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: profile.email },
        { provider: profile.provider, providerId: profile.providerId },
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        provider: profile.provider,
        providerId: profile.providerId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        emailVerified: true, // SSO users are pre-verified
        isActive: true,
      },
    });
  } else if (user.provider === IdentityProvider.LOCAL) {
    // Link local account with SSO
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        provider: profile.provider,
        providerId: profile.providerId,
        avatar: profile.avatar || user.avatar,
      },
    });
  }

  return user;
}

export async function configurePassport() {
  // Configure Google OAuth
  const googleConfig = await identityProviderService.getConfig(IdentityProvider.GOOGLE);
  if (googleConfig && googleConfig.isEnabled) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleConfig.clientId,
          clientSecret: googleConfig.clientSecret,
          callbackURL: googleConfig.callbackUrl || '/api/auth/google/callback',
          scope: googleConfig.scopes || ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateUser({
              provider: IdentityProvider.GOOGLE,
              providerId: profile.id,
              email: profile.emails?.[0]?.value || '',
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              avatar: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // Configure Microsoft OAuth
  const microsoftConfig = await identityProviderService.getConfig(IdentityProvider.MICROSOFT);
  if (microsoftConfig && microsoftConfig.isEnabled) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: microsoftConfig.clientId,
          clientSecret: microsoftConfig.clientSecret,
          callbackURL: microsoftConfig.callbackUrl || '/api/auth/microsoft/callback',
          scope: microsoftConfig.scopes || ['user.read'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateUser({
              provider: IdentityProvider.MICROSOFT,
              providerId: profile.id,
              email: profile.emails?.[0]?.value || profile._json?.userPrincipalName || '',
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              avatar: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // Configure GitHub OAuth
  const githubConfig = await identityProviderService.getConfig(IdentityProvider.GITHUB);
  if (githubConfig && githubConfig.isEnabled) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: githubConfig.clientId,
          clientSecret: githubConfig.clientSecret,
          callbackURL: githubConfig.callbackUrl || '/api/auth/github/callback',
          scope: githubConfig.scopes || ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
            const nameParts = profile.displayName?.split(' ') || [];

            const user = await findOrCreateUser({
              provider: IdentityProvider.GITHUB,
              providerId: profile.id,
              email,
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(' '),
              avatar: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // Configure SAML
  const samlConfig = await identityProviderService.getConfig(IdentityProvider.SAML);
  if (samlConfig && samlConfig.isEnabled) {
    const metadata = samlConfig.metadata as { cert?: string; identifierFormat?: string } | null | undefined;

    const verifyCallback: VerifyWithoutRequest = async (profile: SamlProfile | null, done) => {
      try {
        if (!profile) {
          return done(new Error('No profile provided'));
        }

        const user = await findOrCreateUser({
          provider: IdentityProvider.SAML,
          providerId: (profile.nameID as string) || (profile.id as string),
          email: (profile.email as string) || (profile.nameID as string),
          firstName: (profile.firstName as string) || (profile.givenName as string),
          lastName: (profile.lastName as string) || (profile.surname as string),
          avatar: profile.avatar as string | undefined,
        });
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    };

    const logoutCallback: VerifyWithoutRequest = async (profile: SamlProfile | null, done) => {
      // For logout, we just need to acknowledge it
      done(null, {});
    };

    passport.use(
      new SamlStrategy(
        {
          entryPoint: samlConfig.authUrl || '',
          issuer: samlConfig.issuer || '',
          callbackUrl: samlConfig.callbackUrl || '/api/auth/saml/callback',
          idpCert: metadata?.cert || '',
          identifierFormat: metadata?.identifierFormat,
          passReqToCallback: false,
        },
        verifyCallback,
        logoutCallback
      )
    );
  }

  // Serialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
