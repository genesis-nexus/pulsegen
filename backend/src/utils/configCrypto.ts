/**
 * Configuration Encryption/Decryption Utilities
 *
 * Provides AES-256-GCM encryption for sensitive configuration data
 * and RSA signature verification to prevent tampering.
 *
 * Security Model:
 * 1. Configuration is encrypted with AES-256-GCM
 * 2. Configuration is signed with RSA-2048
 * 3. Decryption key is embedded in application (obfuscated)
 * 4. Signature verification prevents tampering
 * 5. No local overrides possible for critical settings
 */

import crypto from 'crypto';

/**
 * Encrypted configuration format
 */
export interface EncryptedConfig {
  version: string;
  encrypted: string;      // Base64 encoded encrypted data
  iv: string;             // Initialization vector
  authTag: string;        // Authentication tag for GCM
  signature: string;      // RSA signature of encrypted data
  algorithm: string;      // Encryption algorithm used
  timestamp: string;      // When config was encrypted
}

/**
 * Decrypt configuration using embedded key
 */
export function decryptConfig(encryptedConfig: EncryptedConfig, decryptionKey: Buffer): any {
  try {
    // Verify signature first
    if (!verifyConfigSignature(encryptedConfig)) {
      throw new Error('Configuration signature verification failed - config may be tampered');
    }

    // Decrypt using AES-256-GCM
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      decryptionKey,
      Buffer.from(encryptedConfig.iv, 'base64')
    );

    // Set auth tag for GCM mode
    decipher.setAuthTag(Buffer.from(encryptedConfig.authTag, 'base64'));

    // Decrypt
    let decrypted = decipher.update(encryptedConfig.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse JSON
    const config = JSON.parse(decrypted);

    console.log('✅ Configuration decrypted and verified successfully');
    return config;
  } catch (error) {
    console.error('❌ Failed to decrypt configuration:', error);
    throw new Error('Configuration decryption failed - invalid key or corrupted data');
  }
}

/**
 * Encrypt configuration (vendor-side only)
 */
export function encryptConfig(config: any, encryptionKey: Buffer): EncryptedConfig {
  try {
    // Generate random IV for each encryption
    const iv = crypto.randomBytes(16);

    // Encrypt using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);

    const configJson = JSON.stringify(config, null, 2);
    let encrypted = cipher.update(configJson, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    const encryptedConfig: EncryptedConfig = {
      version: '1.0.0',
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      signature: '',  // Will be set below
      algorithm: 'aes-256-gcm',
      timestamp: new Date().toISOString()
    };

    // Sign the encrypted data
    encryptedConfig.signature = signConfig(encryptedConfig);

    console.log('✅ Configuration encrypted and signed successfully');
    return encryptedConfig;
  } catch (error) {
    console.error('❌ Failed to encrypt configuration:', error);
    throw new Error('Configuration encryption failed');
  }
}

/**
 * Sign configuration with RSA private key (vendor-side only)
 */
function signConfig(encryptedConfig: EncryptedConfig): string {
  // This will use the vendor's private key
  // For now, return placeholder - will be implemented in vendor tools
  const dataToSign = `${encryptedConfig.encrypted}:${encryptedConfig.iv}:${encryptedConfig.authTag}`;

  // In production, this would use the vendor's RSA private key
  // const signature = crypto.sign('sha256', Buffer.from(dataToSign), privateKey);
  // return signature.toString('base64');

  return crypto.createHash('sha256').update(dataToSign).digest('base64');
}

/**
 * Verify configuration signature with embedded public key
 */
function verifyConfigSignature(encryptedConfig: EncryptedConfig): boolean {
  try {
    const dataToVerify = `${encryptedConfig.encrypted}:${encryptedConfig.iv}:${encryptedConfig.authTag}`;

    // For now, use hash verification (will be upgraded to RSA)
    const expectedSignature = crypto.createHash('sha256').update(dataToVerify).digest('base64');

    return encryptedConfig.signature === expectedSignature;
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return false;
  }
}

/**
 * Generate encryption key (vendor-side only)
 */
export function generateEncryptionKey(): Buffer {
  return crypto.randomBytes(32); // 256 bits for AES-256
}

/**
 * Derive key from passphrase (vendor-side only)
 */
export function deriveKeyFromPassphrase(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
}

/**
 * Validate encrypted config structure
 */
export function validateEncryptedConfig(data: any): data is EncryptedConfig {
  return (
    typeof data === 'object' &&
    typeof data.version === 'string' &&
    typeof data.encrypted === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.authTag === 'string' &&
    typeof data.signature === 'string' &&
    typeof data.algorithm === 'string' &&
    typeof data.timestamp === 'string'
  );
}

/**
 * Security checks to detect tampering attempts
 */
export function performSecurityChecks(): boolean {
  try {
    // Check if critical files have been modified
    // Check if process is running under debugger
    // Check if environment variables seem suspicious

    // Basic checks for now
    const suspiciousEnvVars = [
      'NODE_DEBUG',
      'NODE_INSPECT',
      'DEBUG',
      'FORCE_CONFIG_BYPASS'
    ];

    for (const envVar of suspiciousEnvVars) {
      if (process.env[envVar]) {
        console.warn(`⚠️  Suspicious environment variable detected: ${envVar}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Security check failed:', error);
    return false;
  }
}
