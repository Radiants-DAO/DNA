# RDNA ESLint Rule Reference

Current source of truth:

* Plugin: `packages/radiants/eslint/index.mjs`

* Root RDNA config: `eslint.rdna.config.mjs`

* Token color scanner: `scripts/lint-token-colors.mjs`

## How The Rules Run

`pnpm lint` runs the default package lint graph and the RDNA design-system lint:

```sh
turbo lint && pnpm lint:design-system
```

The Turbo lint graph currently resolves to the RadOS app ESLint config from `apps/rad-os/eslint.config.mjs`.

That default app config uses:

* `eslint-config-next/core-web-vitals`

* `eslint-config-next/typescript`

The RDNA design-system pass runs:

```sh
pnpm exec eslint --config eslint.rdna.config.mjs 'packages/radiants/components/core/**/*.{ts,tsx}' 'apps/rad-os/**/*.{ts,tsx}'
pnpm lint:token-colors
```

The repo pre-commit hook also runs:

```sh
pnpm lint:design-system:staged
```

## Scope And Severity

### RadOS App Files

Files:

* `apps/rad-os/**/*.{ts,tsx}`

Rules:

* `rdna.configs.recommended.rules`

* `rdna/require-exception-metadata`: error

* `rdna/no-broad-rdna-disables`: error

* `unused-imports/no-unused-imports`: warning

* `unused-imports/no-unused-vars`: warning

### RadOS Window Content

Files:

* `apps/rad-os/components/apps/**/*.{ts,tsx}`

* `apps/rad-os/components/Rad_os/**/*.{ts,tsx}`

Additional rules:

* `rdna/no-viewport-breakpoints-in-window-layout`: error

* `rdna/no-viewport-units-in-window-layout`: error

### Radiants Internals

Files:

* `packages/radiants/components/core/**/*.{ts,tsx}`

Rules:

* `rdna.configs.internals.rules`

* `rdna/prefer-rdna-components`: off

* `rdna/require-exception-metadata`: error

* `rdna/no-broad-rdna-disables`: error

* `rdna/no-mixed-style-authority`: error

* `unused-imports/no-unused-imports`: warning

* `unused-imports/no-unused-vars`: warning

### Ctrl And Pixel Internals

Files:

* `packages/ctrl/**/*.{ts,tsx}`

* `packages/pixel/src/**/*.{ts,tsx}`

Rules:

* Same RDNA internals behavior as Radiants core.

* `rdna/no-mixed-style-authority`: error

### Preview Package

Files:

* `packages/preview/src/**/*.{ts,tsx}`

Rules:

* `unused-imports/no-unused-imports`: warning

* `unused-imports/no-unused-vars`: warning

## Active Error Rules

These are now treated as mature enough to fail RDNA lint in the recommended/internals configs:

* `rdna/no-hardcoded-colors`

* `rdna/no-hardcoded-typography`

* `rdna/no-raw-radius`

* `rdna/no-raw-shadow`

* `rdna/no-clipped-shadow`

* `rdna/no-pixel-border`

* `rdna/no-raw-line-height`

* `rdna/no-arbitrary-icon-size`

* `rdna/no-translucent-bg`

* `rdna/no-backdrop-blur`

* `rdna/no-inline-svg-icons`

* `rdna/require-icon-button-label`

Additional scoped/config errors:

* `rdna/require-exception-metadata`

* `rdna/no-broad-rdna-disables`

* `rdna/no-mixed-style-authority`

* `rdna/no-viewport-breakpoints-in-window-layout`

* `rdna/no-viewport-units-in-window-layout`

## Warning Rules

These still need migration/backlog work before promotion:

* `rdna/no-hardcoded-spacing`

* `rdna/no-removed-aliases`

* `rdna/prefer-rdna-components`

* `rdna/prefer-ctrl-components`

* `rdna/no-raw-font-family`

* `rdna/no-pattern-color-override`

* `rdna/no-translucent-ink`

* `rdna/no-raw-layout-values`

* `rdna/no-z-index-literals`

* `rdna/no-dynamic-tailwind-token-construction`

* `rdna/no-unregistered-design-token-vars`

* `rdna/no-appwindow-scroll-conflict`

## Paused Rule

### `rdna/no-hardcoded-motion`

This rule still exists in the plugin, but it is no longer enabled in `recommended`, `internals`, or `recommended-strict`.

Reason:

* The motion library is expected to be refactored later.

* Enforcing the current motion contract now would produce noise and train people to ignore the linter.

## RDNA Rules

### `rdna/no-hardcoded-colors`

Bans non-semantic color usage in `className` strings and inline `style` props.

Flags:

* Arbitrary Tailwind color utilities such as `bg-[#000]`, `text-[rgb(...)]`, `border-[oklch(...)]`.

* Raw Tailwind palette classes such as `bg-white`, `text-black`, `border-slate-500`.

* Colorish primitive or brand suffixes that are not approved RDNA semantic color tokens.

* Inline color-bearing style properties such as `color`, `backgroundColor`, `borderColor`, `boxShadow`, `fill`, and `stroke` when they contain raw colors, named CSS colors, unsupported CSS variables, or dynamic template literals.

Allows:

* RDNA semantic color token utilities.

* `transparent`, `current`, and `inherit` where applicable.

* Pure `var(--color-*)` references when the variable name is in the generated RDNA semantic color contract.

* Explicit brand primitive display surfaces marked with `data-rdna-brand-primitive` or `data-rdna-brand-surface="primitive"`. These are limited to swatches/previews whose purpose is to show the primitive color itself, not to style general UI chrome.

Fix behavior:

* Auto-fixes some arbitrary Tailwind color classes when a one-to-one token mapping exists in the generated contract.

### `rdna/no-hardcoded-typography`

Bans arbitrary typography values outside RDNA typography tokens.

Flags:

* Arbitrary text-size classes such as `text-[44px]`.

* Arbitrary font-weight classes such as `font-[450]`.

* Inline `style` values for `fontSize` or `fontWeight` when they are numeric literals, hardcoded strings, or dynamic template literals.

Allows:

* RDNA token-mapped `text-*` and `font-*` utilities.

* `var(--font-size-*)` and `var(--font-weight-*)` in style props.

### `rdna/no-hardcoded-spacing`

Bans fixed arbitrary spacing values while allowing the regular Tailwind spacing scale.

Flags:

* Fixed arbitrary spacing utilities such as `p-[12px]`, `gap-[13px]`, `mt-[24px]`.

* Inline spacing style properties such as `padding`, `margin`, and `gap` when they use numeric literals, hardcoded strings, or dynamic template literals.

Allows:

* Standard Tailwind scale utilities such as `p-4`, `gap-2`, `mt-3`.

* Responsive arbitrary spacing values using `%`, `rem`, `clamp()`, `calc()`, `min()`, or `max()`.

* CSS variables in style props.

Decision:

* Width, height, positioning, and translate are covered by `rdna/no-raw-layout-values` instead of expanding this spacing rule.

### `rdna/no-raw-layout-values`

Bans fixed arbitrary layout sizing and positioning values.

Flags:

* Arbitrary fixed layout classes such as `w-[22rem]`, `h-[120px]`, `left-[17px]`, and `-translate-y-[3px]`.

* Inline layout style props such as `width`, `height`, `minWidth`, `maxWidth`, `top`, `left`, `inset`, and `translate` when they use numeric literals, hardcoded strings, or dynamic template literals.

Allows:

* Standard Tailwind layout utilities.

* `%`, `rem`, `clamp()`, `calc()`, `min()`, and `max()` arbitrary values.

* CSS variables.

* Configured `exemptPaths` for rendering/canvas-heavy surfaces.

### `rdna/no-raw-radius`

Bans arbitrary radius values in class names and hardcoded border radius in style props.

Flags:

* Arbitrary radius utilities such as `rounded-[6px]`.

* Inline `borderRadius`, `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomLeftRadius`, or `borderBottomRightRadius` when hardcoded.

Allows:

* Standard/tokenized radius utilities.

* CSS variables with the `--radius-*` prefix in style props.

### `rdna/no-raw-shadow`

Bans arbitrary or hardcoded shadow values.

Flags:

* Arbitrary shadow utilities such as `shadow-[...]`.

* Inline `boxShadow` values unless they are `var(--shadow-*)`.

* Inline `filter` values containing hardcoded `drop-shadow(...)`.

* Dynamic shadow template literals.

Allows:

* RDNA standard, pixel, and glow shadow tokens.

* `boxShadow: "var(--shadow-*)"`

* `filter` values whose `drop-shadow(...)` arguments are all `var(--shadow-*)`.

### `rdna/no-raw-line-height`

Bans arbitrary line-height values.

Flags:

* Arbitrary leading classes such as `leading-[24px]` or `leading-[1.4]`.

* Inline `lineHeight` values when numeric, hardcoded, or dynamic.

Allows:

* `leading-tight`

* `leading-heading`

* `leading-snug`

* `leading-normal`

* `leading-relaxed`

* `leading-none`

* `var(--leading-*)` in style props.

### `rdna/no-raw-font-family`

Bans hardcoded `fontFamily` values in style props.

Flags:

* Inline `fontFamily` hardcoded strings.

* Dynamic template literals for `fontFamily`.

Allows:

* `var(--font-*)` references.

* Tailwind font utility classes, because this rule only checks style props.

Exemption:

* Files importing from `@chenglou/pretext` are exempt because canvas measurement needs literal font names.

### `rdna/no-removed-aliases`

Bans removed RDNA token alias names.

Flags:

* String literals and template literal text containing removed aliases from the generated contract.

Boundary behavior:

* The rule only reports matches that are not embedded inside a larger word-like token.

### `rdna/no-clipped-shadow`

Bans box-shadow tokens where `clip-path` based pixel corners would clip them.

Flags:

* Same-element usage of `pixel-rounded-*` or `pixel-corner` with clippable `shadow-*` tokens.

* Descendant usage of clippable `shadow-*` tokens under a pixel-cornered JSX ancestor.

* CVA, `cn`, or `clsx` style call expressions outside direct `className` attributes when they combine pixel corners and clippable shadows.

Expected fix:

* Use `pixel-shadow-*` or move the shadow outside the clipped container.

### `rdna/no-pixel-border`

Bans native borders and `overflow-hidden` on pixel-cornered elements.

Flags:

* `border` and most `border-*` classes on elements using `pixel-rounded-*` or `pixel-corner`.

* `overflow-hidden` on those same pixel-cornered elements.

Allows:

* Non-rendering or non-clipping border utilities such as `border-none`, `border-0`, and `border-transparent`.

Reason:

* Pixel corners use `clip-path` plus a pseudo-element border. Native borders can clip visually, and `overflow-hidden` can clip the pseudo-element border.

### `rdna/no-pattern-color-override`

Bans hardcoded color overrides on pattern-mode elements.

Flags:

* Pattern elements with `style` values for `color`, `backgroundColor`, `background`, or `--pat-color` when the value is a raw color.

* Elements marked by `mode="pattern"`.

* Elements with `rdna-pat` or `rdna-pat--*` class names.

Allows:

* Semantic CSS variables such as `var(--color-line)`.

* Non-color keywords such as `transparent`, `currentcolor`, `inherit`, `unset`, and `initial`.

### `rdna/no-arbitrary-icon-size`

Restricts external `<Icon>` usage to approved rendered icon sizes and removes legacy API usage.

Flags:

* `<Icon size={...}>` values outside the configured approved size set.

* Dynamic `size` expressions.

* Redundant `size={16}` because `16` is the default.

* `size={24}`, preferring the `large` prop.

* Removed `iconSet` prop.

Allows by default:

* Omitted `size`.

* `size={21}`.

* `large` for the 24px icon set.

Configuration:

* `allowedSizes` can override the default allowed set.

### `rdna/no-inline-svg-icons`

Bans raw SVG icon sources in application UI.

Flags:

* Inline `<svg>` usage.

* Raw SVG children such as `<path>`, `<rect>`, and `<circle>`.

* SVG data URIs in JSX attributes.

* SVG file imports.

* Imports from common non-RDNA icon libraries such as `lucide-react`, `react-icons`, `@heroicons/*`, `@tabler/icons-react`, and `@radix-ui/react-icons`.

Allows:

* `@rdna/radiants/icons/runtime`.

* Configured/existing rendering internals for icon generation, logo generation, pixel previews, and canvas-heavy surfaces.

Expected fix:

* Use the RDNA bitmap-backed icon runtime.

### `rdna/require-icon-button-label`

Requires accessible labels for icon-only controls.

Flags:

* Raw `<button>` controls that contain only an icon and no accessible label.

* RDNA/RDNA-adjacent controls such as `<Button>`, `<IconCell>`, `<ActionButton>`, and `<TransportButton>` when icon-only and unlabeled.

Allows:

* `aria-label`

* `label`

* `title`

* `tooltip`

* Visible text

* `sr-only` text

### `rdna/no-translucent-bg`

Bans translucent background utility classes.

Flags:

* `bg-*/N` classes such as `bg-page/80` or `bg-accent/30`.

Expected fix:

* Use opaque semantic surface tokens such as `bg-depth`, `bg-card`, `bg-tinted`, `bg-accent-soft`, or `bg-line`.

### `rdna/no-translucent-ink`

Bans semi-transparent ink/black styling and broad opacity-based chrome.

Flags:

* Utility classes like `text-black/60`, `bg-ink/30`, `border-pure-black/[0.2]`.

* Any `opacity-*` utility except `opacity-0` and `opacity-100`.

* Class strings containing black alpha values such as `rgba(0,0,0,0.5)`, `rgb(0 0 0 / 50%)`, or hex alpha black.

* Class strings containing alpha `--color-ink`, `--color-pure-black`, or `black` through `rgba(...)` or `color-mix(...)`.

* Inline color-bearing style props containing semi-transparent ink or black.

* Inline `opacity` values between `0` and `1`.

Expected fix:

* Use opaque semantic surface and text tokens rather than alpha-blended UI chrome.

### `rdna/no-backdrop-blur`

Bans backdrop blur and backdrop filter.

Flags:

* `backdrop-blur`, `backdrop-blur-*`, and arbitrary `backdrop-blur-[...]` utilities.

* Inline `backdropFilter` and `WebkitBackdropFilter` style props.

Reason:

* RDNA chrome is opaque; glassmorphism is outside the design system.

### `rdna/prefer-rdna-components`

Prefers RDNA components over raw HTML elements where a Radiants component equivalent exists.

Flags:

* Raw HTML elements in the generated Radiants component map.

* Always checks mapped elements such as `button`, `textarea`, `select`, `dialog`, `details`, `label`, `meter`, `progress`, and `hr`.

* Checks `input` only when the input is text-like, missing a `type`, or has a dynamic type.

Allows:

* Native-only input controls such as file, checkbox, radio, date, and hidden when they are not text-like.

Exemptions:

* Radiants internals.

* Configurable `exemptPaths`.

### `rdna/prefer-ctrl-components`

Prefers `@rdna/ctrl` primitives inside explicit control surfaces.

Control-surface markers:

* `data-ctrl-surface`

* `data-aw="control-surface..."`

Flags inside those surfaces:

* Raw `button`, `select`, `textarea`, `meter`, and `progress`.

* Raw `input` controls for range/number/text/search-like uses.

* Controls imported from `@rdna/radiants/components/core` when a `@rdna/ctrl` primitive should own the surface.

Allows:

* Non-control structure such as `div` and `span`.

* Components imported from `@rdna/ctrl`.

### `rdna/no-viewport-breakpoints-in-window-layout`

Bans viewport breakpoint prefixes in RadOS window content.

Flags:

* `sm:`, `md:`, `lg:`, `xl:`, and `2xl:` class prefixes.

* Stacked variants containing viewport breakpoints.

Allows:

* Container query variants such as `@sm:` and `@md:`.

Reason:

* RadOS apps run inside movable/resizable windows. Viewport breakpoints respond to the browser viewport, not the app window container.

### `rdna/no-viewport-units-in-window-layout`

Bans browser viewport sizing and fixed positioning in RadOS window content.

Flags:

* `w-screen`, `h-screen`, `min-h-screen`, and related screen utilities.

* Arbitrary classes containing `vw`, `vh`, `dvh`, `svh`, `lvh`, `vmin`, or `vmax`.

* `fixed` class usage.

* Inline style props containing viewport units.

* `position: "fixed"`.

Expected fix:

* Use container-relative sizing and absolute positioning inside the app window.

### `rdna/no-z-index-literals`

Bans raw z-index values.

Flags:

* `z-10`, `z-50`, `z-[9999]`, and other numeric z-index utilities.

* Inline numeric or hardcoded `zIndex` values.

* Local ad hoc `--z-index-local` values.

Allows:

* `z-base`

* `z-desktop`

* `z-windows`

* `z-chrome`

* `z-menus`

* `z-toasts`

* `z-modals`

* `z-system`

* `var(--z-index-*)` for registered layer tokens.

### `rdna/no-appwindow-scroll-conflict`

Formalizes AppWindow Island scroll ownership.

Contract:

* `AppWindow.Island` owns the scrollport by default.

* `AppWindow.Island noScroll` means child content owns a bounded scrollport.

* Child-owned scroll regions should use a bounded pattern such as `h-full min-h-0 overflow-y-auto`.

Flags:

* `overflow-auto`, `overflow-scroll`, `overflow-y-auto`, or `overflow-y-scroll` inside an `AppWindow.Island` that does not set `noScroll`.

* `min-h-full` combined with vertical overflow scrolling.

* Inline `style` combinations like `minHeight: "100%"` with `overflowY: "auto"`.

Expected fix:

* Let the Island own scrolling for simple long-form content.

* Add `noScroll` to the Island when an app needs fixed local chrome plus an internal scrolling body.

### `rdna/no-dynamic-tailwind-token-construction`

Bans template-built Tailwind token classes that hide from static lint.

Flags:

* `className={`bg-${tone}`}`

* `cn("p-2", `text-${tone}`)`

* Dynamic arbitrary classes such as `w-[${size}px]`.

Expected fix:

* Use explicit maps, CVA variants, or static class strings.

### `rdna/no-unregistered-design-token-vars`

Validates RDNA CSS variable references against the generated/static token contract.

Flags unknown variables in these families:

* `--color-*`

* `--font-*`

* `--font-size-*`

* `--font-weight-*`

* `--leading-*`

* `--shadow-*`

* `--duration-*`

* `--easing-*`

* `--radius-*`

* `--z-index-*`

Allows:

* Registered color, typography, shadow, motion, radius, z-index, and font variables.

* Non-RDNA app-specific custom properties outside those families.

### `rdna/require-exception-metadata`

Requires structured metadata for RDNA disable comments.

Applies to:

* `eslint-disable-next-line` comments that disable one or more `rdna/*` rules.

Required format:

```ts
// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:<why> owner:<team-slug> expires:YYYY-MM-DD issue:DNA-123
```

Required fields:

* `reason`

* `owner`

* `expires`

* `issue`

Validation:

* `reason` must be non-empty.

* `owner` must be a lowercase slug such as `design-system`.

* `expires` must be a real `YYYY-MM-DD` date and must not be expired.

* `issue` must be `DNA-123` style or an HTTPS URL.

Approved design-owned exceptions that are not cleanup debt are tracked in [RDNA Approved Exceptions](./rdna-approved-exceptions.md).

### `rdna/no-broad-rdna-disables`

Bans broad and same-line RDNA disables.

Flags:

* `eslint-disable rdna/...`

* `eslint-disable-line rdna/...`

Allows:

* `eslint-disable-next-line rdna/...` with valid metadata.

Reason:

* Every RDNA exception should apply to one next line only and carry ownership, expiry, and issue metadata.

### `rdna/no-mixed-style-authority`

Bans mixing local semantic color utilities with theme-owned variant hooks.

Flags:

* A JSX element with a theme-owned `data-variant="..."` plus local semantic color utilities such as `bg-surface-*`, `text-content-*`, `border-edge-*`, `bg-action-*`, or `bg-status-*`.

* Direct `className` strings.

* CVA-derived class names where the CVA definition contains semantic color utilities.

Theme-owned variant data comes from:

* Generated component contract data.

* Generated theme variant contract data.

* Optional rule override config.

Reason:

* Theme CSS owns variants targeted by `[data-variant="..."]`. Adding local semantic color utilities creates competing sources of truth.

## Token CSS Color Rule

`pnpm lint:token-colors` is not an ESLint rule. It runs `scripts/lint-token-colors.mjs`.

Files checked by default:

* `packages/radiants/tokens.css`

* `packages/radiants/dark.css`

Rule:

* Legacy color formats are rejected.

* Token CSS color values should use `oklch()`.

## Completeness Assessment For RadOS

The RDNA linter is now substantially stronger as a RadOS design-system gate because it covers:

* Semantic color/token usage.

* Typography token usage.

* Fixed spacing drift.

* Fixed layout drift.

* Pixel-corner rendering traps.

* Pattern-mode color safety.

* Opaque chrome rules.

* Icon source, icon size, and icon-only accessibility.

* Component wrapper preference.

* Ctrl-only control surfaces.

* AppWindow Island scroll ownership.

* Window-container breakpoint/unit mistakes.

* Layer token hygiene.

* Dynamic Tailwind class construction.

* Design-token CSS variable registration.

* Exception hygiene.

Remaining gaps:

* CSS files are still mostly outside ESLint coverage, except for token color scanning.

* Existing app/rendering surfaces likely need backlog cleanup before every new warning can become an error.

* Some visual quality rules still need browser/visual review rather than static lint, especially layout density, animation choreography, and state-specific overlap.

* Type-aware runtime safety remains mostly outside RDNA lint and should be handled by TypeScript/React lint rules and tests.

⠀
