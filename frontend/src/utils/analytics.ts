/**
 * Google Analytics Integration
 *
 * Tracks user interactions and events
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

let analyticsInitialized = false;
let analyticsId: string | null = null;

/**
 * Initialize Google Analytics
 */
export async function initializeAnalytics() {
  try {
    // Fetch analytics config from backend
    const response = await fetch('/api/platform/config');
    const config = await response.json();

    if (config.analyticsEnabled && config.googleAnalyticsId) {
      const measurementId = config.googleAnalyticsId;
      analyticsId = measurementId;
      loadGoogleAnalytics(measurementId);
      console.log('✅ Google Analytics initialized:', analyticsId);
    }
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

/**
 * Load Google Analytics script
 */
function loadGoogleAnalytics(measurementId: string) {
  if (analyticsInitialized) return;

  // Create script tag for gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer!.push(arguments);
  };

  // Configure gtag
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false // We'll manually track page views
  });

  analyticsInitialized = true;
  analyticsId = measurementId;
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  if (!analyticsInitialized || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  params?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  }
) {
  if (!analyticsInitialized || !window.gtag) return;

  window.gtag('event', eventName, params);
}

/**
 * Track survey events
 */
export const surveyEvents = {
  created: (surveyId: string, questionCount: number) => {
    trackEvent('survey_created', {
      category: 'Survey',
      label: surveyId,
      value: questionCount
    });
  },

  published: (surveyId: string) => {
    trackEvent('survey_published', {
      category: 'Survey',
      label: surveyId
    });
  },

  completed: (surveyId: string, timeSpent: number) => {
    trackEvent('survey_completed', {
      category: 'Survey',
      label: surveyId,
      value: timeSpent
    });
  },

  shared: (surveyId: string, method: string) => {
    trackEvent('survey_shared', {
      category: 'Survey',
      label: surveyId,
      method
    });
  },

  exported: (surveyId: string, format: string) => {
    trackEvent('survey_exported', {
      category: 'Survey',
      label: surveyId,
      format
    });
  }
};

/**
 * Track AI usage events
 */
export const aiEvents = {
  surveyGenerated: (provider: string, questionCount: number) => {
    trackEvent('ai_survey_generated', {
      category: 'AI',
      provider,
      value: questionCount
    });
  },

  insightGenerated: (surveyId: string, provider: string) => {
    trackEvent('ai_insight_generated', {
      category: 'AI',
      label: surveyId,
      provider
    });
  },

  analysisPerformed: (surveyId: string, analysisType: string) => {
    trackEvent('ai_analysis_performed', {
      category: 'AI',
      label: surveyId,
      analysis_type: analysisType
    });
  }
};

/**
 * Track user events
 */
export const userEvents = {
  signup: (method: string) => {
    trackEvent('sign_up', {
      method
    });
  },

  login: (method: string) => {
    trackEvent('login', {
      method
    });
  },

  licenseActivated: (tier: string) => {
    trackEvent('license_activated', {
      category: 'License',
      tier
    });
  }
};

/**
 * Track errors
 */
export function trackError(error: Error, context?: string) {
  if (!analyticsInitialized || !window.gtag) return;

  window.gtag('event', 'exception', {
    description: error.message,
    fatal: false,
    context
  });
}

/**
 * Set user properties
 */
export function setUserProperties(properties: {
  userId?: string;
  userRole?: string;
  licenseTier?: string;
  [key: string]: any;
}) {
  if (!analyticsInitialized || !window.gtag) return;

  window.gtag('set', 'user_properties', properties);
}

/**
 * Track timing
 */
export function trackTiming(
  name: string,
  value: number,
  category?: string,
  label?: string
) {
  if (!analyticsInitialized || !window.gtag) return;

  window.gtag('event', 'timing_complete', {
    name,
    value,
    event_category: category,
    event_label: label
  });
}

/**
 * Disable analytics (for privacy)
 */
export function disableAnalytics() {
  if (!analyticsId) return;

  // @ts-ignore
  window[`ga-disable-${analyticsId}`] = true;
  console.log('Analytics disabled');
}

/**
 * Enable analytics
 */
export function enableAnalytics() {
  if (!analyticsId) return;

  // @ts-ignore
  window[`ga-disable-${analyticsId}`] = false;
  console.log('Analytics enabled');
}
