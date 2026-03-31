#!/usr/bin/env node

/**
 * One-time migration: add blockNote config to all component metas.
 * Run: node --experimental-strip-types scripts/_migrate-blocknote-all.ts
 * Then delete this file.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { componentMetaIndex } from "../meta/index.ts";
import type { ComponentMeta } from "../../preview/src/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = resolve(__dirname, "../components/core");

// ============================================================================
// Config for each component
// ============================================================================

interface BlockNoteConfig {
  content: "inline" | "none";
  render?: string;
  propSchema: Record<string, { prop: string }>;
  icon: string;
  aliases: string[];
  subtext?: string;
}

const ICON_MAP: Record<string, string> = {
  AlertDialog: "info-filled",
  AppWindow: "code-window",
  Avatar: "single-user-shield",
  Breadcrumbs: "chevron-right",
  Button: "hand-point",
  Checkbox: "checkmark",
  Combobox: "search",
  ContextMenu: "more-horizontal",
  CountdownTimer: "clock",
  Dialog: "full-screen",
  Drawer: "grip-vertical",
  DropdownMenu: "chevron-down",
  Icon: "plus",
  Input: "cursor-text",
  InputSet: "list",
  Menubar: "hamburger",
  Meter: "line-chart",
  NavigationMenu: "globe",
  NumberField: "plus",
  Pattern: "grid-3x3",
  Popover: "comments-blank",
  PreviewCard: "eye",
  Radio: "checkmark",
  ScrollArea: "scroll-vertical",
  Select: "chevron-down",
  Separator: "minus",
  Sheet: "grip-horizontal",
  Slider: "grip-horizontal",
  Spinner: "hourglass",
  Switch: "power1",
  Tabs: "folder-open",
  TextArea: "cursor-text",
  Toast: "comments-typing",
  Toggle: "power1",
  ToggleGroup: "grid-3x3",
  Toolbar: "grip-horizontal",
  Tooltip: "comments-blank",
};

// Components that need custom renders (compound/overlay — can't render standalone)
const NEEDS_RENDER: Record<string, string> = {
  Tabs: "./blocknote/renders/Tabs",
  Select: "./blocknote/renders/Select",
  Breadcrumbs: "./blocknote/renders/Breadcrumbs",
  Toolbar: "./blocknote/renders/Toolbar",
  ToggleGroup: "./blocknote/renders/ToggleGroup",
  Dialog: "./blocknote/renders/Dialog",
  AlertDialog: "./blocknote/renders/AlertDialog",
  Sheet: "./blocknote/renders/Sheet",
  Drawer: "./blocknote/renders/Drawer",
  Popover: "./blocknote/renders/Popover",
  PreviewCard: "./blocknote/renders/PreviewCard",
  DropdownMenu: "./blocknote/renders/DropdownMenu",
  ContextMenu: "./blocknote/renders/ContextMenu",
  Tooltip: "./blocknote/renders/Tooltip",
  Toast: "./blocknote/renders/Toast",
  NavigationMenu: "./blocknote/renders/NavigationMenu",
  Menubar: "./blocknote/renders/Menubar",
  AppWindow: "./blocknote/renders/AppWindow",
  InputSet: "./blocknote/renders/InputSet",
  Combobox: "./blocknote/renders/Combobox",
  NumberField: "./blocknote/renders/NumberField",
};

// Components that should use content: "inline" (have meaningful children slot)
const INLINE_CONTENT = new Set(["Button", "Pattern", "ScrollArea"]);

// Skip — already have blockNote config
const ALREADY_DONE = new Set(["Alert", "Badge", "Card", "Collapsible"]);

// ============================================================================
// Migration
// ============================================================================

let modified = 0;
let skipped = 0;

for (const [name, entry] of Object.entries(componentMetaIndex)) {
  if (ALREADY_DONE.has(name)) { skipped++; continue; }

  const meta = entry.meta as ComponentMeta<Record<string, unknown>>;

  // Skip if already has blockNote
  if ((meta as any).blockNote) { skipped++; continue; }

  // Find meta file
  const metaPath = resolve(COMPONENTS_DIR, name, `${name}.meta.ts`);
  let source: string;
  try {
    source = readFileSync(metaPath, "utf8");
  } catch {
    console.warn(`  ⚠ ${name}: meta file not found at ${metaPath}`);
    continue;
  }

  // Double-check not already present in source
  if (source.includes("blockNote:") || source.includes("blockNote :")) {
    skipped++;
    continue;
  }

  // Build config
  const hasChildren = Boolean(meta.slots?.["children"]);
  const content = (hasChildren && INLINE_CONTENT.has(name)) ? "inline" :
                  (hasChildren && !NEEDS_RENDER[name]) ? "inline" :
                  "none";
  const render = NEEDS_RENDER[name];
  const icon = ICON_MAP[name] ?? "plus";

  // Auto-detect enum props
  const propSchema: Record<string, { prop: string }> = {};
  for (const [propName, propDef] of Object.entries(meta.props)) {
    if (propDef.type === "enum" && propDef.values && propDef.values.length > 0) {
      // Skip callback/complex props
      if (propName.startsWith("on") || propName === "children") continue;
      propSchema[propName] = { prop: propName };
    }
  }

  // Build aliases from name + registry tags
  const tags = (meta.registry as any)?.tags ?? [];
  const aliases = [name.toLowerCase(), ...tags.slice(0, 3)];

  // Subtext
  const subtext = meta.description.length > 50
    ? meta.description.slice(0, 50).trim() + "..."
    : meta.description;

  // Build the blockNote config string
  const propSchemaStr = Object.keys(propSchema).length > 0
    ? `{ ${Object.entries(propSchema).map(([k, v]) => `${k}: { prop: "${v.prop}" }`).join(", ")} }`
    : "{}";

  let blockNoteStr = `  blockNote: {\n`;
  blockNoteStr += `    enabled: true,\n`;
  blockNoteStr += `    content: "${content}",\n`;
  if (render) {
    blockNoteStr += `    render: "${render}",\n`;
  }
  blockNoteStr += `    propSchema: ${propSchemaStr},\n`;
  blockNoteStr += `    slashMenu: {\n`;
  blockNoteStr += `      title: "${name}",\n`;
  blockNoteStr += `      subtext: "${subtext.replace(/"/g, '\\"')}",\n`;
  blockNoteStr += `      aliases: ${JSON.stringify(aliases)},\n`;
  blockNoteStr += `      icon: "${icon}",\n`;
  blockNoteStr += `    },\n`;
  blockNoteStr += `  },\n`;

  // Insert before the closing `});`
  const closingPattern = /(\n\}\);?\s*)$/;
  if (!closingPattern.test(source)) {
    console.warn(`  ⚠ ${name}: could not find closing }); in meta file`);
    continue;
  }

  const newSource = source.replace(closingPattern, `\n${blockNoteStr}$1`);
  writeFileSync(metaPath, newSource, "utf8");
  modified++;
  console.log(`  ✓ ${name} (content: ${content}${render ? ", custom render" : ""})`);
}

console.log(`\nDone: ${modified} modified, ${skipped} skipped`);
