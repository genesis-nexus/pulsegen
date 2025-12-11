/**
 * Remote Configuration Management
 *
 * Fetches configuration from a private Git repository
 * This allows centralized control of licensing, features, and settings
 * across all PulseGen instances without code changes
 *
 * Security Model:
 * - GitHub token embedded in application (not in .env)
 * - Config fetched from private repository (customers can't modify)
 * - No local .env overrides allowed for critical settings
 * - Config refresh overwrites any local changes
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

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

// Cache file path
const CACHE_FILE = path.join(__dirname, '../../.config-cache.json');

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
    file: 'config.json'
  },
  // GitLab configuration (alternative)
  gitlab: {
    projectId: '',
    token: '',
    branch: 'main',
    file: 'config.json'
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
 * Fetch configuration from GitHub private repository
 *
 * Security:
 * - Uses embedded credentials (not .env)
 * - Fetches from private repo (customers can't modify)
 * - Simple and reliable
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

    console.log(`🔄 Fetching config from: ${repo}/${file}`);

    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data.encoding === 'base64') {
      // Decode base64 content (GitHub returns files as base64)
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      const config: RemoteConfig = JSON.parse(content);

      // Validate config structure
      if (!config.version || !config.licensing || !config.features) {
        throw new Error('Invalid config structure');
      }

      console.log(`✅ Remote config fetched successfully (version: ${config.version})`);

      // Cache the config locally
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
      console.error('❌ Failed to fetch remote config:', error.message);
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
 * Cache configuration to local file
 */
function cacheConfig(config: RemoteConfig): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log('💾 Config cached locally');
  } catch (error) {
    console.error('⚠️  Failed to cache config:', error);
  }
}

/**
 * Load cached configuration
 */
export function loadCachedConfig(): RemoteConfig | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf-8');
      const config: RemoteConfig = JSON.parse(content);
      console.log(`📁 Loaded cached config (version: ${config.version})`);
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
 * 1. Fetch config from Git
 * 2. Load cached config
 * 3. Use default config
 *
 * IMPORTANT: No .env overrides allowed for security
 */
export async function getRemoteConfig(): Promise<RemoteConfig> {
  // Try to fetch config from remote
  let config = await fetchRemoteConfig();

  // Fall back to cached config
  if (!config) {
    config = loadCachedConfig();
    if (config) {
      console.log('⚠️  Using cached config (remote unavailable)');
    }
  }

  // Fall back to default config (last resort)
  if (!config) {
    console.log('⚠️  Using default config (remote and cache unavailable)');
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
  cacheAge?: number;
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

  return {
    hasRemoteConfig,
    hasCachedConfig,
    cacheAge
  };
}

/**
 * Clear cached config
 */
export function clearConfigCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('🗑️  Config cache cleared');
    } else {
      console.log('ℹ️  No config cache to clear');
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
