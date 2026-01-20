# fn-1-slv.4 Create typography.css from rad_os base styles

## Description
Create typography.css with @layer base element styles.

## Source
- Typography: `/Users/rivermassey/rad_os/app/globals.css:330-574`

## Structure
```css
@layer base {
  /* Headings - use Joystix */
  h1 { @apply text-4xl font-heading leading-tight text-content-primary; }
  h2 { @apply text-3xl font-heading leading-tight text-content-primary; }
  /* ... h3-h6 */
  
  /* Body - use Mondwest */
  p { @apply text-base font-sans leading-relaxed text-content-primary; }
  
  /* Links */
  a { @apply text-content-link underline hover:opacity-80; }
  
  /* Code - use PixelCode/mono */
  code { @apply text-sm font-mono bg-surface-secondary px-1 py-0.5 rounded-sm; }
  pre { @apply text-sm font-mono bg-surface-secondary p-4 rounded-sm overflow-x-auto; }
}
```

## Key changes from source
- Replace brand tokens with semantic tokens (text-black -> text-content-primary)
- Use font-heading, font-sans, font-mono instead of specific font names
## Acceptance
- [ ] typography.css created at `packages/radiants/typography.css`
- [ ] Uses @layer base
- [ ] All h1-h6 elements styled with font-heading
- [ ] Body text uses font-sans
- [ ] Code/pre uses font-mono
- [ ] All color references use semantic tokens (content-primary, not black)
- [ ] Preserves rad_os visual hierarchy
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
