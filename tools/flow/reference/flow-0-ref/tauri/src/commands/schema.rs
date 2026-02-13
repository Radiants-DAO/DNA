//! Schema scanning commands
//!
//! Provides filesystem operations to scan theme packages for component schemas
//! (*.schema.json) and DNA configuration files (*.dna.json).

use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::path::Path;
use std::time::Instant;

const LIMITS: Limits = Limits {
    max_results: 500,
    max_search_depth: 10,
};

struct Limits {
    max_results: usize,
    max_search_depth: usize,
}

/// Example usage from a component schema
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SchemaExample {
    pub name: String,
    pub code: String,
}

/// Parsed component schema from *.schema.json files
/// Note: props and slots are stored as JSON strings for TypeScript compatibility
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ComponentSchema {
    pub name: String,
    pub description: String,
    pub file_path: String,
    /// JSON string containing prop definitions
    pub props_json: String,
    /// JSON string containing slot definitions
    pub slots_json: String,
    pub examples: Vec<SchemaExample>,
    pub subcomponents: Option<Vec<String>>,
}

/// Parsed DNA configuration from *.dna.json files
/// Note: token_bindings and states are stored as JSON strings for TypeScript compatibility
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DnaConfig {
    pub component: String,
    pub description: Option<String>,
    pub file_path: String,
    /// JSON string containing token binding definitions
    pub token_bindings_json: String,
    /// JSON string containing state definitions
    pub states_json: Option<String>,
}

/// Results from scanning a theme package for schemas
#[derive(Debug, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScanSchemasResult {
    pub schemas: Vec<ComponentSchema>,
    pub dna_configs: Vec<DnaConfig>,
    pub total_schemas: u32,
    pub total_dna_configs: u32,
    pub scan_time_ms: f64,
}

/// Search match for fuzzy schema search
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SchemaSearchMatch {
    pub schema: ComponentSchema,
    pub score: f64,
    pub matched_indices: Vec<u32>,
}

/// Results from searching schemas
#[derive(Debug, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SchemaSearchResults {
    pub query: String,
    pub results: Vec<SchemaSearchMatch>,
    pub total_matches: u32,
    pub search_time_ms: f64,
}

/// Raw schema file structure for deserialization
#[derive(Debug, Deserialize)]
struct RawSchema {
    name: String,
    description: Option<String>,
    props: Option<serde_json::Value>,
    slots: Option<serde_json::Value>,
    examples: Option<Vec<RawExample>>,
    subcomponents: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct RawExample {
    name: String,
    code: String,
}

/// Raw DNA config structure for deserialization
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawDnaConfig {
    component: String,
    description: Option<String>,
    token_bindings: Option<serde_json::Value>,
    states: Option<serde_json::Value>,
}

fn parse_schema_file(path: &Path) -> Option<ComponentSchema> {
    let content = fs::read_to_string(path).ok()?;
    let raw: RawSchema = serde_json::from_str(&content).ok()?;

    let examples = raw
        .examples
        .unwrap_or_default()
        .into_iter()
        .map(|e| SchemaExample {
            name: e.name,
            code: e.code,
        })
        .collect();

    let props_json = raw
        .props
        .map(|v| serde_json::to_string(&v).unwrap_or_else(|_| "{}".to_string()))
        .unwrap_or_else(|| "{}".to_string());

    let slots_json = raw
        .slots
        .map(|v| serde_json::to_string(&v).unwrap_or_else(|_| "{}".to_string()))
        .unwrap_or_else(|| "{}".to_string());

    Some(ComponentSchema {
        name: raw.name,
        description: raw.description.unwrap_or_default(),
        file_path: path.to_string_lossy().to_string(),
        props_json,
        slots_json,
        examples,
        subcomponents: raw.subcomponents,
    })
}

fn parse_dna_file(path: &Path) -> Option<DnaConfig> {
    let content = fs::read_to_string(path).ok()?;
    let raw: RawDnaConfig = serde_json::from_str(&content).ok()?;

    let token_bindings_json = raw
        .token_bindings
        .map(|v| serde_json::to_string(&v).unwrap_or_else(|_| "{}".to_string()))
        .unwrap_or_else(|| "{}".to_string());

    let states_json = raw
        .states
        .map(|v| serde_json::to_string(&v).unwrap_or_else(|_| "{}".to_string()));

    Some(DnaConfig {
        component: raw.component,
        description: raw.description,
        file_path: path.to_string_lossy().to_string(),
        token_bindings_json,
        states_json,
    })
}

fn scan_recursive(
    dir: &Path,
    depth: usize,
    schemas: &mut Vec<ComponentSchema>,
    dna_configs: &mut Vec<DnaConfig>,
) {
    if depth > LIMITS.max_search_depth
        || schemas.len() >= LIMITS.max_results
        || dna_configs.len() >= LIMITS.max_results
    {
        return;
    }

    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        // Skip hidden directories and common non-component directories
        if name.starts_with('.') || name == "node_modules" || name == "dist" || name == "build" {
            continue;
        }

        if path.is_dir() {
            scan_recursive(&path, depth + 1, schemas, dna_configs);
        } else if name.ends_with(".schema.json") {
            if let Some(schema) = parse_schema_file(&path) {
                schemas.push(schema);
            }
        } else if name.ends_with(".dna.json") {
            if let Some(dna) = parse_dna_file(&path) {
                dna_configs.push(dna);
            }
        }
    }
}

/// Scan a theme package directory for component schemas and DNA configs
#[tauri::command]
#[specta::specta]
pub fn scan_schemas(path: String) -> Result<ScanSchemasResult, String> {
    let start = Instant::now();
    let root_path = Path::new(&path);

    if !root_path.exists() {
        return Err(format!("Path not found: {}", path));
    }

    if !root_path.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let mut schemas = Vec::new();
    let mut dna_configs = Vec::new();

    scan_recursive(root_path, 0, &mut schemas, &mut dna_configs);

    // Sort by component name
    schemas.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    dna_configs.sort_by(|a, b| a.component.to_lowercase().cmp(&b.component.to_lowercase()));

    let total_schemas = schemas.len() as u32;
    let total_dna_configs = dna_configs.len() as u32;

    Ok(ScanSchemasResult {
        schemas,
        dna_configs,
        total_schemas,
        total_dna_configs,
        scan_time_ms: start.elapsed().as_millis() as f64,
    })
}

/// Fuzzy match algorithm for schema search (same as spatial.rs)
fn fuzzy_match(query: &str, name: &str) -> Option<(f64, Vec<u32>)> {
    let query_lower = query.to_lowercase();
    let name_lower = name.to_lowercase();
    let query_chars: Vec<char> = query_lower.chars().collect();
    let name_chars: Vec<char> = name_lower.chars().collect();

    if query_chars.is_empty() {
        return None;
    }

    let mut matched_indices: Vec<u32> = Vec::new();
    let mut query_idx = 0;

    for (name_idx, &name_char) in name_chars.iter().enumerate() {
        if query_idx < query_chars.len() && name_char == query_chars[query_idx] {
            matched_indices.push(name_idx as u32);
            query_idx += 1;
        }
    }

    if query_idx != query_chars.len() {
        return None;
    }

    // Calculate score
    let mut score = 100.0;

    // Bonus for exact match
    if name_lower == query_lower {
        score += 50.0;
    }

    // Bonus for prefix match
    if name_lower.starts_with(&query_lower) {
        score += 30.0;
    }

    // Penalty for gaps between matches
    for i in 1..matched_indices.len() {
        let gap = matched_indices[i] - matched_indices[i - 1] - 1;
        score -= gap as f64 * 2.0;
    }

    // Penalty for matches later in the string
    if !matched_indices.is_empty() {
        score -= matched_indices[0] as f64 * 0.5;
    }

    // Normalize by name length
    score -= (name.len() as f64 - query.len() as f64).abs() * 0.5;

    Some((score.max(0.0), matched_indices))
}

/// Search schemas by component name with fuzzy matching
#[tauri::command]
#[specta::specta]
pub fn search_schemas(
    path: String,
    query: String,
    max_results: u32,
) -> Result<SchemaSearchResults, String> {
    let start = Instant::now();

    // First scan all schemas
    let scan_result = scan_schemas(path)?;

    if query.trim().is_empty() {
        return Ok(SchemaSearchResults {
            query,
            results: vec![],
            total_matches: 0,
            search_time_ms: start.elapsed().as_millis() as f64,
        });
    }

    // Apply fuzzy matching to schemas
    let mut results: Vec<SchemaSearchMatch> = scan_result
        .schemas
        .into_par_iter()
        .filter_map(|schema| {
            fuzzy_match(&query, &schema.name).map(|(score, matched_indices)| SchemaSearchMatch {
                schema,
                score,
                matched_indices,
            })
        })
        .collect();

    // Sort by score descending
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

    let total_matches = results.len() as u32;
    let limit = (max_results as usize).min(LIMITS.max_results);
    results.truncate(limit);

    Ok(SchemaSearchResults {
        query,
        results,
        total_matches,
        search_time_ms: start.elapsed().as_millis() as f64,
    })
}

/// Get a single schema by component name
#[tauri::command]
#[specta::specta]
pub fn get_schema(path: String, component_name: String) -> Result<Option<ComponentSchema>, String> {
    let scan_result = scan_schemas(path)?;

    let schema = scan_result
        .schemas
        .into_iter()
        .find(|s| s.name.to_lowercase() == component_name.to_lowercase());

    Ok(schema)
}

/// Get a single DNA config by component name
#[tauri::command]
#[specta::specta]
pub fn get_dna_config(path: String, component_name: String) -> Result<Option<DnaConfig>, String> {
    let scan_result = scan_schemas(path)?;

    let dna = scan_result
        .dna_configs
        .into_iter()
        .find(|d| d.component.to_lowercase() == component_name.to_lowercase());

    Ok(dna)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fuzzy_match() {
        // Exact match
        let (score, indices) = fuzzy_match("button", "button").unwrap();
        assert!(score > 100.0);
        assert_eq!(indices, vec![0, 1, 2, 3, 4, 5]);

        // Prefix match
        let (score, indices) = fuzzy_match("but", "button").unwrap();
        assert!(score > 100.0);
        assert_eq!(indices, vec![0, 1, 2]);

        // Fuzzy match
        let (score, indices) = fuzzy_match("btn", "button").unwrap();
        assert!(score > 0.0);
        assert_eq!(indices, vec![0, 2, 5]);

        // No match
        assert!(fuzzy_match("xyz", "button").is_none());
    }

    #[test]
    fn test_fuzzy_match_case_insensitive() {
        let (score1, _) = fuzzy_match("Button", "button").unwrap();
        let (score2, _) = fuzzy_match("button", "Button").unwrap();
        assert!(score1 > 0.0);
        assert!(score2 > 0.0);
    }
}
