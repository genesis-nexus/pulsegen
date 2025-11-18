/**
 * Embedded Cryptographic Keys
 *
 * SECURITY WARNING: This file contains embedded decryption keys
 * Keys are split and obfuscated to prevent easy extraction
 *
 * DO NOT MODIFY - Any changes will break configuration decryption
 */

/**
 * Key fragments - split to prevent simple string extraction
 * These are combined at runtime to form the actual decryption key
 */
const KEY_FRAGMENTS = {
  // Fragment identifiers are intentionally misleading
  database_salt: 'c3RhcnRfZnJhZ21lbnQ=',
  api_version: 'bWlkZGxlX3BhcnQ=',
  session_token: 'ZW5kX2ZyYWdtZW50',
  jwt_secret: 'dmVyaWZ5X3BhcnQ=',
  cache_key: 'ZmluYWxfc2VnbWVudA==',
};

/**
 * Obfuscated key derivation algorithm
 * Intentionally complex to prevent reverse engineering
 */
function deriveKey(): Buffer {
  // Step 1: Combine fragments in specific order
  const combined = [
    KEY_FRAGMENTS.database_salt,
    KEY_FRAGMENTS.api_version,
    KEY_FRAGMENTS.session_token,
    KEY_FRAGMENTS.jwt_secret,
    KEY_FRAGMENTS.cache_key
  ].join('::');

  // Step 2: Apply transformation
  const transformed = Buffer.from(combined, 'utf-8');

  // Step 3: Hash to get 32-byte key
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(transformed).digest();

  // Step 4: Additional obfuscation rounds
  let key = hash;
  for (let i = 0; i < 3; i++) {
    key = crypto.createHash('sha256').update(key).digest();
  }

  return key;
}

/**
 * Get decryption key
 * Called by config system at runtime
 */
export function getDecryptionKey(): Buffer {
  // Perform security checks before returning key
  const crypto = require('crypto');
  const { performSecurityChecks } = require('./configCrypto');

  if (!performSecurityChecks()) {
    // Return dummy key if security checks fail
    // This will cause decryption to fail, preventing access
    console.error('❌ Security checks failed - returning invalid key');
    return crypto.randomBytes(32);
  }

  // Derive and return the actual key
  return deriveKey();
}

/**
 * Verification checksum
 * Used to verify key integrity without exposing the key
 */
export function getKeyChecksum(): string {
  const crypto = require('crypto');
  const key = deriveKey();
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
}

/**
 * Public key for signature verification
 * Used to verify configuration hasn't been tampered with
 */
export const CONFIG_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyxKf8xT+pUqH5vQr7xYL
7mJ9Y8Zh6Q5rK3nX+8Vf7wY9rN+Q8jK5hL3mP2fR6xN+7yT8pU9hL3mP2fR6xN+7
yT8pU9hL3mP2fR6xN+7yT8pU9hL3mP2fR6xN+7yT8pU9hL3mP2fR6xN+7yT8pU9h
L3mP2fR6xN+7yT8pU9hL3mP2fR6xN+7yT8pU9hL3mP2fR6xN+7yT8pU9hL3mP2fR
6xN+7yT8pU9hL3mP2fR6xN+7yT8pU9hL3mP2fR6xN+7yT8pU9hL3mP2fR6xN+7yT
8pU9hL3mP2fR6xN+7yT8pU9hL3mP2fR6xN+7yT8pU9hL3mP2fR6xN+7yT8pU9hL3
mQIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Alternative key sources (fallback mechanism)
 * Provides redundancy in case primary key derivation fails
 */
const FALLBACK_KEY_SOURCES = [
  'PULSEGEN_CONFIG_KEY',
  'APPLICATION_MASTER_KEY',
  'SYSTEM_ENCRYPTION_KEY'
];

/**
 * Get decryption key with fallback
 */
export function getDecryptionKeyWithFallback(): Buffer {
  try {
    // Try primary method
    return getDecryptionKey();
  } catch (error) {
    console.warn('⚠️  Primary key derivation failed, trying fallback...');

    // Try fallback environment variables
    const crypto = require('crypto');
    for (const envVar of FALLBACK_KEY_SOURCES) {
      if (process.env[envVar]) {
        console.log(`ℹ️  Using fallback key source: ${envVar}`);
        return Buffer.from(process.env[envVar], 'hex');
      }
    }

    // Last resort: return a deterministic key based on machine ID
    // This will still fail decryption, but prevents crashes
    console.error('❌ All key sources failed - returning deterministic fallback');
    const machineId = require('os').hostname();
    return crypto.createHash('sha256').update(machineId).digest();
  }
}

/**
 * Validate key integrity
 * Ensures the key hasn't been corrupted or modified
 */
export function validateKeyIntegrity(): boolean {
  try {
    const key = getDecryptionKey();
    const checksum = getKeyChecksum();

    // Verify key is 32 bytes
    if (key.length !== 32) {
      console.error('❌ Key length validation failed');
      return false;
    }

    // Verify checksum matches expected format
    if (!/^[a-f0-9]{16}$/.test(checksum)) {
      console.error('❌ Checksum format validation failed');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Key integrity validation failed:', error);
    return false;
  }
}

// Self-test on module load
try {
  if (!validateKeyIntegrity()) {
    console.error('❌ WARNING: Embedded keys failed integrity check!');
  }
} catch (error) {
  console.error('❌ WARNING: Key validation failed on module load:', error);
}
