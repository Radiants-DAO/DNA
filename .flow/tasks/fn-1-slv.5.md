# fn-1-slv.5 Create dark.css with dark mode overrides

## Description
Create dark.css with dark mode token overrides.

rad_os doesn't have dark mode - this is NEW. Invert the semantic token mappings.

## Structure
```css
.dark {
  /* Invert surfaces */
  --color-surface-primary: var(--color-black);
  --color-surface-secondary: var(--color-warm-cloud);
  
  /* Invert content */
  --color-content-primary: var(--color-warm-cloud);
  --color-content-inverted: var(--color-black);
  
  /* Edges - use light color on dark */
  --color-edge-primary: var(--color-warm-cloud);
  
  /* Action colors can stay similar or adjust for contrast */
}

@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    /* Same overrides */
  }
}
```

Reference: DNA spec `/Users/rivermassey/Desktop/dev/dna/docs/theme-spec.md:392-408`
## Acceptance
- [ ] dark.css created at `packages/radiants/dark.css`
- [ ] .dark class selector defined
- [ ] All surface tokens inverted
- [ ] All content tokens inverted
- [ ] Edge tokens adjusted for dark background
- [ ] @media prefers-color-scheme: dark fallback
- [ ] Retro aesthetic preserved (shadows still visible, contrast maintained)
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
