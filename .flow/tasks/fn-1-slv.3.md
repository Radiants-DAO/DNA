# fn-1-slv.3 Bundle fonts and create fonts.css

## Description
Bundle font files and create fonts.css with @font-face declarations.

## Source fonts
- Mondwest: `/Users/rivermassey/rad_os/reference/radsol-webapp-main/src/fonts/Mondwest.woff2`
- Mondwest Bold: `/Users/rivermassey/rad_os/reference/radsol-webapp-main/src/fonts/Mondwest-Bold.woff2`
- Joystix: `/Users/rivermassey/rad_os/reference/radsol-webapp-main/src/fonts/Joystix.woff2`
- PixelCode: Search in `/Users/rivermassey/rad_os/` or fallback to system mono

## fonts.css structure
```css
@font-face {
  font-family: 'Mondwest';
  src: url('./fonts/Mondwest.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* Similar for Mondwest Bold (700), Joystix, PixelCode */

@theme {
  --font-sans: 'Mondwest', system-ui, sans-serif;
  --font-heading: 'Joystix Monospace', monospace;
  --font-mono: 'PixelCode', ui-monospace, monospace;
}
```

Reference: Source @font-face `/Users/rivermassey/rad_os/app/globals.css:6-28`
## Acceptance
- [ ] fonts/ directory contains Mondwest.woff2, Mondwest-Bold.woff2, Joystix.woff2
- [ ] fonts.css has @font-face for each font
- [ ] Font paths use relative `./fonts/` (not `/fonts/`)
- [ ] font-display: swap for all fonts
- [ ] @theme block defines --font-sans, --font-heading, --font-mono
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
