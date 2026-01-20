# fn-2-zcd.2 Create animations.css and base.css in theme

## Description
Extract animations and base styles from app globals.css to theme package.

## Files to create

### packages/radiants/animations.css
Extract from `apps/rad_os/app/globals.css` lines 76-130:
- @keyframes slide-in-right
- @keyframes fadeIn  
- @keyframes scaleIn
- @keyframes slideIn
- .animate-* utility classes

### packages/radiants/base.css
Extract from `apps/rad_os/app/globals.css` lines 37-70, 233-328:
- Box-sizing reset
- html/body base styles
- ::selection styles
- Custom scrollbar styles (.custom-scrollbar, etc.)

### packages/radiants/assets/scrollbar-background.svg
Copy scrollbar SVG from `apps/rad_os/public/scrollbar-background.svg` to theme assets.
Update base.css scrollbar background-image URL to use relative path `url('./assets/scrollbar-background.svg')`.

## Update packages/radiants/package.json exports
Add:
```json
"./animations": "./animations.css",
"./base": "./base.css"
```

## Update packages/radiants/index.css
Import the new files:
```css
@import './base.css';
@import './animations.css';
```
## Acceptance
- [ ] animations.css created with all @keyframes and .animate-* classes
- [ ] base.css created with body styles and scrollbar CSS
- [ ] assets/scrollbar-background.svg copied from app
- [ ] base.css scrollbar URL updated to `./assets/scrollbar-background.svg`
- [ ] package.json exports updated for ./animations and ./base
- [ ] index.css imports base.css and animations.css
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
