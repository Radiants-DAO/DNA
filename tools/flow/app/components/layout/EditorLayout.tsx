import { useState, useEffect, useRef, useCallback } from "react";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { PreviewCanvas } from "./PreviewCanvas";
import { SettingsBar } from "./SettingsBar";
import { useAppStore } from "../../stores/appStore";
import { CommentMode } from "../CommentMode";
import { TextEditMode } from "../TextEditMode";
import { FloatingModeBar } from "../FloatingModeBar";
import { SpatialCanvas } from "../spatial";
import { ComponentCanvas } from "../component-canvas";
import { ThemeTransition } from "../ThemeTransition";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { useDevServer, useDevServerReady } from "../../hooks/useDevServer";
import { writeProxyTarget } from "../../utils/proxyTarget";

/**
 * EditorLayout - Main layout for the visual editor
 *
 * Structure:
 * - SettingsBar: Floating top-left bar with window controls, search input, connection status,
 *   theme/project selectors, viewport/breakpoints, dev server URL, refresh, background toggle,
 *   dogfood toggle, and settings dropdown
 * - LeftPanel: Floating icon bar + floating panels (Variables, Components, Assets, Layers)
 * - PreviewCanvas: Center preview area with component grid/focused view (full width, full height)
 * - RightPanel: Floating icon bar + floating panels (Feedback, Designer)
 * - FloatingModeBar: Floating toolbar for mode switching
 *
 * Layout Changes (v2):
 * - All panels and bars are floating overlays, no docked elements
 * - Main content takes full width and height
 * - Status information merged into SettingsBar (top-left)
 * - Search and breakpoints in SettingsBar
 * - Undo/Redo available via keyboard shortcuts (Cmd+Z/Cmd+Shift+Z)
 *
 * Note: Spatial browser is a VIEW mode (toggled from LeftPanel), independent of
 * editorMode (which controls EDIT modes like comment, text-edit, etc.)
 */
export function EditorLayout() {
  // Mount dev server log listener (drives serverStatus transitions)
  useDevServer();

  // Wire dev server → preview URLs
  const setPreviewServerUrl = useAppStore((s) => s.setComponentPreviewServerUrl);
  const setPagePreviewUrl = useAppStore((s) => s.setPagePreviewUrl);
  const setTargetUrl = useAppStore((s) => s.setTargetUrl);
  const project = useAppStore((s) => s.project);

  useDevServerReady(useCallback(async () => {
    if (project) {
      const url = `http://localhost:${project.devPort}`;
      setPreviewServerUrl(url);
      setPagePreviewUrl(url);
      // Write proxy config so Vite middleware knows which port to forward to,
      // then set targetUrl to the same-origin proxy path
      await writeProxyTarget(project.devPort);
      setTargetUrl("/target/");
    }
  }, [project, setPreviewServerUrl, setPagePreviewUrl, setTargetUrl]));

  // View mode toggles (independent of editor mode)
  const isSpatialMode = useAppStore((s) => s.spatialBrowserActive);
  const isComponentCanvasMode = useAppStore((s) => s.componentCanvasActive);

  // Theme transition
  const themeDataLoading = useAppStore((s) => s.themeDataLoading);
  const [showTransition, setShowTransition] = useState(false);
  const prevThemeLoading = useRef(themeDataLoading);

  useEffect(() => {
    // Trigger transition when theme loading starts
    if (themeDataLoading && !prevThemeLoading.current) {
      setShowTransition(true);
    }
    prevThemeLoading.current = themeDataLoading;
  }, [themeDataLoading]);

  const handleTransitionComplete = useCallback(() => {
    setShowTransition(false);
  }, []);

  // Preview background state (shared between SettingsBar and PreviewCanvas)
  const [previewBg, setPreviewBg] = useState<"dark" | "light">("dark");

  // Has a running dev server with a target URL?
  const targetUrl = useAppStore((s) => s.targetUrl);
  const hasLivePreview = !!targetUrl;

  // Determine which canvas to show:
  // - SpatialCanvas when spatial browser is active
  // - ComponentCanvas when toggled on (or no live preview)
  // - PreviewCanvas when dev server is running (live iframe)
  const renderCanvas = () => {
    if (isSpatialMode) return <SpatialCanvas />;
    if (isComponentCanvasMode) return <ComponentCanvas />;
    if (hasLivePreview) return <PreviewCanvas previewBg={previewBg} />;
    return <ComponentCanvas />;
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" data-devflow-id="editor-layout">
      {/* Main Content Area - Full width and height, extends to top of viewport */}
      <div className="flex-1 flex overflow-hidden" data-devflow-id="main-content">
        {/* Center - Preview Canvas, Spatial Canvas, or Component Canvas (takes full width) */}
        <ErrorBoundary>
          {renderCanvas()}
        </ErrorBoundary>
      </div>

      {/* Comment Mode Overlay */}
      <ErrorBoundary>
        <CommentMode />
      </ErrorBoundary>

      {/* Text Edit Mode Overlay */}
      <TextEditMode />

      {/* Floating Mode Bar - Unified Edit Mode Toolbar */}
      <FloatingModeBar />

      {/* Floating Left Panel - Icon bar + floating panels */}
      <LeftPanel />

      {/* Floating Right Panel - Icon bar + floating panels (Feedback, Designer) */}
      <RightPanel />

      {/* Floating Settings Bar - Top-left (search, theme, project, URL, viewport, status, dogfood, settings) */}
      <SettingsBar previewBg={previewBg} setPreviewBg={setPreviewBg} />

      {/* ASCII Theme Switch Transition */}
      <ThemeTransition active={showTransition} onComplete={handleTransitionComplete} />
    </div>
  );
}

export default EditorLayout;
