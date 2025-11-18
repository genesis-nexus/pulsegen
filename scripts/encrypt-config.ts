#!/usr/bin/env ts-node

/**
 * Configuration Encryption Tool (VENDOR-SIDE ONLY)
 *
 * This tool encrypts configuration files before committing to Git.
 * Only the vendor should run this tool - customers never see it.
 *
 * Usage:
 *   ts-node scripts/encrypt-config.ts --input config.json --output config.encrypted.json
 *   ts-node scripts/encrypt-config.ts --generate-key
 *
 * Security:
 * - Generates AES-256 encryption key
 * - Encrypts config with AES-256-GCM
 * - Signs encrypted config with hash (upgradable to RSA)
 * - Encryption key must be embedded in application code
 *
 * Workflow:
 * 1. Edit config.json with desired settings
 * 2. Run: ts-node scripts/encrypt-config.ts --input config.json --output config.encrypted.json
 * 3. Commit config.encrypted.json to private Git repo
 * 4. Customer app fetches, decrypts, and applies config
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Command } from 'commander';

interface EncryptedConfig {
  version: string;
  encrypted: string;
  iv: string;
  authTag: string;
  signature: string;
  algorithm: string;
  timestamp: string;
}

const program = new Command();

program
  .name('encrypt-config')
  .description('Encrypt configuration files for secure Git storage (VENDOR-SIDE ONLY)')
  .version('1.0.0');

program
  .command('encrypt')
  .description('Encrypt a configuration file')
  .requiredOption('-i, --input <file>', 'Input configuration file (e.g., config.json)')
  .requiredOption('-o, --output <file>', 'Output encrypted file (e.g., config.encrypted.json)')
  .option('-k, --key <key>', 'Encryption key (hex format, 32 bytes)')
  .option('-kf, --key-file <file>', 'Encryption key file path')
  .action((options) => {
    encryptConfigFile(options.input, options.output, options.key, options.keyFile);
  });

program
  .command('generate-key')
  .description('Generate a new encryption key')
  .option('-o, --output <file>', 'Save key to file')
  .action((options) => {
    generateEncryptionKey(options.output);
  });

program
  .command('decrypt')
  .description('Decrypt a configuration file (for testing)')
  .requiredOption('-i, --input <file>', 'Input encrypted file')
  .requiredOption('-o, --output <file>', 'Output decrypted file')
  .option('-k, --key <key>', 'Decryption key (hex format)')
  .option('-kf, --key-file <file>', 'Decryption key file path')
  .action((options) => {
    decryptConfigFile(options.input, options.output, options.key, options.keyFile);
  });

/**
 * Generate encryption key
 */
function generateEncryptionKey(outputFile?: string): void {
  console.log('🔑 Generating AES-256 encryption key...\n');

  const key = crypto.randomBytes(32); // 256 bits
  const keyHex = key.toString('hex');

  console.log('Generated Key (Hex):');
  console.log('━'.repeat(80));
  console.log(keyHex);
  console.log('━'.repeat(80));
  console.log();
  console.log('⚠️  IMPORTANT: Store this key securely!');
  console.log('   1. This key must be embedded in your application code');
  console.log('   2. Never commit this key to Git');
  console.log('   3. Update backend/src/utils/embeddedKeys.ts with fragments of this key');
  console.log();

  if (outputFile) {
    fs.writeFileSync(outputFile, keyHex, 'utf-8');
    console.log(`✅ Key saved to: ${outputFile}`);
    console.log('⚠️  Remember to delete this file after embedding the key!\n');
  }

  console.log('To embed this key:');
  console.log('1. Split the key into fragments');
  console.log('2. Update KEY_FRAGMENTS in backend/src/utils/embeddedKeys.ts');
  console.log('3. Test decryption with the embedded key');
}

/**
 * Load encryption key
 */
function loadEncryptionKey(keyHex?: string, keyFile?: string): Buffer {
  if (keyHex) {
    return Buffer.from(keyHex, 'hex');
  }

  if (keyFile) {
    const keyContent = fs.readFileSync(keyFile, 'utf-8').trim();
    return Buffer.from(keyContent, 'hex');
  }

  // Try to load from default locations
  const defaultKeyFiles = [
    '.encryption-key',
    path.join(__dirname, '../.encryption-key'),
    path.join(process.env.HOME || '~', '.pulsegen-encryption-key')
  ];

  for (const file of defaultKeyFiles) {
    if (fs.existsSync(file)) {
      console.log(`📁 Loading key from: ${file}`);
      const keyContent = fs.readFileSync(file, 'utf-8').trim();
      return Buffer.from(keyContent, 'hex');
    }
  }

  console.error('❌ No encryption key provided!');
  console.error('   Use --key <hex> or --key-file <file>');
  console.error('   Or save key to .encryption-key in project root');
  process.exit(1);
}

/**
 * Encrypt configuration file
 */
function encryptConfigFile(
  inputFile: string,
  outputFile: string,
  keyHex?: string,
  keyFile?: string
): void {
  try {
    console.log('🔒 Encrypting configuration...\n');

    // Load input config
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      process.exit(1);
    }

    const configContent = fs.readFileSync(inputFile, 'utf-8');
    const config = JSON.parse(configContent);

    console.log('📄 Input file:', inputFile);
    console.log('📊 Config version:', config.version || 'N/A');
    console.log();

    // Load encryption key
    const encryptionKey = loadEncryptionKey(keyHex, keyFile);
    console.log('🔑 Encryption key loaded (32 bytes)');
    console.log();

    // Generate random IV
    const iv = crypto.randomBytes(16);

    // Encrypt using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);

    let encrypted = cipher.update(configContent, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Create encrypted config structure
    const encryptedConfig: EncryptedConfig = {
      version: '1.0.0',
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      signature: '',
      algorithm: 'aes-256-gcm',
      timestamp: new Date().toISOString()
    };

    // Sign the encrypted data
    const dataToSign = `${encrypted}:${encryptedConfig.iv}:${encryptedConfig.authTag}`;
    encryptedConfig.signature = crypto.createHash('sha256').update(dataToSign).digest('base64');

    // Write encrypted config
    fs.writeFileSync(outputFile, JSON.stringify(encryptedConfig, null, 2), 'utf-8');

    console.log('✅ Configuration encrypted successfully!');
    console.log('━'.repeat(80));
    console.log('📄 Output file:', outputFile);
    console.log('🔐 Algorithm:', encryptedConfig.algorithm);
    console.log('📅 Timestamp:', encryptedConfig.timestamp);
    console.log('✍️  Signature:', encryptedConfig.signature.substring(0, 16) + '...');
    console.log('━'.repeat(80));
    console.log();
    console.log('Next steps:');
    console.log('1. Commit', outputFile, 'to your private Git repository');
    console.log('2. Ensure encryption key is embedded in application code');
    console.log('3. Test by running the application and checking config loads');
  } catch (error: any) {
    console.error('❌ Encryption failed:', error.message);
    process.exit(1);
  }
}

/**
 * Decrypt configuration file (for testing)
 */
function decryptConfigFile(
  inputFile: string,
  outputFile: string,
  keyHex?: string,
  keyFile?: string
): void {
  try {
    console.log('🔓 Decrypting configuration...\n');

    // Load encrypted config
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      process.exit(1);
    }

    const encryptedContent = fs.readFileSync(inputFile, 'utf-8');
    const encryptedConfig: EncryptedConfig = JSON.parse(encryptedContent);

    console.log('📄 Input file:', inputFile);
    console.log('🔐 Algorithm:', encryptedConfig.algorithm);
    console.log('📅 Timestamp:', encryptedConfig.timestamp);
    console.log();

    // Verify signature
    const dataToVerify = `${encryptedConfig.encrypted}:${encryptedConfig.iv}:${encryptedConfig.authTag}`;
    const expectedSignature = crypto.createHash('sha256').update(dataToVerify).digest('base64');

    if (encryptedConfig.signature !== expectedSignature) {
      console.error('❌ Signature verification failed!');
      console.error('   Configuration may have been tampered with');
      process.exit(1);
    }

    console.log('✅ Signature verified');
    console.log();

    // Load decryption key
    const decryptionKey = loadEncryptionKey(keyHex, keyFile);
    console.log('🔑 Decryption key loaded (32 bytes)');
    console.log();

    // Decrypt using AES-256-GCM
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      decryptionKey,
      Buffer.from(encryptedConfig.iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(encryptedConfig.authTag, 'base64'));

    let decrypted = decipher.update(encryptedConfig.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse and validate
    const config = JSON.parse(decrypted);

    // Write decrypted config
    fs.writeFileSync(outputFile, JSON.stringify(config, null, 2), 'utf-8');

    console.log('✅ Configuration decrypted successfully!');
    console.log('━'.repeat(80));
    console.log('📄 Output file:', outputFile);
    console.log('📊 Config version:', config.version || 'N/A');
    console.log('━'.repeat(80));
  } catch (error: any) {
    console.error('❌ Decryption failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
program.parse();
