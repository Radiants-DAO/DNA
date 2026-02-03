//! Asset scanning commands for theme icons, logos, and images
//!
//! Scans theme asset directories and returns structured asset libraries.

use crate::types::{AssetLibrary, IconAsset, ImageAsset, LogoAsset};
use std::collections::hash_map::DefaultHasher;
use std::collections::HashSet;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::Path;

/// Read SVG file content as inline string. Returns None for read errors.
fn read_svg_content(path: &Path) -> Option<String> {
    fs::read_to_string(path).ok()
}

/// Read a raster image and return a base64 data URI. Returns None for read errors or large files.
fn read_raster_data_uri(path: &Path, extension: &str) -> Option<String> {
    // Skip files > 512KB to avoid bloating IPC payloads
    let metadata = fs::metadata(path).ok()?;
    if metadata.len() > 512 * 1024 {
        return None;
    }
    let bytes = fs::read(path).ok()?;
    let mime = match extension {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "avif" => "image/avif",
        _ => return None,
    };
    let encoded = base64_encode(&bytes);
    Some(format!("data:{};base64,{}", mime, encoded))
}

/// Minimal base64 encoder (no external crate needed)
fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let n = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((n >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((n >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((n >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(n & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

/// Generate a unique ID from a path
fn generate_id(path: &str) -> String {
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Scan a directory for SVG icons
fn scan_icons(icons_dir: &Path, theme_root: &Path) -> Vec<IconAsset> {
    let mut icons = Vec::new();

    if !icons_dir.exists() || !icons_dir.is_dir() {
        return icons;
    }

    match fs::read_dir(icons_dir) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Some(ext) = path.extension() {
                        if ext == "svg" {
                            let name = path
                                .file_stem()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_default();

                            let absolute_path = path.to_string_lossy().to_string();
                            let relative_path = path
                                .strip_prefix(theme_root)
                                .map(|p| p.to_string_lossy().to_string())
                                .unwrap_or_else(|_| absolute_path.clone());

                            let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

                            let content = read_svg_content(&path);
                            icons.push(IconAsset {
                                id: generate_id(&absolute_path),
                                name,
                                path: relative_path,
                                absolute_path,
                                size: size as f64,
                                content,
                            });
                        }
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("Warning: Permission denied or error reading directory '{}': {}", icons_dir.display(), e);
        }
    }

    // Sort by name
    icons.sort_by(|a, b| a.name.cmp(&b.name));
    icons
}

/// Scan a directory for logos
fn scan_logos(logos_dir: &Path, theme_root: &Path) -> Vec<LogoAsset> {
    let mut logos = Vec::new();

    if !logos_dir.exists() || !logos_dir.is_dir() {
        return logos;
    }

    match fs::read_dir(logos_dir) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Some(ext) = path.extension() {
                        let ext_str = ext.to_string_lossy().to_lowercase();
                        if ext_str == "svg" || ext_str == "png" {
                            let name = path
                                .file_stem()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_default();

                            let absolute_path = path.to_string_lossy().to_string();
                            let relative_path = path
                                .strip_prefix(theme_root)
                                .map(|p| p.to_string_lossy().to_string())
                                .unwrap_or_else(|_| absolute_path.clone());

                            let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

                            let content = if ext_str == "svg" {
                                read_svg_content(&path)
                            } else {
                                read_raster_data_uri(&path, &ext_str)
                            };
                            logos.push(LogoAsset {
                                id: generate_id(&absolute_path),
                                name,
                                path: relative_path,
                                absolute_path,
                                size: size as f64,
                                content,
                            });
                        }
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("Warning: Permission denied or error reading directory '{}': {}", logos_dir.display(), e);
        }
    }

    logos.sort_by(|a, b| a.name.cmp(&b.name));
    logos
}

/// Scan a directory for images
fn scan_images(images_dir: &Path, theme_root: &Path) -> Vec<ImageAsset> {
    let mut images = Vec::new();

    if !images_dir.exists() || !images_dir.is_dir() {
        return images;
    }

    let image_extensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];

    match fs::read_dir(images_dir) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Some(ext) = path.extension() {
                        let ext_str = ext.to_string_lossy().to_lowercase();
                        if image_extensions.contains(&ext_str.as_str()) {
                            let name = path
                                .file_stem()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_default();

                            let absolute_path = path.to_string_lossy().to_string();
                            let relative_path = path
                                .strip_prefix(theme_root)
                                .map(|p| p.to_string_lossy().to_string())
                                .unwrap_or_else(|_| absolute_path.clone());

                            let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

                            let content = if ext_str == "svg" {
                                read_svg_content(&path)
                            } else {
                                read_raster_data_uri(&path, &ext_str)
                            };
                            images.push(ImageAsset {
                                id: generate_id(&absolute_path),
                                name,
                                path: relative_path,
                                absolute_path,
                                size: size as f64,
                                extension: ext_str,
                                content,
                            });
                        }
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("Warning: Permission denied or error reading directory '{}': {}", images_dir.display(), e);
        }
    }

    images.sort_by(|a, b| a.name.cmp(&b.name));
    images
}

/// Scan a theme's assets directory and return the complete asset library
#[tauri::command]
#[specta::specta]
pub fn scan_theme_assets(theme_path: String) -> Result<AssetLibrary, String> {
    let theme_root = Path::new(&theme_path);
    let assets_dir = theme_root.join("assets");

    if !theme_root.exists() {
        return Err(format!("Theme path does not exist: {}", theme_path));
    }

    let icons = scan_icons(&assets_dir.join("icons"), theme_root);
    let logos = scan_logos(&assets_dir.join("logos"), theme_root);
    let images = scan_images(&assets_dir.join("images"), theme_root);

    Ok(AssetLibrary {
        icons,
        logos,
        images,
    })
}

/// Scan a project's assets directory (separate from theme)
#[tauri::command]
#[specta::specta]
pub fn scan_project_assets(project_path: String) -> Result<AssetLibrary, String> {
    let project_root = Path::new(&project_path);

    if !project_root.exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    // Check common asset locations
    let asset_locations = [
        project_root.join("public").join("assets"),
        project_root.join("public").join("icons"),
        project_root.join("assets"),
        project_root.join("src").join("assets"),
    ];

    let mut all_icons = Vec::new();
    let mut all_logos = Vec::new();
    let mut all_images = Vec::new();

    // Track scanned directories to avoid duplicates
    let mut scanned_icon_dirs: HashSet<std::path::PathBuf> = HashSet::new();
    let mut scanned_logo_dirs: HashSet<std::path::PathBuf> = HashSet::new();
    let mut scanned_image_dirs: HashSet<std::path::PathBuf> = HashSet::new();

    for location in &asset_locations {
        if location.exists() {
            let icons_path = location.join("icons");
            if let Ok(canonical) = icons_path.canonicalize() {
                if scanned_icon_dirs.insert(canonical) {
                    all_icons.extend(scan_icons(&icons_path, project_root));
                }
            }

            let logos_path = location.join("logos");
            if let Ok(canonical) = logos_path.canonicalize() {
                if scanned_logo_dirs.insert(canonical) {
                    all_logos.extend(scan_logos(&logos_path, project_root));
                }
            }

            if let Ok(canonical) = location.canonicalize() {
                if scanned_image_dirs.insert(canonical) {
                    all_images.extend(scan_images(location, project_root));
                }
            }
        }
    }

    // Also check for a top-level icons directory (deduplicates via HashSet)
    let icons_dir = project_root.join("public").join("icons");
    if icons_dir.exists() {
        if let Ok(canonical) = icons_dir.canonicalize() {
            if scanned_icon_dirs.insert(canonical) {
                all_icons.extend(scan_icons(&icons_dir, project_root));
            }
        }
    }

    Ok(AssetLibrary {
        icons: all_icons,
        logos: all_logos,
        images: all_images,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_id() {
        let id1 = generate_id("/path/to/file.svg");
        let id2 = generate_id("/path/to/file.svg");
        let id3 = generate_id("/path/to/other.svg");

        assert_eq!(id1, id2);
        assert_ne!(id1, id3);
    }
}
