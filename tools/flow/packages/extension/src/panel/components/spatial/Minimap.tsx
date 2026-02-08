/**
 * Minimap - Overview navigation for spatial canvas
 *
 * Ported from Flow 0.
 */

import { useCallback, useMemo } from "react";
import type { LayoutNode } from "../../types/spatial";
import type { Vector2D } from "../../types/canvas";

interface MinimapProps {
  /** All layout nodes to display */
  layoutNodes: LayoutNode[];
  /** Content bounds */
  contentBounds: { width: number; height: number };
  /** Current pan offset */
  pan: Vector2D;
  /** Current zoom level */
  zoom: number;
  /** Viewport size */
  viewportSize: { width: number; height: number };
  /** Callback when clicking on minimap to navigate */
  onNavigate: (pan: Vector2D) => void;
  /** Minimap size (width, height auto-calculated from aspect ratio) */
  width?: number;
}

export function Minimap({
  layoutNodes,
  contentBounds,
  pan,
  zoom,
  viewportSize,
  onNavigate,
  width = 160,
}: MinimapProps): React.ReactElement | null {
  // Calculate minimap dimensions maintaining aspect ratio
  const aspectRatio = contentBounds.width / contentBounds.height;
  const height = width / aspectRatio;
  const scale = width / contentBounds.width;

  // Calculate viewport indicator position and size
  const viewportIndicator = useMemo(() => {
    const visibleWidth = viewportSize.width / zoom;
    const visibleHeight = viewportSize.height / zoom;

    return {
      x: pan.x * scale,
      y: pan.y * scale,
      width: visibleWidth * scale,
      height: visibleHeight * scale,
    };
  }, [pan, zoom, viewportSize, scale]);

  // Handle click on minimap - navigate to that position
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert click position to content coordinates
      const contentX = clickX / scale;
      const contentY = clickY / scale;

      // Center the viewport on the clicked position
      const visibleWidth = viewportSize.width / zoom;
      const visibleHeight = viewportSize.height / zoom;

      onNavigate({
        x: contentX - visibleWidth / 2,
        y: contentY - visibleHeight / 2,
      });
    },
    [scale, zoom, viewportSize, onNavigate]
  );

  // Don't render if no content
  if (layoutNodes.length === 0 || contentBounds.width === 0) {
    return null;
  }

  return (
    <div
      className="absolute bottom-4 right-4 z-20 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-lg"
      style={{
        width,
        height,
        backgroundColor: "rgba(10, 10, 10, 0.9)",
        backdropFilter: "blur(8px)",
      }}
      onClick={handleClick}
    >
      {/* Scaled-down node representations */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Draw nodes as small rectangles */}
        {layoutNodes.map((node) => {
          const nodeX = node.x * scale;
          const nodeY = node.y * scale;
          const nodeWidth = node.width * scale;
          const nodeHeight = node.height * scale;

          // Color based on type
          const fill =
            node.fileNode.nodeType === "Directory"
              ? "rgba(59, 130, 246, 0.6)" // Blue for folders
              : "rgba(255, 255, 255, 0.3)"; // White for files

          return (
            <rect
              key={node.id}
              x={nodeX}
              y={nodeY}
              width={Math.max(2, nodeWidth)}
              height={Math.max(1, nodeHeight)}
              fill={fill}
              rx={0.5}
            />
          );
        })}

        {/* Viewport indicator */}
        <rect
          x={viewportIndicator.x}
          y={viewportIndicator.y}
          width={viewportIndicator.width}
          height={viewportIndicator.height}
          fill="rgba(255, 255, 255, 0.1)"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth={1}
          rx={1}
        />
      </svg>

      {/* Minimap label */}
      <div
        className="absolute top-1 left-1 text-[8px] text-[rgba(255,255,255,0.4)] uppercase tracking-wider"
        style={{ pointerEvents: "none" }}
      >
        Map
      </div>
    </div>
  );
}

export default Minimap;
