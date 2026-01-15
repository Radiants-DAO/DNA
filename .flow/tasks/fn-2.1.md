# fn-2.1 Tauri shell + tauri-specta IPC setup

## Description

Scaffold the Tauri 2.0 application with React frontend and set up tauri-specta for type-safe IPC between Rust and TypeScript.

## Technical Details

1. **Initialize Tauri app**
   - `pnpm create tauri-app` with React + TypeScript template
   - Configure for Tauri 2.0 stable
   - Set up project structure per `/docs/features/10-tauri-architecture.md`

2. **Set up tauri-specta**
   - Add `tauri-specta` and `specta` crates
   - Configure binding generation in `build.rs`
   - Generate TypeScript types to `src/bindings.ts`
   - Only generate in debug builds (`#[cfg(debug_assertions)]`)

3. **Create sample commands**
   - `greet(name: String) -> String` - basic test
   - `get_version() -> String` - app version
   - Verify TypeScript types auto-complete in frontend

4. **Frontend setup**
   - React 18 + TypeScript
   - Tailwind CSS v4 with @theme support
   - Basic App.tsx that calls Rust commands

## References

- tauri-specta docs: https://specta.dev/docs/tauri-specta/v2
- Tauri 2.0 guide: https://tauri.app/start/
- Project structure: `/docs/features/10-tauri-architecture.md:462-498`
## Acceptance
- [ ] `pnpm tauri dev` launches app successfully
- [ ] Rust command callable from React with full TypeScript types
- [ ] TypeScript bindings auto-generated from Rust command signatures
- [ ] Tailwind v4 styles working in frontend
- [ ] No TypeScript errors in frontend code
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
