'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface ColorSwatchProps {
  name: string;
  hex: string;
}

export function ColorSwatch({ name, hex }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Determine if color is light (for text contrast)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const isLight = brightness > 128;

  return (
    <Card noPadding className="cursor-pointer hover:shadow-card">
      <button type="button" onClick={handleCopy} className="w-full text-left">
        <div 
          className="h-24 flex items-end justify-end p-2"
          style={{ backgroundColor: hex }}
        >
          {copied && (
            <span className={`
              font-alfacad text-xs uppercase
              ${isLight ? 'text-black' : 'text-white'}
            `}>
              Copied!
            </span>
          )}
        </div>
        <div className="bg-neutral-neutral-1 px-3 py-2 border-t border-black">
          <p className="font-alfacad text-xs text-black uppercase">{name}</p>
          <p className="font-space-mono text-sm text-black/70">{hex}</p>
        </div>
      </button>
    </Card>
  );
}
