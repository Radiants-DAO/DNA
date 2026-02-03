import { useRef, useCallback, useEffect } from "react";

/**
 * Configuration for scrub behavior
 */
export interface UseScrubOptions {
  /** Initial value (number) */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Callback when scrubbing starts */
  onStart?: () => void;
  /** Callback when scrubbing ends */
  onEnd?: () => void;
  /** Minimum value (default: -Infinity) */
  min?: number;
  /** Maximum value (default: Infinity) */
  max?: number;
  /** Base step size (default: 1) */
  step?: number;
  /** Whether scrubbing is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Return value from useScrub hook
 */
export interface UseScrubReturn {
  /** Ref to attach to the element (e.g., input label or number container) */
  scrubRef: React.RefObject<HTMLElement>;
  /** Whether currently scrubbing */
  isScrubbing: boolean;
}

/**
 * Hook for drag-to-adjust number values (scrub controls).
 *
 * Ported from Webstudio's style-panel/shared/scrub.ts with adaptations for RadFlow:
 * - Drag number inputs to adjust values
 * - Modifier keys: Shift = 10x speed, Alt = 0.1x precision
 * - Horizontal drag direction
 * - Cursor change on scrub
 *
 * @example
 * ```tsx
 * const { scrubRef, isScrubbing } = useScrub({
 *   value: fontSize,
 *   onChange: setFontSize,
 *   min: 0,
 *   step: 1,
 * });
 *
 * return (
 *   <label ref={scrubRef} style={{ cursor: isScrubbing ? 'ew-resize' : 'default' }}>
 *     Font Size
 *   </label>
 * );
 * ```
 */
export function useScrub({
  value,
  onChange,
  onStart,
  onEnd,
  min = -Infinity,
  max = Infinity,
  step = 1,
  enabled = true,
}: UseScrubOptions): UseScrubReturn {
  const scrubRef = useRef<HTMLElement>(null);
  const isScrubbingRef = useRef(false);
  const startValueRef = useRef(value);
  const startXRef = useRef(0);
  const accumulatorRef = useRef(0);

  /**
   * Calculate step based on modifier keys
   */
  const getModifiedStep = useCallback(
    (event: MouseEvent): number => {
      // Shift = 10x speed for coarse adjustments
      if (event.shiftKey) {
        return step * 10;
      }
      // Alt/Option = 0.1x precision for fine adjustments
      if (event.altKey) {
        return step * 0.1;
      }
      return step;
    },
    [step]
  );

  /**
   * Clamp value to min/max bounds
   */
  const clamp = useCallback(
    (val: number): number => {
      return Math.max(min, Math.min(max, val));
    },
    [min, max]
  );

  /**
   * Handle mouse move during scrubbing
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isScrubbingRef.current) return;

      const deltaX = event.clientX - startXRef.current;
      const currentStep = getModifiedStep(event);

      // Pixels per step - adjust sensitivity
      const pixelsPerStep = 4;

      // Calculate new accumulator (allows sub-step movements)
      accumulatorRef.current = deltaX / pixelsPerStep * currentStep;

      // Calculate new value
      const newValue = clamp(startValueRef.current + accumulatorRef.current);

      // Round to step precision
      const precision = Math.max(0, -Math.floor(Math.log10(currentStep)));
      const roundedValue = Number(newValue.toFixed(precision));

      onChange(roundedValue);
    },
    [getModifiedStep, clamp, onChange]
  );

  /**
   * Handle mouse up to end scrubbing
   */
  const handleMouseUp = useCallback(() => {
    if (!isScrubbingRef.current) return;

    isScrubbingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    // Remove global listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    onEnd?.();
  }, [handleMouseMove, onEnd]);

  /**
   * Handle mouse down to start scrubbing
   */
  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      // Only handle left mouse button
      if (event.button !== 0) return;

      // Prevent text selection
      event.preventDefault();

      isScrubbingRef.current = true;
      startValueRef.current = value;
      startXRef.current = event.clientX;
      accumulatorRef.current = 0;

      // Change cursor and disable selection
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";

      // Add global listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      onStart?.();
    },
    [value, handleMouseMove, handleMouseUp, onStart]
  );

  // Set up event listeners
  useEffect(() => {
    const element = scrubRef.current;
    if (!element || !enabled) return;

    // Use ew-resize cursor to indicate scrub capability
    element.style.cursor = "ew-resize";

    element.addEventListener("mousedown", handleMouseDown);

    return () => {
      element.style.cursor = "";
      element.removeEventListener("mousedown", handleMouseDown);

      // Clean up any in-progress scrub
      if (isScrubbingRef.current) {
        isScrubbingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [enabled, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    scrubRef: scrubRef as React.RefObject<HTMLElement>,
    isScrubbing: isScrubbingRef.current,
  };
}

/**
 * Utility component props for scrub-enabled number input
 */
export interface ScrubInputProps {
  /** Label text */
  label: string;
  /** Current value */
  value: number;
  /** Unit to display (e.g., "px", "%", "em") */
  unit?: string;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step size */
  step?: number;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

export default useScrub;
