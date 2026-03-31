'use client';

import { type AppProps } from '@/lib/apps';
import { AppWindow } from '@rdna/radiants/components/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  resolveFluid,
  lineHeight as lhScale,
  spacing,
} from '@rdna/radiants/patterns/pretext-type-scale';
import { hyphenateText } from '@rdna/radiants/patterns/pretext-hyphenation';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'rados-scratchpad';

const DEFAULT_CONTENT = `# Scratchpad

Welcome to **Scratchpad** — a live markdown editor powered by pretext typography.

## Features

- Fluid typography that scales with your window
- Syllable-level hyphenation for beautiful justified text
- Live preview as you type

## Getting Started

Start typing in the editor pane. Your changes appear in the preview in real-time, rendered with professional typographic layout. Paragraphs are automatically hyphenated and justified using the pretext engine, producing clean word breaks and even line lengths.

> "The details are not the details. They make the design." — Charles Eames

### Formatting

Write **bold** with double asterisks, *italic* with single asterisks, and \`inline code\` with backticks. Use \`#\` for headings, \`-\` for lists, \`>\` for quotes.

---

Happy writing!`;

// ============================================================================
// Markdown Parser
// ============================================================================

type MdBlock =
  | { kind: 'h'; level: 1 | 2 | 3; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'bq'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'hr' };

function parse(src: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  const lines = src.split('\n');
  let i = 0;

  while (i < lines.length) {
    const ln = lines[i]!;
    if (!ln.trim()) { i++; continue; }

    // Horizontal rule
    if (/^-{3,}$/.test(ln.trim())) { blocks.push({ kind: 'hr' }); i++; continue; }

    // Heading
    const hm = ln.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      blocks.push({ kind: 'h', level: hm[1]!.length as 1 | 2 | 3, text: hm[2]! });
      i++; continue;
    }

    // List item
    if (/^\s*[-*]\s+/.test(ln)) {
      blocks.push({ kind: 'li', text: ln.replace(/^\s*[-*]\s+/, '') });
      i++; continue;
    }

    // Blockquote
    if (ln.startsWith('>')) {
      blocks.push({ kind: 'bq', text: ln.replace(/^>\s*/, '') });
      i++; continue;
    }

    // Fenced code block
    if (ln.startsWith('```')) {
      const code: string[] = [];
      for (i++; i < lines.length && !lines[i]!.startsWith('```'); i++) {
        code.push(lines[i]!);
      }
      if (i < lines.length) i++;
      blocks.push({ kind: 'code', text: code.join('\n') });
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const pl: string[] = [ln];
    for (
      i++;
      i < lines.length &&
      lines[i]!.trim() &&
      !/^#{1,3}\s/.test(lines[i]!) &&
      !/^\s*[-*]\s/.test(lines[i]!) &&
      !lines[i]!.startsWith('>') &&
      !lines[i]!.startsWith('```') &&
      !/^-{3,}$/.test(lines[i]!.trim());
      i++
    ) {
      pl.push(lines[i]!);
    }
    blocks.push({ kind: 'p', text: pl.join(' ') });
  }

  return blocks;
}

// ============================================================================
// Inline Markdown Renderer (with optional pretext hyphenation)
// ============================================================================

function renderInline(text: string, hyphenate = false): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  const h = (s: string) => (hyphenate ? hyphenateText(s) : s);

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(h(text.slice(last, m.index)));
    if (m[2]) {
      parts.push(<strong key={k++}>{h(m[2])}</strong>);
    } else if (m[4]) {
      parts.push(<em key={k++}>{h(m[4])}</em>);
    } else if (m[6]) {
      parts.push(
        <code
          key={k++}
          className="px-1 py-0.5 bg-card text-accent"
          style={{ fontFamily: 'var(--font-pixel-code)', fontSize: '0.85em' }}
        >
          {m[6]}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(h(text.slice(last)));
  return parts.length > 0 ? parts : [h(text)];
}

// ============================================================================
// Component
// ============================================================================

export function ScratchpadApp({ windowId: _windowId }: AppProps) {
  const [content, setContent] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CONTENT;
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CONTENT;
  });

  const previewRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(400);

  // Persist content to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, content);
  }, [content]);

  // Track preview container width for fluid typography
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setCw(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const blocks = useMemo(() => parse(content), [content]);

  // Fluid sizes from pretext type scale
  const sz = {
    h1: resolveFluid('xl', cw),
    h2: resolveFluid('lg', cw),
    h3: resolveFluid('base', cw),
    body: resolveFluid('base', cw),
    code: resolveFluid('sm', cw),
  };
  const bodyLh = sz.body * lhScale.snug;
  const gap = bodyLh * spacing.paragraph;

  return (
    <AppWindow.Content layout="bleed">
      <div className="flex h-full">
        {/* ── Editor pane ── */}
        <div className="w-1/2 flex flex-col border-r border-line min-w-0">
          <div className="px-3 py-1.5 border-b border-line shrink-0">
            <span className="text-sm text-mute font-joystix">Edit</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 p-4 bg-page text-main resize-none outline-none min-w-0"
            style={{
              fontFamily: 'var(--font-pixel-code)',
              fontSize: sz.code,
              lineHeight: lhScale.relaxed,
              tabSize: 2,
            }}
            spellCheck={false}
          />
        </div>

        {/* ── Preview pane ── */}
        <div className="w-1/2 flex flex-col min-w-0">
          <div className="px-3 py-1.5 border-b border-line shrink-0">
            <span className="text-sm text-mute font-joystix">Preview</span>
          </div>
          <div ref={previewRef} className="flex-1 overflow-y-auto p-6 min-w-0">
            {blocks.map((b, i) => {
              switch (b.kind) {
                case 'h':
                  return (
                    <div
                      key={i}
                      className="text-head"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize:
                          b.level === 1
                            ? sz.h1
                            : b.level === 2
                              ? sz.h2
                              : sz.h3,
                        lineHeight: lhScale.none,
                        marginTop:
                          i > 0 ? bodyLh * spacing.headingBefore : 0,
                        marginBottom: bodyLh * spacing.headingAfter,
                      }}
                    >
                      {renderInline(b.text)}
                    </div>
                  );

                case 'p':
                  return (
                    <p
                      key={i}
                      className="text-main"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: sz.body,
                        lineHeight: lhScale.snug,
                        textAlign: 'justify',
                        hyphens: 'manual',
                        marginBottom: gap,
                      }}
                    >
                      {renderInline(b.text, true)}
                    </p>
                  );

                case 'li':
                  return (
                    <div
                      key={i}
                      className="flex gap-2 text-main"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: sz.body,
                        lineHeight: lhScale.snug,
                        marginBottom: gap * 0.5,
                      }}
                    >
                      <span className="text-accent shrink-0">*</span>
                      <span>{renderInline(b.text)}</span>
                    </div>
                  );

                case 'bq':
                  return (
                    <div
                      key={i}
                      className="border-l-2 border-accent pl-4 text-mute italic"
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: sz.body,
                        lineHeight: lhScale.relaxed,
                        marginBottom: gap,
                      }}
                    >
                      {renderInline(b.text)}
                    </div>
                  );

                case 'code':
                  return (
                    <pre
                      key={i}
                      className="bg-card p-4 overflow-x-auto text-accent"
                      style={{
                        fontFamily: 'var(--font-pixel-code)',
                        fontSize: sz.code,
                        lineHeight: lhScale.relaxed,
                        marginBottom: gap,
                      }}
                    >
                      {b.text}
                    </pre>
                  );

                case 'hr':
                  return (
                    <hr
                      key={i}
                      className="border-line"
                      style={{ marginTop: gap, marginBottom: gap }}
                    />
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      </div>
    </AppWindow.Content>
  );
}

export default ScratchpadApp;
