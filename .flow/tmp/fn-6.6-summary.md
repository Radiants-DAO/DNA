# fn-6.6 Summary: Icon.tsx size prop with token integration

## Changes Made

Updated `packages/theme-rad-os/components/core/Icon.tsx` to integrate with the icon size token system defined in tokens.css.

### Type Updates
- Extended `IconSize` type from `'sm' | 'md' | 'lg' | 'xl'` to `'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'`
- Added documentation linking semantic sizes to CSS custom properties

### Size Mapping Updates
- Updated `ICON_SIZES` constant to match token values:
  - Added `xs: 12` (--icon-xs: inline text, badges)
  - `sm: 16` unchanged (--icon-sm: dense UI, tables)
  - `md: 20` unchanged (--icon-md: default buttons, nav)
  - Fixed `lg` from 32 to 24 (--icon-lg: primary actions, headers)
  - Fixed `xl` from 48 to 32 (--icon-xl: feature highlights)
  - Added `'2xl': 48` (--icon-2xl: hero sections)

### Documentation
- Added JSDoc comments documenting the token integration
- Updated interface documentation to list all available sizes

## Token Alignment

The Icon component now matches the CSS tokens in tokens.css:
```css
--icon-xs: 12px;
--icon-sm: 16px;
--icon-md: 20px;
--icon-lg: 24px;
--icon-xl: 32px;
--icon-2xl: 48px;
```

## Files Modified
- `packages/theme-rad-os/components/core/Icon.tsx`
