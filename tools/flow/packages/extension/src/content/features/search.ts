/**
 * Search modes for queryPage.
 */
export type SearchMode = 'selector' | 'text' | 'fuzzy';

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
 * Supports multiple search modes and shadow DOM traversal.
 *
 * @param query - The search query
 * @param mode - Search mode: 'selector' (CSS), 'text' (text content), or 'fuzzy' (fuzzy text matching)
 */
export async function queryPage(
  query: string,
  mode: SearchMode = 'selector'
): Promise<Element[]> {
  if (!query) return [];

  switch (mode) {
    case 'selector':
      return querySelectorSearch(query);
    case 'text':
      return textSearch(query);
    case 'fuzzy':
      return fuzzySearch(query);
    default:
      return querySelectorSearch(query);
  }
}

/**
 * CSS selector-based search (original behavior).
 * Supports shadow DOM traversal via query-selector-shadow-dom.
 */
async function querySelectorSearch(query: string): Promise<Element[]> {
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

/**
 * Search by text content (innerText/textContent contains query).
 * Returns elements whose text content contains the query (case-insensitive).
 */
function textSearch(query: string): Element[] {
  const lowerQuery = query.toLowerCase();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const matches: Element[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const el = node as Element;
    // Check direct text content to avoid matching parent containers
    const directText = getDirectTextContent(el);
    if (directText.toLowerCase().includes(lowerQuery)) {
      matches.push(el);
    }
  }

  return matches;
}

/**
 * Get the direct text content of an element (excluding child element text).
 */
function getDirectTextContent(el: Element): string {
  let text = '';
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
    }
  }
  return text.trim();
}

/**
 * Fuzzy text search using a simple scoring algorithm.
 * Returns elements whose text content fuzzy-matches the query.
 */
function fuzzySearch(query: string): Element[] {
  const lowerQuery = query.toLowerCase();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const scored: Array<{ el: Element; score: number }> = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const el = node as Element;
    const text = (el.textContent ?? '').toLowerCase();
    const score = fuzzyScore(lowerQuery, text);

    if (score > 0) {
      scored.push({ el, score });
    }
  }

  // Sort by score descending and return elements
  scored.sort((a, b) => b.score - a.score);
  return scored.map((item) => item.el);
}

/**
 * Calculate a fuzzy match score between a query and text.
 * Returns a score > 0 if the query characters appear in order in the text.
 * Higher scores indicate better matches (consecutive characters, early positions).
 */
function fuzzyScore(query: string, text: string): number {
  if (query.length === 0) return 0;
  if (text.length === 0) return 0;

  let score = 0;
  let queryIdx = 0;
  let prevMatchIdx = -1;
  let consecutiveBonus = 0;

  for (let i = 0; i < text.length && queryIdx < query.length; i++) {
    if (text[i] === query[queryIdx]) {
      // Base score for match
      score += 1;

      // Bonus for consecutive matches
      if (prevMatchIdx === i - 1) {
        consecutiveBonus += 2;
        score += consecutiveBonus;
      } else {
        consecutiveBonus = 0;
      }

      // Bonus for early matches
      if (i < 10) {
        score += (10 - i) * 0.1;
      }

      // Bonus for word boundary matches
      if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '-' || text[i - 1] === '_') {
        score += 2;
      }

      prevMatchIdx = i;
      queryIdx++;
    }
  }

  // All query characters must be found
  if (queryIdx < query.length) {
    return 0;
  }

  return score;
}
