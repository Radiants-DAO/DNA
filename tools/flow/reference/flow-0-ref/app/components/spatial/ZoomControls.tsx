import { Plus, Minus, Maximize2 } from "../ui/icons";

interface ZoomControlsProps {
  /** Current zoom level (1.0 = 100%) */
  zoom: number;
  /** Callback to zoom in */
  onZoomIn: () => void;
  /** Callback to zoom out */
  onZoomOut: () => void;
  /** Callback to zoom to fit all content */
  onZoomToFit: () => void;
  /** Min zoom level for disabling button */
  minZoom?: number;
  /** Max zoom level for disabling button */
  maxZoom?: number;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  minZoom = 0.1,
  maxZoom = 3,
}: ZoomControlsProps): React.ReactElement {
  const zoomPercentage = Math.round(zoom * 100);
  const isAtMinZoom = zoom <= minZoom;
  const isAtMaxZoom = zoom >= maxZoom;

  return (
    <div
      className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-lg"
      style={{
        backgroundColor: "rgba(10, 10, 10, 0.9)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Zoom out button */}
      <button
        type="button"
        onClick={onZoomOut}
        disabled={isAtMinZoom}
        className="p-2 hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom out"
        aria-label="Zoom out"
      >
        <Minus size={14} className="text-[rgba(255,255,255,0.7)]" />
      </button>

      {/* Zoom percentage display */}
      <div
        className="px-2 py-1.5 text-xs text-[rgba(255,255,255,0.7)] min-w-[48px] text-center select-none"
        title={`Zoom: ${zoomPercentage}%`}
      >
        {zoomPercentage}%
      </div>

      {/* Zoom in button */}
      <button
        type="button"
        onClick={onZoomIn}
        disabled={isAtMaxZoom}
        className="p-2 hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom in"
        aria-label="Zoom in"
      >
        <Plus size={14} className="text-[rgba(255,255,255,0.7)]" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-[rgba(255,255,255,0.1)]" />

      {/* Zoom to fit button */}
      <button
        type="button"
        onClick={onZoomToFit}
        className="p-2 hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        title="Zoom to fit"
        aria-label="Zoom to fit all content"
      >
        <Maximize2 size={14} className="text-[rgba(255,255,255,0.7)]" />
      </button>
    </div>
  );
}

export default ZoomControls;
