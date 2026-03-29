# Pretext Standalone Panel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Build two standalone shadow DOM inspector panels (Typography + Text Wrap) that edit pretext layout parameters and copy the result as a JSON descriptor to the clipboard — reusing flow's UI patterns for future integration.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-pretext-panel` → branch `feat/pretext-panel`

**Architecture:** Vanilla TypeScript factory functions (no React) that inject into a ShadowRoot, matching flow's `createTypographyTool()` pattern exactly. Two panels: (1) a Typography panel for font/lineHeight/whiteSpace per text block, and (2) a Text Wrap panel for obstacles (wrap side, offsets, contour) + columns. Both panels share a theme CSS and element list. Output is pretext descriptor JSON to clipboard — no mutation engine, no live reflow. The tool maintains internal state as a plain JS object and serializes on copy.

**Tech Stack:** TypeScript, Vitest (happy-dom), Vite (IIFE bundle for injection), flow's `toolTheme.css` variables

**Depends on:**
- `@chenglou/pretext` types (referenced, not imported at runtime — the tool only builds parameter JSON)
- Flow's CSS variables and UI patterns (copied + adapted, not imported)

**Key reference files:**
- `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/modes/tools/typographyTool.ts` — factory pattern, section/scrub/input+unit patterns
- `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/modes/tools/effectsTool.ts` — slider + filled track pattern
- `/Users/rivermassey/Desktop/dev/sandbox/flow/packages/extension/src/content/modes/tools/toolTheme.css` — shared CSS variables
- `docs/plans/2026-03-28-pretext-editor-backend.md` — type definitions, descriptor format
- `ideas/brainstorms/2026-03-28-pretext-layout-editor-brainstorm.md` — architecture decisions
- `apps/rad-os/components/apps/GoodNewsApp.tsx` — first consumer (current pretext implementation)

---

### Task 1: Create Worktree + Project Shell

**Step 1: Create worktree and branch**

```bash
cd /Users/rivermassey/Desktop/dev/DNA
git worktree add ../DNA-pretext-panel -b feat/pretext-panel
```

**Step 2: Verify**

```bash
git worktree list
```

Expected: new entry at `../DNA-pretext-panel` on `feat/pretext-panel`.

All subsequent tasks run from `/Users/rivermassey/Desktop/dev/DNA-pretext-panel`.

**Step 3: Create directory structure**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
mkdir -p tools/pretext-panel/src
mkdir -p tools/pretext-panel/test
```

**Step 4: Create package.json**

Create `tools/pretext-panel/package.json`:

```json
{
  "name": "@rdna/pretext-panel",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "vite build"
  },
  "devDependencies": {
    "vitest": "^3.1.1",
    "happy-dom": "^17.4.4",
    "vite": "^6.3.3",
    "typescript": "^5.9.3"
  }
}
```

**Step 5: Create vitest config**

Create `tools/pretext-panel/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
});
```

**Step 6: Create tsconfig**

Create `tools/pretext-panel/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

**Step 7: Install dependencies**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm install
```

**Step 8: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/
git commit -m "feat(pretext-panel): scaffold standalone tool package"
```

---

### Task 2: Font String Parser — Decompose + Recompose

Pretext's `font` parameter is a canvas font shorthand: `"italic bold 16px Inter"`. The panel needs to decompose this into individual fields for editing, and recompose changes back into a valid font string.

**Files:**
- Create: `tools/pretext-panel/src/fontParser.ts`
- Test: `tools/pretext-panel/test/fontParser.test.ts`

**Step 1: Write the failing tests**

Create `tools/pretext-panel/test/fontParser.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseFont, composeFont } from '../src/fontParser';

describe('parseFont', () => {
  it('parses simple font string', () => {
    const result = parseFont('16px Inter');
    expect(result).toEqual({
      style: 'normal',
      weight: '400',
      size: 16,
      family: 'Inter',
    });
  });

  it('parses font with weight keyword', () => {
    const result = parseFont('bold 20px Georgia');
    expect(result).toEqual({
      style: 'normal',
      weight: '700',
      size: 20,
      family: 'Georgia',
    });
  });

  it('parses font with numeric weight', () => {
    const result = parseFont('600 14px Mondwest');
    expect(result).toEqual({
      style: 'normal',
      weight: '600',
      size: 14,
      family: 'Mondwest',
    });
  });

  it('parses font with style', () => {
    const result = parseFont('italic 18px serif');
    expect(result).toEqual({
      style: 'italic',
      weight: '400',
      size: 18,
      family: 'serif',
    });
  });

  it('parses font with style + weight + size + family', () => {
    const result = parseFont("italic 700 24px 'Waves Blackletter CPC'");
    expect(result).toEqual({
      style: 'italic',
      weight: '700',
      size: 24,
      family: "'Waves Blackletter CPC'",
    });
  });

  it('parses font with multi-family fallback stack', () => {
    const result = parseFont('20px "Iowan Old Style", "Palatino Linotype", Palatino, serif');
    expect(result).toEqual({
      style: 'normal',
      weight: '400',
      size: 20,
      family: '"Iowan Old Style", "Palatino Linotype", Palatino, serif',
    });
  });

  it('parses oblique style', () => {
    const result = parseFont('oblique 16px monospace');
    expect(result).toEqual({
      style: 'oblique',
      weight: '400',
      size: 16,
      family: 'monospace',
    });
  });

  it('parses fractional font size', () => {
    const result = parseFont('19.2px Mondwest');
    expect(result).toEqual({
      style: 'normal',
      weight: '400',
      size: 19.2,
      family: 'Mondwest',
    });
  });
});

describe('composeFont', () => {
  it('composes simple font', () => {
    expect(composeFont({ style: 'normal', weight: '400', size: 16, family: 'Inter' }))
      .toBe('16px Inter');
  });

  it('includes weight when non-400', () => {
    expect(composeFont({ style: 'normal', weight: '700', size: 20, family: 'Georgia' }))
      .toBe('700 20px Georgia');
  });

  it('includes style when non-normal', () => {
    expect(composeFont({ style: 'italic', weight: '400', size: 18, family: 'serif' }))
      .toBe('italic 18px serif');
  });

  it('includes style and weight', () => {
    expect(composeFont({ style: 'italic', weight: '700', size: 24, family: "'Waves Blackletter CPC'" }))
      .toBe("italic 700 24px 'Waves Blackletter CPC'");
  });

  it('roundtrips a parsed font', () => {
    const original = "italic 600 19.2px Mondwest";
    expect(composeFont(parseFont(original))).toBe(original);
  });
});
```

**Step 2: Run to verify failure**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/fontParser.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement**

Create `tools/pretext-panel/src/fontParser.ts`:

```ts
/**
 * Decompose / recompose CSS canvas font shorthand strings.
 *
 * Format: [font-style] [font-weight] <font-size>px <font-family>
 *
 * Pretext requires this exact format for prepare() / prepareWithSegments().
 * Canvas measureText only accepts px units for size.
 */

export interface ParsedFont {
  style: 'normal' | 'italic' | 'oblique';
  weight: string;   // '100'–'900'
  size: number;      // px
  family: string;    // May include quotes and fallback stack
}

const STYLE_KEYWORDS = new Set(['normal', 'italic', 'oblique']);
const WEIGHT_KEYWORDS: Record<string, string> = {
  normal: '400',
  bold: '700',
  lighter: '300',
  bolder: '700',
};
const NUMERIC_WEIGHT_RE = /^[1-9]00$/;
const SIZE_RE = /(\d+(?:\.\d+)?)px/;

/**
 * Parse a canvas font shorthand into its components.
 *
 * Handles: "italic bold 16px Inter", "20px serif", "600 19.2px 'Mondwest'"
 */
export function parseFont(font: string): ParsedFont {
  let style: ParsedFont['style'] = 'normal';
  let weight = '400';

  // Find the size+px — everything after it is the family
  const sizeMatch = font.match(SIZE_RE);
  if (!sizeMatch) {
    // Fallback: return defaults with the whole string as family
    return { style: 'normal', weight: '400', size: 16, family: font.trim() };
  }

  const size = parseFloat(sizeMatch[1]!);
  const sizeIndex = font.indexOf(sizeMatch[0]!);

  // Everything before size is style/weight tokens
  const prefix = font.slice(0, sizeIndex).trim();
  // Everything after "Npx " is the family
  const family = font.slice(sizeIndex + sizeMatch[0]!.length).trim();

  if (prefix) {
    const tokens = prefix.split(/\s+/);
    for (const token of tokens) {
      if (STYLE_KEYWORDS.has(token) && token !== 'normal') {
        style = token as ParsedFont['style'];
      } else if (token in WEIGHT_KEYWORDS) {
        weight = WEIGHT_KEYWORDS[token]!;
      } else if (NUMERIC_WEIGHT_RE.test(token)) {
        weight = token;
      }
    }
  }

  return { style, weight, size, family };
}

/**
 * Recompose a ParsedFont back into a canvas font shorthand string.
 *
 * Omits style when 'normal' and weight when '400' for brevity —
 * canvas font parsing treats missing values as defaults.
 */
export function composeFont(parsed: ParsedFont): string {
  const parts: string[] = [];
  if (parsed.style !== 'normal') parts.push(parsed.style);
  if (parsed.weight !== '400') parts.push(parsed.weight);
  parts.push(`${parsed.size}px`);
  parts.push(parsed.family);
  return parts.join(' ');
}
```

**Step 4: Run tests**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/fontParser.test.ts
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/src/fontParser.ts tools/pretext-panel/test/fontParser.test.ts
git commit -m "feat(pretext-panel): add canvas font string parser + recomposer"
```

---

### Task 3: Types + Descriptor Schema

Define the pretext descriptor types and the serialization function. These types model the output format — what gets copied to clipboard.

**Files:**
- Create: `tools/pretext-panel/src/types.ts`
- Create: `tools/pretext-panel/src/descriptor.ts`
- Test: `tools/pretext-panel/test/descriptor.test.ts`

**Step 1: Write the failing test**

Create `tools/pretext-panel/test/descriptor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildDescriptor, type PretextState } from '../src/descriptor';

const SAMPLE_STATE: PretextState = {
  columns: [
    { id: 'left', x: 16, width: 180 },
    { id: 'center', x: 210, width: 340 },
  ],
  obstacles: [
    {
      id: 'logo',
      kind: 'geometric',
      contour: 'polygon',
      bounds: { x: 16, y: 600, width: 200, height: 200 },
      wrap: 'both',
      offsets: { top: 8, right: 8, bottom: 8, left: 8 },
    },
    {
      id: 'dropcap',
      kind: 'dropcap',
      character: 'G',
      font: "64px 'Waves Blackletter CPC'",
      lineCount: 3,
    },
  ],
  textBlocks: [
    { id: 'body', font: '16px Mondwest', lineHeight: 19.2, whiteSpace: 'normal' },
  ],
};

describe('buildDescriptor', () => {
  it('returns version 1', () => {
    const desc = buildDescriptor(SAMPLE_STATE);
    expect(desc.version).toBe(1);
  });

  it('includes all columns', () => {
    const desc = buildDescriptor(SAMPLE_STATE);
    expect(desc.columns).toHaveLength(2);
    expect(desc.columns[0]).toEqual({ id: 'left', x: 16, width: 180 });
  });

  it('includes geometric obstacles with all fields', () => {
    const desc = buildDescriptor(SAMPLE_STATE);
    const logo = desc.obstacles.find((o: Record<string, unknown>) => o.id === 'logo');
    expect(logo).toEqual({
      id: 'logo',
      contour: 'polygon',
      bounds: { x: 16, y: 600, width: 200, height: 200 },
      wrap: 'both',
      offsets: { top: 8, right: 8, bottom: 8, left: 8 },
    });
  });

  it('includes named obstacles (dropcap)', () => {
    const desc = buildDescriptor(SAMPLE_STATE);
    const dropcap = desc.obstacles.find((o: Record<string, unknown>) => o.id === 'dropcap');
    expect(dropcap).toEqual({
      id: 'dropcap',
      type: 'dropcap',
      character: 'G',
      font: "64px 'Waves Blackletter CPC'",
      lineCount: 3,
    });
  });

  it('includes text blocks', () => {
    const desc = buildDescriptor(SAMPLE_STATE);
    expect(desc.textBlocks[0]).toEqual({
      id: 'body',
      font: '16px Mondwest',
      lineHeight: 19.2,
      whiteSpace: 'normal',
    });
  });

  it('produces valid JSON', () => {
    const desc = buildDescriptor(SAMPLE_STATE);
    const json = JSON.stringify(desc, null, 2);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
```

**Step 2: Run to verify failure**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/descriptor.test.ts
```

Expected: FAIL — module not found.

**Step 3: Create types**

Create `tools/pretext-panel/src/types.ts`:

```ts
/**
 * Pretext panel types — models the descriptor that gets copied to clipboard.
 *
 * These types parallel @chenglou/pretext's API surface but are independent —
 * the panel doesn't import pretext at runtime, it just builds parameter JSON.
 */

// ── Wrap ──

export type WrapSide = 'leftSide' | 'rightSide' | 'both' | 'largestArea';

export type ContourType = 'boundingBox' | 'circle' | 'polygon';

export interface Offsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Obstacles ──

/** Geometric obstacle — rect, circle, or polygon contour */
export interface GeometricObstacle {
  id: string;
  kind: 'geometric';
  contour: ContourType;
  bounds: Bounds;
  wrap: WrapSide;
  offsets: Offsets;
  // Circle-specific (only when contour === 'circle')
  cx?: number;
  cy?: number;
  radius?: number;
}

/** Drop cap — named obstacle */
export interface DropcapObstacle {
  id: string;
  kind: 'dropcap';
  character: string;
  font: string;
  lineCount: number;
}

/** Pull quote — named obstacle */
export interface PullquoteObstacle {
  id: string;
  kind: 'pullquote';
  text: string;
  font: string;
  maxWidth: number;
  wrap: WrapSide;
  offsets: Offsets;
}

export type Obstacle = GeometricObstacle | DropcapObstacle | PullquoteObstacle;

// ── Columns ──

export interface Column {
  id: string;
  x: number;
  width: number;
}

// ── Text Blocks ──

export type WhiteSpaceMode = 'normal' | 'pre-wrap';

export interface TextBlock {
  id: string;
  font: string;          // Canvas font shorthand
  lineHeight: number;    // px
  whiteSpace: WhiteSpaceMode;
  maxColumnHeight?: number;  // px, optional
}

// ── Descriptor ──

export interface PretextDescriptor {
  version: 1;
  columns: Array<{ id: string; x: number; width: number }>;
  obstacles: Array<Record<string, unknown>>;
  textBlocks: Array<{
    id: string;
    font: string;
    lineHeight: number;
    whiteSpace: WhiteSpaceMode;
    maxColumnHeight?: number;
  }>;
}
```

**Step 4: Implement descriptor builder**

Create `tools/pretext-panel/src/descriptor.ts`:

```ts
import type {
  Obstacle,
  Column,
  TextBlock,
  PretextDescriptor,
  GeometricObstacle,
  DropcapObstacle,
  PullquoteObstacle,
} from './types';

/** Full panel state — internal representation */
export interface PretextState {
  columns: Column[];
  obstacles: Obstacle[];
  textBlocks: TextBlock[];
}

/**
 * Build a clean descriptor for clipboard export.
 * Strips internal-only fields (kind) and reshapes for LLM consumption.
 */
export function buildDescriptor(state: PretextState): PretextDescriptor {
  return {
    version: 1,
    columns: state.columns.map(c => ({
      id: c.id,
      x: c.x,
      width: c.width,
    })),
    obstacles: state.obstacles.map(serializeObstacle),
    textBlocks: state.textBlocks.map(t => {
      const block: PretextDescriptor['textBlocks'][number] = {
        id: t.id,
        font: t.font,
        lineHeight: t.lineHeight,
        whiteSpace: t.whiteSpace,
      };
      if (t.maxColumnHeight !== undefined) {
        block.maxColumnHeight = t.maxColumnHeight;
      }
      return block;
    }),
  };
}

function serializeObstacle(obs: Obstacle): Record<string, unknown> {
  switch (obs.kind) {
    case 'geometric': {
      const o = obs as GeometricObstacle;
      const result: Record<string, unknown> = {
        id: o.id,
        contour: o.contour,
        bounds: { ...o.bounds },
        wrap: o.wrap,
        offsets: { ...o.offsets },
      };
      if (o.contour === 'circle') {
        result.cx = o.cx;
        result.cy = o.cy;
        result.radius = o.radius;
      }
      return result;
    }
    case 'dropcap': {
      const o = obs as DropcapObstacle;
      return {
        id: o.id,
        type: 'dropcap',
        character: o.character,
        font: o.font,
        lineCount: o.lineCount,
      };
    }
    case 'pullquote': {
      const o = obs as PullquoteObstacle;
      return {
        id: o.id,
        type: 'pullquote',
        text: o.text,
        font: o.font,
        maxWidth: o.maxWidth,
        wrap: o.wrap,
        offsets: { ...o.offsets },
      };
    }
  }
}

/** Copy descriptor JSON to clipboard */
export async function copyDescriptorToClipboard(state: PretextState): Promise<void> {
  const desc = buildDescriptor(state);
  const json = JSON.stringify(desc, null, 2);
  await navigator.clipboard.writeText(json);
}
```

**Step 5: Run tests**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/descriptor.test.ts
```

Expected: all tests PASS.

**Step 6: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/src/types.ts tools/pretext-panel/src/descriptor.ts tools/pretext-panel/test/descriptor.test.ts
git commit -m "feat(pretext-panel): add types and descriptor builder"
```

---

### Task 4: Shared UI Foundations — Theme CSS + Section Factory + Scrub Helper

Port the core UI building blocks from flow's tool patterns. These are the primitives used by both panels.

**Files:**
- Create: `tools/pretext-panel/src/theme.css`
- Create: `tools/pretext-panel/src/ui.ts`
- Test: `tools/pretext-panel/test/ui.test.ts`

**Step 1: Write the failing test**

Create `tools/pretext-panel/test/ui.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createSection, createInputRow, createDropdownRow, createToggleRow, createGridRow } from '../src/ui';

describe('createSection', () => {
  it('returns section with header and body', () => {
    const { section, body } = createSection('Test Section');
    expect(section.className).toBe('pt-section');
    expect(section.querySelector('.pt-header')).toBeTruthy();
    expect(body.className).toBe('pt-body');
  });

  it('toggles collapsed on header click', () => {
    const { section } = createSection('Test');
    const header = section.querySelector('.pt-header') as HTMLElement;
    header.click();
    expect(section.classList.contains('collapsed')).toBe(true);
    header.click();
    expect(section.classList.contains('collapsed')).toBe(false);
  });

  it('starts collapsed when option is true', () => {
    const { section } = createSection('Test', true);
    expect(section.classList.contains('collapsed')).toBe(true);
  });
});

describe('createInputRow', () => {
  it('creates label + input with initial value', () => {
    let captured = 0;
    const { row, input } = createInputRow('Size', 16, { min: 1, max: 200, step: 1, onChange: v => { captured = v; } });
    expect(row.querySelector('.pt-label')).toBeTruthy();
    expect(input.value).toBe('16');
  });
});

describe('createDropdownRow', () => {
  it('creates label + select with options', () => {
    let captured = '';
    const { row, select } = createDropdownRow('Wrap', [
      { value: 'both', label: 'Both Sides' },
      { value: 'leftSide', label: 'Left Side' },
    ], 'both', v => { captured = v; });
    expect(select.value).toBe('both');
    expect(select.options).toHaveLength(2);
  });
});

describe('createToggleRow', () => {
  it('creates toggle buttons with active state', () => {
    let captured = '';
    const { row, buttons } = createToggleRow('Style', [
      { value: 'normal', label: 'N' },
      { value: 'italic', label: 'I' },
    ], 'normal', v => { captured = v; });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]!.classList.contains('active')).toBe(true);
    expect(buttons[1]!.classList.contains('active')).toBe(false);
  });

  it('switches active on click', () => {
    let captured = '';
    const { buttons } = createToggleRow('Style', [
      { value: 'normal', label: 'N' },
      { value: 'italic', label: 'I' },
    ], 'normal', v => { captured = v; });
    buttons[1]!.click();
    expect(captured).toBe('italic');
    expect(buttons[0]!.classList.contains('active')).toBe(false);
    expect(buttons[1]!.classList.contains('active')).toBe(true);
  });
});

describe('createGridRow', () => {
  it('creates 2-column grid with labels and inputs', () => {
    const vals = { a: 0, b: 0 };
    const { row, inputs } = createGridRow([
      { label: 'X', value: 10, min: 0, max: 2000, step: 1, onChange: v => { vals.a = v; } },
      { label: 'W', value: 200, min: 1, max: 2000, step: 1, onChange: v => { vals.b = v; } },
    ]);
    expect(inputs).toHaveLength(2);
    expect(inputs[0]!.value).toBe('10');
    expect(inputs[1]!.value).toBe('200');
  });
});
```

**Step 2: Run to verify failure**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/ui.test.ts
```

Expected: FAIL — module not found.

**Step 3: Create theme CSS**

Create `tools/pretext-panel/src/theme.css`:

```css
/* ── Pretext Panel Theme — Radiants Dark Mode (from flow/toolTheme.css) ── */
/* Font: PixelCode exclusively */

:host {
  /* Panel backgrounds — ink surfaces */
  --pt-panel-bg: oklch(0.1641 0.0044 84.59 / 0.95);
  --pt-panel-border: oklch(0.9780 0.0295 94.34 / 0.2);
  --pt-panel-shadow:
    0 0 0 1px oklch(0.9780 0.0295 94.34 / 0.12),
    0 0 8px oklch(0.9126 0.1170 93.68 / 0.3),
    0 0 20px oklch(0.9126 0.1170 93.68 / 0.15);

  /* Text colors — cream palette */
  --pt-text-primary: oklch(0.9780 0.0295 94.34);
  --pt-text-secondary: oklch(0.9780 0.0295 94.34 / 0.85);
  --pt-text-muted: oklch(0.9780 0.0295 94.34 / 0.6);
  --pt-text-dimmed: oklch(0.9780 0.0295 94.34 / 0.4);

  /* Accent — sun-yellow */
  --pt-accent: oklch(0.9126 0.1170 93.68);
  --pt-accent-subtle: oklch(0.9126 0.1170 93.68 / 0.15);
  --pt-accent-border: oklch(0.9126 0.1170 93.68 / 0.4);

  /* Inputs / controls */
  --pt-input-bg: oklch(0.0000 0.0000 0 / 0.4);
  --pt-input-bg-hover: oklch(0.9126 0.1170 93.68 / 0.08);
  --pt-input-border: oklch(0.9780 0.0295 94.34 / 0.12);

  /* Sections / dividers */
  --pt-section-border: oklch(0.9780 0.0295 94.34 / 0.2);
  --pt-section-border-subtle: oklch(0.9780 0.0295 94.34 / 0.12);

  /* Hover states */
  --pt-hover-bg: oklch(0.9126 0.1170 93.68 / 0.08);
  --pt-hover-bg-subtle: oklch(0.9126 0.1170 93.68 / 0.04);

  /* Scrollbar */
  --pt-scrollbar-thumb: oklch(0.9780 0.0295 94.34 / 0.12);
  --pt-scrollbar-thumb-hover: oklch(0.9780 0.0295 94.34 / 0.2);
}

/* ── Panel Shell ── */

.pt-panel {
  position: fixed;
  width: 260px;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--pt-panel-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--pt-panel-border);
  border-radius: 10px;
  padding: 0;
  font-family: 'PixelCode', monospace;
  font-size: 11px;
  color: var(--pt-text-primary);
  pointer-events: auto;
  user-select: none;
  z-index: 10;
  box-shadow: var(--pt-panel-shadow);
}

.pt-panel::-webkit-scrollbar { width: 6px; }
.pt-panel::-webkit-scrollbar-track { background: transparent; }
.pt-panel::-webkit-scrollbar-thumb {
  background: var(--pt-scrollbar-thumb);
  border-radius: 3px;
}
.pt-panel::-webkit-scrollbar-thumb:hover {
  background: var(--pt-scrollbar-thumb-hover);
}

/* ── Section ── */

.pt-section {
  border-bottom: 1px solid var(--pt-section-border-subtle);
}
.pt-section:last-child { border-bottom: none; }

.pt-header {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px 0 8px;
  cursor: pointer;
  gap: 6px;
}
.pt-header:hover { background: var(--pt-hover-bg-subtle); }

.pt-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--pt-text-secondary);
  font-size: 10px;
  transition: transform 0.12s ease-out;
}
.pt-section.collapsed .pt-chevron { transform: rotate(-90deg); }

.pt-title {
  flex: 1;
  font-size: 11px;
  font-weight: 500;
  color: var(--pt-text-primary);
  letter-spacing: -0.01em;
}
.pt-section.collapsed .pt-body { display: none; }

.pt-body {
  padding: 4px 12px 8px;
}

/* ── Property Row ── */

.pt-row {
  display: flex;
  align-items: center;
  height: 28px;
  gap: 4px;
}

/* ── Scrub Label ── */

.pt-label {
  width: 52px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--pt-text-secondary);
  cursor: ew-resize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 28px;
}
.pt-label:hover { color: var(--pt-text-primary); }
.pt-label.scrubbing { color: var(--pt-accent); }

/* ── Static Label ── */

.pt-static-label {
  width: 52px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--pt-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 28px;
}

/* ── Number Input (solo) ── */

.pt-input {
  flex: 1;
  height: 24px;
  min-width: 0;
  background: var(--pt-input-bg);
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--pt-text-primary);
  font-size: 11px;
  font-family: inherit;
  text-align: left;
  padding: 0 6px;
  outline: none;
  font-variant-numeric: tabular-nums;
}
.pt-input:hover { background: var(--pt-input-bg-hover); }
.pt-input:focus {
  background: var(--pt-accent-subtle);
  border-color: var(--pt-accent);
}

/* ── Dropdown ── */

.pt-select {
  flex: 1;
  height: 22px;
  background: var(--pt-input-bg);
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--pt-text-primary);
  font-size: 11px;
  font-family: inherit;
  padding: 0 4px;
  cursor: pointer;
  outline: none;
  min-width: 0;
}
.pt-select:hover { background: var(--pt-input-bg-hover); }
.pt-select:focus { border-color: var(--pt-accent); }

/* ── Toggle Group ── */

.pt-toggles {
  display: flex;
  gap: 2px;
  flex: 1;
}

.pt-toggle-btn {
  flex: 1;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pt-input-bg);
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--pt-text-secondary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  outline: none;
}
.pt-toggle-btn:hover {
  background: var(--pt-input-bg-hover);
  color: var(--pt-text-primary);
}
.pt-toggle-btn.active {
  background: var(--pt-accent-subtle);
  color: var(--pt-accent);
  border-color: var(--pt-accent-border);
}

/* ── Grid (2-column) ── */

.pt-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.pt-grid-cell {
  display: flex;
  align-items: center;
  height: 28px;
  gap: 4px;
}

.pt-grid-label {
  width: 14px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--pt-text-secondary);
  text-align: center;
  cursor: ew-resize;
  line-height: 28px;
}
.pt-grid-label:hover { color: var(--pt-text-primary); }

/* ── Offsets Grid (2x2 with link toggle) ── */

.pt-offsets {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2px 6px;
  align-items: center;
}

.pt-offsets-link {
  grid-row: 1 / 3;
  grid-column: 2;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--pt-section-border-subtle);
  border-radius: 3px;
  color: var(--pt-text-muted);
  cursor: pointer;
  font-size: 10px;
  padding: 0;
}
.pt-offsets-link.linked {
  color: var(--pt-accent);
  border-color: var(--pt-accent-border);
}

/* ── Panel Header (top bar) ── */

.pt-topbar {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--pt-section-border-subtle);
}

.pt-topbar-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--pt-text-primary);
}

.pt-topbar-btn {
  height: 22px;
  padding: 0 8px;
  background: var(--pt-input-bg);
  border: 1px solid var(--pt-input-border);
  border-radius: 4px;
  color: var(--pt-text-secondary);
  font-size: 10px;
  font-family: inherit;
  cursor: pointer;
}
.pt-topbar-btn:hover {
  background: var(--pt-input-bg-hover);
  color: var(--pt-text-primary);
}
.pt-topbar-btn.copied {
  color: var(--pt-accent);
  border-color: var(--pt-accent-border);
}

/* ── Element List ── */

.pt-element-list {
  padding: 4px 12px 8px;
}

.pt-element-btn {
  display: flex;
  align-items: center;
  width: 100%;
  height: 24px;
  padding: 0 6px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--pt-text-secondary);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  gap: 4px;
}
.pt-element-btn:hover {
  background: var(--pt-hover-bg);
  color: var(--pt-text-primary);
}
.pt-element-btn.selected {
  background: var(--pt-accent-subtle);
  color: var(--pt-accent);
}

.pt-element-type {
  color: var(--pt-text-muted);
  font-size: 10px;
}
```

**Step 4: Implement UI factory functions**

Create `tools/pretext-panel/src/ui.ts`:

```ts
/**
 * Shared UI primitives for pretext panels — vanilla DOM factories.
 * Mirrors flow's typographyTool.ts patterns with pt-* class prefixes.
 */

// ── Section ──

export function createSection(title: string, collapsed = false): { section: HTMLDivElement; body: HTMLDivElement } {
  const section = document.createElement('div');
  section.className = `pt-section${collapsed ? ' collapsed' : ''}`;

  const header = document.createElement('div');
  header.className = 'pt-header';

  const chevron = document.createElement('span');
  chevron.className = 'pt-chevron';
  chevron.textContent = '\u25BE'; // ▾

  const titleEl = document.createElement('span');
  titleEl.className = 'pt-title';
  titleEl.textContent = title;

  header.appendChild(chevron);
  header.appendChild(titleEl);

  const body = document.createElement('div');
  body.className = 'pt-body';

  header.addEventListener('click', () => {
    section.classList.toggle('collapsed');
  });

  section.appendChild(header);
  section.appendChild(body);

  return { section, body };
}

// ── Scrub helper ──

export function attachScrub(
  labelEl: HTMLElement,
  getValue: () => number,
  setValue: (v: number) => void,
  min: number,
  max: number,
  step: number,
): void {
  let startX = 0;
  let startVal = 0;
  const sensitivity = (max - min) / 200;

  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    startX = e.clientX;
    startVal = getValue();
    labelEl.classList.add('scrubbing');
    labelEl.setPointerCapture(e.pointerId);
    labelEl.addEventListener('pointermove', onPointerMove);
    labelEl.addEventListener('pointerup', onPointerUp);
    labelEl.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(e: PointerEvent) {
    const delta = e.clientX - startX;
    let newVal = startVal + delta * sensitivity;
    // Snap to step
    newVal = Math.round(newVal / step) * step;
    newVal = Math.max(min, Math.min(max, newVal));
    setValue(newVal);
  }

  function onPointerUp(e: PointerEvent) {
    labelEl.classList.remove('scrubbing');
    labelEl.releasePointerCapture(e.pointerId);
    labelEl.removeEventListener('pointermove', onPointerMove);
    labelEl.removeEventListener('pointerup', onPointerUp);
    labelEl.removeEventListener('pointercancel', onPointerUp);
  }

  labelEl.addEventListener('pointerdown', onPointerDown);
}

// ── Input Row (scrub label + number input) ──

export interface InputRowOptions {
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function createInputRow(
  label: string,
  initialValue: number,
  opts: InputRowOptions,
): { row: HTMLDivElement; input: HTMLInputElement; setValue: (v: number) => void } {
  const row = document.createElement('div');
  row.className = 'pt-row';

  const labelEl = document.createElement('span');
  labelEl.className = 'pt-label';
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.className = 'pt-input';
  input.type = 'text';
  input.value = String(initialValue);

  let currentValue = initialValue;

  function setValue(v: number) {
    currentValue = v;
    input.value = String(Math.round(v * 100) / 100);
    opts.onChange(v);
  }

  attachScrub(labelEl, () => currentValue, setValue, opts.min, opts.max, opts.step);

  function commit() {
    const parsed = parseFloat(input.value);
    if (isNaN(parsed)) {
      input.value = String(currentValue);
      return;
    }
    const clamped = Math.max(opts.min, Math.min(opts.max, parsed));
    setValue(clamped);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { commit(); input.blur(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setValue(Math.min(opts.max, currentValue + (e.shiftKey ? opts.step * 10 : opts.step))); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setValue(Math.max(opts.min, currentValue - (e.shiftKey ? opts.step * 10 : opts.step))); }
  });
  input.addEventListener('blur', commit);

  row.appendChild(labelEl);
  row.appendChild(input);

  return { row, input, setValue };
}

// ── Dropdown Row ──

export interface DropdownOption {
  value: string;
  label: string;
}

export function createDropdownRow(
  label: string,
  options: DropdownOption[],
  initialValue: string,
  onChange: (value: string) => void,
): { row: HTMLDivElement; select: HTMLSelectElement; setValue: (v: string) => void } {
  const row = document.createElement('div');
  row.className = 'pt-row';

  const labelEl = document.createElement('span');
  labelEl.className = 'pt-static-label';
  labelEl.textContent = label;

  const select = document.createElement('select');
  select.className = 'pt-select';

  for (const opt of options) {
    const optionEl = document.createElement('option');
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    select.appendChild(optionEl);
  }
  select.value = initialValue;

  select.addEventListener('change', () => onChange(select.value));

  function setValue(v: string) {
    select.value = v;
  }

  row.appendChild(labelEl);
  row.appendChild(select);

  return { row, select, setValue };
}

// ── Toggle Row ──

export function createToggleRow(
  label: string,
  options: Array<{ value: string; label: string }>,
  initialValue: string,
  onChange: (value: string) => void,
): { row: HTMLDivElement; buttons: HTMLButtonElement[]; setValue: (v: string) => void } {
  const row = document.createElement('div');
  row.className = 'pt-row';

  const labelEl = document.createElement('span');
  labelEl.className = 'pt-static-label';
  labelEl.textContent = label;

  const group = document.createElement('div');
  group.className = 'pt-toggles';

  const buttons: HTMLButtonElement[] = [];

  function setActive(value: string) {
    for (const btn of buttons) {
      btn.classList.toggle('active', btn.dataset.value === value);
    }
  }

  for (const opt of options) {
    const btn = document.createElement('button');
    btn.className = 'pt-toggle-btn';
    btn.textContent = opt.label;
    btn.dataset.value = opt.value;
    btn.addEventListener('click', () => {
      setActive(opt.value);
      onChange(opt.value);
    });
    group.appendChild(btn);
    buttons.push(btn);
  }

  setActive(initialValue);

  function setValue(v: string) {
    setActive(v);
  }

  row.appendChild(labelEl);
  row.appendChild(group);

  return { row, buttons, setValue };
}

// ── Grid Row (2-column paired inputs) ──

export interface GridCellOptions {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function createGridRow(
  cells: GridCellOptions[],
): { row: HTMLDivElement; inputs: HTMLInputElement[]; setValues: ((v: number) => void)[] } {
  const row = document.createElement('div');
  row.className = 'pt-grid';

  const inputs: HTMLInputElement[] = [];
  const setValues: ((v: number) => void)[] = [];

  for (const cell of cells) {
    const cellEl = document.createElement('div');
    cellEl.className = 'pt-grid-cell';

    const label = document.createElement('span');
    label.className = 'pt-grid-label';
    label.textContent = cell.label;

    const input = document.createElement('input');
    input.className = 'pt-input';
    input.type = 'text';
    input.value = String(cell.value);

    let currentValue = cell.value;

    function setValue(v: number) {
      currentValue = v;
      input.value = String(Math.round(v * 100) / 100);
      cell.onChange(v);
    }

    attachScrub(label, () => currentValue, setValue, cell.min, cell.max, cell.step);

    function commit() {
      const parsed = parseFloat(input.value);
      if (isNaN(parsed)) { input.value = String(currentValue); return; }
      setValue(Math.max(cell.min, Math.min(cell.max, parsed)));
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { commit(); input.blur(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setValue(Math.min(cell.max, currentValue + (e.shiftKey ? cell.step * 10 : cell.step))); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setValue(Math.max(cell.min, currentValue - (e.shiftKey ? cell.step * 10 : cell.step))); }
    });
    input.addEventListener('blur', commit);

    cellEl.appendChild(label);
    cellEl.appendChild(input);
    row.appendChild(cellEl);

    inputs.push(input);
    setValues.push(setValue);
  }

  return { row, inputs, setValues };
}
```

**Step 5: Run tests**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/ui.test.ts
```

Expected: all tests PASS.

**Step 6: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/src/theme.css tools/pretext-panel/src/ui.ts tools/pretext-panel/test/ui.test.ts
git commit -m "feat(pretext-panel): add shared theme CSS and UI factory functions"
```

---

### Task 5: Typography Panel — Text Block Settings

The typography panel edits text block parameters: font (decomposed into family/weight/style/size), line height, white space mode, and optional max column height.

**Files:**
- Create: `tools/pretext-panel/src/typographyPanel.ts`
- Test: `tools/pretext-panel/test/typographyPanel.test.ts`

**Step 1: Write the failing test**

Create `tools/pretext-panel/test/typographyPanel.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createTypographyPanel } from '../src/typographyPanel';
import type { TextBlock } from '../src/types';

function makeBlock(overrides: Partial<TextBlock> = {}): TextBlock {
  return {
    id: 'body',
    font: '16px Mondwest',
    lineHeight: 19.2,
    whiteSpace: 'normal',
    ...overrides,
  };
}

describe('createTypographyPanel', () => {
  it('renders without crashing', () => {
    const onChange = vi.fn();
    const panel = createTypographyPanel(makeBlock(), onChange);
    expect(panel.element).toBeTruthy();
    expect(panel.element.querySelector('.pt-section')).toBeTruthy();
  });

  it('shows font family', () => {
    const onChange = vi.fn();
    const panel = createTypographyPanel(makeBlock(), onChange);
    const familyInput = panel.element.querySelector('input[data-field="family"]') as HTMLInputElement;
    expect(familyInput.value).toBe('Mondwest');
  });

  it('shows font size', () => {
    const onChange = vi.fn();
    const panel = createTypographyPanel(makeBlock(), onChange);
    const sizeInput = panel.element.querySelector('input[data-field="size"]') as HTMLInputElement;
    expect(sizeInput.value).toBe('16');
  });

  it('shows line height', () => {
    const onChange = vi.fn();
    const panel = createTypographyPanel(makeBlock(), onChange);
    const lhInput = panel.element.querySelector('input[data-field="lineHeight"]') as HTMLInputElement;
    expect(lhInput.value).toBe('19.2');
  });

  it('calls onChange when font size changes', () => {
    const onChange = vi.fn();
    const panel = createTypographyPanel(makeBlock(), onChange);
    const sizeInput = panel.element.querySelector('input[data-field="size"]') as HTMLInputElement;
    sizeInput.value = '20';
    sizeInput.dispatchEvent(new Event('blur'));
    expect(onChange).toHaveBeenCalled();
    const patch = onChange.mock.calls[0][0];
    expect(patch.font).toContain('20px');
  });

  it('loads new text block via load()', () => {
    const onChange = vi.fn();
    const panel = createTypographyPanel(makeBlock(), onChange);
    panel.load(makeBlock({ font: 'italic 700 24px Georgia', lineHeight: 28.8 }));
    const sizeInput = panel.element.querySelector('input[data-field="size"]') as HTMLInputElement;
    expect(sizeInput.value).toBe('24');
  });
});
```

**Step 2: Run to verify failure**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/typographyPanel.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement**

Create `tools/pretext-panel/src/typographyPanel.ts`:

```ts
/**
 * Typography Panel — edits text block font/lineHeight/whiteSpace.
 *
 * Decomposes the canvas font shorthand into family/weight/style/size fields,
 * recomposes on change, and calls onChange with the full TextBlock patch.
 */

import type { TextBlock, WhiteSpaceMode } from './types';
import { parseFont, composeFont, type ParsedFont } from './fontParser';
import { createSection, createInputRow, createDropdownRow, createToggleRow, createGridRow } from './ui';

const WEIGHT_OPTIONS = [
  { value: '100', label: '100 Thin' },
  { value: '200', label: '200 Extra Light' },
  { value: '300', label: '300 Light' },
  { value: '400', label: '400 Regular' },
  { value: '500', label: '500 Medium' },
  { value: '600', label: '600 Semi Bold' },
  { value: '700', label: '700 Bold' },
  { value: '800', label: '800 Extra Bold' },
  { value: '900', label: '900 Black' },
];

const STYLE_OPTIONS = [
  { value: 'normal', label: 'N' },
  { value: 'italic', label: 'I' },
  { value: 'oblique', label: 'O' },
];

const WHITESPACE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'pre-wrap', label: 'Pre-wrap' },
];

export interface TypographyPanelResult {
  element: HTMLDivElement;
  load: (block: TextBlock) => void;
  destroy: () => void;
}

export function createTypographyPanel(
  initial: TextBlock,
  onChange: (patch: Partial<TextBlock>) => void,
): TypographyPanelResult {
  const container = document.createElement('div');

  // Internal state
  let parsed: ParsedFont = parseFont(initial.font);
  let lineHeight = initial.lineHeight;
  let whiteSpace: WhiteSpaceMode = initial.whiteSpace;
  let maxColumnHeight = initial.maxColumnHeight;

  function emitFontChange() {
    onChange({ font: composeFont(parsed) });
  }

  // ── Font section ──
  const { section: fontSection, body: fontBody } = createSection('Font');

  // Family (text input — allows any font name)
  const familyRow = document.createElement('div');
  familyRow.className = 'pt-row';
  const familyLabel = document.createElement('span');
  familyLabel.className = 'pt-static-label';
  familyLabel.textContent = 'Family';
  const familyInput = document.createElement('input');
  familyInput.className = 'pt-input';
  familyInput.type = 'text';
  familyInput.value = parsed.family;
  familyInput.dataset.field = 'family';
  familyInput.addEventListener('blur', () => {
    if (familyInput.value.trim()) {
      parsed = { ...parsed, family: familyInput.value.trim() };
      emitFontChange();
    }
  });
  familyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { familyInput.blur(); }
  });
  familyRow.appendChild(familyLabel);
  familyRow.appendChild(familyInput);
  fontBody.appendChild(familyRow);

  // Weight (dropdown)
  const { row: weightRow, select: weightSelect, setValue: setWeight } = createDropdownRow(
    'Weight', WEIGHT_OPTIONS, parsed.weight,
    (v) => { parsed = { ...parsed, weight: v }; emitFontChange(); },
  );
  fontBody.appendChild(weightRow);

  // Style (toggle)
  const { row: styleRow, setValue: setStyle } = createToggleRow(
    'Style', STYLE_OPTIONS, parsed.style,
    (v) => { parsed = { ...parsed, style: v as ParsedFont['style'] }; emitFontChange(); },
  );
  fontBody.appendChild(styleRow);

  // Size (scrub + input)
  const { row: sizeRow, input: sizeInput, setValue: setSize } = createInputRow(
    'Size', parsed.size,
    {
      min: 1, max: 200, step: 1,
      onChange: (v) => { parsed = { ...parsed, size: v }; emitFontChange(); },
    },
  );
  sizeInput.dataset.field = 'size';
  fontBody.appendChild(sizeRow);

  container.appendChild(fontSection);

  // ── Layout section ──
  const { section: layoutSection, body: layoutBody } = createSection('Layout');

  // Line height
  const { row: lhRow, input: lhInput, setValue: setLh } = createInputRow(
    'Line H', lineHeight,
    {
      min: 1, max: 200, step: 0.1,
      onChange: (v) => { lineHeight = v; onChange({ lineHeight: v }); },
    },
  );
  lhInput.dataset.field = 'lineHeight';
  layoutBody.appendChild(lhRow);

  // White space
  const { row: wsRow, setValue: setWs } = createToggleRow(
    'Space', WHITESPACE_OPTIONS, whiteSpace,
    (v) => { whiteSpace = v as WhiteSpaceMode; onChange({ whiteSpace: v as WhiteSpaceMode }); },
  );
  layoutBody.appendChild(wsRow);

  // Max column height (optional)
  const { row: maxHRow, input: maxHInput, setValue: setMaxH } = createInputRow(
    'Max H', maxColumnHeight ?? 0,
    {
      min: 0, max: 10000, step: 1,
      onChange: (v) => {
        maxColumnHeight = v === 0 ? undefined : v;
        onChange({ maxColumnHeight: maxColumnHeight });
      },
    },
  );
  maxHInput.dataset.field = 'maxColumnHeight';
  layoutBody.appendChild(maxHRow);

  container.appendChild(layoutSection);

  // ── Load ──
  function load(block: TextBlock) {
    parsed = parseFont(block.font);
    lineHeight = block.lineHeight;
    whiteSpace = block.whiteSpace;
    maxColumnHeight = block.maxColumnHeight;

    familyInput.value = parsed.family;
    setWeight(parsed.weight);
    setStyle(parsed.style);
    setSize(parsed.size);
    setLh(block.lineHeight);
    setWs(block.whiteSpace);
    setMaxH(block.maxColumnHeight ?? 0);
  }

  return {
    element: container,
    load,
    destroy: () => { container.remove(); },
  };
}
```

**Step 4: Run tests**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/typographyPanel.test.ts
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/src/typographyPanel.ts tools/pretext-panel/test/typographyPanel.test.ts
git commit -m "feat(pretext-panel): add typography panel for text block editing"
```

---

### Task 6: Wrap Panel — InDesign-Style Text Wrap Controls

The wrap panel edits obstacle parameters: wrap side dropdown, offsets grid (4 inputs + link toggle), and contour type. Matches the InDesign Text Wrap panel layout from the reference screenshot.

**Files:**
- Create: `tools/pretext-panel/src/wrapPanel.ts`
- Test: `tools/pretext-panel/test/wrapPanel.test.ts`

**Step 1: Write the failing test**

Create `tools/pretext-panel/test/wrapPanel.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createWrapPanel } from '../src/wrapPanel';
import type { GeometricObstacle, DropcapObstacle } from '../src/types';

function makeRectObs(overrides: Partial<GeometricObstacle> = {}): GeometricObstacle {
  return {
    id: 'logo',
    kind: 'geometric',
    contour: 'polygon',
    bounds: { x: 16, y: 600, width: 200, height: 200 },
    wrap: 'both',
    offsets: { top: 8, right: 8, bottom: 8, left: 8 },
    ...overrides,
  };
}

function makeDropcap(): DropcapObstacle {
  return {
    id: 'dropcap',
    kind: 'dropcap',
    character: 'G',
    font: "64px 'Waves Blackletter CPC'",
    lineCount: 3,
  };
}

describe('createWrapPanel', () => {
  it('renders without crashing', () => {
    const onChange = vi.fn();
    const panel = createWrapPanel(makeRectObs(), onChange);
    expect(panel.element).toBeTruthy();
  });

  it('shows wrap side dropdown for geometric obstacle', () => {
    const onChange = vi.fn();
    const panel = createWrapPanel(makeRectObs(), onChange);
    const select = panel.element.querySelector('select[data-field="wrap"]') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.value).toBe('both');
  });

  it('shows 4 offset inputs for geometric obstacle', () => {
    const onChange = vi.fn();
    const panel = createWrapPanel(makeRectObs(), onChange);
    const offsets = panel.element.querySelectorAll('input[data-offset]');
    expect(offsets).toHaveLength(4);
  });

  it('shows link toggle for offsets', () => {
    const onChange = vi.fn();
    const panel = createWrapPanel(makeRectObs(), onChange);
    const link = panel.element.querySelector('.pt-offsets-link');
    expect(link).toBeTruthy();
  });

  it('shows dropcap-specific fields', () => {
    const onChange = vi.fn();
    const panel = createWrapPanel(makeDropcap(), onChange);
    const charInput = panel.element.querySelector('input[data-field="character"]') as HTMLInputElement;
    expect(charInput).toBeTruthy();
    expect(charInput.value).toBe('G');
    const lineCountInput = panel.element.querySelector('input[data-field="lineCount"]') as HTMLInputElement;
    expect(lineCountInput).toBeTruthy();
    expect(lineCountInput.value).toBe('3');
  });

  it('calls onChange when wrap side changes', () => {
    const onChange = vi.fn();
    const panel = createWrapPanel(makeRectObs(), onChange);
    const select = panel.element.querySelector('select[data-field="wrap"]') as HTMLSelectElement;
    select.value = 'leftSide';
    select.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledWith({ wrap: 'leftSide' });
  });

  it('linked offsets sync all 4 values', () => {
    const onChange = vi.fn();
    const panel = createWrapPanel(makeRectObs(), onChange);
    // Link button should start linked (all offsets equal)
    const link = panel.element.querySelector('.pt-offsets-link') as HTMLButtonElement;
    expect(link.classList.contains('linked')).toBe(true);

    // Change one offset — all should update
    const topInput = panel.element.querySelector('input[data-offset="top"]') as HTMLInputElement;
    topInput.value = '12';
    topInput.dispatchEvent(new Event('blur'));
    expect(onChange).toHaveBeenCalledWith({
      offsets: { top: 12, right: 12, bottom: 12, left: 12 },
    });
  });

  it('loads new obstacle via load()', () => {
    const onChange = vi.fn();
    const panel = createWrapPanel(makeRectObs(), onChange);
    panel.load(makeRectObs({ wrap: 'leftSide', offsets: { top: 4, right: 4, bottom: 4, left: 4 } }));
    const select = panel.element.querySelector('select[data-field="wrap"]') as HTMLSelectElement;
    expect(select.value).toBe('leftSide');
  });
});
```

**Step 2: Run to verify failure**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/wrapPanel.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement**

Create `tools/pretext-panel/src/wrapPanel.ts`:

```ts
/**
 * Wrap Panel — InDesign-style Text Wrap controls for obstacles.
 *
 * Shows: wrap side dropdown, offset inputs (4x with link toggle),
 * contour type indicator, and type-specific fields for dropcap/pullquote/circle.
 *
 * Reference: InDesign Text Wrap panel screenshot.
 */

import type {
  Obstacle,
  GeometricObstacle,
  DropcapObstacle,
  PullquoteObstacle,
  WrapSide,
  Offsets,
} from './types';
import { parseFont, composeFont, type ParsedFont } from './fontParser';
import { createSection, createInputRow, createDropdownRow, createGridRow, attachScrub } from './ui';

const WRAP_OPTIONS = [
  { value: 'leftSide', label: 'Left Side' },
  { value: 'rightSide', label: 'Right Side' },
  { value: 'both', label: 'Both Right & Left' },
  { value: 'largestArea', label: 'Largest Area' },
];

const CONTOUR_OPTIONS = [
  { value: 'boundingBox', label: 'Bounding Box' },
  { value: 'circle', label: 'Circle' },
  { value: 'polygon', label: 'Object Shape' },
];

export interface WrapPanelResult {
  element: HTMLDivElement;
  load: (obs: Obstacle) => void;
  destroy: () => void;
}

export function createWrapPanel(
  initial: Obstacle,
  onChange: (patch: Partial<Obstacle>) => void,
): WrapPanelResult {
  const container = document.createElement('div');
  let currentObs = initial;

  function rebuild() {
    container.innerHTML = '';

    if (currentObs.kind === 'geometric') {
      buildGeometricControls(container, currentObs as GeometricObstacle, onChange);
    } else if (currentObs.kind === 'dropcap') {
      buildDropcapControls(container, currentObs as DropcapObstacle, onChange);
    } else if (currentObs.kind === 'pullquote') {
      buildPullquoteControls(container, currentObs as PullquoteObstacle, onChange);
    }
  }

  rebuild();

  function load(obs: Obstacle) {
    currentObs = obs;
    rebuild();
  }

  return {
    element: container,
    load,
    destroy: () => { container.remove(); },
  };
}

// ── Geometric Obstacle ──

function buildGeometricControls(
  container: HTMLDivElement,
  obs: GeometricObstacle,
  onChange: (patch: Partial<Obstacle>) => void,
) {
  // ── Wrap Options section ──
  const { section: wrapSection, body: wrapBody } = createSection('Wrap Options');

  // Wrap To dropdown
  const { row: wrapRow, select: wrapSelect } = createDropdownRow(
    'Wrap To', WRAP_OPTIONS, obs.wrap,
    (v) => onChange({ wrap: v as WrapSide }),
  );
  wrapSelect.dataset.field = 'wrap';
  wrapBody.appendChild(wrapRow);

  // Contour type dropdown
  const { row: contourRow } = createDropdownRow(
    'Contour', CONTOUR_OPTIONS, obs.contour,
    (v) => onChange({ contour: v } as Partial<GeometricObstacle>),
  );
  wrapBody.appendChild(contourRow);

  container.appendChild(wrapSection);

  // ── Offsets section ──
  const { section: offsetSection, body: offsetBody } = createSection('Offsets');
  const offsetsGrid = buildOffsetsGrid(obs.offsets, (newOffsets) => {
    onChange({ offsets: newOffsets });
  });
  offsetBody.appendChild(offsetsGrid);
  container.appendChild(offsetSection);

  // ── Bounds section ──
  const { section: boundsSection, body: boundsBody } = createSection('Bounds', true);
  const { row: xyRow } = createGridRow([
    { label: 'X', value: obs.bounds.x, min: -2000, max: 4000, step: 1, onChange: (v) => onChange({ bounds: { ...obs.bounds, x: v } } as Partial<GeometricObstacle>) },
    { label: 'Y', value: obs.bounds.y, min: -2000, max: 4000, step: 1, onChange: (v) => onChange({ bounds: { ...obs.bounds, y: v } } as Partial<GeometricObstacle>) },
  ]);
  boundsBody.appendChild(xyRow);
  const { row: whRow } = createGridRow([
    { label: 'W', value: obs.bounds.width, min: 1, max: 4000, step: 1, onChange: (v) => onChange({ bounds: { ...obs.bounds, width: v } } as Partial<GeometricObstacle>) },
    { label: 'H', value: obs.bounds.height, min: 1, max: 4000, step: 1, onChange: (v) => onChange({ bounds: { ...obs.bounds, height: v } } as Partial<GeometricObstacle>) },
  ]);
  boundsBody.appendChild(whRow);
  container.appendChild(boundsSection);

  // ── Circle-specific fields ──
  if (obs.contour === 'circle') {
    const { section: circleSection, body: circleBody } = createSection('Circle');
    const { row: cxyRow } = createGridRow([
      { label: 'cx', value: obs.cx ?? 0, min: -2000, max: 4000, step: 1, onChange: (v) => onChange({ cx: v } as Partial<GeometricObstacle>) },
      { label: 'cy', value: obs.cy ?? 0, min: -2000, max: 4000, step: 1, onChange: (v) => onChange({ cy: v } as Partial<GeometricObstacle>) },
    ]);
    circleBody.appendChild(cxyRow);
    const { row: rRow } = createInputRow('Radius', obs.radius ?? 50, {
      min: 1, max: 2000, step: 1,
      onChange: (v) => onChange({ radius: v } as Partial<GeometricObstacle>),
    });
    circleBody.appendChild(rRow);
    container.appendChild(circleSection);
  }
}

// ── Dropcap Controls ──

function buildDropcapControls(
  container: HTMLDivElement,
  obs: DropcapObstacle,
  onChange: (patch: Partial<Obstacle>) => void,
) {
  const { section, body } = createSection('Drop Cap');

  // Character
  const charRow = document.createElement('div');
  charRow.className = 'pt-row';
  const charLabel = document.createElement('span');
  charLabel.className = 'pt-static-label';
  charLabel.textContent = 'Char';
  const charInput = document.createElement('input');
  charInput.className = 'pt-input';
  charInput.type = 'text';
  charInput.value = obs.character;
  charInput.maxLength = 1;
  charInput.style.width = '32px';
  charInput.style.textAlign = 'center';
  charInput.style.flex = '0';
  charInput.dataset.field = 'character';
  charInput.addEventListener('blur', () => {
    if (charInput.value) onChange({ character: charInput.value } as Partial<DropcapObstacle>);
  });
  charRow.appendChild(charLabel);
  charRow.appendChild(charInput);
  body.appendChild(charRow);

  // Font (text input)
  const fontRow = document.createElement('div');
  fontRow.className = 'pt-row';
  const fontLabel = document.createElement('span');
  fontLabel.className = 'pt-static-label';
  fontLabel.textContent = 'Font';
  const fontInput = document.createElement('input');
  fontInput.className = 'pt-input';
  fontInput.type = 'text';
  fontInput.value = obs.font;
  fontInput.dataset.field = 'font';
  fontInput.addEventListener('blur', () => {
    if (fontInput.value.trim()) onChange({ font: fontInput.value.trim() } as Partial<DropcapObstacle>);
  });
  fontRow.appendChild(fontLabel);
  fontRow.appendChild(fontInput);
  body.appendChild(fontRow);

  // Line count
  const { row: lcRow, input: lcInput } = createInputRow('Lines', obs.lineCount, {
    min: 1, max: 10, step: 1,
    onChange: (v) => onChange({ lineCount: v } as Partial<DropcapObstacle>),
  });
  lcInput.dataset.field = 'lineCount';
  body.appendChild(lcRow);

  container.appendChild(section);
}

// ── Pullquote Controls ──

function buildPullquoteControls(
  container: HTMLDivElement,
  obs: PullquoteObstacle,
  onChange: (patch: Partial<Obstacle>) => void,
) {
  const { section, body } = createSection('Pull Quote');

  // Font
  const fontRow = document.createElement('div');
  fontRow.className = 'pt-row';
  const fontLabel = document.createElement('span');
  fontLabel.className = 'pt-static-label';
  fontLabel.textContent = 'Font';
  const fontInput = document.createElement('input');
  fontInput.className = 'pt-input';
  fontInput.type = 'text';
  fontInput.value = obs.font;
  fontInput.addEventListener('blur', () => {
    if (fontInput.value.trim()) onChange({ font: fontInput.value.trim() } as Partial<PullquoteObstacle>);
  });
  fontRow.appendChild(fontLabel);
  fontRow.appendChild(fontInput);
  body.appendChild(fontRow);

  // Max width
  const { row: mwRow } = createInputRow('Max W', obs.maxWidth, {
    min: 10, max: 2000, step: 1,
    onChange: (v) => onChange({ maxWidth: v } as Partial<PullquoteObstacle>),
  });
  body.appendChild(mwRow);

  // Wrap To
  const { row: wrapRow, select: wrapSelect } = createDropdownRow(
    'Wrap To', WRAP_OPTIONS, obs.wrap,
    (v) => onChange({ wrap: v as WrapSide } as Partial<PullquoteObstacle>),
  );
  wrapSelect.dataset.field = 'wrap';
  body.appendChild(wrapRow);

  container.appendChild(section);

  // Offsets
  const { section: offSection, body: offBody } = createSection('Offsets');
  offBody.appendChild(buildOffsetsGrid(obs.offsets, (newOffsets) => {
    onChange({ offsets: newOffsets } as Partial<PullquoteObstacle>);
  }));
  container.appendChild(offSection);
}

// ── Offsets Grid (shared by geometric + pullquote) ──

function buildOffsetsGrid(
  offsets: Offsets,
  onChange: (offsets: Offsets) => void,
): HTMLDivElement {
  const grid = document.createElement('div');
  grid.className = 'pt-offsets';

  const current = { ...offsets };
  let linked = offsets.top === offsets.right && offsets.right === offsets.bottom && offsets.bottom === offsets.left;

  const sides = ['top', 'right', 'bottom', 'left'] as const;
  const labels = ['T', 'R', 'B', 'L'];
  const inputs: HTMLInputElement[] = [];

  // Link toggle button
  const linkBtn = document.createElement('button');
  linkBtn.className = `pt-offsets-link${linked ? ' linked' : ''}`;
  linkBtn.textContent = linked ? '\u{1F517}' : '\u2022'; // 🔗 or bullet
  linkBtn.title = 'Link offsets';
  linkBtn.addEventListener('click', () => {
    linked = !linked;
    linkBtn.classList.toggle('linked', linked);
    linkBtn.textContent = linked ? '\u{1F517}' : '\u2022';
    if (linked) {
      // Sync all to top value
      const v = current.top;
      for (const s of sides) current[s] = v;
      for (const inp of inputs) inp.value = String(v);
      onChange({ ...current });
    }
  });

  // Row 1: top + right
  // Row 2: bottom + left
  const pairs: [typeof sides[number], typeof sides[number]][] = [['top', 'right'], ['bottom', 'left']];
  for (const [a, b] of pairs) {
    for (const side of [a, b]) {
      const cell = document.createElement('div');
      cell.className = 'pt-grid-cell';

      const label = document.createElement('span');
      label.className = 'pt-grid-label';
      label.textContent = labels[sides.indexOf(side)]!;

      const input = document.createElement('input');
      input.className = 'pt-input';
      input.type = 'text';
      input.value = String(current[side]);
      input.dataset.offset = side;
      input.style.width = '52px';

      let val = current[side];

      function commit() {
        const parsed = parseFloat(input.value);
        if (isNaN(parsed)) { input.value = String(val); return; }
        const clamped = Math.max(0, Math.min(200, parsed));
        val = clamped;
        current[side] = clamped;
        if (linked) {
          for (const s of sides) current[s] = clamped;
          for (const inp of inputs) inp.value = String(clamped);
        }
        onChange({ ...current });
      }

      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { commit(); input.blur(); }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          val = Math.min(200, val + (e.shiftKey ? 10 : 1));
          input.value = String(val);
          commit();
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          val = Math.max(0, val - (e.shiftKey ? 10 : 1));
          input.value = String(val);
          commit();
        }
      });

      attachScrub(label, () => val, (v) => {
        val = v;
        input.value = String(Math.round(v));
        current[side] = Math.round(v);
        if (linked) {
          for (const s of sides) current[s] = Math.round(v);
          for (const inp of inputs) inp.value = String(Math.round(v));
        }
        onChange({ ...current });
      }, 0, 200, 1);

      cell.appendChild(label);
      cell.appendChild(input);
      grid.appendChild(cell);
      inputs.push(input);
    }

    // Insert link button after first pair (between rows)
    if (a === 'top') grid.appendChild(linkBtn);
  }

  return grid;
}
```

**Step 4: Run tests**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/wrapPanel.test.ts
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/src/wrapPanel.ts tools/pretext-panel/test/wrapPanel.test.ts
git commit -m "feat(pretext-panel): add InDesign-style wrap panel for obstacles"
```

---

### Task 7: Column Panel

Simple panel for editing column x position and width.

**Files:**
- Create: `tools/pretext-panel/src/columnPanel.ts`
- Test: `tools/pretext-panel/test/columnPanel.test.ts`

**Step 1: Write the failing test**

Create `tools/pretext-panel/test/columnPanel.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createColumnPanel } from '../src/columnPanel';
import type { Column } from '../src/types';

describe('createColumnPanel', () => {
  it('renders X and Width inputs', () => {
    const onChange = vi.fn();
    const panel = createColumnPanel({ id: 'left', x: 16, width: 180 }, onChange);
    const inputs = panel.element.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('shows correct initial values', () => {
    const onChange = vi.fn();
    const panel = createColumnPanel({ id: 'left', x: 16, width: 180 }, onChange);
    const xInput = panel.element.querySelector('input[data-field="x"]') as HTMLInputElement;
    const wInput = panel.element.querySelector('input[data-field="width"]') as HTMLInputElement;
    expect(xInput.value).toBe('16');
    expect(wInput.value).toBe('180');
  });

  it('loads new column', () => {
    const onChange = vi.fn();
    const panel = createColumnPanel({ id: 'left', x: 16, width: 180 }, onChange);
    panel.load({ id: 'center', x: 210, width: 340 });
    const xInput = panel.element.querySelector('input[data-field="x"]') as HTMLInputElement;
    expect(xInput.value).toBe('210');
  });
});
```

**Step 2: Run to verify failure**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/columnPanel.test.ts
```

Expected: FAIL.

**Step 3: Implement**

Create `tools/pretext-panel/src/columnPanel.ts`:

```ts
import type { Column } from './types';
import { createSection, createGridRow } from './ui';

export interface ColumnPanelResult {
  element: HTMLDivElement;
  load: (col: Column) => void;
  destroy: () => void;
}

export function createColumnPanel(
  initial: Column,
  onChange: (patch: Partial<Column>) => void,
): ColumnPanelResult {
  const container = document.createElement('div');
  let current = { ...initial };

  const { section, body } = createSection('Column');

  const { row, inputs, setValues } = createGridRow([
    { label: 'X', value: current.x, min: -2000, max: 4000, step: 1, onChange: (v) => { current.x = v; onChange({ x: v }); } },
    { label: 'W', value: current.width, min: 1, max: 4000, step: 1, onChange: (v) => { current.width = v; onChange({ width: v }); } },
  ]);
  inputs[0]!.dataset.field = 'x';
  inputs[1]!.dataset.field = 'width';
  body.appendChild(row);
  container.appendChild(section);

  function load(col: Column) {
    current = { ...col };
    setValues[0]!(col.x);
    setValues[1]!(col.width);
  }

  return {
    element: container,
    load,
    destroy: () => { container.remove(); },
  };
}
```

**Step 4: Run tests**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/columnPanel.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/src/columnPanel.ts tools/pretext-panel/test/columnPanel.test.ts
git commit -m "feat(pretext-panel): add column panel"
```

---

### Task 8: Combined Panel Shell — Entry Point + Element List + Clipboard Export

The main entry point that assembles both panels, manages element selection, and handles clipboard export. This is the `createPretextTool()` factory that matches flow's tool pattern.

**Files:**
- Create: `tools/pretext-panel/src/pretextTool.ts`
- Create: `tools/pretext-panel/src/index.ts`
- Test: `tools/pretext-panel/test/pretextTool.test.ts`

**Step 1: Write the failing test**

Create `tools/pretext-panel/test/pretextTool.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPretextTool } from '../src/pretextTool';
import type { PretextState } from '../src/descriptor';

const SAMPLE_STATE: PretextState = {
  columns: [
    { id: 'left', x: 16, width: 180 },
    { id: 'right', x: 210, width: 340 },
  ],
  obstacles: [
    {
      id: 'logo',
      kind: 'geometric',
      contour: 'polygon',
      bounds: { x: 16, y: 600, width: 200, height: 200 },
      wrap: 'both',
      offsets: { top: 8, right: 8, bottom: 8, left: 8 },
    },
    {
      id: 'dropcap',
      kind: 'dropcap',
      character: 'G',
      font: "64px 'Waves Blackletter CPC'",
      lineCount: 3,
    },
  ],
  textBlocks: [
    { id: 'body', font: '16px Mondwest', lineHeight: 19.2, whiteSpace: 'normal' },
  ],
};

describe('createPretextTool', () => {
  let shadowRoot: ShadowRoot;

  beforeEach(() => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });
  });

  it('creates tool with attach/detach/destroy', () => {
    const tool = createPretextTool({ shadowRoot });
    expect(typeof tool.attach).toBe('function');
    expect(typeof tool.detach).toBe('function');
    expect(typeof tool.destroy).toBe('function');
    expect(typeof tool.getDescriptor).toBe('function');
  });

  it('renders panel container in shadow root on attach', () => {
    const tool = createPretextTool({ shadowRoot });
    tool.attach(SAMPLE_STATE);
    const panel = shadowRoot.querySelector('.pt-panel');
    expect(panel).toBeTruthy();
  });

  it('hides panel on detach', () => {
    const tool = createPretextTool({ shadowRoot });
    tool.attach(SAMPLE_STATE);
    tool.detach();
    const panel = shadowRoot.querySelector('.pt-panel') as HTMLElement;
    expect(panel.style.display).toBe('none');
  });

  it('shows element list with all registered elements', () => {
    const tool = createPretextTool({ shadowRoot });
    tool.attach(SAMPLE_STATE);
    const btns = shadowRoot.querySelectorAll('.pt-element-btn');
    // 2 columns + 2 obstacles + 1 text block = 5
    expect(btns.length).toBe(5);
  });

  it('selects an element and shows its panel', () => {
    const tool = createPretextTool({ shadowRoot });
    tool.attach(SAMPLE_STATE);
    // Click the "body" text block button
    const btns = shadowRoot.querySelectorAll('.pt-element-btn');
    const bodyBtn = Array.from(btns).find(b => b.textContent?.includes('body'));
    expect(bodyBtn).toBeTruthy();
    (bodyBtn as HTMLElement).click();
    expect(bodyBtn!.classList.contains('selected')).toBe(true);
  });

  it('getDescriptor returns current state', () => {
    const tool = createPretextTool({ shadowRoot });
    tool.attach(SAMPLE_STATE);
    const desc = tool.getDescriptor();
    expect(desc.version).toBe(1);
    expect(desc.columns).toHaveLength(2);
    expect(desc.obstacles).toHaveLength(2);
    expect(desc.textBlocks).toHaveLength(1);
  });

  it('cleans up on destroy', () => {
    const tool = createPretextTool({ shadowRoot });
    tool.attach(SAMPLE_STATE);
    tool.destroy();
    const panel = shadowRoot.querySelector('.pt-panel');
    expect(panel).toBeNull();
  });
});
```

**Step 2: Run to verify failure**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/pretextTool.test.ts
```

Expected: FAIL.

**Step 3: Implement**

Create `tools/pretext-panel/src/pretextTool.ts`:

```ts
/**
 * Pretext Tool — combined shadow DOM panel.
 *
 * Factory pattern matching flow's createTypographyTool / createColorTool.
 * Injects into a ShadowRoot, manages element selection across two sub-panels
 * (Typography + Wrap), and exports pretext descriptor JSON to clipboard.
 */

import type { Column, TextBlock, Obstacle, PretextDescriptor } from './types';
import { type PretextState, buildDescriptor, copyDescriptorToClipboard } from './descriptor';
import { createTypographyPanel, type TypographyPanelResult } from './typographyPanel';
import { createWrapPanel, type WrapPanelResult } from './wrapPanel';
import { createColumnPanel, type ColumnPanelResult } from './columnPanel';
import { createSection } from './ui';
import themeCSS from './theme.css?inline';

// ── Types ──

export interface PretextToolOptions {
  shadowRoot: ShadowRoot;
  onStateChange?: (state: PretextState) => void;
}

export interface PretextTool {
  attach: (state: PretextState) => void;
  detach: () => void;
  destroy: () => void;
  getDescriptor: () => PretextDescriptor;
}

// ── Factory ──

export function createPretextTool(options: PretextToolOptions): PretextTool {
  const { shadowRoot, onStateChange } = options;

  // 1. Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = themeCSS;
  shadowRoot.appendChild(styleEl);

  // 2. Create panel container (hidden initially)
  const panel = document.createElement('div');
  panel.className = 'pt-panel';
  panel.style.display = 'none';
  shadowRoot.appendChild(panel);

  // State
  let state: PretextState = { columns: [], obstacles: [], textBlocks: [] };
  let selectedId: string | null = null;
  let selectedKind: 'column' | 'obstacle' | 'textBlock' | null = null;

  // Sub-panel instances (created lazily)
  let typoPanel: TypographyPanelResult | null = null;
  let wrapPanel: WrapPanelResult | null = null;
  let colPanel: ColumnPanelResult | null = null;

  // DOM refs
  let topbar: HTMLDivElement | null = null;
  let copyBtn: HTMLButtonElement | null = null;
  let inspectorArea: HTMLDivElement | null = null;
  let elementList: HTMLDivElement | null = null;

  function notifyChange() {
    onStateChange?.(state);
  }

  // ── Build panel DOM ──

  function buildPanel() {
    panel.innerHTML = '';

    // Top bar: title + copy button
    topbar = document.createElement('div');
    topbar.className = 'pt-topbar';

    const title = document.createElement('span');
    title.className = 'pt-topbar-title';
    title.textContent = '\u25C7 Pretext'; // ◇

    copyBtn = document.createElement('button');
    copyBtn.className = 'pt-topbar-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', async () => {
      await copyDescriptorToClipboard(state);
      copyBtn!.textContent = 'Copied!';
      copyBtn!.classList.add('copied');
      setTimeout(() => {
        copyBtn!.textContent = 'Copy';
        copyBtn!.classList.remove('copied');
      }, 1500);
    });

    topbar.appendChild(title);
    topbar.appendChild(copyBtn);
    panel.appendChild(topbar);

    // Inspector area (swaps based on selection)
    inspectorArea = document.createElement('div');
    panel.appendChild(inspectorArea);

    // Element list
    const { section: listSection, body: listBody } = createSection('Elements');
    elementList = listBody;
    rebuildElementList();
    panel.appendChild(listSection);
  }

  function rebuildElementList() {
    if (!elementList) return;
    elementList.innerHTML = '';

    // Columns
    for (const col of state.columns) {
      const btn = makeElementBtn(col.id, 'column', 'col');
      elementList.appendChild(btn);
    }

    // Obstacles
    for (const obs of state.obstacles) {
      const typeLabel = obs.kind === 'geometric'
        ? (obs as { contour: string }).contour
        : obs.kind;
      const btn = makeElementBtn(obs.id, 'obstacle', typeLabel);
      elementList.appendChild(btn);
    }

    // Text blocks
    for (const tb of state.textBlocks) {
      const btn = makeElementBtn(tb.id, 'textBlock', 'text');
      elementList.appendChild(btn);
    }
  }

  function makeElementBtn(id: string, kind: 'column' | 'obstacle' | 'textBlock', typeLabel: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `pt-element-btn${id === selectedId ? ' selected' : ''}`;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = id;
    const typeSpan = document.createElement('span');
    typeSpan.className = 'pt-element-type';
    typeSpan.textContent = `(${typeLabel})`;

    btn.appendChild(nameSpan);
    btn.appendChild(typeSpan);

    btn.addEventListener('click', () => selectElement(id, kind));

    return btn;
  }

  function selectElement(id: string, kind: 'column' | 'obstacle' | 'textBlock') {
    selectedId = id;
    selectedKind = kind;

    // Update active state in list
    const allBtns = elementList?.querySelectorAll('.pt-element-btn') ?? [];
    for (const btn of allBtns) {
      btn.classList.toggle('selected', btn.querySelector('span')?.textContent === id);
    }

    // Show appropriate sub-panel
    showInspector();
  }

  function showInspector() {
    if (!inspectorArea) return;
    inspectorArea.innerHTML = '';

    // Destroy old panels
    typoPanel?.destroy();
    wrapPanel?.destroy();
    colPanel?.destroy();
    typoPanel = null;
    wrapPanel = null;
    colPanel = null;

    if (!selectedId || !selectedKind) return;

    switch (selectedKind) {
      case 'textBlock': {
        const block = state.textBlocks.find(t => t.id === selectedId);
        if (!block) break;
        typoPanel = createTypographyPanel(block, (patch) => {
          Object.assign(block, patch);
          notifyChange();
        });
        inspectorArea.appendChild(typoPanel.element);
        break;
      }
      case 'obstacle': {
        const obs = state.obstacles.find(o => o.id === selectedId);
        if (!obs) break;
        wrapPanel = createWrapPanel(obs, (patch) => {
          Object.assign(obs, patch);
          notifyChange();
        });
        inspectorArea.appendChild(wrapPanel.element);
        break;
      }
      case 'column': {
        const col = state.columns.find(c => c.id === selectedId);
        if (!col) break;
        colPanel = createColumnPanel(col, (patch) => {
          Object.assign(col, patch);
          notifyChange();
        });
        inspectorArea.appendChild(colPanel.element);
        break;
      }
    }
  }

  // ── Public API ──

  function attach(newState: PretextState) {
    // Deep clone to avoid external mutation
    state = {
      columns: newState.columns.map(c => ({ ...c })),
      obstacles: newState.obstacles.map(o => ({ ...o } as Obstacle)),
      textBlocks: newState.textBlocks.map(t => ({ ...t })),
    };
    selectedId = null;
    selectedKind = null;

    buildPanel();
    panel.style.display = '';
  }

  function detach() {
    panel.style.display = 'none';
    selectedId = null;
    selectedKind = null;
  }

  function destroy() {
    typoPanel?.destroy();
    wrapPanel?.destroy();
    colPanel?.destroy();
    panel.remove();
    styleEl.remove();
  }

  function getDescriptor(): PretextDescriptor {
    return buildDescriptor(state);
  }

  return { attach, detach, destroy, getDescriptor };
}
```

**Step 4: Create barrel export**

Create `tools/pretext-panel/src/index.ts`:

```ts
export { createPretextTool } from './pretextTool';
export type { PretextTool, PretextToolOptions } from './pretextTool';
export type { PretextDescriptor, Column, TextBlock, Obstacle, WrapSide, ContourType, Offsets, Bounds, WhiteSpaceMode } from './types';
export { buildDescriptor, copyDescriptorToClipboard, type PretextState } from './descriptor';
export { parseFont, composeFont, type ParsedFont } from './fontParser';
```

**Step 5: Run tests**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run test/pretextTool.test.ts
```

Expected: all tests PASS.

**Step 6: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/src/pretextTool.ts tools/pretext-panel/src/index.ts tools/pretext-panel/test/pretextTool.test.ts
git commit -m "feat(pretext-panel): add combined panel shell with element list and clipboard export"
```

---

### Task 9: Vite Build + Dev Injector

Build configuration to produce a single injectable IIFE bundle, plus a bookmarklet and a dev HTML page for standalone testing.

**Files:**
- Create: `tools/pretext-panel/vite.config.ts`
- Create: `tools/pretext-panel/dev/index.html`
- Create: `tools/pretext-panel/dev/inject.ts`

**Step 1: Create Vite build config**

Create `tools/pretext-panel/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PretextPanel',
      fileName: 'pretext-panel',
      formats: ['iife', 'es'],
    },
    outDir: 'dist',
    minify: false,
  },
  css: {
    transformer: 'lightningcss',
  },
});
```

**Step 2: Create dev injector script**

Create `tools/pretext-panel/dev/inject.ts`:

```ts
/**
 * Dev injector — creates a shadow DOM host and attaches the pretext panel.
 *
 * Usage: load this script on any page, or use the dev/index.html harness.
 * Exposes window.__pretextTool for console interaction.
 */

import { createPretextTool, type PretextState } from '../src/index';

// Create shadow DOM host
const host = document.createElement('div');
host.id = 'pretext-panel-host';
host.style.cssText = 'position: fixed; top: 16px; right: 16px; z-index: 999999;';
document.body.appendChild(host);
const shadowRoot = host.attachShadow({ mode: 'open' });

// Create tool
const tool = createPretextTool({
  shadowRoot,
  onStateChange: (state) => {
    console.log('[pretext-panel] state changed:', state);
  },
});

// Sample state for testing
const sampleState: PretextState = {
  columns: [
    { id: 'left', x: 16, width: 180 },
    { id: 'center', x: 210, width: 340 },
    { id: 'right', x: 564, width: 180 },
  ],
  obstacles: [
    {
      id: 'logo',
      kind: 'geometric',
      contour: 'polygon',
      bounds: { x: 16, y: 600, width: 200, height: 200 },
      wrap: 'both',
      offsets: { top: 8, right: 8, bottom: 8, left: 8 },
    },
    {
      id: 'orb',
      kind: 'geometric',
      contour: 'circle',
      bounds: { x: 240, y: 340, width: 120, height: 120 },
      wrap: 'both',
      offsets: { top: 6, right: 6, bottom: 6, left: 6 },
      cx: 300,
      cy: 400,
      radius: 60,
    },
    {
      id: 'dropcap',
      kind: 'dropcap',
      character: 'G',
      font: "64px 'Waves Blackletter CPC'",
      lineCount: 3,
    },
    {
      id: 'quote',
      kind: 'pullquote',
      text: 'In the twilight of confusion new ideas emerge.',
      font: 'italic 20px Mondwest',
      maxWidth: 160,
      wrap: 'rightSide',
      offsets: { top: 12, right: 12, bottom: 12, left: 0 },
    },
  ],
  textBlocks: [
    { id: 'body', font: '16px Mondwest', lineHeight: 19.2, whiteSpace: 'normal' },
    { id: 'headline', font: '700 32px Mondwest', lineHeight: 36, whiteSpace: 'normal' },
  ],
};

tool.attach(sampleState);

// Expose for console debugging
(window as Record<string, unknown>).__pretextTool = tool;
console.log('[pretext-panel] Injected. Access via window.__pretextTool');
```

**Step 3: Create dev HTML harness**

Create `tools/pretext-panel/dev/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pretext Panel — Dev Harness</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      background: oklch(0.16 0.004 85);
      color: oklch(0.98 0.03 94);
      font-family: 'PixelCode', monospace;
      font-size: 14px;
    }
    h1 { font-size: 18px; margin-bottom: 8px; }
    p { color: oklch(0.98 0.03 94 / 0.6); font-size: 12px; max-width: 400px; }
    code { color: oklch(0.91 0.12 94); }
  </style>
</head>
<body>
  <h1>Pretext Panel Dev Harness</h1>
  <p>
    The panel should appear in the top-right corner. Click elements in the
    Elements list to inspect them. Use <code>window.__pretextTool</code> in
    the console to interact programmatically.
  </p>
  <p>
    Click <strong>Copy</strong> to export the current pretext descriptor JSON
    to your clipboard.
  </p>
  <script type="module" src="./inject.ts"></script>
</body>
</html>
```

**Step 4: Add dev script to package.json**

Add to `tools/pretext-panel/package.json` scripts:

```json
"dev": "vite dev/",
```

**Step 5: Test the build**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vite build
```

Expected: `dist/pretext-panel.iife.js` and `dist/pretext-panel.js` created.

**Step 6: Test the dev server**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vite dev/
```

Open `localhost:5173`. Verify:
- Dark panel appears in top-right
- Elements list shows all 7 elements (3 columns, 3 obstacles, 1 text block... wait — 3 columns + 4 obstacles + 2 text blocks = 9)
- Clicking an element shows its inspector
- Copy button copies JSON to clipboard
- Console shows `[pretext-panel] Injected.`

**Step 7: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/vite.config.ts tools/pretext-panel/dev/ tools/pretext-panel/package.json
git commit -m "feat(pretext-panel): add Vite build config and dev harness"
```

---

### Task 10: Full Test Suite + Smoke Test

Run all tests, fix any issues, and add a barrel export smoke test.

**Files:**
- Create: `tools/pretext-panel/test/smoke.test.ts`

**Step 1: Write barrel smoke test**

Create `tools/pretext-panel/test/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('@rdna/pretext-panel exports', () => {
  it('exports createPretextTool', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.createPretextTool).toBe('function');
  });

  it('exports buildDescriptor', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.buildDescriptor).toBe('function');
  });

  it('exports parseFont and composeFont', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.parseFont).toBe('function');
    expect(typeof mod.composeFont).toBe('function');
  });
});
```

**Step 2: Run the full test suite**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel/tools/pretext-panel
pnpm exec vitest run
```

Expected: all tests across all files PASS.

**Step 3: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-panel
git add tools/pretext-panel/test/smoke.test.ts
git commit -m "test(pretext-panel): add barrel export smoke test"
```

---

## Summary

After all 10 tasks, the standalone panel provides:

| Module | What |
|--------|------|
| `fontParser.ts` | Decompose/recompose canvas font shorthand ↔ {family, weight, style, size} |
| `types.ts` | Full pretext descriptor types (columns, obstacles, text blocks, wrap side, offsets) |
| `descriptor.ts` | Build clean JSON descriptor + clipboard export |
| `ui.ts` | Shadow DOM UI primitives: sections, scrub labels, inputs, dropdowns, toggles, grids |
| `theme.css` | Flow-compatible dark theme (pt-* prefix, same OKLch palette) |
| `typographyPanel.ts` | Text block editor: font family/weight/style/size, line height, white space, max column height |
| `wrapPanel.ts` | InDesign-style obstacle editor: wrap side, linked offsets, contour type, bounds, circle/dropcap/pullquote fields |
| `columnPanel.ts` | Column editor: x position + width |
| `pretextTool.ts` | Combined factory: shadow DOM injection, element list, sub-panel switching, clipboard export |
| `dev/inject.ts` | Dev harness: injectable script + sample state for standalone testing |

**Output format:** Pretext descriptor JSON (version 1) — columns, obstacles, text blocks — designed for LLM consumption, not CSS.

**Integration path:** The `createPretextTool()` factory matches flow's tool interface. To merge into flow later: (1) rename `pt-*` classes to `flow-pt-*`, (2) add to flow's mode controller as a new design sub-mode, (3) wire `onStateChange` to flow's mutation engine if live reflow is wanted.

## Future Tasks (not in this plan)

| Phase | What |
|-------|------|
| P1 | Wire to GoodNewsApp for live reflow (connect `onStateChange` → `computeLayout`) |
| P1 | Add drag-to-reposition for panel (flow's panel positioning pattern) |
| P1 | Polygon hull vertex editor (visual display of hull points) |
| P2 | Merge into flow as design sub-mode (key: `P`) |
| P2 | Typography panel for CSS output (separate from pretext — standard flow typography) |
| P2 | Undo/redo stack on panel state |
