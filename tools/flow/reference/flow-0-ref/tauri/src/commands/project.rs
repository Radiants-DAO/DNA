//! Project detection commands
//!
//! Detects Next.js projects and extracts configuration.
//! Also handles theme detection in DNA monorepo structure.

use crate::types::ThemeInfo;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

/// Package manager detected from lockfile
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PackageManager {
    Pnpm,
    Yarn,
    Npm,
}

impl PackageManager {
    /// Get the install command for dev dependencies
    pub fn install_dev_cmd(&self) -> &'static str {
        match self {
            PackageManager::Pnpm => "pnpm add -D",
            PackageManager::Yarn => "yarn add -D",
            PackageManager::Npm => "npm install -D",
        }
    }

    /// Get the run command prefix
    pub fn run_cmd(&self) -> &'static str {
        match self {
            PackageManager::Pnpm => "pnpm",
            PackageManager::Yarn => "yarn",
            PackageManager::Npm => "npm run",
        }
    }
}

/// Project type detected from dependencies
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProjectType {
    NextJs,
    Unknown,
}

/// Information about a detected project
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct ProjectInfo {
    pub path: String,
    pub name: String,
    #[serde(rename = "projectType")]
    pub project_type: ProjectType,
    #[serde(rename = "packageManager")]
    pub package_manager: PackageManager,
    #[serde(rename = "devCommand")]
    pub dev_command: String,
    #[serde(rename = "devPort")]
    pub dev_port: u16,
    #[serde(rename = "nextVersion")]
    pub next_version: Option<String>,
    #[serde(rename = "hasBridge")]
    pub has_bridge: bool,
    /// Resolved theme info (if project uses @rdna/* theme)
    pub theme: Option<ThemeInfo>,
    /// Monorepo root path (if detected)
    #[serde(rename = "monorepoRoot")]
    pub monorepo_root: Option<String>,
    /// Whether this path is a theme package itself
    #[serde(rename = "isTheme")]
    pub is_theme: bool,
}

/// Result of project detection
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct ProjectDetectionResult {
    pub success: bool,
    pub project: Option<ProjectInfo>,
    pub error: Option<String>,
}

/// Detect package manager from lockfiles
fn detect_package_manager(project_path: &Path) -> PackageManager {
    if project_path.join("pnpm-lock.yaml").exists() {
        PackageManager::Pnpm
    } else if project_path.join("yarn.lock").exists() {
        PackageManager::Yarn
    } else {
        // Default to npm (package-lock.json or no lockfile)
        PackageManager::Npm
    }
}

/// Extract dev port from package.json scripts
fn extract_dev_port(scripts: &serde_json::Value) -> u16 {
    if let Some(dev_script) = scripts.get("dev").and_then(|v| v.as_str()) {
        // Look for -p or --port flags
        // e.g., "next dev -p 3001" or "next dev --port 3001"
        let parts: Vec<&str> = dev_script.split_whitespace().collect();
        for (i, part) in parts.iter().enumerate() {
            if (*part == "-p" || *part == "--port") && i + 1 < parts.len() {
                if let Ok(port) = parts[i + 1].parse::<u16>() {
                    return port;
                }
            }
            // Handle -p3001 format
            if part.starts_with("-p") && part.len() > 2 {
                if let Ok(port) = part[2..].parse::<u16>() {
                    return port;
                }
            }
        }
    }
    // Default Next.js port
    3000
}

/// Extract dev command from package.json scripts
fn extract_dev_command(scripts: &serde_json::Value, pm: &PackageManager) -> String {
    // Check if dev script exists
    if scripts.get("dev").is_some() {
        match pm {
            PackageManager::Pnpm => "pnpm dev".to_string(),
            PackageManager::Yarn => "yarn dev".to_string(),
            PackageManager::Npm => "npm run dev".to_string(),
        }
    } else {
        // Fallback to direct next dev
        "npx next dev".to_string()
    }
}

/// Check if @rdna/bridge is installed
fn has_bridge_installed(project_path: &Path, pkg_json: &serde_json::Value) -> bool {
    // Check in devDependencies
    if let Some(dev_deps) = pkg_json.get("devDependencies") {
        if dev_deps.get("@rdna/bridge").is_some() {
            return true;
        }
    }

    // Check if .radflow/bridge directory exists (file: protocol install)
    if project_path.join(".radflow").join("bridge").exists() {
        return true;
    }

    false
}

/// Check if a path is a theme package (has tokens.css)
fn is_theme_package(path: &Path) -> bool {
    path.join("tokens.css").exists()
}

/// Find the monorepo root by looking for pnpm-workspace.yaml or lerna.json
fn find_monorepo_root(start_path: &Path) -> Option<String> {
    let mut current = start_path;

    while let Some(parent) = current.parent() {
        if parent.join("pnpm-workspace.yaml").exists()
            || parent.join("lerna.json").exists()
            || (parent.join("package.json").exists() && parent.join("packages").is_dir())
        {
            return Some(parent.to_string_lossy().to_string());
        }
        current = parent;
    }

    None
}

/// Find @rdna/* theme dependency in package.json and resolve to theme path
fn find_rdna_theme(project_path: &Path, pkg_json: &serde_json::Value) -> Option<ThemeInfo> {
    // Check dependencies and devDependencies for @rdna/* packages
    let deps = pkg_json.get("dependencies");
    let dev_deps = pkg_json.get("devDependencies");

    let all_deps: Vec<&serde_json::Value> = [deps, dev_deps].into_iter().flatten().collect();

    for deps_obj in all_deps {
        if let Some(obj) = deps_obj.as_object() {
            for (key, _value) in obj {
                if key.starts_with("@rdna/") && key != "@rdna/bridge" {
                    // Found a theme dependency
                    let theme_name = key.strip_prefix("@rdna/").unwrap_or(key);

                    // Try to find the theme in the monorepo packages directory
                    if let Some(monorepo_root) = find_monorepo_root(project_path) {
                        let packages_dir = Path::new(&monorepo_root).join("packages");
                        let theme_path = packages_dir.join(theme_name);

                        if theme_path.exists() && is_theme_package(&theme_path) {
                            return Some(build_theme_info(&theme_path, theme_name, key));
                        }
                    }
                }
            }
        }
    }

    None
}

/// Build ThemeInfo from a theme directory
fn build_theme_info(theme_path: &Path, name: &str, package_name: &str) -> ThemeInfo {
    let tokens_css = theme_path.join("tokens.css");
    let dark_css = theme_path.join("dark.css");
    let components_dir = theme_path.join("components").join("core");
    let assets_dir = theme_path.join("assets");

    ThemeInfo {
        name: name.to_string(),
        package_name: package_name.to_string(),
        path: theme_path.to_string_lossy().to_string(),
        tokens_css: tokens_css.to_string_lossy().to_string(),
        dark_css: if dark_css.exists() {
            Some(dark_css.to_string_lossy().to_string())
        } else {
            None
        },
        components_dir: if components_dir.exists() {
            Some(components_dir.to_string_lossy().to_string())
        } else {
            None
        },
        assets_dir: if assets_dir.exists() {
            Some(assets_dir.to_string_lossy().to_string())
        } else {
            None
        },
    }
}

/// Detect a project and extract its configuration
#[tauri::command]
#[specta::specta]
pub fn detect_project(path: String) -> ProjectDetectionResult {
    let project_path = Path::new(&path);

    // Check if path exists and is a directory
    if !project_path.exists() || !project_path.is_dir() {
        return ProjectDetectionResult {
            success: false,
            project: None,
            error: Some("Path does not exist or is not a directory".to_string()),
        };
    }

    // Check for package.json
    let package_json_path = project_path.join("package.json");
    if !package_json_path.exists() {
        return ProjectDetectionResult {
            success: false,
            project: None,
            error: Some("No package.json found".to_string()),
        };
    }

    // Read and parse package.json
    let pkg_content = match std::fs::read_to_string(&package_json_path) {
        Ok(content) => content,
        Err(e) => {
            return ProjectDetectionResult {
                success: false,
                project: None,
                error: Some(format!("Failed to read package.json: {}", e)),
            };
        }
    };

    let pkg_json: serde_json::Value = match serde_json::from_str(&pkg_content) {
        Ok(json) => json,
        Err(e) => {
            return ProjectDetectionResult {
                success: false,
                project: None,
                error: Some(format!("Failed to parse package.json: {}", e)),
            };
        }
    };

    // Extract project name
    let name = pkg_json
        .get("name")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| {
            project_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unknown".to_string())
        });

    // Detect package manager
    let package_manager = detect_package_manager(project_path);

    // Check for Next.js in dependencies
    let deps = pkg_json.get("dependencies");
    let dev_deps = pkg_json.get("devDependencies");

    let next_version = deps
        .and_then(|d| d.get("next"))
        .or_else(|| dev_deps.and_then(|d| d.get("next")))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let project_type = if next_version.is_some() {
        ProjectType::NextJs
    } else {
        ProjectType::Unknown
    };

    // Extract scripts info
    let scripts = pkg_json.get("scripts").cloned().unwrap_or(serde_json::json!({}));
    let dev_port = extract_dev_port(&scripts);
    let dev_command = extract_dev_command(&scripts, &package_manager);

    // Check if bridge is installed
    let has_bridge = has_bridge_installed(project_path, &pkg_json);

    // Detect monorepo root
    let monorepo_root = find_monorepo_root(project_path);

    // Check if this is a theme package itself
    let is_theme = is_theme_package(project_path);

    // Find theme if this is an app (not a theme itself)
    let theme = if is_theme {
        // If opening a theme directly, build its info
        Some(build_theme_info(
            project_path,
            &name,
            &pkg_json
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or(&name),
        ))
    } else {
        // Look for @rdna/* theme dependency
        find_rdna_theme(project_path, &pkg_json)
    };

    ProjectDetectionResult {
        success: true,
        project: Some(ProjectInfo {
            path: path.clone(),
            name,
            project_type,
            package_manager,
            dev_command,
            dev_port,
            next_version,
            has_bridge,
            theme,
            monorepo_root,
            is_theme,
        }),
        error: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_dev_port_with_p_flag() {
        let scripts = serde_json::json!({
            "dev": "next dev -p 3001"
        });
        assert_eq!(extract_dev_port(&scripts), 3001);
    }

    #[test]
    fn test_extract_dev_port_with_port_flag() {
        let scripts = serde_json::json!({
            "dev": "next dev --port 4000"
        });
        assert_eq!(extract_dev_port(&scripts), 4000);
    }

    #[test]
    fn test_extract_dev_port_default() {
        let scripts = serde_json::json!({
            "dev": "next dev"
        });
        assert_eq!(extract_dev_port(&scripts), 3000);
    }

    #[test]
    fn test_extract_dev_port_no_script() {
        let scripts = serde_json::json!({});
        assert_eq!(extract_dev_port(&scripts), 3000);
    }

    #[test]
    fn test_package_manager_commands() {
        assert_eq!(PackageManager::Pnpm.install_dev_cmd(), "pnpm add -D");
        assert_eq!(PackageManager::Yarn.install_dev_cmd(), "yarn add -D");
        assert_eq!(PackageManager::Npm.install_dev_cmd(), "npm install -D");
    }
}
