//! Dev server management commands
//!
//! Start, stop, and monitor development servers for target projects.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::io::{BufRead, BufReader};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

/// Server state for display
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "state")]
pub enum ServerStatus {
    #[serde(rename = "stopped")]
    Stopped,
    #[serde(rename = "starting")]
    Starting { logs: Vec<String> },
    #[serde(rename = "running")]
    Running { port: u16, pid: u32 },
    #[serde(rename = "error")]
    Error { message: String, logs: Vec<String> },
}

/// Log line emitted by the dev server
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ServerLog {
    pub line: String,
    pub timestamp: u64,
    #[serde(rename = "isError")]
    pub is_error: bool,
}

/// Internal state for the dev server process
struct DevServerProcess {
    child: Child,
    #[allow(dead_code)]
    port: u16,
    #[allow(dead_code)]
    project_path: String,
    logs: Vec<String>,
}

/// State for managing the dev server
pub struct DevServerState {
    process: Arc<Mutex<Option<DevServerProcess>>>,
    status: Arc<Mutex<ServerStatus>>,
}

impl Default for DevServerState {
    fn default() -> Self {
        Self {
            process: Arc::new(Mutex::new(None)),
            status: Arc::new(Mutex::new(ServerStatus::Stopped)),
        }
    }
}

/// Check if a port is already in use by making an HTTP request
fn check_port_in_use(port: u16) -> bool {
    // Try to connect to localhost:port
    std::net::TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
        Duration::from_millis(500),
    )
    .is_ok()
}

/// Start the dev server for a project
#[tauri::command]
#[specta::specta]
pub async fn start_dev_server(
    path: String,
    command: String,
    port: u16,
    app: AppHandle,
    state: State<'_, DevServerState>,
) -> Result<(), String> {
    // Check if already running
    {
        let process_guard = state
            .process
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        if process_guard.is_some() {
            return Err("Dev server already running. Stop it first.".to_string());
        }
    }

    // Check if port is already in use (existing server)
    if check_port_in_use(port) {
        // Update status to running with external server
        {
            let mut status_guard = state
                .status
                .lock()
                .map_err(|e| format!("Lock error: {}", e))?;
            *status_guard = ServerStatus::Running { port, pid: 0 };
        }

        // Emit warning about using existing server
        let _ = app.emit(
            "dev-server-log",
            ServerLog {
                line: format!(
                    "Using existing dev server on port {}. RadFlow did not start this server.",
                    port
                ),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
                is_error: false,
            },
        );

        return Ok(());
    }

    // Update status to starting
    {
        let mut status_guard = state
            .status
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        *status_guard = ServerStatus::Starting { logs: vec![] };
    }

    // Parse the command (e.g., "pnpm dev" -> shell execution)
    // Use shell to handle the command properly
    let child = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", &command])
            .current_dir(&path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
    } else {
        Command::new("sh")
            .args(["-c", &command])
            .current_dir(&path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
    };

    let mut child = child.map_err(|e| format!("Failed to start dev server: {}", e))?;

    let pid = child.id();

    // Set up stdout/stderr readers
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    // Store the process
    {
        let mut process_guard = state
            .process
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        *process_guard = Some(DevServerProcess {
            child,
            port,
            project_path: path.clone(),
            logs: vec![],
        });
    }

    // Clone handles for async streaming
    let app_stdout = app.clone();
    let app_stderr = app.clone();
    let status_stdout = state.status.clone();
    let status_stderr = state.status.clone();
    let process_handle = state.process.clone();

    // Spawn thread to read stdout
    if let Some(stdout) = stdout {
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let timestamp = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as u64;

                    // Check if server is ready (Next.js outputs "Ready" or "started server")
                    let is_ready = line.contains("Ready")
                        || line.contains("started server")
                        || line.contains("Local:");

                    if is_ready {
                        if let Ok(mut status_guard) = status_stdout.lock() {
                            *status_guard = ServerStatus::Running { port, pid };
                        }
                    }

                    // Store log in process state
                    if let Ok(mut process_guard) = process_handle.lock() {
                        if let Some(ref mut proc) = *process_guard {
                            proc.logs.push(line.clone());
                            // Keep only last 1000 lines
                            if proc.logs.len() > 1000 {
                                proc.logs.remove(0);
                            }
                        }
                    }

                    let _ = app_stdout.emit(
                        "dev-server-log",
                        ServerLog {
                            line,
                            timestamp,
                            is_error: false,
                        },
                    );
                }
            }
        });
    }

    // Spawn thread to read stderr
    if let Some(stderr) = stderr {
        std::thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let timestamp = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as u64;

                    // Check for fatal errors
                    let is_fatal = line.contains("EADDRINUSE")
                        || line.contains("Error:")
                        || line.contains("error:");

                    if is_fatal {
                        if let Ok(mut status_guard) = status_stderr.lock() {
                            if let ServerStatus::Starting { logs } = &*status_guard {
                                let mut logs = logs.clone();
                                logs.push(line.clone());
                                *status_guard = ServerStatus::Error {
                                    message: line.clone(),
                                    logs,
                                };
                            }
                        }
                    }

                    let _ = app_stderr.emit(
                        "dev-server-log",
                        ServerLog {
                            line,
                            timestamp,
                            is_error: true,
                        },
                    );
                }
            }
        });
    }

    Ok(())
}

/// Stop the dev server
#[tauri::command]
#[specta::specta]
pub fn stop_dev_server(state: State<'_, DevServerState>) -> Result<(), String> {
    let mut process_guard = state
        .process
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if let Some(mut proc) = process_guard.take() {
        // Kill the process
        let _ = proc.child.kill();
        let _ = proc.child.wait();
    }

    // Update status
    {
        let mut status_guard = state
            .status
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        *status_guard = ServerStatus::Stopped;
    }

    Ok(())
}

/// Get the current dev server status
#[tauri::command]
#[specta::specta]
pub fn get_dev_server_status(state: State<'_, DevServerState>) -> Result<ServerStatus, String> {
    let status_guard = state
        .status
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    Ok(status_guard.clone())
}

/// Get recent dev server logs
#[tauri::command]
#[specta::specta]
pub fn get_dev_server_logs(state: State<'_, DevServerState>) -> Result<Vec<String>, String> {
    let process_guard = state
        .process
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if let Some(ref proc) = *process_guard {
        Ok(proc.logs.clone())
    } else {
        Ok(vec![])
    }
}

/// Check if the dev server is healthy (port responding)
#[tauri::command]
#[specta::specta]
pub fn check_dev_server_health(port: u16) -> Result<bool, String> {
    Ok(check_port_in_use(port))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_server_status_serialization() {
        let stopped = ServerStatus::Stopped;
        let json = serde_json::to_string(&stopped).unwrap();
        assert!(json.contains("stopped"));

        let running = ServerStatus::Running { port: 3000, pid: 123 };
        let json = serde_json::to_string(&running).unwrap();
        assert!(json.contains("running"));
        assert!(json.contains("3000"));
    }
}
