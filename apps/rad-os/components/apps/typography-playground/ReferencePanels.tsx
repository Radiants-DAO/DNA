'use client';

import React, { useState } from 'react';
import { Tooltip, Button } from '@rdna/radiants/components/core';
import { type FontEntry, TYPE_SCALE, ELEMENT_STYLES } from './typography-data';

// -- Shared copy helper --
function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <Tooltip content={copied ? 'Copied!' : 'Click to copy'}>
      {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:inline-copy-trigger owner:design-system expires:2026-12-31 issue:DNA-type-playground */}
      <button
        className="font-mono text-xs text-main hover:text-accent cursor-pointer text-left"
        onClick={handleCopy}
      >
        {copied ? 'Copied!' : value}
      </button>
    </Tooltip>
  );
}

// ===============================================
// LEFT PANELS (rules)
// ===============================================

export function TypeScalePanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="font-heading text-xs text-mute uppercase tracking-tight">
          Type Scale
        </div>
        <span className="font-mono text-xs text-mute">tokens.css</span>
      </div>
      <div className="space-y-0">
        {TYPE_SCALE.map(({ token, label, rem, px }) => (
          <div
            key={token}
            className="flex items-baseline gap-3 py-1.5 border-b border-rule last:border-0"
          >
            <span className="font-heading text-xs text-main w-8 shrink-0 uppercase tracking-tight">
              {label}
            </span>
            <CopyableValue value={`var(${token})`} />
            <span className="font-mono text-xs text-mute shrink-0 ml-auto">
              {rem} / {px}px
            </span>
          </div>
        ))}
      </div>
      <div className="p-2.5 bg-depth text-sm text-mute leading-relaxed">
        <span className="font-heading text-xs text-flip bg-inv px-1.5 py-0.5 pixel-rounded-sm uppercase tracking-tight mr-2">
          Clamp
        </span>
        Body scales fluidly 16-18px.{' '}
        <code className="text-xs">clamp(1rem, 1vw, 1.125rem)</code>
      </div>
    </div>
  );
}

export function ElementStylesPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="font-heading text-xs text-mute uppercase tracking-tight">
          Element Styles
        </div>
        <span className="font-mono text-xs text-mute">typography.css</span>
      </div>
      <div className="space-y-0">
        {ELEMENT_STYLES.map(({ el, font, size, weight, leading }) => (
          <div
            key={el}
            className="flex items-baseline gap-3 py-1.5 border-b border-rule last:border-0"
          >
            <code className="text-xs font-mono text-main w-14 shrink-0">
              &lt;{el}&gt;
            </code>
            <span className="text-xs text-sub flex-1">{font}</span>
            <span className="font-mono text-xs text-mute shrink-0">
              {size} / {weight} / {leading}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CssReferencePanel({ font }: { font: FontEntry }) {
  return (
    <div className="space-y-3">
      <div className="font-heading text-xs text-mute uppercase tracking-tight">
        CSS Reference
      </div>
      <div className="space-y-0">
        <div className="flex items-baseline justify-between py-1.5 border-b border-rule">
          <span className="font-heading text-xs text-mute uppercase tracking-tight">
            CSS Var
          </span>
          <CopyableValue value={`var(${font.cssVar})`} />
        </div>
        <div className="flex items-baseline justify-between py-1.5 border-b border-rule">
          <span className="font-heading text-xs text-mute uppercase tracking-tight">
            Family
          </span>
          <CopyableValue value={font.fontFamily} />
        </div>
        <div className="flex items-baseline justify-between py-1.5 border-b border-rule">
          <span className="font-heading text-xs text-mute uppercase tracking-tight">
            Tailwind
          </span>
          <CopyableValue value={font.tailwindClass} />
        </div>
        <div className="flex items-baseline justify-between py-1.5">
          <span className="font-heading text-xs text-mute uppercase tracking-tight">
            Elements
          </span>
          <span className="font-mono text-xs text-main">{font.usage}</span>
        </div>
      </div>
    </div>
  );
}

export function AboutFontPanel({ font }: { font: FontEntry }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="font-heading text-xs text-mute uppercase tracking-tight">
          About
        </div>
        <span className="font-mono text-xs text-mute">{font.source}</span>
      </div>
      <p className="text-sm text-sub leading-relaxed">{font.description}</p>
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">
          Weights
        </div>
        <div className="space-y-1">
          {font.weights.map((w) => (
            <div
              key={w.value}
              className="flex items-baseline justify-between py-1 border-b border-rule last:border-0"
            >
              <span
                className={`${font.className} text-base text-main`}
                style={{ fontWeight: w.value }}
              >
                The quick brown fox
              </span>
              <span className="font-mono text-xs text-mute shrink-0">
                {w.label} {w.value}
              </span>
            </div>
          ))}
          {font.hasItalic && (
            <div className="flex items-baseline justify-between py-1">
              <span className={`${font.className} text-base text-main italic`}>
                The quick brown fox
              </span>
              <span className="font-mono text-xs text-mute shrink-0">
                Italic
              </span>
            </div>
          )}
        </div>
      </div>
      {font.downloadUrl && (
        <Button
          size="sm"
          icon={font.linkOut ? 'globe' : 'download'}
          href={font.downloadUrl}
          target="_blank"
        >
          {font.linkOut
            ? `View at ${font.source}`
            : `Download ${font.shortName}`}
        </Button>
      )}
    </div>
  );
}

// ===============================================
// RIGHT PREVIEWS (demonstrations)
// ===============================================

/** Type Scale demo -- renders each scale step in the active font */
export function TypeScaleDemo({ font }: { font: FontEntry }) {
  return (
    <div className="h-full overflow-y-auto px-4 py-3 bg-page text-main">
      {TYPE_SCALE.map(({ label, rem }) => (
        <div key={label} className="py-2 border-b border-rule last:border-0">
          <span
            className={`${font.className} text-main leading-none`}
            style={{ fontSize: rem }}
          >
            Radiants Design System
          </span>
        </div>
      ))}
    </div>
  );
}

/** Element Styles demo -- renders each element in its mapped font/weight */
export function ElementStylesDemo() {
  return (
    <div className="h-full overflow-y-auto px-4 py-3 space-y-3 bg-page text-main">
      {ELEMENT_STYLES.map(({ el, fontClass, weight }) => (
        <div key={el} className="border-b border-rule pb-2 last:border-0">
          <code className="font-mono text-xs text-mute block mb-0.5">
            &lt;{el}&gt;
          </code>
          <span
            className={`${fontClass} text-main block`}
            style={{ fontWeight: weight }}
          >
            {el === 'code' || el === 'pre'
              ? 'const radiants = true;'
              : el === 'label'
                ? 'FORM LABEL'
                : 'The quick brown fox jumps over'}
          </span>
        </div>
      ))}
    </div>
  );
}

/** CSS Reference demo -- shows the font in action with copyable class snippets */
export function CssReferenceDemo({ font }: { font: FontEntry }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 gap-4 bg-page text-main">
      <span
        className={`${font.className} text-3xl text-main text-center leading-tight`}
      >
        AaBbCc
      </span>
      <div className="w-full space-y-2 font-mono text-xs text-mute">
        <div className="bg-depth p-2 border border-rule">
          className=&quot;
          <span className="text-main">{font.tailwindClass}</span>&quot;
        </div>
        <div className="bg-depth p-2 border border-rule">
          font-family:{' '}
          <span className="text-main">{font.fontFamily}</span>
        </div>
      </div>
    </div>
  );
}

/** About demo -- large specimen of the font */
export function AboutFontDemo({ font }: { font: FontEntry }) {
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS = '0123456789';
  return (
    <div className="h-full overflow-y-auto px-4 py-3 space-y-3 bg-page text-main">
      <div
        className={`${font.className} text-lg text-main leading-relaxed break-all tracking-wide`}
      >
        {UPPER}
      </div>
      <div
        className={`${font.className} text-lg text-main leading-relaxed break-all tracking-wide`}
      >
        {LOWER}
      </div>
      <div
        className={`${font.className} text-lg text-sub leading-relaxed break-all tracking-wide`}
      >
        {DIGITS}
      </div>
      <div
        className={`${font.className} text-base text-mute leading-relaxed break-all tracking-wide`}
      >
        {'!@#$%&*()_+-=[]{}|;:\'",.<>?/~`'}
      </div>
    </div>
  );
}
