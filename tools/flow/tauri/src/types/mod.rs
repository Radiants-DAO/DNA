//! Types for RadFlow Tauri commands
//!
//! All types derive `Serialize` and `specta::Type` for TypeScript binding generation.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

/// Represents a component prop with its type and optional default value
#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct PropInfo {
    pub name: String,
    #[serde(rename = "type")]
    pub type_name: String,
    /// Whether the prop is required (no default value and not optional)
    pub required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub doc: Option<String>,
    /// Inferred control type for UI: "text", "number", "boolean", "select", "slot"
    #[serde(rename = "controlType", skip_serializing_if = "Option::is_none")]
    pub control_type: Option<String>,
    /// Options for select control (from union types)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Vec<String>>,
}

/// Represents a union type alias like `type ButtonVariant = 'primary' | 'secondary'`
#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct UnionTypeInfo {
    pub name: String,
    pub values: Vec<String>,
    pub line: u32,
}

/// Represents an extracted component with its metadata
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct ComponentInfo {
    pub name: String,
    pub file: String,
    pub line: u32,
    pub props: Vec<PropInfo>,
    #[serde(rename = "defaultExport")]
    pub default_export: bool,
    #[serde(rename = "unionTypes")]
    pub union_types: Vec<UnionTypeInfo>,
}

/// Violation severity levels
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ViolationSeverity {
    Warning,
    Error,
}

/// Represents a design system violation
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ViolationInfo {
    pub file: String,
    pub line: u32,
    pub column: u32,
    pub severity: ViolationSeverity,
    pub message: String,
    #[serde(rename = "codeSnippet")]
    pub code_snippet: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
}

/// Theme tokens extracted from @theme blocks
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct ThemeTokens {
    /// Tokens from @theme inline (internal reference, not exported as utilities)
    pub inline: HashMap<String, String>,
    /// Tokens from @theme (exported as Tailwind utilities)
    pub public: HashMap<String, String>,
}

/// Theme tokens bundle including both light and dark mode tokens
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct ThemeTokensBundle {
    /// Base tokens from tokens.css (light mode)
    pub base: ThemeTokens,
    /// Dark mode overrides from dark.css (if exists)
    pub dark: Option<HashMap<String, String>>,
}

/// Information about a detected theme package
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ThemeInfo {
    /// Theme package name (e.g., "radiants")
    pub name: String,
    /// Full package name (e.g., "@rdna/radiants")
    #[serde(rename = "packageName")]
    pub package_name: String,
    /// Absolute path to theme directory
    pub path: String,
    /// Path to tokens.css file
    #[serde(rename = "tokensCss")]
    pub tokens_css: String,
    /// Path to dark.css file (if exists)
    #[serde(rename = "darkCss")]
    pub dark_css: Option<String>,
    /// Path to components directory (if exists)
    #[serde(rename = "componentsDir")]
    pub components_dir: Option<String>,
    /// Path to assets directory (if exists)
    #[serde(rename = "assetsDir")]
    pub assets_dir: Option<String>,
}

/// Represents an icon asset (always SVG)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct IconAsset {
    /// Unique ID (hash of path)
    pub id: String,
    /// File name without extension
    pub name: String,
    /// Relative path from theme root
    pub path: String,
    /// Absolute path for loading
    #[serde(rename = "absolutePath")]
    pub absolute_path: String,
    /// File size in bytes
    pub size: f64,
    /// Inline SVG content (read at scan time)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

/// Represents a logo asset
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LogoAsset {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "absolutePath")]
    pub absolute_path: String,
    pub size: f64,
    /// Inline content: raw SVG string for .svg, base64 data URI for raster
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

/// Represents an image asset
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ImageAsset {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "absolutePath")]
    pub absolute_path: String,
    pub size: f64,
    /// File extension (png, jpg, svg, etc.)
    pub extension: String,
    /// Inline content: raw SVG string for .svg, base64 data URI for raster
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

/// Complete asset library from a theme
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct AssetLibrary {
    pub icons: Vec<IconAsset>,
    pub logos: Vec<LogoAsset>,
    pub images: Vec<ImageAsset>,
}

// ============================================================================
// Workspace / Monorepo Scanning
// ============================================================================

/// Entry representing a theme package discovered in a monorepo
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MonorepoThemeEntry {
    /// Short ID (e.g., "radiants")
    pub id: String,
    /// Display name from package.json
    pub name: String,
    /// Absolute path to theme directory
    pub path: String,
    /// Whether tokens.css exists
    #[serde(rename = "hasTokensCss")]
    pub has_tokens_css: bool,
    /// Whether dark.css exists
    #[serde(rename = "hasDarkCss")]
    pub has_dark_css: bool,
    /// Whether components/ directory exists
    #[serde(rename = "hasComponentsDir")]
    pub has_components_dir: bool,
    /// App IDs that depend on this theme
    pub apps: Vec<String>,
}

/// Entry representing an app discovered in a monorepo
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MonorepoAppEntry {
    /// Short ID (e.g., "rad-os")
    pub id: String,
    /// Display name from package.json
    pub name: String,
    /// Absolute path to app directory
    pub path: String,
    /// Theme IDs this app depends on (resolved from @rdna/* deps)
    #[serde(rename = "themeIds")]
    pub theme_ids: Vec<String>,
    /// Dev command (e.g., "next dev")
    #[serde(rename = "devCommand")]
    pub dev_command: String,
    /// Dev server port
    #[serde(rename = "devPort")]
    pub dev_port: u16,
    /// Preview route path (e.g., "/__component")
    #[serde(rename = "previewRoute")]
    pub preview_route: String,
}

/// Result of scanning a monorepo workspace
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct MonorepoScanResult {
    /// Discovered theme packages
    pub themes: Vec<MonorepoThemeEntry>,
    /// Discovered app packages
    pub apps: Vec<MonorepoAppEntry>,
    /// Non-fatal errors encountered during scanning
    pub errors: Vec<String>,
}

/// File event types for file watcher
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "path")]
pub enum FileEvent {
    Modified(String),
    Created(String),
    Removed(String),
}
