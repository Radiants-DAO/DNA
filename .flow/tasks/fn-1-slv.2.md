# fn-1-slv.2 Create tokens.css with semantic token mappings

## Description
Create tokens.css with semantic token mappings from rad_os brand tokens.

## Source
- Brand tokens: `/Users/rivermassey/rad_os/app/globals.css:136-221`

## Token Mapping
```css
@theme inline {
  /* Brand tokens (internal) */
  --color-cream: #FEF8E2;
  --color-black: #0F0E0C;
  --color-sun-yellow: #FCE184;
  --color-sky-blue: #95BAD2;
  --color-warm-cloud: #FEF8E2;
  --color-sunset-fuzz: #FCC383;
  --color-sun-red: #FF6B63;
  --color-green: #CEF5CA;
}

@theme {
  /* Surface tokens */
  --color-surface-primary: var(--color-warm-cloud);
  --color-surface-secondary: var(--color-black);
  --color-surface-elevated: var(--color-white);
  
  /* Content tokens */
  --color-content-primary: var(--color-black);
  --color-content-inverted: var(--color-warm-cloud);
  --color-content-link: var(--color-sky-blue);
  
  /* Edge tokens */
  --color-edge-primary: var(--color-black);
  --color-edge-focus: var(--color-sun-yellow);
  
  /* Action tokens */
  --color-action-primary: var(--color-sun-yellow);
  --color-action-secondary: var(--color-black);
  
  /* Status tokens */
  --color-status-success: var(--color-green);
  --color-status-warning: var(--color-sun-yellow);
  --color-status-error: var(--color-sun-red);
  
  /* Radius, shadows, spacing from source */
}
```

## Include
- All radius tokens (--radius-none through --radius-full)
- All shadow tokens (--shadow-btn, --shadow-card, etc.)
- Font size tokens
## Acceptance
- [ ] tokens.css created at `packages/radiants/tokens.css`
- [ ] Brand tokens in `@theme inline` block
- [ ] Required semantic tokens present: surface-primary, surface-secondary, content-primary, content-inverted, edge-primary
- [ ] Action tokens defined (action-primary, action-secondary)
- [ ] Status tokens defined (success, warning, error)
- [ ] Radius tokens migrated
- [ ] Shadow tokens migrated with retro lift effect preserved
## Done summary
Created tokens.css with semantic token mappings from rad_os brand tokens. Includes surface, content, edge, action, and status semantic tokens, plus radius and shadow tokens with retro lift effect preserved.
## Evidence
- Commits:
- Tests:
- PRs: