import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  trackPageView,
  trackEvent,
  surveyEvents,
  aiEvents,
  userEvents,
  trackError,
  setUserProperties,
  trackTiming,
  disableAnalytics,
  enableAnalytics,
} from './analytics';

describe('Analytics', () => {
  let mockGtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup mock gtag
    mockGtag = vi.fn();
    window.gtag = mockGtag as typeof window.gtag;
    window.dataLayer = [];

    // Simulate initialized state by setting up window.gtag
    // In real code, analyticsInitialized would be true after initializeAnalytics()
    // For testing, we can test the guard clauses
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete window.gtag;
    delete window.dataLayer;
  });

  describe('trackPageView', () => {
    it('does not call gtag when analytics not initialized', () => {
      // Remove gtag to simulate uninitialized state
      delete window.gtag;

      trackPageView('/home', 'Home Page');

      // Should not throw and should not call anything
      expect(mockGtag).not.toHaveBeenCalled();
    });
  });

  describe('trackEvent', () => {
    it('does not call gtag when analytics not initialized', () => {
      delete window.gtag;

      trackEvent('test_event', { category: 'Test' });

      expect(mockGtag).not.toHaveBeenCalled();
    });
  });

  describe('surveyEvents', () => {
    beforeEach(() => {
      delete window.gtag;
    });

    it('has created event handler', () => {
      expect(surveyEvents.created).toBeDefined();
      expect(typeof surveyEvents.created).toBe('function');
    });

    it('has published event handler', () => {
      expect(surveyEvents.published).toBeDefined();
      expect(typeof surveyEvents.published).toBe('function');
    });

    it('has completed event handler', () => {
      expect(surveyEvents.completed).toBeDefined();
      expect(typeof surveyEvents.completed).toBe('function');
    });

    it('has shared event handler', () => {
      expect(surveyEvents.shared).toBeDefined();
      expect(typeof surveyEvents.shared).toBe('function');
    });

    it('has exported event handler', () => {
      expect(surveyEvents.exported).toBeDefined();
      expect(typeof surveyEvents.exported).toBe('function');
    });

    it('calls created with correct parameters', () => {
      // Should not throw when called
      surveyEvents.created('survey-123', 10);
    });

    it('calls completed with correct parameters', () => {
      surveyEvents.completed('survey-123', 300);
    });

    it('calls shared with correct parameters', () => {
      surveyEvents.shared('survey-123', 'email');
    });

    it('calls exported with correct parameters', () => {
      surveyEvents.exported('survey-123', 'csv');
    });
  });

  describe('aiEvents', () => {
    beforeEach(() => {
      delete window.gtag;
    });

    it('has surveyGenerated event handler', () => {
      expect(aiEvents.surveyGenerated).toBeDefined();
      expect(typeof aiEvents.surveyGenerated).toBe('function');
    });

    it('has insightGenerated event handler', () => {
      expect(aiEvents.insightGenerated).toBeDefined();
      expect(typeof aiEvents.insightGenerated).toBe('function');
    });

    it('has analysisPerformed event handler', () => {
      expect(aiEvents.analysisPerformed).toBeDefined();
      expect(typeof aiEvents.analysisPerformed).toBe('function');
    });

    it('calls surveyGenerated without throwing', () => {
      aiEvents.surveyGenerated('openai', 15);
    });

    it('calls insightGenerated without throwing', () => {
      aiEvents.insightGenerated('survey-123', 'anthropic');
    });

    it('calls analysisPerformed without throwing', () => {
      aiEvents.analysisPerformed('survey-123', 'sentiment');
    });
  });

  describe('userEvents', () => {
    beforeEach(() => {
      delete window.gtag;
    });

    it('has signup event handler', () => {
      expect(userEvents.signup).toBeDefined();
      expect(typeof userEvents.signup).toBe('function');
    });

    it('has login event handler', () => {
      expect(userEvents.login).toBeDefined();
      expect(typeof userEvents.login).toBe('function');
    });

    it('has licenseActivated event handler', () => {
      expect(userEvents.licenseActivated).toBeDefined();
      expect(typeof userEvents.licenseActivated).toBe('function');
    });

    it('calls signup without throwing', () => {
      userEvents.signup('email');
    });

    it('calls login without throwing', () => {
      userEvents.login('google');
    });

    it('calls licenseActivated without throwing', () => {
      userEvents.licenseActivated('professional');
    });
  });

  describe('trackError', () => {
    it('does not throw when analytics not initialized', () => {
      delete window.gtag;

      const error = new Error('Test error');
      trackError(error, 'test context');

      // Should not throw
    });

    it('handles errors with context', () => {
      delete window.gtag;

      const error = new Error('Something went wrong');
      expect(() => trackError(error, 'UserAction')).not.toThrow();
    });
  });

  describe('setUserProperties', () => {
    it('does not throw when analytics not initialized', () => {
      delete window.gtag;

      setUserProperties({
        userId: 'user-123',
        userRole: 'admin',
        licenseTier: 'pro',
      });

      // Should not throw
    });
  });

  describe('trackTiming', () => {
    it('does not throw when analytics not initialized', () => {
      delete window.gtag;

      trackTiming('page_load', 1500, 'Performance', 'home');

      // Should not throw
    });

    it('handles timing without optional parameters', () => {
      delete window.gtag;

      trackTiming('api_call', 250);

      // Should not throw
    });
  });

  describe('disableAnalytics', () => {
    it('does not throw when called', () => {
      expect(() => disableAnalytics()).not.toThrow();
    });
  });

  describe('enableAnalytics', () => {
    it('does not throw when called', () => {
      expect(() => enableAnalytics()).not.toThrow();
    });
  });

  describe('graceful degradation', () => {
    it('all functions work without gtag being defined', () => {
      delete window.gtag;
      delete window.dataLayer;

      // None of these should throw
      expect(() => trackPageView('/test')).not.toThrow();
      expect(() => trackEvent('test')).not.toThrow();
      expect(() => surveyEvents.created('s1', 5)).not.toThrow();
      expect(() => aiEvents.surveyGenerated('openai', 10)).not.toThrow();
      expect(() => userEvents.login('email')).not.toThrow();
      expect(() => trackError(new Error('test'))).not.toThrow();
      expect(() => setUserProperties({ userId: '1' })).not.toThrow();
      expect(() => trackTiming('test', 100)).not.toThrow();
      expect(() => disableAnalytics()).not.toThrow();
      expect(() => enableAnalytics()).not.toThrow();
    });
  });
});
