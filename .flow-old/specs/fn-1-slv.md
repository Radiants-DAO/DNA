# Scaffold @dna/radiants theme package

## Overview

Migrate the rad_os design system to a DNA-compliant theme package at `packages/radiants/`. This creates the first implementation of the DNA spec, converting rad_os's retro pixel aesthetic into a portable, AI-friendly theme package.

**Source:** `/Users/rivermassey/rad_os` (skip devtools/)
**Target:** `/Users/rivermassey/Desktop/dev/dna/packages/radiants`

## Scope

### In Scope
- Package scaffolding with DNA-compliant structure
- Token conversion from brand to semantic naming
- Font bundling (Mondwest, PixelCode, Joystix)
- Three components: Button, Input, Card (with .tsx, .schema.json, .dna.json)
- CSS files: index.css, tokens.css, typography.css, fonts.css, dark.css

### Out of Scope (for now)
- All other 26 components (migrated one-at-a-time later)
- Icon system (decision deferred)
- Window system components (AppWindow, Taskbar, Desktop)
- Devtools suite

## Approach

1. **Package structure first** - Create folder layout and package.json
2. **Tokens layer** - Convert brand tokens to semantic naming, create tokens.css
3. **Typography + Fonts** - Bundle fonts, create typography.css and fonts.css
4. **Dark mode** - Create dark.css with inverted semantic tokens
5. **Components** - Migrate Button, Input, Card with three-file pattern

## Key Mappings

| rad_os Token | DNA Semantic Token |
|--------------|-------------------|
| `--color-warm-cloud` | `--color-surface-primary` |
| `--color-black` | `--color-surface-secondary`, `--color-content-primary`, `--color-edge-primary` |
| `--color-sun-yellow` | `--color-action-primary`, `--color-edge-focus` |
| `--color-sky-blue` | `--color-content-link` |
| `--color-green` | `--color-status-success` |
| `--color-sun-red` | `--color-status-error` |

## Quick commands

```bash
# Verify package structure
ls -la /Users/rivermassey/Desktop/dev/dna/packages/radiants/

# Check token definitions
grep -A5 "@theme" /Users/rivermassey/Desktop/dev/dna/packages/radiants/tokens.css

# Validate CSS imports
cat /Users/rivermassey/Desktop/dev/dna/packages/radiants/index.css
```

## Acceptance

- [ ] Package at `packages/radiants/` with valid package.json
- [ ] All required CSS files present (index.css, tokens.css, typography.css, fonts.css, dark.css)
- [ ] Fonts bundled in `fonts/` directory
- [ ] Semantic tokens defined per DNA spec (surface-*, content-*, edge-*, action-*, status-*)
- [ ] Button, Input, Card components migrated with three-file pattern
- [ ] Dark mode token overrides in dark.css
- [ ] Components use semantic tokens (no hardcoded brand tokens)

## References

- DNA spec: `/Users/rivermassey/Desktop/dev/dna/docs/theme-spec.md`
- Source tokens: `/Users/rivermassey/rad_os/app/globals.css:136-221`
- Source typography: `/Users/rivermassey/rad_os/app/globals.css:330-574`
- Source components: `/Users/rivermassey/rad_os/components/ui/`
- Vault: `/Users/rivermassey/Desktop/vault/dna-conversion.md`
