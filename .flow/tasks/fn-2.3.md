# fn-2.3 Rust backend: integrate POCs (SWC, lightningcss, notify)

## Description

Integrate the validated POCs (SWC, lightningcss, notify) into the Tauri backend as a unified module with Tauri commands.

## Technical Details

1. **Port POC code**
   - Copy core logic from `/research/pocs/swc-poc/src/main.rs`
   - Copy core logic from `/research/pocs/lightningcss-poc/src/main.rs`
   - Copy core logic from `/research/pocs/notify-poc/src/lib.rs`
   - Organize into `src-tauri/src/` modules

2. **Tauri commands**
   ```rust
   #[tauri::command]
   fn parse_component(path: String) -> Result<ComponentInfo, String>
   
   #[tauri::command]
   fn parse_tokens(css_path: String) -> Result<ThemeTokens, String>
   
   #[tauri::command]
   fn scan_components(dir: String) -> Result<Vec<ComponentInfo>, String>
   ```

3. **Types for tauri-specta**
   - All return types must derive `Serialize`, `specta::Type`
   - Use `Result<T, String>` for error handling
   - Keep types flat for TypeScript generation

4. **Module structure**
   ```
   src-tauri/src/
   ├── main.rs
   ├── commands/
   │   ├── mod.rs
   │   ├── components.rs  (SWC parsing)
   │   ├── tokens.rs      (lightningcss)
   │   └── watcher.rs     (notify)
   └── types/
       └── mod.rs
   ```

## References

- SWC POC: `/research/pocs/swc-poc/src/main.rs:22-53` (types)
- lightningcss POC: `/research/pocs/lightningcss-poc/src/main.rs:12-18` (ThemeTokens)
- notify POC: `/research/pocs/notify-poc/src/lib.rs:17-23` (FileEvent)
## Acceptance
- [ ] `parse_component` command returns ComponentInfo with name, file, line
- [ ] `parse_tokens` command returns inline and public token maps
- [ ] `scan_components` command scans directory and returns component list
- [ ] All commands have TypeScript types via tauri-specta
- [ ] Rust tests pass for each command
- [ ] Commands work with theme-rad-os test target
## Done summary
- Integrated SWC TSX parsing: `parse_component` and `scan_components` commands
- Integrated lightningcss token parsing: `parse_tokens` command for @theme blocks
- Integrated notify file watching: `start_watcher`, `stop_watcher`, `get_watched_path` commands
- All types derive Serialize + specta::Type for TypeScript generation

Why:
- Enables frontend to parse TSX components and get file:line locations
- Enables frontend to extract design tokens from Tailwind v4 CSS
- Enables real-time file change notifications for live updates

Verification:
- `cargo build` passes with no warnings
- `cargo test` passes all 7 unit tests
- TypeScript bindings auto-generated to src/bindings.ts
## Evidence
- Commits: c4fcd56a8446c019f880d1e7df1bf0d5f5bd2bab
- Tests: cargo test
- PRs: