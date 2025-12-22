import { useState } from 'react';
import { Check, Copy, Facebook, Linkedin, Mail, MessageCircle, Twitter } from 'lucide-react';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  platforms?: ('twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'email' | 'copy')[];
  layout?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
}

const shareUrls = {
  twitter: (url: string, title: string) =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  facebook: (url: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  linkedin: (url: string, title: string, description?: string) =>
    `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description || '')}`,
  whatsapp: (url: string, title: string) =>
    `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  email: (url: string, title: string, description?: string) =>
    `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description || title}\n\n${url}`)}`,
};

const platformConfig = {
  twitter: {
    icon: Twitter,
    label: 'Twitter',
    bgColor: 'bg-[#1DA1F2] hover:bg-[#1a8cd8]',
    textColor: 'text-white',
  },
  facebook: {
    icon: Facebook,
    label: 'Facebook',
    bgColor: 'bg-[#4267B2] hover:bg-[#365899]',
    textColor: 'text-white',
  },
  linkedin: {
    icon: Linkedin,
    label: 'LinkedIn',
    bgColor: 'bg-[#0077B5] hover:bg-[#006097]',
    textColor: 'text-white',
  },
  whatsapp: {
    icon: MessageCircle,
    label: 'WhatsApp',
    bgColor: 'bg-[#25D366] hover:bg-[#1da851]',
    textColor: 'text-white',
  },
  email: {
    icon: Mail,
    label: 'Email',
    bgColor: 'bg-gray-600 hover:bg-gray-700',
    textColor: 'text-white',
  },
  copy: {
    icon: Copy,
    label: 'Copy Link',
    bgColor: 'bg-gray-200 hover:bg-gray-300',
    textColor: 'text-gray-700',
  },
};

export default function SocialShareButtons({
  url,
  title,
  description,
  platforms = ['twitter', 'facebook', 'linkedin', 'whatsapp', 'email', 'copy'],
  layout = 'horizontal',
  showLabels = false,
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = (platform: keyof typeof shareUrls | 'copy') => {
    if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }

    const shareUrl = shareUrls[platform](url, title, description);
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const containerClass = {
    horizontal: 'flex flex-wrap gap-2 justify-center',
    vertical: 'flex flex-col gap-2',
    compact: 'flex gap-1 justify-center',
  };

  const buttonClass = {
    horizontal: showLabels
      ? 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors'
      : 'p-3 rounded-lg transition-colors',
    vertical: 'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors w-full',
    compact: 'p-2 rounded-full transition-colors',
  };

  const iconSize = layout === 'compact' ? 18 : 20;

  return (
    <div className={containerClass[layout]}>
      {platforms.map((platform) => {
        const config = platformConfig[platform];
        const Icon = platform === 'copy' && copied ? Check : config.icon;

        return (
          <button
            key={platform}
            type="button"
            onClick={() => handleShare(platform)}
            className={`${buttonClass[layout]} ${config.bgColor} ${config.textColor}`}
            title={config.label}
            aria-label={config.label}
          >
            <Icon size={iconSize} />
            {(showLabels || layout === 'vertical') && (
              <span>{platform === 'copy' && copied ? 'Copied!' : config.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Minimal share button for inline use
export function ShareButton({
  url,
  title,
  description,
}: {
  url: string;
  title: string;
  description?: string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
      >
        <Copy size={16} />
        <span>Share</span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[200px]">
            <SocialShareButtons
              url={url}
              title={title}
              description={description}
              layout="vertical"
              showLabels
            />
          </div>
        </>
      )}
    </div>
  );
}
