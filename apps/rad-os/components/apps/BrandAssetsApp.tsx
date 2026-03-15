'use client';

import React, { useState, useRef } from 'react';
import { Button, Switch, Tooltip, Tabs, useTabsState } from '@rdna/radiants/components/core';
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
} from '@rdna/radiants/icons';
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
  { id: 'radsun-cream',    variant: 'radsun',   bgColor: 'black',  logoColor: 'cream' },
  { id: 'mark-cream',      variant: 'mark',     bgColor: 'black',  logoColor: 'cream' },
  { id: 'wordmark-cream',  variant: 'wordmark', bgColor: 'black',  logoColor: 'cream' },
  { id: 'radsun-black',    variant: 'radsun',   bgColor: 'cream',  logoColor: 'black' },
  { id: 'mark-black',      variant: 'mark',     bgColor: 'cream',  logoColor: 'black' },
  { id: 'wordmark-black',  variant: 'wordmark', bgColor: 'cream',  logoColor: 'black' },
  { id: 'radsun-yellow',   variant: 'radsun',   bgColor: 'black',  logoColor: 'yellow' },
  { id: 'mark-yellow',     variant: 'mark',     bgColor: 'black',  logoColor: 'yellow' },
  { id: 'wordmark-yellow', variant: 'wordmark', bgColor: 'black',  logoColor: 'yellow' },
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
  {
    name: 'Sun Yellow', hex: '#FCE184', role: 'Primary Accent',
    description: 'Actions, highlights, focus states, and energy. The signature color.',
    cssVar: '--color-sun-yellow', tailwind: 'sun-yellow',
  },
  {
    name: 'Cream', hex: '#FEF8E2', role: 'Canvas',
    description: 'Surfaces, backgrounds, and the warm foundation of all layouts.',
    cssVar: '--color-cream', tailwind: 'cream',
  },
  {
    name: 'Ink', hex: '#0F0E0C', role: 'Anchor',
    description: 'Typography, borders, depth. Grounds the visual hierarchy.',
    cssVar: '--color-ink', tailwind: 'ink',
  },
];

const EXTENDED_COLORS = [
  { name: 'Sky Blue',    hex: '#95BAD2', cssVar: '--color-sky-blue',    tailwind: 'sky-blue' },
  { name: 'Sunset Fuzz', hex: '#FCC383', cssVar: '--color-sunset-fuzz', tailwind: 'sunset-fuzz' },
  { name: 'Sun Red',     hex: '#FF6B63', cssVar: '--color-sun-red',     tailwind: 'sun-red' },
  { name: 'Mint',        hex: '#CEF5CA', cssVar: '--color-mint',        tailwind: 'mint' },
];

interface SemanticToken {
  name: string;
  cssVar: string;
  tailwind: string;
  lightHex: string;
  darkHex: string;
  note: string;
}

interface SemanticCategory {
  name: string;
  description: string;
  tokens: SemanticToken[];
}

const SEMANTIC_CATEGORIES: SemanticCategory[] = [
  {
    name: 'Surface',
    description: 'Background colors for containers and sections',
    tokens: [
      { name: 'primary',  cssVar: '--color-surface-primary',  tailwind: 'surface-primary',  lightHex: '#FEF8E2', darkHex: '#0F0E0C', note: 'Main page background' },
      { name: 'secondary', cssVar: '--color-surface-secondary', tailwind: 'surface-secondary', lightHex: '#0F0E0C', darkHex: '#FEF8E2', note: 'Inverted sections' },
      { name: 'tertiary', cssVar: '--color-surface-tertiary', tailwind: 'surface-tertiary', lightHex: '#FCC383', darkHex: '#3D2E1A', note: 'Accent containers' },
      { name: 'elevated', cssVar: '--color-surface-elevated', tailwind: 'surface-elevated', lightHex: '#FFFFFF', darkHex: 'rgba(252,225,132,0.05)', note: 'Cards, raised panels' },
      { name: 'muted',    cssVar: '--color-surface-muted',    tailwind: 'surface-muted',    lightHex: '#FEF8E2', darkHex: 'rgba(252,225,132,0.08)', note: 'Subtle backgrounds' },
    ],
  },
  {
    name: 'Content',
    description: 'Text and foreground colors',
    tokens: [
      { name: 'primary',  cssVar: '--color-content-primary',  tailwind: 'content-primary',  lightHex: '#0F0E0C', darkHex: '#FEF8E2', note: 'Body text' },
      { name: 'heading',  cssVar: '--color-content-heading',  tailwind: 'content-heading',  lightHex: '#0F0E0C', darkHex: '#FFFFFF', note: 'Headings' },
      { name: 'secondary', cssVar: '--color-content-secondary', tailwind: 'content-secondary', lightHex: '#0F0E0C', darkHex: '#FEF8E2', note: 'Supporting text' },
      { name: 'inverted', cssVar: '--color-content-inverted', tailwind: 'content-inverted', lightHex: '#FEF8E2', darkHex: '#0F0E0C', note: 'Text on dark bg' },
      { name: 'muted',    cssVar: '--color-content-muted',    tailwind: 'content-muted',    lightHex: 'rgba(15,14,12,0.6)', darkHex: 'rgba(254,248,226,0.6)', note: 'Captions, hints' },
      { name: 'link',     cssVar: '--color-content-link',     tailwind: 'content-link',     lightHex: '#95BAD2', darkHex: '#95BAD2', note: 'Hyperlinks' },
    ],
  },
  {
    name: 'Edge',
    description: 'Borders, outlines, and focus indicators',
    tokens: [
      { name: 'primary', cssVar: '--color-edge-primary', tailwind: 'edge-primary', lightHex: '#0F0E0C', darkHex: 'rgba(254,248,226,0.2)', note: 'Default borders' },
      { name: 'muted',   cssVar: '--color-edge-muted',   tailwind: 'edge-muted',   lightHex: 'rgba(15,14,12,0.2)', darkHex: 'rgba(254,248,226,0.12)', note: 'Subtle dividers' },
      { name: 'hover',   cssVar: '--color-edge-hover',   tailwind: 'edge-hover',   lightHex: 'rgba(15,14,12,0.3)', darkHex: 'rgba(254,248,226,0.35)', note: 'Hover state borders' },
      { name: 'focus',   cssVar: '--color-edge-focus',   tailwind: 'edge-focus',   lightHex: '#FCE184', darkHex: '#FCE184', note: 'Focus rings' },
    ],
  },
  {
    name: 'Action',
    description: 'Interactive element colors for buttons and controls',
    tokens: [
      { name: 'primary',     cssVar: '--color-action-primary',     tailwind: 'action-primary',     lightHex: '#FCE184', darkHex: '#FCE184', note: 'Primary buttons' },
      { name: 'secondary',   cssVar: '--color-action-secondary',   tailwind: 'action-secondary',   lightHex: '#0F0E0C', darkHex: '#FEF8E2', note: 'Secondary buttons' },
      { name: 'destructive', cssVar: '--color-action-destructive', tailwind: 'action-destructive', lightHex: '#FF6B63', darkHex: '#FF6B63', note: 'Delete, remove' },
      { name: 'accent',      cssVar: '--color-action-accent',      tailwind: 'action-accent',      lightHex: '#FCC383', darkHex: '#FCC383', note: 'Warm highlight CTA' },
    ],
  },
  {
    name: 'Status',
    description: 'Feedback and state indicator colors',
    tokens: [
      { name: 'success', cssVar: '--color-status-success', tailwind: 'status-success', lightHex: '#CEF5CA', darkHex: '#CEF5CA', note: 'Success states' },
      { name: 'warning', cssVar: '--color-status-warning', tailwind: 'status-warning', lightHex: '#FCE184', darkHex: '#FCE184', note: 'Warnings, caution' },
      { name: 'error',   cssVar: '--color-status-error',   tailwind: 'status-error',   lightHex: '#FF6B63', darkHex: '#FF6B63', note: 'Errors, failures' },
      { name: 'info',    cssVar: '--color-status-info',    tailwind: 'status-info',    lightHex: '#95BAD2', darkHex: '#95BAD2', note: 'Informational' },
    ],
  },
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
  { token: '--font-size-2xl',  label: '2XL',  rem: '1.75rem',  px: 28 },
  { token: '--font-size-xl',   label: 'XL',   rem: '1.5rem',   px: 24 },
  { token: '--font-size-lg',   label: 'LG',   rem: '1.25rem',  px: 20 },
  { token: '--font-size-base', label: 'Base', rem: '1rem',     px: 16 },
  { token: '--font-size-sm',   label: 'SM',   rem: '0.75rem',  px: 12 },
  { token: '--font-size-xs',   label: 'XS',   rem: '0.5rem',   px: 8  },
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

function LogoCard({ logo, format }: { logo: LogoConfig; format: 'png' | 'svg' }) {
  const [copied, setCopied] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase-cream-persists-in-dark owner:design expires:2027-01-01 issue:DNA-001
  const bgClass = logo.bgColor === 'black' ? 'bg-ink' : 'bg-cream';

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

  const handleDownload = () => {
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
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001
        className={logo.logoColor === 'cream' ? 'text-cream' : logo.logoColor === 'yellow' ? 'text-sun-yellow' : 'text-ink'}
      />
    );
  };

  const formatLabel = format.toUpperCase();

  return (
    <div className="border border-edge-primary rounded-xs overflow-hidden">
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
      <div ref={logoRef} className={`relative h-full min-h-20 ${bgClass} flex items-center justify-center p-6`}>
        {renderLogo()}
        <div className="absolute top-1.5 right-1.5 flex gap-1 rounded-xs">
          <Tooltip content={copied ? 'Copied!' : `Copy ${formatLabel}`}>
            <Button
              variant="primary" iconOnly
              icon={<Icon name={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'} />}
              onClick={handleCopySVG}
            />
          </Tooltip>
          <Tooltip content={`Download ${formatLabel}`}>
            <Button
              variant="primary" iconOnly
              icon={<Icon name="download" />}
              onClick={handleDownload}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function BrandColorCard({ color }: { color: typeof BRAND_COLORS[0] }) {
  const isLight = ['#FEF8E2', '#FCE184', '#CEF5CA', '#FCC383'].includes(color.hex);
  return (
    <div className="border border-edge-primary rounded-xs overflow-hidden bg-surface-primary">
      {/* Hero swatch */}
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
      <div
        className={`h-28 flex items-end p-3 ${isLight ? 'text-ink' : 'text-cream'}`}
        style={{ backgroundColor: color.hex }}
      >
        {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-swatch-literal-bg owner:design expires:2027-01-01 issue:DNA-001 */}
        <span className={`font-joystix text-lg leading-none ${isLight ? 'text-ink' : 'text-cream'}`}>
          {color.name}
        </span>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Role badge + hex */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-joystix text-xs text-content-inverted bg-surface-secondary px-1.5 py-0.5 rounded-sm shrink-0 uppercase">
            {color.role}
          </span>
          <span className="font-mono text-sm text-content-muted">{color.hex}</span>
        </div>

        {/* Description */}
        <p>{color.description}</p>

        {/* Copyable rows */}
        <div className="space-y-1">
          <CopyableRow label="CSS var" value={`var(${color.cssVar})`} color="yellow" />
          <CopyableRow label="Tailwind" value={color.tailwind} displayValue={`bg-${color.tailwind}`} color="blue" />
          <CopyableRow label="Hex" value={color.hex} />
        </div>
      </div>
    </div>
  );
}

function ExtendedColorSwatch({ color }: { color: typeof EXTENDED_COLORS[0] }) {
  const [copied, setCopied] = useState(false);
  const isLight = ['#FEF8E2', '#FCE184', '#CEF5CA', '#FCC383'].includes(color.hex);

  return (
    <Button
      type="button"
      variant="text"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(color.hex);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex flex-col border border-edge-primary rounded-sm overflow-hidden hover:shadow-raised transition-shadow bg-surface-primary"
    >
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
      <div
        className={`h-16 flex items-center justify-center ${isLight ? 'text-ink' : 'text-cream'}`}
        style={{ backgroundColor: color.hex }}
      >
        <span className="font-joystix text-xs">{copied ? 'Copied!' : color.hex}</span>
      </div>
      <div className="px-2 py-1.5 space-y-0.5">
        <span className="font-joystix text-xs text-content-primary block">{color.name}</span>
        <span className="font-mono text-xs text-content-muted block truncate">bg-{color.tailwind}</span>
      </div>
    </Button>
  );
}

function SemanticTokenRow({ token }: { token: SemanticToken }) {
  const [copied, setCopied] = useState(false);
  const isRgba = (v: string) => v.startsWith('rgba');

  return (
    <Button
      type="button"
      variant="text"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(`var(${token.cssVar})`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-2 w-full px-3 py-1.5 text-left group hover:bg-hover-overlay transition-colors"
    >
      {/* Light swatch */}
      <span
        className="w-4 h-4 rounded-full shrink-0 border border-edge-muted"
        style={{ backgroundColor: token.lightHex }}
        title={`Light: ${token.lightHex}`}
      />

      {/* Token name */}
      <code className="flex-1 min-w-0">
        {copied ? 'Copied!' : token.name}
      </code>

      {/* Usage note */}
      <span className="font-mondwest text-xs text-content-muted shrink-0 hidden @sm:inline">
        {token.note}
      </span>

      {/* Dark swatch */}
      <span
        className={`w-4 h-4 rounded-full shrink-0 border ${isRgba(token.darkHex) ? 'border-edge-primary bg-surface-secondary' : 'border-edge-muted'}`}
        style={isRgba(token.darkHex) ? undefined : { backgroundColor: token.darkHex }}
        title={`Dark: ${token.darkHex}`}
      >
        {isRgba(token.darkHex) && (
          <span className="block w-full h-full rounded-full" style={{ backgroundColor: token.darkHex }} />
        )}
      </span>
    </Button>
  );
}

function SemanticCategoryCard({ category }: { category: SemanticCategory }) {
  return (
    <div className="border border-edge-primary rounded-sm overflow-hidden bg-surface-primary">
      {/* Header */}
      <div className="bg-surface-secondary px-3 py-2 flex items-center justify-between gap-2">
        <span className="font-joystix text-xs text-content-inverted uppercase">{category.name}</span>
        <span className="font-mondwest text-xs text-content-inverted/60">{category.description}</span>
      </div>

      {/* Column labels */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-edge-muted bg-surface-overlay-subtle">
        <span className="font-mono text-xs text-content-muted w-4 text-center">LT</span>
        <span className="font-mono text-xs text-content-muted flex-1">TOKEN</span>
        <span className="font-mono text-xs text-content-muted shrink-0 hidden @sm:inline">USAGE</span>
        <span className="font-mono text-xs text-content-muted w-4 text-center">DK</span>
      </div>

      {/* Token rows */}
      <div className="divide-y divide-edge-muted">
        {category.tokens.map((token) => (
          <SemanticTokenRow key={token.cssVar} token={token} />
        ))}
      </div>
    </div>
  );
}

function CopyableRow({ label, value, displayValue, color = 'default' }: {
  label: string; value: string; displayValue?: string; color?: 'default' | 'yellow' | 'blue';
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="text"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-2 w-full text-left group hover:bg-hover-overlay transition-colors"
    >
      <span className="font-mono text-xs text-content-muted w-16 shrink-0">{label}</span>
      <code className="flex-1 min-w-0">
        {copied ? 'Copied!' : (displayValue ?? value)}
      </code>
    </Button>
  );
}

function FontCard({ font }: { font: typeof FONTS[0] }) {
  return (
    <div className="border border-edge-primary rounded-sm overflow-hidden bg-surface-primary">
      {/* Hero specimen */}
      <div className="bg-surface-secondary px-4 py-5 border-b border-edge-primary">
        <span className={`${font.className} text-3xl text-content-inverted leading-none`}>
          Aa Bb Cc 123
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Name + role badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <h3>
              <span className={`${font.className} text-lg text-content-primary leading-tight`}>{font.name}</span>
            </h3>
            <p>{font.source}</p>
          </div>
          <span className="font-joystix text-xs text-content-inverted bg-surface-secondary px-1.5 py-0.5 rounded-sm shrink-0 uppercase">
            {font.role}
          </span>
        </div>

        {/* Description */}
        <p>{font.description}</p>

        {/* CSS properties */}
        <div className="space-y-1">
          <CopyableRow label="CSS var" value={`var(${font.cssVar})`} color="yellow" />
          <CopyableRow label="family" value={font.fontFamily} />
          <CopyableRow label="Tailwind" value={font.tailwindClass} color="blue" />
        </div>

        {/* Weights */}
        <div className="space-y-1.5">
          <span className="font-joystix text-xs text-content-muted uppercase">Available Weights</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {font.weights.map((w) => (
              <div key={w.value} className="flex items-baseline gap-1.5">
                <span className={`${font.className} text-sm text-content-primary`} style={{ fontWeight: w.value }}>
                  {w.label}
                </span>
                <span className="font-mono text-xs text-content-muted">{w.value}</span>
              </div>
            ))}
            {font.hasItalic && (
              <div className="flex items-baseline gap-1.5">
                <span className={`${font.className} text-sm text-content-primary italic`}>Italic</span>
                <span className="font-mono text-xs text-content-muted">all weights</span>
              </div>
            )}
          </div>
        </div>

        {/* Usage elements */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-content-muted w-16 shrink-0">Elements</span>
          <span className="font-mondwest text-sm text-content-secondary">{font.usage}</span>
        </div>
      </div>

      {/* Download */}
      {font.downloadUrl && (
        <Button href={font.downloadUrl} target="_blank" variant="primary" size="md" icon={<Icon name="download" size={20} />} fullWidth className="rounded-none border-t border-edge-primary">
          Get {font.shortName}
        </Button>
      )}
    </div>
  );
}

function TypeScaleSection() {
  return (
    <div className="border border-edge-primary rounded-sm overflow-hidden bg-surface-primary">
      <div className="px-3 py-2 border-b border-edge-primary bg-surface-muted flex items-baseline justify-between">
        <span className="font-joystix text-xs text-content-muted uppercase">Type Scale</span>
        <span className="font-mono text-xs text-content-muted">tokens.css</span>
      </div>
      <div className="p-3 space-y-2">
        {TYPE_SCALE.map(({ token, label, rem, px }) => (
          <div key={token} className="flex items-baseline gap-2">
            <span className="font-joystix text-content-muted w-8 shrink-0" style={{ fontSize: 'var(--font-size-xs)' }}>{label}</span>
            <span className="font-mono text-xs text-content-muted w-20 shrink-0">{rem} / {px}px</span>
            <span className="font-mondwest text-content-primary leading-none truncate" style={{ fontSize: rem }}>
              Radiants
            </span>
          </div>
        ))}

        {/* Clamp note */}
        <div className="pt-2 mt-1 border-t border-edge-muted">
          <div className="flex items-start gap-2">
            <span className="font-joystix text-xs text-content-inverted bg-surface-secondary px-1.5 py-0.5 rounded-sm shrink-0 uppercase">Body Clamp</span>
            <code>
              font-size: clamp(1rem, 1vw, 1.125rem)
            </code>
          </div>
          <p className="mt-1">
            Base body font-size scales fluidly between 16px and 18px relative to viewport width. Defined in base.css on the body element.
          </p>
        </div>
      </div>
    </div>
  );
}

function ElementStylesSection() {
  return (
    <div className="border border-edge-primary rounded-sm overflow-hidden bg-surface-primary">
      <div className="px-3 py-2 border-b border-edge-primary bg-surface-muted flex items-baseline justify-between">
        <span className="font-joystix text-xs text-content-muted uppercase">Element Styles</span>
        <span className="font-mono text-xs text-content-muted">typography.css</span>
      </div>
      <div className="divide-y divide-edge-muted">
        {ELEMENT_STYLES.map(({ el, font, fontClass, size, weight, leading }) => (
          <div key={el} className="px-3 py-2 flex items-baseline gap-2">
            <code className="inline-block w-14 shrink-0">&lt;{el}&gt;</code>
            <span className={`${fontClass} text-sm text-content-primary truncate`} style={{ fontWeight: weight }}>
              {font}
            </span>
            <span className="font-mono text-xs text-content-muted ml-auto shrink-0">
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
    <div className="border border-edge-primary rounded-sm overflow-hidden bg-surface-primary">
      <div className="px-3 py-2 border-b border-edge-primary bg-surface-muted">
        <span className="font-joystix text-xs text-content-muted uppercase">{font.shortName} — Glyph Set</span>
      </div>
      <div className="p-3">
        <p>
          <span className={`${font.className} text-sm text-content-primary leading-relaxed break-all`}>{ALPHABET}</span>
        </p>
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
    <div className="bg-surface-primary border border-edge-primary rounded-sm p-2">
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
// Tab Items
// ============================================================================

const BRAND_TABS = [
  { value: 'logos',      label: 'Logos',      icon: <RadMarkIcon size={14} /> },
  { value: 'colors',     label: 'Colors',     icon: <ColorSwatchIcon size={14} /> },
  { value: 'fonts',      label: 'Fonts',      icon: <FontAaIcon size={14} /> },
  { value: 'components', label: 'Components', icon: <ComponentsIcon size={14} /> },
  { value: 'ai-gen',     label: 'AI Gen',     icon: <RobotIcon size={14} /> },
];

// ============================================================================
// Main Component
// ============================================================================

export function BrandAssetsApp({ windowId }: AppProps) {
  const [logoFormat, setLogoFormat] = useState<'png' | 'svg'>('png');
  const tabs = useTabsState({ defaultValue: 'logos', layout: 'sidebar' });

  return (
    <div className="h-full flex flex-col px-2 pb-2">
      <Tabs.Provider {...tabs}>
        <Tabs.List
          header={
            <div className="relative p-2">
              <div className="flex items-center gap-2 mb-3">
                <span className={`font-heading text-xs uppercase tracking-tight ${logoFormat === 'png' ? 'text-content-primary' : 'text-content-muted'}`}>PNG</span>
                <Switch checked={logoFormat === 'svg'} onChange={(checked) => setLogoFormat(checked ? 'svg' : 'png')} size="sm" />
                <span className={`font-heading text-xs uppercase tracking-tight ${logoFormat === 'svg' ? 'text-content-primary' : 'text-content-muted'}`}>SVG</span>
              </div>
            </div>
          }
        >
          {BRAND_TABS.map((tab) => (
            <Tabs.Trigger key={tab.value} value={tab.value} icon={tab.icon}>
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Logos */}
        <Tabs.Content value="logos">
          <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-2 p-5 h-full auto-rows-fr">
            {LOGOS.map((logo) => <LogoCard key={logo.id} logo={logo} format={logoFormat} />)}
          </div>
        </Tabs.Content>

        {/* Colors */}
        <Tabs.Content value="colors">
          <div className="space-y-4 p-5">
            <div className="space-y-2">
              {BRAND_COLORS.map((c) => <BrandColorCard key={c.hex} color={c} />)}
            </div>
            <div className="space-y-2">
              <h3 className="px-1">Extended Palette</h3>
              <div className="grid grid-cols-2 gap-2">
                {EXTENDED_COLORS.map((c) => <ExtendedColorSwatch key={c.hex} color={c} />)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="px-1">
                <h3>Semantic Tokens</h3>
                <p className="mt-0.5">
                  Purpose-based tokens that flip automatically in dark mode. Click a row to copy the CSS variable.
                </p>
              </div>
              {SEMANTIC_CATEGORIES.map((cat) => <SemanticCategoryCard key={cat.name} category={cat} />)}
            </div>
          </div>
        </Tabs.Content>

        {/* Fonts */}
        <Tabs.Content value="fonts">
          <div className="space-y-4 p-5">
            {FONTS.map((font) => <FontCard key={font.name} font={font} />)}
            <TypeScaleSection />
            <ElementStylesSection />
            <div className="space-y-2">
              <h3 className="px-1">Glyph Sets</h3>
              {FONTS.map((font) => <TypeSpecimen key={font.name} font={font} />)}
            </div>
          </div>
        </Tabs.Content>

        {/* Components */}
        <Tabs.Content value="components">
          <div className="p-5">
            <DesignSystemTab />
          </div>
        </Tabs.Content>

        {/* AI Gen */}
        <Tabs.Content value="ai-gen">
          <div className="text-center mb-6 p-5">
            <h2 className="mb-3">Midjourney Style Codes</h2>
            <p className="max-w-[42rem] mx-auto">
              Below is Radiant&apos;s SREF and personalization library. Copy the SREF codes to achieve the exact look provided. Utilize our personalization codes to add more *spice* to your generations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 p-5">
            {SREF_CODES.map((sref) => <SrefCard key={sref.id} sref={sref} />)}
          </div>
        </Tabs.Content>
      </Tabs.Provider>
    </div>
  );
}

export default BrandAssetsApp;
