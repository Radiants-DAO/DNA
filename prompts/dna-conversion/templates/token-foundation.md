# Task Template: Token Foundation

Use this template for the token foundation task that establishes the semantic token layer.

---

## Task Structure

```markdown
# Task: Token Foundation

**Sprint:** 1
**Dependencies:** None
**Complexity:** Medium

## Description

Establish the DNA semantic token layer by adding semantic tokens that map to existing brand tokens. This creates the abstraction layer that allows components to use purpose-based tokens instead of brand-specific colors.

## Token Mapping

From the assessment, apply this mapping:

| Current Token | DNA Semantic Token | Value |
|---------------|-------------------|-------|
| {from_assessment} | {target_semantic} | {value} |

## Files to Modify

- `{css_file_path}` - Add semantic tokens to @theme block

## Implementation Steps

1. **Locate the @theme block** in the CSS file
2. **Keep brand tokens** in `@theme inline` (or at top of @theme)
3. **Add semantic tokens** using the mapping table above
4. **Add motion tokens** if not present:
   ```css
   --duration-fast: 100ms;
   --duration-base: 150ms;
   --duration-moderate: 200ms;
   --duration-slow: 300ms;
   --easing-default: cubic-bezier(0, 0, 0.2, 1);
   ```
5. **Add spacing tokens** if not present:
   ```css
   --spacing-xs: 0.25rem;
   --spacing-sm: 0.5rem;
   --spacing-md: 1rem;
   --spacing-lg: 1.5rem;
   --spacing-xl: 2rem;
   --spacing-2xl: 3rem;
   ```

## Reference Structure

```css
@theme inline {
  /* Brand tokens (internal reference only) */
  --color-green: #27FF93;
  --color-blue: #32D6FF;
  --color-black: #000000;
  --color-white: #FFFFFF;
}

@theme {
  /* Semantic tokens - Surface */
  --color-page: var(--color-white);
  --color-inv: var(--color-black);
  --color-tinted: var(--color-neutral-1);

  /* Semantic tokens - Content */
  --color-main: var(--color-black);
  --color-flip: var(--color-white);
  --color-mute: rgba(0, 0, 0, 0.6);

  /* Semantic tokens - Edge */
  --color-line: var(--color-black);
  --color-focus: var(--color-blue);

  /* Semantic tokens - Action */
  --color-accent: var(--color-green);
  --color-danger: var(--color-accent-1);

  /* Semantic tokens - Status */
  --color-success: var(--color-green);
  --color-danger: var(--color-accent-1);
  --color-link: var(--color-blue);

  /* Motion */
  --duration-fast: 100ms;
  --duration-base: 150ms;
  --duration-moderate: 200ms;
  --duration-slow: 300ms;
  --easing-default: cubic-bezier(0, 0, 0.2, 1);

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
}
```

## Validation Criteria

- [ ] All required semantic tokens are defined:
  - [ ] `--color-page`
  - [ ] `--color-inv`
  - [ ] `--color-main`
  - [ ] `--color-flip`
  - [ ] `--color-line`
- [ ] Motion tokens are defined (duration-*, easing-*)
- [ ] No CSS resolution errors (`pnpm build` or `npm run build`)
- [ ] Tailwind generates utilities for new tokens (`bg-page`, etc.)

## Commit Message

```
feat(tokens): add DNA semantic token layer

- Add surface-* tokens for backgrounds
- Add content-* tokens for text/icons
- Add edge-* tokens for borders
- Add action-* tokens for interactive elements
- Add status-* tokens for feedback states
- Add motion tokens (duration-*, easing-*)
```

## Notes

- Keep brand tokens for reference - they're still valid for Tailwind utilities
- Non-standard semantic tokens (--color-bg-*, --color-text-*) can be removed after component refactor
- Test that `bg-page` works in a component before proceeding
```

---

## Key Decisions

1. **Brand tokens stay** - They remain usable, just not preferred
2. **Semantic tokens reference brand** - Use `var(--color-brand)` syntax
3. **Motion tokens are optional** - But recommended for consistency
4. **Spacing tokens** - Only add if not already present
