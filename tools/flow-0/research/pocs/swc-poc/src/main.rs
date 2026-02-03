//! SWC TSX Parsing POC
//!
//! Extracts component props + file:line location for RadFlow's Component ID feature.
//! This POC validates that SWC can:
//! - Parse TSX files
//! - Extract union type definitions (ButtonVariant, ButtonSize)
//! - Extract interface props with types
//! - Identify default values from destructuring
//! - Detect default exports

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use swc_common::sync::Lrc;
use swc_common::{
    errors::{ColorConfig, Handler},
    FileName, SourceMap,
};
use swc_ecma_ast::*;
use swc_ecma_parser::{lexer::Lexer, Parser, StringInput, Syntax, TsSyntax};

/// Represents a component prop with its type and optional default value
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PropInfo {
    pub name: String,
    #[serde(rename = "type")]
    pub type_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub doc: Option<String>,
}

/// Represents a union type alias like `type ButtonVariant = 'primary' | 'secondary'`
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnionTypeInfo {
    pub name: String,
    pub values: Vec<String>,
    pub line: u32,
}

/// Represents an extracted component with its metadata
#[derive(Debug, Serialize, Deserialize)]
pub struct ComponentInfo {
    pub name: String,
    pub file: String,
    pub line: u32,
    pub props: Vec<PropInfo>,
    #[serde(rename = "defaultExport")]
    pub default_export: bool,
    #[serde(rename = "unionTypes")]
    pub union_types: Vec<UnionTypeInfo>,
}

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

        let handler = Handler::with_tty_emitter(ColorConfig::Auto, true, false, Some(self.source_map.clone()));

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

        let module = parser
            .parse_module()
            .map_err(|e| {
                e.into_diagnostic(&handler).emit();
                "Failed to parse module".to_string()
            })?;

        let mut extractor = ComponentExtractor::new(file_name.to_string(), self.source_map.clone());
        extractor.extract(&module);

        Ok(extractor.components)
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

        if let TsType::TsUnionOrIntersectionType(TsUnionOrIntersectionType::TsUnionType(union)) = &*alias.type_ann {
            let values: Vec<String> = union.types.iter()
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
                    let type_name = prop.type_ann.as_ref()
                        .map(|ann| self.type_to_string(&ann.type_ann))
                        .unwrap_or_else(|| "unknown".to_string());

                    // Extract JSDoc comment if present (simplified)
                    let doc = None; // Would need to track comments separately

                    props.push(PropInfo {
                        name: prop_name,
                        type_name,
                        default: None, // Defaults come from destructuring
                        doc,
                    });
                }
            }
        }

        self.interfaces.insert(name, props);
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
            Pat::Object(obj_pat) => {
                obj_pat.type_ann.as_ref().map(|ann| {
                    self.extract_type_name(&ann.type_ann)
                })
            }
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
            _ => "unknown".to_string()
        }
    }

    fn type_to_string(&self, ts_type: &TsType) -> String {
        match ts_type {
            TsType::TsKeywordType(kw) => {
                match kw.kind {
                    TsKeywordTypeKind::TsStringKeyword => "string".to_string(),
                    TsKeywordTypeKind::TsNumberKeyword => "number".to_string(),
                    TsKeywordTypeKind::TsBooleanKeyword => "boolean".to_string(),
                    TsKeywordTypeKind::TsVoidKeyword => "void".to_string(),
                    TsKeywordTypeKind::TsNullKeyword => "null".to_string(),
                    TsKeywordTypeKind::TsUndefinedKeyword => "undefined".to_string(),
                    TsKeywordTypeKind::TsAnyKeyword => "any".to_string(),
                    _ => "unknown".to_string(),
                }
            }
            TsType::TsTypeRef(type_ref) => {
                let base = match &type_ref.type_name {
                    TsEntityName::Ident(ident) => ident.sym.to_string(),
                    TsEntityName::TsQualifiedName(qn) => {
                        format!("{}.{}", self.entity_name_to_string(&qn.left), qn.right.sym)
                    }
                };

                if let Some(params) = &type_ref.type_params {
                    let param_strs: Vec<String> = params.params.iter()
                        .map(|p| self.type_to_string(p))
                        .collect();
                    format!("{}<{}>", base, param_strs.join(", "))
                } else {
                    base
                }
            }
            TsType::TsUnionOrIntersectionType(TsUnionOrIntersectionType::TsUnionType(union)) => {
                let parts: Vec<String> = union.types.iter()
                    .map(|t| self.type_to_string(t))
                    .collect();
                parts.join(" | ")
            }
            TsType::TsLitType(lit) => {
                match &lit.lit {
                    TsLit::Str(s) => format!("'{}'", s.value.to_string_lossy()),
                    TsLit::Number(n) => n.value.to_string(),
                    TsLit::Bool(b) => b.value.to_string(),
                    _ => "literal".to_string(),
                }
            }
            TsType::TsFnOrConstructorType(TsFnOrConstructorType::TsFnType(fn_type)) => {
                let params: Vec<String> = fn_type.params.iter()
                    .map(|p| {
                        let name = match p {
                            TsFnParam::Ident(ident) => ident.id.sym.to_string(),
                            TsFnParam::Array(_) => "array".to_string(),
                            TsFnParam::Rest(_) => "rest".to_string(),
                            TsFnParam::Object(_) => "object".to_string(),
                        };
                        name
                    })
                    .collect();
                let ret = self.type_to_string(&fn_type.type_ann.type_ann);
                format!("({}) => {}", params.join(", "), ret)
            }
            TsType::TsTypeLit(_) => "object".to_string(),
            TsType::TsArrayType(arr) => {
                format!("{}[]", self.type_to_string(&arr.elem_type))
            }
            TsType::TsParenthesizedType(paren) => {
                self.type_to_string(&paren.type_ann)
            }
            _ => "unknown".to_string(),
        }
    }

    fn entity_name_to_string(&self, name: &TsEntityName) -> String {
        match name {
            TsEntityName::Ident(ident) => ident.sym.to_string(),
            TsEntityName::TsQualifiedName(qn) => {
                format!("{}.{}", self.entity_name_to_string(&qn.left), qn.right.sym)
            }
        }
    }

    fn expr_to_string(&self, expr: &Expr) -> String {
        match expr {
            Expr::Lit(lit) => {
                match lit {
                    Lit::Str(s) => s.value.to_string_lossy().into_owned(),
                    Lit::Num(n) => n.value.to_string(),
                    Lit::Bool(b) => b.value.to_string(),
                    Lit::Null(_) => "null".to_string(),
                    _ => "literal".to_string(),
                }
            }
            Expr::Ident(ident) => ident.sym.to_string(),
            _ => "expression".to_string(),
        }
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: {} <tsx-file>", args[0]);
        std::process::exit(1);
    }

    let path = Path::new(&args[1]);
    let parser = TsxParser::new();

    match parser.parse_file(path) {
        Ok(components) => {
            let json = serde_json::to_string_pretty(&components).unwrap();
            println!("{}", json);
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(1);
        }
    }
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
        let variant_type = button.union_types.iter().find(|u| u.name == "ButtonVariant").unwrap();
        assert_eq!(variant_type.values, vec!["primary", "secondary", "outline", "ghost"]);

        // Check props
        assert_eq!(button.props.len(), 3);

        let variant_prop = button.props.iter().find(|p| p.name == "variant").unwrap();
        assert_eq!(variant_prop.type_name, "ButtonVariant");
        assert_eq!(variant_prop.default, Some("primary".to_string()));

        let size_prop = button.props.iter().find(|p| p.name == "size").unwrap();
        assert_eq!(size_prop.type_name, "ButtonSize");
        assert_eq!(size_prop.default, Some("md".to_string()));
    }

    #[test]
    fn test_parse_card_component() {
        let source = r#"
type CardVariant = 'default' | 'dark' | 'raised';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ variant = 'default', children, className = '', noPadding = false }: CardProps) {
  return <div>{children}</div>;
}

export default Card;
"#;

        let parser = TsxParser::new();
        let components = parser.parse_source(source, "Card.tsx").unwrap();

        assert_eq!(components.len(), 1);
        let card = &components[0];

        assert_eq!(card.name, "Card");
        assert!(card.default_export);

        // Check props with defaults
        let variant_prop = card.props.iter().find(|p| p.name == "variant").unwrap();
        assert_eq!(variant_prop.default, Some("default".to_string()));

        let no_padding_prop = card.props.iter().find(|p| p.name == "noPadding").unwrap();
        assert_eq!(no_padding_prop.default, Some("false".to_string()));
    }

    #[test]
    fn test_parse_react_node_type() {
        let source = r#"
interface Props {
  children: React.ReactNode;
  icon?: React.ReactElement;
}

export function Component({ children }: Props) {
  return <div>{children}</div>;
}
"#;

        let parser = TsxParser::new();
        let components = parser.parse_source(source, "Component.tsx").unwrap();

        assert_eq!(components.len(), 1);

        let children_prop = components[0].props.iter().find(|p| p.name == "children").unwrap();
        assert_eq!(children_prop.type_name, "React.ReactNode");

        let icon_prop = components[0].props.iter().find(|p| p.name == "icon").unwrap();
        assert_eq!(icon_prop.type_name, "React.ReactElement");
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
}
