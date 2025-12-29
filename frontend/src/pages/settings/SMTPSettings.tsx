import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Eye, EyeOff, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface SMTPConfig {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export default function SMTPSettings() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [formData, setFormData] = useState({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    replyTo: '',
    isActive: true,
    isDefault: true,
  });

  const { data: configs } = useQuery({
    queryKey: ['smtp-configs'],
    queryFn: async () => {
      const response = await api.get('/settings/smtp');
      return response.data.data as SMTPConfig[];
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post('/settings/smtp', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-configs'] });
      toast.success('SMTP configuration added successfully');
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add SMTP configuration');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/smtp/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-configs'] });
      toast.success('SMTP configuration deleted');
    },
    onError: () => {
      toast.error('Failed to delete SMTP configuration');
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => api.post(`/settings/smtp/${id}/test`),
    onSuccess: () => {
      toast.success('SMTP connection successful!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'SMTP connection failed');
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: (data: { to: string; subject: string; text: string }) =>
      api.post('/settings/smtp/test-email', data),
    onSuccess: () => {
      toast.success('Test email sent successfully!');
      setTestEmail('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    },
  });

  const resetForm = () => {
    setFormData({
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
      replyTo: '',
      isActive: true,
      isDefault: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.host || !formData.username || !formData.password || !formData.fromEmail) {
      toast.error('Host, username, password, and from email are required');
      return;
    }
    addMutation.mutate(formData);
  };

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }
    sendTestEmailMutation.mutate({
      to: testEmail,
      subject: 'Test Email from PulseGen',
      text: 'This is a test email to verify your SMTP configuration is working correctly.',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">SMTP Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure SMTP servers for sending emails from PulseGen.
        </p>
      </div>

      {/* Test Email */}
      {configs && configs.length > 0 && (
        <div className="card mb-8 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Send Test Email</h3>
          <form onSubmit={handleSendTestEmail} className="flex gap-2">
            <input
              type="email"
              className="input flex-1"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address"
            />
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={sendTestEmailMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendTestEmailMutation.isPending ? 'Sending...' : 'Send Test'}
            </button>
          </form>
        </div>
      )}

      {/* Current Configurations */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">SMTP Configurations</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add SMTP Server
          </button>
        </div>

        {configs && configs.length > 0 ? (
          <div className="space-y-4">
            {configs.map((config) => (
              <div
                key={config.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-center justify-between bg-white dark:bg-slate-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{config.host}:{config.port}</h3>
                    {config.isDefault && (
                      <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 rounded-full">
                        Default
                      </span>
                    )}
                    {config.isActive && (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full">
                        Active
                      </span>
                    )}
                    {config.secure && (
                      <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-full">
                        SSL/TLS
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <p>Username: {config.username}</p>
                    <p>From: {config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail}</p>
                    {config.replyTo && <p>Reply-To: {config.replyTo}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => testConnectionMutation.mutate(config.id)}
                    className="btn btn-secondary text-sm inline-flex items-center"
                    disabled={testConnectionMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Test Connection
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this SMTP configuration?')) {
                        deleteMutation.mutate(config.id);
                      }
                    }}
                    className="btn btn-danger text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <p>No SMTP servers configured yet.</p>
            <p className="text-sm mt-2">Add an SMTP server to enable email functionality.</p>
          </div>
        )}
      </div>

      {/* Add SMTP Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add SMTP Server</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">SMTP Host</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>

                <div>
                  <label className="label">Port</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="inline-flex items-center text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.secure}
                    onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                    className="mr-2 rounded text-primary-600 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <span className="text-sm">Use SSL/TLS</span>
                </label>
              </div>

              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  className="input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">From Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    placeholder="noreply@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="label">From Name (Optional)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    placeholder="PulseGen"
                  />
                </div>
              </div>

              <div>
                <label className="label">Reply-To (Optional)</label>
                <input
                  type="email"
                  className="input"
                  value={formData.replyTo}
                  onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
                  placeholder="support@example.com"
                />
              </div>

              <div>
                <label className="inline-flex items-center text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2 rounded text-primary-600 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <span className="text-sm">Set as active SMTP server</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 btn btn-primary" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add SMTP Server'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="card bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Common SMTP Settings</h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <div>
            <strong>Gmail:</strong> smtp.gmail.com:587 (Use App Password, not regular password)
          </div>
          <div>
            <strong>SendGrid:</strong> smtp.sendgrid.net:587
          </div>
          <div>
            <strong>Mailgun:</strong> smtp.mailgun.org:587
          </div>
          <div>
            <strong>AWS SES:</strong> email-smtp.[region].amazonaws.com:587
          </div>
        </div>
      </div>
    </div>
  );
}
