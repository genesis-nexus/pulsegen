import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, RefreshCw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface PlatformBranding {
  id: string;
  platformName: string;
  logoUrl?: string;
  faviconUrl?: string;
  loginBgUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customCss?: string;
  customJs?: string;
  footerText?: string;
  supportEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;
  showPoweredBy: boolean;
}

export default function BrandingSettings() {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const { data: branding, isLoading } = useQuery({
    queryKey: ['platform-branding'],
    queryFn: async () => {
      const response = await api.get('/settings/branding');
      return response.data.data as PlatformBranding;
    },
  });

  const [formData, setFormData] = useState<Partial<PlatformBranding>>({});

  // Update form data when branding loads
  useState(() => {
    if (branding && Object.keys(formData).length === 0) {
      setFormData(branding);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PlatformBranding>) =>
      api.put('/settings/branding', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-branding'] });
      toast.success('Branding updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update branding');
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ type, file }: { type: string; file: File }) => {
      const formData = new FormData();
      formData.append(type, file);
      return api.post(`/settings/branding/upload/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-branding'] });
      toast.success('Image uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (type: string) =>
      api.delete(`/settings/branding/image/${type}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-branding'] });
      toast.success('Image deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete image');
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post('/settings/branding/reset'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-branding'] });
      toast.success('Branding reset to defaults');
    },
    onError: () => {
      toast.error('Failed to reset branding');
    },
  });

  const handleFileChange = (type: 'logo' | 'favicon' | 'background', file: File | null) => {
    if (file) {
      uploadImageMutation.mutate({ type, file });
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading || !branding) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const currentData = { ...branding, ...formData };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Platform Branding</h1>
            <p className="text-gray-600">
              Customize the look and feel of your PulseGen instance.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => resetMutation.mutate()}
              className="btn btn-secondary inline-flex items-center"
              disabled={resetMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary inline-flex items-center"
              disabled={updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4">Images</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo */}
          <div>
            <label className="label">Platform Logo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {currentData.logoUrl ? (
                <div className="space-y-2">
                  <img
                    src={currentData.logoUrl}
                    alt="Logo"
                    className="max-h-32 mx-auto"
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => deleteImageMutation.mutate('logo')}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="btn btn-secondary inline-flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-2">Max size: 5MB</p>
            </div>
          </div>

          {/* Favicon */}
          <div>
            <label className="label">Favicon</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {currentData.faviconUrl ? (
                <div className="space-y-2">
                  <img
                    src={currentData.faviconUrl}
                    alt="Favicon"
                    className="w-8 h-8 mx-auto"
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => faviconInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => deleteImageMutation.mutate('favicon')}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => faviconInputRef.current?.click()}
                  className="btn btn-secondary inline-flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Favicon
                </button>
              )}
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange('favicon', e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-2">32x32px recommended</p>
            </div>
          </div>

          {/* Login Background */}
          <div>
            <label className="label">Login Background</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {currentData.loginBgUrl ? (
                <div className="space-y-2">
                  <img
                    src={currentData.loginBgUrl}
                    alt="Background"
                    className="max-h-32 mx-auto object-cover rounded"
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => bgInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => deleteImageMutation.mutate('background')}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => bgInputRef.current?.click()}
                  className="btn btn-secondary inline-flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Background
                </button>
              )}
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange('background', e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-2">1920x1080px recommended</p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4">Basic Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="label">Platform Name</label>
            <input
              type="text"
              className="input"
              value={currentData.platformName}
              onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Support Email</label>
              <input
                type="email"
                className="input"
                value={currentData.supportEmail || ''}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                placeholder="support@example.com"
              />
            </div>

            <div>
              <label className="label">Footer Text</label>
              <input
                type="text"
                className="input"
                value={currentData.footerText || ''}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                placeholder="© 2025 Your Company"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Terms of Service URL</label>
              <input
                type="url"
                className="input"
                value={currentData.termsUrl || ''}
                onChange={(e) => setFormData({ ...formData, termsUrl: e.target.value })}
                placeholder="https://example.com/terms"
              />
            </div>

            <div>
              <label className="label">Privacy Policy URL</label>
              <input
                type="url"
                className="input"
                value={currentData.privacyUrl || ''}
                onChange={(e) => setFormData({ ...formData, privacyUrl: e.target.value })}
                placeholder="https://example.com/privacy"
              />
            </div>
          </div>

          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={currentData.showPoweredBy}
                onChange={(e) => setFormData({ ...formData, showPoweredBy: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Show "Powered by PulseGen" in footer</span>
            </label>
          </div>
        </div>
      </div>

      {/* Color Theme */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4">Color Theme</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="label">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-12 h-10 rounded border border-gray-300"
                value={currentData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              />
              <input
                type="text"
                className="input flex-1"
                value={currentData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div>
            <label className="label">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-12 h-10 rounded border border-gray-300"
                value={currentData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              />
              <input
                type="text"
                className="input flex-1"
                value={currentData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                placeholder="#6B7280"
              />
            </div>
          </div>

          <div>
            <label className="label">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-12 h-10 rounded border border-gray-300"
                value={currentData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
              />
              <input
                type="text"
                className="input flex-1"
                value={currentData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                placeholder="#10B981"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Customization */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Advanced Customization</h2>

        <div className="space-y-4">
          <div>
            <label className="label">Custom CSS</label>
            <textarea
              className="input font-mono text-sm"
              rows={6}
              value={currentData.customCss || ''}
              onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
              placeholder="/* Add your custom CSS here */"
            />
            <p className="text-xs text-gray-500 mt-1">
              Advanced users can add custom CSS to override default styles
            </p>
          </div>

          <div>
            <label className="label">Custom JavaScript</label>
            <textarea
              className="input font-mono text-sm"
              rows={6}
              value={currentData.customJs || ''}
              onChange={(e) => setFormData({ ...formData, customJs: e.target.value })}
              placeholder="// Add your custom JavaScript here"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add custom JavaScript for analytics or other functionality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
