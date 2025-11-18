#!/usr/bin/env ts-node
/**
 * PulseGen License Key Generator
 *
 * This script generates license keys for customers.
 * KEEP THIS SCRIPT AND PRIVATE KEY SECURE - DO NOT DISTRIBUTE
 *
 * Usage:
 *   npm run generate-license -- --email customer@example.com --tier professional --duration 365
 *   ts-node scripts/generate-license.ts --email customer@example.com --tier professional --duration 365
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { program } from 'commander';

interface LicensePayload {
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
}

// Tier configurations
const TIER_CONFIG = {
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
    features: [
      'sso',
      'white_label',
      'advanced_analytics',
      'custom_integrations',
      'dedicated_support',
      'api_access',
      'audit_logs',
      'custom_development'
    ]
  }
};

/**
 * Generate unique customer ID
 */
function generateCustomerId(): string {
  const random = crypto.randomBytes(8).toString('hex');
  return `cust_${random}`;
}

/**
 * Load private key from file
 */
function loadPrivateKey(): string {
  const keyPath = path.join(__dirname, '../keys/private.pem');

  if (!fs.existsSync(keyPath)) {
    console.error('\n❌ Private key not found!');
    console.error('\nPlease generate RSA key pair first:');
    console.error('  mkdir -p keys');
    console.error('  openssl genrsa -out keys/private.pem 2048');
    console.error('  openssl rsa -in keys/private.pem -pubout -out keys/public.pem');
    console.error('\nThen update the PUBLIC_KEY in backend/src/utils/license.ts\n');
    process.exit(1);
  }

  return fs.readFileSync(keyPath, 'utf-8');
}

/**
 * Sign data with private key
 */
function signData(data: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

/**
 * Generate license key
 */
function generateLicenseKey(options: {
  email: string;
  companyName: string;
  tier: 'starter' | 'professional' | 'enterprise';
  duration: number;
  customFeatures?: string[];
}): string {
  const tierConfig = TIER_CONFIG[options.tier];
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + options.duration);

  // Build payload
  const payload: LicensePayload = {
    customerId: generateCustomerId(),
    email: options.email,
    companyName: options.companyName,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    tier: options.tier,
    maxUsers: tierConfig.maxUsers,
    maxSurveys: tierConfig.maxSurveys,
    maxResponses: tierConfig.maxResponses,
    features: options.customFeatures || tierConfig.features
  };

  // Encode payload
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');

  // Sign payload
  const privateKey = loadPrivateKey();
  const signature = signData(encodedPayload, privateKey);

  // Combine: PAYLOAD.SIGNATURE
  const licenseKey = `${encodedPayload}.${signature}`;

  return licenseKey;
}

/**
 * Pretty print license info
 */
function displayLicenseInfo(licenseKey: string, options: any) {
  const tierConfig = TIER_CONFIG[options.tier as keyof typeof TIER_CONFIG];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + options.duration);

  console.log('\n' + '='.repeat(80));
  console.log('                     PULSEGEN LICENSE KEY GENERATED');
  console.log('='.repeat(80));
  console.log('\n📧 Customer Email:    ', options.email);
  console.log('🏢 Company Name:      ', options.companyName);
  console.log('🎫 Tier:              ', options.tier.toUpperCase());
  console.log('📅 Issued:            ', new Date().toLocaleDateString());
  console.log('⏰ Expires:           ', expiresAt.toLocaleDateString());
  console.log('⌛ Duration:          ', `${options.duration} days`);
  console.log('\n📊 Limits:');
  console.log('   Users:             ', tierConfig.maxUsers === -1 ? 'Unlimited' : tierConfig.maxUsers);
  console.log('   Surveys:           ', tierConfig.maxSurveys === -1 ? 'Unlimited' : tierConfig.maxSurveys);
  console.log('   Responses/month:   ', tierConfig.maxResponses === -1 ? 'Unlimited' : tierConfig.maxResponses);
  console.log('\n✨ Features:');
  tierConfig.features.forEach(feature => {
    console.log('   ✓', feature.replace(/_/g, ' ').toUpperCase());
  });
  console.log('\n' + '='.repeat(80));
  console.log('LICENSE KEY:');
  console.log('='.repeat(80));
  console.log(licenseKey);
  console.log('='.repeat(80));
  console.log('\n📋 Send this license key to the customer with setup instructions.');
  console.log('⚠️  IMPORTANT: This key is cryptographically signed and cannot be regenerated.\n');

  // Save to file
  const timestamp = Date.now();
  const filename = `license_${options.email.replace('@', '_')}_${timestamp}.txt`;
  const filepath = path.join(__dirname, '../licenses', filename);

  // Create licenses directory if it doesn't exist
  const licensesDir = path.join(__dirname, '../licenses');
  if (!fs.existsSync(licensesDir)) {
    fs.mkdirSync(licensesDir, { recursive: true });
  }

  // Write license to file
  const licenseRecord = {
    email: options.email,
    companyName: options.companyName,
    tier: options.tier,
    issuedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    duration: options.duration,
    licenseKey: licenseKey,
    limits: {
      users: tierConfig.maxUsers,
      surveys: tierConfig.maxSurveys,
      responses: tierConfig.maxResponses
    },
    features: tierConfig.features
  };

  fs.writeFileSync(filepath, JSON.stringify(licenseRecord, null, 2));
  console.log(`💾 License saved to: ${filepath}\n`);
}

/**
 * Main CLI program
 */
program
  .name('generate-license')
  .description('Generate PulseGen license keys for customers')
  .requiredOption('-e, --email <email>', 'Customer email address')
  .requiredOption('-c, --company <name>', 'Company name')
  .requiredOption('-t, --tier <tier>', 'License tier (starter, professional, enterprise)')
  .option('-d, --duration <days>', 'License duration in days', '365')
  .option('-f, --features <features...>', 'Custom features (overrides tier defaults)')
  .action((options) => {
    // Validate tier
    if (!['starter', 'professional', 'enterprise'].includes(options.tier)) {
      console.error('❌ Invalid tier. Must be: starter, professional, or enterprise');
      process.exit(1);
    }

    // Validate email
    if (!options.email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    // Generate license
    try {
      const licenseKey = generateLicenseKey({
        email: options.email,
        companyName: options.company,
        tier: options.tier,
        duration: parseInt(options.duration),
        customFeatures: options.features
      });

      displayLicenseInfo(licenseKey, options);
    } catch (error) {
      console.error('❌ Error generating license:', error);
      process.exit(1);
    }
  });

program.parse();
