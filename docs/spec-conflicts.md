# Spec Conflicts Analysis

**Date:** 2026-01-14
**Purpose:** Identify conflicts between theme-spec.md and existing feature specs

---

## Summary

| Conflict | Theme Spec Says | Feature Specs Say | Severity |
|----------|-----------------|-------------------|----------|
| Config filename | `radflow.config.json` | `manifest.json` | High |
| File structure | CSS in `theme/` subfolder | CSS at package root | High |
| Component organization | By type (`inputs/`, etc.) | Flat in `components/` | Medium |
| Token naming | `surface/content/edge` only | Also has `accent-*` tokens | Medium |
| Required tokens | Minimal set defined | More comprehensive set | Low |

---

## Conflict 1: Config Filename (HIGH)

### Theme Spec (New)
```
theme-{name}/
├── radflow.config.json    ← Required config file
```

### Feature Specs (Existing)
- **04-theme-system.md** line 95: `└── manifest.json`
- **03-component-browser.md** line 31-38: References "manifest" throughout

### Decision Needed
- [ ] Use `radflow.config.json` (more explicit, namespaced)
- [ ] Use `manifest.json` (shorter, common pattern)
- [ ] Use `theme.config.json` (compromise)

### Files to Update
- `docs/features/04-theme-system.md`
- `docs/features/03-component-browser.md`
- `docs/theme-spec.md` (if changing)

---

## Conflict 2: File Structure (HIGH)

### Theme Spec (New)
```
theme-{name}/
├── theme/                 ← CSS files in subfolder
│   ├── index.css
│   ├── tokens.css
│   ├── typography.css
│   └── ...
├── components/
└── assets/
```

### Feature Specs (Existing)
**04-theme-system.md** lines 83-96:
```
@radflow/theme-example/
├── components/
├── tokens.css            ← CSS at root
├── typography.css        ← CSS at root
├── fonts.css
├── dark.css
├── base.css
└── manifest.json
```

### Actual Existing Theme (theme-rad-os)
```
packages/theme-rad-os/
├── index.css             ← CSS at root (matches feature spec)
├── tokens.css
├── typography.css
├── components/
│   └── core/
└── (no manifest.json)
```

### Decision Needed
- [ ] CSS in `theme/` subfolder (theme-spec approach)
- [ ] CSS at package root (current implementation)

### Impact
This affects:
- Parser paths (where to find tokens.css)
- Package exports in package.json
- All file paths in feature specs

---

## Conflict 3: Component Organization (MEDIUM)

### Theme Spec (New)
```
components/
├── inputs/       ← Button, Input, Select
├── layout/       ← Card, Container
├── feedback/     ← Alert, Toast
└── overlay/      ← Dialog, Sheet
```

### Feature Specs (Existing)
**04-theme-system.md** lines 85-89:
```
components/
├── Button.tsx    ← Flat structure
├── Card.tsx
├── Input.tsx
└── ...
```

**05-assets-manager.md** lines 209-218:
```
components/
├── Icon.tsx      ← Flat structure
└── Logo.tsx
```

### Actual Existing Theme (theme-rad-os)
```
components/
└── core/         ← Single "core" folder, semi-flat
    ├── Button.tsx
    ├── Card.tsx
    └── ...
```

### Decision Needed
- [ ] By type (`inputs/`, `layout/`, etc.) as theme-spec says
- [ ] Flat with `core/` subfolder (current implementation)
- [ ] Completely flat (feature spec examples)

### Impact
- Component scanner paths
- Import statements in components
- Barrel exports structure

---

## Conflict 4: Token Naming (MEDIUM)

### Theme Spec (New)
Defined categories:
- `surface-*` (primary, secondary, tertiary)
- `content-*` (primary, secondary, inverted)
- `edge-*` (primary, focus)
- State tokens (success, error, warning)

### Variables Editor (01-variables-editor.md)
Lines 33-58 define additional patterns:
```
Edge Tokens:
- edge-default      ← Not in theme-spec
- edge-subtle       ← Not in theme-spec
- edge-strong       ← Not in theme-spec
- edge-focus        ← In theme-spec

Accent Tokens:      ← Entire category not in theme-spec
- accent-primary
- accent-secondary
- accent-success
- accent-warning
- accent-error
```

### Actual Existing Theme (theme-rad-os)
Uses `edge-primary`, `edge-secondary` (matches theme-spec pattern)
Does NOT have `accent-*` tokens

### Decision Needed
- [ ] Add `accent-*` category to theme-spec
- [ ] Keep `accent-*` as optional/theme-specific
- [ ] Remove `accent-*` from variables-editor spec

### Also
- [ ] Standardize edge token naming: `edge-primary/secondary` vs `edge-default/subtle/strong`

---

## Conflict 5: Required Tokens (LOW)

### Theme Spec (New)
Minimal required set:
```
--color-surface-primary
--color-surface-secondary
--color-content-primary
--color-content-inverted
--color-edge-primary
```

### Variables Editor (01-variables-editor.md)
Much more comprehensive required set including:
- All surface variants (primary, secondary, tertiary, elevated, inverse)
- All content variants (primary, secondary, tertiary, inverse, link)
- All edge variants (default, subtle, strong, focus)
- All accent variants
- Shadow scale (sm, md, lg, xl)
- Radius scale (none, sm, md, lg, full)
- Animation tokens
- Effect tokens

### Decision Needed
- [ ] Expand theme-spec required set to match variables-editor
- [ ] Keep theme-spec minimal, make variables-editor tokens "recommended"
- [ ] Create tiers: REQUIRED / RECOMMENDED / OPTIONAL

---

## Conflict 6: Color Modes File (LOW)

### Theme Spec (New)
```
theme/
└── modes.css     ← "modes.css"
```

### Feature Specs & Existing Theme
```
theme-rad-os/
└── dark.css      ← "dark.css"
```

### Decision Needed
- [ ] Use `modes.css` (supports future expansion)
- [ ] Use `dark.css` (current convention)

---

---

## Resolutions Made

| Conflict | Decision | Rationale |
|----------|----------|-----------|
| CSS location | `theme/` subfolder | Cleaner separation of concerns |
| Config filename | `radflow.config.json` | Explicit, namespaced |
| Accent tokens | Merge with state tokens | Use `success/warning/error` directly, no separate accent category |
| Component organization | By type | (Previously decided) |

---

## Recommended Resolution Order

### Priority 1: Structural Decisions
These affect everything else:
1. **File structure** — CSS at root vs in `theme/` subfolder
2. **Config filename** — `radflow.config.json` vs `manifest.json`

### Priority 2: Organization
3. **Component organization** — By type vs flat

### Priority 3: Token Details
4. **Token categories** — Add accent-* or not
5. **Token naming** — Standardize edge variants
6. **Required tokens** — Define tiers

### Priority 4: Minor Cleanup
7. **Color modes filename** — modes.css vs dark.css

---

## Questions for Resolution

1. **File structure**: The existing theme (theme-rad-os) has CSS at root. Changing to `theme/` subfolder would require migrating the existing theme. Is this worth it for cleaner separation?

2. **Config filename**: `manifest.json` is shorter and common (npm uses it), but `radflow.config.json` is more explicit and avoids confusion with package.json. Preference?

3. **Accent tokens**: Are accent tokens (`accent-primary`, `accent-success`, etc.) a core requirement, or can themes choose whether to implement them?

4. **Component categories**: The "by type" organization creates more folders but better discoverability. Is this worth the migration effort from `core/` flat structure?

---

## Feature Specs Update Checklist

Based on resolutions made, these feature specs need updates:

### 01-variables-editor.md
- [ ] Remove `accent-*` token category (lines 54-58)
- [ ] Replace with state tokens (`success`, `warning`, `error`) as top-level
- [ ] Update edge tokens: `edge-default/subtle/strong` → `edge-primary/secondary`

### 03-component-browser.md
- [ ] Change `manifest.json` → `radflow.config.json` (multiple references)
- [ ] Update component path examples to use type-based organization

### 04-theme-system.md
- [ ] Change file structure example (lines 83-96):
  - Move CSS files into `theme/` subfolder
  - Change `manifest.json` → `radflow.config.json`
- [ ] Update component structure to show type-based organization
- [ ] Remove `accent-*` references if any

### 05-assets-manager.md
- [ ] Update structure example (lines 209-218) to show:
  - CSS in `theme/` subfolder
  - Components organized by type

### 10-tauri-architecture.md
- [ ] Update any file path references that assume CSS at root

---

## Existing Theme Migration

The existing `theme-rad-os` will need migration:

### Current Structure
```
packages/theme-rad-os/
├── index.css
├── tokens.css
├── typography.css
├── fonts.css
├── dark.css
├── base.css
├── scrollbar.css
├── animations.css
└── components/
    └── core/
        ├── Button.tsx
        └── ...
```

### Target Structure
```
theme-rad-os/
├── radflow.config.json      # NEW: Required config
├── theme/                   # NEW: CSS subfolder
│   ├── index.css
│   ├── tokens.css
│   ├── typography.css
│   ├── fonts.css
│   ├── modes.css           # RENAMED: dark.css → modes.css
│   ├── base.css
│   ├── scrollbar.css
│   └── animations.css
├── components/              # REORGANIZED: By type
│   ├── index.ts
│   ├── inputs/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Card.tsx
│   │   └── ...
│   ├── feedback/
│   │   ├── Alert.tsx
│   │   └── ...
│   └── overlay/
│       ├── Dialog.tsx
│       └── ...
└── assets/
    ├── icons/
    └── logos/
```

### Migration Steps
1. Create `radflow.config.json` with theme metadata
2. Create `theme/` directory
3. Move all CSS files into `theme/`
4. Rename `dark.css` → `modes.css`
5. Reorganize components into type-based folders
6. Update all import paths
7. Update package.json exports

---

## Next Steps

1. ✅ Update `docs/theme-spec.md` with final decisions
2. [ ] Update all feature specs per checklist above
3. [ ] Plan theme-rad-os migration (can be a Flow epic)
4. [ ] Create validation script to check theme compliance

