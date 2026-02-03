//! lightningcss POC: Parse @theme blocks from Tailwind v4 CSS
//!
//! Goal: Extract CSS custom properties from @theme and @theme inline blocks

use lightningcss::stylesheet::{ParserOptions, StyleSheet};
use lightningcss::rules::CssRule;
use lightningcss::properties::custom::TokenOrValue;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
struct ThemeTokens {
    /// Tokens from @theme inline (internal reference, not exported as utilities)
    inline: HashMap<String, String>,
    /// Tokens from @theme (exported as Tailwind utilities)
    public: HashMap<String, String>,
}

fn main() {
    let css_path = "fixtures/tokens.css";
    let css = fs::read_to_string(css_path).expect("Failed to read CSS file");

    println!("=== lightningcss POC: @theme Block Parsing ===\n");
    println!("Parsing: {}\n", css_path);

    // Parse the CSS
    let stylesheet = StyleSheet::parse(
        &css,
        ParserOptions::default(),
    );

    match stylesheet {
        Ok(sheet) => {
            println!("✅ CSS parsed successfully!\n");
            println!("Found {} top-level rules\n", sheet.rules.0.len());

            let mut tokens = ThemeTokens {
                inline: HashMap::new(),
                public: HashMap::new(),
            };

            // Walk all rules
            for (i, rule) in sheet.rules.0.iter().enumerate() {
                match rule {
                    CssRule::Unknown(unknown_rule) => {
                        let name = &unknown_rule.name;

                        // Check if it's a @theme rule
                        if name.as_ref() == "theme" {
                            // Check prelude for "inline" keyword
                            let prelude_str = format!("{:?}", unknown_rule.prelude);
                            let is_inline = prelude_str.contains("inline");

                            println!("Rule {}: @theme{}", i, if is_inline { " inline" } else { "" });

                            // The block is an Option<TokenList>
                            if let Some(ref block) = unknown_rule.block {
                                println!("  Block has {} tokens", block.0.len());

                                // Debug: print first 15 tokens to understand structure
                                println!("\n  First 15 tokens:");
                                for (j, token) in block.0.iter().take(15).enumerate() {
                                    println!("    [{}] {:?}", j, token);
                                }
                                println!();

                                // Parse tokens directly
                                // Pattern: DashedIdent("--name") -> Colon -> value tokens -> Semicolon
                                let mut current_prop: Option<String> = None;
                                let mut current_value: Vec<String> = Vec::new();

                                for token in &block.0 {
                                    match token {
                                        TokenOrValue::DashedIdent(ident) => {
                                            // Start of a new custom property
                                            // Save previous if exists
                                            if let Some(ref prop) = current_prop {
                                                let value = current_value.join(" ").trim().to_string();
                                                if !value.is_empty() {
                                                    if is_inline {
                                                        tokens.inline.insert(prop.clone(), value);
                                                    } else {
                                                        tokens.public.insert(prop.clone(), value);
                                                    }
                                                }
                                            }
                                            current_prop = Some(ident.0.to_string());
                                            current_value.clear();
                                        }
                                        TokenOrValue::Color(color) => {
                                            use lightningcss::values::color::CssColor;
                                            match color {
                                                CssColor::RGBA(rgba) => {
                                                    if rgba.alpha == 255 {
                                                        current_value.push(format!("#{:02x}{:02x}{:02x}", rgba.red, rgba.green, rgba.blue));
                                                    } else {
                                                        current_value.push(format!("rgba({}, {}, {}, {})", rgba.red, rgba.green, rgba.blue, rgba.alpha as f32 / 255.0));
                                                    }
                                                }
                                                _ => {
                                                    current_value.push(format!("{:?}", color));
                                                }
                                            }
                                        }
                                        TokenOrValue::Var(var) => {
                                            // CSS variable reference
                                            current_value.push(format!("var({})", var.name.ident.0));
                                        }
                                        TokenOrValue::Length(len) => {
                                            use lightningcss::values::length::LengthValue;
                                            match len {
                                                LengthValue::Px(v) => current_value.push(format!("{}px", v)),
                                                LengthValue::Rem(v) => current_value.push(format!("{}rem", v)),
                                                LengthValue::Em(v) => current_value.push(format!("{}em", v)),
                                                LengthValue::Vw(v) => current_value.push(format!("{}vw", v)),
                                                LengthValue::Vh(v) => current_value.push(format!("{}vh", v)),
                                                _ => current_value.push(format!("{:?}", len)),
                                            }
                                        }
                                        TokenOrValue::Function(func) => {
                                            // CSS function - just note the function name for now
                                            current_value.push(format!("{}(...)", func.name.0));
                                        }
                                        TokenOrValue::Token(t) => {
                                            let token_str = format!("{:?}", t);
                                            if token_str.contains("Semicolon") {
                                                // End of property, save it
                                                if let Some(ref prop) = current_prop {
                                                    let value = current_value.join(" ").trim().to_string();
                                                    if !value.is_empty() {
                                                        if is_inline {
                                                            tokens.inline.insert(prop.clone(), value);
                                                        } else {
                                                            tokens.public.insert(prop.clone(), value);
                                                        }
                                                    }
                                                }
                                                current_prop = None;
                                                current_value.clear();
                                            } else if current_prop.is_some() && !token_str.contains("Colon") && !token_str.contains("WhiteSpace") {
                                                // Other value tokens (idents, numbers, commas, etc)
                                                use lightningcss::properties::custom::Token as CssToken;
                                                match t {
                                                    CssToken::Ident(id) => current_value.push(id.to_string()),
                                                    CssToken::Number { value, .. } => current_value.push(format!("{}", value)),
                                                    CssToken::Dimension { value, unit, .. } => current_value.push(format!("{}{}", value, unit)),
                                                    CssToken::Percentage { unit_value, .. } => current_value.push(format!("{}%", unit_value * 100.0)),
                                                    CssToken::Hash(h) | CssToken::IDHash(h) => current_value.push(format!("#{}", h)),
                                                    CssToken::String(s) | CssToken::UnquotedUrl(s) => current_value.push(format!("\"{}\"", s)),
                                                    CssToken::Comma => current_value.push(",".to_string()),
                                                    _ => {} // Skip other tokens
                                                }
                                            }
                                        }
                                        _ => {
                                            // Handle other TokenOrValue variants
                                            if current_prop.is_some() {
                                                let val_str = format!("{:?}", token);
                                                current_value.push(val_str);
                                            }
                                        }
                                    }
                                }

                                // Don't forget the last property if file doesn't end with semicolon
                                if let Some(ref prop) = current_prop {
                                    let value = current_value.join(" ").trim().to_string();
                                    if !value.is_empty() {
                                        if is_inline {
                                            tokens.inline.insert(prop.clone(), value);
                                        } else {
                                            tokens.public.insert(prop.clone(), value);
                                        }
                                    }
                                }
                            } else {
                                println!("  Block is empty");
                            }
                        }
                    }
                    CssRule::Style(_) => {
                        // Skip style rules for now
                    }
                    _ => {}
                }
            }

            println!("\n=== Summary ===");
            println!("Inline tokens found: {}", tokens.inline.len());
            println!("Public tokens found: {}", tokens.public.len());

            // Show some examples
            println!("\n=== Sample Inline Tokens ===");
            for (k, v) in tokens.inline.iter().take(5) {
                println!("  {}: {}", k, v);
            }

            println!("\n=== Sample Public Tokens ===");
            for (k, v) in tokens.public.iter().take(5) {
                println!("  {}: {}", k, v);
            }

            // Save to file
            let json = serde_json::to_string_pretty(&tokens).unwrap();
            fs::write("output.json", &json).expect("Failed to write output");
            println!("\n✅ Full output saved to output.json");
        }
        Err(e) => {
            println!("❌ Failed to parse CSS: {:?}", e);
        }
    }
}
