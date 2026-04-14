import Dotting from "./components/Dotting";
import type { DottingRef, DottingProps } from "./components/Dotting";

// Re-export all types from Canvas types
export {
  BrushTool,
  BRUSH_PATTERN_ELEMENT,
  CanvasEvents,
} from "./components/Canvas/types";

export type {
  Coord,
  Dimensions,
  ButtonDimensions,
  PanZoom,
  PixelData,
  ImageDownloadOptions,
  DottingData,
  PixelModifyItem,
  ColorChangeItem,
  CanvasDelta,
  CanvasDataChangeParams,
  CanvasDataChangeHandler,
  CanvasGridChangeParams,
  CanvasGridChangeHandler,
  CanvasStrokeEndParams,
  CanvasStrokeEndHandler,
  CanvasBrushChangeParams,
  CanvasBrushChangeHandler,
  CanvasHoverPixelChangeParams,
  CanvasHoverPixelChangeHandler,
  LayerChangeParams,
  LayerChangeHandler,
  CanvasInfoChangeParams,
  CanvasInfoChangeHandler,
  GridIndices,
  SelectAreaRange,
  LayerProps,
  LayerDataForHook,
  AddGridIndicesParams,
  DeleteGridIndicesParams,
} from "./components/Canvas/types";

// Re-export hooks
export {
  useBrush,
  useData,
  useDotting,
  useGrids,
  useHandlers,
  useLayers,
} from "./hooks";

// Re-export the main component and its types
export { Dotting };
export type { DottingRef, DottingProps };
