import type { RegistryEntry } from "./types";

/**
 * App-local registry entries.
 *
 * Monorepo apps (rad-os, radiator, etc.) can opt in their own local
 * components here without polluting the package-level manifest.
 *
 * Each entry uses the same RegistryEntry shape as package components.
 * Set `packageName` to the app identifier (e.g. "apps/rad-os") so the
 * sidebar groups them under a separate heading.
 *
 * Example:
 * ```ts
 * import { WindowTitleBar } from "@/components/Rad_os/WindowTitleBar";
 *
 * export const appRegistry: RegistryEntry[] = [
 *   {
 *     id: "rad-os-window-title-bar",
 *     label: "WindowTitleBar",
 *     group: "Layout",
 *     packageName: "apps/rad-os",
 *     Component: WindowTitleBar,
 *     defaultProps: { title: "Example Window" },
 *     sourcePath: "apps/rad-os/components/Rad_os/WindowTitleBar.tsx",
 *   },
 * ];
 * ```
 */
export const appRegistry: RegistryEntry[] = [];
