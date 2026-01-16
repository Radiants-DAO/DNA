/**
 * RadFlow Component Map
 *
 * Manages the componentMap - the central data structure mapping
 * radflowId to ComponentEntry.
 *
 * Implementation: fn-5.2
 */

import type { RadflowId, ComponentEntry, SerializedComponentEntry } from './types';

/** The singleton componentMap instance */
const componentMap = new Map<RadflowId, ComponentEntry>();

/**
 * Get the componentMap singleton.
 */
export function getComponentMap(): Map<RadflowId, ComponentEntry> {
  return componentMap;
}

/**
 * Add or update an entry in the componentMap.
 */
export function setEntry(entry: ComponentEntry): void {
  componentMap.set(entry.radflowId, entry);
}

/**
 * Remove an entry from the componentMap.
 */
export function removeEntry(id: RadflowId): boolean {
  return componentMap.delete(id);
}

/**
 * Clear all entries from the componentMap.
 */
export function clearMap(): void {
  componentMap.clear();
}

/**
 * Serialize the componentMap for postMessage transport.
 * Removes live DOM references and converts Map to array.
 */
export function serializeMap(): SerializedComponentEntry[] {
  const entries: SerializedComponentEntry[] = [];

  for (const entry of componentMap.values()) {
    entries.push({
      radflowId: entry.radflowId,
      name: entry.name,
      displayName: entry.displayName,
      selector: entry.selector,
      fallbackSelectors: entry.fallbackSelectors,
      source: entry.source,
      fiberType: entry.fiber.type,
      props: entry.fiber.props,
      parentId: entry.parentId,
      childIds: entry.childIds,
    });
  }

  return entries;
}

/**
 * Generate a unique RadflowId.
 */
export function generateId(): RadflowId {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'rf_';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
