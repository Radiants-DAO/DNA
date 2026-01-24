//! CSS token parsing commands using lightningcss
//!
//! Extracts design tokens from @theme blocks in Tailwind v4 CSS files.

use crate::types::ThemeTokens;
use lightningcss::properties::custom::TokenOrValue;
use lightningcss::rules::CssRule;
use lightningcss::stylesheet::{ParserOptions, StyleSheet};
use std::collections::HashMap;
use std::path::Path;

/// Parse CSS file and extract theme tokens from @theme blocks
fn parse_theme_tokens(css: &str) -> Result<ThemeTokens, String> {
    let stylesheet =
        StyleSheet::parse(css, ParserOptions::default()).map_err(|e| format!("CSS parse error: {:?}", e))?;

    let mut tokens = ThemeTokens {
        inline: HashMap::new(),
        public: HashMap::new(),
    };

    for rule in &stylesheet.rules.0 {
        if let CssRule::Unknown(unknown_rule) = rule {
            let name = &unknown_rule.name;

            // Check if it's a @theme rule
            if name.as_ref() == "theme" {
                // Check prelude for "inline" keyword
                let prelude_str = format!("{:?}", unknown_rule.prelude);
                let is_inline = prelude_str.contains("inline");

                if let Some(ref block) = unknown_rule.block {
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
                                            current_value.push(format!(
                                                "#{:02x}{:02x}{:02x}",
                                                rgba.red, rgba.green, rgba.blue
                                            ));
                                        } else {
                                            current_value.push(format!(
                                                "rgba({}, {}, {}, {})",
                                                rgba.red,
                                                rgba.green,
                                                rgba.blue,
                                                rgba.alpha as f32 / 255.0
                                            ));
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
                                } else if current_prop.is_some()
                                    && !token_str.contains("Colon")
                                    && !token_str.contains("WhiteSpace")
                                {
                                    // Other value tokens (idents, numbers, commas, etc)
                                    use lightningcss::properties::custom::Token as CssToken;
                                    match t {
                                        CssToken::Ident(id) => current_value.push(id.to_string()),
                                        CssToken::Number { value, .. } => {
                                            current_value.push(format!("{}", value))
                                        }
                                        CssToken::Dimension { value, unit, .. } => {
                                            current_value.push(format!("{}{}", value, unit))
                                        }
                                        CssToken::Percentage { unit_value, .. } => {
                                            current_value.push(format!("{}%", unit_value * 100.0))
                                        }
                                        CssToken::Hash(h) | CssToken::IDHash(h) => {
                                            current_value.push(format!("#{}", h))
                                        }
                                        CssToken::String(s) | CssToken::UnquotedUrl(s) => {
                                            current_value.push(format!("\"{}\"", s))
                                        }
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
                }
            }
        }
    }

    Ok(tokens)
}

/// Parse a CSS file and extract theme tokens from @theme blocks
#[tauri::command]
#[specta::specta]
pub fn parse_tokens(css_path: String) -> Result<ThemeTokens, String> {
    let path = Path::new(&css_path);

    if !path.exists() {
        return Err("CSS file does not exist".to_string());
    }

    let css = std::fs::read_to_string(path).map_err(|e| format!("Failed to read CSS file: {}", e))?;

    parse_theme_tokens(&css)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_theme_tokens() {
        let css = r#"
@theme inline {
  --color-base: #000000;
  --spacing-unit: 4px;
}

@theme {
  --color-primary: #0066cc;
  --color-secondary: #ff6600;
  --font-size-base: 16px;
}
"#;

        let tokens = parse_theme_tokens(css).unwrap();

        // Check inline tokens
        assert!(tokens.inline.contains_key("--color-base"));
        assert!(tokens.inline.contains_key("--spacing-unit"));

        // Check public tokens
        assert!(tokens.public.contains_key("--color-primary"));
        assert!(tokens.public.contains_key("--color-secondary"));
        assert!(tokens.public.contains_key("--font-size-base"));
    }

    #[test]
    fn test_parse_empty_css() {
        let css = "/* empty file */";
        let tokens = parse_theme_tokens(css).unwrap();
        assert!(tokens.inline.is_empty());
        assert!(tokens.public.is_empty());
    }

    #[test]
    fn test_parse_no_theme_blocks() {
        let css = r#"
.button {
  background: blue;
}
"#;
        let tokens = parse_theme_tokens(css).unwrap();
        assert!(tokens.inline.is_empty());
        assert!(tokens.public.is_empty());
    }
}
