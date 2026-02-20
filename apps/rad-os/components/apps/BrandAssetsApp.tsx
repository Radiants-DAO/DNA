'use client';

import React, { useState, useRef } from 'react';
import { Tabs, Button, Input } from '@rdna/radiants/components/core';
import { AppWindowContent } from '@/components/Rad_os';
import { AppProps } from '@/lib/constants';
import {
  Icon,
  RadMarkIcon,
  WordmarkLogo,
  RadSunLogo,
  FontAaIcon,
  RobotIcon,
  ColorSwatchIcon,
  ComponentsIcon,
  ICON_SIZE,
} from '@/components/icons';
import { DesignSystemTab } from '@/devtools/tabs/ComponentsTab/DesignSystemTab';

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
  { id: 'wordmark-cream',  variant: 'wordmark', bgColor: 'black',  logoColor: 'cream' },
  { id: 'wordmark-black',  variant: 'wordmark', bgColor: 'cream',  logoColor: 'black' },
  { id: 'wordmark-yellow', variant: 'wordmark', bgColor: 'black',  logoColor: 'yellow' },
  { id: 'mark-cream',      variant: 'mark',     bgColor: 'black',  logoColor: 'cream' },
  { id: 'mark-black',      variant: 'mark',     bgColor: 'cream',  logoColor: 'black' },
  { id: 'mark-yellow',     variant: 'mark',     bgColor: 'black',  logoColor: 'yellow' },
  { id: 'radsun-cream',    variant: 'radsun',   bgColor: 'black',  logoColor: 'cream' },
  { id: 'radsun-black',    variant: 'radsun',   bgColor: 'cream',  logoColor: 'black' },
  { id: 'radsun-yellow',   variant: 'radsun',   bgColor: 'black',  logoColor: 'yellow' },
];

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

const BRAND_COLORS = [
  { name: 'Sun Yellow', hex: '#FCE184' },
  { name: 'Cream',      hex: '#FEF8E2' },
  { name: 'Black',      hex: '#0F0E0C' },
];

const EXTENDED_COLORS = [
  { name: 'Sky Blue',    hex: '#95BAD2' },
  { name: 'Sunset Fuzz', hex: '#FCC383' },
  { name: 'Sun Red',     hex: '#FF6B63' },
  { name: 'Green',       hex: '#CEF5CA' },
];

const FONTS = [
  {
    name: 'Joystix',
    usage: 'h1, h2, h3, & captions',
    description: 'Joystix is an open source font available from multiple sources. Best used for large text, memes, visual designs & art, and captions. Use for most large headings with Mondwest as a subheading, paragraph, or description.',
    className: 'font-joystix',
    downloadUrl: 'https://www.dropbox.com/scl/fi/h278kmyuvitljv92g0206/Bonkathon_Wordmark-PNG.zip?rlkey=nojnr6mipbpqwedomqgfarhoy&dl=1',
  },
  {
    name: 'Mondwest',
    usage: 'paragraphs, graphics, & descriptions',
    description: "Mondwest is Radiants' readable font, used for long-form content. Created by Panagram Panagram Type foundry, where you can purchase it. They allow limited weights for non-commercial use.",
    className: 'font-mondwest',
    downloadUrl: 'https://www.dropbox.com/scl/fi/h278kmyuvitljv92g0206/Bonkathon_Wordmark-PNG.zip?rlkey=nojnr6mipbpqwedomqgfarhoy&dl=1',
  },
];

// Type specimen sizes
const TYPE_SIZES = [
  { label: 'Hero',  className: 'text-5xl' },
  { label: 'XL',    className: 'text-4xl' },
  { label: 'LG',    className: 'text-3xl' },
  { label: 'MD',    className: 'text-2xl' },
  { label: 'SM',    className: 'text-xl'  },
  { label: 'XS',    className: 'text-base'},
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
        const getFilename = (c: string) => c === 'cream' ? 'radsun-cream' : c === 'black' ? 'radsun-black' : 'radsun-yellow';
        const res = await fetch(`/assets/logos/${getFilename(logo.logoColor)}.svg`);
        if (res.ok) svgContent = await res.text();
      } else {
        const svg = logoRef.current?.querySelector('svg');
        if (!svg) return;
        const clone = svg.cloneNode(true) as SVGElement;
        clone.removeAttribute('data-reactroot');
        if (!clone.hasAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgContent = clone.outerHTML;
      }
      if (!svgContent) return;
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SVG:', err);
    }
  };

  const handleDownload = (format: 'png' | 'svg') => {
    const link = document.createElement('a');
    link.href = `/assets/logos/${format.toUpperCase()}/${logo.id}.${format}`;
    link.download = `${logo.id}.${format}`;
    link.click();
  };

  const renderLogo = () => {
    if (logo.variant === 'wordmark') return <WordmarkLogo className="w-[80%] h-auto" color={logo.logoColor} />;
    if (logo.variant === 'radsun')   return <RadSunLogo className="w-[40%] h-auto" color={logo.logoColor} />;
    return (
      <RadMarkIcon
        size={88}
        className={logo.logoColor === 'cream' ? 'text-warm-cloud' : logo.logoColor === 'yellow' ? 'text-sun-yellow' : 'text-black'}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="border border-primary rounded-t-sm overflow-hidden">
        <div ref={logoRef} className={`relative h-[180px] ${bgClass} flex items-center justify-center p-6`}>
          {renderLogo()}
          <Button
            variant="primary" size="md" iconOnly
            icon={<Icon name={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'} size={20} />}
            onClick={handleCopySVG}
            title="Copy SVG"
            className="absolute top-2 right-2"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="md" icon={<Icon name="download" size={20} />} onClick={() => handleDownload('png')} fullWidth>PNG</Button>
        <Button variant="primary" size="md" icon={<Icon name="download" size={20} />} onClick={() => handleDownload('svg')} fullWidth>SVG</Button>
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
      <div className={`relative flex flex-col items-center justify-center ${large ? 'h-32' : 'h-20'}`} style={{ backgroundColor: color.hex }}>
        <span className={`font-joystix text-sm ${isLight ? 'text-primary' : 'text-white'}`}>{copied ? 'Copied!' : color.hex.replace('#', '')}</span>
        <span className={`font-mondwest text-xs ${isLight ? 'text-primary/60' : 'text-white/60'}`}>tap to copy</span>
      </div>
    </button>
  );
}

function FontCard({ font }: { font: typeof FONTS[0] }) {
  return (
    <div className="border border-primary rounded-sm overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className={`${font.className} text-2xl text-primary`}>{font.name}</h3>
          <p className="font-joystix text-xs text-sun-yellow uppercase">{font.usage}</p>
        </div>
        <p className="font-mondwest text-sm text-primary/80 leading-relaxed">{font.description}</p>
      </div>
      <a href={font.downloadUrl} target="_blank" rel="noopener noreferrer" className="block">
        <Button variant="primary" size="md" icon={<Icon name="download" size={20} />} fullWidth className="rounded-none border-t border-primary">
          Get {font.name}
        </Button>
      </a>
    </div>
  );
}

function TypeSpecimen({ font }: { font: typeof FONTS[0] }) {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789';
  const PANGRAM = 'The quick brown fox jumps over the lazy dog.';
  return (
    <div className="border border-primary rounded-sm overflow-hidden">
      <div className="px-4 py-2 border-b border-primary bg-black/5">
        <span className="font-joystix text-xs text-primary/60 uppercase">{font.name} — Type Specimen</span>
      </div>
      <div className="p-4 space-y-4">
        {/* Size scale */}
        {TYPE_SIZES.map(({ label, className }) => (
          <div key={label} className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] text-primary/40 w-8 shrink-0">{label}</span>
            <span className={`${font.className} ${className} text-primary leading-tight`}>{PANGRAM}</span>
          </div>
        ))}
        {/* Alphabet */}
        <div className="pt-2 border-t border-primary/20">
          <p className={`${font.className} text-sm text-primary/70 leading-relaxed break-all`}>{ALPHABET}</p>
        </div>
      </div>
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
      <Button variant="primary" size="sm" icon={<Icon name={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'} size={14} />} onClick={handleCopy} fullWidth className="justify-between mb-2">
        <span className="truncate">{sref.code}</span>
      </Button>
      <div className="grid grid-cols-2 gap-2">
        {sref.images.map((src, i) => (
          <div key={i} className="aspect-square bg-black/20 border border-primary rounded-sm overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`AI generated image ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
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
  const [componentSearch, setComponentSearch] = useState('');

  return (
    <div className="h-full flex flex-col">
      <Tabs.Provider {...tabs}>
      <Tabs.Frame className="h-full flex flex-col">
        <AppWindowContent>

          {/* Logos */}
          <Tabs.Content value="logos" className="p-2">
            <div className="grid grid-cols-3 gap-2">
              {LOGOS.map((logo) => <LogoCard key={logo.id} logo={logo} />)}
            </div>
          </Tabs.Content>

          {/* Colors */}
          <Tabs.Content value="colors" className="p-4">
            <div className="text-center mb-6 max-w-[36rem] mx-auto">
              <h2 className="font-joystix text-2xl text-primary mb-3 uppercase">The Colors</h2>
              <p className="font-mondwest text-sm text-primary leading-relaxed">
                These three colors form the visual core of Radiants. Together they reflect our focus on illumination, cycles, and the spaces between revelation and mystery. Use them boldly and consistently.
              </p>
            </div>
            <div className="flex gap-2 mb-6">
              {BRAND_COLORS.map((c) => <ColorSwatch key={c.hex} color={c} large />)}
            </div>
            <div className="space-y-2">
              <h3 className="font-joystix text-sm text-primary/60 uppercase">Extended Palette</h3>
              <div className="grid grid-cols-4 gap-2">
                {EXTENDED_COLORS.map((c) => <ColorSwatch key={c.hex} color={c} />)}
              </div>
            </div>
          </Tabs.Content>

          {/* Fonts — font cards + type specimens */}
          <Tabs.Content value="fonts" className="p-2 space-y-6">
            {/* Font cards */}
            <div className="space-y-4">
              {FONTS.map((font) => <FontCard key={font.name} font={font} />)}
            </div>
            {/* Type specimens */}
            <div className="space-y-4">
              <h3 className="font-joystix text-xs text-primary/50 uppercase px-1">Type Specimens</h3>
              {FONTS.map((font) => <TypeSpecimen key={font.name} font={font} />)}
            </div>
          </Tabs.Content>

          {/* AI Gen */}
          <Tabs.Content value="ai-gen" className="p-4">
            <div className="text-center mb-6">
              <h2 className="font-joystix text-2xl text-primary mb-3">Midjourney Style Codes</h2>
              <p className="font-mondwest text-sm text-primary leading-relaxed max-w-[42rem] mx-auto">
                Below is Radiant&apos;s SREF and personalization library. Copy the SREF codes to achieve the exact look provided. Utilize our personalization codes to add more *spice* to your generations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SREF_CODES.map((sref) => <SrefCard key={sref.id} sref={sref} />)}
            </div>
          </Tabs.Content>

          {/* Components — full design system catalog */}
          <Tabs.Content value="components" className="h-full flex flex-col">
            <div className="px-3 py-2 border-b border-primary shrink-0">
              <Input
                value={componentSearch}
                onChange={(e) => setComponentSearch(e.target.value)}
                placeholder="Search components…"
                size="sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <DesignSystemTab searchQuery={componentSearch} />
            </div>
          </Tabs.Content>

        </AppWindowContent>

        {/* Tab bar */}
        <Tabs.List className="mt-2 -mb-2 bg-transparent">
          <Tabs.Trigger value="logos"      icon={<RadMarkIcon size={ICON_SIZE.sm} />}>Logos</Tabs.Trigger>
          <Tabs.Trigger value="colors"     icon={<ColorSwatchIcon size={ICON_SIZE.sm} />}>Colors</Tabs.Trigger>
          <Tabs.Trigger value="fonts"      icon={<FontAaIcon size={ICON_SIZE.sm} />}>Fonts</Tabs.Trigger>
          <Tabs.Trigger value="components" icon={<ComponentsIcon size={ICON_SIZE.sm} />}>Components</Tabs.Trigger>
          <Tabs.Trigger value="ai-gen"     icon={<RobotIcon size={ICON_SIZE.sm} />}>AI Gen</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Frame>
      </Tabs.Provider>
    </div>
  );
}

export default BrandAssetsApp;
