'use client';

import { useState } from 'react';
import { Tooltip } from '@rdna/radiants/components/core';

// ============================================================================
// Embedded CSS sources -- extracted from the actual source files
// ============================================================================

const TOKENS_CSS = `/* ============================================
   TYPOGRAPHY SCALE
   Font sizes for the pixel-art aesthetic
   ============================================ */

--font-size-xs: 0.625rem;    /* 10px - small labels */
--font-size-sm: 0.75rem;     /* 12px - buttons, small UI */
--font-size-base: 1rem;      /* 16px - body text (at max root) */
--font-size-lg: 1.25rem;     /* 20px - large body */
--font-size-xl: 1.5rem;      /* 24px - headings */
--font-size-2xl: 1.75rem;    /* 28px - headings */
--font-size-3xl: 2rem;       /* 32px - display */`;

const FONTS_CSS = `/* Font Family Theme Variables
   ------------------------------------------- */

@theme {
  /* Semantic font roles */
  --font-sans: 'Mondwest', system-ui, sans-serif;
  --font-heading: 'Joystix Monospace', monospace;
  --font-mono: 'PixelCode', monospace;

  /* Named brand aliases (font-mondwest, font-joystix) */
  --font-mondwest: 'Mondwest', system-ui, sans-serif;
  --font-joystix: 'Joystix Monospace', monospace;
}`;

const TYPOGRAPHY_CSS = `@layer base {
  /* ============================================
     HEADINGS
     All headings use font-heading (Joystix)
     ============================================ */

  h1 {
    @apply text-4xl font-heading font-bold leading-none tracking-tight text-main;
  }

  h2 {
    @apply text-3xl font-heading font-normal leading-none tracking-tight text-main;
  }

  h3 {
    @apply text-2xl font-heading font-semibold leading-none tracking-tight text-main;
  }

  h4 {
    @apply text-xl font-heading font-medium leading-none tracking-tight text-main;
  }

  h5 {
    @apply text-lg font-heading font-medium leading-none tracking-tight text-main;
  }

  h6 {
    @apply text-base font-heading font-medium leading-none tracking-tight text-main;
  }

  /* ============================================
     BODY TEXT
     Uses font-sans (Mondwest) for readability
     ============================================ */

  p {
    @apply text-base font-sans font-normal leading-snug tracking-tight text-main;
  }

  /* ============================================
     LINKS
     Uses font-sans with link color
     ============================================ */

  a {
    @apply text-base font-sans font-normal leading-normal text-link underline hover:opacity-80;
  }

  /* ============================================
     LISTS
     ============================================ */

  ul {
    @apply text-base font-heading font-normal leading-relaxed text-main pl-6;
  }

  ol {
    @apply text-base font-heading font-normal leading-relaxed text-main pl-6;
  }

  li {
    @apply text-base font-sans font-normal leading-relaxed text-main mb-2;
  }

  /* ============================================
     INLINE TEXT ELEMENTS
     ============================================ */

  small {
    @apply text-sm font-heading font-normal leading-none tracking-tight text-main;
  }

  strong {
    @apply text-base font-heading font-bold leading-normal text-main;
  }

  em {
    @apply text-base font-heading font-normal leading-normal text-main italic;
  }

  /* ============================================
     CODE ELEMENTS
     Uses font-mono (PixelCode)
     ============================================ */

  code {
    @apply text-xs font-mono font-normal leading-normal text-main bg-depth px-1 py-0.5 rounded-sm;
  }

  .dark code {
    @apply text-xs font-mono font-normal leading-normal text-action-primary bg-page px-2 py-1 rounded-sm border border-line;
  }

  pre {
    @apply text-sm font-mono font-normal leading-relaxed text-main bg-inv/10 p-4 rounded-sm overflow-x-auto;
  }

  kbd {
    @apply text-sm font-mono font-normal leading-normal text-flip bg-inv px-1 py-0.5 rounded-sm;
  }

  /* ============================================
     HIGHLIGHTS AND QUOTES
     ============================================ */

  mark {
    @apply text-base font-heading font-normal leading-normal text-main bg-action-primary;
  }

  blockquote {
    @apply text-base font-heading font-normal leading-relaxed text-main border-l-4 border-line pl-4 italic;
  }

  cite {
    @apply text-sm font-heading font-normal leading-normal text-main italic;
  }

  q {
    @apply text-base font-heading font-normal leading-normal text-main italic;
  }

  /* ============================================
     DEFINITIONS AND ABBREVIATIONS
     ============================================ */

  abbr {
    @apply text-base font-heading font-normal leading-normal text-main underline decoration-dotted;
  }

  dfn {
    @apply text-base font-heading font-normal leading-normal text-main italic;
  }

  /* ============================================
     SUBSCRIPT AND SUPERSCRIPT
     ============================================ */

  sub {
    @apply text-sm font-heading font-normal leading-none text-main;
  }

  sup {
    @apply text-sm font-heading font-normal leading-none text-main;
  }

  /* ============================================
     EDITS
     ============================================ */

  del {
    @apply text-base font-heading font-normal leading-normal text-main line-through;
  }

  ins {
    @apply text-base font-heading font-normal leading-normal text-main underline;
  }

  /* ============================================
     LABELS AND CAPTIONS
     ============================================ */

  caption {
    @apply text-sm font-heading font-normal leading-none tracking-tight text-main;
  }

  label {
    @apply text-sm font-heading font-medium leading-none tracking-tight text-main;
  }

  figcaption {
    @apply text-sm font-heading font-normal leading-none tracking-tight text-main;
  }
}`;

// ============================================================================
// Syntax highlighting
// ============================================================================

type TokenType = 'comment' | 'at-rule' | 'selector' | 'property' | 'value' | 'punctuation' | 'plain';

interface HighlightToken {
  type: TokenType;
  text: string;
}

function tokenizeCssLine(line: string): HighlightToken[] {
  const trimmed = line.trimStart();
  const indent = line.slice(0, line.length - trimmed.length);
  const tokens: HighlightToken[] = [];

  if (indent) {
    tokens.push({ type: 'plain', text: indent });
  }

  // Full-line comment
  if (trimmed.startsWith('/*')) {
    tokens.push({ type: 'comment', text: trimmed });
    return tokens;
  }

  // Comment continuation or end
  if (trimmed.startsWith('*') || trimmed.startsWith('===')) {
    tokens.push({ type: 'comment', text: trimmed });
    return tokens;
  }

  // @-rules (@apply, @layer, @theme, @font-face)
  if (trimmed.startsWith('@')) {
    tokens.push({ type: 'at-rule', text: trimmed });
    return tokens;
  }

  // Closing brace
  if (trimmed === '}') {
    tokens.push({ type: 'punctuation', text: trimmed });
    return tokens;
  }

  // Selector lines (end with { or are bare element names)
  if (trimmed.endsWith('{')) {
    tokens.push({ type: 'selector', text: trimmed });
    return tokens;
  }

  // .dark selector and similar
  if (trimmed.startsWith('.') && !trimmed.includes(':')) {
    tokens.push({ type: 'selector', text: trimmed });
    return tokens;
  }

  // CSS custom property (--something: value;)
  const customPropMatch = trimmed.match(/^(--[\w-]+)(\s*:\s*)(.+)$/);
  if (customPropMatch) {
    tokens.push({ type: 'property', text: customPropMatch[1] });
    tokens.push({ type: 'punctuation', text: customPropMatch[2] });
    // Split value from trailing comment
    const valueStr = customPropMatch[3];
    const commentIdx = valueStr.indexOf('/*');
    if (commentIdx !== -1) {
      tokens.push({ type: 'value', text: valueStr.slice(0, commentIdx).trimEnd() });
      tokens.push({ type: 'plain', text: ' ' });
      tokens.push({ type: 'comment', text: valueStr.slice(commentIdx) });
    } else {
      tokens.push({ type: 'value', text: valueStr });
    }
    return tokens;
  }

  // Bare element selector (h1, p, a, ul, etc.)
  if (/^[\w.#][\w\s,.#>+~:-]*$/.test(trimmed) && !trimmed.includes(';')) {
    tokens.push({ type: 'selector', text: trimmed });
    return tokens;
  }

  // Default: plain text
  tokens.push({ type: 'plain', text: trimmed });
  return tokens;
}

function getTokenClassName(type: TokenType): string {
  switch (type) {
    case 'comment':
      return 'text-mute';
    case 'at-rule':
      return 'text-accent font-bold';
    case 'selector':
      return 'text-main font-bold';
    case 'property':
      return 'text-main';
    case 'value':
      return 'text-accent';
    case 'punctuation':
      return 'text-sub';
    case 'plain':
    default:
      return 'text-main';
  }
}

// ============================================================================
// CodeBlock component
// ============================================================================

interface CodeBlockProps {
  filename: string;
  source: string;
  description: string;
}

function CodeBlock({ filename, source, description }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = source.split('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="pixel-rounded-sm">
      {/* Header */}
      <div className="bg-inv px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-flip">{filename}</span>
          <span className="font-mono text-xs text-flip/40">{description}</span>
        </div>
        <Tooltip content={copied ? 'Copied!' : 'Copy source'}>
          {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:inline-copy-trigger owner:design-system expires:2026-12-31 issue:DNA-001 */}
          <button
            type="button"
            onClick={handleCopy}
            className="font-mono text-xs text-flip/60 hover:text-flip cursor-pointer transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </Tooltip>
      </div>

      {/* Code area */}
      <div className="bg-depth overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => {
              const tokens = tokenizeCssLine(line);
              return (
                <tr key={i} className="hover:bg-hover/30 transition-colors">
                  <td className="text-right select-none px-3 py-0 font-mono text-xs text-mute/50 w-10 shrink-0 align-top leading-relaxed">
                    {i + 1}
                  </td>
                  <td className="px-3 py-0 font-mono text-xs leading-relaxed whitespace-pre">
                    {tokens.map((token, j) => (
                      <span key={j} className={getTokenClassName(token.type)}>
                        {token.text}
                      </span>
                    ))}
                    {line === '' && '\u00A0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// TypeStyles -- exported
// ============================================================================

export function TypeStyles() {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-8">
      {/* Intro */}
      <div className="border-b border-rule pb-3">
        <h2 className="text-main leading-tight">Type Styles</h2>
        <p className="text-sm text-mute mt-1">
          Source CSS for the RDNA type system. These are the files that define font tokens,
          font families, and element-level typography rules.
        </p>
      </div>

      {/* tokens.css -- typography scale */}
      <CodeBlock
        filename="tokens.css"
        description="Font size scale"
        source={TOKENS_CSS}
      />

      {/* fonts.css -- font family definitions */}
      <CodeBlock
        filename="fonts.css"
        description="Font families and theme variables"
        source={FONTS_CSS}
      />

      {/* typography.css -- element styles */}
      <CodeBlock
        filename="typography.css"
        description="Base element styles"
        source={TYPOGRAPHY_CSS}
      />
    </div>
  );
}
