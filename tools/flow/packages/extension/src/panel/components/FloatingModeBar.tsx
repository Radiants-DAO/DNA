import { useState, useRef, useEffect } from "react";
import { useAppStore, type EditorMode } from "../stores/appStore";
import type { ModeBarPosition } from "../stores/types";
import { DragHandle, useDraggable } from "./DragHandle";
import {
  Wand2,
  MousePointer2,
  Type,
  MessageSquare,
  HelpCircle,
  Palette,
  Play,
  Eye,
} from "./ui/icons";
import { DogfoodBoundary } from './ui/DogfoodBoundary';

/** Mode keys for the toolbar - superset of EditorMode for future modes */
type ModeKey = EditorMode | "smart-edit" | "text-edit" | "component-id" | "animation";

/**
 * Mode configuration for the FloatingModeBar.
 * Each mode has a key, label, shortcut, icon, and optional disabled state.
 */
interface ModeConfig {
  key: ModeKey;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * FloatingModeBar - Unified Edit Mode toolbar
 *
 * Floating toolbar with 8 mode buttons:
 * - E: Smart Edit mode
 * - V: Select/Prompt mode
 * - T: Text mode
 * - C: Comment mode
 * - Q: Question mode
 * - D: Designer mode (disabled - coming soon)
 * - A: Animation mode (disabled - coming soon)
 * - P: Preview mode
 *
 * Features:
 * - Positions based on barPosition from uiSlice
 * - Icon-only design with keyboard shortcut hints in tooltips
 * - Badge numbers for pending edits per mode
 * - Active mode highlighted with accent color
 */
// Estimated dimensions for the mode bar
// 8 mode buttons (~36px each) + drag handle (~28px) + dividers + padding + gaps
const MODE_BAR_WIDTH = 400;
const MODE_BAR_HEIGHT = 44;
const EDGE_PADDING = 8;

// Default positions for the floating mode bar based on barPosition setting
const getDefaultPosition = (barPosition: ModeBarPosition) => {
  // These are fallback initial positions - actual positioning will be dynamic
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  switch (barPosition) {
    case "top-left":
      return { x: EDGE_PADDING, y: EDGE_PADDING };
    case "top-center":
      return { x: Math.round(vw / 2 - MODE_BAR_WIDTH / 2), y: EDGE_PADDING };
    case "top-right":
      return { x: vw - MODE_BAR_WIDTH - EDGE_PADDING, y: EDGE_PADDING };
    case "bottom-left":
      return { x: EDGE_PADDING, y: vh - MODE_BAR_HEIGHT - EDGE_PADDING };
    case "bottom-center":
      return { x: Math.round(vw / 2 - MODE_BAR_WIDTH / 2), y: vh - MODE_BAR_HEIGHT - EDGE_PADDING };
    case "bottom-right":
      return { x: vw - MODE_BAR_WIDTH - EDGE_PADDING, y: vh - MODE_BAR_HEIGHT - EDGE_PADDING };
    default:
      // Default to bottom-center
      return { x: Math.round(vw / 2 - MODE_BAR_WIDTH / 2), y: vh - MODE_BAR_HEIGHT - EDGE_PADDING };
  }
};

export function FloatingModeBar() {
  // Use bottom-center as default since we don't have barPosition in extension store yet
  const barPosition: ModeBarPosition = "bottom-center";
  const editorMode = useAppStore((s) => s.editorMode);
  const setEditorMode = useAppStore((s) => s.setEditorMode);

  // Feedback state - simplified for extension
  const [activeFeedbackType, setActiveFeedbackType] = useState<"comment" | "question" | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  // Draggable position state
  const {
    position,
    isDragging,
    elementRef,
    handleDragStart,
    snapEdge,
  } = useDraggable(getDefaultPosition(barPosition), "flow-mode-bar-position");

  // Determine orientation from snap edge
  const isVertical = snapEdge === "left" || snapEdge === "right";

  // Mode configurations - using inline icons
  const modes: ModeConfig[] = [
    {
      key: "smart-edit",
      label: "Smart Edit",
      shortcut: "E",
      icon: <Wand2 className="w-5 h-5" />,
    },
    {
      key: "select-prompt",
      label: "Select/Prompt",
      shortcut: "V",
      icon: <MousePointer2 className="w-5 h-5" />,
    },
    {
      key: "text-edit",
      label: "Text",
      shortcut: "T",
      icon: <Type className="w-5 h-5" />,
    },
    {
      key: "comment",
      label: "Comment",
      shortcut: "C",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      key: "comment", // Question uses same mode with different feedbackType
      label: "Question",
      shortcut: "Q",
      icon: <HelpCircle className="w-5 h-5" />,
    },
    {
      key: "designer",
      label: "Designer",
      shortcut: "D",
      icon: <Palette className="w-5 h-5" />,
      disabled: true,
      disabledReason: "Coming soon",
    },
    {
      key: "animation",
      label: "Animation",
      shortcut: "A",
      icon: <Play className="w-5 h-5" />,
      disabled: true,
      disabledReason: "Coming soon",
    },
    {
      key: "preview",
      label: "Preview",
      shortcut: "P",
      icon: <Eye className="w-5 h-5" />,
    },
  ];

  // Check if a mode is active
  const isModeActive = (mode: ModeConfig): boolean => {
    // Special handling for Comment vs Question (both use "comment" mode)
    if (mode.shortcut === "C") {
      return editorMode === "comment" && activeFeedbackType === "comment";
    }
    if (mode.shortcut === "Q") {
      return editorMode === "comment" && activeFeedbackType === "question";
    }
    return editorMode === mode.key;
  };

  // Get badge count for a mode
  const getBadgeCount = (mode: ModeConfig): number => {
    if (mode.shortcut === "C") return commentCount;
    if (mode.shortcut === "Q") return questionCount;
    // Future: add counts for other modes (text edits, etc.)
    return 0;
  };

  // Handle mode button click
  const handleModeClick = (mode: ModeConfig) => {
    if (mode.disabled) return;

    // Special handling for Comment vs Question
    if (mode.shortcut === "C") {
      setActiveFeedbackType("comment");
      setEditorMode("inspector"); // Map to extension's inspector mode
      return;
    }
    if (mode.shortcut === "Q") {
      setActiveFeedbackType("question");
      setEditorMode("inspector");
      return;
    }

    // For select-prompt, map to inspector for now
    if (mode.key === "select-prompt") {
      setEditorMode("inspector");
      return;
    }

    // Radio toggle for Preview mode - pressing P again exits to inspector
    if (mode.key === "preview" && editorMode === "inspector") {
      // Just stay in inspector mode for extension
      return;
    }

    // Map other modes to extension's available modes
    setEditorMode("inspector");
  };

  return (
    <DogfoodBoundary name="FloatingModeBar" file="FloatingModeBar.tsx" category="mode">
      <>
        <div
          ref={elementRef}
          className="fixed z-30"
          style={{
            left: position.x,
            top: position.y,
          }}
          data-devflow-id="floating-mode-bar"
        >
          <div className={`flex ${isVertical ? "flex-col" : ""} items-center gap-1 bg-neutral-900/90 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border border-neutral-700/50`}>
            {/* Drag Handle */}
            <DragHandle
              onDragStart={handleDragStart}
              isDragging={isDragging}
              orientation={isVertical ? "vertical" : "horizontal"}
            />

            {/* Divider after drag handle */}
            <div className={isVertical ? "w-6 h-px bg-neutral-700/50 my-0.5" : "w-px h-6 bg-neutral-700/50 mx-0.5"} />

            {modes.map((mode) => {
              const isActive = isModeActive(mode);
              const badgeCount = getBadgeCount(mode);

              return (
                <ModeButton
                  key={`${mode.key}-${mode.shortcut}`}
                  mode={mode}
                  isActive={isActive}
                  badgeCount={badgeCount}
                  onClick={() => handleModeClick(mode)}
                  tooltipSide={isVertical ? (snapEdge === "left" ? "right" : "left") : (snapEdge === "top" ? "bottom" : "top")}
                />
              );
            })}
          </div>
        </div>
      </>
    </DogfoodBoundary>
  );
}

// ============================================================================
// Tooltip Component
// ============================================================================

interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Children to wrap */
  children: React.ReactNode;
  /** Delay before showing tooltip in ms (default: 150) */
  delay?: number;
  /** Which side to show the tooltip on (default: "top") */
  side?: "top" | "bottom" | "right" | "left";
}

/**
 * Tooltip - Hover tooltip with delay and fade animation
 *
 * Shows a tooltip above the children element after a delay.
 * Fades out quickly on mouse leave.
 */
export function Tooltip({ content, children, delay = 150, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShouldRender(true);
      // Small delay to allow DOM to render before triggering animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    // Wait for fade out animation before removing from DOM
    setTimeout(() => {
      setShouldRender(false);
    }, 100);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {shouldRender && (
        <div
          className={`
            absolute z-50 pointer-events-none transition-opacity duration-100
            ${isVisible ? "opacity-100" : "opacity-0"}
            ${side === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-2" : ""}
            ${side === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-2" : ""}
            ${side === "right" ? "left-full top-1/2 -translate-y-1/2 ml-2" : ""}
            ${side === "left" ? "right-full top-1/2 -translate-y-1/2 mr-2" : ""}
          `}
        >
          <div className="bg-neutral-800 text-neutral-100 text-xs px-2 py-1.5 rounded-sm shadow-lg whitespace-nowrap border border-neutral-600">
            {content}
          </div>
          {/* Arrow */}
          {side === "top" && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-neutral-800" />
            </div>
          )}
          {side === "bottom" && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px">
              <div className="border-4 border-transparent border-b-neutral-800" />
            </div>
          )}
          {side === "right" && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px">
              <div className="border-4 border-transparent border-r-neutral-800" />
            </div>
          )}
          {side === "left" && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-px">
              <div className="border-4 border-transparent border-l-neutral-800" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Mode Button Component
// ============================================================================

interface ModeButtonProps {
  mode: ModeConfig;
  isActive: boolean;
  badgeCount: number;
  onClick: () => void;
  tooltipSide?: "top" | "bottom" | "right" | "left";
}

function ModeButton({ mode, isActive, badgeCount, onClick, tooltipSide = "top" }: ModeButtonProps) {
  // Build tooltip content with mode name, shortcut, and optional disabled reason
  const tooltipContent = (
    <span className="flex items-center gap-1.5">
      <span>{mode.label}</span>
      <kbd className="bg-neutral-700 px-1 rounded text-[10px] font-mono">{mode.shortcut}</kbd>
      {mode.disabled && mode.disabledReason && (
        <span className="text-neutral-400 ml-1">- {mode.disabledReason}</span>
      )}
    </span>
  );

  return (
    <Tooltip content={tooltipContent} side={tooltipSide}>
      <button
        onClick={onClick}
        disabled={mode.disabled}
        className={`
          relative p-2 rounded-md transition-colors
          ${isActive
            ? "bg-blue-600 text-white"
            : mode.disabled
              ? "text-neutral-500/50 cursor-not-allowed"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50"
          }
          ${mode.disabled ? "opacity-50" : ""}
        `}
        aria-label={mode.label}
      >
        {mode.icon}

        {/* Badge for pending counts */}
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>
    </Tooltip>
  );
}

export default FloatingModeBar;
