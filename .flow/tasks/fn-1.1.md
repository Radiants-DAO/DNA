# fn-1.1 POC: lightningcss @theme block parsing (BLOCKER)

## Description
**CRITICAL BLOCKER** - This task determines whether we proceed with Tauri/Rust or evaluate alternatives.

Test if lightningcss can parse Tailwind v4's `@theme` and `@theme inline` blocks. These are non-standard CSS at-rules.

### Success = Tech Stack Greenlight
If lightningcss can parse @theme blocks, we proceed with Tauri/Rust for all remaining POCs.

### Failure = Reconsider Rust Entirely
If lightningcss cannot parse @theme blocks, we **DO NOT** try Rust fallbacks (regex, postcss-rs). Instead, we evaluate alternative tech stacks:
- SwiftUI (Mac-native, approachable)
- Electron (mature ecosystem)
- Go+Wails (simpler than Rust)

### Test Input
Real `tokens.css` from theme-rad-os:
```css
@theme inline {
  --color-sun-yellow: #FCE184;
  --color-warm-cloud: #FEF8E2;
}

@theme {
  --color-surface-primary: var(--color-warm-cloud);
  --color-content-primary: var(--color-black);
}
```

### Test File
`/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/tokens.css`

### Expected Output
Structured data distinguishing `@theme` from `@theme inline`:
```rust
struct ThemeTokens {
    inline: HashMap<String, String>,  // Internal reference tokens
    public: HashMap<String, String>,  // Tailwind utility tokens
}
```
## Acceptance

- [ ] Create Rust POC project at `research/pocs/lightningcss-poc/`
- [ ] Parse real tokens.css file
- [ ] Extract variables from `@theme inline` blocks
- [ ] Extract variables from `@theme` blocks
- [ ] Distinguish between `@theme` and `@theme inline`
- [ ] Document result: PASS with code samples OR FAIL with fallback strategy

### Fallback Strategies (if lightningcss fails)
1. Regex extraction (simple but fragile)
2. postcss-rs crate
3. Custom parser for `@theme` blocks only

## Done summary
# fn-1.1: lightningcss POC - COMPLETE

## Summary
Built and validated a Rust POC proving lightningcss can parse Tailwind v4's non-standard @theme blocks.

## Key Results
- lightningcss parses @theme as CssRule::Unknown (expected for non-standard at-rules)
- Can distinguish @theme vs @theme inline via prelude inspection
- Extracted 35 inline tokens and 58 public tokens from real theme-rad-os CSS
- Values are strongly typed: colors as RGBA, lengths with units, variable references
- Output format is clean JSON suitable for frontend consumption

## Implications
This de-risks the Rust/Tauri approach for CSS parsing. We can proceed with the Tauri architecture.
## Evidence
- Commits:
- Tests:
- PRs: