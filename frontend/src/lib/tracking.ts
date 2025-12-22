/**
 * URL Tracking Parameter Utilities
 *
 * Parses URL parameters for source tracking and auto-detects
 * traffic sources from referrer data.
 */

export interface TrackingParams {
  source?: string;      // pg_source or utm_source
  channel?: string;     // pg_channel or utm_channel - specific platform
  campaign?: string;    // pg_campaign or utm_campaign
  medium?: string;      // pg_medium or utm_medium
  referrer?: string;    // document.referrer
}

/**
 * Social media and referrer pattern matching
 */
const REFERRER_PATTERNS: Record<string, { source: string; channel: string }> = {
  // Social Media
  'twitter.com': { source: 'social', channel: 'twitter' },
  't.co': { source: 'social', channel: 'twitter' },
  'x.com': { source: 'social', channel: 'twitter' },
  'facebook.com': { source: 'social', channel: 'facebook' },
  'fb.com': { source: 'social', channel: 'facebook' },
  'm.facebook.com': { source: 'social', channel: 'facebook' },
  'l.facebook.com': { source: 'social', channel: 'facebook' },
  'linkedin.com': { source: 'social', channel: 'linkedin' },
  'lnkd.in': { source: 'social', channel: 'linkedin' },
  'instagram.com': { source: 'social', channel: 'instagram' },
  'l.instagram.com': { source: 'social', channel: 'instagram' },
  'tiktok.com': { source: 'social', channel: 'tiktok' },
  'reddit.com': { source: 'social', channel: 'reddit' },
  'pinterest.com': { source: 'social', channel: 'pinterest' },
  'youtube.com': { source: 'social', channel: 'youtube' },
  'youtu.be': { source: 'social', channel: 'youtube' },
  'wa.me': { source: 'social', channel: 'whatsapp' },
  'whatsapp.com': { source: 'social', channel: 'whatsapp' },
  'web.whatsapp.com': { source: 'social', channel: 'whatsapp' },
  'telegram.org': { source: 'social', channel: 'telegram' },
  't.me': { source: 'social', channel: 'telegram' },

  // Email Clients
  'mail.google.com': { source: 'email', channel: 'gmail' },
  'outlook.live.com': { source: 'email', channel: 'outlook' },
  'outlook.office.com': { source: 'email', channel: 'outlook' },
  'mail.yahoo.com': { source: 'email', channel: 'yahoo' },
  'mail.aol.com': { source: 'email', channel: 'aol' },

  // Search Engines
  'google.com': { source: 'search', channel: 'google' },
  'bing.com': { source: 'search', channel: 'bing' },
  'yahoo.com': { source: 'search', channel: 'yahoo' },
  'duckduckgo.com': { source: 'search', channel: 'duckduckgo' },
};

/**
 * Detect source and channel from referrer URL
 */
function detectSourceFromReferrer(referrer: string): { source: string; channel?: string } {
  if (!referrer) {
    return { source: 'direct' };
  }

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    // Check against known patterns
    for (const [pattern, info] of Object.entries(REFERRER_PATTERNS)) {
      if (hostname.includes(pattern)) {
        return info;
      }
    }

    // Unknown referrer - mark as referral
    return { source: 'referral', channel: hostname };
  } catch {
    return { source: 'referral' };
  }
}

/**
 * Parse tracking parameters from current URL
 * Supports both PulseGen-specific (pg_*) and UTM parameters
 */
export function parseTrackingParams(): TrackingParams {
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || '';

  // Check for explicit tracking parameters first
  const source = params.get('pg_source') || params.get('utm_source');
  const channel = params.get('pg_channel') || params.get('utm_channel');
  const campaign = params.get('pg_campaign') || params.get('utm_campaign');
  const medium = params.get('pg_medium') || params.get('utm_medium');

  // If explicit source is provided, use it
  if (source) {
    return {
      source,
      channel: channel || undefined,
      campaign: campaign || undefined,
      medium: medium || undefined,
      referrer: referrer || undefined,
    };
  }

  // Auto-detect from referrer
  const detected = detectSourceFromReferrer(referrer);

  return {
    source: detected.source,
    channel: detected.channel || channel || undefined,
    campaign: campaign || undefined,
    medium: medium || undefined,
    referrer: referrer || undefined,
  };
}

/**
 * Generate a tracked share URL with PulseGen tracking parameters
 */
export function generateTrackedShareUrl(
  baseUrl: string,
  options: {
    source?: string;
    channel: string;
    campaign?: string;
    medium?: string;
  }
): string {
  const url = new URL(baseUrl);

  url.searchParams.set('pg_source', options.source || 'social');
  url.searchParams.set('pg_channel', options.channel);

  if (options.campaign) {
    url.searchParams.set('pg_campaign', options.campaign);
  }

  if (options.medium) {
    url.searchParams.set('pg_medium', options.medium);
  }

  return url.toString();
}

/**
 * Get tracking data for response submission
 */
export function getTrackingData(): {
  source?: string;
  sourceChannel?: string;
  sourceCampaign?: string;
  sourceMedium?: string;
  referrer?: string;
} {
  const params = parseTrackingParams();

  return {
    source: params.source,
    sourceChannel: params.channel,
    sourceCampaign: params.campaign,
    sourceMedium: params.medium,
    referrer: params.referrer,
  };
}
