'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@rdna/radiants/components/core';
import { WindowTabs } from '@/components/Rad_os';
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
import { DesignSystemTab } from '@/components/ui/DesignSystemTab';

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
    name: 'Joystix Monospace',
    shortName: 'Joystix',
    role: 'Display & Headings',
    usage: 'h1–h6, labels, captions, buttons',
    description: 'An open source pixel font — bold and unapologetic. Use for headings, memes, and visual punch.',
    className: 'font-joystix',
    cssVar: '--font-heading',
    fontFamily: "'Joystix Monospace', monospace",
    tailwindClass: 'font-heading',
    weights: [{ value: 400, label: 'Regular' }],
    hasItalic: false,
    source: 'Open Source',
    downloadUrl: 'https://www.dropbox.com/scl/fi/h278kmyuvitljv92g0206/Bonkathon_Wordmark-PNG.zip?rlkey=nojnr6mipbpqwedomqgfarhoy&dl=1',
  },
  {
    name: 'Mondwest',
    shortName: 'Mondwest',
    role: 'Body & Readability',
    usage: 'paragraphs, descriptions, long-form content',
    description: "Radiants' readable font for long-form content. Created by Pangram Pangram — limited weights for non-commercial use.",
    className: 'font-mondwest',
    cssVar: '--font-sans',
    fontFamily: "'Mondwest', system-ui, sans-serif",
    tailwindClass: 'font-sans',
    weights: [
      { value: 400, label: 'Regular' },
      { value: 700, label: 'Bold' },
    ],
    hasItalic: false,
    source: 'Pangram Pangram',
    downloadUrl: 'https://www.dropbox.com/scl/fi/h278kmyuvitljv92g0206/Bonkathon_Wordmark-PNG.zip?rlkey=nojnr6mipbpqwedomqgfarhoy&dl=1',
  },
  {
    name: 'PixelCode',
    shortName: 'PixelCode',
    role: 'Code & Monospace',
    usage: 'code, pre, kbd, technical data',
    description: 'A pixel-art monospace font with 4 weights and italic variants. For code blocks, technical labels, and data displays.',
    className: 'font-mono',
    cssVar: '--font-mono',
    fontFamily: "'PixelCode', monospace",
    tailwindClass: 'font-mono',
    weights: [
      { value: 300, label: 'Light' },
      { value: 400, label: 'Regular' },
      { value: 500, label: 'Medium' },
      { value: 700, label: 'Bold' },
    ],
    hasItalic: true,
    source: 'PixelCode',
    downloadUrl: '',
  },
];

const TYPE_SCALE = [
  { token: '--font-size-3xl',  label: '3XL',  rem: '2rem',     px: 32 },
  { token: '--font-size-2xl',  label: '2XL',  rem: '1.5rem',   px: 24 },
  { token: '--font-size-xl',   label: 'XL',   rem: '1.25rem',  px: 20 },
  { token: '--font-size-lg',   label: 'LG',   rem: '1rem',     px: 16 },
  { token: '--font-size-base', label: 'Base',  rem: '0.875rem', px: 14 },
  { token: '--font-size-sm',   label: 'SM',   rem: '0.875rem', px: 14 },
  { token: '--font-size-xs',   label: 'XS',   rem: '0.75rem',  px: 12 },
  { token: '--font-size-2xs',  label: '2XS',  rem: '0.5rem',   px: 8  },
];

const ELEMENT_STYLES = [
  { el: 'h1',    font: 'Joystix',    fontClass: 'font-joystix',  size: '4xl',  weight: 700, leading: 'tight' },
  { el: 'h2',    font: 'Joystix',    fontClass: 'font-joystix',  size: '3xl',  weight: 400, leading: 'tight' },
  { el: 'h3',    font: 'Joystix',    fontClass: 'font-joystix',  size: '2xl',  weight: 600, leading: 'snug' },
  { el: 'h4',    font: 'Joystix',    fontClass: 'font-joystix',  size: 'xl',   weight: 500, leading: 'snug' },
  { el: 'p',     font: 'Mondwest',   fontClass: 'font-mondwest', size: 'base', weight: 400, leading: 'relaxed' },
  { el: 'a',     font: 'Mondwest',   fontClass: 'font-mondwest', size: 'base', weight: 400, leading: 'normal' },
  { el: 'code',  font: 'PixelCode',  fontClass: 'font-mono',     size: 'sm',   weight: 400, leading: 'normal' },
  { el: 'pre',   font: 'PixelCode',  fontClass: 'font-mono',     size: 'sm',   weight: 400, leading: 'relaxed' },
  { el: 'label', font: 'Joystix',    fontClass: 'font-joystix',  size: 'xs',   weight: 500, leading: 'normal' },
];

// ============================================================================
// Sub-components
// ============================================================================

function LogoCard({ logo }: { logo: LogoConfig }) {
  const [copied, setCopied] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const bgClass = logo.bgColor === 'black' ? 'bg-black' : 'bg-surface-primary';

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
      <div className="border border-edge-primary rounded-t-sm overflow-hidden">
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
      className={`flex flex-col border border-edge-primary rounded-sm overflow-hidden hover:shadow-card transition-shadow ${large ? 'flex-1' : ''}`}
    >
      <div className={`relative flex flex-col items-center justify-center ${large ? 'h-32' : 'h-20'}`} style={{ backgroundColor: color.hex }}>
        <span className={`font-joystix text-sm ${isLight ? 'text-content-primary' : 'text-white'}`}>{copied ? 'Copied!' : color.hex.replace('#', '')}</span>
        <span className={`font-mondwest text-xs ${isLight ? 'text-content-muted' : 'text-white/60'}`}>tap to copy</span>
      </div>
    </button>
  );
}

function CopyableRow({ label, value, displayValue, color = 'default' }: {
  label: string; value: string; displayValue?: string; color?: 'default' | 'yellow' | 'blue';
}) {
  const [copied, setCopied] = useState(false);
  const colorClass = color === 'yellow' ? 'text-sun-yellow' : color === 'blue' ? 'text-sky-blue' : 'text-content-primary';
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-2 w-full text-left group"
    >
      <span className="font-mono text-[10px] text-content-muted w-16 shrink-0">{label}</span>
      <code className={`font-mono text-xs ${colorClass} bg-black/5 px-1.5 py-0.5 rounded-sm group-hover:bg-black/10 truncate`}>
        {copied ? 'Copied!' : (displayValue ?? value)}
      </code>
    </button>
  );
}

function FontCard({ font }: { font: typeof FONTS[0] }) {
  return (
    <div className="border border-edge-primary rounded-sm overflow-hidden">
      {/* Hero specimen */}
      <div className="bg-black px-4 py-5 border-b border-edge-primary">
        <span className={`${font.className} text-3xl text-cream leading-none`}>
          Aa Bb Cc 123
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Name + role badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className={`${font.className} text-lg text-content-primary leading-tight`}>{font.name}</h3>
            <p className="font-mondwest text-xs text-content-muted">{font.source}</p>
          </div>
          <span className="font-joystix text-[9px] text-sun-yellow bg-black px-1.5 py-0.5 rounded-sm shrink-0 uppercase">
            {font.role}
          </span>
        </div>

        {/* Description */}
        <p className="font-mondwest text-sm text-content-secondary leading-relaxed">{font.description}</p>

        {/* CSS properties */}
        <div className="space-y-1">
          <CopyableRow label="CSS var" value={`var(${font.cssVar})`} color="yellow" />
          <CopyableRow label="family" value={font.fontFamily} />
          <CopyableRow label="Tailwind" value={font.tailwindClass} color="blue" />
        </div>

        {/* Weights */}
        <div className="space-y-1.5">
          <span className="font-joystix text-[9px] text-content-muted uppercase">Available Weights</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {font.weights.map((w) => (
              <div key={w.value} className="flex items-baseline gap-1.5">
                <span className={`${font.className} text-sm text-content-primary`} style={{ fontWeight: w.value }}>
                  {w.label}
                </span>
                <span className="font-mono text-[10px] text-content-muted">{w.value}</span>
              </div>
            ))}
            {font.hasItalic && (
              <div className="flex items-baseline gap-1.5">
                <span className={`${font.className} text-sm text-content-primary italic`}>Italic</span>
                <span className="font-mono text-[10px] text-content-muted">all weights</span>
              </div>
            )}
          </div>
        </div>

        {/* Usage elements */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-content-muted w-16 shrink-0">Elements</span>
          <span className="font-mondwest text-xs text-content-secondary">{font.usage}</span>
        </div>
      </div>

      {/* Download */}
      {font.downloadUrl && (
        <a href={font.downloadUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="primary" size="md" icon={<Icon name="download" size={20} />} fullWidth className="rounded-none border-t border-edge-primary">
            Get {font.shortName}
          </Button>
        </a>
      )}
    </div>
  );
}

function TypeScaleSection() {
  return (
    <div className="border border-edge-primary rounded-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-edge-primary bg-surface-muted flex items-baseline justify-between">
        <span className="font-joystix text-[10px] text-content-muted uppercase">Type Scale</span>
        <span className="font-mono text-[9px] text-content-muted">tokens.css</span>
      </div>
      <div className="p-3 space-y-2">
        {TYPE_SCALE.map(({ token, label, rem, px }) => (
          <div key={token} className="flex items-baseline gap-2">
            <span className="font-joystix text-content-muted w-8 shrink-0" style={{ fontSize: 9 }}>{label}</span>
            <span className="font-mono text-[10px] text-content-muted w-20 shrink-0">{rem} / {px}px</span>
            <span className="font-mondwest text-content-primary leading-none truncate" style={{ fontSize: rem }}>
              Radiants
            </span>
          </div>
        ))}

        {/* Clamp note */}
        <div className="pt-2 mt-1 border-t border-edge-muted">
          <div className="flex items-start gap-2">
            <span className="font-joystix text-[9px] text-sun-yellow bg-black px-1.5 py-0.5 rounded-sm shrink-0 uppercase">Body Clamp</span>
            <code className="font-mono text-[10px] text-content-primary leading-relaxed">
              font-size: clamp(1rem, 1vw, 1.125rem)
            </code>
          </div>
          <p className="font-mondwest text-[11px] text-content-muted mt-1 leading-relaxed">
            Base body font-size scales fluidly between 16px and 18px relative to viewport width. Defined in base.css on the body element.
          </p>
        </div>
      </div>
    </div>
  );
}

function ElementStylesSection() {
  return (
    <div className="border border-edge-primary rounded-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-edge-primary bg-surface-muted flex items-baseline justify-between">
        <span className="font-joystix text-[10px] text-content-muted uppercase">Element Styles</span>
        <span className="font-mono text-[9px] text-content-muted">typography.css</span>
      </div>
      <div className="divide-y divide-edge-muted">
        {ELEMENT_STYLES.map(({ el, font, fontClass, size, weight, leading }) => (
          <div key={el} className="px-3 py-2 flex items-baseline gap-2">
            <code className="font-mono text-[11px] text-sun-yellow bg-black dark:bg-surface-secondary/10 px-1 py-0.5 rounded-sm w-14 shrink-0">&lt;{el}&gt;</code>
            <span className={`${fontClass} text-xs text-content-primary truncate`} style={{ fontWeight: weight }}>
              {font}
            </span>
            <span className="font-mono text-[10px] text-content-muted ml-auto shrink-0">
              {size} / {weight} / {leading}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeSpecimen({ font }: { font: typeof FONTS[0] }) {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 !@#$%&*';
  return (
    <div className="border border-edge-primary rounded-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-edge-primary bg-surface-muted">
        <span className="font-joystix text-[10px] text-content-muted uppercase">{font.shortName} — Glyph Set</span>
      </div>
      <div className="p-3">
        <p className={`${font.className} text-sm text-content-primary leading-relaxed break-all`}>{ALPHABET}</p>
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
    <div className="bg-sun-yellow border border-edge-primary rounded-sm p-2">
      <Button variant="primary" size="sm" icon={<Icon name={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'} size={14} />} onClick={handleCopy} fullWidth className="justify-between mb-2">
        <span className="truncate">{sref.code}</span>
      </Button>
      <div className="grid grid-cols-2 gap-2">
        {sref.images.map((src, i) => (
          <div key={i} className="aspect-square bg-edge-muted border border-edge-primary rounded-sm overflow-hidden relative">
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
  return (
    <WindowTabs defaultValue="logos">

          {/* Logos */}
          <WindowTabs.Content value="logos" className="p-2">
            <div className="grid grid-cols-3 gap-2">
              {LOGOS.map((logo) => <LogoCard key={logo.id} logo={logo} />)}
            </div>
          </WindowTabs.Content>

          {/* Colors */}
          <WindowTabs.Content value="colors" className="p-4">
            <div className="text-center mb-6 max-w-[36rem] mx-auto">
              <h2 className="font-joystix text-2xl text-content-heading mb-3 uppercase">The Colors</h2>
              <p className="font-mondwest text-sm text-content-primary leading-relaxed">
                These three colors form the visual core of Radiants. Together they reflect our focus on illumination, cycles, and the spaces between revelation and mystery. Use them boldly and consistently.
              </p>
            </div>
            <div className="flex gap-2 mb-6">
              {BRAND_COLORS.map((c) => <ColorSwatch key={c.hex} color={c} large />)}
            </div>
            <div className="space-y-2">
              <h3 className="font-joystix text-sm text-content-muted uppercase">Extended Palette</h3>
              <div className="grid grid-cols-4 gap-2">
                {EXTENDED_COLORS.map((c) => <ColorSwatch key={c.hex} color={c} />)}
              </div>
            </div>
          </WindowTabs.Content>

          {/* Fonts — brand manual typography panel */}
          <WindowTabs.Content value="fonts" className="p-2 space-y-4">
            {/* Typeface cards */}
            {FONTS.map((font) => <FontCard key={font.name} font={font} />)}

            {/* Type scale */}
            <TypeScaleSection />

            {/* Element styles */}
            <ElementStylesSection />

            {/* Glyph sets */}
            <div className="space-y-2">
              <h3 className="font-joystix text-[10px] text-content-muted uppercase px-1">Glyph Sets</h3>
              {FONTS.map((font) => <TypeSpecimen key={font.name} font={font} />)}
            </div>
          </WindowTabs.Content>

          {/* AI Gen */}
          <WindowTabs.Content value="ai-gen" className="p-4">
            <div className="text-center mb-6">
              <h2 className="font-joystix text-2xl text-content-heading mb-3">Midjourney Style Codes</h2>
              <p className="font-mondwest text-sm text-content-primary leading-relaxed max-w-[42rem] mx-auto">
                Below is Radiant&apos;s SREF and personalization library. Copy the SREF codes to achieve the exact look provided. Utilize our personalization codes to add more *spice* to your generations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SREF_CODES.map((sref) => <SrefCard key={sref.id} sref={sref} />)}
            </div>
          </WindowTabs.Content>

          {/* Components — full design system catalog */}
          <WindowTabs.Content value="components">
            <DesignSystemTab />
          </WindowTabs.Content>

          {/* Tab bar */}
          <WindowTabs.List>
            <WindowTabs.Trigger value="logos" icon={<RadMarkIcon size={ICON_SIZE.sm} />}>Logos</WindowTabs.Trigger>
            <WindowTabs.Trigger value="colors" icon={<ColorSwatchIcon size={ICON_SIZE.sm} />}>Colors</WindowTabs.Trigger>
            <WindowTabs.Trigger value="fonts" icon={<FontAaIcon size={ICON_SIZE.sm} />}>Fonts</WindowTabs.Trigger>
            <WindowTabs.Trigger value="components" icon={<ComponentsIcon size={ICON_SIZE.sm} />}>Components</WindowTabs.Trigger>
            <WindowTabs.Trigger value="ai-gen" icon={<RobotIcon size={ICON_SIZE.sm} />}>AI Gen</WindowTabs.Trigger>
          </WindowTabs.List>
    </WindowTabs>
  );
}

export default BrandAssetsApp;
