//! Text editing commands for RadFlow
//!
//! Provides direct file write functionality for Text Edit Mode.

use serde::Serialize;
use specta::Type;
use std::fs;
use std::path::Path;
use std::time::SystemTime;

/// Result of a text change operation
#[derive(Serialize, Type)]
pub struct TextChangeResult {
    /// Whether the change was successfully written
    pub success: bool,
    /// Error message if failed
    pub error: Option<String>,
    /// New file modification time (Unix timestamp in milliseconds)
    #[serde(rename = "modifiedAt")]
    pub modified_at: Option<f64>,
}

/// Information about a file's current state
#[derive(Serialize, Type)]
pub struct FileInfo {
    /// File modification time (Unix timestamp in milliseconds)
    #[serde(rename = "modifiedAt")]
    pub modified_at: f64,
    /// File exists
    pub exists: bool,
}

/// Write a text change to a source file
///
/// This command reads the file, replaces the old text with new text at the specified line,
/// and writes the file back. It's designed for Text Edit Mode's direct write functionality.
#[tauri::command]
#[specta::specta]
pub fn write_text_change(
    path: String,
    line: u32,
    old_text: String,
    new_text: String,
) -> TextChangeResult {
    let file_path = Path::new(&path);
    let line = line as usize;

    // Check if file exists
    if !file_path.exists() {
        return TextChangeResult {
            success: false,
            error: Some(format!("File not found: {}", path)),
            modified_at: None,
        };
    }

    // Read file contents
    let content = match fs::read_to_string(file_path) {
        Ok(c) => c,
        Err(e) => {
            return TextChangeResult {
                success: false,
                error: Some(format!("Failed to read file: {}", e)),
                modified_at: None,
            };
        }
    };

    // Split into lines
    let lines: Vec<&str> = content.lines().collect();

    // Validate line number (1-indexed from frontend)
    if line == 0 || line > lines.len() {
        return TextChangeResult {
            success: false,
            error: Some(format!(
                "Line {} out of range (file has {} lines)",
                line,
                lines.len()
            )),
            modified_at: None,
        };
    }

    // Get the target line (convert to 0-indexed)
    let line_idx = line - 1;
    let target_line = lines[line_idx];

    // Find and replace the old text in the target line
    if !target_line.contains(&old_text) {
        return TextChangeResult {
            success: false,
            error: Some(format!(
                "Text '{}' not found on line {}",
                old_text.chars().take(50).collect::<String>(),
                line
            )),
            modified_at: None,
        };
    }

    // Create new line with replacement
    let new_line = target_line.replacen(&old_text, &new_text, 1);

    // Reconstruct file content
    let mut new_lines: Vec<String> = lines.iter().map(|s| s.to_string()).collect();
    new_lines[line_idx] = new_line;

    // Preserve original line endings
    let new_content = if content.contains("\r\n") {
        new_lines.join("\r\n")
    } else {
        new_lines.join("\n")
    };

    // Add trailing newline if original had one
    let final_content = if content.ends_with('\n') || content.ends_with("\r\n") {
        if new_content.ends_with('\n') {
            new_content
        } else {
            new_content + "\n"
        }
    } else {
        new_content
    };

    // Write the file
    if let Err(e) = fs::write(file_path, &final_content) {
        return TextChangeResult {
            success: false,
            error: Some(format!("Failed to write file: {}", e)),
            modified_at: None,
        };
    }

    // Get new modification time
    let modified_at = get_file_modified_time(file_path);

    TextChangeResult {
        success: true,
        error: None,
        modified_at,
    }
}

/// Get file information including modification time
///
/// Used to check if a file has been modified externally before writing.
#[tauri::command]
#[specta::specta]
pub fn get_file_info(path: String) -> FileInfo {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return FileInfo {
            modified_at: 0.0,
            exists: false,
        };
    }

    FileInfo {
        modified_at: get_file_modified_time(file_path).unwrap_or(0.0),
        exists: true,
    }
}

/// Revert a text change (for undo functionality)
///
/// This is essentially the same as write_text_change but with swapped old/new text.
#[tauri::command]
#[specta::specta]
pub fn revert_text_change(
    path: String,
    line: u32,
    current_text: String,
    original_text: String,
) -> TextChangeResult {
    write_text_change(path, line, current_text, original_text)
}

/// Helper to get file modification time as Unix timestamp in milliseconds
fn get_file_modified_time(path: &Path) -> Option<f64> {
    fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| {
            t.duration_since(SystemTime::UNIX_EPOCH)
                .ok()
                .map(|d| d.as_millis() as f64)
        })
}
