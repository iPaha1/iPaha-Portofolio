import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Twitter, Linkedin, Facebook } from 'lucide-react';

// Share button component
type ShareButtonProps = {
  platform: 'twitter' | 'linkedin' | 'facebook';
  url: string;
  title: string;
  className?: string;
};

const ShareButton: React.FC<ShareButtonProps> = ({ platform, url, title, className = "" }) => {
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  };

  const icons = {
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook
  };

  const Icon = icons[platform];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${className} hover:scale-105 transition-transform`}
            onClick={() => window.open(shareUrls[platform], '_blank', 'width=600,height=400')}
          >
            <Icon className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share on {platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ShareButton;