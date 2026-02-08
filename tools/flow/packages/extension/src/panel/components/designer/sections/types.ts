/**
 * Section Types and Utilities for Style Panel Sections
 *
 * Ported from Flow 0 for the browser extension.
 */

import type { StyleValue } from "../../../types/styleValue";

// =============================================================================
// Section Configuration Types
// =============================================================================

/**
 * All available section IDs in the style panel
 */
export type SectionId =
  | "layout"
  | "spacing"
  | "size"
  | "position"
  | "typography"
  | "backgrounds"
  | "borders"
  | "boxShadows"
  | "effects";

/**
 * Section configuration for the registry
 */
export interface SectionConfig {
  /** Unique section identifier */
  id: SectionId;
  /** Display title */
  title: string;
  /** Whether section is open by default */
  defaultOpen: boolean;
}

// =============================================================================
// Common Section Props
// =============================================================================

/**
 * Base props that all section components receive
 */
export interface BaseSectionProps {
  /** Called when a style value changes */
  onStyleChange?: (property: string, value: StyleValue) => void;
  /** Whether the section is read-only */
  readOnly?: boolean;
  /** Initial style values from the selected element */
  initialStyles?: Record<string, string>;
}

// =============================================================================
// CSS Property Types
// =============================================================================

/**
 * Standard CSS display values
 */
export type DisplayType = "block" | "flex" | "grid" | "inline" | "inline-flex" | "inline-grid" | "none";

/**
 * Flex direction values
 */
export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";

/**
 * Flex wrap values
 */
export type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";

/**
 * Align items values
 */
export type AlignItems = "flex-start" | "center" | "flex-end" | "stretch" | "baseline";

/**
 * Justify content values
 */
export type JustifyContent =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";

/**
 * Position type values
 */
export type PositionType = "static" | "relative" | "absolute" | "fixed" | "sticky";

/**
 * Common CSS size units
 */
export type SizeUnit = "px" | "rem" | "em" | "%" | "vw" | "vh" | "auto";

/**
 * Overflow values
 */
export type OverflowValue = "visible" | "hidden" | "scroll" | "auto";

/**
 * Border style values
 */
export type BorderStyle = "none" | "solid" | "dashed" | "dotted" | "double";

/**
 * Text alignment values
 */
export type TextAlign = "left" | "center" | "right" | "justify";

/**
 * Text decoration values
 */
export type TextDecoration = "none" | "underline" | "line-through" | "overline";

/**
 * Text transform values
 */
export type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Map 9-point grid position to align-items + justify-content
 */
export const ALIGNMENT_MAP: { alignItems: AlignItems; justifyContent: JustifyContent }[] = [
  { alignItems: "flex-start", justifyContent: "flex-start" }, // 0: top-left
  { alignItems: "flex-start", justifyContent: "center" },     // 1: top-center
  { alignItems: "flex-start", justifyContent: "flex-end" },   // 2: top-right
  { alignItems: "center", justifyContent: "flex-start" },     // 3: middle-left
  { alignItems: "center", justifyContent: "center" },         // 4: middle-center
  { alignItems: "center", justifyContent: "flex-end" },       // 5: middle-right
  { alignItems: "flex-end", justifyContent: "flex-start" },   // 6: bottom-left
  { alignItems: "flex-end", justifyContent: "center" },       // 7: bottom-center
  { alignItems: "flex-end", justifyContent: "flex-end" },     // 8: bottom-right
];
