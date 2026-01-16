# fn-6.17: Preview setup - Duplicate and modify for new components

## Summary

Added a new "Theme Tokens" section to the preview/core.tsx file that showcases all the token system enhancements from the fn-6 epic. This provides a visual reference for developers to understand and use the new design tokens.

## Changes Made

1. **Added Icon import** to preview/core.tsx from the components/core module

2. **Created ThemeTokensContent component** with sections demonstrating:
   - **Icon Size Tokens**: xs (12px) through 2xl (48px) with visual examples
   - **Motion Tokens**: Explanation of duration-scalar behavior (instant in light mode, animated in dark mode)
   - **Touch Target Tokens**: Visual representation of min (24px), default (44px), and comfortable (48px) touch targets
   - **Focus Ring Tokens**: Interactive demo showing focus ring styling
   - **Density Tokens**: Examples of compact (0.5x), default (1x), and comfortable (1.5x) density modes
   - **Fluid Typography**: Text size tokens from --text-xs through --text-2xl
   - **Fluid Spacing**: Space tokens and dramatic pairs (s-m, s-l, m-xl)
   - **Easing Tokens**: All easing curve tokens
   - **Stagger Tokens**: Animation delay tokens for sequential animations

3. **Added Theme Tokens section** as the first item in COMPONENT_SECTIONS array

## Pattern Consistency

Follows the same preview pattern as other sections:
- Uses Section and Row helper components
- Includes props documentation strings
- Provides interactive examples where applicable
- Maintains consistent spacing and organization

## Verification

- TypeScript compiled without errors (npx tsc --noEmit)
- Preview section structure matches existing sections
