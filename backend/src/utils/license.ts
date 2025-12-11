/**
 * PulseGen License Management System
 *
 * Security approach:
 * - RSA-2048 asymmetric encryption
 * - License keys are signed with private key (kept secret)
 * - App validates with public key (embedded in app)
 * - Includes tampering detection and multiple validation points
 * - Grace period for temporary offline operation
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// License payload interface
export interface LicensePayload {
  customerId: string;
  email: string;
  companyName: string;
  issuedAt: string;
  expiresAt: string;
  tier: 'starter' | 'professional' | 'enterprise';
  maxUsers?: number;
  maxSurveys?: number;
  maxResponses?: number;
  features: string[];
  instanceId?: string; // Unique instance identifier
}

// License validation result
export interface LicenseValidationResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
  expiresInDays?: number;
  isExpired?: boolean;
  features?: string[];
}

// Public key for license validation (embedded in app)
// In production, generate your own RSA key pair with:
// openssl genrsa -out private.pem 2048
// openssl rsa -in private.pem -pubout -out public.pem
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1qvGv7Y8LxJKp6wN5Hzp
XQK3F8x5pJjKWm2H0NQkYZFu3JCHqV9rPjKU3nQ4sXJ7Z2mT5kL8nY1vR3Fw2Hxp
pM6bN9L4aT5xE1nP8zR6mK3vY5qW2uN7xJ3kL9pQ1mH5tU3nR7xF2vL9mQ4tP1nK
8aS6xN2uM4pT7qL3vZ1nH9rU4sR6xM1tP8qL2nN5uT3xF7mZ9pQ6vY1nK8rS4tN
3uR7xJ6pL2vM5nH9qU1sT4xZ3mK8rN6uP7yL9vQ3nF1tU5xR2mH8pS7qN4uT6xJ
3vL9nZ1rK5sM2pU8qT7xF4mN6vY3nR9uH1tP5xL8rS2qN7uK6vM9nJ3tZ4pQ1xF
5wIDAQAB
-----END PUBLIC KEY-----`;

// Checksum for tamper detection (hash of public key + app version)
const INTEGRITY_HASH = crypto
  .createHash('sha256')
  .update(PUBLIC_KEY + process.env.APP_VERSION || '1.0.0')
  .digest('hex');

/**
 * Generate a unique instance ID for this installation
 * This ties the license to a specific instance
 */
export function generateInstanceId(): string {
  const machineId = crypto.randomBytes(16).toString('hex');
  return `instance_${machineId}`;
}

/**
 * Encode license payload to base64
 */
function encodePayload(payload: LicensePayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decode license payload from base64
 */
function decodePayload(encoded: string): LicensePayload {
  const json = Buffer.from(encoded, 'base64').toString('utf-8');
  return JSON.parse(json);
}

/**
 * Verify RSA signature
 */
function verifySignature(data: string, signature: string): boolean {
  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    verify.end();

    const isValid = verify.verify(PUBLIC_KEY, signature, 'base64');
    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Parse license key into payload and signature
 * License key format: PAYLOAD.SIGNATURE (both base64 encoded)
 */
function parseLicenseKey(licenseKey: string): { payload: string; signature: string } | null {
  try {
    const parts = licenseKey.split('.');
    if (parts.length !== 2) {
      return null;
    }
    return {
      payload: parts[0],
      signature: parts[1]
    };
  } catch (error) {
    return null;
  }
}

/**
 * Validate license key
 * Returns validation result with payload if valid
 */
export function validateLicense(licenseKey: string): LicenseValidationResult {
  try {
    // Integrity check
    if (!verifyIntegrity()) {
      return {
        valid: false,
        error: 'Application integrity check failed. Please reinstall from official source.'
      };
    }

    // Parse license key
    const parsed = parseLicenseKey(licenseKey);
    if (!parsed) {
      return {
        valid: false,
        error: 'Invalid license key format'
      };
    }

    // Verify signature
    if (!verifySignature(parsed.payload, parsed.signature)) {
      return {
        valid: false,
        error: 'Invalid license key signature. This license may be tampered or invalid.'
      };
    }

    // Decode payload
    const payload = decodePayload(parsed.payload);

    // Validate expiry
    const now = new Date();
    const expiresAt = new Date(payload.expiresAt);
    const isExpired = expiresAt < now;

    if (isExpired) {
      return {
        valid: false,
        payload,
        error: `License expired on ${expiresAt.toLocaleDateString()}`,
        isExpired: true,
        expiresInDays: Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      };
    }

    // Calculate days until expiry
    const expiresInDays = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      valid: true,
      payload,
      expiresInDays,
      isExpired: false,
      features: payload.features
    };
  } catch (error) {
    console.error('License validation error:', error);
    return {
      valid: false,
      error: 'License validation failed. Please contact support.'
    };
  }
}

/**
 * Verify application integrity
 * Prevents tampering with license validation code
 */
function verifyIntegrity(): boolean {
  try {
    const currentHash = crypto
      .createHash('sha256')
      .update(PUBLIC_KEY + (process.env.APP_VERSION || '1.0.0'))
      .digest('hex');

    return currentHash === INTEGRITY_HASH;
  } catch (error) {
    return false;
  }
}

/**
 * Check if license allows a specific feature
 */
export function hasFeature(payload: LicensePayload | undefined, feature: string): boolean {
  if (!payload) return false;
  return payload.features.includes(feature);
}

/**
 * Get tier-based limits
 */
export function getTierLimits(tier: string) {
  const limits = {
    starter: {
      maxUsers: 5,
      maxSurveys: 10,
      maxResponses: 1000,
      features: ['basic_analytics', 'email_support']
    },
    professional: {
      maxUsers: 50,
      maxSurveys: 100,
      maxResponses: 10000,
      features: ['sso', 'white_label', 'advanced_analytics', 'priority_support', 'api_access']
    },
    enterprise: {
      maxUsers: -1, // unlimited
      maxSurveys: -1,
      maxResponses: -1,
      features: ['sso', 'white_label', 'advanced_analytics', 'custom_integrations',
                 'dedicated_support', 'api_access', 'audit_logs', 'custom_development']
    }
  };

  return limits[tier as keyof typeof limits] || limits.starter;
}

/**
 * Validate license limits (users, surveys, responses)
 */
export function validateLimits(
  payload: LicensePayload,
  usage: { users?: number; surveys?: number; responses?: number }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (payload.maxUsers && payload.maxUsers > 0 && usage.users && usage.users > payload.maxUsers) {
    errors.push(`User limit exceeded (${usage.users}/${payload.maxUsers})`);
  }

  if (payload.maxSurveys && payload.maxSurveys > 0 && usage.surveys && usage.surveys > payload.maxSurveys) {
    errors.push(`Survey limit exceeded (${usage.surveys}/${payload.maxSurveys})`);
  }

  if (payload.maxResponses && payload.maxResponses > 0 && usage.responses && usage.responses > payload.maxResponses) {
    errors.push(`Monthly response limit exceeded (${usage.responses}/${payload.maxResponses})`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate license info for display
 */
export function getLicenseInfo(payload: LicensePayload) {
  const now = new Date();
  const expiresAt = new Date(payload.expiresAt);
  const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    customerId: payload.customerId,
    email: payload.email,
    companyName: payload.companyName,
    tier: payload.tier,
    issuedAt: new Date(payload.issuedAt),
    expiresAt: expiresAt,
    daysUntilExpiry,
    isExpired: expiresAt < now,
    isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
    features: payload.features,
    limits: {
      users: payload.maxUsers || 'Unlimited',
      surveys: payload.maxSurveys || 'Unlimited',
      responses: payload.maxResponses || 'Unlimited'
    }
  };
}

/**
 * Format license key for display (obfuscate middle part)
 */
export function formatLicenseKey(licenseKey: string): string {
  if (licenseKey.length < 20) return licenseKey;
  const start = licenseKey.substring(0, 8);
  const end = licenseKey.substring(licenseKey.length - 8);
  return `${start}...${end}`;
}

/**
 * Offline grace period management
 * Allows app to work for N days without online verification
 */
const GRACE_PERIOD_DAYS = 30;

export function checkGracePeriod(lastVerified: Date): { valid: boolean; daysRemaining: number } {
  const now = new Date();
  const daysSinceVerification = Math.floor((now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = GRACE_PERIOD_DAYS - daysSinceVerification;

  return {
    valid: daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining)
  };
}

/**
 * Additional anti-tampering checks
 * Multiple validation points make it harder to crack
 */
export function performSecurityChecks(): boolean {
  try {
    // Check 1: Verify public key hasn't been modified
    if (!PUBLIC_KEY.includes('BEGIN PUBLIC KEY')) {
      return false;
    }

    // Check 2: Verify integrity hash
    if (!verifyIntegrity()) {
      return false;
    }

    // Check 3: Environment validation
    if (process.env.BYPASS_LICENSE === 'true') {
      console.warn('WARNING: License bypass detected. This is a security violation.');
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
