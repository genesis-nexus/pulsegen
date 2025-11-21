/**
 * License Settings Page
 * Activate and manage PulseGen license
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LicenseInfo {
  active: boolean;
  license?: {
    customerId: string;
    email: string;
    companyName: string;
    tier: string;
    status: string;
    issuedAt: string;
    expiresAt: string;
    activatedAt?: string;
    daysUntilExpiry: number;
    isExpired: boolean;
    isExpiringSoon: boolean;
    features: string[];
    limits: {
      users: number | string;
      surveys: number | string;
      responses: number | string;
    };
    licenseKey: string;
  };
  usage?: {
    users: number;
    surveys: number;
    responses: number;
    lastUpdate: string;
  };
  recentVerifications?: Array<{
    success: boolean;
    verifiedAt: string;
    error?: string;
  }>;
  error?: string;
  message?: string;
  inGracePeriod?: boolean;
  graceDaysRemaining?: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LicenseSettings() {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load license info on mount
  useEffect(() => {
    loadLicenseInfo();
  }, []);

  const loadLicenseInfo = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/license/info`);
      setLicenseInfo(response.data);
    } catch (err: any) {
      console.error('Failed to load license info:', err);
      setLicenseInfo({ active: false, message: 'Failed to load license information' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActivating(true);

    try {
      await axios.post(`${API_URL}/api/license/activate`, {
        licenseKey: licenseKey.trim()
      });

      setSuccess('License activated successfully! Reloading...');
      setLicenseKey('');

      // Reload license info
      setTimeout(() => {
        loadLicenseInfo();
        window.location.reload(); // Reload page to apply license
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to activate license');
    } finally {
      setActivating(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setSuccess('');
    setVerifying(true);

    try {
      await axios.post(`${API_URL}/api/license/verify`);
      setSuccess('License verified successfully!');
      loadLicenseInfo();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify license');
    } finally {
      setVerifying(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    const colors = {
      starter: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
    };
    return colors[tier.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string, isExpired: boolean, isExpiringSoon: boolean) => {
    if (isExpired) return 'bg-red-100 text-red-800';
    if (isExpiringSoon) return 'bg-yellow-100 text-yellow-800';
    if (status === 'ACTIVE') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFeatureName = (feature: string) => {
    return feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
        <h1 className="text-3xl font-bold text-gray-900">License Management</h1>
        <p className="mt-2 text-gray-600">
          Manage your PulseGen license and view subscription details
        </p>
      </div>

      {/* License Status Card */}
      {licenseInfo?.active && licenseInfo.license ? (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{licenseInfo.license.companyName}</h2>
                <p className="text-indigo-100">{licenseInfo.license.email}</p>
              </div>
              <div className={`px-4 py-2 rounded-full font-semibold ${getTierBadgeColor(licenseInfo.license.tier)}`}>
                {licenseInfo.license.tier.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Banner */}
            {licenseInfo.license.isExpired ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 font-semibold">License Expired</span>
                </div>
                <p className="text-red-700 mt-1">
                  Your license expired on {formatDate(licenseInfo.license.expiresAt)}. Please renew to continue using PulseGen.
                </p>
              </div>
            ) : licenseInfo.license.isExpiringSoon ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-800 font-semibold">License Expiring Soon</span>
                </div>
                <p className="text-yellow-700 mt-1">
                  Your license will expire in {licenseInfo.license.daysUntilExpiry} days on {formatDate(licenseInfo.license.expiresAt)}. Please renew soon.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800 font-semibold">License Active</span>
                </div>
                <p className="text-green-700 mt-1">
                  Your license is active and valid until {formatDate(licenseInfo.license.expiresAt)} ({licenseInfo.license.daysUntilExpiry} days remaining).
                </p>
              </div>
            )}

            {/* License Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer ID</h3>
                <p className="mt-1 text-lg text-gray-900">{licenseInfo.license.customerId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(licenseInfo.license.status, licenseInfo.license.isExpired, licenseInfo.license.isExpiringSoon)}`}>
                  {licenseInfo.license.status}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issued Date</h3>
                <p className="mt-1 text-lg text-gray-900">{formatDate(licenseInfo.license.issuedAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Expiration Date</h3>
                <p className="mt-1 text-lg text-gray-900">{formatDate(licenseInfo.license.expiresAt)}</p>
              </div>
            </div>

            {/* Usage & Limits */}
            {licenseInfo.usage && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage & Limits</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Users</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">
                      {licenseInfo.usage.users} / {licenseInfo.license.limits.users === -1 ? '∞' : licenseInfo.license.limits.users}
                    </div>
                    {licenseInfo.license.limits.users !== -1 && licenseInfo.license.limits.users !== 'Unlimited' && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (licenseInfo.usage.users / Number(licenseInfo.license.limits.users)) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Active Surveys</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">
                      {licenseInfo.usage.surveys} / {licenseInfo.license.limits.surveys === -1 ? '∞' : licenseInfo.license.limits.surveys}
                    </div>
                    {licenseInfo.license.limits.surveys !== -1 && licenseInfo.license.limits.surveys !== 'Unlimited' && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (licenseInfo.usage.surveys / Number(licenseInfo.license.limits.surveys)) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Responses (Month)</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">
                      {licenseInfo.usage.responses} / {licenseInfo.license.limits.responses === -1 ? '∞' : licenseInfo.license.limits.responses}
                    </div>
                    {licenseInfo.license.limits.responses !== -1 && licenseInfo.license.limits.responses !== 'Unlimited' && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-pink-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (licenseInfo.usage.responses / Number(licenseInfo.license.limits.responses)) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Enabled Features</h3>
              <div className="flex flex-wrap gap-2">
                {licenseInfo.license.features.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {formatFeatureName(feature)}
                  </span>
                ))}
              </div>
            </div>

            {/* License Key */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">License Key</h3>
              <div className="mt-1 flex items-center">
                <code className="flex-1 bg-gray-100 px-4 py-2 rounded text-sm text-gray-800 font-mono">
                  {licenseInfo.license.licenseKey}
                </code>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verify License
                  </>
                )}
              </button>
              <button
                onClick={loadLicenseInfo}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* No License - Activation Form */
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Active License</h3>
            <p className="mt-1 text-sm text-gray-500">
              {licenseInfo?.error || licenseInfo?.message || 'Please activate your PulseGen license to continue'}
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700">
                License Key
              </label>
              <textarea
                id="licenseKey"
                rows={4}
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Paste your license key here..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter the license key provided by PulseGen. Contact support@pulsegen.com if you need help.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-green-800">{success}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={activating || !licenseKey.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Activating License...
                </>
              ) : (
                'Activate License'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have a license? {' '}
              <a href="https://pulsegen.com/enterprise" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Contact Sales
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
