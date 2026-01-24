'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/icons';

interface LogoCardProps {
  name: string;
  svgPath: string;
  bgColor: 'black' | 'white';
  logoColor: 'black' | 'white';
}

export function LogoCard({ name, svgPath, bgColor, logoColor }: LogoCardProps) {
  const [copied, setCopied] = useState(false);

  const bgClasses = {
    black: 'bg-black',
    white: 'bg-white',
  };

  const handleCopySVG = async () => {
    try {
      const response = await fetch(svgPath);
      const svgText = await response.text();
      await navigator.clipboard.writeText(svgText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail - user can try again
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(svgPath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Silently fail - user can try again
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Logo Preview */}
      <Card noPadding variant="default">
        <div className={`
          relative h-[234px] 
          ${bgClasses[bgColor]} 
          flex items-center justify-center
          p-8
        `}>
          <div className={`${logoColor === 'white' ? 'text-white' : 'text-black'}`}>
            <img 
              src={svgPath} 
              alt={name}
              className="max-w-[80%] max-h-[80%] object-contain"
            />
          </div>

          {/* Copy SVG Button */}
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="md"
              iconOnly={true}
              onClick={handleCopySVG}
              title="Copy SVG"
            >
              {copied ? (
                <Icon name="checkmark-filled" size={16} className="text-green" />
              ) : (
                <Icon name="copy" size={16} className={bgColor === 'black' ? 'text-white' : 'text-black'} />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Download Button */}
      <Button 
        fullWidth 
        iconName="download"
        onClick={handleDownload}
      >
        Download SVG
      </Button>
    </div>
  );
}
