/**
 * Trash Registry
 *
 * Trashed apps still exist and can be opened from the Trash app.
 * Their source lives in trash/apps/ and is excluded from LLM context
 * via .claudeignore, but lazy imports here keep them functional.
 *
 * To trash an app:
 * 1. Move its source to trash/apps/<AppName>/
 * 2. Add a catalog entry in lib/apps/catalog.tsx with trashed: true
 *    and trashedDate set (the catalog handles Start Menu / desktop exclusion)
 * 3. Remove the lazy import from the catalog's top-level imports
 *    and point it at the trash/apps/ path instead
 */

// Trashed app IDs
export const TRASH_APP_IDS = {
  // Example:
  // AUCTIONS: 'trash-auctions',
} as const;

// Legacy — trashed apps are now catalog entries with `trashed: true`.
// This file is kept for reference only.
