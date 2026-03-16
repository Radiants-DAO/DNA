# eslint-plugin-rdna Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Build a co-located ESLint plugin that enforces the RDNA design system contract — hardcoded colors, spacing, typography, component wrappers, and removed aliases — with auto-fix for safe 1:1 token mappings.

**Worktree:** Create a new worktree before execution: `git worktree add ../DNA-eslint-plugin -b feat/eslint-plugin-rdna`

**Architecture:** ESLint 9 flat-config plugin written as plain ESM (.mjs) — no build step. Lives at `packages/radiants/eslint/`. Consumed via `@rdna/radiants/eslint` package export. Tests use vitest + ESLint RuleTester. Token-map.mjs is the single source of truth for auto-fix mappings.

**Tech Stack:** ESLint 9 (flat config), vitest, pnpm workspaces

**V1 Scope Guardrail:** Lint only `ts`/`tsx` UI source. CSS is out of scope until the repo adds a CSS-aware parser/tooling path.

**Brainstorm:** `docs/brainstorms/2026-03-05-radiants-design-system-enforcement.md`

---

## Reference: RDNA Token Vocabulary

From `packages/radiants/tokens.css`. The ESLint plugin needs to know these exact values.

### Brand Palette (Tier 1)
| Token | Hex |
|---|---|
| `--color-cream` | `#FEF8E2` |
| `--color-ink` | `#0F0E0C` |
| `--color-pure-black` | `#000000` |
| `--color-sun-yellow` | `#FCE184` |
| `--color-sky-blue` | `#95BAD2` |
| `--color-sunset-fuzz` | `#FCC383` |
| `--color-sun-red` | `#FF6B63` |
| `--color-mint` | `#CEF5CA` |
| `--color-pure-white` | `#FFFFFF` |
| `--color-success-mint` | `#22C55E` |

### Semantic Tokens (Tier 2) — by Tailwind prefix context

**`bg-*` context (surface tokens):**
`page`, `inv`, `tinted`, `card`, `depth`, `depth`, `hover`, `hover`, `active`

**`text-*` context (content tokens):**
`main`, `head`, `sub`, `flip`, `mute`, `link`

**`border-*` context (edge tokens):**
`line`, `rule`, `line-hover`, `focus`

**Multi-context (action/status tokens):**
`accent`, `accent-inv`, `danger`, `accent-soft`, `success`, `warning`, `danger`, `link`

### Typography Scale
`text-xs` (8px), `text-sm` (12px), `text-base` (16px), `text-lg` (20px), `text-xl` (24px), `text-2xl` (28px), `text-3xl` (32px)

### Radius Scale
`radius-none`, `radius-xs` (2px), `radius-sm` (4px), `radius-md` (8px), `radius-lg` (16px), `radius-full`

### Removed Aliases (MUST NOT appear)
`--color-black`, `--color-white`, `--color-green`, `--color-success-green`, `--glow-green`

---

## Task 1: Plugin Scaffold + Package Wiring

**Files:**
- Create: `packages/radiants/eslint/index.mjs`
- Create: `packages/radiants/eslint/token-map.mjs`
- Create: `packages/radiants/eslint/utils.mjs`
- Create: `packages/radiants/eslint/rules/` (empty dir, placeholder)
- Modify: `packages/radiants/package.json` (add exports + files entry)
- Modify: root `package.json` (add eslint devDep + lint:design-system scripts)
- Create: `eslint.rdna.config.mjs` (root-level RDNA ESLint config)

### Step 1: Create `packages/radiants/eslint/token-map.mjs`

This is the single source of truth for auto-fix. Maps hex values to semantic token names, keyed by Tailwind prefix context.

```js
/**
 * @rdna/radiants ESLint token map
 * Single source of truth for auto-fix hex → semantic-token mappings.
 *
 * Structure: hexToSemantic maps lowercase hex → { bg, text, border, any }
 * where each key is the Tailwind prefix context and the value is the
 * semantic token class suffix (without the prefix).
 */

// Brand palette — raw hex values from tokens.css
export const brandPalette = {
  '#fef8e2': 'cream',
  '#0f0e0c': 'ink',
  '#000000': 'pure-black',
  '#fce184': 'sun-yellow',
  '#95bad2': 'sky-blue',
  '#fcc383': 'sunset-fuzz',
  '#ff6b63': 'sun-red',
  '#cef5ca': 'mint',
  '#ffffff': 'pure-white',
  '#22c55e': 'success-mint',
};

// Hex → semantic token mapping, keyed by Tailwind prefix context.
// Only includes 1:1 safe mappings. Ambiguous mappings are omitted.
//
// Keys: bg = background, text = text color, border = border color,
//        ring = ring color, any = use when context is unknown
export const hexToSemantic = {
  // cream → page (bg), flip (text)
  '#fef8e2': {
    bg: 'page',
    text: 'flip',
  },
  // ink → main (text), inv (bg), line (border)
  '#0f0e0c': {
    bg: 'inv',
    text: 'main',
    border: 'line',
  },
  // sun-yellow → accent (bg), focus (border/ring)
  '#fce184': {
    bg: 'accent',
    border: 'focus',
    ring: 'focus',
  },
  // sky-blue → link (text), link (bg/text)
  '#95bad2': {
    text: 'link',
  },
  // sunset-fuzz → tinted (bg), accent-soft (bg)
  '#fcc383': {
    bg: 'accent-soft',
  },
  // sun-red → danger (bg), danger (text/bg)
  '#ff6b63': {
    bg: 'danger',
    text: 'danger',
  },
  // mint → success
  '#cef5ca': {
    bg: 'success',
    text: 'success',
  },
  // pure-white → card (bg)
  '#ffffff': {
    bg: 'card',
  },
  // pure-black — no safe 1:1 mapping (too generic)
  // success-mint
  '#22c55e': {
    text: 'success',
  },
};

// Allowed Tailwind text-size classes (maps to --font-size-* tokens)
export const allowedTextSizes = new Set([
  'text-xs', 'text-sm', 'text-base', 'text-lg',
  'text-xl', 'text-2xl', 'text-3xl',
]);

// Allowed Tailwind font-weight classes
export const allowedFontWeights = new Set([
  'font-thin', 'font-extralight', 'font-light', 'font-normal',
  'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black',
]);

// Removed aliases — MUST NOT appear anywhere
export const removedAliases = [
  '--color-black',
  '--color-white',
  '--color-green',
  '--color-success-green',
  '--glow-green',
];

// RDNA components and the raw HTML elements they replace
export const rdnaComponentMap = {
  button: { component: 'Button', import: '@rdna/radiants/components/core' },
  // Input enforcement is limited to text-like inputs in v1.
  input: { component: 'Input', import: '@rdna/radiants/components/core', note: 'Only enforce for text-like input types in v1' },
  select: { component: 'Select', import: '@rdna/radiants/components/core' },
  textarea: { component: 'Input', import: '@rdna/radiants/components/core', note: 'Use Input with multiline' },
  dialog: { component: 'Dialog', import: '@rdna/radiants/components/core' },
  details: { component: 'Accordion', import: '@rdna/radiants/components/core' },
  summary: { component: 'Accordion', import: '@rdna/radiants/components/core', note: 'Use Accordion trigger' },
};
```

### Step 2: Create `packages/radiants/eslint/utils.mjs`

Shared utility functions used by multiple rules.

```js
/**
 * Shared utilities for eslint-plugin-rdna rules.
 */

// Regex patterns for detecting hardcoded values in className strings
export const HEX_PATTERN = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
export const RGB_PATTERN = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;
export const HSL_PATTERN = /hsla?\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+\s*)?\)/g;

// Matches arbitrary Tailwind color values: bg-[#fff], text-[rgb(0,0,0)], etc.
export const ARBITRARY_COLOR_CLASS = /(?:bg|text|border|ring|outline|decoration|accent|caret|fill|stroke|from|via|to|divide|placeholder)-\[(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))\]/g;

// Matches arbitrary spacing values: p-[12px], gap-[13px], mx-[5%], etc.
// Intentionally limited to spacing concerns, not general sizing or positioning.
export const ARBITRARY_SPACING_CLASS = /(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y)-\[[^\]]+\]/g;

// Matches arbitrary font-size values: text-[44px], text-[1.1rem]
export const ARBITRARY_TEXT_SIZE_CLASS = /text-\[\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)\]/g;

// Matches arbitrary font-weight values: font-[450]
export const ARBITRARY_FONT_WEIGHT_CLASS = /font-\[\d+\]/g;

/**
 * Normalize hex to lowercase 6-digit form for lookup.
 */
export function normalizeHex(hex) {
  let h = hex.toLowerCase().replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; // drop alpha for lookup
  if (h.length === 8) h = h.slice(0, 6); // drop alpha for lookup
  return '#' + h;
}

/**
 * Extract the Tailwind prefix context from an arbitrary class.
 * e.g. "bg-[#fff]" → "bg", "text-[#000]" → "text"
 */
export function extractPrefixContext(cls) {
  const match = cls.match(/^(bg|text|border|ring|outline|decoration|accent|caret|fill|stroke|from|via|to|divide|placeholder)-\[/);
  return match ? match[1] : null;
}

/**
 * Map a Tailwind color prefix to a token-map context key.
 * bg → bg, text → text, border → border, ring → ring, etc.
 */
export function prefixToContext(prefix) {
  if (['bg', 'from', 'via', 'to'].includes(prefix)) return 'bg';
  if (['text', 'decoration', 'caret', 'placeholder', 'accent'].includes(prefix)) return 'text';
  if (['border', 'outline', 'divide'].includes(prefix)) return 'border';
  if (['ring'].includes(prefix)) return 'ring';
  if (['fill', 'stroke'].includes(prefix)) return 'bg'; // SVG context — treat as bg
  return null;
}

/**
 * Check if a file path is inside radiants component internals (exempt from wrapper rule).
 */
export function isRadiantsInternal(filename) {
  return filename.includes('packages/radiants/components/core/');
}

/**
 * Extract all className string literal values from a JSX attribute.
 * Returns array of { value, range } for each string segment.
 */
export function getClassNameStrings(node) {
  // Handle: className="foo bar"
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return [{ value: node.value, node }];
  }
  // Handle: className={`foo bar`}
  if (node.type === 'TemplateLiteral') {
    return node.quasis.map(q => ({ value: q.value.raw, node: q }));
  }
  // Handle: className={"foo bar"}
  if (node.type === 'JSXExpressionContainer') {
    return getClassNameStrings(node.expression);
  }
  return [];
}
```

### Step 3: Create `packages/radiants/eslint/index.mjs`

Plugin entrypoint. Exports rules and configs (populated in later tasks).

```js
/**
 * eslint-plugin-rdna
 * Design system enforcement for @rdna/radiants.
 *
 * Usage in flat config:
 *   import rdna from '@rdna/radiants/eslint';
 *   export default [{ plugins: { rdna }, rules: { ...rdna.configs.recommended.rules } }];
 */

// Rules are imported as they're implemented.
// Placeholder structure — each task below adds its rule import.

const plugin = {
  meta: {
    name: 'eslint-plugin-rdna',
    version: '0.1.0',
  },
  rules: {},
  configs: {},
};

// Configs reference the plugin itself for flat-config compatibility.
plugin.configs.recommended = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'warn',
    'rdna/no-hardcoded-spacing': 'warn',
    'rdna/no-hardcoded-typography': 'warn',
    'rdna/prefer-rdna-components': 'warn',
    'rdna/no-removed-aliases': 'warn',
  },
};

plugin.configs.internals = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'warn',
    'rdna/no-hardcoded-spacing': 'warn',
    'rdna/no-hardcoded-typography': 'warn',
    'rdna/prefer-rdna-components': 'off',
    'rdna/no-removed-aliases': 'warn',
  },
};

// Strict configs — flip after warn-mode migration is complete
plugin.configs['recommended-strict'] = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'error',
    'rdna/no-hardcoded-spacing': 'error',
    'rdna/no-hardcoded-typography': 'error',
    'rdna/prefer-rdna-components': 'error',
    'rdna/no-removed-aliases': 'error',
  },
};

export default plugin;
```

### Step 4: Wire up package.json exports

**Modify `packages/radiants/package.json`:**
- Add `"./eslint"` to exports map
- Add `"eslint/"` to files array
- Add `eslint` as a devDependency (needed for RuleTester in tests)

```json
// In "exports", add:
"./eslint": {
  "import": "./eslint/index.mjs"
}

// In "files", add:
"eslint/"

// In "devDependencies", add:
"eslint": "^9"
```

### Step 5: Create root `eslint.rdna.config.mjs`

Orchestrator config consumed by `lint:design-system` script, pre-commit hook, and CI.

```js
import rdna from './packages/radiants/eslint/index.mjs';

export default [
  // Consuming apps — full rule set
  {
    files: [
      'apps/rad-os/**/*.{ts,tsx}',
      'apps/radiator/**/*.{ts,tsx}',
    ],
    plugins: { rdna },
    rules: {
      ...rdna.configs.recommended.rules,
    },
  },
  // Radiants component internals — no wrapper rule
  {
    files: ['packages/radiants/components/core/**/*.{ts,tsx}'],
    plugins: { rdna },
    rules: {
      ...rdna.configs.internals.rules,
    },
  },
];
```

### Step 6: Add orchestrator scripts to root `package.json`

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "lint:design-system": "pnpm exec eslint --config eslint.rdna.config.mjs 'packages/radiants/components/core/**/*.{ts,tsx}' 'apps/rad-os/**/*.{ts,tsx}' 'apps/radiator/**/*.{ts,tsx}'",
    "lint:design-system:staged": "node scripts/lint-design-system-staged.mjs"
  },
  "devDependencies": {
    "eslint": "^9",
    "turbo": "^2.0.0"
  }
}
```

### Step 7: Run `pnpm install` to resolve new deps

```bash
pnpm install
```

### Step 8: Verify plugin imports correctly

```bash
node -e "import('./packages/radiants/eslint/index.mjs').then(m => console.log(Object.keys(m.default.configs)))"
```

Expected: `['recommended', 'internals', 'recommended-strict']`

### Step 9: Commit

```bash
git add packages/radiants/eslint/ packages/radiants/package.json package.json eslint.rdna.config.mjs
git commit -m "feat(rdna): scaffold eslint-plugin-rdna with token-map and configs"
```

---

## Task 2: `no-hardcoded-colors` Rule + Tests

**Files:**
- Create: `packages/radiants/eslint/rules/no-hardcoded-colors.mjs`
- Create: `packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs` (register rule)

### Step 1: Write the test file

```js
// packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-hardcoded-colors.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-hardcoded-colors', () => {
  it('passes RuleTester', () => {
    tester.run('no-hardcoded-colors', rule, {
      valid: [
        // Semantic token classes — allowed
        { code: '<div className="bg-page text-main" />' },
        { code: '<div className="border-line" />' },
        { code: '<div className="text-link hover:bg-accent" />' },
        // Non-color arbitrary values — not this rule's job
        { code: '<div className="p-[12px]" />' },
        // Empty className
        { code: '<div className="" />' },
        // No className
        { code: '<div id="test" />' },
        // Template literal with only dynamic parts
        { code: '<div className={active ? "bg-page" : "bg-inv"} />' },
      ],
      invalid: [
        // Arbitrary hex in Tailwind class
        {
          code: '<div className="bg-[#FEF8E2]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="bg-page" />',
        },
        // Arbitrary hex — lowercase
        {
          code: '<div className="text-[#0f0e0c]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="text-main" />',
        },
        // Arbitrary hex — no auto-fix when ambiguous (pure-black has no safe mapping)
        {
          code: '<div className="bg-[#000000]" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Arbitrary rgb
        {
          code: '<div className="bg-[rgb(254,248,226)]" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Multiple violations in one className
        {
          code: '<div className="bg-[#FEF8E2] text-[#0f0e0c]" />',
          errors: [{ messageId: 'arbitraryColor' }, { messageId: 'arbitraryColor' }],
          output: '<div className="bg-page text-main" />',
        },
        // Style object with hex literal
        {
          code: '<div style={{ color: "#0F0E0C" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        // Style object with rgb
        {
          code: '<div style={{ backgroundColor: "rgb(254, 248, 226)" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
      ],
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/no-hardcoded-colors.test.mjs
```

Expected: FAIL (rule module doesn't exist yet)

### Step 3: Implement the rule

Create `packages/radiants/eslint/rules/no-hardcoded-colors.mjs`:

```js
/**
 * rdna/no-hardcoded-colors
 * Bans hardcoded color values in className and style props.
 * Auto-fixes arbitrary Tailwind color classes when a 1:1 token mapping exists.
 */
import { hexToSemantic } from '../token-map.mjs';
import {
  normalizeHex,
  extractPrefixContext,
  prefixToContext,
  ARBITRARY_COLOR_CLASS,
  HEX_PATTERN,
  RGB_PATTERN,
  HSL_PATTERN,
} from '../utils.mjs';

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban hardcoded color values; require RDNA semantic tokens',
    },
    fixable: 'code',
    messages: {
      arbitraryColor:
        'Hardcoded color "{{raw}}" in className. Use a semantic token instead (e.g. {{suggestion}}).',
      hardcodedColorStyle:
        'Hardcoded color "{{raw}}" in style prop. Use a CSS variable: var(--color-*).',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') checkClassNameValue(context, node.value);
        if (node.name.name === 'style') checkStyleObject(context, node.value);
      },
    };
  },
};

function checkClassNameValue(context, valueNode) {
  if (!valueNode) return;

  // className="literal string"
  if (valueNode.type === 'Literal' && typeof valueNode.value === 'string') {
    findAndReportArbitraryColors(context, valueNode, valueNode.value);
    return;
  }

  // className={"string"} or className={`template`}
  if (valueNode.type === 'JSXExpressionContainer') {
    const expr = valueNode.expression;
    if (expr.type === 'Literal' && typeof expr.value === 'string') {
      findAndReportArbitraryColors(context, expr, expr.value);
    }
    if (expr.type === 'TemplateLiteral') {
      for (const quasi of expr.quasis) {
        findAndReportArbitraryColors(context, quasi, quasi.value.raw);
      }
    }
  }
}

function findAndReportArbitraryColors(context, node, text) {
  // Find arbitrary Tailwind color classes: bg-[#fff], text-[rgb(...)], etc.
  const classRegex = /(?:bg|text|border|ring|outline|decoration|accent|caret|fill|stroke|from|via|to|divide|placeholder)-\[(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))\]/g;
  let match;
  while ((match = classRegex.exec(text)) !== null) {
    const raw = match[0];
    const prefix = extractPrefixContext(raw);
    const ctxKey = prefix ? prefixToContext(prefix) : null;

    // Try to extract hex for auto-fix lookup
    const hexMatch = raw.match(/#[0-9a-fA-F]{3,8}/);
    let fix = null;
    let suggestion = 'bg-page, text-main, etc.';

    if (hexMatch && ctxKey) {
      const normalized = normalizeHex(hexMatch[0]);
      const mapping = hexToSemantic[normalized];
      if (mapping && mapping[ctxKey]) {
        fix = `${prefix}-${mapping[ctxKey]}`;
        suggestion = fix;
      }
    }

    context.report({
      node,
      messageId: 'arbitraryColor',
      data: { raw, suggestion },
      fix: fix
        ? (fixer) => {
            const src = context.getSourceCode().getText(node);
            const newSrc = src.replace(raw, fix);
            return fixer.replaceText(node, newSrc);
          }
        : null,
    });
  }
}

function checkStyleObject(context, valueNode) {
  if (!valueNode || valueNode.type !== 'JSXExpressionContainer') return;
  const expr = valueNode.expression;
  if (expr.type !== 'ObjectExpression') return;

  for (const prop of expr.properties) {
    if (prop.type !== 'Property') continue;
    const val = prop.value;
    if (val.type !== 'Literal' || typeof val.value !== 'string') continue;

    const str = val.value;
    if (HEX_PATTERN.test(str) || RGB_PATTERN.test(str) || HSL_PATTERN.test(str)) {
      // Reset lastIndex since we used .test()
      HEX_PATTERN.lastIndex = 0;
      RGB_PATTERN.lastIndex = 0;
      HSL_PATTERN.lastIndex = 0;
      context.report({
        node: val,
        messageId: 'hardcodedColorStyle',
        data: { raw: str },
      });
    }
  }
}

export default rule;
```

### Step 4: Register rule in `index.mjs`

Add to `packages/radiants/eslint/index.mjs`:

```js
import noHardcodedColors from './rules/no-hardcoded-colors.mjs';
// ... at top

// In plugin object:
plugin.rules['no-hardcoded-colors'] = noHardcodedColors;
```

### Step 5: Run test to verify it passes

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/no-hardcoded-colors.test.mjs
```

Expected: PASS

### Step 6: Commit

```bash
git add packages/radiants/eslint/rules/no-hardcoded-colors.mjs packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs packages/radiants/eslint/index.mjs
git commit -m "feat(rdna): add no-hardcoded-colors rule with auto-fix"
```

---

## Task 3: `no-hardcoded-typography` Rule + Tests

**Files:**
- Create: `packages/radiants/eslint/rules/no-hardcoded-typography.mjs`
- Create: `packages/radiants/eslint/__tests__/no-hardcoded-typography.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs` (register rule)

### Step 1: Write the test file

```js
// packages/radiants/eslint/__tests__/no-hardcoded-typography.test.mjs
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-hardcoded-typography.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-hardcoded-typography', () => {
  it('passes RuleTester', () => {
    tester.run('no-hardcoded-typography', rule, {
      valid: [
        // Allowed text sizes
        { code: '<p className="text-xs" />' },
        { code: '<p className="text-sm" />' },
        { code: '<p className="text-base" />' },
        { code: '<p className="text-lg" />' },
        { code: '<p className="text-xl" />' },
        { code: '<p className="text-2xl" />' },
        { code: '<p className="text-3xl" />' },
        // Allowed font weights
        { code: '<p className="font-normal" />' },
        { code: '<p className="font-medium" />' },
        { code: '<p className="font-semibold" />' },
        { code: '<p className="font-bold" />' },
        // text-* that aren't font sizes (colors, alignment, etc.)
        { code: '<p className="text-main text-center" />' },
        // Non-typography arbitrary values
        { code: '<p className="bg-[#fff]" />' },
      ],
      invalid: [
        // Arbitrary font size — px
        {
          code: '<p className="text-[44px]" />',
          errors: [{ messageId: 'arbitraryTextSize' }],
        },
        // Arbitrary font size — rem
        {
          code: '<p className="text-[1.1rem]" />',
          errors: [{ messageId: 'arbitraryTextSize' }],
        },
        // Arbitrary font weight
        {
          code: '<p className="font-[450]" />',
          errors: [{ messageId: 'arbitraryFontWeight' }],
        },
        // Style object — fontSize
        {
          code: '<p style={{ fontSize: "14px" }} />',
          errors: [{ messageId: 'hardcodedTypographyStyle' }],
        },
        // Style object — fontWeight as number
        {
          code: '<p style={{ fontWeight: 450 }} />',
          errors: [{ messageId: 'hardcodedTypographyStyle' }],
        },
      ],
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/no-hardcoded-typography.test.mjs
```

Expected: FAIL

### Step 3: Implement the rule

Create `packages/radiants/eslint/rules/no-hardcoded-typography.mjs`:

```js
/**
 * rdna/no-hardcoded-typography
 * Bans arbitrary font sizes and font weights.
 * Allows only RDNA token-mapped text-* and font-* classes.
 */
import { allowedTextSizes, allowedFontWeights } from '../token-map.mjs';
import { ARBITRARY_TEXT_SIZE_CLASS, ARBITRARY_FONT_WEIGHT_CLASS } from '../utils.mjs';

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary font sizes/weights; require RDNA typography tokens',
    },
    messages: {
      arbitraryTextSize:
        'Arbitrary font size "{{raw}}". Use an RDNA text size: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl.',
      arbitraryFontWeight:
        'Arbitrary font weight "{{raw}}". Use a standard weight: font-normal, font-medium, font-semibold, font-bold.',
      hardcodedTypographyStyle:
        'Hardcoded typography value in style prop. Use CSS variable: var(--font-size-*) or var(--font-weight-*).',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') {
          checkClassName(context, node.value);
        }
        if (node.name.name === 'style') {
          checkStyleObject(context, node.value);
        }
      },
    };
  },
};

function checkClassName(context, valueNode) {
  if (!valueNode) return;

  const strings = extractStrings(valueNode);
  for (const { value, node } of strings) {
    // Check arbitrary text sizes: text-[44px], text-[1.1rem]
    const sizeRegex = /text-\[\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)\]/g;
    let match;
    while ((match = sizeRegex.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryTextSize',
        data: { raw: match[0] },
      });
    }

    // Check arbitrary font weights: font-[450]
    const weightRegex = /font-\[\d+\]/g;
    while ((match = weightRegex.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryFontWeight',
        data: { raw: match[0] },
      });
    }
  }
}

function checkStyleObject(context, valueNode) {
  if (!valueNode || valueNode.type !== 'JSXExpressionContainer') return;
  const expr = valueNode.expression;
  if (expr.type !== 'ObjectExpression') return;

  for (const prop of expr.properties) {
    if (prop.type !== 'Property') continue;
    const key = prop.key.name || prop.key.value;
    const val = prop.value;

    if (key === 'fontSize') {
      if ((val.type === 'Literal' && typeof val.value === 'string') ||
          (val.type === 'Literal' && typeof val.value === 'number')) {
        context.report({
          node: val,
          messageId: 'hardcodedTypographyStyle',
        });
      }
    }

    if (key === 'fontWeight') {
      if ((val.type === 'Literal' && typeof val.value === 'number') ||
          (val.type === 'Literal' && typeof val.value === 'string')) {
        context.report({
          node: val,
          messageId: 'hardcodedTypographyStyle',
        });
      }
    }
  }
}

function extractStrings(node) {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return [{ value: node.value, node }];
  }
  if (node.type === 'JSXExpressionContainer') {
    return extractStrings(node.expression);
  }
  if (node.type === 'TemplateLiteral') {
    return node.quasis.map(q => ({ value: q.value.raw, node: q }));
  }
  return [];
}

export default rule;
```

### Step 4: Register rule in `index.mjs`

```js
import noHardcodedTypography from './rules/no-hardcoded-typography.mjs';
plugin.rules['no-hardcoded-typography'] = noHardcodedTypography;
```

### Step 5: Run test to verify it passes

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/no-hardcoded-typography.test.mjs
```

Expected: PASS

### Step 6: Commit

```bash
git add packages/radiants/eslint/rules/no-hardcoded-typography.mjs packages/radiants/eslint/__tests__/no-hardcoded-typography.test.mjs packages/radiants/eslint/index.mjs
git commit -m "feat(rdna): add no-hardcoded-typography rule"
```

---

## Task 4: `no-removed-aliases` Rule + Tests

**Files:**
- Create: `packages/radiants/eslint/rules/no-removed-aliases.mjs`
- Create: `packages/radiants/eslint/__tests__/no-removed-aliases.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs` (register rule)

### Step 1: Write the test file

```js
// packages/radiants/eslint/__tests__/no-removed-aliases.test.mjs
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-removed-aliases.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-removed-aliases', () => {
  it('passes RuleTester', () => {
    tester.run('no-removed-aliases', rule, {
      valid: [
        // Current token names — allowed
        { code: '<div className="bg-page" />' },
        { code: '<div style={{ color: "var(--color-ink)" }} />' },
        { code: 'const x = "var(--color-main)";' },
      ],
      invalid: [
        // Removed alias in className
        {
          code: '<div className="text-[var(--color-black)]" />',
          errors: [{ messageId: 'removedAlias' }],
        },
        // Removed alias in style
        {
          code: '<div style={{ color: "var(--color-white)" }} />',
          errors: [{ messageId: 'removedAlias' }],
        },
        // Removed alias in string literal
        {
          code: 'const bg = "var(--color-green)";',
          errors: [{ messageId: 'removedAlias' }],
        },
        {
          code: 'const bg = "var(--color-success-green)";',
          errors: [{ messageId: 'removedAlias' }],
        },
        {
          code: 'const glow = "var(--glow-green)";',
          errors: [{ messageId: 'removedAlias' }],
        },
      ],
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/no-removed-aliases.test.mjs
```

Expected: FAIL

### Step 3: Implement the rule

Create `packages/radiants/eslint/rules/no-removed-aliases.mjs`:

```js
/**
 * rdna/no-removed-aliases
 * Bans usage of removed token alias names.
 * Scans all string literals and template literals for var(--removed-alias).
 */
import { removedAliases } from '../token-map.mjs';

const aliasPattern = new RegExp(
  removedAliases.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g'
);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban removed RDNA token aliases',
    },
    messages: {
      removedAlias:
        'Removed token alias "{{alias}}" found. This token was removed from RDNA. Check DESIGN.md for the current equivalent.',
    },
    schema: [],
  },

  create(context) {
    function checkString(node, value) {
      aliasPattern.lastIndex = 0;
      let match;
      while ((match = aliasPattern.exec(value)) !== null) {
        context.report({
          node,
          messageId: 'removedAlias',
          data: { alias: match[0] },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkString(node, node.value);
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkString(quasi, quasi.value.raw);
        }
      },
    };
  },
};

export default rule;
```

### Step 4: Register rule in `index.mjs`

```js
import noRemovedAliases from './rules/no-removed-aliases.mjs';
plugin.rules['no-removed-aliases'] = noRemovedAliases;
```

### Step 5: Run test to verify it passes

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/no-removed-aliases.test.mjs
```

Expected: PASS

### Step 6: Commit

```bash
git add packages/radiants/eslint/rules/no-removed-aliases.mjs packages/radiants/eslint/__tests__/no-removed-aliases.test.mjs packages/radiants/eslint/index.mjs
git commit -m "feat(rdna): add no-removed-aliases rule (replaces CI grep check)"
```

---

## Task 5: `no-hardcoded-spacing` Rule + Tests

**Files:**
- Create: `packages/radiants/eslint/rules/no-hardcoded-spacing.mjs`
- Create: `packages/radiants/eslint/__tests__/no-hardcoded-spacing.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs` (register rule)

### Step 1: Write the test file

```js
// packages/radiants/eslint/__tests__/no-hardcoded-spacing.test.mjs
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-hardcoded-spacing.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-hardcoded-spacing', () => {
  it('passes RuleTester', () => {
    tester.run('no-hardcoded-spacing', rule, {
      valid: [
        // Standard Tailwind spacing utilities — allowed
        { code: '<div className="mt-3 px-4 gap-2" />' },
        { code: '<div className="p-0 m-0" />' },
        { code: '<div className="space-y-4" />' },
        // Non-spacing arbitrary values — not this rule's job
        { code: '<div className="bg-[#fff]" />' },
        { code: '<div className="text-[1.5rem]" />' },
        // Arbitrary non-spacing brackets
        { code: '<div className="grid-cols-[1fr_2fr]" />' },
      ],
      invalid: [
        // Arbitrary spacing in className
        {
          code: '<div className="p-[12px]" />',
          errors: [{ messageId: 'arbitrarySpacing' }],
        },
        {
          code: '<div className="gap-[13px]" />',
          errors: [{ messageId: 'arbitrarySpacing' }],
        },
        {
          code: '<div className="mx-[5%]" />',
          errors: [{ messageId: 'arbitrarySpacing' }],
        },
        {
          code: '<div className="mt-[1.5rem]" />',
          errors: [{ messageId: 'arbitrarySpacing' }],
        },
        // Inline spacing styles
        {
          code: '<div style={{ padding: 12 }} />',
          errors: [{ messageId: 'hardcodedSpacingStyle' }],
        },
        {
          code: '<div style={{ gap: "13px" }} />',
          errors: [{ messageId: 'hardcodedSpacingStyle' }],
        },
        {
          code: '<div style={{ margin: "0 auto 12px" }} />',
          errors: [{ messageId: 'hardcodedSpacingStyle' }],
        },
      ],
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/no-hardcoded-spacing.test.mjs
```

Expected: FAIL

### Step 3: Implement the rule

Create `packages/radiants/eslint/rules/no-hardcoded-spacing.mjs`:

```js
/**
 * rdna/no-hardcoded-spacing
 * Bans arbitrary bracket spacing values in Tailwind classes and inline styles.
 * Standard Tailwind scale utilities (mt-3, px-4, gap-2) are ALLOWED.
 * Only arbitrary values like p-[12px], gap-[13px], mx-[5%] are banned.
 * v1 intentionally excludes width/height and positioning utilities.
 */

// Spacing utility prefixes that take length values
const spacingPrefixes = [
  'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
  'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
  'gap', 'gap-x', 'gap-y',
  'space-x', 'space-y',
];

// Build regex: matches spacing-prefix-[anything]
const spacingRegex = new RegExp(
  `(?:${spacingPrefixes.map(p => p.replace('-', '\\-')).join('|')})-\\[[^\\]]+\\]`,
  'g'
);

// Style properties that represent spacing
const spacingStyleProps = new Set([
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingInline', 'paddingBlock', 'paddingInlineStart', 'paddingInlineEnd',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'marginInline', 'marginBlock', 'marginInlineStart', 'marginInlineEnd',
  'gap', 'rowGap', 'columnGap',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary spacing bracket values; allow standard Tailwind scale utilities',
    },
    messages: {
      arbitrarySpacing:
        'Arbitrary spacing value "{{raw}}". Use a standard Tailwind spacing utility (e.g. p-4, gap-2) instead of bracket values.',
      hardcodedSpacingStyle:
        'Hardcoded spacing in style prop ({{prop}}). Use CSS variable or Tailwind class instead.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') {
          checkClassName(context, node.value);
        }
        if (node.name.name === 'style') {
          checkStyleObject(context, node.value);
        }
      },
    };
  },
};

function checkClassName(context, valueNode) {
  if (!valueNode) return;
  const strings = extractStrings(valueNode);
  for (const { value, node } of strings) {
    spacingRegex.lastIndex = 0;
    let match;
    while ((match = spacingRegex.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitrarySpacing',
        data: { raw: match[0] },
      });
    }
  }
}

function checkStyleObject(context, valueNode) {
  if (!valueNode || valueNode.type !== 'JSXExpressionContainer') return;
  const expr = valueNode.expression;
  if (expr.type !== 'ObjectExpression') return;

  for (const prop of expr.properties) {
    if (prop.type !== 'Property') continue;
    const key = prop.key.name || prop.key.value;
    if (!spacingStyleProps.has(key)) continue;

    const val = prop.value;
    // Ban numeric literals (e.g. padding: 12) and string literals with units (e.g. gap: "13px")
    if (val.type === 'Literal' && (typeof val.value === 'number' || typeof val.value === 'string')) {
      context.report({
        node: val,
        messageId: 'hardcodedSpacingStyle',
        data: { prop: key },
      });
    }
  }
}

function extractStrings(node) {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return [{ value: node.value, node }];
  }
  if (node.type === 'JSXExpressionContainer') {
    return extractStrings(node.expression);
  }
  if (node.type === 'TemplateLiteral') {
    return node.quasis.map(q => ({ value: q.value.raw, node: q }));
  }
  return [];
}

export default rule;
```

### Step 4: Register rule in `index.mjs`

```js
import noHardcodedSpacing from './rules/no-hardcoded-spacing.mjs';
plugin.rules['no-hardcoded-spacing'] = noHardcodedSpacing;
```

### Step 5: Run test to verify it passes

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/no-hardcoded-spacing.test.mjs
```

Expected: PASS

### Step 6: Commit

```bash
git add packages/radiants/eslint/rules/no-hardcoded-spacing.mjs packages/radiants/eslint/__tests__/no-hardcoded-spacing.test.mjs packages/radiants/eslint/index.mjs
git commit -m "feat(rdna): add no-hardcoded-spacing rule (bans arbitrary brackets only)"
```

---

## Task 6: `prefer-rdna-components` Rule + Tests

**Files:**
- Create: `packages/radiants/eslint/rules/prefer-rdna-components.mjs`
- Create: `packages/radiants/eslint/__tests__/prefer-rdna-components.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs` (register rule)

### Step 1: Write the test file

```js
// packages/radiants/eslint/__tests__/prefer-rdna-components.test.mjs
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/prefer-rdna-components.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/prefer-rdna-components', () => {
  it('passes RuleTester', () => {
    tester.run('prefer-rdna-components', rule, {
      valid: [
        // RDNA components — allowed
        { code: '<Button>Click</Button>' },
        { code: '<Input placeholder="Search" />' },
        { code: '<Select />' },
        { code: '<Dialog open><DialogContent /></Dialog>' },
        // Native controls intentionally exempted in v1
        { code: '<input type="hidden" name="token" />' },
        { code: '<input type="file" />' },
        { code: '<input type="checkbox" />' },
        { code: '<input type="date" />' },
        // Non-mapped elements — allowed
        { code: '<div>content</div>' },
        { code: '<span>text</span>' },
        { code: '<form onSubmit={handleSubmit}><Input /></form>' },
        { code: '<a href="/about">About</a>' },
        { code: '<img src="logo.png" />' },
        // Internals file — exempt (uses filename option)
        {
          code: '<button onClick={handleClick}>internal</button>',
          options: [{ exemptPaths: ['**/packages/radiants/components/core/**'] }],
          filename: '/repo/packages/radiants/components/core/Button/Button.tsx',
        },
      ],
      invalid: [
        // Raw HTML button
        {
          code: '<button onClick={handleClick}>Save</button>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML input
        {
          code: '<input type="text" placeholder="Name" />',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        {
          code: '<input placeholder="Name" />',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML select
        {
          code: '<select><option>A</option></select>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML textarea
        {
          code: '<textarea rows={5} />',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML dialog
        {
          code: '<dialog open>content</dialog>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML details
        {
          code: '<details><summary>Title</summary>Body</details>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
      ],
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/prefer-rdna-components.test.mjs
```

Expected: FAIL

### Step 3: Implement the rule

Create `packages/radiants/eslint/rules/prefer-rdna-components.mjs`:

```js
/**
 * rdna/prefer-rdna-components
 * Bans raw HTML elements when an RDNA component equivalent exists.
 * v1 is intentionally capability-aware:
 * - always bans button, textarea, select, dialog, details
 * - bans input only for text-like inputs and missing type
 * - exempts native-only controls like file, checkbox, radio, date, hidden
 * No auto-fix — replacement requires prop mapping.
 */
import { rdnaComponentMap } from '../token-map.mjs';
import { isRadiantsInternal } from '../utils.mjs';

const bannedElements = new Set(Object.keys(rdnaComponentMap));
const textLikeInputTypes = new Set(['text', 'email', 'password', 'search', 'url', 'tel', 'number']);

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer RDNA components over raw HTML elements',
    },
    messages: {
      preferRdnaComponent:
        'Use RDNA <{{component}}> instead of raw <{{element}}>. Import from {{importPath}}.{{note}}',
    },
    schema: [
      {
        type: 'object',
        properties: {
          exemptPaths: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const exemptPaths = options.exemptPaths || [];
    const filename = context.filename || context.getFilename();

    // Check if file is exempt
    const isExempt = exemptPaths.some(pattern => {
      // Simple glob matching — check if filename contains the core path
      if (pattern.includes('*')) {
        // Use basic pattern matching
        const regexStr = pattern
          .replace(/\*\*/g, '<<DOUBLESTAR>>')
          .replace(/\*/g, '[^/]*')
          .replace(/<<DOUBLESTAR>>/g, '.*');
        return new RegExp(regexStr).test(filename);
      }
      return filename.includes(pattern);
    });

    if (isExempt || isRadiantsInternal(filename)) return {};

    return {
      JSXOpeningElement(node) {
        const name = node.name;
        // Only check simple element names (not member expressions like Foo.Bar)
        if (name.type !== 'JSXIdentifier') return;

        const element = name.name;
        // JSX elements starting with lowercase are HTML elements
        if (element[0] !== element[0].toLowerCase()) return;

        if (!bannedElements.has(element)) return;
        if (element === 'input' && !isTextLikeInput(node)) return;

        const mapping = rdnaComponentMap[element];
        context.report({
          node,
          messageId: 'preferRdnaComponent',
          data: {
            component: mapping.component,
            element,
            importPath: mapping.import,
            note: mapping.note ? ` (${mapping.note})` : '',
          },
        });
      },
    };
  },
};

function isTextLikeInput(node) {
  const typeAttr = node.attributes.find(
    attr =>
      attr.type === 'JSXAttribute' &&
      attr.name &&
      attr.name.name === 'type'
  );

  if (!typeAttr || !typeAttr.value) return true;
  if (typeAttr.value.type !== 'Literal' || typeof typeAttr.value.value !== 'string') {
    return false;
  }

  return textLikeInputTypes.has(typeAttr.value.value);
}

export default rule;
```

### Step 4: Register rule in `index.mjs`

```js
import preferRdnaComponents from './rules/prefer-rdna-components.mjs';
plugin.rules['prefer-rdna-components'] = preferRdnaComponents;
```

### Step 5: Run test to verify it passes

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/prefer-rdna-components.test.mjs
```

Expected: PASS

### Step 6: Commit

```bash
git add packages/radiants/eslint/rules/prefer-rdna-components.mjs packages/radiants/eslint/__tests__/prefer-rdna-components.test.mjs packages/radiants/eslint/index.mjs
git commit -m "feat(rdna): add prefer-rdna-components rule"
```

---

## Task 7: Run All Tests + Integration Smoke Test

### Step 1: Run all plugin tests together

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/
```

Expected: All 5 test files pass.

### Step 2: Run lint:design-system against the actual codebase

```bash
cd /path/to/DNA && pnpm lint:design-system
```

This is a **baseline audit** — expect warnings (since configs use `warn` mode). Document the output.

### Step 3: Create baseline violations report

Save the output to `docs/qa/2026-03-05-rdna-lint-baseline.md`:

```markdown
# RDNA Lint Baseline — 2026-03-05

Generated by: `pnpm lint:design-system`
Mode: warn (pre-migration)

## Summary
- Files scanned: N
- Total warnings: N
- no-hardcoded-colors: N
- no-hardcoded-spacing: N
- no-hardcoded-typography: N
- prefer-rdna-components: N
- no-removed-aliases: N

## Top files by violation count
[list from actual output]
```

### Step 4: Commit

```bash
git add docs/qa/2026-03-05-rdna-lint-baseline.md
git commit -m "docs: add rdna lint baseline audit"
```

---

## Task 8: Pre-commit Hook + Staged File Script

**Files:**
- Create: `.githooks/pre-commit`
- Create: `scripts/lint-design-system-staged.mjs`

### Step 1: Create `.githooks/pre-commit`

```bash
#!/bin/sh
pnpm lint:design-system:staged
```

### Step 2: Create `scripts/lint-design-system-staged.mjs`

```js
#!/usr/bin/env node

/**
 * Runs eslint-plugin-rdna on staged .ts/.tsx files in RDNA scope.
 * Called by .githooks/pre-commit and `pnpm lint:design-system:staged`.
 */
import { execSync } from 'node:child_process';

// Get staged files (NUL-separated for safety with special chars)
const raw = execSync('git diff --cached --name-only --diff-filter=ACMR -z', {
  encoding: 'utf-8',
});

const stagedFiles = raw
  .split('\0')
  .filter(Boolean)
  .filter(f => /\.(tsx?)$/.test(f));

// Filter to in-scope paths only
const inScopePrefixes = [
  'packages/radiants/components/core/',
  'apps/rad-os/',
  'apps/radiator/',
];

const targetFiles = stagedFiles.filter(f =>
  inScopePrefixes.some(prefix => f.startsWith(prefix))
);

if (targetFiles.length === 0) {
  console.log('RDNA: no in-scope staged files. Skipping design-system lint.');
  process.exit(0);
}

console.log(`RDNA: checking ${targetFiles.length} staged file(s)...`);

try {
  execSync(
    `pnpm exec eslint --config eslint.rdna.config.mjs -- ${targetFiles.map(f => `"${f}"`).join(' ')}`,
    { stdio: 'inherit' }
  );
  console.log('RDNA: design system lint passed.');
} catch {
  console.error('');
  console.error('RDNA: design system violations found. Fix before committing.');
  console.error('Use // eslint-disable-next-line rdna/<rule> -- reason:<reason> owner:<team> expires:YYYY-MM-DD issue:<link> for exceptions.');
  process.exit(1);
}
```

### Step 3: Make hook executable

```bash
chmod +x .githooks/pre-commit
chmod +x scripts/lint-design-system-staged.mjs
```

### Step 4: Set git hooks path

```bash
git config core.hooksPath .githooks
```

**Note:** This must be run by each developer. Document in repo README or add to a bootstrap script.

### Step 5: Test the hook with a staged violation

Create a temp file with a hardcoded color, stage it, and try to commit. Verify the hook catches it, then clean up.

### Step 6: Commit

```bash
git add .githooks/pre-commit scripts/lint-design-system-staged.mjs
git commit -m "feat(rdna): add pre-commit hook for design-system lint"
```

---

## Task 9: Expand CI Gate

**Files:**
- Modify: `.github/workflows/rdna-design-guard.yml`

### Step 1: Read current workflow

Read `.github/workflows/rdna-design-guard.yml` to see the existing jobs.

### Step 2: Add design-system-lint job

Add a new job to the existing workflow:

```yaml
  design-system-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: RDNA Design System Lint
        run: pnpm lint:design-system
```

### Step 3: Commit

```bash
git add .github/workflows/rdna-design-guard.yml
git commit -m "ci(rdna): add eslint design-system lint to CI gate"
```

---

## Task 10: Agent Routing — CLAUDE.md + DESIGN.md Update

**Files:**
- Create: `packages/radiants/CLAUDE.md`
- Modify: `packages/radiants/DESIGN.md` (add Machine Enforcement section)

### Step 1: Create `packages/radiants/CLAUDE.md`

Use the package-level `CLAUDE.md` content from the brainstorm's `Layer 3: Agent Routing` section. This is the agent-facing instruction router.

### Step 2: Add Machine Enforcement section to DESIGN.md

Read the current `packages/radiants/DESIGN.md`, then append the `Machine Enforcement` section from the brainstorm's `Layer 1: Canonical Docs` section to the appropriate location in the document.

### Step 3: Commit

```bash
git add packages/radiants/CLAUDE.md packages/radiants/DESIGN.md
git commit -m "docs(rdna): add agent routing CLAUDE.md and machine enforcement section"
```

---

## Task 11: Final Verification

### Step 1: Run all plugin tests

```bash
cd packages/radiants && pnpm exec vitest run eslint/__tests__/
```

Expected: All pass.

### Step 2: Run full design-system lint

```bash
pnpm lint:design-system
```

Expected: Warns only (no errors, since configs use `warn` mode).

### Step 3: Verify plugin import from consuming app config

```bash
node -e "
import rdna from './packages/radiants/eslint/index.mjs';
console.log('Plugin:', rdna.meta.name, rdna.meta.version);
console.log('Rules:', Object.keys(rdna.rules));
console.log('Configs:', Object.keys(rdna.configs));
"
```

Expected:
```
Plugin: eslint-plugin-rdna 0.1.0
Rules: ['no-hardcoded-colors', 'no-hardcoded-typography', 'no-removed-aliases', 'no-hardcoded-spacing', 'prefer-rdna-components']
Configs: ['recommended', 'internals', 'recommended-strict']
```

### Step 4: Summary commit + tag

```bash
git log --oneline feat/eslint-plugin-rdna..HEAD
```

Review all commits are clean. Optionally tag:

```bash
git tag rdna-lint-v0.1.0
```

---

## Post-Implementation: Warn → Error Migration

Per brainstorm governance section:

1. **Sprint 1:** Ship with `warn` mode (done in this plan). Collect baseline violations.
2. **Sprint 2:** Fix baseline violations in in-scope paths. Track count in `docs/qa/`.
3. **Sprint 3:** Flip `recommended` config from `warn` to `error` (change 5 lines in `index.mjs`).
4. **Sprint 4:** Flip CI to `recommended-strict` config if preferred, or just rely on the flipped `recommended`.

---

## Files Created/Modified Summary

| Action | File |
|---|---|
| Create | `packages/radiants/eslint/index.mjs` |
| Create | `packages/radiants/eslint/token-map.mjs` |
| Create | `packages/radiants/eslint/utils.mjs` |
| Create | `packages/radiants/eslint/rules/no-hardcoded-colors.mjs` |
| Create | `packages/radiants/eslint/rules/no-hardcoded-typography.mjs` |
| Create | `packages/radiants/eslint/rules/no-removed-aliases.mjs` |
| Create | `packages/radiants/eslint/rules/no-hardcoded-spacing.mjs` |
| Create | `packages/radiants/eslint/rules/prefer-rdna-components.mjs` |
| Create | `packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs` |
| Create | `packages/radiants/eslint/__tests__/no-hardcoded-typography.test.mjs` |
| Create | `packages/radiants/eslint/__tests__/no-removed-aliases.test.mjs` |
| Create | `packages/radiants/eslint/__tests__/no-hardcoded-spacing.test.mjs` |
| Create | `packages/radiants/eslint/__tests__/prefer-rdna-components.test.mjs` |
| Create | `eslint.rdna.config.mjs` |
| Create | `.githooks/pre-commit` |
| Create | `scripts/lint-design-system-staged.mjs` |
| Create | `packages/radiants/CLAUDE.md` |
| Create | `docs/qa/2026-03-05-rdna-lint-baseline.md` |
| Modify | `packages/radiants/package.json` |
| Modify | `package.json` (root) |
| Modify | `packages/radiants/DESIGN.md` |
| Modify | `.github/workflows/rdna-design-guard.yml` |
