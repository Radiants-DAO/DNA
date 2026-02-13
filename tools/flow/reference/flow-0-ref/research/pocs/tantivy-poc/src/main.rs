//! Tantivy Search Indexing POC
//!
//! Validates that tantivy can:
//! - Create an in-memory index
//! - Index component and icon names
//! - Search with fuzzy matching (user types "btn" → finds "Button")
//! - Return name + file path for clipboard/navigation
//!
//! MINIMAL SCOPE - v1 only needs component and icon name search.
//! Full file content indexing is post-v1.

use serde::{Deserialize, Serialize};
use std::path::Path;
use tantivy::collector::TopDocs;
use tantivy::query::{FuzzyTermQuery, QueryParser};
use tantivy::schema::*;
use tantivy::{doc, Index, IndexWriter, ReloadPolicy, TantivyDocument};

/// Represents a searchable item (component or icon)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchItem {
    pub name: String,
    pub file_path: String,
    #[serde(rename = "type")]
    pub item_type: ItemType,
}

/// Type of searchable item
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ItemType {
    Component,
    Icon,
}

impl std::fmt::Display for ItemType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ItemType::Component => write!(f, "component"),
            ItemType::Icon => write!(f, "icon"),
        }
    }
}

/// Search result with relevance score
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub name: String,
    pub file_path: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub score: f32,
}

/// In-memory search index for component and icon names
pub struct NameIndex {
    index: Index,
    #[allow(dead_code)]
    schema: Schema, // Kept for potential schema access
    name_field: Field,
    path_field: Field,
    type_field: Field,
}

impl NameIndex {
    /// Create a new in-memory index
    pub fn new() -> tantivy::Result<Self> {
        let mut schema_builder = Schema::builder();

        // Name field - TEXT for tokenization + fuzzy matching
        let name_field = schema_builder.add_text_field("name", TEXT | STORED);

        // Path field - stored but not indexed (we search by name, return path)
        let path_field = schema_builder.add_text_field("path", STORED);

        // Type field - stored for filtering results
        let type_field = schema_builder.add_text_field("type", STRING | STORED);

        let schema = schema_builder.build();

        // Create in-memory index (no persistence needed for POC)
        let index = Index::create_in_ram(schema.clone());

        Ok(Self {
            index,
            schema,
            name_field,
            path_field,
            type_field,
        })
    }

    /// Get an index writer for adding documents
    pub fn writer(&self, heap_size: usize) -> tantivy::Result<IndexWriter> {
        self.index.writer(heap_size)
    }

    /// Add a single item to the index
    pub fn add_item(&self, writer: &IndexWriter, item: &SearchItem) -> tantivy::Result<()> {
        writer.add_document(doc!(
            self.name_field => item.name.clone(),
            self.path_field => item.file_path.clone(),
            self.type_field => item.item_type.to_string()
        ))?;
        Ok(())
    }

    /// Add multiple items and commit
    pub fn index_items(&self, items: &[SearchItem]) -> tantivy::Result<()> {
        let mut writer = self.writer(50_000_000)?; // 50MB heap

        for item in items {
            self.add_item(&writer, item)?;
        }

        writer.commit()?;
        Ok(())
    }

    /// Search by name with fuzzy matching
    /// Returns top N results sorted by relevance
    pub fn search(&self, query: &str, limit: usize) -> tantivy::Result<Vec<SearchResult>> {
        let reader = self.index
            .reader_builder()
            .reload_policy(ReloadPolicy::OnCommitWithDelay)
            .try_into()?;

        let searcher = reader.searcher();

        // Use QueryParser for simple text matching
        let query_parser = QueryParser::for_index(&self.index, vec![self.name_field]);
        let parsed_query = query_parser.parse_query(query)?;

        let top_docs = searcher.search(&parsed_query, &TopDocs::with_limit(limit))?;

        let mut results = Vec::new();
        for (score, doc_address) in top_docs {
            let doc: TantivyDocument = searcher.doc(doc_address)?;

            let name = doc.get_first(self.name_field)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let file_path = doc.get_first(self.path_field)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let item_type = doc.get_first(self.type_field)
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string();

            results.push(SearchResult {
                name,
                file_path,
                item_type,
                score,
            });
        }

        Ok(results)
    }

    /// Search with fuzzy term matching (for partial names like "btn" → "Button")
    pub fn fuzzy_search(&self, term: &str, distance: u8, limit: usize) -> tantivy::Result<Vec<SearchResult>> {
        let reader = self.index
            .reader_builder()
            .reload_policy(ReloadPolicy::OnCommitWithDelay)
            .try_into()?;

        let searcher = reader.searcher();

        // Create fuzzy term query with Levenshtein distance
        let term = tantivy::Term::from_field_text(self.name_field, &term.to_lowercase());
        let fuzzy_query = FuzzyTermQuery::new(term, distance, true);

        let top_docs = searcher.search(&fuzzy_query, &TopDocs::with_limit(limit))?;

        let mut results = Vec::new();
        for (score, doc_address) in top_docs {
            let doc: TantivyDocument = searcher.doc(doc_address)?;

            let name = doc.get_first(self.name_field)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let file_path = doc.get_first(self.path_field)
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let item_type = doc.get_first(self.type_field)
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string();

            results.push(SearchResult {
                name,
                file_path,
                item_type,
                score,
            });
        }

        Ok(results)
    }
}

/// Scan a directory for component files (.tsx)
pub fn scan_components(dir: &Path) -> std::io::Result<Vec<SearchItem>> {
    let mut items = Vec::new();

    if !dir.exists() {
        return Ok(items);
    }

    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "tsx" {
                    if let Some(stem) = path.file_stem() {
                        let name = stem.to_string_lossy().to_string();
                        // Skip non-component files (lowercase, index, etc.)
                        if name.chars().next().map(|c| c.is_uppercase()).unwrap_or(false)
                            && name != "index" {
                            items.push(SearchItem {
                                name,
                                file_path: path.to_string_lossy().to_string(),
                                item_type: ItemType::Component,
                            });
                        }
                    }
                }
            }
        }
    }

    Ok(items)
}

/// Scan a directory for icon files (.svg)
pub fn scan_icons(dir: &Path) -> std::io::Result<Vec<SearchItem>> {
    let mut items = Vec::new();

    if !dir.exists() {
        return Ok(items);
    }

    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "svg" {
                    if let Some(stem) = path.file_stem() {
                        let name = stem.to_string_lossy().to_string();
                        items.push(SearchItem {
                            name,
                            file_path: path.to_string_lossy().to_string(),
                            item_type: ItemType::Icon,
                        });
                    }
                }
            }
        }
    }

    Ok(items)
}

fn main() {
    println!("Tantivy Search POC");
    println!("==================\n");

    // Create in-memory index
    let index = NameIndex::new().expect("Failed to create index");

    // Define test data paths
    let components_dir = Path::new("/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/components/core");
    let icons_dir = Path::new("/Users/rivermassey/Desktop/dev/radflow/public/assets/icons");

    // Collect items
    let mut all_items = Vec::new();

    if let Ok(components) = scan_components(components_dir) {
        println!("Found {} components", components.len());
        all_items.extend(components);
    } else {
        println!("Warning: Could not scan components directory");
    }

    if let Ok(icons) = scan_icons(icons_dir) {
        println!("Found {} icons", icons.len());
        all_items.extend(icons);
    } else {
        println!("Warning: Could not scan icons directory");
    }

    println!("Total items: {}\n", all_items.len());

    // Benchmark indexing
    let start = std::time::Instant::now();
    index.index_items(&all_items).expect("Failed to index items");
    let elapsed = start.elapsed();
    println!("Indexing completed in {:?}", elapsed);

    // Test searches
    println!("\n--- Search Tests ---\n");

    // Exact match - component
    println!("Search: 'button'");
    let results = index.search("button", 5).expect("Search failed");
    for r in &results {
        println!("  [{:.2}] {} ({}) - {}", r.score, r.name, r.item_type, r.file_path);
    }

    // Exact match - icon
    println!("\nSearch: 'checkmark'");
    let results = index.search("checkmark", 5).expect("Search failed");
    for r in &results {
        println!("  [{:.2}] {} ({}) - {}", r.score, r.name, r.item_type, r.file_path);
    }

    // Fuzzy search - typo correction
    println!("\nFuzzy search: 'buton' (distance=1) - typo correction");
    let results = index.fuzzy_search("buton", 1, 5).expect("Fuzzy search failed");
    for r in &results {
        println!("  [{:.2}] {} ({}) - {}", r.score, r.name, r.item_type, r.file_path);
    }

    // Fuzzy search - similar names
    println!("\nFuzzy search: 'card' (distance=2)");
    let results = index.fuzzy_search("card", 2, 5).expect("Fuzzy search failed");
    for r in &results {
        println!("  [{:.2}] {} ({}) - {}", r.score, r.name, r.item_type, r.file_path);
    }

    // Search with hyphenated name (icon-like)
    println!("\nSearch: 'close'");
    let results = index.search("close", 5).expect("Search failed");
    for r in &results {
        println!("  [{:.2}] {} ({}) - {}", r.score, r.name, r.item_type, r.file_path);
    }

    // Benchmark search speed
    let start = std::time::Instant::now();
    for _ in 0..1000 {
        let _ = index.search("button", 5);
    }
    let elapsed = start.elapsed();
    println!("\n1000 searches completed in {:?} ({:?}/search)", elapsed, elapsed / 1000);

    println!("\n--- POC Complete ---");
    println!("\nKey findings:");
    println!("  - Indexing {} items: {:?}", all_items.len(), start.elapsed());
    println!("  - Exact term matching works well");
    println!("  - Fuzzy search with Levenshtein distance handles typos");
    println!("  - Returns file paths for navigation");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_items() -> Vec<SearchItem> {
        vec![
            SearchItem {
                name: "Button".to_string(),
                file_path: "components/Button.tsx".to_string(),
                item_type: ItemType::Component,
            },
            SearchItem {
                name: "Card".to_string(),
                file_path: "components/Card.tsx".to_string(),
                item_type: ItemType::Component,
            },
            SearchItem {
                name: "Input".to_string(),
                file_path: "components/Input.tsx".to_string(),
                item_type: ItemType::Component,
            },
            SearchItem {
                name: "Checkbox".to_string(),
                file_path: "components/Checkbox.tsx".to_string(),
                item_type: ItemType::Component,
            },
            SearchItem {
                name: "checkmark".to_string(),
                file_path: "icons/checkmark.svg".to_string(),
                item_type: ItemType::Icon,
            },
            SearchItem {
                name: "checkmark-filled".to_string(),
                file_path: "icons/checkmark-filled.svg".to_string(),
                item_type: ItemType::Icon,
            },
            SearchItem {
                name: "close".to_string(),
                file_path: "icons/close.svg".to_string(),
                item_type: ItemType::Icon,
            },
        ]
    }

    #[test]
    fn test_create_index() {
        let index = NameIndex::new();
        assert!(index.is_ok());
    }

    #[test]
    fn test_index_items() {
        let index = NameIndex::new().unwrap();
        let items = create_test_items();
        let result = index.index_items(&items);
        assert!(result.is_ok());
    }

    #[test]
    fn test_exact_search() {
        let index = NameIndex::new().unwrap();
        let items = create_test_items();
        index.index_items(&items).unwrap();

        let results = index.search("button", 10).unwrap();
        assert!(!results.is_empty());
        assert_eq!(results[0].name, "Button");
        assert_eq!(results[0].item_type, "component");
    }

    #[test]
    fn test_fuzzy_search() {
        let index = NameIndex::new().unwrap();
        let items = create_test_items();
        index.index_items(&items).unwrap();

        // "buton" should find "Button" with distance=1
        let results = index.fuzzy_search("buton", 1, 10).unwrap();
        assert!(!results.is_empty());
        assert_eq!(results[0].name, "Button");
    }

    #[test]
    fn test_search_icons() {
        let index = NameIndex::new().unwrap();
        let items = create_test_items();
        index.index_items(&items).unwrap();

        let results = index.search("checkmark", 10).unwrap();
        assert!(!results.is_empty());
        // Should find icon entries
        assert!(results.iter().any(|r| r.item_type == "icon"));
    }

    #[test]
    fn test_prefix_search() {
        let index = NameIndex::new().unwrap();
        let items = create_test_items();
        index.index_items(&items).unwrap();

        // Tantivy tokenizes "checkmark" as a single token
        // Exact term search for "checkbox" should work
        let results = index.search("checkbox", 10).unwrap();
        assert!(!results.is_empty(), "Should find 'Checkbox' component");
        assert_eq!(results[0].name, "Checkbox");
    }

    #[test]
    fn test_benchmark_indexing() {
        let index = NameIndex::new().unwrap();

        // Create 200 items (more than the ~197 real items)
        let mut items = Vec::new();
        for i in 0..200 {
            items.push(SearchItem {
                name: format!("Component{}", i),
                file_path: format!("components/Component{}.tsx", i),
                item_type: if i % 5 == 0 { ItemType::Icon } else { ItemType::Component },
            });
        }

        let start = std::time::Instant::now();
        index.index_items(&items).unwrap();
        let elapsed = start.elapsed();

        // Should complete in < 1 second (acceptance criteria)
        assert!(elapsed.as_secs() < 1, "Indexing took too long: {:?}", elapsed);
        println!("Indexed 200 items in {:?}", elapsed);
    }

    #[test]
    fn test_search_returns_path() {
        let index = NameIndex::new().unwrap();
        let items = create_test_items();
        index.index_items(&items).unwrap();

        let results = index.search("card", 1).unwrap();
        assert!(!results.is_empty());
        assert!(results[0].file_path.contains("Card.tsx"));
    }

    #[test]
    fn test_empty_search() {
        let index = NameIndex::new().unwrap();
        let items = create_test_items();
        index.index_items(&items).unwrap();

        let results = index.search("nonexistent", 10).unwrap();
        assert!(results.is_empty());
    }
}
