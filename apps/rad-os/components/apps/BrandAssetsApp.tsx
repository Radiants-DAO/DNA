'use client';

import React, { useState, useRef } from 'react';
import { Tabs } from '@rdna/radiants/components/core';
import { AppWindowContent } from '@/components/Rad_os';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppProps } from '@/lib/constants';
import {
  RadMarkIcon,
  WordmarkLogo,
  RadSunLogo,
  FontAaIcon,
  RobotIcon,
  ColorSwatchIcon,
  ICON_SIZE,
} from '@/components/icons';

// ============================================================================
// Types
// ============================================================================

type LogoVariant = 'wordmark' | 'mark' | 'radsun';
type LogoColor = 'cream' | 'black' | 'yellow';

interface LogoConfig {
  id: string;
  variant: LogoVariant;
  bgColor: 'black' | 'cream';
  logoColor: LogoColor;
}

interface SrefCode {
  id: string;
  code: string;
  images: string[];
}

// ============================================================================
// Data
// ============================================================================

const LOGOS: LogoConfig[] = [
  // Row 1: Wordmarks
  { id: 'wordmark-cream', variant: 'wordmark', bgColor: 'black', logoColor: 'cream' },
  { id: 'wordmark-black', variant: 'wordmark', bgColor: 'cream', logoColor: 'black' },
  { id: 'wordmark-yellow', variant: 'wordmark', bgColor: 'black', logoColor: 'yellow' },
  // Row 2: Marks
  { id: 'mark-cream', variant: 'mark', bgColor: 'black', logoColor: 'cream' },
  { id: 'mark-black', variant: 'mark', bgColor: 'cream', logoColor: 'black' },
  { id: 'mark-yellow', variant: 'mark', bgColor: 'black', logoColor: 'yellow' },
  // Row 3: RadSun - all using yellow variant for the sun imagery
  { id: 'radsun-cream', variant: 'radsun', bgColor: 'black', logoColor: 'cream' },
  { id: 'radsun-black', variant: 'radsun', bgColor: 'cream', logoColor: 'black' },
  { id: 'radsun-yellow', variant: 'radsun', bgColor: 'black', logoColor: 'yellow' },
];

// Midjourney SREF codes from Webflow reference
const SREF_CODES: SrefCode[] = [
  {
    id: 'sref-1',
    code: '--sref 2686106303 1335137003 --p 28kclbj',
    images: [
      '/assets/images/Cowboy-Profile-from-Midjourney_1.avif',
      '/assets/images/Beautiful-Woman-from-Midjourney_1.avif',
      '/assets/images/Kemos-4be-Cowboy-v7_1.avif',
      '/assets/images/Kemosabe-A-Man-v7_1.avif',
    ],
  },
  {
    id: 'sref-2',
    code: '--sref 1335137003 --p 28kclbj',
    images: [
      '/assets/images/Cowboy-Profile-from-Midjourney-1_1.avif',
      '/assets/images/Modern-Cowboy-with-Bandana.png',
      '/assets/images/Yellow-Bandana-Product-Detail.png',
      '/assets/images/Yellow-Bandana-in-Ring.png',
    ],
  },
];

// Core brand colors from Webflow reference
const BRAND_COLORS = [
  { name: 'Sun Yellow', hex: '#FCE184' },
  { name: 'Cream', hex: '#FEF8E2' },
  { name: 'Black', hex: '#0F0E0C' },
];

// Extended palette
const EXTENDED_COLORS = [
  { name: 'Sky Blue', hex: '#95BAD2' },
  { name: 'Sunset Fuzz', hex: '#FCC383' },
  { name: 'Sun Red', hex: '#FF6B63' },
  { name: 'Green', hex: '#CEF5CA' },
];

const FONTS = [
  {
    name: 'Joystix',
    usage: 'h1, h2, h3, & captions',
    description: 'Joystix is a open source font available from multiple sources. It is best used for large text, memes, visual designs & art, and captions. It should be used for most large headings with Mondwest as a subheading, paragraph, or description.',
    className: 'font-joystix',
    downloadUrl: 'https://www.dropbox.com/scl/fi/h278kmyuvitljv92g0206/Bonkathon_Wordmark-PNG.zip?rlkey=nojnr6mipbpqwedomqgfarhoy&dl=1',
  },
  {
    name: 'Mondwest',
    usage: 'paragraphs, graphics, & descriptions',
    description: "Mondwest is Radiants' readable font. It is used for long-form content. It was created by Panagram Panagram Type foundry, where you can purchase it. However, they do allow you to try the font in limited weights (the weight we use most often) for non-commercial use. :)",
    className: 'font-mondwest',
    downloadUrl: 'https://www.dropbox.com/scl/fi/h278kmyuvitljv92g0206/Bonkathon_Wordmark-PNG.zip?rlkey=nojnr6mipbpqwedomqgfarhoy&dl=1',
  },
];

// ============================================================================
// Sub-components
// ============================================================================

function LogoCard({ logo }: { logo: LogoConfig }) {
  const [copied, setCopied] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  const bgClass = logo.bgColor === 'black' ? 'bg-black' : 'bg-warm-cloud';

  const handleCopySVG = async () => {
    try {
      let svgContent = '';

      if (logo.variant === 'radsun') {
        // For RadSunLogo, try to fetch the SVG file directly first
        const getLogoFilename = (color: string) => {
          if (color === 'cream') return 'radsun-cream';
          if (color === 'black') return 'radsun-black';
          if (color === 'yellow') return 'radsun-yellow';
          return 'radsun-black';
        };
        const logoPath = `/assets/logos/${getLogoFilename(logo.logoColor)}.svg`;
        try {
          const response = await fetch(logoPath);
          if (response.ok) {
            svgContent = await response.text();
          } else {
            throw new Error('Failed to fetch SVG file');
          }
        } catch (fetchError) {
          // Fallback: extract from DOM if fetch fails
          const container = logoRef.current;
          const svgElement = container?.querySelector('svg');
          if (svgElement) {
            const clonedSvg = svgElement.cloneNode(true) as SVGElement;
            clonedSvg.removeAttribute('data-reactroot');
            clonedSvg.removeAttribute('data-cursor-element-id');
            if (!clonedSvg.hasAttribute('xmlns')) {
              clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }
            svgContent = clonedSvg.outerHTML;
          } else {
            throw fetchError;
          }
        }
      } else {
        // For WordmarkLogo and RadMarkIcon, extract from DOM
        const container = logoRef.current;
        if (!container) return;

        const svgElement = container.querySelector('svg');
        if (!svgElement) return;

        // Clone the SVG to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true) as SVGElement;
        
        // Remove React-specific attributes and clean up
        clonedSvg.removeAttribute('data-reactroot');
        clonedSvg.removeAttribute('data-cursor-element-id');
        
        // Ensure proper attributes for standalone SVG
        if (!clonedSvg.hasAttribute('xmlns')) {
          clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        
        // Get the outerHTML
        svgContent = clonedSvg.outerHTML;
      }

      if (!svgContent) {
        throw new Error('No SVG content found');
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SVG:', err);
    }
  };

  const handleDownload = (format: 'png' | 'svg') => {
    // In a real implementation, this would trigger a download
    const link = document.createElement('a');
    link.href = `/assets/logos/${format.toUpperCase()}/${logo.id}.${format}`;
    link.download = `${logo.id}.${format}`;
    link.click();
  };

  const renderLogo = () => {
    if (logo.variant === 'wordmark') {
      return <WordmarkLogo className="w-[80%] h-auto" color={logo.logoColor} />;
    } else if (logo.variant === 'radsun') {
      return <RadSunLogo className="w-[40%] h-auto" color={logo.logoColor} />;
    } else {
      return (
        <RadMarkIcon
          size={88}
          className={
            logo.logoColor === 'cream' ? 'text-warm-cloud' :
            logo.logoColor === 'yellow' ? 'text-sun-yellow' : 'text-black'
          }
        />
      );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Logo Preview Card */}
      <div className="border border-primary rounded-t-sm overflow-hidden">
        <div 
          ref={logoRef}
          className={`relative h-[180px] ${bgClass} flex items-center justify-center p-6`}
        >
          {renderLogo()}

          {/* Copy SVG Button - Top Right */}
          <Button
            variant="primary"
            size="md"
            iconOnly
            iconName={copied ? "copied-to-clipboard" : "copy-to-clipboard"}
            onClick={handleCopySVG}
            title="Copy SVG"
            className="absolute top-2 right-2"
          />
        </div>
      </div>

      {/* Download Buttons Row */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="md"
          iconName="download"
          onClick={() => handleDownload('png')}
          fullWidth
        >
          PNG
        </Button>
        <Button
          variant="primary"
          size="md"
          iconName="download"
          onClick={() => handleDownload('svg')}
          fullWidth
        >
          SVG
        </Button>
      </div>
    </div>
  );
}

function ColorSwatch({ color, large = false }: { color: typeof BRAND_COLORS[0]; large?: boolean }) {
  const [copied, setCopied] = useState(false);
  const isLight = ['#FEF8E2', '#FCE184', '#CEF5CA', '#FCC383'].includes(color.hex);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex flex-col border border-primary rounded-sm overflow-hidden hover:shadow-card transition-shadow ${large ? 'flex-1' : ''}`}
    >
      {/* Color swatch */}
      <div
        className={`relative flex flex-col items-center justify-center ${large ? 'h-32' : 'h-20'}`}
        style={{ backgroundColor: color.hex }}
      >
        <span className={`font-joystix text-sm ${isLight ? 'text-primary' : 'text-white'}`}>
          {copied ? 'Copied!' : color.hex.replace('#', '')}
        </span>
        <span className={`font-mondwest text-xs ${isLight ? 'text-primary/60' : 'text-white/60'}`}>
          tap to copy
        </span>
      </div>
    </button>
  );
}

function FontCard({ font }: { font: typeof FONTS[0] }) {
  return (
    <div className="border border-primary rounded-sm overflow-hidden">
      {/* Font header with preview */}
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className={`${font.className} text-2xl text-primary`}>{font.name}</h3>
          <p className="font-joystix text-xs text-sun-yellow uppercase">{font.usage}</p>
        </div>
        <p className="font-mondwest text-sm text-primary/80 leading-relaxed">
          {font.description}
        </p>
      </div>

      {/* Download button */}
      <a
        href={font.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button
          variant="primary"
          size="md"
          iconName="download"
          fullWidth
          className="rounded-none border-t border-primary"
        >
          Get {font.name}
        </Button>
      </a>
    </div>
  );
}

function SrefCard({ sref }: { sref: SrefCode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sref.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-sun-yellow border border-primary rounded-sm p-2">
      {/* Code Bar */}
      <Button
        variant="primary"
        size="sm"
        iconName={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
        onClick={handleCopy}
        fullWidth
        className="justify-between mb-2"
      >
        <span className="truncate">{sref.code}</span>
      </Button>

      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-2">
        {sref.images.map((src, index) => (
          <div
            key={index}
            className="aspect-square bg-black/20 border border-primary rounded-sm overflow-hidden relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`AI generated image ${index + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BrandAssetsApp({ windowId }: AppProps) {
  const tabs = Tabs.useTabsState({ defaultValue: 'logos' });

  return (
    <div className="h-full flex flex-col">
      <Tabs.Provider {...tabs}>
      <Tabs.Frame className="h-full flex flex-col">
        {/* Scrollable content area using AppWindowContent wrapper */}
        <AppWindowContent>
          {/* Logos Tab */}
          <Tabs.Content value="logos" className="p-2">
            <div className="grid grid-cols-3 gap-2 h-full">
              {LOGOS.map((logo) => (
                <LogoCard key={logo.id} logo={logo} />
              ))}
            </div>
          </Tabs.Content>

          {/* Colors Tab */}
          <Tabs.Content value="colors" className="p-4">
            {/* Header */}
            <div className="text-center mb-6 max-w-[36rem] mx-auto">
              <h2 className="font-joystix text-2xl text-primary mb-3 uppercase">
                The Colors
              </h2>
              <p className="font-mondwest text-sm text-primary leading-relaxed">
                These three colors form the visual core of Radiants. Together they reflect our focus on illumination, cycles, and the spaces between revelation and mystery. They&apos;re also designed for maximum practical flexibility: this limited palette works across every format and style while ensuring immediate brand recognition. Use them boldly and consistently — whether you&apos;re making pixel art, videos, interfaces, or anything else, these colors will do the work of making it unmistakably ours.
              </p>
            </div>

            {/* Brand Colors - Large */}
            <div className="flex gap-2 mb-6">
              {BRAND_COLORS.map((color) => (
                <ColorSwatch key={color.hex} color={color} large />
              ))}
            </div>

            {/* Extended Palette */}
            <div className="space-y-2">
              <h3 className="font-joystix text-sm text-primary/60 uppercase">Extended Palette</h3>
              <div className="grid grid-cols-4 gap-2">
                {EXTENDED_COLORS.map((color) => (
                  <ColorSwatch key={color.hex} color={color} />
                ))}
              </div>
            </div>
          </Tabs.Content>

          {/* Fonts Tab */}
          <Tabs.Content value="fonts" className="p-2">
            <div className="space-y-4">
              {FONTS.map((font) => (
                <FontCard key={font.name} font={font} />
              ))}
            </div>
          </Tabs.Content>

          {/* AI Gen Tab */}
          <Tabs.Content value="ai-gen" className="p-4">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="font-joystix text-2xl text-primary mb-3">
                Midjourney Style Codes
              </h2>
              <p className="font-mondwest text-sm text-primary leading-relaxed max-w-[42rem] mx-auto">
                Below is Radiant&apos;s SREF and personalization library. Copy the SREFs codes and to achieve the exact look provided. Utilize our personalization codes to add more *spice* to your to the SREFs below or to your own generations to. --SREF codes dictate the style, --P codes add the Radiants personal spice.
              </p>
            </div>

            {/* SREF Cards Grid */}
            <div className="grid grid-cols-2 gap-2">
              {SREF_CODES.map((sref) => (
                <SrefCard key={sref.id} sref={sref} />
              ))}
            </div>
          </Tabs.Content>
        </AppWindowContent>

        {/* Fixed tab bar at bottom */}
        <Tabs.List className="mt-2 -mb-2 bg-transparent">
          <Tabs.Trigger value="logos" icon={<RadMarkIcon size={ICON_SIZE.sm} />}>
            Logos
          </Tabs.Trigger>
          <Tabs.Trigger value="colors" icon={<ColorSwatchIcon size={ICON_SIZE.sm} />}>
            Colors
          </Tabs.Trigger>
          <Tabs.Trigger value="fonts" icon={<FontAaIcon size={ICON_SIZE.sm} />}>
            Fonts
          </Tabs.Trigger>
          <Tabs.Trigger value="ai-gen" icon={<RobotIcon size={ICON_SIZE.sm} />}>
            AI Gen
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Frame>
      </Tabs.Provider>
    </div>
  );
}

export default BrandAssetsApp;
