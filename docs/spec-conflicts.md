# Spec Conflicts Analysis

**Date:** 2026-01-15
**Purpose:** Complete gap analysis between theme-spec.md and existing theme-rad-os implementation
**Status:** Fully audited

---

## Executive Summary

The existing `theme-rad-os` implementation is **largely compliant** with our spec, with key differences in file organization. The theme already uses our semantic token naming (`surface-*`, `content-*`, `edge-*`) and follows Tailwind v4 patterns correctly.

**Key Findings:**
- Token naming: Mostly aligned (minor additions needed)
- CSS structure: Flat at root vs spec's `theme/` subfolder
- Component organization: Flat in `core/` vs spec's type-based
- Config file: Uses `package.json.radflow` section, no `radflow.config.json`
- Color modes: Uses `dark.css` vs spec's `modes.css`

**Recommended Approach:** Keep the reality (current structure works) and update specs to match, with optional migration path.

---

## Detailed Gap Analysis

### 1. CSS File Locations

| Aspect | Spec Says | Reality | Gap Severity |
|--------|-----------|---------|--------------|
| Entry point | `theme/index.css` | `./index.css` (root) | **Medium** |
| Tokens | `theme/tokens.css` | `./tokens.css` (root) | **Medium** |
| Typography | `theme/typography.css` | `./typography.css` (root) | **Medium** |
| Fonts | `theme/fonts.css` | `./fonts.css` (root) | **Medium** |
| Color modes | `theme/modes.css` | `./dark.css` (root) | **Medium** |
| Base styles | `theme/base.css` | `./base.css` (root) | **Low** |
| Animations | `theme/animations.css` | `./animations.css` (root) | **Low** |
| Scrollbar | `theme/scrollbar.css` | `./scrollbar.css` (root) | **Low** |

**Reality:** All CSS files are at package root, not in `theme/` subfolder.

**Recommendation:** Update spec to allow both patterns:
- Prefer: CSS at package root (simpler, current reality)
- Alternative: CSS in `theme/` subfolder (cleaner separation)

---

### 2. Component Organization

| Aspect | Spec Says | Reality | Gap Severity |
|--------|-----------|---------|--------------|
| Structure | By type (`inputs/`, `layout/`, etc.) | Flat in `core/` | **Medium** |
| Component count | - | 29 components | - |
| Barrel export | `components/index.ts` | `components/core/index.ts` | **Low** |

**Reality Components (in `core/`):**
```
Accordion, Alert, Avatar, Badge, Breadcrumbs, Button, Card, Checkbox,
Combobox, ContextMenu, Dialog, Divider, DropdownMenu, HelpPanel, Icon,
IconContext, Input, NumberField, Popover, Progress, ScrollArea, Select,
Sheet, Skeleton, Slider, Switch, Table, Tabs, Toast, Tooltip
```

**If organized by type (per spec):**
```
inputs/     → Button, Checkbox, Combobox, Input, NumberField, Select, Slider, Switch
layout/     → Card, Divider, ScrollArea, Table
feedback/   → Alert, Badge, Progress, Skeleton, Toast, Tooltip
overlay/    → ContextMenu, Dialog, DropdownMenu, HelpPanel, Popover, Sheet
display/    → Accordion, Avatar, Breadcrumbs, Icon, IconContext, Tabs
```

**Recommendation:** Keep flat structure for simplicity. Type-based organization adds friction without significant benefit for a theme of this size (~30 components).

---

### 3. Token Naming Audit

#### 3.1 Surface Tokens (Backgrounds)

| Spec Required | Reality Has | Status |
|---------------|-------------|--------|
| `surface-primary` | ✅ `--color-surface-primary` | **Match** |
| `surface-secondary` | ✅ `--color-surface-secondary` | **Match** |
| `surface-tertiary` | ✅ `--color-surface-tertiary` | **Match** |
| - | `--color-surface-elevated` | Extra (good) |
| - | `--color-surface-sunken` | Extra (good) |
| - | `--color-surface-success` | Extra (good) |
| - | `--color-surface-warning` | Extra (good) |
| - | `--color-surface-error` | Extra (good) |

**Also has:** `--pattern-surface-sunken` for dot pattern (creative, unique to theme)

#### 3.2 Content Tokens (Text/Icons)

| Spec Required | Reality Has | Status |
|---------------|-------------|--------|
| `content-primary` | ✅ `--color-content-primary` | **Match** |
| `content-inverted` | ✅ `--color-content-inverted` | **Match** |
| `content-secondary` | ✅ `--color-content-secondary` | **Match** |
| - | `--color-content-tertiary` | Extra (good) |
| - | `--color-content-success` | Extra (good) |
| - | `--color-content-warning` | Extra (good) |
| - | `--color-content-error` | Extra (good) |
| - | `--color-content-link` | Extra (good) |

#### 3.3 Edge Tokens (Borders)

| Spec Required | Reality Has | Status |
|---------------|-------------|--------|
| `edge-primary` | ✅ `--color-edge-primary` | **Match** |
| `edge-focus` | ✅ `--color-edge-focus` | **Match** |
| - | `--color-edge-secondary` | Extra (good) |
| - | `--color-edge-success` | Extra (good) |
| - | `--color-edge-warning` | Extra (good) |
| - | `--color-edge-error` | Extra (good) |

#### 3.4 Other Tokens

| Category | Spec Says | Reality Has | Status |
|----------|-----------|-------------|--------|
| Radius | `sm`, `md`, `lg` | `none`, `xs`, `sm`, `md`, `lg`, `full` | **Superset** |
| Shadow | At least one | `btn`, `btn-hover`, `card`, `card-lg`, `card-hover`, `panel-left`, `inner` | **Superset** |
| Font size | Scale | `2xs`, `xs`, `sm`, `base`, `lg` | **Match** |
| Font family | Custom | `mondwest`, `joystix` | **Match** |

#### 3.5 Legacy Tokens (Concern)

Reality also has shadcn-style tokens in `@theme inline`:
```css
--color-background, --color-foreground
--color-card, --color-card-foreground
--color-popover, --color-popover-foreground
--color-primary, --color-primary-foreground
--color-secondary, --color-secondary-foreground
--color-muted, --color-muted-foreground
--color-accent, --color-accent-foreground
--color-destructive, --color-destructive-foreground
--color-border, --color-input, --color-ring
```

These are in `@theme inline` (internal only, not exposed as utilities), so they don't conflict with our semantic tokens. They exist for backwards compatibility with shadcn patterns.

**Recommendation:** Keep legacy tokens in `@theme inline` for compatibility. The semantic tokens in `@theme` are the canonical public API.

---

### 4. Typography Audit

| Aspect | Spec Says | Reality Has | Status |
|--------|-----------|-------------|--------|
| Uses `@layer base` | ✅ Required | ✅ Yes | **Match** |
| Uses `@apply` | ✅ Required | ✅ Yes | **Match** |
| Headings (h1-h6) | Required | ✅ All present | **Match** |
| Body (p) | Required | ✅ Present | **Match** |
| Links (a) | Required | ✅ Present | **Match** |
| Lists (ul, ol, li) | Required | ✅ All present | **Match** |
| Code (code, pre) | Optional | ✅ Present | **Bonus** |
| Blockquote | Optional | ✅ Present | **Bonus** |
| Label | Optional | ✅ Present | **Bonus** |

**Extra elements in reality:** `small`, `strong`, `em`, `kbd`, `mark`, `cite`, `abbr`, `dfn`, `q`, `sub`, `sup`, `del`, `ins`, `caption`, `figcaption`

**Recommendation:** Reality exceeds spec. Update spec to list common extras as "OPTIONAL".

---

### 5. Color Mode Implementation

| Aspect | Spec Says | Reality Has | Status |
|--------|-----------|-------------|--------|
| Filename | `modes.css` | `dark.css` | **Mismatch** |
| Dark mode class | `.dark` on html/body | `.dark` on html/body | **Match** |
| Overrides semantic tokens only | Yes | Yes | **Match** |
| Complete token sets | Yes | ✅ All surface/content/edge overridden | **Match** |
| Shadow overrides | - | ✅ Glow effects for dark mode | **Bonus** |

**Reality also has:** `.preview-light` class for forcing light mode in preview areas. This is a useful pattern not in our spec.

**Recommendation:**
- Accept both `modes.css` and `dark.css` as valid filenames
- Add `.preview-light` pattern to spec as "OPTIONAL"

---

### 6. Configuration

| Aspect | Spec Says | Reality Has | Status |
|--------|-----------|-------------|--------|
| Config file | `radflow.config.json` required | `package.json.radflow` section | **Different approach** |
| Theme name | Required | ✅ `"displayName": "Rad OS"` | **Match** |
| Icon config | Optional | ✅ `"icons": {"library": "phosphor", ...}` | **Match** |
| Font config | Optional | ✅ `"fonts": {"heading": "Joystix", ...}` | **Match** |

**Reality approach:** Uses a `radflow` section in `package.json` instead of separate config file.
```json
"radflow": {
  "type": "theme",
  "displayName": "Rad OS",
  "colorMode": "light",
  "icons": { "library": "phosphor", "style": "bold" },
  "fonts": { "heading": "Joystix Monospace", "body": "Mondwest", "mono": "PixelCode" }
}
```

**Recommendation:** Accept both approaches:
- `radflow.config.json` (dedicated file, spec preferred)
- `package.json.radflow` section (inline, current reality)

Parser should check both locations.

---

### 7. Assets

| Aspect | Spec Says | Reality Has | Status |
|--------|-----------|-------------|--------|
| Icons directory | `assets/icons/` | ❌ Not present | **Gap** |
| Logos directory | `assets/logos/` | ❌ Not present | **Gap** |
| Fonts directory | `fonts/` | ❌ Not present | **Gap** |

**Reality:** Theme uses Phosphor icons (external package) instead of bundled SVGs. Font files are served from `/public/fonts/` in the consuming app, not bundled with theme.

**Recommendation:** Assets are optional. Theme can:
- Bundle icons in `assets/icons/`
- Use external icon library (Phosphor, Lucide, etc.)
- Reference fonts from consuming app's public directory

---

### 8. Package.json Exports

| Spec Says | Reality Has | Status |
|-----------|-------------|--------|
| `".": "./theme/index.css"` | `".": "./index.css"` | **Different path** |
| `"./components": ...` | `"./components/core": ...` | **Different path** |
| `"./tokens": ...` | `"./tokens": "./tokens.css"` | **Match** |

**Reality exports:**
```json
{
  ".": "./index.css",
  "./tokens": "./tokens.css",
  "./dark": "./dark.css",
  "./fonts": "./fonts.css",
  "./typography": "./typography.css",
  "./base": "./base.css",
  "./scrollbar": "./scrollbar.css",
  "./animations": "./animations.css",
  "./components/core": "./components/core/index.ts",
  "./preview/*": "./preview/*.tsx"
}
```

**Recommendation:** Update spec to match reality. The flat structure with individual CSS exports is more flexible.

---

## Migration Checklist

### Non-Breaking Changes (Keep Reality)

These don't require changes to existing theme:

1. ✅ Token naming (`surface-*`, `content-*`, `edge-*`) - already aligned
2. ✅ Typography using `@layer base` + `@apply` - already aligned
3. ✅ Dark mode via `.dark` class - already aligned
4. ✅ Semantic token overrides in dark mode - already aligned
5. ✅ TypeScript + default exports for components - already aligned

### Spec Updates Needed

Update `docs/theme-spec.md` to reflect reality:

1. **File location:** Allow CSS at root (preferred) OR in `theme/` subfolder
2. **Component organization:** Allow flat in `core/` (preferred for small themes) OR by type
3. **Color modes file:** Accept `dark.css` OR `modes.css`
4. **Config location:** Accept `package.json.radflow` OR `radflow.config.json`
5. **Assets:** Mark as optional, themes can use external icon libraries

### Optional Future Migration

If we want strict spec compliance later:

1. Create `radflow.config.json` from `package.json.radflow` section
2. Move CSS files into `theme/` subfolder
3. Rename `dark.css` to `modes.css`
4. Reorganize components by type
5. Bundle icons as SVGs in `assets/icons/`

**Priority:** LOW - Current structure works well

---

## Breaking Changes Identified

None. The existing theme can continue to work without modification. Parser/scanner should be flexible to handle both patterns.

---

## Spec Decision Matrix

| Decision Point | Recommended Choice | Rationale |
|----------------|-------------------|-----------|
| CSS location | Root (reality) | Simpler, fewer paths |
| Component structure | Flat `core/` | Adequate for ~30 components |
| Config location | `package.json.radflow` | One less file, DRY |
| Color modes file | Accept both names | Flexibility |
| Assets | Optional | External libraries are valid |
| Legacy tokens | Keep in `@theme inline` | Backwards compat |

---

## Next Steps

1. **fn-1.8:** Update feature specs to align with these findings
2. Parser implementation should handle both patterns (flexible)
3. Document both approaches in spec as "PREFERRED" vs "ALTERNATIVE"
4. Create validation that checks for EITHER pattern, not strict

---

## Appendix: Reality File Structure

```
packages/theme-rad-os/
├── package.json              # Has radflow section
├── index.css                 # Entry point (imports all CSS)
├── tokens.css                # Design tokens (@theme blocks)
├── typography.css            # Element styles (@layer base)
├── fonts.css                 # @font-face declarations
├── dark.css                  # Dark mode overrides (.dark class)
├── base.css                  # html/body styles
├── scrollbar.css             # Scrollbar customization
├── animations.css            # @keyframes definitions
├── DESIGN_SYSTEM.md          # Design system documentation
├── components/
│   └── core/
│       ├── index.ts          # Barrel export
│       ├── Button.tsx        # ... 29 components total
│       └── hooks/            # Shared hooks
├── preview/                  # Preview/demo components
├── agents/                   # AI agent instructions
└── node_modules/
```

---

## Appendix: Token Comparison Table

| Category | Spec Minimum | Reality Implements | Notes |
|----------|--------------|-------------------|-------|
| Surface | 3 | 8 | Includes state surfaces |
| Content | 3 | 8 | Includes link color |
| Edge | 2 | 6 | Includes state edges |
| Radius | 3 | 6 | Full scale |
| Shadow | 1 | 7 | Complete shadow system |
| Font size | 3 | 5 | Good scale |
| Font family | 2 | 2 | Match |

Reality **exceeds** spec requirements for all token categories.
