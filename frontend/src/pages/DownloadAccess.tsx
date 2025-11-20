import React, { useState } from 'react';
import axios from 'axios';

const DownloadAccess: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    githubUsername: '',
    fullName: '',
    youtubeSubscribed: false,
    instagramFollowed: false,
    referralSource: ''
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const response = await axios.post('/api/download-access/request', formData);

      setStatus('success');
      setMessage(response.data.message);

      // Reset form
      setFormData({
        email: '',
        githubUsername: '',
        fullName: '',
        youtubeSubscribed: false,
        instagramFollowed: false,
        referralSource: ''
      });
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to submit request. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Download PulseGen
          </h1>
          <p className="text-lg text-gray-600">
            Get free access to the most advanced self-hosted survey platform
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Social Media CTA */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white">
            <h2 className="text-2xl font-bold mb-4">Join Our Community!</h2>
            <p className="mb-6">
              To download PulseGen, please subscribe to our YouTube channel and follow us on Instagram.
              This helps us build an amazing community around PulseGen!
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* YouTube */}
              <a
                href="https://youtube.com/@techhubweekly?si=J3EtsD3HLyzNeep7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Subscribe on YouTube
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/devhub.news/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Follow on Instagram
              </a>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name (Optional)
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            {/* GitHub Username */}
            <div>
              <label htmlFor="githubUsername" className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Username <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-lg">
                  @
                </span>
                <input
                  type="text"
                  id="githubUsername"
                  name="githubUsername"
                  value={formData.githubUsername}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-github-username"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                We'll invite you to our private GitHub repository
              </p>
            </div>

            {/* Verification Checkboxes */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Please confirm you've completed the following:
              </h3>

              {/* YouTube Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="youtubeSubscribed"
                  checked={formData.youtubeSubscribed}
                  onChange={handleChange}
                  required
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I have subscribed to <strong>Tech Hub Weekly</strong> on YouTube
                </span>
              </label>

              {/* Instagram Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="instagramFollowed"
                  checked={formData.instagramFollowed}
                  onChange={handleChange}
                  required
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I am following <strong>@devhub.news</strong> on Instagram
                </span>
              </label>
            </div>

            {/* Referral Source */}
            <div>
              <label htmlFor="referralSource" className="block text-sm font-medium text-gray-700 mb-2">
                How did you hear about PulseGen? (Optional)
              </label>
              <input
                type="text"
                id="referralSource"
                name="referralSource"
                value={formData.referralSource}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="YouTube, Twitter, Friend, etc."
              />
            </div>

            {/* Status Messages */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  status === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <p className="font-medium">{message}</p>
                {status === 'success' && (
                  <p className="mt-2 text-sm">
                    We'll review your request and send you download instructions via email within 24-48 hours.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Submitting...' : 'Request Download Access'}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              🎉 PulseGen is currently <strong>100% free</strong> while we build our community!
              <br />
              By subscribing and following, you're helping us grow and improve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadAccess;
