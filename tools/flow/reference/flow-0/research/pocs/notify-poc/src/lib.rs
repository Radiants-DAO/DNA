//! POC: notify file watching for RadFlow Tauri
//!
//! Tests the notify crate for file system watching with:
//! - Recursive directory watching
//! - File modification/creation/deletion detection
//! - Extension filtering (.css, .tsx)
//! - Debouncing (100ms)
//! - Async channel-based event handling

use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use notify_debouncer_mini::{new_debouncer, DebouncedEventKind};
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::Duration;
use tokio::sync::mpsc as tokio_mpsc;

/// File event types we care about
#[derive(Debug, Clone, PartialEq)]
pub enum FileEvent {
    Modified(PathBuf),
    Created(PathBuf),
    Removed(PathBuf),
}

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
fn event_to_file_event(event: &Event) -> Vec<FileEvent> {
    let mut events = Vec::new();

    for path in &event.paths {
        if !has_watched_extension(path) {
            continue;
        }

        let file_event = match &event.kind {
            EventKind::Create(_) => Some(FileEvent::Created(path.clone())),
            EventKind::Modify(_) => Some(FileEvent::Modified(path.clone())),
            EventKind::Remove(_) => Some(FileEvent::Removed(path.clone())),
            _ => None,
        };

        if let Some(e) = file_event {
            events.push(e);
        }
    }

    events
}

/// Simple sync watcher for testing (no debouncing)
pub fn watch_directory_sync<F>(
    path: &Path,
    callback: F,
) -> notify::Result<(RecommendedWatcher, mpsc::Receiver<notify::Result<Event>>)>
where
    F: Fn(FileEvent) + Send + 'static,
{
    let (tx, rx) = mpsc::channel();

    let mut watcher = RecommendedWatcher::new(
        move |res: notify::Result<Event>| {
            if let Ok(event) = &res {
                for file_event in event_to_file_event(event) {
                    callback(file_event);
                }
            }
            tx.send(res).ok();
        },
        Config::default(),
    )?;

    watcher.watch(path, RecursiveMode::Recursive)?;

    Ok((watcher, rx))
}

/// Async watcher with debouncing - sends events via tokio channel
pub struct AsyncFileWatcher {
    _watcher: notify_debouncer_mini::Debouncer<RecommendedWatcher>,
    rx: tokio_mpsc::UnboundedReceiver<FileEvent>,
}

impl AsyncFileWatcher {
    /// Create a new async file watcher with debouncing
    ///
    /// # Arguments
    /// * `path` - Directory to watch recursively
    /// * `debounce_ms` - Debounce duration in milliseconds (default: 100)
    pub fn new(path: &Path, debounce_ms: u64) -> notify::Result<Self> {
        let (tx, rx) = tokio_mpsc::unbounded_channel();

        let debouncer = new_debouncer(
            Duration::from_millis(debounce_ms),
            move |res: Result<Vec<notify_debouncer_mini::DebouncedEvent>, _>| {
                if let Ok(events) = res {
                    for debounced in events {
                        if debounced.kind == DebouncedEventKind::Any {
                            let path = &debounced.path;
                            if has_watched_extension(path) {
                                // Debouncer collapses to "Any" kind, treat as Modified
                                // (we detect create/remove in real-time watcher tests)
                                tx.send(FileEvent::Modified(path.clone())).ok();
                            }
                        }
                    }
                }
            },
        )?;

        // Get mutable access to watcher
        let mut debouncer = debouncer;
        debouncer.watcher().watch(path, RecursiveMode::Recursive)?;

        Ok(Self {
            _watcher: debouncer,
            rx,
        })
    }

    /// Receive the next file event (async)
    pub async fn recv(&mut self) -> Option<FileEvent> {
        self.rx.recv().await
    }

    /// Try to receive without blocking
    pub fn try_recv(&mut self) -> Option<FileEvent> {
        self.rx.try_recv().ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::Arc;
    use tempfile::TempDir;
    use tokio::time::timeout;

    /// Test: Watch directory recursively and detect file modifications
    #[test]
    fn test_watch_directory_detects_modification() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.css");
        fs::write(&test_file, "/* initial */").unwrap();

        let event_count = Arc::new(AtomicUsize::new(0));
        let event_count_clone = event_count.clone();

        let (_watcher, rx) = watch_directory_sync(temp_dir.path(), move |event| {
            if matches!(event, FileEvent::Modified(_)) {
                event_count_clone.fetch_add(1, Ordering::SeqCst);
            }
        })
        .unwrap();

        // Modify the file
        std::thread::sleep(Duration::from_millis(100));
        fs::write(&test_file, "/* modified */").unwrap();

        // Wait for event
        std::thread::sleep(Duration::from_millis(500));

        // Should have received at least one modification event
        assert!(event_count.load(Ordering::SeqCst) >= 1);

        drop(rx);
    }

    /// Test: Detect file creation
    #[test]
    fn test_detect_file_creation() {
        let temp_dir = TempDir::new().unwrap();

        let created_files = Arc::new(std::sync::Mutex::new(Vec::new()));
        let created_files_clone = created_files.clone();

        let (_watcher, rx) = watch_directory_sync(temp_dir.path(), move |event| {
            if let FileEvent::Created(path) = event {
                created_files_clone.lock().unwrap().push(path);
            }
        })
        .unwrap();

        std::thread::sleep(Duration::from_millis(100));

        // Create a new .tsx file
        let new_file = temp_dir.path().join("NewComponent.tsx");
        fs::write(&new_file, "export const Test = () => <div />;").unwrap();

        std::thread::sleep(Duration::from_millis(500));

        let files = created_files.lock().unwrap();
        assert!(files.iter().any(|p| p.ends_with("NewComponent.tsx")));

        drop(rx);
    }

    /// Test: Detect file deletion
    #[test]
    fn test_detect_file_deletion() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("delete-me.css");
        fs::write(&test_file, "/* to be deleted */").unwrap();

        let removed_files = Arc::new(std::sync::Mutex::new(Vec::new()));
        let removed_files_clone = removed_files.clone();

        let (_watcher, rx) = watch_directory_sync(temp_dir.path(), move |event| {
            if let FileEvent::Removed(path) = event {
                removed_files_clone.lock().unwrap().push(path);
            }
        })
        .unwrap();

        std::thread::sleep(Duration::from_millis(100));

        // Delete the file
        fs::remove_file(&test_file).unwrap();

        std::thread::sleep(Duration::from_millis(500));

        let files = removed_files.lock().unwrap();
        assert!(files.iter().any(|p| p.ends_with("delete-me.css")));

        drop(rx);
    }

    /// Test: Filter to only .css and .tsx files
    #[test]
    fn test_filter_extensions() {
        let temp_dir = TempDir::new().unwrap();

        let events = Arc::new(std::sync::Mutex::new(Vec::new()));
        let events_clone = events.clone();

        let (_watcher, rx) = watch_directory_sync(temp_dir.path(), move |event| {
            events_clone.lock().unwrap().push(event);
        })
        .unwrap();

        std::thread::sleep(Duration::from_millis(100));

        // Create files with different extensions
        fs::write(temp_dir.path().join("style.css"), "body {}").unwrap();
        fs::write(temp_dir.path().join("Component.tsx"), "export {}").unwrap();
        fs::write(temp_dir.path().join("data.json"), "{}").unwrap();
        fs::write(temp_dir.path().join("README.md"), "# Hi").unwrap();

        std::thread::sleep(Duration::from_millis(500));

        let events = events.lock().unwrap();

        // Should only have events for .css and .tsx
        for event in events.iter() {
            let path = match event {
                FileEvent::Created(p) | FileEvent::Modified(p) | FileEvent::Removed(p) => p,
            };
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            assert!(
                ext == "css" || ext == "tsx",
                "Unexpected extension: {}",
                ext
            );
        }

        drop(rx);
    }

    /// Test: Async watcher with debouncing
    #[tokio::test]
    async fn test_async_debounced_watcher() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("debounce-test.css");
        fs::write(&test_file, "/* initial */").unwrap();

        let mut watcher = AsyncFileWatcher::new(temp_dir.path(), 100).unwrap();

        // Make multiple rapid changes
        tokio::time::sleep(Duration::from_millis(100)).await;
        for i in 0..5 {
            fs::write(&test_file, format!("/* change {} */", i)).unwrap();
            tokio::time::sleep(Duration::from_millis(10)).await;
        }

        // Wait for debounce to settle
        tokio::time::sleep(Duration::from_millis(300)).await;

        // Should receive debounced events (fewer than 5)
        let mut event_count = 0;
        while let Ok(Some(_event)) = timeout(Duration::from_millis(100), watcher.recv()).await {
            event_count += 1;
        }

        // Debouncing should collapse rapid changes
        assert!(event_count > 0, "Should receive at least one event");
        assert!(event_count < 5, "Debouncing should reduce event count");
    }

    /// Test: Recursive directory watching
    #[test]
    fn test_recursive_watch() {
        let temp_dir = TempDir::new().unwrap();
        let subdir = temp_dir.path().join("components").join("core");
        fs::create_dir_all(&subdir).unwrap();

        let events = Arc::new(std::sync::Mutex::new(Vec::new()));
        let events_clone = events.clone();

        let (_watcher, rx) = watch_directory_sync(temp_dir.path(), move |event| {
            events_clone.lock().unwrap().push(event);
        })
        .unwrap();

        std::thread::sleep(Duration::from_millis(100));

        // Create file in nested directory
        fs::write(subdir.join("Button.tsx"), "export const Button = () => null;").unwrap();

        std::thread::sleep(Duration::from_millis(500));

        let events = events.lock().unwrap();
        assert!(events.iter().any(|e| {
            match e {
                FileEvent::Created(p) | FileEvent::Modified(p) => p.ends_with("Button.tsx"),
                _ => false,
            }
        }));

        drop(rx);
    }

    /// Test: Channel-based async handling
    #[tokio::test]
    async fn test_async_channel_handling() {
        let temp_dir = TempDir::new().unwrap();

        let mut watcher = AsyncFileWatcher::new(temp_dir.path(), 50).unwrap();

        // Create a file
        tokio::time::sleep(Duration::from_millis(100)).await;
        fs::write(temp_dir.path().join("async-test.css"), "/* test */").unwrap();

        // Receive via async channel
        let event = timeout(Duration::from_secs(2), watcher.recv())
            .await
            .expect("Should receive event within timeout")
            .expect("Should have event");

        assert!(matches!(event, FileEvent::Modified(_)));
    }
}
