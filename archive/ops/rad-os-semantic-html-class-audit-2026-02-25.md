# Semantic HTML Class Audit (Step 2)

Date: 2026-02-25
Scope: `app/`, `components/`, `packages/radiants/` TSX/JSX files

## Summary

- Total semantic-tag class overrides found: **211**
- A (likely redundant typography overrides): **166**
- B (intentional component variants): **16**
- C (mixed/dynamic/needs manual review): **29**

By tag:
- `<p>`: 134 total (A 121, B 0, C 13)
- `<h2>`: 19 total (A 17, B 0, C 2)
- `<h3>`: 15 total (A 14, B 1, C 0)
- `<a>`: 11 total (A 0, B 9, C 2)
- `<h4>`: 6 total (A 6, B 0, C 0)
- `<label>`: 6 total (A 1, B 4, C 1)
- `<h1>`: 6 total (A 6, B 0, C 0)
- `<ul>`: 6 total (A 0, B 0, C 6)
- `<code>`: 4 total (A 1, B 2, C 1)
- `<li>`: 2 total (A 0, B 0, C 2)
- `<ol>`: 1 total (A 0, B 0, C 1)
- `<pre>`: 1 total (A 0, B 0, C 1)

## Base Styles Currently Defined

### `typography.css` semantic element rules
- `h1` -> `text-4xl font-heading font-bold leading-tight text-main`
- `h2` -> `text-3xl font-heading font-normal leading-tight text-main`
- `h3` -> `text-2xl font-heading font-semibold leading-snug text-main`
- `h4` -> `text-xl font-heading font-medium leading-snug text-main`
- `h5` -> `text-lg font-heading font-medium leading-normal text-main`
- `h6` -> `text-base font-heading font-medium leading-normal text-main`
- `p` -> `text-base font-sans font-normal leading-relaxed text-main`
- `a` -> `text-base font-sans font-normal leading-normal text-link underline hover:opacity-80`
- `ul` -> `text-base font-heading font-normal leading-relaxed text-main pl-6`
- `ol` -> `text-base font-heading font-normal leading-relaxed text-main pl-6`
- `li` -> `text-base font-sans font-normal leading-relaxed text-main mb-2`
- `small` -> `text-xs font-heading font-normal leading-normal text-main`
- `strong` -> `text-base font-heading font-bold leading-normal text-main`
- `em` -> `text-base font-heading font-normal leading-normal text-main italic`
- `code` -> `text-xs font-mono font-normal leading-normal text-ink bg-cream px-1 py-0.5 rounded-sm`
- `.dark code` -> `text-xs font-mono font-normal leading-normal text-sun-yellow bg-ink border border-line px-2 py-1 rounded-sm`
- `pre` -> `text-xs font-mono font-normal leading-relaxed text-main bg-inv/10 p-4 rounded-sm overflow-x-auto`
- `kbd` -> `text-xs font-mono font-normal leading-normal text-flip bg-inv px-1 py-0.5 rounded-sm`
- `mark` -> `text-base font-heading font-normal leading-normal text-main bg-accent`
- `blockquote` -> `text-base font-heading font-normal leading-relaxed text-main border-l-4 border-line pl-4 italic`
- `cite` -> `text-xs font-heading font-normal leading-normal text-main italic`
- `q` -> `text-base font-heading font-normal leading-normal text-main italic`
- `abbr` -> `text-base font-heading font-normal leading-normal text-main underline decoration-dotted`
- `dfn` -> `text-base font-heading font-normal leading-normal text-main italic`
- `sub` -> `text-xs font-heading font-normal leading-none text-main`
- `sup` -> `text-xs font-heading font-normal leading-none text-main`
- `del` -> `text-base font-heading font-normal leading-normal text-main line-through`
- `ins` -> `text-base font-heading font-normal leading-normal text-main underline`
- `caption` -> `text-xs font-heading font-normal leading-normal text-main`
- `label` -> `text-xs font-heading font-medium leading-normal text-main`
- `figcaption` -> `text-xs font-heading font-normal leading-normal text-main`

### `base.css` global defaults affecting inheritance
- html font-size clamp: `clamp(14px, 1vw + 12px, 16px)`
- body font-family: `var(--font-heading)`
- body background-color: `var(--color-sun-yellow)`
- body color: `var(--color-ink)`

## A Hotspots (most likely cleanup targets)
- 19 A-findings / 28 total: `components/apps/AuctionsApp/AuctionsHelpContent.tsx`
- 14 A-findings / 14 total: `components/apps/AuctionsApp/components/VaultPanel.tsx`
- 13 A-findings / 13 total: `components/apps/SettingsApp.tsx`
- 12 A-findings / 17 total: `components/apps/BrandAssetsApp.tsx`
- 12 A-findings / 12 total: `components/apps/AuctionsApp/components/BidHistory.tsx`
- 11 A-findings / 14 total: `components/apps/AboutApp.tsx`
- 10 A-findings / 10 total: `components/apps/RadiantsStudioApp.tsx`
- 9 A-findings / 10 total: `components/apps/AuctionsApp/AuctionsApp.tsx`
- 9 A-findings / 9 total: `components/apps/AuctionsApp/components/BidPanel.tsx`
- 6 A-findings / 10 total: `components/ui/DesignSystemTab.tsx`
- 5 A-findings / 6 total: `components/apps/SeekerApp/components/ChatTab.tsx`
- 5 A-findings / 5 total: `components/apps/CalendarApp.tsx`
- 4 A-findings / 6 total: `components/apps/LinksApp.tsx`
- 4 A-findings / 4 total: `components/apps/MurderTreeApp.tsx`
- 3 A-findings / 3 total: `components/apps/AuctionsApp/components/AuctionDisplay.tsx`
- 3 A-findings / 3 total: `components/apps/RadRadioApp.tsx`
- 3 A-findings / 3 total: `components/Rad_os/Desktop.tsx`
- 2 A-findings / 3 total: `components/apps/ManifestoApp.tsx`
- 2 A-findings / 3 total: `components/Rad_os/StartMenu.tsx`
- 2 A-findings / 2 total: `../../packages/radiants/components/core/Alert/Alert.tsx`

## B Findings (intentional variant styling)
- `../../packages/radiants/components/core/Checkbox/Checkbox.tsx:61` `<label>` — `inline-flex items-center gap-2 cursor-pointer ${...}`
- `../../packages/radiants/components/core/Checkbox/Checkbox.tsx:122` `<label>` — `inline-flex items-center gap-2 cursor-pointer ${...}`
- `../../packages/radiants/components/core/Switch/Switch.tsx:143` `<label>` — ``
            font-sans text-base text-main
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `.trim()`
- `../../packages/radiants/components/core/Switch/Switch.tsx:157` `<label>` — ``
            font-sans text-base text-main
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `.trim()`
- `components/apps/AboutApp.tsx:124` `<a>` — `font-mondwest text-sm text-main hover:text-sun-yellow transition-colors`
- `components/apps/AuctionsApp/AuctionsApp.tsx:788` `<a>` — `inline-flex items-center gap-2 font-mondwest text-sub hover:text-main transition-colors`
- `components/apps/AuctionsApp/AuctionsHelpContent.tsx:39` `<a>` — `w-6 h-6 border border-line bg-card rounded flex items-center justify-center hover:bg-sun-yellow transition-colors text-xs`
- `components/apps/AuctionsApp/AuctionsHelpContent.tsx:49` `<a>` — `w-6 h-6 border border-line bg-card rounded flex items-center justify-center hover:bg-sun-yellow transition-colors text-xs`
- `components/apps/AuctionsApp/AuctionsHelpContent.tsx:107` `<a>` — `text-main underline hover:text-sun-yellow`
- `components/apps/AuctionsApp/AuctionsHelpContent.tsx:168` `<a>` — `text-main underline hover:text-sun-yellow font-bold`
- `components/apps/AuctionsApp/AuctionsHelpContent.tsx:198` `<a>` — `inline-flex items-center gap-2 hover:text-sub transition-colors`
- `components/apps/BrandAssetsApp.tsx:480` `<code>` — `font-mono text-xs bg-cream dark:bg-cream dark:text-ink px-1.5 py-0.5 rounded-sm group-hover:bg-sun-yellow/20 truncate`
- `components/apps/BrandAssetsApp.tsx:604` `<code>` — `font-mono text-[11px] text-sun-yellow bg-ink dark:bg-cream dark:text-ink px-1 py-0.5 rounded-sm w-14 shrink-0`
- `components/apps/LinksApp.tsx:112` `<a>` — `
        block p-4
        border border-rule rounded-sm
        bg-depth
        hover:border-line-hover
        active:bg-active
        transition-colors
        group
      `
- `components/apps/LinksApp.tsx:128` `<h3>` — `font-joystix text-xs text-main group-hover:text-main`
- `components/Rad_os/StartMenu.tsx:182` `<a>` — `
                    flex items-center gap-3
                    p-3
                    rounded-lg
                    hover:bg-sun-yellow active:bg-sun-yellow
                    transition-colors
                  `

## C Findings (manual review needed)
- `../../packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx:45` `<ol>` — `flex items-center gap-2`
- `../../packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx:50` `<li>` — `flex items-center gap-2`
- `../../packages/radiants/components/core/Button/Button.tsx:227` `<a>` — `classes`
- `../../packages/radiants/components/core/CountdownTimer/CountdownTimer.tsx:182` `<p>` — `styles.label`
- `../../packages/radiants/components/core/CountdownTimer/CountdownTimer.tsx:195` `<p>` — `styles.label`
- `../../packages/radiants/components/core/CountdownTimer/CountdownTimer.tsx:228` `<p>` — `styles.label`
- `../../packages/radiants/components/core/Dialog/Dialog.tsx:156` `<h2>` — ``font-heading text-base uppercase text-main ${className}`.trim()`
- `../../packages/radiants/components/core/Dialog/Dialog.tsx:169` `<p>` — ``font-sans text-base text-sub mt-2 ${className}`.trim()`
- `../../packages/radiants/components/core/Input/Input.tsx:166` `<label>` — `className`
- `../../packages/radiants/components/core/Sheet/Sheet.tsx:234` `<h2>` — ``font-heading text-base uppercase text-main ${className}`.trim()`
- `../../packages/radiants/components/core/Sheet/Sheet.tsx:249` `<p>` — ``font-sans text-base text-sub mt-2 ${className}`.trim()`
- `components/apps/AboutApp.tsx:94` `<ul>` — `space-y-2`
- `components/apps/AboutApp.tsx:96` `<li>` — `font-mondwest text-sm text-sub flex items-start gap-2`
- `components/apps/AuctionsApp/AuctionsHelpContent.tsx:123` `<ul>` — `space-y-3 font-mondwest text-sm text-sub list-disc list-inside`
- `components/apps/AuctionsApp/AuctionsHelpContent.tsx:126` `<ul>` — `ml-4 mt-1 space-y-1 list-disc`
- `components/apps/AuctionsApp/AuctionsHelpContent.tsx:134` `<ul>` — `ml-4 mt-1 space-y-1 list-disc`
- `components/apps/AuctionsApp/AuctionsHelpContent.tsx:141` `<ul>` — `ml-4 mt-1 space-y-1 list-disc`
- `components/apps/BrandAssetsApp.tsx:414` `<code>` — `font-mono text-xs flex-1 truncate`
- `components/apps/BrandAssetsApp.tsx:549` `<a>` — `block`
- `components/apps/BrandAssetsApp.tsx:726` `<p>` — `font-mondwest text-sm text-main leading-relaxed max-w-[42rem] mx-auto`
- `components/apps/ManifestoApp.tsx:132` `<ul>` — `space-y-1`
- `components/apps/SeekerApp/components/ChatTab.tsx:83` `<pre>` — `radimus-logo font-mono text-xs leading-tight text-accent overflow-hidden`
- `components/auctions/NFTCard.tsx:227` `<p>` — `styles.name`
- `components/auctions/NFTCard.tsx:232` `<p>` — `styles.collection`
- `components/auctions/StatCard.tsx:147` `<p>` — `font-joystix uppercase ${...} ${...}`
- `components/ui/DesignSystemTab.tsx:269` `<p>` — `mb-2`
- `components/ui/DesignSystemTab.tsx:275` `<p>` — `mb-2`
- `components/ui/DesignSystemTab.tsx:1061` `<p>` — `mb-4`
- `components/ui/DesignSystemTab.tsx:1076` `<p>` — `mb-4 w-full`

## Artifacts

- `ops/semantic-tag-class-audit.json` (raw findings)
- `ops/semantic-tag-class-audit-classified.json` (A/B/C classification)
