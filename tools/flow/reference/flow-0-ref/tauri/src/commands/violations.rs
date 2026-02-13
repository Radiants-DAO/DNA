//! Violation detection for design system compliance
//!
//! Detects hardcoded colors, inline styles, and non-semantic tokens in TSX files.

use crate::types::{ViolationInfo, ViolationSeverity};
use regex::Regex;
use std::path::Path;

/// Violation detector for TSX files
pub struct ViolationDetector {
    // Regex for detecting inline styles: style={{...}}
    inline_style_regex: Regex,
    // Regex for detecting hardcoded colors in Tailwind: text-[#...], bg-[#...], etc.
    hardcoded_color_regex: Regex,
    // Regex for detecting arbitrary values: p-[13px], gap-[7px], etc.
    arbitrary_value_regex: Regex,
    // Regex for detecting color hex codes
    hex_color_regex: Regex,
}

impl ViolationDetector {
    pub fn new() -> Self {
        Self {
            inline_style_regex: Regex::new(r#"style=\{\{[^}]+\}\}"#).unwrap(),
            hardcoded_color_regex: Regex::new(
                r#"(?:text|bg|border|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]"#,
            )
            .unwrap(),
            arbitrary_value_regex: Regex::new(
                r#"(?:p|m|gap|w|h|top|left|right|bottom|inset)-\[\d+(?:px|rem|em|%)\]"#,
            )
            .unwrap(),
            hex_color_regex: Regex::new(r#"['"]#[0-9a-fA-F]{3,8}['"]"#).unwrap(),
        }
    }

    /// Detect violations in a TSX file
    pub fn detect_file(&self, path: &Path) -> Result<Vec<ViolationInfo>, String> {
        let source = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let file_name = path.to_string_lossy().to_string();
        self.detect_source(&source, &file_name)
    }

    /// Detect violations in TSX source code
    pub fn detect_source(&self, source: &str, file_name: &str) -> Result<Vec<ViolationInfo>, String> {
        let mut violations = Vec::new();

        for (line_idx, line) in source.lines().enumerate() {
            let line_number = (line_idx + 1) as u32;

            // Check for inline styles (warning)
            for m in self.inline_style_regex.find_iter(line) {
                violations.push(ViolationInfo {
                    file: file_name.to_string(),
                    line: line_number,
                    column: m.start() as u32,
                    severity: ViolationSeverity::Warning,
                    message: "Inline style detected".to_string(),
                    code_snippet: m.as_str().to_string(),
                    suggestion: Some("Use className with Tailwind utilities instead".to_string()),
                });
            }

            // Check for hardcoded colors in Tailwind (error)
            for m in self.hardcoded_color_regex.find_iter(line) {
                violations.push(ViolationInfo {
                    file: file_name.to_string(),
                    line: line_number,
                    column: m.start() as u32,
                    severity: ViolationSeverity::Error,
                    message: "Hardcoded color value".to_string(),
                    code_snippet: m.as_str().to_string(),
                    suggestion: Some("Use a semantic color token instead".to_string()),
                });
            }

            // Check for arbitrary spacing/sizing values (error)
            for m in self.arbitrary_value_regex.find_iter(line) {
                violations.push(ViolationInfo {
                    file: file_name.to_string(),
                    line: line_number,
                    column: m.start() as u32,
                    severity: ViolationSeverity::Error,
                    message: "Non-token spacing value".to_string(),
                    code_snippet: m.as_str().to_string(),
                    suggestion: Some("Use a spacing token from the design system".to_string()),
                });
            }

            // Check for hex colors in style objects (warning)
            if line.contains("style=") {
                for m in self.hex_color_regex.find_iter(line) {
                    violations.push(ViolationInfo {
                        file: file_name.to_string(),
                        line: line_number,
                        column: m.start() as u32,
                        severity: ViolationSeverity::Warning,
                        message: "Hardcoded color in style".to_string(),
                        code_snippet: m.as_str().to_string(),
                        suggestion: Some("Use CSS variables or Tailwind tokens".to_string()),
                    });
                }
            }
        }

        Ok(violations)
    }

    /// Scan a directory for violations
    pub fn scan_directory(&self, dir: &Path) -> Result<Vec<ViolationInfo>, String> {
        let mut all_violations = Vec::new();

        if !dir.exists() || !dir.is_dir() {
            return Err("Path does not exist or is not a directory".to_string());
        }

        self.scan_directory_recursive(dir, &mut all_violations)?;

        Ok(all_violations)
    }

    fn scan_directory_recursive(
        &self,
        dir: &Path,
        violations: &mut Vec<ViolationInfo>,
    ) -> Result<(), String> {
        let entries =
            std::fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in entries.flatten() {
            let path = entry.path();

            if path.is_dir() {
                // Skip node_modules and hidden directories
                let dir_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if dir_name.starts_with('.') || dir_name == "node_modules" {
                    continue;
                }
                self.scan_directory_recursive(&path, violations)?;
            } else if let Some(ext) = path.extension() {
                if ext == "tsx" {
                    match self.detect_file(&path) {
                        Ok(mut file_violations) => violations.append(&mut file_violations),
                        Err(_) => {
                            // Skip files that fail to parse
                            continue;
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

impl Default for ViolationDetector {
    fn default() -> Self {
        Self::new()
    }
}

/// Scan a directory for design system violations
#[tauri::command]
#[specta::specta]
pub fn scan_violations(dir: String) -> Result<Vec<ViolationInfo>, String> {
    let detector = ViolationDetector::new();
    detector.scan_directory(Path::new(&dir))
}

/// Detect violations in a single file
#[tauri::command]
#[specta::specta]
pub fn detect_violations(path: String) -> Result<Vec<ViolationInfo>, String> {
    let detector = ViolationDetector::new();
    detector.detect_file(Path::new(&path))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_inline_style() {
        let source = r#"
export function Card() {
  return <div style={{color: 'red', margin: 10}}>Hello</div>;
}
"#;

        let detector = ViolationDetector::new();
        let violations = detector.detect_source(source, "Card.tsx").unwrap();

        assert!(!violations.is_empty());
        assert!(violations
            .iter()
            .any(|v| v.message.contains("Inline style")));
    }

    #[test]
    fn test_detect_hardcoded_color() {
        let source = r#"
export function Button() {
  return <button className="text-[#FF0000] bg-[#00FF00]">Click</button>;
}
"#;

        let detector = ViolationDetector::new();
        let violations = detector.detect_source(source, "Button.tsx").unwrap();

        assert_eq!(violations.len(), 2);
        assert!(violations
            .iter()
            .all(|v| v.message.contains("Hardcoded color")));
    }

    #[test]
    fn test_detect_arbitrary_spacing() {
        let source = r#"
export function Card() {
  return <div className="p-[13px] gap-[7px] m-[20px]">Content</div>;
}
"#;

        let detector = ViolationDetector::new();
        let violations = detector.detect_source(source, "Card.tsx").unwrap();

        assert_eq!(violations.len(), 3);
        assert!(violations
            .iter()
            .all(|v| v.message.contains("Non-token spacing")));
    }

    #[test]
    fn test_no_violations() {
        let source = r#"
export function Button({ variant = 'primary' }) {
  return <button className="text-accent bg-surface p-4 gap-2">Click</button>;
}
"#;

        let detector = ViolationDetector::new();
        let violations = detector.detect_source(source, "Button.tsx").unwrap();

        assert!(violations.is_empty());
    }
}
