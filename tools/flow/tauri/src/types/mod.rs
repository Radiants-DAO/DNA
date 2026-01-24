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

/// File event types for file watcher
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "path")]
pub enum FileEvent {
    Modified(String),
    Created(String),
    Removed(String),
}
