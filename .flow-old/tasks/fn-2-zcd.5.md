# fn-2-zcd.5 Update app globals.css to import theme

## Description
Update app globals.css to import from theme instead of defining tokens locally.

## Changes to packages/radiants/apps/rad_os/app/globals.css

Replace content with theme imports:
```css
/* Import theme styles */
@import '@dna/radiants';
@import '@dna/radiants/dark';

/* App-specific overrides (if any) */
```

The theme's index.css already includes:
- tailwindcss
- tokens.css (brand + semantic tokens)
- fonts.css (@font-face declarations)
- typography.css (base element styles)
- base.css (body styles, scrollbar)
- animations.css (keyframes)

## Remove from globals.css (all provided by theme)
- Lines 8-30: @font-face declarations (broken - reference non-existent files; theme has correct fonts)
- Lines 132-231: @theme blocks (tokens now in theme tokens.css)
- Lines 76-130: @keyframes (now in theme animations.css)
- Lines 233-328: Scrollbar styles (now in theme base.css)
- Lines 37-70: Base body styles (now in theme base.css)
- Lines 330-end: Typography @layer base (now in theme typography.css)

**Note**: App's @font-face declarations reference non-existent files (`Mondwest-Regular.woff2`, `PixelCode.woff2`). Theme fonts.css has working declarations with correct file names (`Mondwest.woff2`, `Joystix.woff2`).
## Acceptance
- [ ] globals.css imports @dna/radiants
- [ ] globals.css imports @dna/radiants/dark
- [ ] No duplicate token definitions
- [ ] No duplicate @font-face declarations
- [ ] No duplicate @keyframes
- [ ] App still renders correctly with theme styles
## Done summary
Updated app globals.css to import @dna/radiants theme instead of defining all styles locally. Removed ~570 lines of duplicate CSS including @font-face declarations, @theme blocks, @keyframes, scrollbar styles, base body styles, and typography @layer definitions.
## Evidence
- Commits: 75620a28909566d542ecb2e34470801e85fd2300
- Tests:
- PRs: