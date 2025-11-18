/**
 * Remote Configuration Management
 *
 * Fetches encrypted configuration from a private Git repository
 * This allows centralized control of licensing, features, and settings
 * across all PulseGen instances without code changes
 *
 * Security Model:
 * - Configuration is encrypted with AES-256-GCM
 * - Decryption keys are embedded in application (not in .env)
 * - Configuration is signed to prevent tampering
 * - No local overrides possible for critical settings
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { decryptConfig, validateEncryptedConfig, EncryptedConfig } from './configCrypto';
import { getDecryptionKeyWithFallback } from './embeddedKeys';

export interface RemoteConfig {
  version: string;
  lastUpdated: string;
  licensing: {
    enforced: boolean;
    gracePeriodDays: number;
    allowOffline: boolean;
  };
  analytics: {
    enabled: boolean;
    googleAnalyticsId?: string;
  };
  features: {
    aiGeneration: boolean;
    ssoEnabled: boolean;
    whiteLabel: boolean;
    advancedAnalytics: boolean;
    customIntegrations: boolean;
    auditLogs: boolean;
  };
  limits: {
    maxSurveysPerUser: number;
    maxResponsesPerSurvey: number;
    maxFileSize: number;
  };
  maintenance: {
    enabled: boolean;
    message?: string;
    allowedIPs?: string[];
  };
  instanceSpecific?: {
    [instanceId: string]: Partial<RemoteConfig>;
  };
}

// Default configuration (fallback)
const DEFAULT_CONFIG: RemoteConfig = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  licensing: {
    enforced: false,
    gracePeriodDays: 30,
    allowOffline: true
  },
  analytics: {
    enabled: false
  },
  features: {
    aiGeneration: true,
    ssoEnabled: false,
    whiteLabel: true,
    advancedAnalytics: true,
    customIntegrations: true,
    auditLogs: true
  },
  limits: {
    maxSurveysPerUser: 1000,
    maxResponsesPerSurvey: 100000,
    maxFileSize: 10485760 // 10MB
  },
  maintenance: {
    enabled: false
  }
};

// Cache file paths
const CACHE_FILE = path.join(__dirname, '../../.config-cache.json');
const ENCRYPTED_CACHE_FILE = path.join(__dirname, '../../.config-encrypted-cache.json');

/**
 * Embedded Git repository credentials
 * These are hardcoded to prevent customers from modifying .env
 *
 * VENDOR NOTE: Replace these with your actual repository details
 * before building for production
 */
const EMBEDDED_GIT_CONFIG = {
  // GitHub configuration (default)
  github: {
    repo: 'genesis-nexus/pulsegen-config',
    token: 'Z2hwX3h4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4', // Base64 encoded token
    branch: 'main',
    file: 'config.encrypted.json'
  },
  // GitLab configuration (alternative)
  gitlab: {
    projectId: '',
    token: '',
    branch: 'main',
    file: 'config.encrypted.json'
  },
  // Raw URL configuration (alternative)
  raw: {
    url: ''
  }
};

/**
 * Decode embedded token
 * Obfuscated to prevent simple string extraction
 */
function getEmbeddedToken(): string {
  try {
    // Decode from base64
    const encoded = EMBEDDED_GIT_CONFIG.github.token;
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return decoded;
  } catch (error) {
    console.error('❌ Failed to decode embedded token');
    return '';
  }
}

/**
 * Get repository configuration
 * Uses embedded values, ignores .env for security
 */
function getRepoConfig() {
  // IMPORTANT: Always use embedded config, never .env
  // This prevents self-hosted customers from bypassing remote config
  return {
    repo: EMBEDDED_GIT_CONFIG.github.repo,
    token: getEmbeddedToken(),
    branch: EMBEDDED_GIT_CONFIG.github.branch,
    file: EMBEDDED_GIT_CONFIG.github.file
  };
}

/**
 * Fetch encrypted configuration from GitHub private repository
 *
 * Security:
 * - Uses embedded credentials (not .env)
 * - Fetches encrypted config from Git
 * - Decrypts using embedded keys
 * - Verifies signature to prevent tampering
 */
export async function fetchRemoteConfig(): Promise<RemoteConfig | null> {
  try {
    const { repo, token, branch, file } = getRepoConfig();

    if (!repo || !token) {
      console.error('❌ Embedded Git config not properly configured');
      return null;
    }

    // Fetch from GitHub API
    const url = `https://api.github.com/repos/${repo}/contents/${file}?ref=${branch}`;

    console.log(`🔄 Fetching encrypted config from: ${repo}/${file}`);

    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data.encoding === 'base64') {
      // Decode base64 content
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      const encryptedConfig = JSON.parse(content);

      // Validate encrypted config structure
      if (!validateEncryptedConfig(encryptedConfig)) {
        throw new Error('Invalid encrypted config structure');
      }

      console.log('🔓 Decrypting configuration...');

      // Get embedded decryption key
      const decryptionKey = getDecryptionKeyWithFallback();

      // Decrypt config
      const config: RemoteConfig = decryptConfig(encryptedConfig, decryptionKey);

      // Validate decrypted config structure
      if (!config.version || !config.licensing || !config.features) {
        throw new Error('Invalid decrypted config structure');
      }

      console.log(`✅ Remote config fetched and decrypted successfully (version: ${config.version})`);

      // Cache the encrypted config (for fallback)
      cacheEncryptedConfig(encryptedConfig);

      // Cache the decrypted config (for quick access)
      cacheConfig(config);

      return config;
    }

    throw new Error('Unexpected response format from GitHub');
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error('❌ Remote config file not found. Check embedded repository configuration');
    } else if (error.response?.status === 401) {
      console.error('❌ Remote config authentication failed. Check embedded token');
    } else {
      console.error('❌ Failed to fetch/decrypt remote config:', error.message);
    }
    return null;
  }
}

/**
 * Fetch configuration from GitLab private repository (alternative)
 */
export async function fetchRemoteConfigGitLab(): Promise<RemoteConfig | null> {
  try {
    const projectId = process.env.REMOTE_CONFIG_GITLAB_PROJECT_ID;
    const token = process.env.REMOTE_CONFIG_GITLAB_TOKEN;
    const configFile = process.env.REMOTE_CONFIG_FILE || 'config.json';
    const branch = process.env.REMOTE_CONFIG_BRANCH || 'main';

    if (!projectId || !token) {
      return null;
    }

    const url = `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(configFile)}/raw?ref=${branch}`;

    const response = await axios.get(url, {
      headers: {
        'PRIVATE-TOKEN': token
      },
      timeout: 10000
    });

    const config: RemoteConfig = response.data;

    console.log(`✅ Remote config fetched from GitLab (version: ${config.version})`);
    cacheConfig(config);

    return config;
  } catch (error: any) {
    console.error('❌ Failed to fetch remote config from GitLab:', error.message);
    return null;
  }
}

/**
 * Fetch configuration from generic Git hosting (raw file URL)
 */
export async function fetchRemoteConfigRaw(): Promise<RemoteConfig | null> {
  try {
    const rawUrl = process.env.REMOTE_CONFIG_RAW_URL;

    if (!rawUrl) {
      return null;
    }

    const response = await axios.get(rawUrl, {
      timeout: 10000,
      headers: {
        // Add authentication if needed
        ...(process.env.REMOTE_CONFIG_TOKEN && {
          Authorization: `Bearer ${process.env.REMOTE_CONFIG_TOKEN}`
        })
      }
    });

    const config: RemoteConfig = response.data;

    console.log(`✅ Remote config fetched from raw URL (version: ${config.version})`);
    cacheConfig(config);

    return config;
  } catch (error: any) {
    console.error('❌ Failed to fetch remote config from raw URL:', error.message);
    return null;
  }
}

/**
 * Cache encrypted configuration to local file
 */
function cacheEncryptedConfig(encryptedConfig: EncryptedConfig): void {
  try {
    fs.writeFileSync(ENCRYPTED_CACHE_FILE, JSON.stringify(encryptedConfig, null, 2), 'utf-8');
    console.log('💾 Encrypted config cached locally');
  } catch (error) {
    console.error('⚠️  Failed to cache encrypted config:', error);
  }
}

/**
 * Cache decrypted configuration to local file (for quick access)
 */
function cacheConfig(config: RemoteConfig): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log('💾 Decrypted config cached locally');
  } catch (error) {
    console.error('⚠️  Failed to cache config:', error);
  }
}

/**
 * Load cached encrypted configuration and decrypt it
 */
export function loadCachedEncryptedConfig(): RemoteConfig | null {
  try {
    if (fs.existsSync(ENCRYPTED_CACHE_FILE)) {
      const content = fs.readFileSync(ENCRYPTED_CACHE_FILE, 'utf-8');
      const encryptedConfig = JSON.parse(content);

      if (!validateEncryptedConfig(encryptedConfig)) {
        console.error('⚠️  Cached encrypted config has invalid structure');
        return null;
      }

      console.log('🔓 Decrypting cached configuration...');

      // Get embedded decryption key
      const decryptionKey = getDecryptionKeyWithFallback();

      // Decrypt config
      const config: RemoteConfig = decryptConfig(encryptedConfig, decryptionKey);

      console.log(`📁 Loaded and decrypted cached config (version: ${config.version})`);
      return config;
    }
  } catch (error) {
    console.error('⚠️  Failed to load/decrypt cached config:', error);
  }
  return null;
}

/**
 * Load cached decrypted configuration (quick access)
 */
export function loadCachedConfig(): RemoteConfig | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf-8');
      const config: RemoteConfig = JSON.parse(content);
      console.log(`📁 Loaded cached decrypted config (version: ${config.version})`);
      return config;
    }
  } catch (error) {
    console.error('⚠️  Failed to load cached config:', error);
  }
  return null;
}

/**
 * Get configuration (try remote, fall back to cache, then default)
 *
 * Priority:
 * 1. Fetch encrypted config from Git
 * 2. Load encrypted cache and decrypt
 * 3. Load decrypted cache (quick fallback)
 * 4. Use default config
 *
 * IMPORTANT: No .env overrides allowed for security
 */
export async function getRemoteConfig(): Promise<RemoteConfig> {
  // Try to fetch encrypted config from remote
  let config = await fetchRemoteConfig();

  // Fall back to cached encrypted config
  if (!config) {
    config = loadCachedEncryptedConfig();
    if (config) {
      console.log('⚠️  Using cached encrypted config (remote unavailable)');
    }
  }

  // Fall back to cached decrypted config (faster but less secure)
  if (!config) {
    config = loadCachedConfig();
    if (config) {
      console.log('⚠️  Using cached decrypted config (encrypted cache unavailable)');
    }
  }

  // Fall back to default config (last resort)
  if (!config) {
    console.log('⚠️  Using default config (all remote/cache sources unavailable)');
    config = DEFAULT_CONFIG;
  }

  // Apply instance-specific overrides
  if (config.instanceSpecific) {
    const instanceId = process.env.INSTANCE_ID || 'default';
    const instanceConfig = config.instanceSpecific[instanceId];
    if (instanceConfig) {
      console.log(`🔧 Applying instance-specific config for: ${instanceId}`);
      config = mergeConfig(config, instanceConfig);
    }
  }

  return config;
}

/**
 * Merge instance-specific config with base config
 */
function mergeConfig(base: RemoteConfig, override: Partial<RemoteConfig>): RemoteConfig {
  return {
    ...base,
    licensing: { ...base.licensing, ...override.licensing },
    analytics: { ...base.analytics, ...override.analytics },
    features: { ...base.features, ...override.features },
    limits: { ...base.limits, ...override.limits },
    maintenance: { ...base.maintenance, ...override.maintenance }
  };
}

/**
 * Get config metadata (without full fetch)
 */
export function getConfigMetadata(): {
  hasRemoteConfig: boolean;
  hasCachedConfig: boolean;
  hasEncryptedCache: boolean;
  cacheAge?: number;
  encryptedCacheAge?: number;
} {
  // Remote config is always configured (embedded credentials)
  const { repo, token } = getRepoConfig();
  const hasRemoteConfig = !!(repo && token);

  let hasCachedConfig = false;
  let cacheAge: number | undefined;

  if (fs.existsSync(CACHE_FILE)) {
    hasCachedConfig = true;
    const stats = fs.statSync(CACHE_FILE);
    cacheAge = Date.now() - stats.mtimeMs;
  }

  let hasEncryptedCache = false;
  let encryptedCacheAge: number | undefined;

  if (fs.existsSync(ENCRYPTED_CACHE_FILE)) {
    hasEncryptedCache = true;
    const stats = fs.statSync(ENCRYPTED_CACHE_FILE);
    encryptedCacheAge = Date.now() - stats.mtimeMs;
  }

  return {
    hasRemoteConfig,
    hasCachedConfig,
    hasEncryptedCache,
    cacheAge,
    encryptedCacheAge
  };
}

/**
 * Clear cached configs (both encrypted and decrypted)
 */
export function clearConfigCache(): void {
  try {
    let cleared = false;

    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('🗑️  Decrypted config cache cleared');
      cleared = true;
    }

    if (fs.existsSync(ENCRYPTED_CACHE_FILE)) {
      fs.unlinkSync(ENCRYPTED_CACHE_FILE);
      console.log('🗑️  Encrypted config cache cleared');
      cleared = true;
    }

    if (!cleared) {
      console.log('ℹ️  No config caches to clear');
    }
  } catch (error) {
    console.error('⚠️  Failed to clear config cache:', error);
  }
}

/**
 * Validate config against schema
 */
export function validateConfig(config: any): config is RemoteConfig {
  return (
    config &&
    typeof config.version === 'string' &&
    typeof config.licensing === 'object' &&
    typeof config.features === 'object' &&
    typeof config.licensing.enforced === 'boolean'
  );
}
