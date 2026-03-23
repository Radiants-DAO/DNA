'use client';

import React, { useState } from 'react';
import { Tooltip, Button } from '@rdna/radiants/components/core';
import { type FontEntry, FONTS, TYPE_SCALE, ELEMENT_STYLES } from './typography-data';

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

function CopyableRow({ label, value, displayValue }: {
  label: string; value: string; displayValue?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:copy-row-interactive owner:design-system expires:2026-12-31 issue:DNA-type-playground
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

// ===============================================
// Font card — one per font in the scrolling area
// ===============================================

function FontCard({ font, index }: { font: FontEntry; index: number }) {
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS = '0123456789';

  return (
    <div className="pixel-rounded-sm">
      {/* Header */}
      <div className="bg-inv px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-flip/40">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-heading text-sm text-flip uppercase tracking-wide">
            {font.name}
          </span>
        </div>
        <span className="font-mono text-xs text-flip/60 shrink-0">
          {font.role}
        </span>
      </div>

      {/* Specimen */}
      <div className="px-4 py-4 space-y-2 border-b border-rule">
        <span className={`${font.className} text-3xl text-main leading-tight block`}>
          AaBbCc
        </span>
        <div className={`${font.className} text-sm text-sub leading-relaxed break-all tracking-wide`}>
          {UPPER}
        </div>
        <div className={`${font.className} text-sm text-sub leading-relaxed break-all tracking-wide`}>
          {LOWER}
        </div>
        <div className={`${font.className} text-xs text-mute leading-relaxed break-all tracking-wide`}>
          {DIGITS} {'!@#$%&*()-+=[]{}|;:\'",.?/'}
        </div>
      </div>

      {/* Weights */}
      <div className="px-4 py-3 border-b border-rule space-y-1">
        {font.weights.map((w) => (
          <div
            key={w.value}
            className="flex items-baseline justify-between"
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
          <div className="flex items-baseline justify-between">
            <span className={`${font.className} text-base text-main italic`}>
              The quick brown fox
            </span>
            <span className="font-mono text-xs text-mute shrink-0">
              Italic
            </span>
          </div>
        )}
      </div>

      {/* CSS Reference */}
      <div className="divide-y divide-rule">
        <CopyableRow label="CSS VAR" value={`var(${font.cssVar})`} />
        <CopyableRow label="FAMILY" value={font.fontFamily} />
        <CopyableRow label="TAILWIND" value={font.tailwindClass} displayValue={`className="${font.tailwindClass}"`} />
        <CopyableRow label="ELEMENTS" value={font.usage} />
      </div>

      {/* Download */}
      {font.downloadUrl && (
        <div className="px-4 py-3 border-t border-rule">
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
        </div>
      )}
    </div>
  );
}

// ===============================================
// Main layout — exported
// ===============================================

export function TypeManual() {
  return (
    <div className="flex h-full">
      {/* Left — scrollable sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-10">

        {/* ── Font Stack ── */}
        <section className="space-y-4">
          <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
            <div>
              <h2 className="text-main leading-tight">Font Stack</h2>
              <p className="text-sm text-mute mt-1">
                Three fonts — display, body, and code. Click any row to copy.
              </p>
            </div>
            <span className="font-mono text-xs text-mute shrink-0">fonts.css</span>
          </div>
          <div className="space-y-3">
            {FONTS.map((f, i) => (
              <FontCard key={f.cssVar} font={f} index={i} />
            ))}
          </div>
        </section>

        {/* ── Element Styles ── */}
        <section className="space-y-4">
          <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
            <div>
              <h2 className="text-main leading-tight">Element Styles</h2>
              <p className="text-sm text-mute mt-1">
                Default typographic styles applied to HTML elements via typography.css.
              </p>
            </div>
            <span className="font-mono text-xs text-mute shrink-0">typography.css</span>
          </div>
          <div className="pixel-rounded-sm">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2 bg-inv">
              <span className="font-mono text-xs text-flip/60 w-14 shrink-0">Element</span>
              <span className="font-mono text-xs text-flip/60 flex-1">Font</span>
              <span className="font-mono text-xs text-flip/60 shrink-0">Size / Weight / Leading</span>
            </div>
            <div className="divide-y divide-rule">
              {ELEMENT_STYLES.map(({ el, font, fontClass, size, weight, leading }) => (
                <div key={el} className="flex items-center gap-3 px-4 py-2.5">
                  <code className="text-xs font-mono text-main w-14 shrink-0">
                    &lt;{el}&gt;
                  </code>
                  <span className={`${fontClass} text-sm text-main flex-1`} style={{ fontWeight: weight }}>
                    {el === 'code' || el === 'pre'
                      ? 'const radiants = true;'
                      : el === 'label'
                        ? 'FORM LABEL'
                        : 'The quick brown fox'}
                  </span>
                  <span className="font-mono text-xs text-mute shrink-0">
                    {size} / {weight} / {leading}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Right — sticky reference sidebar */}
      <div className="w-[220px] shrink-0 border-l border-rule">
        <div className="sticky top-0 p-3 space-y-4">

          {/* Type Scale */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-heading text-xs text-mute uppercase tracking-tight">
                Type Scale
              </span>
              <span className="font-mono text-xs text-mute">tokens.css</span>
            </div>
            <div className="space-y-0">
              {TYPE_SCALE.map(({ token, label, rem, px }) => (
                <div
                  key={token}
                  className="flex items-baseline gap-2 py-1 border-b border-rule last:border-0"
                >
                  <span className="font-heading text-xs text-main w-7 shrink-0 uppercase tracking-tight">
                    {label}
                  </span>
                  <CopyableValue value={`var(${token})`} />
                  <span className="font-mono text-xs text-mute shrink-0 ml-auto">
                    {px}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-2 bg-depth text-xs text-mute leading-relaxed mt-2">
              <span className="font-heading text-xs text-flip bg-inv px-1 py-0.5 pixel-rounded-sm uppercase tracking-tight mr-1">
                Clamp
              </span>
              Body: <code className="text-xs">clamp(1rem, 1vw, 1.125rem)</code>
            </div>
          </div>

          {/* Font Stack quick ref */}
          <div>
            <span className="font-heading text-xs text-mute uppercase tracking-tight block mb-2">
              Quick Reference
            </span>
            <div className="space-y-0">
              {FONTS.map((f) => (
                <div
                  key={f.cssVar}
                  className="flex items-baseline justify-between py-1 border-b border-rule last:border-0"
                >
                  <span className={`${f.className} text-xs text-main`}>
                    {f.shortName}
                  </span>
                  <CopyableValue value={f.tailwindClass} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
