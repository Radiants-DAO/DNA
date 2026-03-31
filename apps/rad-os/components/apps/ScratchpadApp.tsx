'use client';

import { type AppProps } from '@/lib/apps';
import { AppWindow, Separator } from '@rdna/radiants/components/core';
import { useCallback, useEffect, useRef, useState } from 'react';
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
- Click any block to edit, click away to render

## Getting Started

Start by clicking any block of text. It reveals the raw markdown so you can edit it. Click away or press Escape to see your changes rendered with professional typographic layout. Paragraphs are automatically hyphenated and justified using the pretext engine.

> "The details are not the details. They make the design." — Charles Eames

### Formatting

Write **bold** with double asterisks, *italic* with single asterisks, and \`inline code\` with backticks. Use \`#\` for headings, \`-\` for lists, \`>\` for quotes.

---

Click below to start a new block.`;

// ============================================================================
// Block splitting — each semantic element becomes one editable block
// ============================================================================

function splitIntoBlocks(src: string): string[] {
  const result: string[] = [];
  const lines = src.split('\n');
  let current: string[] = [];
  let inCode = false;

  const flush = () => {
    if (current.length > 0) {
      result.push(current.join('\n'));
      current = [];
    }
  };

  for (const line of lines) {
    // Code fence toggle
    if (line.startsWith('```')) {
      if (inCode) {
        current.push(line);
        flush();
        inCode = false;
      } else {
        flush();
        current.push(line);
        inCode = true;
      }
      continue;
    }
    if (inCode) { current.push(line); continue; }

    // Blank line ends the current block
    if (line.trim() === '') { flush(); continue; }

    // Single-line block types get their own block
    if (
      /^#{1,3}\s/.test(line) ||
      /^\s*[-*]\s+/.test(line) ||
      line.startsWith('>') ||
      /^-{3,}$/.test(line.trim())
    ) {
      flush();
      result.push(line);
      continue;
    }

    // Paragraph continuation
    current.push(line);
  }
  flush();
  return result;
}

// ============================================================================
// Markdown block parser (single raw block → typed block)
// ============================================================================

type MdBlock =
  | { kind: 'h'; level: 1 | 2 | 3; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'bq'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'hr' };

function parseBlock(raw: string): MdBlock {
  const trimmed = raw.trim();

  if (/^-{3,}$/.test(trimmed)) return { kind: 'hr' };

  const hm = trimmed.match(/^(#{1,3})\s+(.+)/);
  if (hm) return { kind: 'h', level: hm[1]!.length as 1 | 2 | 3, text: hm[2]! };

  if (/^\s*[-*]\s+/.test(trimmed))
    return { kind: 'li', text: trimmed.replace(/^\s*[-*]\s+/, '') };

  if (trimmed.startsWith('>'))
    return { kind: 'bq', text: trimmed.replace(/^>\s*/, '') };

  if (trimmed.startsWith('```')) {
    const lines = trimmed.split('\n');
    return { kind: 'code', text: lines.slice(1, lines[lines.length - 1] === '```' ? -1 : undefined).join('\n') };
  }

  return { kind: 'p', text: trimmed.split('\n').join(' ') };
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
          className="px-1 py-0.5 bg-card text-accent text-sm"
          style={{ fontFamily: 'var(--font-pixel-code)' }}
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
// Block Renderer (view mode)
// ============================================================================

function RenderedBlock({
  block,
  sz,
  bodyLh,
  gap,
  isFirst,
}: {
  block: MdBlock;
  sz: { h1: number; h2: number; h3: number; body: number; code: number };
  bodyLh: number;
  gap: number;
  isFirst: boolean;
}) {
  switch (block.kind) {
    case 'h':
      return (
        <div
          className="text-head"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize:
              block.level === 1 ? sz.h1 : block.level === 2 ? sz.h2 : sz.h3,
            lineHeight: lhScale.none,
            marginTop: isFirst ? 0 : bodyLh * spacing.headingBefore,
            marginBottom: bodyLh * spacing.headingAfter,
          }}
        >
          {renderInline(block.text)}
        </div>
      );

    case 'p':
      return (
        <p
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
          {renderInline(block.text, true)}
        </p>
      );

    case 'li':
      return (
        <div
          className="flex gap-2 text-main"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: sz.body,
            lineHeight: lhScale.snug,
            marginBottom: gap * 0.5,
          }}
        >
          <span className="text-accent shrink-0">*</span>
          <span>{renderInline(block.text)}</span>
        </div>
      );

    case 'bq':
      return (
        <div
          className="border-l-2 border-accent pl-4 text-mute italic"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: sz.body,
            lineHeight: lhScale.relaxed,
            marginBottom: gap,
          }}
        >
          {renderInline(block.text)}
        </div>
      );

    case 'code':
      return (
        <pre
          className="bg-card p-4 overflow-x-auto text-accent"
          style={{
            fontFamily: 'var(--font-pixel-code)',
            fontSize: sz.code,
            lineHeight: lhScale.relaxed,
            marginBottom: gap,
          }}
        >
          {block.text}
        </pre>
      );

    case 'hr':
      return (
        <div style={{ marginTop: gap, marginBottom: gap }}>
          <Separator />
        </div>
      );

    default:
      return null;
  }
}

// ============================================================================
// Component
// ============================================================================

export function ScratchpadApp({ windowId: _windowId }: AppProps) {
  const [blocks, setBlocks] = useState<string[]>(() => {
    if (typeof window === 'undefined') return splitIntoBlocks(DEFAULT_CONTENT);
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? splitIntoBlocks(stored) : splitIntoBlocks(DEFAULT_CONTENT);
  });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const [cw, setCw] = useState(500);

  // Persist full markdown to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, blocks.join('\n\n'));
  }, [blocks]);

  // Container width for fluid typography
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setCw(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-focus and auto-size textarea when entering edit mode
  useEffect(() => {
    const el = editRef.current;
    if (!el || editIdx === null) return;
    el.focus();
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
    el.selectionStart = el.selectionEnd = el.value.length;
  }, [editIdx]);

  const startEdit = useCallback(
    (idx: number) => {
      setEditIdx(idx);
      setEditValue(blocks[idx]!);
    },
    [blocks],
  );

  const commitEdit = useCallback(() => {
    if (editIdx === null) return;
    const value = editValue;
    const idx = editIdx;

    setEditIdx(null);
    setEditValue('');

    if (!value.trim()) {
      setBlocks((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
      return;
    }

    // Re-split: if user introduced blank lines, it creates new blocks
    const newBlocks = splitIntoBlocks(value);
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(idx, 1, ...newBlocks);
      return next;
    });
  }, [editIdx, editValue]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        commitEdit();
      }
    },
    [commitEdit],
  );

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
    <AppWindow.Content>
      <div ref={containerRef} className="h-full overflow-y-auto p-6">
        <div className="max-w-[42rem] mx-auto">
          {blocks.map((raw, i) => {
            // ── Edit mode ──
            if (editIdx === i) {
              return (
                <div key={i} className="relative">
                  <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-accent" />
                  {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:full-pane-editor owner:design-system expires:2027-01-01 issue:DNA-scratchpad */}
                  <textarea
                    ref={editRef}
                    value={editValue}
                    onChange={handleInput}
                    onBlur={commitEdit}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-main outline-none resize-none block"
                    style={{
                      fontFamily: 'var(--font-pixel-code)',
                      fontSize: sz.code,
                      lineHeight: lhScale.relaxed,
                      minHeight: '1.5em',
                      marginBottom: gap,
                    }}
                    spellCheck={false}
                  />
                </div>
              );
            }

            // ── View mode ──
            const block = parseBlock(raw);
            return (
              <div
                key={i}
                onClick={() => startEdit(i)}
                className="group relative cursor-text"
              >
                <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-line opacity-0 group-hover:opacity-100 transition-opacity" />
                <RenderedBlock
                  block={block}
                  sz={sz}
                  bodyLh={bodyLh}
                  gap={gap}
                  isFirst={i === 0}
                />
              </div>
            );
          })}

          {/* Click below content to add a new block */}
          <div
            className="min-h-48 cursor-text text-mute opacity-0 hover:opacity-50 transition-opacity pt-4"
            style={{ fontFamily: 'var(--font-sans)', fontSize: sz.body }}
            onClick={() => {
              const newIdx = blocks.length;
              setBlocks((prev) => [...prev, '']);
              setTimeout(() => {
                setEditIdx(newIdx);
                setEditValue('');
              }, 0);
            }}
          >
            Click to add...
          </div>
        </div>
      </div>
    </AppWindow.Content>
  );
}

export default ScratchpadApp;
