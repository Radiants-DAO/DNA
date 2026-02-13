//! RadFlow Tauri backend
//!
//! This crate provides the Rust backend for RadFlow, including:
//! - Component parsing (SWC)
//! - Token extraction (lightningcss)
//! - File watching (notify)

pub mod commands;
pub mod types;

use commands::dev_server::DevServerState;
use commands::watcher::WatcherState;
use serde::Serialize;
use specta::Type;
use std::path::Path;

/// Application version info returned by get_version command
#[derive(Serialize, Type)]
pub struct VersionInfo {
    pub version: String,
    pub tauri_version: String,
}

/// Result of validating a project folder
#[derive(Serialize, Type)]
pub struct ProjectValidation {
    pub valid: bool,
    pub project_name: Option<String>,
    pub error: Option<String>,
}

/// Greet someone by name - basic test command
#[tauri::command]
#[specta::specta]
fn greet(name: String) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Get the current application version
#[tauri::command]
#[specta::specta]
fn get_version() -> VersionInfo {
    VersionInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        tauri_version: tauri::VERSION.to_string(),
    }
}

/// Validate that a folder is a valid project (contains package.json or tsconfig.json)
#[tauri::command]
#[specta::specta]
fn validate_project(path: String) -> ProjectValidation {
    let project_path = Path::new(&path);

    // Check if path exists and is a directory
    if !project_path.exists() || !project_path.is_dir() {
        return ProjectValidation {
            valid: false,
            project_name: None,
            error: Some("Path does not exist or is not a directory".to_string()),
        };
    }

    // Check for package.json
    let package_json = project_path.join("package.json");
    if package_json.exists() {
        // Try to read project name from package.json
        if let Ok(content) = std::fs::read_to_string(&package_json) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                let name = json
                    .get("name")
                    .and_then(|n| n.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| {
                        project_path
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_else(|| "Unknown".to_string())
                    });

                return ProjectValidation {
                    valid: true,
                    project_name: Some(name),
                    error: None,
                };
            }
        }

        // package.json exists but couldn't parse name
        return ProjectValidation {
            valid: true,
            project_name: project_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string()),
            error: None,
        };
    }

    // Check for tsconfig.json as fallback
    let tsconfig = project_path.join("tsconfig.json");
    if tsconfig.exists() {
        return ProjectValidation {
            valid: true,
            project_name: project_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string()),
            error: None,
        };
    }

    ProjectValidation {
        valid: false,
        project_name: None,
        error: Some(
            "Not a valid project folder. Must contain package.json or tsconfig.json".to_string(),
        ),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
        greet,
        get_version,
        validate_project,
        commands::components::parse_component,
        commands::components::scan_components,
        commands::tokens::parse_tokens,
        commands::violations::scan_violations,
        commands::violations::detect_violations,
        commands::watcher::start_watcher,
        commands::watcher::stop_watcher,
        commands::watcher::get_watched_path,
        commands::text_edit::write_text_change,
        commands::text_edit::get_file_info,
        commands::text_edit::revert_text_change,
        commands::project::detect_project,
        commands::dev_server::start_dev_server,
        commands::dev_server::stop_dev_server,
        commands::dev_server::get_dev_server_status,
        commands::dev_server::get_dev_server_logs,
        commands::dev_server::check_dev_server_health,
        // Spatial file viewer commands
        commands::spatial::scan_directory,
        commands::spatial::expand_folder,
        commands::spatial::search_files,
        // Schema scanning commands
        commands::schema::scan_schemas,
        commands::schema::search_schemas,
        commands::schema::get_schema,
        commands::schema::get_dna_config,
        // Theme and asset commands
        commands::tokens::parse_theme_tokens_bundle,
        commands::tokens::detect_theme_info,
        commands::assets::scan_theme_assets,
        commands::assets::scan_project_assets,
        // Workspace scanning
        commands::workspace::scan_monorepo,
        // Proxy config
        commands::proxy::write_proxy_target,
        commands::proxy::clear_proxy_target,
        // REMOVED: file_write commands sunset per fn-9 (context engineering pivot)
        // commands::file_write::preview_style_edits,
        // commands::file_write::write_style_edits,
        // commands::file_write::restore_from_backup,
    ]);

    // Generate TypeScript bindings in debug builds
    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../app/bindings.ts",
        )
        .expect("Failed to export TypeScript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(WatcherState::default())
        .manage(DevServerState::default())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let path = std::env::temp_dir().join("radflow-proxy-target.json");
                let _ = std::fs::remove_file(path);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
