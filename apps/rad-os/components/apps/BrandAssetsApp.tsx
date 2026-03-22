'use client';

import React, { useState, useRef } from 'react';
import { Button, Switch, Tooltip, ToggleGroup, Pattern, Input, Tabs, Collapsible } from '@rdna/radiants/components/core';
import { type AppProps } from '@/lib/apps';
import {
  Icon,
  RadMarkIcon,
  WordmarkLogo,
  RadSunLogo,
  FontAaIcon,
} from '@rdna/radiants/icons';
import { DesignSystemTab } from '@/components/ui/DesignSystemTab';
import { PatternsTab } from '@/components/ui/PatternsTab';
import { registry, CATEGORIES, CATEGORY_LABELS } from '@rdna/radiants/registry';
import type { ComponentCategory } from '@rdna/radiants/registry';

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
    name: 'Sun Yellow', hex: '#FCE184', oklch: 'oklch(0.9126 0.1170 93.68)', role: 'Primary Accent',
    description: 'Actions, highlights, focus states, and energy. The signature color of Radiants.',
    cssVar: '--color-sun-yellow', tailwind: 'sun-yellow',
  },
  {
    name: 'Cream', hex: '#FEF8E2', oklch: 'oklch(0.9780 0.0295 94.34)', role: 'Canvas',
    description: 'Surfaces, backgrounds, and the warm foundation of all layouts.',
    cssVar: '--color-cream', tailwind: 'cream',
  },
  {
    name: 'Ink', hex: '#0F0E0C', oklch: 'oklch(0.1641 0.0044 84.59)', role: 'Anchor',
    description: 'Typography, borders, depth. Grounds the visual hierarchy.',
    cssVar: '--color-ink', tailwind: 'ink',
  },
];

const EXTENDED_COLORS = [
  { name: 'Sky Blue',    hex: '#95BAD2', oklch: 'oklch(0.7701 0.0527 236.81)', cssVar: '--color-sky-blue',    tailwind: 'sky-blue',    role: 'Links & Info' },
  { name: 'Sunset Fuzz', hex: '#FCC383', oklch: 'oklch(0.8546 0.1039 68.93)',  cssVar: '--color-sunset-fuzz', tailwind: 'sunset-fuzz', role: 'Warm CTA' },
  { name: 'Sun Red',     hex: '#FF7F7F', oklch: 'oklch(0.7429 0.1568 21.43)',  cssVar: '--color-sun-red',     tailwind: 'sun-red',     role: 'Error & Danger' },
  { name: 'Mint',        hex: '#CEF5CA', oklch: 'oklch(0.9312 0.0702 142.51)', cssVar: '--color-mint',        tailwind: 'mint',        role: 'Success' },
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
      { name: 'primary',  cssVar: '--color-page',  tailwind: 'page',  lightHex: '#FEF8E2', darkHex: '#0F0E0C', note: 'Main page background' },
      { name: 'secondary', cssVar: '--color-inv', tailwind: 'inv', lightHex: '#0F0E0C', darkHex: '#FEF8E2', note: 'Inverted sections' },
      { name: 'tertiary', cssVar: '--color-tinted', tailwind: 'tinted', lightHex: '#FCC383', darkHex: '#3D2E1A', note: 'Accent containers' },
      { name: 'elevated', cssVar: '--color-card', tailwind: 'card', lightHex: '#FFFFFF', darkHex: 'rgba(252,225,132,0.05)', note: 'Cards, raised panels' },
      { name: 'muted',    cssVar: '--color-depth',    tailwind: 'depth',    lightHex: '#FEF8E2', darkHex: 'rgba(252,225,132,0.08)', note: 'Subtle backgrounds' },
    ],
  },
  {
    name: 'Content',
    description: 'Text and foreground colors',
    tokens: [
      { name: 'primary',  cssVar: '--color-main',  tailwind: 'main',  lightHex: '#0F0E0C', darkHex: '#FEF8E2', note: 'Body text' },
      { name: 'heading',  cssVar: '--color-head',  tailwind: 'head',  lightHex: '#0F0E0C', darkHex: '#FFFFFF', note: 'Headings' },
      { name: 'secondary', cssVar: '--color-sub', tailwind: 'sub', lightHex: '#0F0E0C', darkHex: '#FEF8E2', note: 'Supporting text' },
      { name: 'inverted', cssVar: '--color-flip', tailwind: 'flip', lightHex: '#FEF8E2', darkHex: '#0F0E0C', note: 'Text on dark bg' },
      { name: 'muted',    cssVar: '--color-mute',    tailwind: 'mute',    lightHex: 'rgba(15,14,12,0.6)', darkHex: 'rgba(254,248,226,0.6)', note: 'Captions, hints' },
      { name: 'link',     cssVar: '--color-link',     tailwind: 'link',     lightHex: '#95BAD2', darkHex: '#95BAD2', note: 'Hyperlinks' },
    ],
  },
  {
    name: 'Edge',
    description: 'Borders, outlines, and focus indicators',
    tokens: [
      { name: 'primary', cssVar: '--color-line', tailwind: 'line', lightHex: '#0F0E0C', darkHex: 'rgba(254,248,226,0.2)', note: 'Default borders' },
      { name: 'muted',   cssVar: '--color-rule',   tailwind: 'rule',   lightHex: 'rgba(15,14,12,0.2)', darkHex: 'rgba(254,248,226,0.12)', note: 'Subtle dividers' },
      { name: 'hover',   cssVar: '--color-line-hover',   tailwind: 'line-hover',   lightHex: 'rgba(15,14,12,0.3)', darkHex: 'rgba(254,248,226,0.35)', note: 'Hover state borders' },
      { name: 'focus',   cssVar: '--color-focus',   tailwind: 'focus',   lightHex: '#FCE184', darkHex: '#FCE184', note: 'Focus rings' },
    ],
  },
  {
    name: 'Action',
    description: 'Interactive element colors for buttons and controls',
    tokens: [
      { name: 'primary',     cssVar: '--color-accent',     tailwind: 'accent',     lightHex: '#FCE184', darkHex: '#FCE184', note: 'Primary buttons' },
      { name: 'secondary',   cssVar: '--color-accent-inv',   tailwind: 'accent-inv',   lightHex: '#0F0E0C', darkHex: '#FEF8E2', note: 'Secondary buttons' },
      { name: 'destructive', cssVar: '--color-danger', tailwind: 'danger', lightHex: '#FF6B63', darkHex: '#FF6B63', note: 'Delete, remove' },
      { name: 'accent',      cssVar: '--color-accent-soft',      tailwind: 'accent-soft',      lightHex: '#FCC383', darkHex: '#FCC383', note: 'Warm highlight CTA' },
    ],
  },
  {
    name: 'Status',
    description: 'Feedback and state indicator colors',
    tokens: [
      { name: 'success', cssVar: '--color-success', tailwind: 'success', lightHex: '#CEF5CA', darkHex: '#CEF5CA', note: 'Success states' },
      { name: 'warning', cssVar: '--color-warning', tailwind: 'warning', lightHex: '#FCE184', darkHex: '#FCE184', note: 'Warnings, caution' },
      { name: 'error',   cssVar: '--color-danger',   tailwind: 'danger',   lightHex: '#FF6B63', darkHex: '#FF6B63', note: 'Errors, failures' },
      { name: 'info',    cssVar: '--color-link',    tailwind: 'link',    lightHex: '#95BAD2', darkHex: '#95BAD2', note: 'Informational' },
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
    /** Direct download — OSS font */
    downloadUrl: 'https://www.dropbox.com/scl/fi/h278kmyuvitljv92g0206/Bonkathon_Wordmark-PNG.zip?rlkey=nojnr6mipbpqwedomqgfarhoy&dl=1',
    linkOut: false,
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
    /** Link to foundry — not OSS */
    downloadUrl: 'https://pangrampangram.com/products/mondwest',
    linkOut: true,
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
    source: 'Open Source',
    /** Direct download — OSS font */
    downloadUrl: 'https://qwerasd205.github.io/PixelCode/',
    linkOut: false,
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
// Pattern controls (lifted from PatternsTab)
// ============================================================================

const RDNA_COLORS = [
  { label: 'Ink',          value: 'var(--color-ink)' },
  { label: 'Pure White',   value: 'var(--color-pure-white)' },
  { label: 'Cream',        value: 'var(--color-cream)' },
  { label: 'Sun Yellow',   value: 'var(--color-sun-yellow)' },
  { label: 'Sunset Fuzz',  value: 'var(--color-sunset-fuzz)' },
  { label: 'Sun Red',      value: 'var(--color-sun-red)' },
  { label: 'Sky Blue',     value: 'var(--color-sky-blue)' },
  { label: 'Mint',         value: 'var(--color-mint)' },
];

const SCALE_OPTIONS: { value: 1 | 2 | 3 | 4; label: string }[] = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
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
    <div className="pixel-rounded-xs">
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
      <div ref={logoRef} className={`relative h-full min-h-20 ${bgClass} flex items-center justify-center p-6`}>
        {renderLogo()}
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          <Tooltip content={copied ? 'Copied!' : `Copy ${formatLabel}`}>
            <Button
              iconOnly
              icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
              onClick={handleCopySVG}
            />
          </Tooltip>
          <Tooltip content={`Download ${formatLabel}`}>
            <Button
              iconOnly
              icon="download"
              onClick={handleDownload}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function BrandColorCard({ color, index }: { color: typeof BRAND_COLORS[0]; index: number }) {
  const isLight = ['#FEF8E2', '#FCE184', '#CEF5CA', '#FCC383', '#95BAD2', '#FF7F7F'].includes(color.hex);
  return (
    <div className="pixel-rounded-sm pixel-shadow-raised">
      {/* Swatch */}
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
      <div
        className="h-40 flex flex-col justify-between p-4 border-b border-ink"
        style={{ backgroundColor: color.hex }}
      >
        <div className="flex items-start justify-between">
          {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
          <span className={`font-mono text-xs ${isLight ? 'text-ink' : 'text-cream'}`}>
            {String(index + 1).padStart(2, '0')}
          </span>
          {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
          <span className="font-joystix text-xs uppercase px-1.5 py-0.5 bg-ink text-cream pixel-rounded-sm">
            {color.role}
          </span>
        </div>
        {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
        <span className={`font-joystix text-xl leading-none ${isLight ? 'text-ink' : 'text-cream'}`}>
          {color.name}
        </span>
      </div>

      {/* Data */}
      <div className="bg-page">
        <div className="px-4 py-3 border-b border-rule">
          <p className="text-sm text-sub leading-snug">{color.description}</p>
        </div>
        <div className="divide-y divide-rule">
          <CopyableRow label="CSS VAR" value={`var(${color.cssVar})`} />
          <CopyableRow label="TAILWIND" value={color.tailwind} displayValue={`bg-${color.tailwind}`} />
          <CopyableRow label="OKLCH" value={color.oklch} />
          <CopyableRow label="HEX" value={color.hex} />
        </div>
      </div>
    </div>
  );
}

function ExtendedColorSwatch({ color, index }: { color: typeof EXTENDED_COLORS[0]; index: number }) {
  const isLight = ['#FEF8E2', '#FCE184', '#CEF5CA', '#FCC383', '#95BAD2', '#FF7F7F'].includes(color.hex);
  return (
    <div className="pixel-rounded-sm pixel-shadow-raised">
      {/* Swatch */}
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
      <div
        className="h-40 flex flex-col justify-between p-4 border-b border-ink"
        style={{ backgroundColor: color.hex }}
      >
        <div className="flex items-start justify-between">
          {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
          <span className={`font-mono text-xs ${isLight ? 'text-ink' : 'text-cream'}`}>
            {String(index + 1).padStart(2, '0')}
          </span>
          {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
          <span className="font-joystix text-xs uppercase px-1.5 py-0.5 bg-ink text-cream pixel-rounded-sm">
            {color.role}
          </span>
        </div>
        {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
        <span className={`font-joystix text-xl leading-none ${isLight ? 'text-ink' : 'text-cream'}`}>
          {color.name}
        </span>
      </div>

      {/* Data */}
      <div className="bg-page">
        <div className="divide-y divide-rule">
          <CopyableRow label="CSS VAR" value={`var(${color.cssVar})`} />
          <CopyableRow label="TAILWIND" value={color.tailwind} displayValue={`bg-${color.tailwind}`} />
          <CopyableRow label="OKLCH" value={color.oklch} />
          <CopyableRow label="HEX" value={color.hex} />
        </div>
      </div>
    </div>
  );
}

function SemanticTokenRow({ token }: { token: SemanticToken }) {
  const [copied, setCopied] = useState(false);

  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:table-row-interactive owner:design expires:2027-01-01 issue:DNA-001
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(`var(${token.cssVar})`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-hover transition-colors cursor-pointer group"
    >
      {/* Sun Mode swatch */}
      <span
        className="w-5 h-5 rounded-sm shrink-0 border border-rule"
        style={{ backgroundColor: token.lightHex }}
        title={`Sun Mode: ${token.lightHex}`}
      />

      {/* Token name */}
      <span className="font-joystix text-xs uppercase text-main min-w-[80px]">
        {token.name}
      </span>

      {/* CSS var */}
      <code className="flex-1 min-w-0 font-mono text-xs text-mute truncate group-hover:text-main transition-colors">
        {copied ? '✓ copied' : `var(${token.cssVar})`}
      </code>

      {/* Usage note */}
      <span className="font-mondwest text-xs text-mute shrink-0 hidden @sm:inline">
        {token.note}
      </span>

      {/* Moon Mode swatch */}
      <span
        className="w-5 h-5 rounded-sm shrink-0 border border-rule overflow-hidden"
        title={`Moon Mode: ${token.darkHex}`}
      >
        <span className="block w-full h-full" style={{ backgroundColor: token.darkHex }} />
      </span>
    </button>
  );
}

function SemanticCategoryCard({ category, index }: { category: SemanticCategory; index: number }) {
  return (
    <div className="pixel-rounded-sm">
      {/* Header */}
      <div className="bg-inv px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-flip/40">{String(index + 1).padStart(2, '0')}</span>
          <span className="font-joystix text-sm text-flip uppercase tracking-wide">{category.name}</span>
        </div>
        <span className="font-mondwest text-xs text-flip/60 shrink-0 hidden @sm:block">{category.description}</span>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-rule bg-depth">
        <span className="w-5 font-mono text-xs text-center text-mute">LT</span>
        <span className="font-mono text-xs text-mute min-w-[80px]">TOKEN</span>
        <span className="font-mono text-xs text-mute flex-1">VAR</span>
        <span className="font-mono text-xs text-mute hidden @sm:block shrink-0">USAGE</span>
        <span className="w-5 font-mono text-xs text-center text-mute">DK</span>
      </div>

      {/* Token rows */}
      <div className="divide-y divide-rule">
        {category.tokens.map((token) => (
          <SemanticTokenRow key={token.cssVar} token={token} />
        ))}
      </div>
    </div>
  );
}

function CopyableRow({ label, value, displayValue }: {
  label: string; value: string; displayValue?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:copy-row-interactive owner:design expires:2027-01-01 issue:DNA-001
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-hover transition-colors cursor-pointer"
    >
      <span className="font-mono text-xs text-mute w-20 shrink-0 uppercase tracking-wide">{label}</span>
      <code className="flex-1 min-w-0 text-xs truncate">
        {copied ? '✓ copied' : (displayValue ?? value)}
      </code>
    </button>
  );
}

function FontCard({ font }: { font: typeof FONTS[0] }) {
  return (
    <div className="flex flex-col">
      {/* ── Square display — ink on white ── */}
      <div className="pixel-rounded-sm relative">
        {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-type-specimen-white-bg owner:design expires:2027-01-01 issue:DNA-001 */}
        <div className="aspect-square bg-pure-white flex flex-col items-center justify-center p-6">
          <span className={`${font.className} text-ink leading-none text-3xl`}>
            AaBbCc
          </span>
        </div>

        {/* Icon button — download or link out */}
        {font.downloadUrl && (
          <div className="absolute top-1.5 right-1.5">
            <Tooltip content={font.linkOut ? `View at ${font.source}` : `Download ${font.shortName}`}>
              <Button
                iconOnly
                icon={font.linkOut ? 'globe' : 'download'}
                href={font.downloadUrl}
                target="_blank"
              />
            </Tooltip>
          </div>
        )}
      </div>

      {/* ── Name + role bar ── */}
      <div className="flex items-center justify-between gap-2 px-1 py-2.5">
        <h3>
          <span className={`${font.className} text-base text-main leading-tight`}>{font.name}</span>
        </h3>
        <span className="font-heading text-xs text-flip bg-inv px-1.5 py-0.5 pixel-rounded-sm shrink-0 uppercase tracking-tight">
          {font.role}
        </span>
      </div>

      {/* ── Collapsible sections ── */}
      <div className="space-y-1">
        {/* About & Weights */}
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger>About & Weights</Collapsible.Trigger>
          <Collapsible.Content>
            <div className="space-y-3">
              <p className="text-sm text-sub leading-relaxed">{font.description}</p>
              <div className="space-y-0.5">
                {font.weights.map((w) => (
                  <div key={w.value} className="flex items-baseline justify-between gap-2">
                    <span className={`${font.className} text-base text-main leading-tight`} style={{ fontWeight: w.value }}>
                      The quick brown fox
                    </span>
                    <span className="font-mono text-xs text-mute shrink-0">{w.label} {w.value}</span>
                  </div>
                ))}
                {font.hasItalic && (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`${font.className} text-base text-main leading-tight italic`}>
                      The quick brown fox
                    </span>
                    <span className="font-mono text-xs text-mute shrink-0">Italic</span>
                  </div>
                )}
              </div>
            </div>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* CSS Reference */}
        <Collapsible.Root>
          <Collapsible.Trigger>CSS Reference</Collapsible.Trigger>
          <Collapsible.Content>
            <div className="space-y-1">
              <CopyableRow label="CSS VAR" value={`var(${font.cssVar})`} />
              <CopyableRow label="FAMILY" value={font.fontFamily} />
              <CopyableRow label="TAILWIND" value={font.tailwindClass} />
              <CopyableRow label="ELEMENTS" value={font.usage} />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    </div>
  );
}

function TypeScaleSection() {
  return (
    <div className="pixel-rounded-sm bg-page">
      <div className="px-5 py-3 border-b border-rule bg-depth flex items-baseline justify-between">
        <span className="font-heading text-xs text-mute uppercase tracking-tight">Type Scale</span>
        <span className="font-mono text-xs text-mute">tokens.css</span>
      </div>
      <div className="px-5 py-4 space-y-1">
        {TYPE_SCALE.map(({ token, label, rem, px }) => (
          <div key={token} className="flex items-baseline gap-4 py-1.5 border-b border-rule last:border-0">
            <span className="font-heading text-xs text-mute w-10 shrink-0 uppercase tracking-tight">{label}</span>
            <span className="font-mondwest text-main leading-none flex-1 truncate" style={{ fontSize: rem }}>
              Radiants Design System
            </span>
            <span className="font-mono text-xs text-mute shrink-0">{rem} / {px}px</span>
          </div>
        ))}
      </div>

      {/* Clamp note */}
      <div className="px-5 py-3 border-t border-rule bg-depth">
        <div className="flex items-start gap-3">
          <span className="font-heading text-xs text-flip bg-inv px-2 py-0.5 pixel-rounded-sm shrink-0 uppercase tracking-tight mt-0.5">Clamp</span>
          <div>
            <code>font-size: clamp(1rem, 1vw, 1.125rem)</code>
            <p className="mt-1 text-sm text-mute">Body scales fluidly 16–18px relative to viewport. Defined in base.css.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ElementStylesSection() {
  return (
    <div className="pixel-rounded-sm bg-page">
      <div className="px-5 py-3 border-b border-rule bg-depth flex items-baseline justify-between">
        <span className="font-heading text-xs text-mute uppercase tracking-tight">Element Styles</span>
        <span className="font-mono text-xs text-mute">typography.css</span>
      </div>
      {/* Column headers */}
      <div className="px-5 py-2 flex items-baseline gap-4 border-b border-rule bg-depth/50">
        <span className="font-heading text-xs text-mute uppercase tracking-tight w-16 shrink-0">Element</span>
        <span className="font-heading text-xs text-mute uppercase tracking-tight flex-1">Rendered</span>
        <span className="font-heading text-xs text-mute uppercase tracking-tight w-16 shrink-0 text-right">Size</span>
        <span className="font-heading text-xs text-mute uppercase tracking-tight w-12 shrink-0 text-right">Wt</span>
        <span className="font-heading text-xs text-mute uppercase tracking-tight w-16 shrink-0 text-right">Leading</span>
      </div>
      <div className="divide-y divide-rule">
        {ELEMENT_STYLES.map(({ el, font, fontClass, size, weight, leading }) => (
          <div key={el} className="px-5 py-2.5 flex items-baseline gap-4">
            <code className="w-16 shrink-0">&lt;{el}&gt;</code>
            <span className={`${fontClass} text-base text-main flex-1 truncate`} style={{ fontWeight: weight }}>
              {font} — {el === 'a' ? 'Hyperlink text' : el === 'label' ? 'Form label' : el === 'code' ? 'inline code' : el === 'pre' ? 'code block' : 'Heading text'}
            </span>
            <span className="font-mono text-xs text-mute w-16 shrink-0 text-right">{size}</span>
            <span className="font-mono text-xs text-mute w-12 shrink-0 text-right">{weight}</span>
            <span className="font-mono text-xs text-mute w-16 shrink-0 text-right">{leading}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeSpecimen({ font }: { font: typeof FONTS[0] }) {
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS = '0123456789';
  const SYMBOLS = '!@#$%&*()_+-=[]{}|;:\'",.<>?/~`';
  return (
    <div className="pixel-rounded-sm bg-page">
      <div className="px-5 py-3 border-b border-rule bg-depth flex items-baseline justify-between">
        <span className="font-heading text-xs text-mute uppercase tracking-tight">{font.shortName}</span>
        <span className="font-mono text-xs text-mute">{font.fontFamily.split(',')[0].replace(/'/g, '')}</span>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className={`${font.className} text-lg text-main leading-relaxed break-all tracking-wide`}>
          {UPPER}
        </div>
        <div className={`${font.className} text-lg text-main leading-relaxed break-all tracking-wide`}>
          {LOWER}
        </div>
        <div className={`${font.className} text-lg text-sub leading-relaxed break-all tracking-wide`}>
          {DIGITS}
        </div>
        <div className={`${font.className} text-base text-mute leading-relaxed break-all tracking-wide`}>
          {SYMBOLS}
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
    <div className="bg-page pixel-rounded-sm p-2">
      <Button size="sm" icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'} onClick={handleCopy} fullWidth className="justify-between mb-2">
        <span className="truncate">{sref.code}</span>
      </Button>
      <div className="grid grid-cols-2 gap-2">
        {sref.images.map((src, i) => (
          <div key={i} className="aspect-square bg-rule pixel-rounded-sm relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`AI generated image ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Tab Definitions
// ============================================================================

const ColorSwatchTabIcon = ({ size = 14 }: { size?: number }) => (
  <div className="flex gap-0.5">
    <div style={{ width: size * 0.5, height: size, backgroundColor: 'var(--color-ink)' }} className="border border-current rounded-sm" />
    <div style={{ width: size * 0.5, height: size, backgroundColor: 'var(--color-cream)' }} className="border border-current rounded-sm" />
    <div style={{ width: size * 0.5, height: size, backgroundColor: 'var(--color-sun-yellow)' }} className="border border-current rounded-sm" />
  </div>
);


// ============================================================================
// Main Component
// ============================================================================

export function BrandAssetsApp({ windowId }: AppProps) {
  const [logoFormat, setLogoFormat] = useState<'png' | 'svg'>('png');
  const [patColor, setPatColor] = useState('var(--color-ink)');
  const [patScale, setPatScale] = useState<1 | 2 | 3 | 4>(1);
  const [patBgColor, setPatBgColor] = useState('transparent');
  const [componentSearch, setComponentSearch] = useState('');
  const [componentCategory, setComponentCategory] = useState<ComponentCategory | 'all'>('all');

  const tabs = Tabs.useTabsState({ defaultValue: 'logos', layout: 'accordion', variant: 'pill' });

  return (
    <Tabs.Provider {...tabs}>
    {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-stage-gradient owner:design expires:2027-01-01 issue:DNA-001 */}
    <div className="h-full flex gap-1.5 px-1.5 pb-1.5 bg-gradient-to-b from-cream to-sun-yellow dark:from-page dark:to-page">
      {/* ── Left column: accordion nav ──────────────────────── */}
      <div className="flex flex-col shrink-0 w-44">
        <div className="relative z-10 -mr-[8px]">
          <Tabs.List className="bg-page pixel-rounded-l-sm space-y-0.5">
            <Tabs.Trigger value="logos" compact icon={<RadMarkIcon size={14} />}
              settings={
                <div className="flex items-center gap-2">
                  <span className={`font-heading text-xs uppercase tracking-tight ${logoFormat === 'png' ? 'text-main' : 'text-mute'}`}>
                    PNG
                  </span>
                  <Switch
                    checked={logoFormat === 'svg'}
                    onChange={(checked) => setLogoFormat(checked ? 'svg' : 'png')}
                    size="sm"
                  />
                  <span className={`font-heading text-xs uppercase tracking-tight ${logoFormat === 'svg' ? 'text-main' : 'text-mute'}`}>
                    SVG
                  </span>
                </div>
              }
            >
              01 Logos / Marks
            </Tabs.Trigger>
            <Tabs.Trigger value="colors" compact icon={<ColorSwatchTabIcon size={14} />}>
              02 Color Palette
            </Tabs.Trigger>
            <Tabs.Trigger value="fonts" compact icon={<FontAaIcon size={14} />}>
              03 Typography
            </Tabs.Trigger>
            <Tabs.Trigger value="components" compact icon={<Icon name="outline-box" size={14} />}
              settings={
                <div className="space-y-2">
                  <Input
                    value={componentSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComponentSearch(e.target.value)}
                    placeholder="Search..."
                    fullWidth
                  />
                  <div className="space-y-1.5">
                    <span className="font-heading text-xs text-mute uppercase block">Filter</span>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        quiet={componentCategory !== 'all'}
                        size="sm"
                        compact
                        onClick={() => setComponentCategory('all')}
                      >
                        All ({registry.length})
                      </Button>
                      {CATEGORIES.map((cat) => {
                        const count = registry.filter((e) => e.category === cat).length;
                        if (count === 0) return null;
                        return (
                          <Button
                            key={cat}
                            quiet={componentCategory !== cat}
                            size="sm"
                            compact
                            onClick={() => setComponentCategory(cat)}
                          >
                            {CATEGORY_LABELS[cat]} ({count})
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              }
            >
              04 UI Toolkit
            </Tabs.Trigger>
            <Tabs.Trigger value="patterns" compact icon={<Icon name="grid-3x3" size={14} />}
              settings={
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <span className="font-heading text-xs text-mute uppercase block">Pattern Color</span>
                    <div className="flex flex-wrap gap-1.5">
                      {RDNA_COLORS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          title={preset.label}
                          onClick={() => setPatColor(preset.value)}
                          className={`w-6 h-6 pixel-rounded-xs cursor-pointer transition-shadow ${
                            patColor === preset.value ? 'pixel-shadow-raised' : ''
                          }`}
                          style={{ backgroundColor: preset.value }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="font-heading text-xs text-mute uppercase block">Bg Color</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        title="Transparent"
                        onClick={() => setPatBgColor('transparent')}
                        className={`w-6 h-6 rounded-sm cursor-pointer transition-shadow border border-rule ${
                          patBgColor === 'transparent' ? 'pixel-shadow-raised' : ''
                        }`}
                        style={{ background: 'repeating-conic-gradient(var(--color-rule) 0% 25%, transparent 0% 50%) 50% / 8px 8px' }}
                      />
                      {RDNA_COLORS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          title={preset.label}
                          onClick={() => setPatBgColor(preset.value)}
                          className={`w-6 h-6 pixel-rounded-xs cursor-pointer transition-shadow ${
                            patBgColor === preset.value ? 'pixel-shadow-raised' : ''
                          }`}
                          style={{ backgroundColor: preset.value }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="font-heading text-xs text-mute uppercase block">Scale</span>
                    <ToggleGroup
                      value={[String(patScale)]}
                      onValueChange={(vals) => { if (vals.length) setPatScale(Number(vals[0]) as 1 | 2 | 3 | 4); }}
                      size="sm"
                    >
                      {SCALE_OPTIONS.map((opt) => (
                        <ToggleGroup.Item key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </ToggleGroup.Item>
                      ))}
                    </ToggleGroup>
                  </div>
                </div>
              }
            >
              05 Pixels//Patterns
            </Tabs.Trigger>
            <Tabs.Trigger value="ai-gen" compact icon={<Icon name="usericon" size={14} />}>
              06 AI Toolkit
            </Tabs.Trigger>
          </Tabs.List>
        </div>
      </div>

      {/* ── Content island ───────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full">
      <div className="pixel-rounded-sm-notl bg-page h-full">
        <div className="h-full overflow-y-auto overflow-x-hidden @container">

        {/* Logos */}
        {tabs.state.activeTab === 'logos' && (
          <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-2 p-5 h-full auto-rows-fr">
            {LOGOS.map((logo) => <LogoCard key={logo.id} logo={logo} format={logoFormat} />)}
          </div>
        )}

        {/* Colors */}
        {tabs.state.activeTab === 'colors' && (
          <div className="p-5 space-y-10">

            {/* ── Brand Palette ── */}
            <section className="space-y-4">
              <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
                <div>
                  <h2 className="text-main leading-tight">Brand Palette</h2>
                  <p className="text-sm text-mute mt-1">Tier 1 — raw values. Never use directly in component code.</p>
                </div>
                <span className="font-mono text-xs text-mute shrink-0">tokens.css</span>
              </div>
              <div className="grid grid-cols-1 @md:grid-cols-3 gap-3">
                {BRAND_COLORS.map((c, i) => <BrandColorCard key={c.hex} color={c} index={i} />)}
              </div>
            </section>

            {/* ── Extended Palette ── */}
            <section className="space-y-4">
              <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
                <div>
                  <h2 className="text-main leading-tight">Extended Palette</h2>
                  <p className="text-sm text-mute mt-1">Accent colors for status, links, and editorial moments.</p>
                </div>
                <span className="font-mono text-xs text-mute shrink-0">tokens.css</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EXTENDED_COLORS.map((c, i) => <ExtendedColorSwatch key={c.hex} color={c} index={i} />)}
              </div>
            </section>

            {/* ── Semantic Tokens ── */}
            <section className="space-y-4">
              <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
                <div>
                  <h2 className="text-main leading-tight">Semantic Tokens</h2>
                  <p className="text-sm text-mute mt-1">Tier 2 — flip in Sun/Moon mode. Click any row to copy the CSS variable.</p>
                </div>
                <span className="font-mono text-xs text-mute shrink-0">tokens.css / dark.css</span>
              </div>
              <div className="space-y-3">
                {SEMANTIC_CATEGORIES.map((cat, i) => (
                  <SemanticCategoryCard key={cat.name} category={cat} index={i} />
                ))}
              </div>
            </section>

          </div>
        )}

        {/* Fonts */}
        {tabs.state.activeTab === 'fonts' && (
          <div className="p-5 space-y-10">

            {/* ── Typefaces ── */}
            <section className="space-y-4">
              <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
                <div>
                  <h2 className="text-main leading-tight">Typefaces</h2>
                  <p className="text-sm text-mute mt-1">Three pixel-era fonts — one for display, one for reading, one for code.</p>
                </div>
                <span className="font-mono text-xs text-mute shrink-0">fonts.css</span>
              </div>
              <div className="grid grid-cols-1 @md:grid-cols-3 gap-3">
                {FONTS.map((font) => <FontCard key={font.name} font={font} />)}
              </div>
            </section>

            {/* ── Scale & Mapping ── */}
            <section className="space-y-4">
              <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
                <div>
                  <h2 className="text-main leading-tight">Scale & Mapping</h2>
                  <p className="text-sm text-mute mt-1">Seven-step size scale and how elements inherit font, weight, and leading.</p>
                </div>
                <span className="font-mono text-xs text-mute shrink-0">tokens.css / typography.css</span>
              </div>
              <TypeScaleSection />
              <ElementStylesSection />
            </section>

            {/* ── Glyph Specimens ── */}
            <section className="space-y-4">
              <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
                <div>
                  <h2 className="text-main leading-tight">Glyph Specimens</h2>
                  <p className="text-sm text-mute mt-1">Full character sets — uppercase, lowercase, digits, and symbols.</p>
                </div>
              </div>
              <div className="space-y-3">
                {FONTS.map((font) => <TypeSpecimen key={font.name} font={font} />)}
              </div>
            </section>

          </div>
        )}

        {/* Components */}
        {tabs.state.activeTab === 'components' && (
          <DesignSystemTab
            searchQuery={componentSearch}
            activeCategory={componentCategory}
            hideControls
          />
        )}

        {/* AI Gen */}
        {tabs.state.activeTab === 'ai-gen' && (
          <div className="p-5">
            <div className="text-center mb-6">
              <h2 className="mb-3">Midjourney Style Codes</h2>
              <p className="max-w-[42rem] mx-auto">
                Below is Radiant&apos;s SREF and personalization library. Copy the SREF codes to achieve the exact look provided. Utilize our personalization codes to add more *spice* to your generations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SREF_CODES.map((sref) => <SrefCard key={sref.id} sref={sref} />)}
            </div>
          </div>
        )}

        {/* Patterns */}
        {tabs.state.activeTab === 'patterns' && (
          <div className="p-5">
            <PatternsTab color={patColor} scale={patScale} bg={patBgColor !== 'transparent' ? patBgColor : undefined} />
          </div>
        )}
        </div>
      </div>
      </div>
    </div>
    </Tabs.Provider>
  );
}

export default BrandAssetsApp;
