/**
 * Remote Configuration Management
 *
 * Fetches configuration from a private Git repository
 * This allows centralized control of licensing, features, and settings
 * across all PulseGen instances without code changes
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
 * Fetch configuration from GitHub private repository
 *
 * Setup:
 * 1. Create private repo: e.g., 'genesis-nexus/pulsegen-config'
 * 2. Create config.json in repo
 * 3. Generate Personal Access Token with 'repo' scope
 * 4. Set environment variables:
 *    - REMOTE_CONFIG_REPO=genesis-nexus/pulsegen-config
 *    - REMOTE_CONFIG_TOKEN=ghp_xxxxx
 *    - REMOTE_CONFIG_FILE=config.json (or instances/production.json)
 */
export async function fetchRemoteConfig(): Promise<RemoteConfig | null> {
  try {
    const repoUrl = process.env.REMOTE_CONFIG_REPO;
    const token = process.env.REMOTE_CONFIG_TOKEN;
    const configFile = process.env.REMOTE_CONFIG_FILE || 'config.json';
    const branch = process.env.REMOTE_CONFIG_BRANCH || 'main';

    if (!repoUrl || !token) {
      console.log('ℹ️  Remote config not configured (REMOTE_CONFIG_REPO and REMOTE_CONFIG_TOKEN required)');
      return null;
    }

    // Fetch from GitHub API
    const url = `https://api.github.com/repos/${repoUrl}/contents/${configFile}?ref=${branch}`;

    console.log(`🔄 Fetching remote config from: ${repoUrl}/${configFile}`);

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
      console.error('❌ Remote config file not found. Check REMOTE_CONFIG_REPO and REMOTE_CONFIG_FILE');
    } else if (error.response?.status === 401) {
      console.error('❌ Remote config authentication failed. Check REMOTE_CONFIG_TOKEN');
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
 */
export async function getRemoteConfig(): Promise<RemoteConfig> {
  // Try to fetch from remote
  let config = await fetchRemoteConfig();

  // Try GitLab if GitHub failed
  if (!config && process.env.REMOTE_CONFIG_GITLAB_PROJECT_ID) {
    config = await fetchRemoteConfigGitLab();
  }

  // Try raw URL if other methods failed
  if (!config && process.env.REMOTE_CONFIG_RAW_URL) {
    config = await fetchRemoteConfigRaw();
  }

  // Fall back to cached config
  if (!config) {
    config = loadCachedConfig();
    if (config) {
      console.log('⚠️  Using cached config (remote unavailable)');
    }
  }

  // Fall back to default config
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
  const hasRemoteConfig = !!(process.env.REMOTE_CONFIG_REPO && process.env.REMOTE_CONFIG_TOKEN);

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
