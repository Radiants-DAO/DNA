//! Component parsing commands using SWC
//!
//! Extracts component information from TSX files including props, union types, and line locations.

use crate::types::{ComponentInfo, PropInfo, UnionTypeInfo};
use std::collections::HashMap;
use std::path::Path;
use swc_common::sync::Lrc;
use swc_common::{
    errors::{ColorConfig, Handler},
    FileName, SourceMap,
};
use swc_ecma_ast::*;
use swc_ecma_parser::{lexer::Lexer, Parser, StringInput, Syntax, TsSyntax};

/// Parser that extracts component information from TSX files
pub struct TsxParser {
    source_map: Lrc<SourceMap>,
}

impl TsxParser {
    pub fn new() -> Self {
        Self {
            source_map: Lrc::new(SourceMap::default()),
        }
    }

    /// Parse a TSX file and extract component information
    pub fn parse_file(&self, path: &Path) -> Result<Vec<ComponentInfo>, String> {
        let source = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let file_name = path.to_string_lossy().to_string();
        self.parse_source(&source, &file_name)
    }

    /// Parse TSX source code and extract component information
    pub fn parse_source(&self, source: &str, file_name: &str) -> Result<Vec<ComponentInfo>, String> {
        let fm = self.source_map.new_source_file(
            FileName::Custom(file_name.to_string()).into(),
            source.to_string(),
        );

        let handler = Handler::with_tty_emitter(
            ColorConfig::Auto,
            true,
            false,
            Some(self.source_map.clone()),
        );

        let lexer = Lexer::new(
            Syntax::Typescript(TsSyntax {
                tsx: true,
                decorators: true,
                ..Default::default()
            }),
            EsVersion::latest(),
            StringInput::from(&*fm),
            None,
        );

        let mut parser = Parser::new_from(lexer);

        for e in parser.take_errors() {
            e.into_diagnostic(&handler).emit();
        }

        let module = parser.parse_module().map_err(|e| {
            e.into_diagnostic(&handler).emit();
            "Failed to parse module".to_string()
        })?;

        let mut extractor = ComponentExtractor::new(file_name.to_string(), self.source_map.clone());
        extractor.extract(&module);

        Ok(extractor.components)
    }
}

impl Default for TsxParser {
    fn default() -> Self {
        Self::new()
    }
}

/// Extracts component information from a parsed AST
struct ComponentExtractor {
    file_name: String,
    source_map: Lrc<SourceMap>,
    components: Vec<ComponentInfo>,
    interfaces: HashMap<String, Vec<PropInfo>>,
    union_types: Vec<UnionTypeInfo>,
    default_export_name: Option<String>,
    exported_names: Vec<String>,
}

impl ComponentExtractor {
    fn new(file_name: String, source_map: Lrc<SourceMap>) -> Self {
        Self {
            file_name,
            source_map,
            components: Vec::new(),
            interfaces: HashMap::new(),
            union_types: Vec::new(),
            default_export_name: None,
            exported_names: Vec::new(),
        }
    }

    fn extract(&mut self, module: &Module) {
        // First pass: collect type aliases and interfaces
        for item in &module.body {
            match item {
                ModuleItem::Stmt(Stmt::Decl(Decl::TsTypeAlias(alias))) => {
                    self.extract_union_type(alias);
                }
                ModuleItem::Stmt(Stmt::Decl(Decl::TsInterface(iface))) => {
                    self.extract_interface(iface);
                }
                ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(export)) => {
                    if let Decl::TsTypeAlias(alias) = &export.decl {
                        self.extract_union_type(alias);
                    } else if let Decl::TsInterface(iface) = &export.decl {
                        self.extract_interface(iface);
                    }
                }
                _ => {}
            }
        }

        // Second pass: find default export
        for item in &module.body {
            match item {
                ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(export)) => {
                    if let DefaultDecl::Fn(fn_expr) = &export.decl {
                        if let Some(ident) = &fn_expr.ident {
                            self.default_export_name = Some(ident.sym.to_string());
                        }
                    }
                }
                ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultExpr(export)) => {
                    if let Expr::Ident(ident) = &*export.expr {
                        self.default_export_name = Some(ident.sym.to_string());
                    }
                }
                _ => {}
            }
        }

        // Third pass: extract function components
        for item in &module.body {
            match item {
                ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(export)) => {
                    if let Decl::Fn(fn_decl) = &export.decl {
                        self.exported_names.push(fn_decl.ident.sym.to_string());
                        self.extract_function_component(&fn_decl.ident, &fn_decl.function);
                    }
                }
                ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(export)) => {
                    if let DefaultDecl::Fn(fn_expr) = &export.decl {
                        if let Some(ident) = &fn_expr.ident {
                            self.extract_function_component(ident, &fn_expr.function);
                        }
                    }
                }
                ModuleItem::Stmt(Stmt::Decl(Decl::Fn(fn_decl))) => {
                    // Check if this is exported elsewhere
                    self.extract_function_component(&fn_decl.ident, &fn_decl.function);
                }
                _ => {}
            }
        }
    }

    fn extract_union_type(&mut self, alias: &TsTypeAliasDecl) {
        let name = alias.id.sym.to_string();

        if let TsType::TsUnionOrIntersectionType(TsUnionOrIntersectionType::TsUnionType(union)) =
            &*alias.type_ann
        {
            let values: Vec<String> = union
                .types
                .iter()
                .filter_map(|t| {
                    if let TsType::TsLitType(lit) = &**t {
                        if let TsLit::Str(s) = &lit.lit {
                            return Some(s.value.to_string_lossy().into_owned());
                        }
                    }
                    None
                })
                .collect();

            if !values.is_empty() {
                let line = self.source_map.lookup_char_pos(alias.span.lo).line as u32;
                self.union_types.push(UnionTypeInfo {
                    name,
                    values,
                    line,
                });
            }
        }
    }

    fn extract_interface(&mut self, iface: &TsInterfaceDecl) {
        let name = iface.id.sym.to_string();
        let mut props = Vec::new();

        for member in &iface.body.body {
            if let TsTypeElement::TsPropertySignature(prop) = member {
                if let Expr::Ident(ident) = &*prop.key {
                    let prop_name = ident.sym.to_string();
                    let type_ann = prop.type_ann.as_ref().map(|ann| &*ann.type_ann);
                    let type_name = type_ann
                        .map(|ann| self.type_to_string(ann))
                        .unwrap_or_else(|| "unknown".to_string());

                    // Determine if prop is required (not optional in interface)
                    let required = !prop.optional;

                    // Infer control type from TypeScript type
                    let (control_type, options) = type_ann
                        .map(|ann| self.infer_control_type(ann, &type_name))
                        .unwrap_or((None, None));

                    props.push(PropInfo {
                        name: prop_name,
                        type_name,
                        required,
                        default: None,
                        doc: None,
                        control_type,
                        options,
                    });
                }
            }
        }

        self.interfaces.insert(name, props);
    }

    /// Infer the control type for a prop based on its TypeScript type
    fn infer_control_type(&self, ts_type: &TsType, _type_name: &str) -> (Option<String>, Option<Vec<String>>) {
        match ts_type {
            TsType::TsKeywordType(kw) => match kw.kind {
                TsKeywordTypeKind::TsStringKeyword => (Some("text".to_string()), None),
                TsKeywordTypeKind::TsNumberKeyword => (Some("number".to_string()), None),
                TsKeywordTypeKind::TsBooleanKeyword => (Some("boolean".to_string()), None),
                _ => (None, None),
            },
            TsType::TsTypeRef(type_ref) => {
                // Check for React.ReactNode or ReactNode (slot type)
                let base_name = match &type_ref.type_name {
                    TsEntityName::Ident(ident) => ident.sym.to_string(),
                    TsEntityName::TsQualifiedName(qn) => qn.right.sym.to_string(),
                };
                if base_name == "ReactNode" {
                    return (Some("slot".to_string()), None);
                }

                // Check if this refers to a union type we've already parsed
                if let Some(union_info) = self.union_types.iter().find(|u| u.name == base_name) {
                    return (Some("select".to_string()), Some(union_info.values.clone()));
                }

                (None, None)
            },
            TsType::TsUnionOrIntersectionType(TsUnionOrIntersectionType::TsUnionType(union)) => {
                // Check if this is a string literal union (inline)
                let values: Vec<String> = union
                    .types
                    .iter()
                    .filter_map(|t| {
                        if let TsType::TsLitType(lit) = &**t {
                            if let TsLit::Str(s) = &lit.lit {
                                return Some(s.value.to_string_lossy().into_owned());
                            }
                        }
                        None
                    })
                    .collect();

                if !values.is_empty() {
                    return (Some("select".to_string()), Some(values));
                }

                // Check if union contains boolean types (e.g., true | false)
                let has_bool = union.types.iter().any(|t| {
                    matches!(&**t, TsType::TsLitType(lit) if matches!(&lit.lit, TsLit::Bool(_)))
                        || matches!(&**t, TsType::TsKeywordType(kw) if kw.kind == TsKeywordTypeKind::TsBooleanKeyword)
                });
                if has_bool {
                    return (Some("boolean".to_string()), None);
                }

                (None, None)
            },
            _ => (None, None),
        }
    }

    fn extract_function_component(&mut self, ident: &Ident, func: &Function) {
        let name = ident.sym.to_string();

        // Check if this looks like a React component (PascalCase)
        if !name.chars().next().map(|c| c.is_uppercase()).unwrap_or(false) {
            return;
        }

        let line = self.source_map.lookup_char_pos(func.span.lo).line as u32;
        let is_default = self.default_export_name.as_ref() == Some(&name);

        // Extract props from function parameters
        let mut props = Vec::new();
        let mut defaults = HashMap::new();

        if let Some(first_param) = func.params.first() {
            // Extract default values from destructuring pattern
            if let Pat::Object(obj_pat) = &first_param.pat {
                for prop in &obj_pat.props {
                    match prop {
                        ObjectPatProp::Assign(assign) => {
                            let prop_name = assign.key.sym.to_string();
                            if let Some(value) = &assign.value {
                                defaults.insert(prop_name, self.expr_to_string(value));
                            }
                        }
                        ObjectPatProp::KeyValue(kv) => {
                            if let PropName::Ident(key_ident) = &kv.key {
                                let prop_name = key_ident.sym.to_string();
                                if let Pat::Assign(assign) = &*kv.value {
                                    defaults.insert(prop_name, self.expr_to_string(&assign.right));
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }

            // Get type annotation to find interface name
            if let Some(type_ann) = self.get_param_type_annotation(&first_param.pat) {
                // Look up interface props
                if let Some(interface_props) = self.interfaces.get(&type_ann) {
                    for prop in interface_props {
                        let mut p = prop.clone();
                        if let Some(default) = defaults.get(&p.name) {
                            p.default = Some(default.clone());
                            // Props with defaults are not required at runtime
                            p.required = false;
                        }
                        props.push(p);
                    }
                }
            }
        }

        self.components.push(ComponentInfo {
            name,
            file: self.file_name.clone(),
            line,
            props,
            default_export: is_default,
            union_types: self.union_types.clone(),
        });
    }

    fn get_param_type_annotation(&self, pat: &Pat) -> Option<String> {
        match pat {
            Pat::Object(obj_pat) => obj_pat
                .type_ann
                .as_ref()
                .map(|ann| self.extract_type_name(&ann.type_ann)),
            _ => None,
        }
    }

    fn extract_type_name(&self, ts_type: &TsType) -> String {
        match ts_type {
            TsType::TsTypeRef(type_ref) => {
                if let TsEntityName::Ident(ident) = &type_ref.type_name {
                    return ident.sym.to_string();
                }
                "unknown".to_string()
            }
            _ => "unknown".to_string(),
        }
    }

    fn type_to_string(&self, ts_type: &TsType) -> String {
        match ts_type {
            TsType::TsKeywordType(kw) => match kw.kind {
                TsKeywordTypeKind::TsStringKeyword => "string".to_string(),
                TsKeywordTypeKind::TsNumberKeyword => "number".to_string(),
                TsKeywordTypeKind::TsBooleanKeyword => "boolean".to_string(),
                TsKeywordTypeKind::TsVoidKeyword => "void".to_string(),
                TsKeywordTypeKind::TsNullKeyword => "null".to_string(),
                TsKeywordTypeKind::TsUndefinedKeyword => "undefined".to_string(),
                TsKeywordTypeKind::TsAnyKeyword => "any".to_string(),
                _ => "unknown".to_string(),
            },
            TsType::TsTypeRef(type_ref) => {
                let base = match &type_ref.type_name {
                    TsEntityName::Ident(ident) => ident.sym.to_string(),
                    TsEntityName::TsQualifiedName(qn) => {
                        format!(
                            "{}.{}",
                            self.entity_name_to_string(&qn.left),
                            qn.right.sym
                        )
                    }
                };

                if let Some(params) = &type_ref.type_params {
                    let param_strs: Vec<String> =
                        params.params.iter().map(|p| self.type_to_string(p)).collect();
                    format!("{}<{}>", base, param_strs.join(", "))
                } else {
                    base
                }
            }
            TsType::TsUnionOrIntersectionType(TsUnionOrIntersectionType::TsUnionType(union)) => {
                let parts: Vec<String> = union.types.iter().map(|t| self.type_to_string(t)).collect();
                parts.join(" | ")
            }
            TsType::TsLitType(lit) => match &lit.lit {
                TsLit::Str(s) => format!("'{}'", s.value.to_string_lossy()),
                TsLit::Number(n) => n.value.to_string(),
                TsLit::Bool(b) => b.value.to_string(),
                _ => "literal".to_string(),
            },
            TsType::TsFnOrConstructorType(TsFnOrConstructorType::TsFnType(fn_type)) => {
                let params: Vec<String> = fn_type
                    .params
                    .iter()
                    .map(|p| match p {
                        TsFnParam::Ident(ident) => ident.id.sym.to_string(),
                        TsFnParam::Array(_) => "array".to_string(),
                        TsFnParam::Rest(_) => "rest".to_string(),
                        TsFnParam::Object(_) => "object".to_string(),
                    })
                    .collect();
                let ret = self.type_to_string(&fn_type.type_ann.type_ann);
                format!("({}) => {}", params.join(", "), ret)
            }
            TsType::TsTypeLit(_) => "object".to_string(),
            TsType::TsArrayType(arr) => {
                format!("{}[]", self.type_to_string(&arr.elem_type))
            }
            TsType::TsParenthesizedType(paren) => self.type_to_string(&paren.type_ann),
            _ => "unknown".to_string(),
        }
    }

    fn entity_name_to_string(&self, name: &TsEntityName) -> String {
        match name {
            TsEntityName::Ident(ident) => ident.sym.to_string(),
            TsEntityName::TsQualifiedName(qn) => {
                format!(
                    "{}.{}",
                    self.entity_name_to_string(&qn.left),
                    qn.right.sym
                )
            }
        }
    }

    fn expr_to_string(&self, expr: &Expr) -> String {
        match expr {
            Expr::Lit(lit) => match lit {
                Lit::Str(s) => s.value.to_string_lossy().into_owned(),
                Lit::Num(n) => n.value.to_string(),
                Lit::Bool(b) => b.value.to_string(),
                Lit::Null(_) => "null".to_string(),
                _ => "literal".to_string(),
            },
            Expr::Ident(ident) => ident.sym.to_string(),
            _ => "expression".to_string(),
        }
    }
}

/// Parse a single TSX component file and return component information
#[tauri::command]
#[specta::specta]
pub fn parse_component(path: String) -> Result<ComponentInfo, String> {
    let parser = TsxParser::new();
    let components = parser.parse_file(Path::new(&path))?;

    components
        .into_iter()
        .next()
        .ok_or_else(|| "No component found in file".to_string())
}

/// Scan a directory for TSX components and return all found components
#[tauri::command]
#[specta::specta]
pub fn scan_components(dir: String) -> Result<Vec<ComponentInfo>, String> {
    let parser = TsxParser::new();
    let mut all_components = Vec::new();

    let dir_path = Path::new(&dir);
    if !dir_path.exists() || !dir_path.is_dir() {
        return Err("Path does not exist or is not a directory".to_string());
    }

    scan_directory_recursive(&parser, dir_path, &mut all_components)?;

    Ok(all_components)
}

fn scan_directory_recursive(
    parser: &TsxParser,
    dir: &Path,
    components: &mut Vec<ComponentInfo>,
) -> Result<(), String> {
    let entries = std::fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();

        if path.is_dir() {
            // Skip node_modules and hidden directories
            let dir_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if dir_name.starts_with('.') || dir_name == "node_modules" {
                continue;
            }
            scan_directory_recursive(parser, &path, components)?;
        } else if let Some(ext) = path.extension() {
            if ext == "tsx" {
                match parser.parse_file(&path) {
                    Ok(mut file_components) => components.append(&mut file_components),
                    Err(_) => {
                        // Skip files that fail to parse
                        continue;
                    }
                }
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_button_component() {
        let source = r#"
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children }: ButtonProps) {
  return <button>{children}</button>;
}

export default Button;
"#;

        let parser = TsxParser::new();
        let components = parser.parse_source(source, "Button.tsx").unwrap();

        assert_eq!(components.len(), 1);
        let button = &components[0];

        assert_eq!(button.name, "Button");
        assert!(button.default_export);
        assert_eq!(button.union_types.len(), 2);

        // Check union types
        let variant_type = button
            .union_types
            .iter()
            .find(|u| u.name == "ButtonVariant")
            .unwrap();
        assert_eq!(
            variant_type.values,
            vec!["primary", "secondary", "outline", "ghost"]
        );

        // Check props
        assert_eq!(button.props.len(), 3);

        let variant_prop = button.props.iter().find(|p| p.name == "variant").unwrap();
        assert_eq!(variant_prop.type_name, "ButtonVariant");
        assert_eq!(variant_prop.default, Some("primary".to_string()));
        assert!(!variant_prop.required); // Has default
        assert_eq!(variant_prop.control_type, Some("select".to_string()));
        assert_eq!(
            variant_prop.options,
            Some(vec!["primary".to_string(), "secondary".to_string(), "outline".to_string(), "ghost".to_string()])
        );

        let size_prop = button.props.iter().find(|p| p.name == "size").unwrap();
        assert_eq!(size_prop.type_name, "ButtonSize");
        assert_eq!(size_prop.default, Some("md".to_string()));
        assert!(!size_prop.required); // Has default
        assert_eq!(size_prop.control_type, Some("select".to_string()));

        let children_prop = button.props.iter().find(|p| p.name == "children").unwrap();
        assert_eq!(children_prop.type_name, "React.ReactNode");
        assert!(children_prop.required); // No default, not optional
        assert_eq!(children_prop.control_type, Some("slot".to_string()));
    }

    #[test]
    fn test_line_number_tracking() {
        let source = r#"// Header comment
import React from 'react';

interface Props {
  name: string;
}

export function Hello({ name }: Props) {
  return <div>Hello {name}</div>;
}
"#;

        let parser = TsxParser::new();
        let components = parser.parse_source(source, "Hello.tsx").unwrap();

        assert_eq!(components.len(), 1);
        // Function starts on line 8
        assert_eq!(components[0].line, 8);
    }

    #[test]
    fn test_control_type_inference() {
        let source = r#"
interface ControlProps {
  text: string;
  count: number;
  enabled: boolean;
  mode: 'light' | 'dark' | 'system';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function ControlDemo({ text, count, enabled, mode, children, style }: ControlProps) {
  return <div>{children}</div>;
}
"#;

        let parser = TsxParser::new();
        let components = parser.parse_source(source, "ControlDemo.tsx").unwrap();

        assert_eq!(components.len(), 1);
        let comp = &components[0];

        // String -> text control
        let text_prop = comp.props.iter().find(|p| p.name == "text").unwrap();
        assert_eq!(text_prop.control_type, Some("text".to_string()));
        assert!(text_prop.required);

        // Number -> number control
        let count_prop = comp.props.iter().find(|p| p.name == "count").unwrap();
        assert_eq!(count_prop.control_type, Some("number".to_string()));
        assert!(count_prop.required);

        // Boolean -> boolean control
        let enabled_prop = comp.props.iter().find(|p| p.name == "enabled").unwrap();
        assert_eq!(enabled_prop.control_type, Some("boolean".to_string()));
        assert!(enabled_prop.required);

        // Inline union -> select control with options
        let mode_prop = comp.props.iter().find(|p| p.name == "mode").unwrap();
        assert_eq!(mode_prop.control_type, Some("select".to_string()));
        assert_eq!(
            mode_prop.options,
            Some(vec!["light".to_string(), "dark".to_string(), "system".to_string()])
        );
        assert!(mode_prop.required);

        // ReactNode -> slot control
        let children_prop = comp.props.iter().find(|p| p.name == "children").unwrap();
        assert_eq!(children_prop.control_type, Some("slot".to_string()));
        assert!(children_prop.required);

        // Optional complex type -> no control type
        let style_prop = comp.props.iter().find(|p| p.name == "style").unwrap();
        assert_eq!(style_prop.control_type, None);
        assert!(!style_prop.required); // Optional
    }
}
