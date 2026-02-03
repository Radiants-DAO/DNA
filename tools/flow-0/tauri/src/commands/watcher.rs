//! File watcher commands using notify
//!
//! Provides file system watching for CSS and TSX files with debouncing.

use crate::types::FileEvent;
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

/// Debounce duration for file events (prevents rapid re-parsing)
const DEBOUNCE_MS: u64 = 100;

/// Extensions we watch for theme files
const WATCHED_EXTENSIONS: &[&str] = &["css", "tsx"];

/// Check if a path has a watched extension
fn has_watched_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| WATCHED_EXTENSIONS.contains(&ext))
        .unwrap_or(false)
}

/// Convert notify event to our FileEvent, filtering by extension
fn event_to_file_events(event: &Event) -> Vec<FileEvent> {
    let mut events = Vec::new();

    for path in &event.paths {
        if !has_watched_extension(path) {
            continue;
        }

        let path_str = path.to_string_lossy().to_string();
        let file_event = match &event.kind {
            EventKind::Create(_) => Some(FileEvent::Created(path_str)),
            EventKind::Modify(_) => Some(FileEvent::Modified(path_str)),
            EventKind::Remove(_) => Some(FileEvent::Removed(path_str)),
            _ => None,
        };

        if let Some(e) = file_event {
            events.push(e);
        }
    }

    events
}

/// State for managing the file watcher
pub struct WatcherState {
    watcher: Arc<Mutex<Option<RecommendedWatcher>>>,
    watched_path: Arc<Mutex<Option<String>>>,
}

impl Default for WatcherState {
    fn default() -> Self {
        Self {
            watcher: Arc::new(Mutex::new(None)),
            watched_path: Arc::new(Mutex::new(None)),
        }
    }
}

/// Start watching a directory for file changes
/// Emits "file-changed" events to the frontend
#[tauri::command]
#[specta::specta]
pub fn start_watcher(
    path: String,
    app: AppHandle,
    state: State<'_, WatcherState>,
) -> Result<(), String> {
    let watch_path = Path::new(&path);

    if !watch_path.exists() || !watch_path.is_dir() {
        return Err("Path does not exist or is not a directory".to_string());
    }

    // Stop existing watcher if any
    {
        let mut watcher_guard = state
            .watcher
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        *watcher_guard = None;
    }

    // Create new watcher with debouncing
    let app_handle = app.clone();
    let config = Config::default().with_poll_interval(Duration::from_millis(DEBOUNCE_MS));

    let watcher = RecommendedWatcher::new(
        move |res: notify::Result<Event>| {
            if let Ok(event) = res {
                for file_event in event_to_file_events(&event) {
                    // Emit event to frontend
                    let _ = app_handle.emit("file-changed", &file_event);
                }
            }
        },
        config,
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    // Store the watcher
    {
        let mut watcher_guard = state
            .watcher
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let mut w = watcher;
        w.watch(watch_path, RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch path: {}", e))?;

        *watcher_guard = Some(w);
    }

    // Store the watched path
    {
        let mut path_guard = state
            .watched_path
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        *path_guard = Some(path);
    }

    Ok(())
}

/// Stop the file watcher
#[tauri::command]
#[specta::specta]
pub fn stop_watcher(state: State<'_, WatcherState>) -> Result<(), String> {
    {
        let mut watcher_guard = state
            .watcher
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        *watcher_guard = None;
    }

    {
        let mut path_guard = state
            .watched_path
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        *path_guard = None;
    }

    Ok(())
}

/// Get the currently watched path, if any
#[tauri::command]
#[specta::specta]
pub fn get_watched_path(state: State<'_, WatcherState>) -> Result<Option<String>, String> {
    let path_guard = state
        .watched_path
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    Ok(path_guard.clone())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_has_watched_extension() {
        assert!(has_watched_extension(Path::new("Button.tsx")));
        assert!(has_watched_extension(Path::new("styles.css")));
        assert!(!has_watched_extension(Path::new("data.json")));
        assert!(!has_watched_extension(Path::new("README.md")));
        assert!(!has_watched_extension(Path::new("file")));
    }

    #[test]
    fn test_event_to_file_events_filters_extensions() {
        use notify::event::{CreateKind, ModifyKind, RemoveKind};
        use std::path::PathBuf;

        // CSS file should be included
        let css_event = Event {
            kind: EventKind::Create(CreateKind::File),
            paths: vec![PathBuf::from("/project/styles.css")],
            attrs: Default::default(),
        };
        let events = event_to_file_events(&css_event);
        assert_eq!(events.len(), 1);

        // TSX file should be included
        let tsx_event = Event {
            kind: EventKind::Modify(ModifyKind::Data(notify::event::DataChange::Content)),
            paths: vec![PathBuf::from("/project/Button.tsx")],
            attrs: Default::default(),
        };
        let events = event_to_file_events(&tsx_event);
        assert_eq!(events.len(), 1);

        // JSON file should be excluded
        let json_event = Event {
            kind: EventKind::Remove(RemoveKind::File),
            paths: vec![PathBuf::from("/project/config.json")],
            attrs: Default::default(),
        };
        let events = event_to_file_events(&json_event);
        assert_eq!(events.len(), 0);
    }
}
