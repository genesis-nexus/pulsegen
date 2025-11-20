/**
 * Platform Settings Page
 * Configure license enforcement, analytics, and other platform-wide settings
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PlatformConfig {
  licenseEnforced: boolean;
  licenseGracePeriod: boolean;
  analyticsEnabled: boolean;
  googleAnalyticsId?: string;
  telemetryEnabled: boolean;
  instanceName?: string;
  instanceDescription?: string;
  adminEmail?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PlatformSettings() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [licenseEnforced, setLicenseEnforced] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [instanceDescription, setInstanceDescription] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/platform/config`);
      const data = response.data;
      setConfig(data);

      // Update form state
      setLicenseEnforced(data.licenseEnforced);
      setAnalyticsEnabled(data.analyticsEnabled);
      setGoogleAnalyticsId(data.googleAnalyticsId || '');
      setInstanceName(data.instanceName || '');
      setInstanceDescription(data.instanceDescription || '');
      setAdminEmail(data.adminEmail || '');
    } catch (err: any) {
      console.error('Failed to load platform config:', err);
      setError('Failed to load platform configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updates = {
        licenseEnforced,
        analyticsEnabled,
        googleAnalyticsId: googleAnalyticsId || null,
        instanceName: instanceName || null,
        instanceDescription: instanceDescription || null,
        adminEmail: adminEmail || null
      };

      await axios.put(`${API_URL}/api/platform/config`, updates);

      setSuccess('Platform settings saved successfully!');

      // Reload config
      await loadConfig();

      // Show reload notice if license enforcement changed
      if (licenseEnforced !== config?.licenseEnforced) {
        setSuccess('Settings saved! Please restart the server for changes to take full effect.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleLicenseEnforcement = async (enable: boolean) => {
    setError('');
    setSuccess('');

    try {
      const endpoint = enable ? '/api/platform/license/enable' : '/api/platform/license/disable';
      await axios.post(`${API_URL}${endpoint}`);

      setLicenseEnforced(enable);
      setSuccess(
        enable
          ? 'License enforcement enabled. Restart required.'
          : 'License enforcement disabled. App is now free to use.'
      );

      await loadConfig();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update license enforcement');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure platform-wide settings, licensing, and analytics
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-800">{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* License Enforcement Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">License Enforcement</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Require License Key</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {licenseEnforced
                    ? 'Users must activate a valid license key to use PulseGen'
                    : 'Anyone can use PulseGen without a license (free mode)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleLicenseEnforcement(!licenseEnforced)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  licenseEnforced ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    licenseEnforced ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {licenseEnforced && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">License Required</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Users will need a valid license key to access the application. Make sure to generate and distribute licenses to your customers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!licenseEnforced && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Free Mode Active</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Perfect for development, testing, or until payment processing is available. Enable licensing when ready to commercialize.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Google Analytics</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Enable Google Analytics</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Track usage statistics and user behavior
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  analyticsEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    analyticsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {analyticsEnabled && (
              <div>
                <label htmlFor="googleAnalyticsId" className="block text-sm font-medium text-gray-700">
                  Google Analytics Measurement ID
                </label>
                <input
                  type="text"
                  id="googleAnalyticsId"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter your Google Analytics 4 (GA4) Measurement ID. Format: G-XXXXXXXXXX
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Get your ID from: <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">Google Analytics</a> → Admin → Data Streams → Web → Measurement ID
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instance Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instance Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700">
                Instance Name
              </label>
              <input
                type="text"
                id="instanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="My PulseGen Instance"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="instanceDescription" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="instanceDescription"
                rows={3}
                value={instanceDescription}
                onChange={(e) => setInstanceDescription(e.target.value)}
                placeholder="Describe this PulseGen instance..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                Admin Email
              </label>
              <input
                type="email"
                id="adminEmail"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
