/**
 * Shared Canvas Core Types
 *
 * These interfaces define the contract for canvas hooks shared between
 * Spatial File Viewer and Component Canvas.
 *
 * Design Reference: robot.co canvas implementation
 * - Spring grid with physics (stiffness 0.08, damping 0.75)
 * - Velocity-based friction (0.975 → 0.94 at high speed)
 * - Web Audio sound effects
 */

// ============================================================================
// Physics Types
// ============================================================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface VelocitySample {
  velocity: Vector2D;
  timestamp: number;
}

export interface PhysicsConfig {
  /** Base friction coefficient (default: 0.975) */
  baseFriction: number;
  /** High-speed friction coefficient (default: 0.94) */
  highSpeedFriction: number;
  /** Minimum velocity before stopping (default: 0.15) */
  minVelocity: number;
  /** Maximum velocity clamp (default: 40) */
  maxVelocity: number;
  /** Number of velocity samples to average (default: 6) */
  velocitySampleCount: number;
  /** Max age of velocity samples in ms (default: 80) */
  velocitySampleMaxAge: number;
  /** Bounce damping on boundary collision (default: 0.45) */
  bounceDamping: number;
}

export interface SpringConfig {
  /** Spring stiffness (default: 0.08) */
  stiffness: number;
  /** Spring damping (default: 0.75) */
  damping: number;
}

export interface CanvasPhysicsState {
  /** Current position offset */
  position: Vector2D;
  /** Current velocity */
  velocity: Vector2D;
  /** Whether physics simulation is active */
  isAnimating: boolean;
}

export interface UseCanvasPhysicsOptions {
  /** Physics configuration */
  config?: Partial<PhysicsConfig>;
  /** Canvas bounds for bounce detection */
  bounds?: { width: number; height: number };
  /** Enable bounce on boundaries */
  enableBounce?: boolean;
  /** Callback when bounce occurs */
  onBounce?: (edge: "top" | "bottom" | "left" | "right") => void;
}

export interface UseCanvasPhysicsResult {
  /** Current physics state */
  state: CanvasPhysicsState;
  /** Start tracking from a position */
  startTracking: (position: Vector2D) => void;
  /** Update tracking position (call on mouse/touch move) */
  updateTracking: (position: Vector2D) => void;
  /** End tracking and apply momentum */
  endTracking: () => void;
  /** Apply impulse to velocity */
  applyImpulse: (impulse: Vector2D) => void;
  /** Stop all motion immediately */
  stop: () => void;
  /** Update bounds (e.g., on resize) */
  setBounds: (bounds: { width: number; height: number }) => void;
}

// ============================================================================
// Gesture Types
// ============================================================================

export type GestureType = "pan" | "zoom" | "drag" | "pinch";

export interface GestureState {
  /** Active gesture type */
  type: GestureType | null;
  /** Gesture start position */
  startPosition: Vector2D | null;
  /** Current position */
  currentPosition: Vector2D | null;
  /** Zoom scale factor */
  scale: number;
  /** Whether a gesture is in progress */
  isActive: boolean;
}

export interface PanGestureEvent {
  type: "pan";
  delta: Vector2D;
  position: Vector2D;
  velocity: Vector2D;
}

export interface ZoomGestureEvent {
  type: "zoom";
  scale: number;
  center: Vector2D;
  delta: number;
}

export interface DragGestureEvent {
  type: "drag";
  nodeId: string;
  position: Vector2D;
  delta: Vector2D;
  phase: "start" | "move" | "end";
}

export interface UseCanvasGesturesOptions {
  /** Enable pan gesture */
  enablePan?: boolean;
  /** Enable zoom gesture */
  enableZoom?: boolean;
  /** Enable drag gesture (for nodes) */
  enableDrag?: boolean;
  /** Min zoom scale */
  minScale?: number;
  /** Max zoom scale */
  maxScale?: number;
  /** Zoom sensitivity */
  zoomSensitivity?: number;
  /** Modifier key required for pan (e.g., shift+drag) */
  panModifier?: "shift" | "alt" | "meta" | null;
}

export interface UseCanvasGesturesResult {
  /** Current gesture state */
  state: GestureState;
  /** Bind to container element */
  containerProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
  };
  /** Register a draggable node */
  registerDraggable: (nodeId: string, element: HTMLElement | null) => void;
  /** Current zoom scale */
  scale: number;
  /** Set zoom scale programmatically */
  setScale: (scale: number) => void;
  /** Reset to default view */
  resetView: () => void;
}

// ============================================================================
// Sound Types
// ============================================================================

export type SoundEffect =
  | "bounce"
  | "gridTouch"
  | "select"
  | "deselect"
  | "expand"
  | "collapse"
  | "copy"
  | "drop";

export interface SoundConfig {
  /** Master volume (0-1) */
  masterVolume: number;
  /** Individual sound volumes */
  volumes: Record<SoundEffect, number>;
  /** Whether sounds are enabled */
  enabled: boolean;
}

export interface UseCanvasSoundsOptions {
  /** Sound configuration */
  config?: Partial<SoundConfig>;
  /** Initially enabled */
  enabled?: boolean;
}

export interface UseCanvasSoundsResult {
  /** Play a sound effect */
  play: (effect: SoundEffect, options?: { volume?: number }) => void;
  /** Enable/disable sounds */
  setEnabled: (enabled: boolean) => void;
  /** Whether sounds are enabled */
  isEnabled: boolean;
  /** Update configuration */
  setConfig: (config: Partial<SoundConfig>) => void;
}

// ============================================================================
// Grid Types
// ============================================================================

export interface GridConfig {
  /** Grid cell size in pixels */
  cellSize: number;
  /** Dot radius in pixels */
  dotRadius: number;
  /** Dot color (CSS color string) */
  dotColor: string;
  /** Background color */
  backgroundColor: string;
  /** Enable spring physics on grid */
  enablePhysics: boolean;
  /** Spring configuration for grid */
  spring?: SpringConfig;
}

export interface CanvasGridProps {
  /** Grid configuration */
  config?: Partial<GridConfig>;
  /** Current pan offset */
  offset: Vector2D;
  /** Current zoom scale */
  scale: number;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** ClassName for styling */
  className?: string;
}

// ============================================================================
// Canvas Node Types (Generic)
// ============================================================================

export interface CanvasNodeBase {
  /** Unique node identifier */
  id: string;
  /** Position on canvas */
  x: number;
  /** Position on canvas */
  y: number;
  /** Node width */
  width: number;
  /** Node height */
  height: number;
}

export interface CanvasNodeState {
  /** Whether node is selected */
  isSelected: boolean;
  /** Whether node is being dragged */
  isDragging: boolean;
}

// ============================================================================
// Connection Line Types
// ============================================================================

export type ConnectionType = "hierarchy" | "composition" | "import" | "usage";

export interface Connection {
  /** Unique connection identifier */
  id: string;
  /** Source node ID */
  sourceId: string;
  /** Target node ID */
  targetId: string;
  /** Connection type */
  type: ConnectionType;
  /** Whether connection is highlighted */
  isHighlighted?: boolean;
}

export interface ConnectionLineConfig {
  /** Line color by type */
  colors: Record<ConnectionType, string>;
  /** Line stroke width */
  strokeWidth: number;
  /** Enable animated dash pattern */
  animated: boolean;
  /** Dash pattern (e.g., "5,5") */
  dashPattern?: string;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Curve tension (0 = straight, 1 = smooth bezier) */
  curveTension: number;
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  baseFriction: 0.975,
  highSpeedFriction: 0.94,
  minVelocity: 0.15,
  maxVelocity: 40,
  velocitySampleCount: 6,
  velocitySampleMaxAge: 80,
  bounceDamping: 0.45,
};

export const DEFAULT_SPRING_CONFIG: SpringConfig = {
  stiffness: 0.08,
  damping: 0.75,
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  cellSize: 24,
  dotRadius: 1,
  dotColor: "rgba(255,255,255,0.15)",
  backgroundColor: "#0a0a0a",
  enablePhysics: false,
  spring: DEFAULT_SPRING_CONFIG,
};

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  masterVolume: 0.5,
  volumes: {
    bounce: 0.1,
    gridTouch: 0.015,
    select: 0.08,
    deselect: 0.05,
    expand: 0.06,
    collapse: 0.06,
    copy: 0.1,
    drop: 0.15,
  },
  enabled: true,
};

export const DEFAULT_CONNECTION_CONFIG: ConnectionLineConfig = {
  colors: {
    hierarchy: "rgba(255,255,255,0.2)",
    composition: "#3b82f6",
    import: "#22c55e",
    usage: "#f59e0b",
  },
  strokeWidth: 1,
  animated: false,
  dashPattern: "5,5",
  animationDuration: 1000,
  curveTension: 0.5,
};
