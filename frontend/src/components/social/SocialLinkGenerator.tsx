import { useState, useEffect } from 'react';
import { Copy, Check, QrCode, ExternalLink, Twitter, Facebook, Linkedin, MessageCircle, Mail, Link2 } from 'lucide-react';
import { generateTrackedShareUrl } from '../../lib/tracking';
import toast from 'react-hot-toast';

interface SocialLinkGeneratorProps {
  surveyUrl: string;
  surveyTitle: string;
  surveyDescription?: string;
  campaign?: string;
  onClose?: () => void;
}

interface GeneratedLink {
  platform: string;
  url: string;
  trackingUrl: string;
  icon: React.ElementType;
  color: string;
}

const PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-black' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-[#0A66C2]' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]' },
  { id: 'email', name: 'Email', icon: Mail, color: 'bg-gray-600' },
  { id: 'generic', name: 'General Link', icon: Link2, color: 'bg-primary-600' },
];

export default function SocialLinkGenerator({
  surveyUrl,
  surveyTitle,
  surveyDescription,
  campaign,
  onClose,
}: SocialLinkGeneratorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [customCampaign, setCustomCampaign] = useState(campaign || '');
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);

  // Generate links for all platforms
  useEffect(() => {
    const links = PLATFORMS.map((platform) => {
      const trackingUrl = generateTrackedShareUrl(surveyUrl, {
        source: 'social',
        channel: platform.id,
        campaign: customCampaign || undefined,
      });

      let shareUrl = trackingUrl;
      const encodedUrl = encodeURIComponent(trackingUrl);
      const encodedTitle = encodeURIComponent(surveyTitle);
      const encodedDesc = encodeURIComponent(surveyDescription || surveyTitle);

      switch (platform.id) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${surveyTitle}\n${trackingUrl}`)}`;
          break;
        case 'email':
          shareUrl = `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${surveyDescription || surveyTitle}\n\n${trackingUrl}`)}`;
          break;
        default:
          shareUrl = trackingUrl;
      }

      return {
        platform: platform.id,
        url: shareUrl,
        trackingUrl,
        icon: platform.icon,
        color: platform.color,
      };
    });

    setGeneratedLinks(links);
  }, [surveyUrl, surveyTitle, surveyDescription, customCampaign]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const generateQRCodeUrl = (url: string) => {
    // Using Google Charts API for QR codes (free, no API key needed)
    return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(url)}&choe=UTF-8`;
  };

  const downloadQRCode = async (url: string, platform: string) => {
    const qrUrl = generateQRCodeUrl(url);
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `survey-qr-${platform}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    toast.success('QR code downloaded!');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Share Survey</h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate trackable links for different platforms
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name (optional)
          </label>
          <input
            type="text"
            value={customCampaign}
            onChange={(e) => setCustomCampaign(e.target.value)}
            placeholder="e.g., summer-2024, product-launch"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Helps track responses from this specific campaign
          </p>
        </div>

        {/* Platform Links */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Platform-Specific Links
          </label>

          {generatedLinks.map((link) => {
            const platformInfo = PLATFORMS.find(p => p.id === link.platform)!;
            const Icon = link.icon;
            const isExpanded = selectedPlatform === link.platform;

            return (
              <div
                key={link.platform}
                className={`border rounded-lg transition-all ${
                  isExpanded ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => setSelectedPlatform(isExpanded ? null : link.platform)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${platformInfo.color} text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-900">{platformInfo.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(link.trackingUrl, `${link.platform}-url`);
                      }}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="Copy tracking link"
                    >
                      {copiedId === `${link.platform}-url` ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQRCode(showQRCode === link.platform ? null : link.platform);
                      }}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="Show QR code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    {link.platform !== 'generic' && (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                        title="Open share dialog"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-1">Tracking URL:</p>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-xs bg-gray-100 px-2 py-1.5 rounded break-all text-gray-700">
                          {link.trackingUrl}
                        </code>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code */}
                {showQRCode === link.platform && (
                  <div className="px-3 pb-3">
                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                      <img
                        src={generateQRCodeUrl(link.trackingUrl)}
                        alt={`QR Code for ${platformInfo.name}`}
                        className="mx-auto w-48 h-48"
                      />
                      <button
                        onClick={() => downloadQRCode(link.trackingUrl, link.platform)}
                        className="mt-3 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                      >
                        Download QR Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Copy All */}
        <div className="pt-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Quick Share Link</span>
              <button
                onClick={() => copyToClipboard(
                  generateTrackedShareUrl(surveyUrl, { source: 'social', channel: 'direct' }),
                  'quick-link'
                )}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {copiedId === 'quick-link' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code className="block text-xs bg-white px-3 py-2 rounded border border-gray-200 text-gray-700 break-all">
              {generateTrackedShareUrl(surveyUrl, { source: 'social', channel: 'direct' })}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for embedding in other components
export function SocialLinkGeneratorCompact({
  surveyUrl,
}: {
  surveyUrl: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = async (channel: string) => {
    const url = generateTrackedShareUrl(surveyUrl, {
      source: 'social',
      channel,
    });
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(channel);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const platforms = [
    { id: 'twitter', Icon: Twitter, color: 'hover:bg-black' },
    { id: 'facebook', Icon: Facebook, color: 'hover:bg-[#1877F2]' },
    { id: 'linkedin', Icon: Linkedin, color: 'hover:bg-[#0A66C2]' },
    { id: 'whatsapp', Icon: MessageCircle, color: 'hover:bg-[#25D366]' },
  ];

  return (
    <div className="flex items-center space-x-2">
      {platforms.map(({ id, Icon, color }) => (
        <button
          key={id}
          onClick={() => copyLink(id)}
          className={`p-2 rounded-lg border border-gray-200 text-gray-600 ${color} hover:text-white transition-all`}
          title={`Copy ${id} link`}
        >
          {copiedId === id ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </button>
      ))}
    </div>
  );
}
