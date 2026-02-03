//! Spatial file viewer commands
//!
//! Provides filesystem operations for the spatial file browser feature.

use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::Path;
use std::time::Instant;

const AUTO_COLLAPSE_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "__pycache__",
    "target",
    ".turbo",
    ".cache",
    "coverage",
    ".nyc_output",
    "vendor",
    ".venv",
    "venv",
];

const LIMITS: Limits = Limits {
    max_children: 1000,
    max_search_results: 500,
    max_search_depth: 10,
};

struct Limits {
    max_children: usize,
    max_search_results: usize,
    max_search_depth: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum NodeType {
    File,
    Directory,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub id: String,
    pub name: String,
    pub path: String,
    pub node_type: NodeType,
    pub extension: Option<String>,
    pub size: f64,
    pub size_formatted: String,
    pub total_size: Option<f64>,
    pub child_count: Option<u32>,
    pub modified: String,
    pub is_hidden: bool,
    pub is_readable: bool,
    pub is_auto_collapsed: bool,
}

#[derive(Debug, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryContents {
    pub path: String,
    pub children: Vec<FileNode>,
    pub metadata: DirectoryMetadata,
}

#[derive(Debug, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryMetadata {
    pub total_files: u32,
    pub total_folders: u32,
    pub total_size: f64,
    pub read_time_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub node: FileNode,
    pub score: f64,
    pub matched_indices: Vec<u32>,
}

#[derive(Debug, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SearchResults {
    pub query: String,
    pub results: Vec<SearchMatch>,
    pub total_matches: u32,
    pub truncated: bool,
    pub search_time_ms: f64,
}

fn hash_path(path: &str) -> String {
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

fn format_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

fn is_hidden(name: &str) -> bool {
    name.starts_with('.')
}

fn is_auto_collapsed(name: &str) -> bool {
    AUTO_COLLAPSE_DIRS.contains(&name)
}

fn read_entry(path: &Path, show_hidden: bool) -> Option<FileNode> {
    let name = path.file_name()?.to_string_lossy().to_string();

    if !show_hidden && is_hidden(&name) {
        return None;
    }

    let metadata = match fs::metadata(path) {
        Ok(m) => m,
        Err(_) => return None,
    };

    let path_str = path.to_string_lossy().to_string();
    let is_dir = metadata.is_dir();
    let size_bytes = if is_dir { 0 } else { metadata.len() };
    let size = size_bytes as f64;

    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| {
            chrono::DateTime::from_timestamp(d.as_secs() as i64, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default()
        })
        .unwrap_or_default();

    let extension = if is_dir {
        None
    } else {
        path.extension().map(|e| e.to_string_lossy().to_string())
    };

    let (child_count, total_size) = if is_dir {
        let count = fs::read_dir(path).map(|rd| rd.count() as u32).ok();
        (count, None) // Don't calculate total_size for performance
    } else {
        (None, None)
    };

    Some(FileNode {
        id: hash_path(&path_str),
        name: name.clone(),
        path: path_str,
        node_type: if is_dir {
            NodeType::Directory
        } else {
            NodeType::File
        },
        extension,
        size,
        size_formatted: format_size(size_bytes),
        total_size,
        child_count,
        modified,
        is_hidden: is_hidden(&name),
        is_readable: metadata.permissions().readonly() == false,
        is_auto_collapsed: is_dir && is_auto_collapsed(&name),
    })
}

fn sort_entries(entries: &mut [FileNode]) {
    entries.sort_by(|a, b| {
        // Directories first
        match (&a.node_type, &b.node_type) {
            (NodeType::Directory, NodeType::File) => std::cmp::Ordering::Less,
            (NodeType::File, NodeType::Directory) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
}

#[tauri::command]
#[specta::specta]
pub fn scan_directory(path: String, show_hidden: bool) -> Result<DirectoryContents, String> {
    let start = Instant::now();
    let dir_path = Path::new(&path);

    if !dir_path.exists() {
        return Err(format!("Path not found: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let entries: Vec<_> = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?
        .filter_map(|entry| entry.ok())
        .collect();

    let mut children: Vec<FileNode> = entries
        .par_iter()
        .filter_map(|entry| read_entry(&entry.path(), show_hidden))
        .collect();

    children.truncate(LIMITS.max_children);

    sort_entries(&mut children);

    let total_files = children
        .iter()
        .filter(|n| matches!(n.node_type, NodeType::File))
        .count() as u32;
    let total_folders = children
        .iter()
        .filter(|n| matches!(n.node_type, NodeType::Directory))
        .count() as u32;
    let total_size = children.iter().map(|n| n.size).sum();

    Ok(DirectoryContents {
        path,
        children,
        metadata: DirectoryMetadata {
            total_files,
            total_folders,
            total_size,
            read_time_ms: start.elapsed().as_millis() as f64,
        },
    })
}

#[tauri::command]
#[specta::specta]
pub fn expand_folder(path: String, show_hidden: bool) -> Result<Vec<FileNode>, String> {
    let dir_path = Path::new(&path);

    if !dir_path.exists() {
        return Err(format!("Path not found: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let entries: Vec<_> = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?
        .filter_map(|entry| entry.ok())
        .collect();

    let mut children: Vec<FileNode> = entries
        .par_iter()
        .filter_map(|entry| read_entry(&entry.path(), show_hidden))
        .collect();

    children.truncate(LIMITS.max_children);

    sort_entries(&mut children);

    Ok(children)
}

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

fn search_recursive(
    dir: &Path,
    query: &str,
    show_hidden: bool,
    depth: usize,
    results: &mut Vec<SearchMatch>,
) {
    if depth > LIMITS.max_search_depth || results.len() >= LIMITS.max_search_results {
        return;
    }

    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.filter_map(|e| e.ok()) {
        if results.len() >= LIMITS.max_search_results {
            break;
        }

        let path = entry.path();
        let Some(node) = read_entry(&path, show_hidden) else {
            continue;
        };

        // Check for match
        if let Some((score, matched_indices)) = fuzzy_match(query, &node.name) {
            results.push(SearchMatch {
                node: node.clone(),
                score,
                matched_indices,
            });
        }

        // Recurse into directories
        if matches!(node.node_type, NodeType::Directory) && !node.is_auto_collapsed {
            search_recursive(&path, query, show_hidden, depth + 1, results);
        }
    }
}

#[tauri::command]
#[specta::specta]
pub fn search_files(
    root: String,
    query: String,
    max_results: u32,
    show_hidden: bool,
) -> Result<SearchResults, String> {
    let start = Instant::now();
    let root_path = Path::new(&root);

    if !root_path.exists() {
        return Err(format!("Path not found: {}", root));
    }

    if !root_path.is_dir() {
        return Err(format!("Not a directory: {}", root));
    }

    if query.trim().is_empty() {
        return Ok(SearchResults {
            query,
            results: vec![],
            total_matches: 0,
            truncated: false,
            search_time_ms: start.elapsed().as_millis() as f64,
        });
    }

    let mut results = Vec::new();
    let limit = (max_results as usize).min(LIMITS.max_search_results);

    search_recursive(root_path, &query, show_hidden, 0, &mut results);

    // Sort by score descending
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

    let truncated = results.len() > limit;
    let total_matches = results.len() as u32;
    results.truncate(limit);

    Ok(SearchResults {
        query,
        results,
        total_matches,
        truncated,
        search_time_ms: start.elapsed().as_millis() as f64,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_path() {
        let hash1 = hash_path("/foo/bar");
        let hash2 = hash_path("/foo/bar");
        let hash3 = hash_path("/foo/baz");

        assert_eq!(hash1, hash2);
        assert_ne!(hash1, hash3);
    }

    #[test]
    fn test_format_size() {
        assert_eq!(format_size(0), "0 B");
        assert_eq!(format_size(512), "512 B");
        assert_eq!(format_size(1024), "1.0 KB");
        assert_eq!(format_size(1024 * 1024), "1.0 MB");
        assert_eq!(format_size(1024 * 1024 * 1024), "1.0 GB");
    }

    #[test]
    fn test_is_hidden() {
        assert!(is_hidden(".git"));
        assert!(is_hidden(".env"));
        assert!(!is_hidden("src"));
        assert!(!is_hidden("package.json"));
    }

    #[test]
    fn test_is_auto_collapsed() {
        assert!(is_auto_collapsed("node_modules"));
        assert!(is_auto_collapsed(".git"));
        assert!(is_auto_collapsed("dist"));
        assert!(!is_auto_collapsed("src"));
        assert!(!is_auto_collapsed("app"));
    }

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
}
