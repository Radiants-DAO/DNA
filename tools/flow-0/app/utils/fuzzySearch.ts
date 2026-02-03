/**
 * Fuzzy Search Utility
 *
 * Simple fuzzy matching algorithm for real-time search filtering.
 * Provides scoring and character highlighting for matched results.
 */

export interface FuzzyMatch {
  /** The original item */
  item: string;
  /** Match score (higher is better) */
  score: number;
  /** Indices of matched characters for highlighting */
  matchedIndices: number[];
}

/**
 * Performs fuzzy matching on a string.
 *
 * Algorithm:
 * - Characters must appear in order but not necessarily consecutively
 * - Consecutive matches score higher
 * - Match at start of string/word scores higher
 * - Case-insensitive matching
 *
 * @param query - The search query
 * @param target - The string to match against
 * @returns Match result with score and indices, or null if no match
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query) {
    return { item: target, score: 0, matchedIndices: [] };
  }

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  let queryIndex = 0;
  let score = 0;
  const matchedIndices: number[] = [];
  let previousMatchIndex = -1;
  let consecutiveCount = 0;

  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (targetLower[i] === queryLower[queryIndex]) {
      matchedIndices.push(i);

      // Consecutive match bonus
      if (previousMatchIndex === i - 1) {
        consecutiveCount++;
        score += 2 * consecutiveCount; // Increasing bonus for longer consecutive runs
      } else {
        consecutiveCount = 0;
        score += 1;
      }

      // Word start bonus (after space, hyphen, underscore, or at start)
      if (i === 0 || /[\s\-_./]/.test(target[i - 1])) {
        score += 3;
      }

      // Case match bonus (exact case)
      if (target[i] === query[queryIndex]) {
        score += 0.5;
      }

      previousMatchIndex = i;
      queryIndex++;
    }
  }

  // Return null if not all query characters were matched
  if (queryIndex < query.length) {
    return null;
  }

  // Bonus for shorter targets (more relevant)
  score += Math.max(0, 10 - (target.length - query.length) * 0.5);

  // Bonus for match at start
  if (matchedIndices[0] === 0) {
    score += 5;
  }

  return { item: target, score, matchedIndices };
}

/**
 * Search interface for generic search items
 */
export interface SearchItem<T> {
  /** The item to search */
  item: T;
  /** Searchable text fields to match against */
  searchText: string;
}

/**
 * Searches a list of items using fuzzy matching.
 *
 * @param query - The search query
 * @param items - Items to search
 * @param getSearchText - Function to get searchable text from an item
 * @returns Sorted array of matching items with scores
 */
export function fuzzySearch<T>(
  query: string,
  items: T[],
  getSearchText: (item: T) => string
): Array<{ item: T; score: number; matchedIndices: number[] }> {
  if (!query.trim()) {
    return items.map((item) => ({
      item,
      score: 0,
      matchedIndices: [],
    }));
  }

  const results: Array<{ item: T; score: number; matchedIndices: number[] }> = [];

  for (const item of items) {
    const searchText = getSearchText(item);
    const match = fuzzyMatch(query, searchText);

    if (match) {
      results.push({
        item,
        score: match.score,
        matchedIndices: match.matchedIndices,
      });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Highlights matched characters in a string.
 *
 * @param text - The original text
 * @param matchedIndices - Indices of matched characters
 * @returns Array of { text, isMatch } segments
 */
export function highlightMatches(
  text: string,
  matchedIndices: number[]
): Array<{ text: string; isMatch: boolean }> {
  if (matchedIndices.length === 0) {
    return [{ text, isMatch: false }];
  }

  const indexSet = new Set(matchedIndices);
  const segments: Array<{ text: string; isMatch: boolean }> = [];
  let currentSegment = "";
  let currentIsMatch = indexSet.has(0);

  for (let i = 0; i < text.length; i++) {
    const isMatch = indexSet.has(i);

    if (isMatch !== currentIsMatch) {
      if (currentSegment) {
        segments.push({ text: currentSegment, isMatch: currentIsMatch });
      }
      currentSegment = text[i];
      currentIsMatch = isMatch;
    } else {
      currentSegment += text[i];
    }
  }

  if (currentSegment) {
    segments.push({ text: currentSegment, isMatch: currentIsMatch });
  }

  return segments;
}
