# lightningcss POC: Tailwind v4 @theme Parsing

**Status: PASS**

## Goal

Validate that lightningcss can parse Tailwind v4's non-standard `@theme` and `@theme inline` blocks to extract design tokens.

## Results

| Metric | Result |
|--------|--------|
| Parse @theme blocks | YES |
| Distinguish @theme vs @theme inline | YES |
| Extract inline tokens | 35 tokens |
| Extract public tokens | 58 tokens |
| Type-safe value access | YES |

## Key Findings

1. **lightningcss parses @theme as `CssRule::Unknown`** - Non-standard at-rules are captured as "Unknown" rules with the at-rule name, prelude (for "inline" keyword), and token block.

2. **Tokens are strongly typed** - Values are parsed into proper types:
   - `TokenOrValue::Color(CssColor::RGBA(...))` for colors
   - `TokenOrValue::Length(LengthValue::Px/Rem/Em...)` for dimensions
   - `TokenOrValue::Var(Variable {...})` for CSS variable references
   - `TokenOrValue::DashedIdent(...)` for custom property names
   - `TokenOrValue::Function(...)` for CSS functions

3. **Value extraction is straightforward** - Iterate through the token list, track property names (DashedIdent), collect values until Semicolon.

## Sample Output

```json
{
  "inline": {
    "--color-black": "#0f0e0c",
    "--color-primary": "var(--color-sun-yellow)",
    "--font-joystix": "\"Joystix Monospace\" , monospace"
  },
  "public": {
    "--font-size-sm": "0.875rem",
    "--shadow-btn": "0 1px 0 0 var(--color-black)",
    "--breakpoint-lg": "1024px"
  }
}
```

## Usage

```bash
cd research/pocs/lightningcss-poc
cargo run
```

Reads `fixtures/tokens.css` and outputs `output.json`.

## Code Highlights

```rust
// Parse CSS with lightningcss
let stylesheet = StyleSheet::parse(&css, ParserOptions::default())?;

// Find @theme blocks (parsed as Unknown rules)
for rule in &stylesheet.rules.0 {
    if let CssRule::Unknown(unknown_rule) = rule {
        if unknown_rule.name.as_ref() == "theme" {
            // Check prelude for "inline" keyword
            let is_inline = format!("{:?}", unknown_rule.prelude).contains("inline");

            // Extract tokens from block
            if let Some(ref block) = unknown_rule.block {
                for token in &block.0 {
                    match token {
                        TokenOrValue::DashedIdent(ident) => { /* property name */ }
                        TokenOrValue::Color(color) => { /* color value */ }
                        TokenOrValue::Var(var) => { /* var reference */ }
                        TokenOrValue::Length(len) => { /* dimension */ }
                        // ...
                    }
                }
            }
        }
    }
}
```

## Implications for RadFlow Tauri

This POC de-risks the CSS parsing core:

1. **Rust backend can parse Tailwind v4 CSS** - No need for Node.js/PostCSS
2. **Typed value access** - Colors, lengths, vars are structured, not strings
3. **Fast parsing** - lightningcss is built for speed (used by Parcel bundler)
4. **Foundation for token editing** - Can reconstruct CSS from modified tokens

## Next Steps

- [ ] fn-1.2: SWC POC for TSX parsing
- [ ] fn-1.4: notify POC for file watching
- [ ] fn-1.5: tantivy POC for search indexing

## Dependencies

```toml
[dependencies]
lightningcss = "1.0.0-alpha.68"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

Requires Rust 1.70+ (tested with 1.92.0).
