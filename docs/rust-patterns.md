# Rust Crate Patterns

Reference patterns for RadFlow Tauri's Rust backend. Read when implementing, not every conversation.

---

## lightningcss — CSS Token Extraction

```toml
# Cargo.toml
lightningcss = { version = "1.0", features = ["into_owned"] }
```

```rust
use lightningcss::{
    stylesheet::{StyleSheet, ParserOptions, PrinterOptions},
    rules::CssRule,
    traits::ToCss,
};

// Parse a CSS file
fn parse_css(source: &str) -> Result<StyleSheet, Error> {
    StyleSheet::parse(source, ParserOptions::default())
}

// Extract all rules
fn extract_tokens(stylesheet: &StyleSheet) -> Vec<Token> {
    let mut tokens = Vec::new();

    for rule in &stylesheet.rules.0 {
        match rule {
            CssRule::Style(style_rule) => {
                // Access declarations
                for (property, value) in &style_rule.declarations.declarations {
                    // property is the CSS property name
                    // value is the parsed value
                }
            }
            CssRule::Property(custom_prop) => {
                // @property rules (CSS custom property definitions)
            }
            _ => {}
        }
    }
    tokens
}

// Parse a single rule (useful for testing)
let rule = CssRule::parse_string(
    ".foo { color: red; }",
    ParserOptions::default()
).unwrap();

// Serialize back to CSS
let css_string = rule.to_css_string(PrinterOptions::default()).unwrap();
```

**Key types:**
- `StyleSheet` — parsed CSS file
- `CssRule` — individual rule (Style, Property, Media, etc.)
- `DeclarationBlock` — properties within a rule
- `into_owned()` — clone string refs for longer lifetime

**Docs:** https://docs.rs/lightningcss

---

## swc_ecma_parser — Component Extraction

```toml
# Cargo.toml
swc_ecma_parser = { version = "0.149", features = ["typescript"] }
swc_ecma_ast = "0.118"
swc_common = "0.37"
```

```rust
use swc_common::{sync::Lrc, SourceMap, FileName};
use swc_ecma_parser::{lexer::Lexer, Parser, Syntax, TsSyntax, StringInput};
use swc_ecma_ast::{Module, ModuleItem, Decl, ExportDecl, DefaultDecl};

fn parse_tsx(source: &str, filename: &str) -> Result<Module, Error> {
    let cm: Lrc<SourceMap> = Default::default();
    let fm = cm.new_source_file(
        FileName::Custom(filename.into()).into(),
        source.into(),
    );

    let lexer = Lexer::new(
        Syntax::Typescript(TsSyntax {
            tsx: true,
            decorators: true,
            ..Default::default()
        }),
        Default::default(),
        StringInput::from(&*fm),
        None,
    );

    let mut parser = Parser::new_from(lexer);
    parser.parse_module()
}

// Find default export (React component)
fn find_default_export(module: &Module) -> Option<&str> {
    for item in &module.body {
        match item {
            ModuleItem::ModuleDecl(decl) => {
                // export default function Button() {}
                // export default Button
            }
            _ => {}
        }
    }
    None
}

// Extract props from: interface ButtonProps { ... }
fn find_props_interface(module: &Module, name: &str) -> Option<Vec<Prop>> {
    for item in &module.body {
        if let ModuleItem::Stmt(Stmt::Decl(Decl::TsInterface(interface))) = item {
            if interface.id.sym.as_ref() == name {
                // Extract properties from interface.body.body
            }
        }
    }
    None
}
```

**Key types:**
- `Module` — parsed file AST
- `ModuleItem` — top-level item (import, export, statement)
- `TsInterfaceDecl` — TypeScript interface
- `TsPropertySignature` — interface property

**Docs:** https://rustdoc.swc.rs/swc_ecma_parser/

---

## tauri-plugin-fs — File Watching

```toml
# Cargo.toml
tauri-plugin-fs = { version = "2.0", features = ["watch"] }
```

```rust
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

```typescript
// Frontend: watch for file changes
import { watch } from '@tauri-apps/plugin-fs';

const stopWatching = await watch(
  '/path/to/theme',
  (event) => {
    console.log('File changed:', event);
    // event.type: 'create' | 'modify' | 'remove' | ...
    // event.paths: string[]
  },
  { recursive: true }
);

// Later: stop watching
stopWatching();
```

```rust
// Backend: read/write files
use std::fs;

#[tauri::command]
fn read_css(path: &str) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_css(path: &str, content: &str) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}
```

**Docs:** https://v2.tauri.app/plugin/file-system/

---

## fuzzy-matcher — Component Search

```toml
# Cargo.toml
fuzzy-matcher = "0.3"
```

```rust
use fuzzy_matcher::FuzzyMatcher;
use fuzzy_matcher::skim::SkimMatcherV2;

#[tauri::command]
fn search_components(query: &str, components: Vec<Component>) -> Vec<Component> {
    let matcher = SkimMatcherV2::default();

    let mut results: Vec<_> = components
        .into_iter()
        .filter_map(|c| {
            matcher.fuzzy_match(&c.name, query)
                .map(|score| (c, score))
        })
        .collect();

    // Sort by score descending
    results.sort_by(|a, b| b.1.cmp(&a.1));

    results.into_iter().map(|(c, _)| c).collect()
}
```

For ~200 components, this is instant. No indexing needed.

---

## Git CLI — Simple Wrapper

```rust
use std::process::Command;

#[tauri::command]
fn git_status(repo_path: &str) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(repo_path)
        .args(["status", "--porcelain"])
        .output()
        .map_err(|e| e.to_string())?;

    String::from_utf8(output.stdout).map_err(|e| e.to_string())
}

#[tauri::command]
fn git_commit(repo_path: &str, message: &str, files: Vec<String>) -> Result<(), String> {
    // Stage files
    let mut args = vec!["add"];
    args.extend(files.iter().map(|s| s.as_str()));

    Command::new("git")
        .current_dir(repo_path)
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;

    // Commit
    Command::new("git")
        .current_dir(repo_path)
        .args(["commit", "-m", message])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn git_diff(repo_path: &str, file: Option<&str>) -> Result<String, String> {
    let mut args = vec!["diff"];
    if let Some(f) = file {
        args.push(f);
    }

    let output = Command::new("git")
        .current_dir(repo_path)
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;

    String::from_utf8(output.stdout).map_err(|e| e.to_string())
}
```

No git2 crate needed. Simpler, smaller binary, same functionality.
