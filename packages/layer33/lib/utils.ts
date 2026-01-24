/**
 * Utility function to merge class names
 * Filters out falsy values, joins with spaces, and removes duplicates
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
