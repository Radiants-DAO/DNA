/** React component identity extracted from fiber */
export interface FiberData {
  /** Display name of the component (e.g. "Button", "HeroSection") */
  componentName: string;
  /** Component props (serializable subset) */
  props: Record<string, unknown>;
  /** Source location from _debugSource or captureOwnerStack */
  source: SourceLocation | null;
  /** Parent component chain, nearest first */
  hierarchy: HierarchyEntry[];
}

export interface SourceLocation {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface HierarchyEntry {
  componentName: string;
  source: SourceLocation | null;
}

/** CSS custom property with tier classification */
export interface CustomProperty {
  name: string;
  value: string;
  tier: 'brand' | 'semantic' | 'unknown';
}

/** Computed style values grouped by the 9 designer categories */
export interface GroupedStyles {
  layout: StyleEntry[];
  spacing: StyleEntry[];
  size: StyleEntry[];
  typography: StyleEntry[];
  colors: StyleEntry[];
  borders: StyleEntry[];
  shadows: StyleEntry[];
  effects: StyleEntry[];
  animations: StyleEntry[];
}

export interface StyleEntry {
  property: string;
  value: string;
  /** The CSS custom property providing this value, if any */
  customProperty?: string;
}

/** Grid or flex layout structure */
export interface LayoutStructure {
  type: 'grid' | 'flex' | 'block' | 'inline' | 'none';
  /** Grid-specific */
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridGap?: string;
  /** Flex-specific */
  flexDirection?: string;
  flexWrap?: string;
  alignItems?: string;
  justifyContent?: string;
  gap?: string;
  /** Inferred column/row count */
  inferredColumns?: number;
  inferredRows?: number;
}

/** Animation state for a single animation */
export interface AnimationData {
  name: string;
  type: 'css-animation' | 'css-transition' | 'web-animation' | 'gsap';
  target: string;
  duration: number;
  delay: number;
  easing: string;
  playState: string;
  currentTime: number | null;
  keyframes: Record<string, string>[];
}

/** Full inspection result for a single element */
export interface InspectionResult {
  /** Unique selector for the element */
  selector: string;
  /** Tag name (e.g. "div", "button") */
  tagName: string;
  /** React fiber data, null if not a React app or element has no fiber */
  fiber: FiberData | null;
  /** Computed styles grouped by category */
  styles: GroupedStyles;
  /** CSS custom properties applied to this element */
  customProperties: CustomProperty[];
  /** Layout structure (grid/flex inference) */
  layout: LayoutStructure;
  /** Active animations on this element */
  animations: AnimationData[];
  /** Timestamp of extraction */
  timestamp: number;
}
