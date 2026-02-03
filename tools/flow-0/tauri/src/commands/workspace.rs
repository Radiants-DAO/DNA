//! Workspace scanning commands
//!
//! Scans a pnpm monorepo for themes and apps.

use crate::types::{MonorepoAppEntry, MonorepoScanResult, MonorepoThemeEntry};
use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;

/// pnpm-workspace.yaml structure
#[derive(Deserialize)]
struct PnpmWorkspace {
    packages: Vec<String>,
}

/// DNA config section in package.json
#[derive(Deserialize)]
struct DnaConfig {
    port: Option<u16>,
    #[serde(rename = "previewRoute")]
    preview_route: Option<String>,
}

/// Minimal package.json fields we need
#[derive(Deserialize)]
struct PackageJson {
    name: Option<String>,
    dependencies: Option<HashMap<String, String>>,
    #[serde(rename = "devDependencies")]
    dev_dependencies: Option<HashMap<String, String>>,
    scripts: Option<HashMap<String, String>>,
    dna: Option<DnaConfig>,
}

/// Resolve glob patterns from pnpm-workspace.yaml into actual directories
fn resolve_workspace_globs(root: &Path, patterns: &[String]) -> Vec<std::path::PathBuf> {
    let mut dirs = Vec::new();

    for pattern in patterns {
        // Handle simple patterns like "packages/*" or "apps/*"
        // Strip trailing /* or /** for glob matching
        let clean = pattern
            .trim_end_matches("/**")
            .trim_end_matches("/*");

        let base = root.join(clean);
        if !base.exists() || !base.is_dir() {
            continue;
        }

        // If pattern ends with * or /*, enumerate children
        if pattern.ends_with("/*") || pattern.ends_with("/**") {
            if let Ok(entries) = std::fs::read_dir(&base) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() && path.join("package.json").exists() {
                        dirs.push(path);
                    }
                }
            }
        } else {
            // Exact path
            if base.join("package.json").exists() {
                dirs.push(base);
            }
        }
    }

    dirs
}

/// Read and parse a package.json, returning None on any error
fn read_package_json(dir: &Path) -> Option<PackageJson> {
    let content = std::fs::read_to_string(dir.join("package.json")).ok()?;
    serde_json::from_str(&content).ok()
}

/// Extract a short ID from a package name like "@rdna/radiants" -> "radiants"
fn package_id(name: &str) -> String {
    if let Some(slash) = name.rfind('/') {
        name[slash + 1..].to_string()
    } else {
        name.to_string()
    }
}

/// Determine if a directory is a theme package (has tokens.css)
fn is_theme(dir: &Path) -> bool {
    dir.join("tokens.css").exists()
}

/// Determine the dev port from package.json dna config or scripts
fn detect_dev_port(pkg: &PackageJson) -> u16 {
    // Priority 1: Explicit dna.port field
    if let Some(dna) = &pkg.dna {
        if let Some(port) = dna.port {
            return port;
        }
    }

    // Priority 2: Parse from dev script
    if let Some(scripts) = &pkg.scripts {
        if let Some(dev) = scripts.get("dev") {
            // Look for --port or -p flag
            let parts: Vec<&str> = dev.split_whitespace().collect();
            for (i, part) in parts.iter().enumerate() {
                if (*part == "--port" || *part == "-p") && i + 1 < parts.len() {
                    if let Ok(port) = parts[i + 1].parse::<u16>() {
                        return port;
                    }
                }
                if let Some(port_str) = part.strip_prefix("--port=") {
                    if let Ok(port) = port_str.parse::<u16>() {
                        return port;
                    }
                }
            }
        }
    }
    3000 // default
}

/// Determine the dev command from package.json scripts
fn detect_dev_command(pkg: &PackageJson) -> String {
    if let Some(scripts) = &pkg.scripts {
        if let Some(dev) = scripts.get("dev") {
            return dev.clone();
        }
    }
    "npm run dev".to_string()
}

/// Scan a monorepo root for themes and apps
#[tauri::command]
#[specta::specta]
pub fn scan_monorepo(root: String) -> Result<MonorepoScanResult, String> {
    let root_path = Path::new(&root);

    // Parse pnpm-workspace.yaml
    let workspace_yaml = root_path.join("pnpm-workspace.yaml");
    if !workspace_yaml.exists() {
        return Err("No pnpm-workspace.yaml found. Select a pnpm monorepo root.".to_string());
    }

    let yaml_content = std::fs::read_to_string(&workspace_yaml)
        .map_err(|e| format!("Failed to read pnpm-workspace.yaml: {}", e))?;

    let workspace: PnpmWorkspace = serde_yaml::from_str(&yaml_content)
        .map_err(|e| format!("Failed to parse pnpm-workspace.yaml: {}", e))?;

    // Resolve glob patterns to actual directories
    let package_dirs = resolve_workspace_globs(root_path, &workspace.packages);

    let mut themes: Vec<MonorepoThemeEntry> = Vec::new();
    let mut apps: Vec<MonorepoAppEntry> = Vec::new();
    let mut errors: Vec<String> = Vec::new();

    // Build a map of package name -> id for all packages first
    let mut name_to_id: HashMap<String, String> = HashMap::new();
    let mut theme_ids: Vec<String> = Vec::new();

    // First pass: identify themes and build name map
    for dir in &package_dirs {
        if let Some(pkg) = read_package_json(dir) {
            let pkg_name = pkg.name.clone().unwrap_or_else(|| {
                dir.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| "unknown".to_string())
            });
            let id = package_id(&pkg_name);
            name_to_id.insert(pkg_name.clone(), id.clone());

            if is_theme(dir) {
                theme_ids.push(id.clone());
                let abs_path = dir
                    .canonicalize()
                    .unwrap_or_else(|_| dir.to_path_buf())
                    .to_string_lossy()
                    .to_string();

                themes.push(MonorepoThemeEntry {
                    id,
                    name: pkg_name,
                    path: abs_path,
                    has_tokens_css: true, // we already checked
                    has_dark_css: dir.join("dark.css").exists(),
                    has_components_dir: dir.join("components").is_dir(),
                    apps: Vec::new(), // filled in second pass
                });
            }
        } else {
            errors.push(format!(
                "Failed to parse package.json in {}",
                dir.display()
            ));
        }
    }

    // Second pass: identify apps (have a dev script — themes can also be apps)
    for dir in &package_dirs {
        if let Some(pkg) = read_package_json(dir) {
            let has_dev_script = pkg
                .scripts
                .as_ref()
                .map(|s| s.contains_key("dev"))
                .unwrap_or(false);

            if !has_dev_script {
                continue; // not an app
            }

            let pkg_name = pkg.name.clone().unwrap_or_else(|| {
                dir.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| "unknown".to_string())
            });
            let id = package_id(&pkg_name);

            let abs_path = dir
                .canonicalize()
                .unwrap_or_else(|_| dir.to_path_buf())
                .to_string_lossy()
                .to_string();

            // Resolve @rdna/* dependencies to theme IDs
            let all_deps: HashMap<String, String> = {
                let mut merged = HashMap::new();
                if let Some(deps) = &pkg.dependencies {
                    merged.extend(deps.iter().map(|(k, v)| (k.clone(), v.clone())));
                }
                if let Some(deps) = &pkg.dev_dependencies {
                    merged.extend(deps.iter().map(|(k, v)| (k.clone(), v.clone())));
                }
                merged
            };

            let resolved_theme_ids: Vec<String> = all_deps
                .keys()
                .filter(|dep| dep.starts_with("@rdna/"))
                .filter_map(|dep| name_to_id.get(dep.as_str()))
                .cloned()
                .collect();

            let dev_command = detect_dev_command(&pkg);
            let dev_port = detect_dev_port(&pkg);
            let preview_route = pkg
                .dna
                .as_ref()
                .and_then(|d| d.preview_route.clone())
                .unwrap_or_else(|| "/preview-component".to_string());

            // Link app to themes
            for theme in &mut themes {
                if resolved_theme_ids.contains(&theme.id) {
                    theme.apps.push(id.clone());
                }
            }

            apps.push(MonorepoAppEntry {
                id,
                name: pkg_name,
                path: abs_path,
                theme_ids: resolved_theme_ids,
                dev_command,
                dev_port,
                preview_route,
            });
        }
    }

    Ok(MonorepoScanResult {
        themes,
        apps,
        errors,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_package_id() {
        assert_eq!(package_id("@rdna/radiants"), "radiants");
        assert_eq!(package_id("my-app"), "my-app");
        assert_eq!(package_id("@scope/pkg"), "pkg");
    }

    #[test]
    fn test_scan_missing_workspace_yaml() {
        let result = scan_monorepo("/nonexistent/path".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("No pnpm-workspace.yaml"));
    }
}
