/**
 * Normalize a search query, expanding aliases to CSS selectors.
 */
export function normalizeQuery(query: string): string {
  if (query === 'images') return 'img';
  if (query === 'text') return 'p,caption,a,h1,h2,h3,h4,h5,h6,small,li,dt,dd';
  return query;
}

/**
 * Query the page for elements matching the given query.
 * Supports shadow DOM traversal via query-selector-shadow-dom.
 */
export async function queryPage(query: string): Promise<Element[]> {
  const selector = normalizeQuery(query);
  if (!selector) return [];

  // Dynamic import to avoid bundling issues in tests
  try {
    const { querySelectorAllDeep } = await import('query-selector-shadow-dom');
    return Array.from(querySelectorAllDeep(selector));
  } catch {
    // Fallback for environments without the dependency
    return Array.from(document.querySelectorAll(selector));
  }
}
