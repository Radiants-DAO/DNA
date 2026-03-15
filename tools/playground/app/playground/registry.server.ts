/**
 * Server-safe registry data for API routes.
 *
 * The main registry.tsx is marked "use client" because it imports React
 * components. API routes (server-only) need only the metadata (id, sourcePath).
 * This module re-exports the shared registry as plain data objects without
 * pulling in any client-side code.
 */

import {
  registry as sharedRegistry,
} from "@rdna/radiants/registry";

export interface ServerRegistryEntry {
  id: string;
  sourcePath: string;
  label: string;
}

export const serverRegistry: ServerRegistryEntry[] = sharedRegistry
  .filter((e) => e.renderMode !== "description-only")
  .map((e) => ({
    id: e.name.toLowerCase(),
    sourcePath: e.sourcePath ?? "",
    label: e.name,
  }));
