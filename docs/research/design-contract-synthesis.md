# RDNA Design Contract Synthesis

**Status:** Proposal
**Date:** 2026-03-22
**Scope:** Component-level contracts, system-level contracts, generated artifacts, package boundaries

---

## 1. Proposed Component Contract (ComponentMeta v2)

```typescript
/**
 * ComponentMeta v2 — Design Contract Extension
 *
 * Backward-compatible superset of the current ComponentMeta.
 * Every new field is optional so existing *.meta.ts files remain valid.
 */

// ── Structural constraint types ──────────────────────────────────────

/** Declares which raw HTML elements this component replaces. */
interface ElementReplacement {
  /** The HTML tag name this component supersedes. */
  element: string;
  /**
   * Import path for the RDNA component.
   * Used by prefer-rdna-components to generate suggestions.
   */
  import: string;
  /**
   * Optional qualifier narrowing when the replacement applies.
   * e.g. Input only replaces <input> for text-like types.
   */
  qualifier?: string;
}

/** A structural constraint the component imposes on consumer markup. */
interface StructuralRule {
  /** Machine-readable rule ID — maps to an ESLint rule or a guard check. */
  ruleId: string;
  /**
   * Human-readable explanation of what breaks and why.
   * Printed in lint messages, AI prompts, and docs.
   */
  reason: string;
  /**
   * The CSS mechanism that causes the constraint.
   * Gives AI agents enough context to avoid the pattern.
   */
  mechanism?: string;
}

/** Declares which prop values are owned by the theme CSS layer. */
interface StyleOwnership {
  /**
   * data-attribute name the theme CSS selects on.
   * e.g. "data-variant", "data-color", "data-size"
   */
  attribute: string;
  /**
   * Values of that attribute whose styling is fully theme-owned.
   * Consumer code must NOT apply competing semantic color utilities.
   */
  themeOwned: string[];
  /**
   * Values that are consumer-extensible — theme provides a base,
   * consumer may overlay utilities.
   */
  consumerExtensible?: string[];
}

// ── Accessibility contract ───────────────────────────────────────────

interface A11yContract {
  /** ARIA role the root element must carry (or "none" if semantic HTML). */
  role?: string;
  /** Required ARIA attributes that must be present. */
  requiredAttributes?: string[];
  /** Keyboard interactions the component must support. */
  keyboardInteractions?: string[];
  /** Minimum contrast ratio requirement for this component. */
  contrastRequirement?: "AA" | "AAA";
}

// ── The full contract ────────────────────────────────────────────────

interface ComponentContractMeta<TProps = Record<string, unknown>> {
  // ── Existing fields (unchanged) ────────────────────────────────────
  name: string;
  description: string;
  props: Record<string, PropDef>;
  slots?: Record<string, SlotDef>;
  subcomponents?: string[];
  tokenBindings?: Record<string, Record<string, string>>;
  examples?: Array<{ name: string; code: string }>;
  registry?: RegistryMeta<TProps>;
  sourcePath?: string;

  // ── New contract fields ────────────────────────────────────────────

  /**
   * Which HTML elements this component replaces.
   * Drives prefer-rdna-components rule and AI component suggestions.
   *
   * Currently lives in: token-map.mjs rdnaComponentMap (lines 126-134)
   * Consumers: eslint (prefer-rdna-components), AI agents, docs
   */
  replaces?: ElementReplacement[];

  /**
   * Structural constraints the component imposes on consumer markup.
   * e.g. pixel-cornered components cannot use border-* or overflow-hidden.
   *
   * Currently lives in: hardcoded regex in no-clipped-shadow.mjs, no-pixel-border.mjs
   * Consumers: eslint (no-clipped-shadow, no-pixel-border), AI agents
   */
  structuralRules?: StructuralRule[];

  /**
   * Which prop values have their styling fully owned by the theme CSS.
   * Prevents mixed-authority violations (local utilities + theme selectors).
   *
   * Currently lives in: eslint.rdna.config.mjs themeVariants array (line 93-96)
   * Consumers: eslint (no-mixed-style-authority), AI agents
   */
  styleOwnership?: StyleOwnership[];

  /**
   * Accessibility contract for the component.
   *
   * Currently lives in: scattered across component implementations
   * Consumers: AI agents, docs, future a11y lint rules
   */
  a11y?: A11yContract;

  /**
   * Base UI primitive this component wraps.
   * Documents the headless dependency for upgrade tracking.
   *
   * Currently lives in: component source files (import statements)
   * Consumers: AI agents, docs, dependency audits
   */
  wraps?: string;

  /**
   * Whether this component uses pixel corners (clip-path based rendering).
   * When true, the structuralRules for pixel corners apply automatically
   * without needing to enumerate them — the guard engine infers them.
   *
   * Currently lives in: className patterns in component source
   * Consumers: eslint rule inference, AI agents
   */
  pixelCorners?: boolean;

  /**
   * Shadow system this component uses.
   * "standard" = box-shadow tokens, "pixel" = filter: drop-shadow tokens.
   * Inferred from pixelCorners when not set.
   *
   * Currently lives in: component CSS classes
   * Consumers: eslint (no-clipped-shadow), AI agents
   */
  shadowSystem?: "standard" | "pixel";
}
```

### Example: Button with full contract

```typescript
export const ButtonMeta = defineComponentMeta<ButtonProps>()({
  name: "Button",
  description: "Action trigger with retro pixel-corner lift effect...",
  props: { /* ...existing... */ },
  slots: { /* ...existing... */ },
  tokenBindings: { /* ...existing... */ },
  examples: [ /* ...existing... */ ],
  registry: { /* ...existing... */ },

  // NEW: contract fields
  replaces: [
    { element: "button", import: "@rdna/radiants/components/core" },
  ],
  pixelCorners: true,
  shadowSystem: "pixel",
  wraps: "@base-ui/react/Button",
  styleOwnership: [
    {
      attribute: "data-variant",
      themeOwned: ["primary", "secondary", "ghost", "destructive"],
    },
    {
      attribute: "data-color",
      themeOwned: ["accent", "danger", "success", "neutral", "cream", "white", "info", "tinted"],
    },
  ],
  a11y: {
    role: "button",
    keyboardInteractions: ["Enter", "Space"],
    contrastRequirement: "AA",
  },
});
```

### Example: Dialog with full contract

```typescript
export const DialogMeta = defineComponentMeta<DialogProps>()({
  name: "Dialog",
  description: "Modal dialog with focus trap and overlay...",
  // ...existing fields...

  replaces: [
    { element: "dialog", import: "@rdna/radiants/components/core" },
  ],
  pixelCorners: false,
  wraps: "@base-ui/react/Dialog",
  a11y: {
    role: "dialog",
    requiredAttributes: ["aria-labelledby", "aria-modal"],
    keyboardInteractions: ["Escape"],
    contrastRequirement: "AA",
  },
});
```

### Example: Input with full contract

```typescript
export const InputMeta = defineComponentMeta<InputProps>()({
  name: "Input",
  description: "Text input field with optional icon and error state",
  // ...existing fields...

  replaces: [
    {
      element: "input",
      import: "@rdna/radiants/components/core",
      qualifier: "Only for text-like input types (text, email, password, search, url, tel, number)",
    },
  ],
  pixelCorners: false,
  wraps: "@base-ui/react/Input",
  a11y: {
    role: "textbox",
    keyboardInteractions: ["Tab"],
    contrastRequirement: "AA",
  },
});
```

### Example: Separator with full contract

```typescript
export const SeparatorMeta = defineComponentMeta<SeparatorProps>()({
  name: "Separator",
  // ...existing fields...

  replaces: [
    { element: "hr", import: "@rdna/radiants/components/core" },
  ],
  pixelCorners: false,
  a11y: {
    role: "separator",
    requiredAttributes: ["aria-orientation"],
  },
});
```

---

## 2. Proposed System Contract (DesignSystemContract)

This is the package-level metadata that lives alongside component meta. It captures cross-cutting rules that no single component owns.

```typescript
/**
 * DesignSystemContract
 *
 * Package-level metadata for the design system as a whole.
 * One instance per theme package (e.g. @rdna/radiants).
 * Lives at: packages/radiants/contract/system.ts
 */

// ── Token map types ──────────────────────────────────────────────────

interface BrandColor {
  /** CSS custom property name, e.g. "--color-cream" */
  token: string;
  /** Raw color value (oklch preferred) */
  value: string;
  /** Short alias used in brandPalette map, e.g. "cream" */
  alias: string;
}

interface TokenMapping {
  /**
   * Maps raw color values to semantic token names, keyed by Tailwind context.
   * e.g. { bg: "page", text: "flip" }
   */
  [context: string]: string;
}

interface TokenMap {
  /** Brand palette: hex -> alias */
  brandPalette: Record<string, string>;
  /** Hex -> semantic mapping by context */
  hexToSemantic: Record<string, TokenMapping>;
  /** OKLCH -> semantic mapping by context */
  oklchToSemantic: Record<string, TokenMapping>;
  /** Removed aliases that must not appear anywhere */
  removedAliases: string[];
  /** All valid semantic color suffixes */
  semanticColorSuffixes: string[];
}

// ── Shadow system types ──────────────────────────────────────────────

interface ShadowElevation {
  /** Token name, e.g. "shadow-surface" */
  token: string;
  /** When to use this level */
  usage: string;
  /** Standard (box-shadow) value */
  standard: string;
  /** Pixel-corner (filter: drop-shadow) equivalent */
  pixelEquivalent?: string;
}

interface ShadowSystem {
  /** Ordered elevation levels from lowest to highest */
  elevations: ShadowElevation[];
  /** Map from standard shadow token to pixel-shadow suggestion */
  migrationMap: Record<string, string>;
}

// ── Motion constraint types ──────────────────────────────────────────

interface MotionConstraints {
  /** Maximum allowed duration in ms */
  maxDurationMs: number;
  /** Allowed easing functions */
  allowedEasings: string[];
  /** Duration token scale */
  durationTokens: Record<string, number>;
  /** Easing token scale */
  easingTokens: Record<string, string>;
}

// ── Structural invariant types ───────────────────────────────────────

interface PixelCornerRules {
  /** CSS classes that opt in to pixel corners */
  triggerClasses: string[];
  /** Classes that must not coexist with pixel corner classes */
  bannedCoexistingClasses: Array<{
    pattern: string;
    reason: string;
    suggestion: string;
  }>;
}

// ── Full system contract ─────────────────────────────────────────────

interface DesignSystemContract {
  /** Package name, e.g. "@rdna/radiants" */
  name: string;
  /** Semver version of the contract schema */
  contractVersion: string;

  /** Token mapping data */
  tokens: TokenMap;

  /** Shadow elevation system */
  shadows: ShadowSystem;

  /** Motion constraints */
  motion: MotionConstraints;

  /** Pixel corner structural rules */
  pixelCorners: PixelCornerRules;

  /**
   * Theme-owned variant values (shared across components).
   * Individual components can extend this via styleOwnership.
   */
  themeVariants: string[];

  /**
   * Component -> HTML element replacement map.
   * Aggregated from all component replaces fields.
   * Generated, not hand-authored.
   */
  componentMap: Record<string, {
    component: string;
    import: string;
    qualifier?: string;
  }>;

  /**
   * Required semantic tokens that all themes must define.
   * Validation target for theme packages.
   */
  requiredTokens: string[];

  /** CSS layers this theme uses and their ordering */
  cssLayers?: string[];

  /** Typography scale token names */
  typographyScale: string[];
}
```

### Example: system contract for @rdna/radiants

```typescript
export const radiantsSystemContract: DesignSystemContract = {
  name: "@rdna/radiants",
  contractVersion: "1.0.0",

  tokens: {
    brandPalette: {
      "#fef8e2": "cream",
      "#0f0e0c": "ink",
      "#000000": "pure-black",
      "#fce184": "sun-yellow",
      "#95bad2": "sky-blue",
      "#fcc383": "sunset-fuzz",
      "#ff6b63": "sun-red",
      "#cef5ca": "mint",
      "#ffffff": "pure-white",
      "#22c55e": "success-mint",
    },
    hexToSemantic: {
      "#fef8e2": { bg: "page", text: "flip" },
      "#0f0e0c": { bg: "inv", text: "main", border: "line" },
      // ...remaining entries from token-map.mjs
    },
    oklchToSemantic: {
      "oklch(0.9780 0.0295 94.34)": { bg: "surface-primary", text: "content-inverted" },
      // ...remaining entries
    },
    removedAliases: [
      "--color-black",
      "--color-white",
      "--color-green",
      "--color-success-green",
      "--glow-green",
    ],
    semanticColorSuffixes: [
      "page", "card", "tinted", "inv", "depth", "hover", "active",
      "main", "sub", "mute", "flip", "head", "link",
      "line", "rule", "line-hover", "focus",
      "accent", "accent-inv", "accent-soft", "danger",
      "success", "warning",
      "window-chrome-from", "window-chrome-to",
    ],
  },

  shadows: {
    elevations: [
      { token: "shadow-inset",   usage: "Embedded/inset elements",             standard: "inset 0 0 0 1px var(--color-ink)" },
      { token: "shadow-surface", usage: "Flat resting elements",               standard: "0 1px 0 0 var(--color-ink)",     pixelEquivalent: "pixel-shadow-surface" },
      { token: "shadow-resting", usage: "Buttons at rest",                     standard: "0 2px 0 0 var(--color-ink)",     pixelEquivalent: "pixel-shadow-resting" },
      { token: "shadow-lifted",  usage: "Interactive hover (vertical)",        standard: "0 4px 0 0 var(--color-ink)",     pixelEquivalent: "pixel-shadow-lifted" },
      { token: "shadow-raised",  usage: "Cards, panels (diagonal)",            standard: "2px 2px 0 0 var(--color-ink)",   pixelEquivalent: "pixel-shadow-raised" },
      { token: "shadow-floating",usage: "Windows, dialogs (diagonal)",         standard: "4px 4px 0 0 var(--color-ink)",   pixelEquivalent: "pixel-shadow-floating" },
    ],
    migrationMap: {
      "shadow-surface":  "pixel-shadow-surface",
      "shadow-resting":  "pixel-shadow-resting",
      "shadow-lifted":   "pixel-shadow-lifted",
      "shadow-raised":   "pixel-shadow-raised",
      "shadow-floating": "pixel-shadow-floating",
    },
  },

  motion: {
    maxDurationMs: 300,
    allowedEasings: ["ease-out"],
    durationTokens: {
      "duration-instant":  0,
      "duration-fast":     100,
      "duration-base":     150,
      "duration-moderate": 200,
      "duration-slow":     300,
    },
    easingTokens: {
      "easing-default": "cubic-bezier(0, 0, 0.2, 1)",
      "easing-out":     "cubic-bezier(0, 0, 0.2, 1)",
      "easing-in":      "cubic-bezier(0.4, 0, 1, 1)",
      "easing-spring":  "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  },

  pixelCorners: {
    triggerClasses: [
      "pixel-rounded-xs", "pixel-rounded-sm", "pixel-rounded-md",
      "pixel-rounded-lg", "pixel-rounded-xl", "pixel-corners",
    ],
    bannedCoexistingClasses: [
      {
        pattern: "border-*",
        reason: "clip-path clips native CSS borders at edges",
        suggestion: "Remove border-* -- ::after on pixel-rounded-* renders the visible border",
      },
      {
        pattern: "overflow-hidden",
        reason: "clips the ::after pseudo-element that draws the pixel border",
        suggestion: "Remove overflow-hidden -- clip-path handles overflow",
      },
      {
        pattern: "shadow-{surface,resting,lifted,raised,floating}",
        reason: "box-shadow is clipped by clip-path",
        suggestion: "Use pixel-shadow-* (filter: drop-shadow) instead",
      },
    ],
  },

  themeVariants: [
    "primary", "secondary", "outline", "ghost", "destructive",
    "select", "switch", "accordion",
  ],

  componentMap: {
    // Generated from component replaces fields
    "button":   { component: "Button",  import: "@rdna/radiants/components/core" },
    "input":    { component: "Input",   import: "@rdna/radiants/components/core", qualifier: "text-like types only" },
    "select":   { component: "Select",  import: "@rdna/radiants/components/core" },
    "textarea": { component: "Input",   import: "@rdna/radiants/components/core", qualifier: "Use Input with multiline" },
    "dialog":   { component: "Dialog",  import: "@rdna/radiants/components/core" },
    "hr":       { component: "Separator", import: "@rdna/radiants/components/core" },
    "meter":    { component: "Meter",   import: "@rdna/radiants/components/core" },
    "details":  { component: "Collapsible", import: "@rdna/radiants/components/core" },
  },

  requiredTokens: [
    "--color-page", "--color-inv",
    "--color-main", "--color-flip",
    "--color-line",
  ],

  typographyScale: [
    "text-xs", "text-sm", "text-base", "text-lg",
    "text-xl", "text-2xl", "text-3xl",
  ],
};
```

---

## 3. Generated Artifact Schemas

### 3a. registry.manifest.json (existing -- extended)

**Location:** `tools/playground/generated/registry.manifest.json`
**Format:** JSON
**Generator:** `pnpm registry:generate`
**Consumers:** Playground UI, AI agents, docs site

The existing manifest gains these additional fields per component:

```jsonc
{
  "@rdna/radiants": {
    "components": [
      {
        "name": "Button",
        // ...existing fields...
        "replaces": [{ "element": "button", "import": "@rdna/radiants/components/core" }],
        "pixelCorners": true,
        "shadowSystem": "pixel",
        "wraps": "@base-ui/react/Button",
        "styleOwnership": [
          { "attribute": "data-variant", "themeOwned": ["primary", "secondary", "ghost", "destructive"] }
        ],
        "a11y": {
          "role": "button",
          "keyboardInteractions": ["Enter", "Space"],
          "contrastRequirement": "AA"
        }
      }
    ]
  }
}
```

### 3b. eslint-contract.json (new)

**Location:** `packages/radiants/generated/eslint-contract.json`
**Format:** JSON
**Generator:** `pnpm registry:generate` (extended)
**Consumers:** ESLint plugin rules at load time

This artifact replaces all hardcoded data currently scattered across ESLint rule files and `eslint.rdna.config.mjs`. Each rule reads its configuration from this contract instead of embedding it.

```jsonc
{
  "$schema": "./eslint-contract.schema.json",
  "contractVersion": "1.0.0",

  "tokenMap": {
    "brandPalette": { "#fef8e2": "cream", "#0f0e0c": "ink" /* ... */ },
    "hexToSemantic": { "#fef8e2": { "bg": "page", "text": "flip" } /* ... */ },
    "oklchToSemantic": { /* ... */ },
    "removedAliases": ["--color-black", "--color-white" /* ... */ ],
    "semanticColorSuffixes": ["page", "card", "tinted" /* ... */ ]
  },

  "componentMap": {
    "button": { "component": "Button", "import": "@rdna/radiants/components/core" },
    "input": { "component": "Input", "import": "@rdna/radiants/components/core", "qualifier": "text-like types only" },
    "select": { "component": "Select", "import": "@rdna/radiants/components/core" },
    "textarea": { "component": "Input", "import": "@rdna/radiants/components/core", "qualifier": "Use Input with multiline" },
    "dialog": { "component": "Dialog", "import": "@rdna/radiants/components/core" },
    "hr": { "component": "Separator", "import": "@rdna/radiants/components/core" },
    "meter": { "component": "Meter", "import": "@rdna/radiants/components/core" },
    "details": { "component": "Collapsible", "import": "@rdna/radiants/components/core" }
  },

  "pixelCorners": {
    "triggerClasses": ["pixel-rounded-xs", "pixel-rounded-sm", "pixel-rounded-md", "pixel-rounded-lg", "pixel-rounded-xl", "pixel-corners"],
    "shadowMigrationMap": {
      "shadow-surface": "pixel-shadow-surface",
      "shadow-resting": "pixel-shadow-resting",
      "shadow-lifted": "pixel-shadow-lifted",
      "shadow-raised": "pixel-shadow-raised",
      "shadow-floating": "pixel-shadow-floating"
    }
  },

  "themeVariants": ["primary", "secondary", "outline", "ghost", "destructive", "select", "switch", "accordion"],

  "motion": {
    "maxDurationMs": 300,
    "allowedEasings": ["ease-out"],
    "durationTokens": ["duration-instant", "duration-fast", "duration-base", "duration-moderate", "duration-slow"],
    "easingTokens": ["easing-default", "easing-out", "easing-in", "easing-spring"]
  },

  "shadows": {
    "validStandard": ["shadow-inset", "shadow-surface", "shadow-resting", "shadow-lifted", "shadow-raised", "shadow-floating", "shadow-focused"],
    "validPixel": ["pixel-shadow-surface", "pixel-shadow-resting", "pixel-shadow-lifted", "pixel-shadow-raised", "pixel-shadow-floating"],
    "validGlow": ["shadow-glow-sm", "shadow-glow-md", "shadow-glow-lg", "shadow-glow-xl", "shadow-glow-success", "shadow-glow-error", "shadow-glow-info"]
  },

  "typography": {
    "validSizes": ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"]
  }
}
```

**How ESLint rules consume it:**

| Rule | What it reads from contract |
|------|---------------------------|
| `no-hardcoded-colors` | `tokenMap.hexToSemantic`, `tokenMap.oklchToSemantic`, `tokenMap.semanticColorSuffixes`, `tokenMap.brandPalette` |
| `no-removed-aliases` | `tokenMap.removedAliases` |
| `prefer-rdna-components` | `componentMap` |
| `no-clipped-shadow` | `pixelCorners.triggerClasses`, `pixelCorners.shadowMigrationMap` |
| `no-pixel-border` | `pixelCorners.triggerClasses` |
| `no-mixed-style-authority` | `themeVariants` (+ per-component `styleOwnership` from manifest) |
| `no-hardcoded-motion` | `motion.durationTokens`, `motion.easingTokens` |
| `no-raw-shadow` | `shadows.validStandard`, `shadows.validPixel`, `shadows.validGlow` |
| `no-hardcoded-typography` | `typography.validSizes` |

### 3c. ai-contract.json (new)

**Location:** `packages/radiants/generated/ai-contract.json`
**Format:** JSON
**Generator:** `pnpm registry:generate` (extended)
**Consumers:** AI agents (Claude Code, playground annotations, future MCP tools)

This is a flattened, prompt-friendly view of the contract optimized for LLM context windows. It avoids redundancy with the registry manifest and focuses on "what to do / not do."

```jsonc
{
  "$schema": "./ai-contract.schema.json",
  "contractVersion": "1.0.0",
  "systemName": "@rdna/radiants",

  "rules": [
    {
      "id": "use-semantic-tokens",
      "severity": "must",
      "summary": "All color values must use semantic tokens, never raw hex/rgb/oklch",
      "validTokens": ["page", "card", "tinted", "inv", "depth", "hover", "active", "main", "sub", "mute", "flip", "head", "link", "line", "rule", "line-hover", "focus", "accent", "accent-inv", "accent-soft", "danger", "success", "warning"],
      "examples": {
        "correct": "className=\"bg-page text-main border-line\"",
        "incorrect": "className=\"bg-[#FEF8E2] text-[#0F0E0C]\""
      }
    },
    {
      "id": "use-rdna-components",
      "severity": "must",
      "summary": "Use RDNA components instead of raw HTML elements",
      "replacements": {
        "button": "Button",
        "input (text-like)": "Input",
        "select": "Select",
        "textarea": "Input (multiline)",
        "dialog": "Dialog",
        "hr": "Separator",
        "meter": "Meter",
        "details": "Collapsible"
      }
    },
    {
      "id": "pixel-corner-constraints",
      "severity": "must",
      "summary": "Elements with pixel-rounded-* or pixel-corners must not use border-*, overflow-hidden, or shadow-* (use pixel-shadow-*)",
      "appliesWhen": "Element has class matching pixel-rounded-{xs,sm,md,lg,xl} or pixel-corners",
      "banned": ["border-*", "overflow-hidden", "shadow-{surface,resting,lifted,raised,floating}"],
      "alternatives": {
        "border": "::after pseudo-element handles borders",
        "overflow": "clip-path handles overflow",
        "shadow": "pixel-shadow-{surface,resting,lifted,raised,floating}"
      }
    },
    {
      "id": "motion-constraints",
      "severity": "must",
      "summary": "Max 300ms duration, ease-out only, use RDNA motion tokens",
      "validDurations": ["duration-instant (0ms)", "duration-fast (100ms)", "duration-base (150ms)", "duration-moderate (200ms)", "duration-slow (300ms)"],
      "validEasings": ["easing-default", "easing-out", "easing-in", "easing-spring"]
    },
    {
      "id": "no-mixed-style-authority",
      "severity": "must",
      "summary": "Do not mix semantic color utilities with theme-owned data-variant values",
      "themeOwnedVariants": ["primary", "secondary", "outline", "ghost", "destructive", "select", "switch", "accordion"]
    },
    {
      "id": "banned-tokens",
      "severity": "must",
      "summary": "These token aliases have been removed and must not appear",
      "bannedTokens": ["--color-black", "--color-white", "--color-green", "--color-success-green", "--glow-green"]
    },
    {
      "id": "no-arbitrary-values",
      "severity": "must",
      "summary": "Do not use arbitrary Tailwind brackets for spacing, typography, radius, or shadows",
      "details": "Use RDNA token scale instead of p-[12px], text-[14px], rounded-[6px], shadow-[...] etc."
    }
  ],

  "components": [
    {
      "name": "Button",
      "pixelCorners": true,
      "shadowSystem": "pixel",
      "replaces": ["button"],
      "wraps": "@base-ui/react/Button",
      "quickRef": "Action trigger. Modes: solid, flat, text, pattern. Tones: accent, danger, success, neutral, cream, white, info, tinted."
    }
    // ...one entry per component, stripped to AI-relevant fields
  ],

  "tokenQuickRef": {
    "backgrounds": "bg-page | bg-card | bg-tinted | bg-inv | bg-depth | bg-hover | bg-active",
    "text": "text-main | text-head | text-sub | text-mute | text-flip | text-link",
    "borders": "border-line | border-rule | border-line-hover | border-focus",
    "accents": "bg-accent | text-accent | border-accent | bg-accent-soft | bg-danger | text-danger | bg-success | bg-warning",
    "shadows": "shadow-inset | shadow-surface | shadow-resting | shadow-lifted | shadow-raised | shadow-floating",
    "pixelShadows": "pixel-shadow-surface | pixel-shadow-resting | pixel-shadow-lifted | pixel-shadow-raised | pixel-shadow-floating"
  }
}
```

### 3d. component.schema.json (existing -- unchanged)

Already generated per-component. No changes needed. The contract fields live in `*.meta.ts` and flow through the manifest, not through schema.json.

---

## 4. Package Boundary Map

```
packages/radiants/                     # THEME PACKAGE (author-time)
  contract/
    system.ts                          # Hand-authored DesignSystemContract
  components/core/
    Button/Button.meta.ts              # Hand-authored ComponentContractMeta
    Dialog/Dialog.meta.ts              # Hand-authored ComponentContractMeta
    ...
  eslint/
    token-map.mjs                      # DEPRECATED: reads from generated contract
    rules/*.mjs                        # Rules read from eslint-contract.json
    index.mjs                          # Plugin entry, loads contract at startup
  generated/                           # NEW directory
    eslint-contract.json               # Generated from system.ts + all *.meta.ts
    ai-contract.json                   # Generated from system.ts + all *.meta.ts

tools/playground/
  generated/
    registry.manifest.json             # Extended with contract fields

scripts/
  generate-contracts.mjs               # NEW: reads system.ts + *.meta.ts, writes artifacts

eslint.rdna.config.mjs                 # CONSUMER CONFIG (thinner)
                                       # themeVariants removed -- read from contract
```

### Ownership summary

| Artifact | Owner | Authored or generated |
|----------|-------|----------------------|
| `ComponentContractMeta` (*.meta.ts) | Component author | Hand-authored |
| `DesignSystemContract` (system.ts) | Design system team | Hand-authored |
| `eslint-contract.json` | Generator | Generated from system.ts + meta files |
| `ai-contract.json` | Generator | Generated from system.ts + meta files |
| `registry.manifest.json` | Generator | Generated from meta files (extended) |
| `eslint.rdna.config.mjs` | App team | Hand-authored (thinner: no more embedded data) |
| ESLint rules | Design system team | Hand-authored (but data-driven from contract) |

---

## 5. Migration Path

### Phase 1: System contract extraction (low risk, high value)

1. Create `packages/radiants/contract/system.ts` with the `DesignSystemContract` interface and the radiants instance.
2. Create `scripts/generate-contracts.mjs` that reads `system.ts` and writes `packages/radiants/generated/eslint-contract.json`.
3. Update `packages/radiants/eslint/token-map.mjs` to import from the generated contract JSON instead of hardcoding values. (Keep the file as a thin re-export so rule imports don't break.)
4. Update `eslint.rdna.config.mjs` to remove the `themeVariants` array -- the `no-mixed-style-authority` rule reads it from the contract.
5. Add `pnpm contract:generate` script and wire it into `pnpm registry:generate`.

**Effort:** ~2 days. No component files change. No lint rule logic changes. Only data source moves.

### Phase 2: Component contract fields (incremental, component-by-component)

1. Extend `ComponentMeta` type in `packages/preview/src/types.ts` with the new optional fields.
2. Add `replaces` to the 5 components that already have mappings in `rdnaComponentMap`: Button, Input, Select (+ textarea alias), Dialog.
3. Add `replaces` to the 3 new mappings: Separator (hr), Meter (meter/progress), Collapsible (details).
4. Add `pixelCorners: true` to Button (and any other pixel-cornered components).
5. Add `wraps` to all Base UI-backed components.
6. Add `styleOwnership` to Button, Switch, Select (components with data-variant/data-color attributes).
7. Update the generator to include new fields in `registry.manifest.json`.

**Effort:** ~3 days. Each component gets 3-6 new lines in its meta file. No breaking changes.

### Phase 3: ESLint rule data-driven migration

1. Update `prefer-rdna-components` to read `componentMap` from `eslint-contract.json` instead of importing `rdnaComponentMap`.
2. Update `no-clipped-shadow` and `no-pixel-border` to read pixel corner trigger classes from the contract.
3. Update `no-mixed-style-authority` to read `themeVariants` from the contract (falling back to rule options for override).
4. Update `no-hardcoded-colors` to read `semanticColorSuffixes` from the contract.

**Effort:** ~2 days. Each rule gets a small refactor at the top to load contract data.

### Phase 4: AI contract generation

1. Add `ai-contract.json` generation to the contract generator.
2. Wire into CLAUDE.md or a `.claude/` context file so AI agents automatically receive the contract.
3. Add playground annotation integration to read component contracts.

**Effort:** ~1 day for generation, ongoing for integration.

### Phase 5: Deprecate token-map.mjs as authoring source

1. Once all rules read from `eslint-contract.json`, `token-map.mjs` becomes a thin re-export layer.
2. Eventually remove it entirely when all imports are updated.

**Effort:** ~0.5 day.

---

## 6. Field Inventory

| Field | Current location | Proposed location | Consumers | Migration effort |
|-------|-----------------|-------------------|-----------|-----------------|
| `name` | *.meta.ts | *.meta.ts (unchanged) | registry, lint, AI, docs | None |
| `description` | *.meta.ts | *.meta.ts (unchanged) | registry, AI, docs | None |
| `props` | *.meta.ts | *.meta.ts (unchanged) | registry, playground, AI | None |
| `slots` | *.meta.ts | *.meta.ts (unchanged) | registry, playground | None |
| `subcomponents` | *.meta.ts | *.meta.ts (unchanged) | registry, playground | None |
| `tokenBindings` | *.meta.ts | *.meta.ts (unchanged) | registry, AI, docs | None |
| `examples` | *.meta.ts | *.meta.ts (unchanged) | registry, playground, AI | None |
| `registry` | *.meta.ts | *.meta.ts (unchanged) | playground | None |
| `sourcePath` | *.meta.ts | *.meta.ts (unchanged) | registry | None |
| **`replaces`** | token-map.mjs:126-134 | *.meta.ts + generated contract | lint, AI, docs | Low -- add field to 8 components |
| **`structuralRules`** | no-clipped-shadow.mjs, no-pixel-border.mjs (hardcoded regex) | *.meta.ts (optional, inferred from `pixelCorners`) | lint, AI | Low -- most derive from pixelCorners flag |
| **`styleOwnership`** | eslint.rdna.config.mjs:93-96 | *.meta.ts + system contract | lint, AI | Low -- add to ~3 components |
| **`a11y`** | Component source files | *.meta.ts | AI, docs, future a11y lint | Medium -- requires audit of each component |
| **`wraps`** | Import statements in source | *.meta.ts | AI, docs, dependency audit | Low -- mechanical extraction |
| **`pixelCorners`** | className patterns in source | *.meta.ts | lint (inference), AI | Low -- boolean flag on ~5 components |
| **`shadowSystem`** | Implicit from pixelCorners | *.meta.ts (optional, defaults from pixelCorners) | lint, AI | Very low -- only set when overriding |
| **brandPalette** | token-map.mjs:11-22 | system.ts `tokens.brandPalette` | lint (no-hardcoded-colors) | Low -- move data |
| **hexToSemantic** | token-map.mjs:29-66 | system.ts `tokens.hexToSemantic` | lint (no-hardcoded-colors) | Low -- move data |
| **oklchToSemantic** | token-map.mjs:70-115 | system.ts `tokens.oklchToSemantic` | lint (no-hardcoded-colors) | Low -- move data |
| **removedAliases** | token-map.mjs:118-124 | system.ts `tokens.removedAliases` | lint (no-removed-aliases) | Low -- move data |
| **semanticColorSuffixes** | no-hardcoded-colors.mjs:77-89 | system.ts `tokens.semanticColorSuffixes` | lint (no-hardcoded-colors) | Low -- move data |
| **rdnaComponentMap** | token-map.mjs:127-134 | Generated from component `replaces` | lint (prefer-rdna-components) | Low -- generated |
| **themeVariants** | eslint.rdna.config.mjs:93-96 | system.ts `themeVariants` | lint (no-mixed-style-authority) | Low -- move data |
| **pixelCorner trigger classes** | no-clipped-shadow.mjs:19, no-pixel-border.mjs:25 | system.ts `pixelCorners.triggerClasses` | lint (no-clipped-shadow, no-pixel-border) | Low -- move data |
| **shadow migration map** | no-clipped-shadow.mjs:26-36 | system.ts `shadows.migrationMap` | lint (no-clipped-shadow) | Low -- move data |
| **motion constraints** | tokens.css comments, no-hardcoded-motion.mjs | system.ts `motion` | lint (no-hardcoded-motion) | Low -- formalize existing values |

---

## 7. Open Questions

### 7.1 Contract versioning strategy

Should the contract version be tied to the package semver, or independent? If a contract field changes shape (e.g. `replaces` gains a new sub-field), is that a contract major bump even if the component API is unchanged?

**Recommendation:** Independent semver for the contract schema. Package version tracks component API; contract version tracks the metadata schema.

### 7.2 Runtime vs. build-time contract consumption

ESLint rules load at lint time, AI agents at prompt time. Should there be a runtime contract for client-side validation (e.g. prop validation in dev mode)?

**Recommendation:** Not in v1. The contract is a build/lint/AI artifact. Runtime validation is a separate concern (and could be generated from the contract later).

### 7.3 Per-component vs. system-level styleOwnership

Currently `themeVariants` is a flat list in `eslint.rdna.config.mjs`. Some components may have unique theme-owned values not shared by others. Should the system contract hold the union, or should each component declare its own?

**Recommendation:** Both. System contract holds the baseline (values any component might use). Components declare their specific subset via `styleOwnership`. The lint rule checks the union.

### 7.4 Accessibility contract depth

How deep should the `a11y` field go? Full ARIA pattern specifications (like WAI-ARIA Authoring Practices) or just the critical role + keyboard interactions?

**Recommendation:** Start with role + required attributes + keyboard interactions. This gives AI agents enough to generate correct markup. Full ARIA pattern specs are better served by linking to WAI-ARIA APG.

### 7.5 token-map.mjs backward compatibility

Rules currently `import { brandPalette } from '../token-map.mjs'`. Switching to JSON import requires either:
- (a) Node.js `--experimental-json-modules` / import assertions, or
- (b) A thin JS wrapper that `fs.readFileSync`s the JSON.

**Recommendation:** Option (b) -- `token-map.mjs` becomes a thin re-export that reads from `eslint-contract.json` via `createRequire`. No changes to rule imports.

### 7.6 Multiple theme packages

The contract architecture assumes one theme package (`@rdna/radiants`). If a second theme package is added, should it provide its own `system.ts` and `eslint-contract.json`? How do lint rules know which contract to load?

**Recommendation:** Each theme package owns its own contract. The ESLint plugin accepts a `contractPath` option. Default: resolve from the nearest `@rdna/*` package. This is forward-compatible but not needed for v1.

### 7.7 Contract drift detection

How do we ensure the generated `eslint-contract.json` stays in sync with `system.ts` + `*.meta.ts`? The registry guard already detects manifest staleness.

**Recommendation:** Extend the existing registry guard (`scripts/registry-guard-lib.mjs`) to also check contract freshness. Same mechanism: hash comparison of inputs vs. generated output. Wire into the existing pre-commit / pre-build hooks.
