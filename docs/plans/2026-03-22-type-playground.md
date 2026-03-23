# Type Playground Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Replace the static Typography tab in Brand Assets with an interactive type playground — one font at a time, editorial design templates with draggable text, all controls via ToggleGroups and Sliders.

**Worktree:** `.worktrees/type-playground` (branch `feat/type-playground`)

**Architecture:** Extract typography tab into a standalone `TypographyPlayground` component with local state. The "03 Typography" sidebar accordion expands to show sub-tab navigation (ToggleGroup). Each sub-tab renders a two-column layout: left column shows controls or reference data, right column shows a contextual live preview. The Playground sub-tab renders 8 editorial design templates (3 light, 5 dark) with absolute-positioned text elements wrapped in `react-draggable` for click/drag/move interactivity. No dropdowns anywhere — ToggleGroups for all selection controls.

**Tech Stack:** React 19, `@rdna/radiants` components (ToggleGroup, Slider, Collapsible, Tooltip, Button), Tailwind v4, `@base-ui/react` primitives, `react-draggable` (already installed).

---

## Research Summary

### Key files

| What | Path |
|------|------|
| Current Typography tab | `apps/rad-os/components/apps/BrandAssetsApp.tsx:542-1032` |
| Font data (FONTS array) | `apps/rad-os/components/apps/BrandAssetsApp.tsx:173-233` |
| Type scale data | `apps/rad-os/components/apps/BrandAssetsApp.tsx:235-243` |
| Element styles data | `apps/rad-os/components/apps/BrandAssetsApp.tsx:245-255` |
| ToggleGroup component | `packages/radiants/components/core/ToggleGroup/ToggleGroup.tsx` |
| Slider component | `packages/radiants/components/core/Slider/Slider.tsx` |
| Tabs component | `packages/radiants/components/core/Tabs/Tabs.tsx` |
| RDNA tokens | `packages/radiants/tokens.css`, `packages/radiants/typography.css` |
| react-draggable usage | `apps/rad-os/components/Rad_os/AppWindow.tsx:4` |

### Conventions

- **ToggleGroup single-select pattern:** `value={[activeValue]}` + `onValueChange={(v) => v.length && set(v[0])}`
- **Slider controlled pattern:** `<Slider value={n} onChange={setN} min={0} max={100} step={1} size="sm" />`
- **Accordion sub-items:** Use `settings` prop on `Tabs.Trigger` — renders collapsible content when that tab is active
- **No dropdowns rule:** All `<select>` elements become `<ToggleGroup>` with `size="sm"`
- **Container queries:** BrandAssetsApp content uses `@container` — use `@md:` prefix for responsive breakpoints within the window
- **react-draggable pattern:** Use `nodeRef` prop with `useRef` to avoid `findDOMNode` deprecation

### RDNA color tokens for templates

| Token | Class | Hex equivalent | Use in templates |
|-------|-------|----------------|------------------|
| `--color-cream` | `bg-page` | `#FEF8E2` | Light template backgrounds |
| `--color-sun-yellow` | `bg-accent` | `#FCE184` | Yellow backgrounds, highlight bars, glow |
| `--color-ink` | `bg-inv` | `#0F0E0C` | Dark template backgrounds |
| `--color-cream` | `text-flip` | `#FEF8E2` | Text on dark backgrounds |
| `--color-ink` | `text-main` | `#0F0E0C` | Text on light backgrounds |

### Template design source

8 editorial design templates exported from the user's design tool (CSS + screenshots). Each is a 1:1 square with absolute-positioned text and decorative elements:

**Light mode (3):**
1. **Editorial** — Cream bg, golden accent block top-right, vertical rule at ~50%, body text left, highlight bar bottom
2. **Editorial Alt** — Yellow bg, CSS half-circle top-left, vertical rule, body text right
3. **Display** — Yellow bg, huge headline (~60% of box), wordmark label, commentary

**Dark mode (5):**
4. **Statement** — Ink bg, centered Joystix headline
5. **Document** — Ink bg, title + body + numbered list
6. **Dictionary** — Ink bg, word + pronunciation + definition
7. **Quote** — Ink bg, large quote + attribution
8. **Poster** — Ink bg, mixed display type treatment

---

## Task 1: Extract typography data to shared module

**Files:**
- Create: `apps/rad-os/components/apps/typography-playground/typography-data.ts`

**Step 1: Create the data file**

Move `FONTS`, `TYPE_SCALE`, `ELEMENT_STYLES` arrays + their types out of `BrandAssetsApp.tsx` into a dedicated module. Add `FONT_KEYS` type, a lookup map, and template metadata.

```ts
// apps/rad-os/components/apps/typography-playground/typography-data.ts

export type FontKey = 'joystix' | 'mondwest' | 'pixelcode';

export interface FontEntry {
  name: string;
  shortName: string;
  role: string;
  usage: string;
  description: string;
  className: string;
  cssVar: string;
  fontFamily: string;
  tailwindClass: string;
  weights: { value: number; label: string }[];
  hasItalic: boolean;
  source: string;
  downloadUrl: string;
  linkOut: boolean;
}

export const FONTS: FontEntry[] = [
  {
    name: 'Joystix Monospace',
    shortName: 'Joystix',
    role: 'Display & Headings',
    usage: 'h1-h6, labels, captions, buttons',
    description: 'An open source pixel font -- bold and unapologetic. Use for headings, memes, and visual punch.',
    className: 'font-joystix',
    cssVar: '--font-heading',
    fontFamily: "'Joystix Monospace', monospace",
    tailwindClass: 'font-heading',
    weights: [{ value: 400, label: 'Regular' }],
    hasItalic: false,
    source: 'Open Source',
    downloadUrl: 'https://www.dropbox.com/scl/fi/h278kmyuvitljv92g0206/Bonkathon_Wordmark-PNG.zip?rlkey=nojnr6mipbpqwedomqgfarhoy&dl=1',
    linkOut: false,
  },
  {
    name: 'Mondwest',
    shortName: 'Mondwest',
    role: 'Body & Readability',
    usage: 'paragraphs, descriptions, long-form content',
    description: "Radiants' readable font for long-form content. Created by Pangram Pangram -- limited weights for non-commercial use.",
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
    downloadUrl: 'https://qwerasd205.github.io/PixelCode/',
    linkOut: false,
  },
];

/** Lookup by key */
export const FONT_MAP: Record<FontKey, FontEntry> = {
  joystix: FONTS[0],
  mondwest: FONTS[1],
  pixelcode: FONTS[2],
};

export const TYPE_SCALE = [
  { token: '--font-size-3xl',  label: '3XL',  rem: '2rem',     px: 32 },
  { token: '--font-size-2xl',  label: '2XL',  rem: '1.75rem',  px: 28 },
  { token: '--font-size-xl',   label: 'XL',   rem: '1.5rem',   px: 24 },
  { token: '--font-size-lg',   label: 'LG',   rem: '1.25rem',  px: 20 },
  { token: '--font-size-base', label: 'Base', rem: '1rem',     px: 16 },
  { token: '--font-size-sm',   label: 'SM',   rem: '0.75rem',  px: 12 },
  { token: '--font-size-xs',   label: 'XS',   rem: '0.5rem',   px: 8  },
] as const;

export const ELEMENT_STYLES = [
  { el: 'h1',    font: 'Joystix',    fontClass: 'font-joystix',  size: '4xl',  weight: 700, leading: 'tight' },
  { el: 'h2',    font: 'Joystix',    fontClass: 'font-joystix',  size: '3xl',  weight: 400, leading: 'tight' },
  { el: 'h3',    font: 'Joystix',    fontClass: 'font-joystix',  size: '2xl',  weight: 600, leading: 'snug' },
  { el: 'h4',    font: 'Joystix',    fontClass: 'font-joystix',  size: 'xl',   weight: 500, leading: 'snug' },
  { el: 'p',     font: 'Mondwest',   fontClass: 'font-mondwest', size: 'base', weight: 400, leading: 'relaxed' },
  { el: 'a',     font: 'Mondwest',   fontClass: 'font-mondwest', size: 'base', weight: 400, leading: 'normal' },
  { el: 'code',  font: 'PixelCode',  fontClass: 'font-mono',     size: 'sm',   weight: 400, leading: 'normal' },
  { el: 'pre',   font: 'PixelCode',  fontClass: 'font-mono',     size: 'sm',   weight: 400, leading: 'relaxed' },
  { el: 'label', font: 'Joystix',    fontClass: 'font-joystix',  size: 'xs',   weight: 500, leading: 'normal' },
] as const;

/** Template IDs */
export type TemplateId =
  | 'editorial' | 'editorial-alt' | 'display'
  | 'statement' | 'document' | 'dictionary' | 'quote' | 'poster';

export interface TemplateMeta {
  id: TemplateId;
  label: string;
  mode: 'light' | 'dark';
}

export const TEMPLATES: TemplateMeta[] = [
  // Light
  { id: 'editorial',     label: 'Editorial',   mode: 'light' },
  { id: 'editorial-alt', label: 'Edit. Alt',   mode: 'light' },
  { id: 'display',       label: 'Display',     mode: 'light' },
  // Dark
  { id: 'statement',     label: 'Statement',   mode: 'dark' },
  { id: 'document',      label: 'Document',    mode: 'dark' },
  { id: 'dictionary',    label: 'Dictionary',  mode: 'dark' },
  { id: 'quote',         label: 'Quote',       mode: 'dark' },
  { id: 'poster',        label: 'Poster',      mode: 'dark' },
];

/** Filter templates by mode */
export const getTemplatesForMode = (mode: 'light' | 'dark') =>
  TEMPLATES.filter((t) => t.mode === mode);
```

**Step 2: Commit**

```bash
git add apps/rad-os/components/apps/typography-playground/typography-data.ts
git commit -m "feat(type-playground): extract typography data to shared module"
```

---

## Task 2: Create TypographyPlayground shell with sub-tab navigation

**Files:**
- Create: `apps/rad-os/components/apps/typography-playground/TypographyPlayground.tsx`
- Create: `apps/rad-os/components/apps/typography-playground/index.ts`

**Step 1: Create the component with state and two-column layout**

This is the main container. It manages all playground state and renders the two-column layout. The sub-tab navigation lives in the sidebar via the `settings` prop (wired in Task 6).

```tsx
// apps/rad-os/components/apps/typography-playground/TypographyPlayground.tsx
'use client';

import React, { useState } from 'react';
import { ToggleGroup } from '@rdna/radiants/components/core';
import {
  type FontKey, type TemplateId,
  FONT_MAP, TEMPLATES, getTemplatesForMode,
} from './typography-data';

export type SubTab = 'playground' | 'scale' | 'elements' | 'css-ref' | 'about';

export function TypographyPlayground() {
  // -- Font state --
  const [activeFont, setActiveFont] = useState<FontKey>('mondwest');
  const font = FONT_MAP[activeFont];

  // -- Sub-tab state --
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('playground');

  // -- Template state --
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>('editorial');

  // -- Playground controls --
  const [size, setSize] = useState(34);
  const [leading, setLeading] = useState(12);
  const [spacing, setSpacing] = useState(0);
  const [weight, setWeight] = useState(400);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');

  // -- Mode switching selects first template of new mode --
  const switchMode = (m: 'light' | 'dark') => {
    setMode(m);
    const first = getTemplatesForMode(m)[0];
    if (first) setActiveTemplate(first.id);
  };

  // -- Font switching resets weight to first available --
  const switchFont = (key: FontKey) => {
    setActiveFont(key);
    setWeight(FONT_MAP[key].weights[0].value);
  };

  // -- Derived style object for template text --
  const previewStyle: React.CSSProperties = {
    fontSize: `${size}px`,
    lineHeight: (leading / 10).toFixed(1),
    letterSpacing: `${spacing / 100}em`,
    fontWeight: weight,
    textAlign: align,
  };

  return (
    <div className="flex h-full">
      {/* -- Left column -- */}
      <div className="w-[260px] shrink-0 overflow-y-auto border-r border-rule p-3 space-y-4">
        {/* Font picker -- always visible */}
        <div>
          <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">Font</div>
          <ToggleGroup
            value={[activeFont]}
            onValueChange={(v) => v.length && switchFont(v[0] as FontKey)}
            size="sm"
          >
            <ToggleGroup.Item value="joystix">Joystix</ToggleGroup.Item>
            <ToggleGroup.Item value="mondwest">Mondwest</ToggleGroup.Item>
            <ToggleGroup.Item value="pixelcode">PixelCode</ToggleGroup.Item>
          </ToggleGroup>
        </div>

        {/* Sub-tab content -- filled in Tasks 3-4 */}
        {activeSubTab === 'playground' && (
          <div>{/* PlaygroundControls -- Task 3 */}</div>
        )}
        {activeSubTab === 'scale' && (
          <div>{/* TypeScalePanel -- Task 4 */}</div>
        )}
        {activeSubTab === 'elements' && (
          <div>{/* ElementStylesPanel -- Task 4 */}</div>
        )}
        {activeSubTab === 'css-ref' && (
          <div>{/* CssReferencePanel -- Task 4 */}</div>
        )}
        {activeSubTab === 'about' && (
          <div>{/* AboutFontPanel -- Task 4 */}</div>
        )}
      </div>

      {/* -- Right column: preview -- */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 overflow-auto">
        <div className="w-full max-w-[420px] aspect-square border border-line overflow-hidden">
          {/* Preview content -- contextual per sub-tab, filled in Tasks 3-4 */}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create barrel export**

```ts
// apps/rad-os/components/apps/typography-playground/index.ts
export { TypographyPlayground } from './TypographyPlayground';
export type { SubTab } from './TypographyPlayground';
```

**Step 3: Verify it builds**

Run: `cd /path/to/monorepo && pnpm build --filter=rad-os`
Expected: Build succeeds with no type errors.

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/typography-playground/
git commit -m "feat(type-playground): scaffold TypographyPlayground shell with state"
```

---

## Task 3: Build Playground sub-tab (controls + template previews)

**Files:**
- Create: `apps/rad-os/components/apps/typography-playground/PlaygroundControls.tsx`
- Create: `apps/rad-os/components/apps/typography-playground/TemplatePreview.tsx`
- Modify: `apps/rad-os/components/apps/typography-playground/TypographyPlayground.tsx`

### Step 1: Create PlaygroundControls

Left-column content for the Playground sub-tab. Mode toggle filters which templates appear in the template picker.

```tsx
// apps/rad-os/components/apps/typography-playground/PlaygroundControls.tsx
'use client';

import React from 'react';
import { ToggleGroup, Slider } from '@rdna/radiants/components/core';
import { type FontEntry, type TemplateId, getTemplatesForMode } from './typography-data';

interface PlaygroundControlsProps {
  font: FontEntry;
  mode: 'light' | 'dark';
  onModeChange: (v: 'light' | 'dark') => void;
  activeTemplate: TemplateId;
  onTemplateChange: (v: TemplateId) => void;
  size: number;
  onSizeChange: (v: number) => void;
  leading: number;
  onLeadingChange: (v: number) => void;
  spacing: number;
  onSpacingChange: (v: number) => void;
  weight: number;
  onWeightChange: (v: number) => void;
  align: 'left' | 'center' | 'right';
  onAlignChange: (v: 'left' | 'center' | 'right') => void;
}

export function PlaygroundControls({
  font, mode, onModeChange, activeTemplate, onTemplateChange,
  size, onSizeChange, leading, onLeadingChange,
  spacing, onSpacingChange, weight, onWeightChange,
  align, onAlignChange,
}: PlaygroundControlsProps) {
  const templates = getTemplatesForMode(mode);

  return (
    <div className="space-y-4">
      {/* Mode (filters templates) */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">Mode</div>
        <ToggleGroup
          value={[mode]}
          onValueChange={(v) => v.length && onModeChange(v[0] as 'light' | 'dark')}
          size="sm"
        >
          <ToggleGroup.Item value="light">Sun</ToggleGroup.Item>
          <ToggleGroup.Item value="dark">Moon</ToggleGroup.Item>
        </ToggleGroup>
      </div>

      {/* Template picker */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">Template</div>
        <ToggleGroup
          value={[activeTemplate]}
          onValueChange={(v) => v.length && onTemplateChange(v[0] as TemplateId)}
          size="sm"
        >
          {templates.map((t) => (
            <ToggleGroup.Item key={t.id} value={t.id}>{t.label}</ToggleGroup.Item>
          ))}
        </ToggleGroup>
      </div>

      {/* Size */}
      <Slider label="Size" value={size} onChange={onSizeChange} min={8} max={120} step={1} size="sm" showValue />

      {/* Leading */}
      <div>
        <Slider label="Leading" value={leading} onChange={onLeadingChange} min={5} max={20} step={1} size="sm" />
        <div className="text-right font-mono text-xs text-mute mt-0.5">{(leading / 10).toFixed(1)}</div>
      </div>

      {/* Spacing */}
      <div>
        <Slider label="Spacing" value={spacing} onChange={onSpacingChange} min={-50} max={100} step={1} size="sm" />
        <div className="text-right font-mono text-xs text-mute mt-0.5">{spacing}</div>
      </div>

      {/* Weight */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">Weight</div>
        <ToggleGroup
          value={[String(weight)]}
          onValueChange={(v) => v.length && onWeightChange(Number(v[0]))}
          size="sm"
        >
          {font.weights.map((w) => (
            <ToggleGroup.Item key={w.value} value={String(w.value)}>{w.label}</ToggleGroup.Item>
          ))}
        </ToggleGroup>
      </div>

      {/* Align */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">Align</div>
        <ToggleGroup
          value={[align]}
          onValueChange={(v) => v.length && onAlignChange(v[0] as 'left' | 'center' | 'right')}
          size="sm"
        >
          <ToggleGroup.Item value="left">L</ToggleGroup.Item>
          <ToggleGroup.Item value="center">C</ToggleGroup.Item>
          <ToggleGroup.Item value="right">R</ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </div>
  );
}
```

### Step 2: Create TemplatePreview

One file with all 8 template render functions + a `DraggableText` helper + a dispatcher component. Each template is simple JSX with absolute-positioned elements. Text marked as "primary" receives the playground controls style. All text elements are `contentEditable` and wrapped in `DraggableText` for click/drag/move.

**Approach:** No abstraction layer. Each template is a plain function component ~15-25 lines of JSX. One shared `DraggableText` wrapper handles `react-draggable` + `nodeRef` + `contentEditable`.

```tsx
// apps/rad-os/components/apps/typography-playground/TemplatePreview.tsx
'use client';

import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { type FontEntry, type TemplateId } from './typography-data';

// -- Shared props for all templates --
interface TemplateProps {
  font: FontEntry;
  style: React.CSSProperties; // from playground controls (size, leading, spacing, weight, align)
}

// -- DraggableText wrapper --
// Handles nodeRef for React 19, contentEditable, and cursor styling.
function DraggableText({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Draggable bounds="parent" nodeRef={ref}>
      <div
        ref={ref}
        className={`cursor-move outline-none ${className}`}
        style={style}
        contentEditable
        suppressContentEditableWarning
      >
        {children}
      </div>
    </Draggable>
  );
}

// ================================================================
// LIGHT TEMPLATES
// ================================================================

/** Editorial -- cream bg, accent block, vertical rule, body text, highlight bar */
function Editorial({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-page text-main">
      {/* Accent image block */}
      <div
        className="absolute top-[8%] right-[8%] w-[35%] h-[38%] bg-accent"
        style={{ boxShadow: '0 0 120px 20px oklch(0.91 0.12 94 / 0.4)' }}
      />
      {/* Vertical rule */}
      <div className="absolute left-[50%] top-0 bottom-0 w-px bg-main/15" />
      {/* Primary body text */}
      <DraggableText
        className={`absolute top-[52%] left-[8%] w-[40%] ${font.className}`}
        style={style}
      >
        Meticulously crafted bitmap typeface for modern design systems
      </DraggableText>
      {/* Highlight bar */}
      <div className="absolute bottom-[10%] left-[8%] w-[20%] h-1 bg-accent" />
    </div>
  );
}

/** Editorial Alt -- yellow bg, half-circle, vertical rule, body text */
function EditorialAlt({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-accent text-main">
      {/* Half-circle decoration */}
      <div className="absolute top-[6%] left-[6%] w-[18%] aspect-square rounded-full bg-main/10" />
      {/* Vertical rule */}
      <div className="absolute left-[48%] top-0 bottom-0 w-px bg-main/15" />
      {/* Primary body text -- right side */}
      <DraggableText
        className={`absolute top-[30%] right-[8%] w-[42%] ${font.className}`}
        style={style}
      >
        Inspired by the classic Grotesks and Serifs of our era
      </DraggableText>
    </div>
  );
}

/** Display -- yellow bg, huge headline, wordmark, commentary */
function Display({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-accent text-main overflow-hidden">
      {/* Huge headline -- primary text, uses controls */}
      <DraggableText
        className={`absolute top-[15%] left-[8%] w-[84%] ${font.className} leading-none`}
        style={{ ...style, fontSize: `${Math.max(parseInt(String(style.fontSize)) * 2.5, 48)}px` }}
      >
        Ayyooooo
      </DraggableText>
      {/* Wordmark label */}
      <div className="absolute bottom-[18%] left-[8%] font-joystix text-xs uppercase tracking-tight text-main/60">
        Radiants Type System
      </div>
      {/* Commentary */}
      <DraggableText
        className={`absolute bottom-[8%] right-[8%] w-[50%] ${font.className} text-sm text-main/70`}
      >
        Three fonts. One system. Endless combinations.
      </DraggableText>
    </div>
  );
}

// ================================================================
// DARK TEMPLATES
// ================================================================

/** Statement -- ink bg, centered Joystix headline */
function Statement({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-inv text-flip">
      <DraggableText
        className={`absolute inset-[8%] flex items-center justify-center ${font.className} leading-tight`}
        style={{ ...style, fontSize: `${Math.max(parseInt(String(style.fontSize)) * 2, 36)}px` }}
      >
        TYPE IS THE VOICE OF THE PAGE
      </DraggableText>
    </div>
  );
}

/** Document -- ink bg, title + body + list */
function Document({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-inv text-flip p-[8%]">
      {/* Title */}
      <DraggableText
        className={`${font.className} text-xl font-bold mb-4`}
      >
        The Rad Public License
      </DraggableText>
      {/* Body -- primary text, uses controls */}
      <DraggableText
        className={`${font.className} mb-4`}
        style={style}
      >
        Permission is hereby granted, free of charge, to any person obtaining a copy of this typeface and associated documentation files.
      </DraggableText>
      {/* Numbered list */}
      <div className={`${font.className} space-y-1`} style={{ fontSize: style.fontSize, lineHeight: style.lineHeight }}>
        <div className="flex gap-3"><span className="text-flip/40 shrink-0">01</span><span>You may use, copy, and distribute</span></div>
        <div className="flex gap-3"><span className="text-flip/40 shrink-0">02</span><span>You may modify and create derivatives</span></div>
        <div className="flex gap-3"><span className="text-flip/40 shrink-0">03</span><span>Attribution is appreciated, not required</span></div>
      </div>
    </div>
  );
}

/** Dictionary -- ink bg, word + pronunciation + definition */
function Dictionary({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-inv text-flip p-[8%]">
      {/* Word -- primary text */}
      <DraggableText
        className={`${font.className} font-bold mb-1`}
        style={{ ...style, fontSize: `${Math.max(parseInt(String(style.fontSize)) * 1.8, 28)}px` }}
      >
        rad-i-ant
      </DraggableText>
      {/* Pronunciation */}
      <div className={`${font.className} text-sm text-flip/50 mb-4`}>
        /ˈreɪ.di.ənt/ &middot; adjective
      </div>
      {/* Definition -- uses controls */}
      <DraggableText
        className={`${font.className} mb-4`}
        style={style}
      >
        Sending out light; shining or glowing brightly. Clearly emanating great joy, love, or health.
      </DraggableText>
      {/* Usage */}
      <div className={`${font.className} text-sm text-flip/60 italic border-l-2 border-flip/20 pl-3`}>
        "The radiant glow of the pixel grid illuminated the workspace."
      </div>
    </div>
  );
}

/** Quote -- ink bg, large quote + attribution */
function Quote({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-inv text-flip p-[8%] flex flex-col justify-center">
      {/* Decorative quote mark */}
      <div className="font-joystix text-[80px] text-flip/10 leading-none mb-2">&ldquo;</div>
      {/* Quote text -- primary */}
      <DraggableText
        className={`${font.className} mb-6`}
        style={style}
      >
        Typography is the craft of endowing human language with a durable visual form.
      </DraggableText>
      {/* Attribution */}
      <div className="font-joystix text-xs text-flip/40 uppercase tracking-tight">
        -- Robert Bringhurst
      </div>
    </div>
  );
}

/** Poster -- ink bg, mixed display type */
function Poster({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-inv text-flip overflow-hidden">
      {/* Large display text */}
      <DraggableText
        className={`absolute top-[8%] left-[8%] w-[84%] font-joystix leading-none`}
        style={{ ...style, fontSize: `${Math.max(parseInt(String(style.fontSize)) * 2, 40)}px` }}
      >
        PIXEL
      </DraggableText>
      {/* Subtext */}
      <DraggableText
        className={`absolute top-[40%] left-[8%] w-[84%] ${font.className}`}
        style={style}
      >
        Perfect is the enemy of shipped. Every pixel tells a story.
      </DraggableText>
      {/* Bottom label */}
      <div className="absolute bottom-[8%] left-[8%] font-joystix text-xs uppercase tracking-tight text-flip/30">
        Radiants Design System / 2026
      </div>
      {/* Decorative accent line */}
      <div className="absolute bottom-[6%] right-[8%] w-[30%] h-px bg-accent/40" />
    </div>
  );
}

// ================================================================
// DISPATCHER
// ================================================================

const TEMPLATE_COMPONENTS: Record<TemplateId, React.FC<TemplateProps>> = {
  editorial: Editorial,
  'editorial-alt': EditorialAlt,
  display: Display,
  statement: Statement,
  document: Document,
  dictionary: Dictionary,
  quote: Quote,
  poster: Poster,
};

interface TemplatePreviewProps {
  templateId: TemplateId;
  font: FontEntry;
  style: React.CSSProperties;
}

export function TemplatePreview({ templateId, font, style }: TemplatePreviewProps) {
  const Component = TEMPLATE_COMPONENTS[templateId];
  return <Component font={font} style={style} />;
}
```

### Step 3: Wire into TypographyPlayground

Update `TypographyPlayground.tsx`:
- Import `PlaygroundControls` and `TemplatePreview`
- Replace placeholder left-column content with `<PlaygroundControls />`
- Replace placeholder preview with `<TemplatePreview />`

The key change in the preview box area:

```tsx
{/* -- Right column: preview -- */}
<div className="flex-1 flex flex-col items-center justify-center p-5 overflow-auto">
  <div className="w-full max-w-[420px] aspect-square border border-line overflow-hidden">
    {activeSubTab === 'playground' && (
      <TemplatePreview
        templateId={activeTemplate}
        font={font}
        style={previewStyle}
      />
    )}
    {/* Other sub-tab previews -- Task 4 */}
  </div>
</div>
```

### Step 4: Verify it builds

Run: `pnpm build --filter=rad-os`

### Step 5: Commit

```bash
git add apps/rad-os/components/apps/typography-playground/
git commit -m "feat(type-playground): add playground controls and 8 editorial template previews"
```

---

## Task 4: Build reference sub-tabs (Type Scale, Element Styles, CSS Reference, About)

**Files:**
- Create: `apps/rad-os/components/apps/typography-playground/ReferencePanels.tsx`
- Modify: `apps/rad-os/components/apps/typography-playground/TypographyPlayground.tsx`

**Step 1: Create all four reference panels + their preview demonstrations**

Each reference sub-tab follows the pattern: rules on the left, demonstration on the right. The preview box content changes to show a contextual demonstration relevant to what the left panel describes.

```tsx
// apps/rad-os/components/apps/typography-playground/ReferencePanels.tsx
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
        <div className="font-heading text-xs text-mute uppercase tracking-tight">Type Scale</div>
        <span className="font-mono text-xs text-mute">tokens.css</span>
      </div>
      <div className="space-y-0">
        {TYPE_SCALE.map(({ token, label, rem, px }) => (
          <div key={token} className="flex items-baseline gap-3 py-1.5 border-b border-rule last:border-0">
            <span className="font-heading text-xs text-main w-8 shrink-0 uppercase tracking-tight">{label}</span>
            <CopyableValue value={`var(${token})`} />
            <span className="font-mono text-xs text-mute shrink-0 ml-auto">{rem} / {px}px</span>
          </div>
        ))}
      </div>
      <div className="p-2.5 bg-depth text-sm text-mute leading-relaxed">
        <span className="font-heading text-xs text-flip bg-inv px-1.5 py-0.5 pixel-rounded-sm uppercase tracking-tight mr-2">Clamp</span>
        Body scales fluidly 16-18px. <code className="text-xs">clamp(1rem, 1vw, 1.125rem)</code>
      </div>
    </div>
  );
}

export function ElementStylesPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="font-heading text-xs text-mute uppercase tracking-tight">Element Styles</div>
        <span className="font-mono text-xs text-mute">typography.css</span>
      </div>
      <div className="space-y-0">
        {ELEMENT_STYLES.map(({ el, font, size, weight, leading }) => (
          <div key={el} className="flex items-baseline gap-3 py-1.5 border-b border-rule last:border-0">
            <code className="text-xs font-mono text-main w-14 shrink-0">&lt;{el}&gt;</code>
            <span className="text-xs text-sub flex-1">{font}</span>
            <span className="font-mono text-xs text-mute shrink-0">{size} / {weight} / {leading}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CssReferencePanel({ font }: { font: FontEntry }) {
  return (
    <div className="space-y-3">
      <div className="font-heading text-xs text-mute uppercase tracking-tight">CSS Reference</div>
      <div className="space-y-0">
        <div className="flex items-baseline justify-between py-1.5 border-b border-rule">
          <span className="font-heading text-xs text-mute uppercase tracking-tight">CSS Var</span>
          <CopyableValue value={`var(${font.cssVar})`} />
        </div>
        <div className="flex items-baseline justify-between py-1.5 border-b border-rule">
          <span className="font-heading text-xs text-mute uppercase tracking-tight">Family</span>
          <CopyableValue value={font.fontFamily} />
        </div>
        <div className="flex items-baseline justify-between py-1.5 border-b border-rule">
          <span className="font-heading text-xs text-mute uppercase tracking-tight">Tailwind</span>
          <CopyableValue value={font.tailwindClass} />
        </div>
        <div className="flex items-baseline justify-between py-1.5">
          <span className="font-heading text-xs text-mute uppercase tracking-tight">Elements</span>
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
        <div className="font-heading text-xs text-mute uppercase tracking-tight">About</div>
        <span className="font-mono text-xs text-mute">{font.source}</span>
      </div>
      <p className="text-sm text-sub leading-relaxed">{font.description}</p>
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">Weights</div>
        <div className="space-y-1">
          {font.weights.map((w) => (
            <div key={w.value} className="flex items-baseline justify-between py-1 border-b border-rule last:border-0">
              <span className={`${font.className} text-base text-main`} style={{ fontWeight: w.value }}>
                The quick brown fox
              </span>
              <span className="font-mono text-xs text-mute shrink-0">{w.label} {w.value}</span>
            </div>
          ))}
          {font.hasItalic && (
            <div className="flex items-baseline justify-between py-1">
              <span className={`${font.className} text-base text-main italic`}>The quick brown fox</span>
              <span className="font-mono text-xs text-mute shrink-0">Italic</span>
            </div>
          )}
        </div>
      </div>
      {font.downloadUrl && (
        <Button size="sm" icon={font.linkOut ? 'globe' : 'download'} href={font.downloadUrl} target="_blank">
          {font.linkOut ? `View at ${font.source}` : `Download ${font.shortName}`}
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
    <div className="h-full overflow-y-auto px-2 bg-page text-main">
      {TYPE_SCALE.map(({ label, rem }) => (
        <div key={label} className="py-2 border-b border-rule last:border-0">
          <span className={`${font.className} text-main leading-none`} style={{ fontSize: rem }}>
            Radiants Design System
          </span>
        </div>
      ))}
    </div>
  );
}

/** Element Styles demo -- renders each element in its mapped font/weight */
export function ElementStylesDemo({ font }: { font: FontEntry }) {
  return (
    <div className="h-full overflow-y-auto px-2 space-y-3 bg-page text-main">
      {ELEMENT_STYLES.map(({ el, fontClass, weight }) => (
        <div key={el} className="border-b border-rule pb-2 last:border-0">
          <code className="font-mono text-xs text-mute block mb-0.5">&lt;{el}&gt;</code>
          <span className={`${fontClass} text-main block`} style={{ fontWeight: weight }}>
            {el === 'code' || el === 'pre' ? 'const radiants = true;' : el === 'label' ? 'FORM LABEL' : 'The quick brown fox jumps over'}
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
      <span className={`${font.className} text-3xl text-main text-center leading-tight`}>
        AaBbCc
      </span>
      <div className="w-full space-y-2 font-mono text-xs text-mute">
        <div className="bg-depth p-2 border border-rule">
          className=&quot;<span className="text-main">{font.tailwindClass}</span>&quot;
        </div>
        <div className="bg-depth p-2 border border-rule">
          font-family: <span className="text-main">{font.fontFamily}</span>
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
    <div className="h-full overflow-y-auto px-2 space-y-3 bg-page text-main">
      <div className={`${font.className} text-lg text-main leading-relaxed break-all tracking-wide`}>{UPPER}</div>
      <div className={`${font.className} text-lg text-main leading-relaxed break-all tracking-wide`}>{LOWER}</div>
      <div className={`${font.className} text-lg text-sub leading-relaxed break-all tracking-wide`}>{DIGITS}</div>
      <div className={`${font.className} text-base text-mute leading-relaxed break-all tracking-wide`}>
        {'!@#$%&*()_+-=[]{}|;:\'",.<>?/~`'}
      </div>
    </div>
  );
}
```

**Step 2: Wire all panels and demos into TypographyPlayground**

Update `TypographyPlayground.tsx` to import all panels and demos, render the correct left-panel content per `activeSubTab`, and render the correct right-side preview per `activeSubTab`.

The key logic:
- `activeSubTab === 'playground'`: left = `<PlaygroundControls>`, right = `<TemplatePreview>`
- `activeSubTab === 'scale'`: left = `<TypeScalePanel>`, right = `<TypeScaleDemo>`
- `activeSubTab === 'elements'`: left = `<ElementStylesPanel>`, right = `<ElementStylesDemo>`
- `activeSubTab === 'css-ref'`: left = `<CssReferencePanel>`, right = `<CssReferenceDemo>`
- `activeSubTab === 'about'`: left = `<AboutFontPanel>`, right = `<AboutFontDemo>`

**Step 3: Verify it builds**

Run: `pnpm build --filter=rad-os`

**Step 4: Commit**

```bash
git add apps/rad-os/components/apps/typography-playground/
git commit -m "feat(type-playground): add reference panels with rules-left/demo-right pattern"
```

---

## Task 5: Create SubTabNav for sidebar accordion

**Files:**
- Create: `apps/rad-os/components/apps/typography-playground/SubTabNav.tsx`

**Step 1: Create the sub-tab navigation component**

This is rendered inside the `settings` prop of the Typography `Tabs.Trigger` in BrandAssetsApp. It provides the sub-item navigation within the accordion.

```tsx
// apps/rad-os/components/apps/typography-playground/SubTabNav.tsx
'use client';

import React from 'react';
import { type SubTab } from './TypographyPlayground';

interface SubTabNavProps {
  active: SubTab;
  onChange: (tab: SubTab) => void;
}

const SUB_TABS: { value: SubTab; label: string }[] = [
  { value: 'playground', label: 'Playground' },
  { value: 'scale', label: 'Type Scale' },
  { value: 'elements', label: 'Element Styles' },
  { value: 'css-ref', label: 'CSS Reference' },
  { value: 'about', label: 'About Font' },
];

export function SubTabNav({ active, onChange }: SubTabNavProps) {
  return (
    <div className="space-y-0.5">
      {SUB_TABS.map(({ value, label }) => (
        <button
          key={value}
          className={`w-full text-left px-2 py-1.5 font-heading text-xs uppercase tracking-tight transition-colors ${
            active === value
              ? 'text-main font-bold bg-page/50'
              : 'text-mute hover:text-sub hover:bg-page/30'
          }`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Export from barrel**

Add to `index.ts`:
```ts
export { SubTabNav } from './SubTabNav';
```

**Step 3: Commit**

```bash
git add apps/rad-os/components/apps/typography-playground/
git commit -m "feat(type-playground): add SubTabNav for sidebar accordion"
```

---

## Task 6: Lift sub-tab state and wire into BrandAssetsApp

**Files:**
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx`
- Modify: `apps/rad-os/components/apps/typography-playground/TypographyPlayground.tsx`

**Step 1: Add subTab prop to TypographyPlayground**

The sub-tab state needs to live in BrandAssetsApp so that `SubTabNav` (rendered in the sidebar `settings`) and `TypographyPlayground` (rendered in the content area) share the same state.

Update `TypographyPlayground` to accept `activeSubTab` and `onSubTabChange` as props instead of owning the state internally.

**Step 2: Update BrandAssetsApp**

1. Add imports at top:
```tsx
import { TypographyPlayground, SubTabNav, type SubTab } from '@/components/apps/typography-playground';
```

2. Add state in `BrandAssetsApp`:
```tsx
const [typoSubTab, setTypoSubTab] = useState<SubTab>('playground');
```

3. Update the `fonts` `Tabs.Trigger` to include `SubTabNav` in its `settings`:
```tsx
<Tabs.Trigger
  value="fonts"
  compact
  icon={<FontAaIcon size={14} />}
  settings={
    <SubTabNav active={typoSubTab} onChange={setTypoSubTab} />
  }
>
  Typography
</Tabs.Trigger>
```

4. Replace the old typography rendering block (`tabs.state.activeTab === 'fonts'`):
```tsx
{tabs.state.activeTab === 'fonts' && (
  <TypographyPlayground
    activeSubTab={typoSubTab}
    onSubTabChange={setTypoSubTab}
  />
)}
```

5. Remove old inline components that are now replaced:
   - `FontCard` function
   - `TypeScaleSection` function
   - `TypeSpecimen` function
   - `ElementStylesSection` function
   - The old `FONTS`, `TYPE_SCALE`, `ELEMENT_STYLES` arrays (now in `typography-data.ts`)

**Step 3: Verify it builds**

Run: `pnpm build --filter=rad-os`

**Step 4: Verify dev server**

Run: `pnpm dev` and check:
- Brand Assets window opens
- Typography tab shows sub-items in accordion
- Clicking sub-items switches left panel content
- Preview box updates contextually
- Template picker switches between editorial layouts
- Mode toggle (Sun/Moon) filters templates and auto-selects first
- Text in templates is draggable (click + drag to reposition)
- Text in templates is editable (click to type)
- All ToggleGroups work (font picker, template, weight, align, mode)
- Sliders work (size, leading, spacing)
- Adjusting controls updates text in template preview

**Step 5: Commit**

```bash
git add apps/rad-os/components/apps/BrandAssetsApp.tsx apps/rad-os/components/apps/typography-playground/
git commit -m "feat(type-playground): wire TypographyPlayground into BrandAssetsApp, remove old typography components"
```

---

## Task 7: Clean up and verify

**Files:**
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx` (remove dead code)

**Step 1: Run linter**

```bash
pnpm lint --filter=rad-os
pnpm lint:design-system
```

Fix any RDNA lint issues -- particularly:
- `rdna/no-hardcoded-colors` -- use semantic tokens, not raw hex in preview backgrounds. The templates use RDNA classes (`bg-page`, `bg-accent`, `bg-inv`, `text-main`, `text-flip`). The only inline color is the glow `boxShadow` in Editorial which uses `oklch()` -- this is acceptable since RDNA has no soft-glow token.
- `rdna/prefer-rdna-components` -- ensure no raw `<button>` or `<input>` elements leaked in (except `contentEditable` divs which are fine)

**Step 2: Check for unused imports**

Verify `BrandAssetsApp.tsx` no longer imports or references:
- `CopyableRow` (if it was only used by `FontCard`)
- Any removed component names

**Step 3: Final build check**

```bash
pnpm build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore(type-playground): lint fixes and dead code cleanup"
```

---

## Summary

| Task | What | Files touched |
|------|------|---------------|
| 1 | Extract typography data + template metadata | `typography-data.ts` (new) |
| 2 | Component shell + state | `TypographyPlayground.tsx`, `index.ts` (new) |
| 3 | Playground controls + 8 template previews | `PlaygroundControls.tsx`, `TemplatePreview.tsx` (new) |
| 4 | Reference panels (rules + demos) | `ReferencePanels.tsx` (new) |
| 5 | Sub-tab nav for sidebar | `SubTabNav.tsx` (new) |
| 6 | Wire into BrandAssetsApp | `BrandAssetsApp.tsx` (modify), lift state |
| 7 | Lint + cleanup | `BrandAssetsApp.tsx` (modify) |

**New files:** 6 (all in `apps/rad-os/components/apps/typography-playground/`)
**Modified files:** 1 (`BrandAssetsApp.tsx`)
**New dependencies:** None (`react-draggable` already installed)
**Deleted code:** ~200 lines of old inline components (`FontCard`, `TypeScaleSection`, `ElementStylesSection`, `TypeSpecimen`)

### Key design decisions

1. **Templates are plain JSX, not config-driven** -- each template is a ~15-25 line function component with absolute-positioned divs. No abstraction layer to maintain.
2. **`DraggableText` wrapper** -- one small helper handles `react-draggable` + `nodeRef` + `contentEditable` + cursor styling. All text in templates uses this.
3. **Mode toggle filters templates** -- Sun shows 3 light templates, Moon shows 5 dark templates. Auto-selects first template when mode changes.
4. **Existing RDNA styles only** -- `bg-page`, `bg-accent`, `bg-inv`, `text-main`, `text-flip`, `border-rule`. One inline `oklch()` glow on the Editorial template.
5. **Playground controls apply to primary text** -- the `previewStyle` object (size, leading, spacing, weight, align) is passed into each template and applied to the main text element.
