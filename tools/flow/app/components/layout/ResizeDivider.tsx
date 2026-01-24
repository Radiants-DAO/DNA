import { useCallback, useEffect, useRef, useState } from "react";

interface ResizeDividerProps {
  /** Which side the panel is on - affects drag direction */
  side: "left" | "right";
  /** Called while dragging with the delta (positive = expand, negative = shrink) */
  onResize: (delta: number) => void;
  /** Called on double-click to reset to default width */
  onReset: () => void;
}

/**
 * ResizeDivider - Draggable divider between panels
 *
 * Features:
 * - Drag to resize adjacent panel
 * - Double-click to reset to default width
 * - Cursor changes to col-resize on hover
 * - Smooth drag experience with no jitter
 */
export function ResizeDivider({ side, onResize, onReset }: ResizeDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const dividerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleDoubleClick = useCallback(() => {
    onReset();
  }, [onReset]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      startXRef.current = e.clientX;

      // For left panel, positive delta = expand
      // For right panel, negative delta = expand (dragging left expands right panel)
      if (side === "left") {
        onResize(delta);
      } else {
        onResize(-delta);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onResize, side]);

  return (
    <div
      ref={dividerRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className={`
        w-1 h-full cursor-col-resize relative group shrink-0
        ${isDragging ? "bg-primary/50" : ""}
      `}
    >
      {/* Visible divider line */}
      <div
        className={`
          absolute inset-y-0 left-0 w-px
          ${isDragging ? "bg-primary" : "bg-border group-hover:bg-primary/50"}
          transition-colors duration-150
        `}
      />
      {/* Invisible hit area for easier grabbing */}
      <div className="absolute inset-y-0 -left-1 -right-1 w-3" />
    </div>
  );
}

export default ResizeDivider;
