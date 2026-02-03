use std::env;
use std::fs;

#[tauri::command]
#[specta::specta]
pub fn write_proxy_target(config: String) -> Result<(), String> {
    let path = env::temp_dir().join("radflow-proxy-target.json");
    fs::write(&path, config).map_err(|e| format!("Failed to write proxy config: {e}"))?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn clear_proxy_target() -> Result<(), String> {
    let path = env::temp_dir().join("radflow-proxy-target.json");
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to remove proxy config: {e}"))?;
    }
    Ok(())
}
