//! File write commands for style edit accumulation
//!
//! Provides batch file writing with path validation, backup creation,
//! and diff preview for the Edit Clipboard feature.
//!
//! Implementation: fn-5.6

use chrono::Utc;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// A single style edit to apply to a file
#[derive(Debug, Clone, Deserialize, Type)]
pub struct StyleEditInput {
    /// Unique ID for tracking
    pub id: String,
    /// RadFlow component ID
    #[serde(rename = "radflowId")]
    pub radflow_id: String,
    /// Component name for display
    #[serde(rename = "componentName")]
    pub component_name: String,
    /// Source file path (absolute)
    #[serde(rename = "filePath")]
    pub file_path: String,
    /// Line number (1-indexed)
    pub line: u32,
    /// Column number (1-indexed)
    pub column: u32,
    /// CSS property name
    pub property: String,
    /// Original value
    #[serde(rename = "oldValue")]
    pub old_value: String,
    /// New value
    #[serde(rename = "newValue")]
    pub new_value: String,
}

/// Result of a batch write operation
#[derive(Debug, Serialize, Type)]
pub struct WriteResult {
    /// Whether the write was successful
    pub success: bool,
    /// Files that were modified
    #[serde(rename = "filesModified")]
    pub files_modified: Vec<String>,
    /// Path to the backup directory
    #[serde(rename = "backupPath")]
    pub backup_path: Option<String>,
    /// Error message if failed
    pub error: Option<String>,
    /// Per-file errors
    #[serde(rename = "fileErrors")]
    pub file_errors: HashMap<String, String>,
}

/// A diff entry for preview
#[derive(Debug, Serialize, Type)]
pub struct DiffEntry {
    /// File path (relative to project root)
    #[serde(rename = "relativePath")]
    pub relative_path: String,
    /// Original line content
    #[serde(rename = "oldLine")]
    pub old_line: String,
    /// New line content (after applying edit)
    #[serde(rename = "newLine")]
    pub new_line: String,
    /// Line number (1-indexed)
    pub line: u32,
    /// Property being changed
    pub property: String,
}

/// Result of generating a diff preview
#[derive(Debug, Serialize, Type)]
pub struct DiffPreviewResult {
    /// Whether the preview was generated successfully
    pub success: bool,
    /// List of diff entries
    pub diffs: Vec<DiffEntry>,
    /// Error message if failed
    pub error: Option<String>,
}

/// Check if a path is safe to write (within project root, not in protected dirs)
fn is_path_safe(file_path: &Path, project_root: &Path) -> Result<(), String> {
    // Canonicalize paths to resolve symlinks and ..
    let canonical_file = file_path
        .canonicalize()
        .map_err(|e| format!("Failed to resolve path {}: {}", file_path.display(), e))?;
    let canonical_root = project_root
        .canonicalize()
        .map_err(|e| format!("Failed to resolve project root {}: {}", project_root.display(), e))?;

    // Check if file is under project root
    if !canonical_file.starts_with(&canonical_root) {
        return Err(format!(
            "File {} is outside project root {}",
            file_path.display(),
            project_root.display()
        ));
    }

    // Check for protected directories
    let relative = canonical_file
        .strip_prefix(&canonical_root)
        .unwrap_or(&canonical_file);
    let relative_str = relative.to_string_lossy();

    if relative_str.starts_with("node_modules/")
        || relative_str.starts_with("node_modules\\")
        || relative_str.contains("/node_modules/")
        || relative_str.contains("\\node_modules\\")
    {
        return Err(format!(
            "Cannot write to node_modules: {}",
            file_path.display()
        ));
    }

    if relative_str.starts_with(".git/")
        || relative_str.starts_with(".git\\")
        || relative_str.contains("/.git/")
        || relative_str.contains("\\.git\\")
    {
        return Err(format!("Cannot write to .git: {}", file_path.display()));
    }

    Ok(())
}

/// Create a backup of a file before modification
fn create_backup(
    file_path: &Path,
    project_root: &Path,
    backup_dir: &Path,
) -> Result<PathBuf, String> {
    // Get relative path for backup structure
    let relative = file_path
        .strip_prefix(project_root)
        .unwrap_or(file_path);

    let backup_path = backup_dir.join(relative);

    // Create parent directories
    if let Some(parent) = backup_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;
    }

    // Copy file to backup
    fs::copy(file_path, &backup_path)
        .map_err(|e| format!("Failed to create backup of {}: {}", file_path.display(), e))?;

    Ok(backup_path)
}

/// Apply a style edit to a file's content
fn apply_style_edit(content: &str, edit: &StyleEditInput) -> Result<String, String> {
    let lines: Vec<&str> = content.lines().collect();
    let line_idx = (edit.line as usize).saturating_sub(1);

    if line_idx >= lines.len() {
        return Err(format!(
            "Line {} out of range (file has {} lines)",
            edit.line,
            lines.len()
        ));
    }

    let target_line = lines[line_idx];

    // Find and replace the old value with new value
    // We look for patterns like: property: "oldValue" or property: 'oldValue' or property: oldValue
    let patterns = [
        format!("{}: \"{}\"", edit.property, edit.old_value),
        format!("{}: '{}'", edit.property, edit.old_value),
        format!("{}: {}", edit.property, edit.old_value),
        format!("{}:\"{}\"", edit.property, edit.old_value),
        format!("{}:'{}'", edit.property, edit.old_value),
        format!("{}:{}", edit.property, edit.old_value),
    ];

    let mut new_line = target_line.to_string();
    let mut found = false;

    for pattern in &patterns {
        if target_line.contains(pattern) {
            let replacement = if pattern.contains('"') {
                format!("{}: \"{}\"", edit.property, edit.new_value)
            } else if pattern.contains('\'') {
                format!("{}: '{}'", edit.property, edit.new_value)
            } else {
                format!("{}: {}", edit.property, edit.new_value)
            };
            new_line = target_line.replacen(pattern, &replacement, 1);
            found = true;
            break;
        }
    }

    // Fallback: try to find just the old value on the line
    if !found && target_line.contains(&edit.old_value) {
        new_line = target_line.replacen(&edit.old_value, &edit.new_value, 1);
        found = true;
    }

    if !found {
        return Err(format!(
            "Could not find '{}' on line {}",
            edit.old_value, edit.line
        ));
    }

    // Reconstruct content
    let mut new_lines: Vec<String> = lines.iter().map(|s| s.to_string()).collect();
    new_lines[line_idx] = new_line;

    // Preserve original line endings
    let line_ending = if content.contains("\r\n") { "\r\n" } else { "\n" };
    let mut result = new_lines.join(line_ending);

    // Preserve trailing newline
    if content.ends_with('\n') || content.ends_with("\r\n") {
        if !result.ends_with('\n') {
            result.push_str(line_ending);
        }
    }

    Ok(result)
}

/// Generate a diff preview for style edits without writing files
#[tauri::command]
#[specta::specta]
pub fn preview_style_edits(
    edits: Vec<StyleEditInput>,
    project_root: String,
) -> DiffPreviewResult {
    let root_path = Path::new(&project_root);

    if !root_path.exists() {
        return DiffPreviewResult {
            success: false,
            diffs: vec![],
            error: Some(format!("Project root not found: {}", project_root)),
        };
    }

    let mut diffs = Vec::new();

    // Group edits by file for processing
    let mut edits_by_file: HashMap<String, Vec<&StyleEditInput>> = HashMap::new();
    for edit in &edits {
        edits_by_file
            .entry(edit.file_path.clone())
            .or_default()
            .push(edit);
    }

    for (file_path, file_edits) in edits_by_file {
        let path = Path::new(&file_path);

        // Validate path safety
        if let Err(e) = is_path_safe(path, root_path) {
            return DiffPreviewResult {
                success: false,
                diffs: vec![],
                error: Some(e),
            };
        }

        // Read file content
        let content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(e) => {
                return DiffPreviewResult {
                    success: false,
                    diffs: vec![],
                    error: Some(format!("Failed to read {}: {}", file_path, e)),
                };
            }
        };

        let lines: Vec<&str> = content.lines().collect();

        // Generate diff for each edit
        for edit in file_edits {
            let line_idx = (edit.line as usize).saturating_sub(1);
            let old_line = lines.get(line_idx).unwrap_or(&"").to_string();

            // Apply edit to get new line
            let result = apply_style_edit(&content, edit);
            let new_line = match result {
                Ok(new_content) => {
                    let new_lines: Vec<&str> = new_content.lines().collect();
                    new_lines.get(line_idx).unwrap_or(&"").to_string()
                }
                Err(e) => {
                    return DiffPreviewResult {
                        success: false,
                        diffs: vec![],
                        error: Some(e),
                    };
                }
            };

            let relative_path = path
                .strip_prefix(root_path)
                .unwrap_or(path)
                .to_string_lossy()
                .to_string();

            diffs.push(DiffEntry {
                relative_path,
                old_line,
                new_line,
                line: edit.line,
                property: edit.property.clone(),
            });
        }
    }

    DiffPreviewResult {
        success: true,
        diffs,
        error: None,
    }
}

/// Write style edits to source files with backup
#[tauri::command]
#[specta::specta]
pub fn write_style_edits(
    edits: Vec<StyleEditInput>,
    project_root: String,
) -> WriteResult {
    let root_path = Path::new(&project_root);

    if !root_path.exists() {
        return WriteResult {
            success: false,
            files_modified: vec![],
            backup_path: None,
            error: Some(format!("Project root not found: {}", project_root)),
            file_errors: HashMap::new(),
        };
    }

    // Create backup directory with timestamp
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let backup_dir = root_path.join(".radflow").join("backups").join(&timestamp);

    if let Err(e) = fs::create_dir_all(&backup_dir) {
        return WriteResult {
            success: false,
            files_modified: vec![],
            backup_path: None,
            error: Some(format!("Failed to create backup directory: {}", e)),
            file_errors: HashMap::new(),
        };
    }

    // Group edits by file
    let mut edits_by_file: HashMap<String, Vec<&StyleEditInput>> = HashMap::new();
    for edit in &edits {
        edits_by_file
            .entry(edit.file_path.clone())
            .or_default()
            .push(edit);
    }

    let mut files_modified = Vec::new();
    let mut file_errors: HashMap<String, String> = HashMap::new();

    for (file_path, file_edits) in edits_by_file {
        let path = Path::new(&file_path);

        // Validate path safety
        if let Err(e) = is_path_safe(path, root_path) {
            file_errors.insert(file_path.clone(), e);
            continue;
        }

        // Create backup
        if let Err(e) = create_backup(path, root_path, &backup_dir) {
            file_errors.insert(file_path.clone(), e);
            continue;
        }

        // Read file content
        let mut content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(e) => {
                file_errors.insert(file_path.clone(), format!("Failed to read: {}", e));
                continue;
            }
        };

        // Apply all edits for this file
        let mut success = true;
        for edit in file_edits {
            match apply_style_edit(&content, edit) {
                Ok(new_content) => {
                    content = new_content;
                }
                Err(e) => {
                    file_errors.insert(
                        file_path.clone(),
                        format!("Edit {} failed: {}", edit.id, e),
                    );
                    success = false;
                    break;
                }
            }
        }

        if !success {
            continue;
        }

        // Write modified content
        if let Err(e) = fs::write(path, &content) {
            file_errors.insert(file_path.clone(), format!("Failed to write: {}", e));
            continue;
        }

        files_modified.push(file_path);
    }

    let success = file_errors.is_empty();

    WriteResult {
        success,
        files_modified,
        backup_path: Some(backup_dir.to_string_lossy().to_string()),
        error: if file_errors.is_empty() {
            None
        } else {
            Some(format!("{} file(s) had errors", file_errors.len()))
        },
        file_errors,
    }
}

/// Restore files from a backup
#[tauri::command]
#[specta::specta]
pub fn restore_from_backup(
    backup_path: String,
    project_root: String,
) -> WriteResult {
    let backup_dir = Path::new(&backup_path);
    let root_path = Path::new(&project_root);

    if !backup_dir.exists() {
        return WriteResult {
            success: false,
            files_modified: vec![],
            backup_path: None,
            error: Some(format!("Backup not found: {}", backup_path)),
            file_errors: HashMap::new(),
        };
    }

    let mut files_modified = Vec::new();
    let mut file_errors: HashMap<String, String> = HashMap::new();

    // Walk the backup directory and restore files
    fn walk_and_restore(
        dir: &Path,
        backup_root: &Path,
        project_root: &Path,
        files_modified: &mut Vec<String>,
        file_errors: &mut HashMap<String, String>,
    ) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    walk_and_restore(&path, backup_root, project_root, files_modified, file_errors);
                } else {
                    // Get relative path from backup
                    let relative = match path.strip_prefix(backup_root) {
                        Ok(r) => r,
                        Err(_) => continue,
                    };

                    let target = project_root.join(relative);
                    let target_str = target.to_string_lossy().to_string();

                    // Copy backup to original location
                    match fs::copy(&path, &target) {
                        Ok(_) => {
                            files_modified.push(target_str);
                        }
                        Err(e) => {
                            file_errors.insert(target_str, format!("Failed to restore: {}", e));
                        }
                    }
                }
            }
        }
    }

    walk_and_restore(
        backup_dir,
        backup_dir,
        root_path,
        &mut files_modified,
        &mut file_errors,
    );

    let success = file_errors.is_empty();

    WriteResult {
        success,
        files_modified,
        backup_path: Some(backup_path),
        error: if file_errors.is_empty() {
            None
        } else {
            Some(format!("{} file(s) failed to restore", file_errors.len()))
        },
        file_errors,
    }
}
