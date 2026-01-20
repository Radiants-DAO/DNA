import { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import { CommentPopover } from "./CommentPopover";
import { CommentBadge } from "./CommentBadge";
import type { SourceLocation, FeedbackType, Feedback } from "../stores/types";
import { getFiberFromElement, extractDebugSource, fiberSourceToLocation } from "../utils/fiberSource";

interface ElementInfo {
  componentName: string;
  source: SourceLocation | null;
  selector: string;
  devflowId: string | null;
}

/**
 * CommentMode - Overlay for adding visual feedback comments to UI elements.
 *
 * Behavior:
 * - Normal hover: Highlights the deepest/most specific element
 * - Alt+hover: Bubbles up to nearest data-devflow-id container
 * - Click: Single select (clears previous)
 * - Shift+click: Toggle element in multi-selection
 * - Multi-select creates one comment for all selected elements
 */
/**
 * Check if element is inside an iframe or IS an iframe.
 * Handles both cases:
 * - Element inside iframe: ownerDocument !== document
 * - Element IS an iframe: check for contentDocument
 */
function isIframeOrInIframe(element: HTMLElement): boolean {
  // Element is inside an iframe
  if (element.ownerDocument !== document) {
    return true;
  }
  // Element IS an iframe (don't try fiber parsing on iframe element itself)
  if (element.tagName === "IFRAME") {
    return true;
  }
  return false;
}

export function CommentMode() {
  // Derive comment mode from editorMode (single source of truth)
  const inCommentMode = useAppStore((s) => s.editorMode === "comment");
  const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);
  const dogfoodMode = useAppStore((s) => s.dogfoodMode);
  const comments = useAppStore((s) => s.comments);
  const addComment = useAppStore((s) => s.addComment);
  const updateComment = useAppStore((s) => s.updateComment);
  const hoveredCommentElement = useAppStore((s) => s.hoveredCommentElement);
  const selectedCommentElements = useAppStore((s) => s.selectedCommentElements);
  const setHoveredCommentElement = useAppStore((s) => s.setHoveredCommentElement);
  const setSelectedCommentElement = useAppStore((s) => s.setSelectedCommentElement);
  const toggleSelectedCommentElement = useAppStore((s) => s.toggleSelectedCommentElement);
  const clearSelectedCommentElements = useAppStore((s) => s.clearSelectedCommentElements);

  // Bridge data for component info
  const bridgeComponentMap = useAppStore((s) => s.bridgeComponentMap);
  const bridgeComponentLookup = useAppStore((s) => s.bridgeComponentLookup);

  // Track Alt key for container selection mode
  const [altPressed, setAltPressed] = useState(false);

  // Local state for click position and popover
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedElementInfos, setSelectedElementInfos] = useState<ElementInfo[]>([]);

  // Track hovered element info for tooltip display
  const [hoveredElementInfo, setHoveredElementInfo] = useState<ElementInfo | null>(null);

  // Editing existing comment
  const [editingComment, setEditingComment] = useState<string | null>(null); // comment ID

  // Ref for the overlay container
  const overlayRef = useRef<HTMLDivElement>(null);

  // Track Alt key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltPressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Find component info from bridge data by radflowId
  const findComponentByRadflowId = useCallback(
    (radflowId: string) => {
      return bridgeComponentLookup.get(radflowId);
    },
    [bridgeComponentLookup]
  );

  // Get info for the actual element (not bubbling to devflow-id)
  const getElementInfo = useCallback(
    (element: HTMLElement): ElementInfo => {
      // Try to get radflowId from element (target project components)
      const radflowId = element.getAttribute("data-radflow-id");
      if (radflowId) {
        const entry = findComponentByRadflowId(radflowId);
        if (entry) {
          return {
            componentName: entry.displayName || entry.name || "Unknown",
            source: entry.source,
            selector: entry.selector || radflowId,
            devflowId: null,
          };
        }
      }

      // Check if this element itself has a devflow-id
      const ownDevflowId = element.getAttribute("data-devflow-id");
      if (ownDevflowId) {
        return {
          componentName: devflowIdToName(ownDevflowId),
          source: null,
          selector: `[data-devflow-id="${ownDevflowId}"]`,
          devflowId: ownDevflowId,
        };
      }

      // NEW: If dogfoodMode is ON and element is NOT in iframe, try fiber parsing
      if (dogfoodMode && !isIframeOrInIframe(element)) {
        const fiber = getFiberFromElement(element);
        if (fiber) {
          const debugSource = extractDebugSource(fiber);
          if (debugSource) {
            // Get component name from fiber.type (handle string types for intrinsics)
            const componentName = typeof fiber.type === "string"
              ? fiber.type
              : (fiber.type?.displayName || fiber.type?.name || "Component");

            return {
              componentName,
              source: fiberSourceToLocation(debugSource),
              selector: generateSelector(element),
              devflowId: null,
            };
          }
        }
      }

      // Fallback: Try to find a meaningful name from the element's context
      const componentName = getReadableElementName(element);
      const selector = generateSelector(element);

      return {
        componentName,
        source: null,
        selector,
        devflowId: null,
      };
    },
    [dogfoodMode, findComponentByRadflowId]
  );

  // Get info for the nearest devflow-id container (Alt+hover behavior)
  const getContainerInfo = useCallback(
    (element: HTMLElement): ElementInfo | null => {
      const devflowId = findDevflowId(element);
      if (devflowId) {
        return {
          componentName: devflowIdToName(devflowId),
          source: null,
          selector: `[data-devflow-id="${devflowId}"]`,
          devflowId,
        };
      }
      return null;
    },
    []
  );

  // Get component info based on Alt key state
  const getComponentInfoFromElement = useCallback(
    (element: HTMLElement, useContainer: boolean): ElementInfo => {
      if (useContainer) {
        const containerInfo = getContainerInfo(element);
        if (containerInfo) return containerInfo;
      }
      return getElementInfo(element);
    },
    [getElementInfo, getContainerInfo]
  );

  // Find the element under cursor (skipping our overlay elements)
  const findElementUnderCursor = useCallback(
    (x: number, y: number): HTMLElement | null => {
      const elements = document.elementsFromPoint(x, y);
      for (const el of elements) {
        // Skip our overlay elements
        if (el.closest("[data-comment-overlay]")) continue;
        // Skip the html and body elements
        if (el.tagName === "HTML" || el.tagName === "BODY") continue;
        return el as HTMLElement;
      }
      return null;
    },
    []
  );

  // Handle mouse move to track hovered element
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!inCommentMode || selectedCommentElements.length > 0) return;

      const target = findElementUnderCursor(e.clientX, e.clientY);
      if (!target) {
        setHoveredCommentElement(null);
        setHoveredElementInfo(null);
        return;
      }

      // Alt+hover bubbles to devflow-id container
      const info = getComponentInfoFromElement(target, altPressed);
      setHoveredCommentElement(info.selector);
      setHoveredElementInfo(info);
    },
    [inCommentMode, selectedCommentElements.length, findElementUnderCursor, getComponentInfoFromElement, setHoveredCommentElement, altPressed]
  );

  // Handle click to select element
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!inCommentMode) return;

      const target = findElementUnderCursor(e.clientX, e.clientY);
      if (!target) return;

      e.preventDefault();
      e.stopPropagation();

      // Alt+click bubbles to devflow-id container
      const info = getComponentInfoFromElement(target, e.altKey);

      if (e.shiftKey) {
        // Shift+click: Toggle in multi-selection
        toggleSelectedCommentElement(info.selector);

        // Update element infos for the selection
        setSelectedElementInfos((prev) => {
          const exists = prev.some((i) => i.selector === info.selector);
          if (exists) {
            return prev.filter((i) => i.selector !== info.selector);
          } else {
            return [...prev, info];
          }
        });

        // Set click position for popover (use latest click)
        setClickPosition({ x: e.clientX, y: e.clientY });
      } else {
        // Regular click: Single select (clears previous)
        setSelectedCommentElement(info.selector);
        setSelectedElementInfos([info]);
        setClickPosition({ x: e.clientX, y: e.clientY });
      }
    },
    [inCommentMode, findElementUnderCursor, getComponentInfoFromElement, setSelectedCommentElement, toggleSelectedCommentElement]
  );

  // Handle comment submission
  const handleAddComment = useCallback(
    (content: string) => {
      if (selectedElementInfos.length === 0 || !clickPosition || !activeFeedbackType) return;

      // For multi-select, combine element names
      const combinedName = selectedElementInfos.length === 1
        ? selectedElementInfos[0].componentName
        : `${selectedElementInfos.length} elements: ${selectedElementInfos.map((i) => i.componentName).join(", ")}`;

      // Use first element's selector/source, but note multi-select in name
      const primaryInfo = selectedElementInfos[0];

      addComment({
        type: activeFeedbackType,
        elementSelector: primaryInfo.selector,
        componentName: combinedName,
        devflowId: primaryInfo.devflowId,
        source: primaryInfo.source,
        content,
        coordinates: clickPosition,
      });

      // Reset state
      clearSelectedCommentElements();
      setSelectedElementInfos([]);
      setClickPosition(null);
    },
    [selectedElementInfos, clickPosition, activeFeedbackType, addComment, clearSelectedCommentElements]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    clearSelectedCommentElements();
    setSelectedElementInfos([]);
    setClickPosition(null);
    setEditingComment(null);
  }, [clearSelectedCommentElements]);

  // Handle editing existing comment
  const handleEditComment = useCallback((comment: Feedback) => {
    setEditingComment(comment.id);
    setClickPosition(comment.coordinates);
  }, []);

  // Handle update comment (for edit mode)
  const handleUpdateComment = useCallback((content: string) => {
    if (editingComment) {
      updateComment(editingComment, content);
      setEditingComment(null);
      setClickPosition(null);
    }
  }, [editingComment, updateComment]);

  // Handle escape key to cancel
  useEffect(() => {
    if (!inCommentMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingComment) {
          setEditingComment(null);
          setClickPosition(null);
        } else if (selectedCommentElements.length > 0) {
          handleCancel();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [inCommentMode, selectedCommentElements.length, editingComment, handleCancel]);

  if (!inCommentMode) {
    return null;
  }

  const hasSelection = selectedCommentElements.length > 0;

  return (
    <>
      {/* Interaction overlay */}
      <div
        ref={overlayRef}
        data-comment-overlay="true"
        className="fixed inset-0 z-40 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ pointerEvents: hasSelection ? "none" : "auto" }}
      />

      {/* Hover highlight with tooltip */}
      {hoveredCommentElement && !hasSelection && hoveredElementInfo && (
        <>
          <ElementHighlight selector={hoveredCommentElement} color="blue" />
          <HoverTooltip
            selector={hoveredCommentElement}
            componentName={hoveredElementInfo.componentName}
            feedbackType={activeFeedbackType}
          />
        </>
      )}

      {/* Selection highlights (multi-select) */}
      {selectedCommentElements.map((selector) => (
        <ElementHighlight key={selector} selector={selector} color="primary" />
      ))}

      {/* Comment popover - new comment mode */}
      {hasSelection && clickPosition && selectedElementInfos.length > 0 && activeFeedbackType && !editingComment && (
        <CommentPopover
          position={clickPosition}
          componentName={
            selectedElementInfos.length === 1
              ? selectedElementInfos[0].componentName
              : `${selectedElementInfos.length} elements selected`
          }
          feedbackType={activeFeedbackType}
          onSubmit={handleAddComment}
          onCancel={handleCancel}
        />
      )}

      {/* Comment popover - edit mode */}
      {editingComment && clickPosition && (() => {
        const comment = comments.find((c) => c.id === editingComment);
        if (!comment) return null;
        return (
          <CommentPopover
            position={clickPosition}
            componentName={comment.componentName}
            feedbackType={comment.type}
            onSubmit={handleUpdateComment}
            onCancel={handleCancel}
            initialContent={comment.content}
            isEditing
          />
        );
      })()}

      {/* Comment badges */}
      {comments.map((comment, index) => (
        <CommentBadge
          key={comment.id}
          index={index + 1}
          comment={comment}
          onEdit={handleEditComment}
        />
      ))}
    </>
  );
}

/**
 * Highlight overlay for an element
 */
function ElementHighlight({
  selector,
  color,
}: {
  selector: string;
  color: "blue" | "primary";
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let element: Element | null = null;

    // Check if selector is already a CSS selector (starts with [, #, ., or contains special chars)
    const isFullSelector = /^[\[#.]|[>\s~+]/.test(selector);

    if (isFullSelector) {
      // Use the selector directly
      try {
        element = document.querySelector(selector);
      } catch {
        // Invalid selector - silently fail
      }
    } else {
      // Treat as a radflow ID - try data-radflow-id first
      element = document.querySelector(`[data-radflow-id="${selector}"]`);

      // If not found, try as a raw selector (e.g., tag name or ID)
      if (!element) {
        try {
          element = document.querySelector(selector);
        } catch {
          // Invalid selector
        }
      }
    }

    if (element) {
      const bounds = element.getBoundingClientRect();
      // Only show highlight if element has dimensions and is visible
      if (bounds.width > 0 && bounds.height > 0) {
        setRect(bounds);
      } else {
        setRect(null);
      }
    } else {
      setRect(null);
    }
  }, [selector]);

  if (!rect) return null;

  const colorStyles = {
    blue: {
      border: "2px solid rgb(59, 130, 246)",
      background: "rgba(59, 130, 246, 0.1)",
    },
    primary: {
      // Use a purple/violet for selection (matches question mode color)
      border: "2px solid rgb(139, 92, 246)",
      background: "rgba(139, 92, 246, 0.15)",
    },
  };

  return (
    <div
      data-comment-overlay="true"
      className="fixed pointer-events-none z-50 rounded"
      style={{
        left: rect.left - 2,
        top: rect.top - 2,
        width: rect.width + 4,
        height: rect.height + 4,
        border: colorStyles[color].border,
        background: colorStyles[color].background,
        boxShadow: color === "blue" ? "0 0 0 1px rgba(59, 130, 246, 0.3)" : undefined,
      }}
    />
  );
}

/**
 * Find the nearest data-devflow-id on element or ancestors
 */
function findDevflowId(element: HTMLElement): string | null {
  let current: HTMLElement | null = element;
  while (current) {
    const devflowId = current.getAttribute("data-devflow-id");
    if (devflowId) return devflowId;
    current = current.parentElement;
  }
  return null;
}

/**
 * Convert a devflow ID to a readable name
 */
function devflowIdToName(devflowId: string): string {
  // Convert kebab-case to Title Case
  return devflowId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get a readable name for an element based on its content and attributes
 */
function getReadableElementName(element: HTMLElement): string {
  // Check for title or aria-label
  const title = element.getAttribute("title");
  if (title) return title;

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // Check for text content (limited length)
  const text = element.textContent?.trim();
  if (text && text.length > 0 && text.length < 50) {
    return text.length > 30 ? text.slice(0, 30) + "..." : text;
  }

  // Check for meaningful class names
  if (element.className && typeof element.className === "string") {
    const classes = element.className.split(/\s+/);
    const meaningfulClass = classes.find(
      (c) =>
        c &&
        !c.startsWith("hover:") &&
        !c.startsWith("focus:") &&
        !c.match(/^(flex|grid|block|inline|hidden|p-|m-|w-|h-|text-|bg-|border-)/)
    );
    if (meaningfulClass) {
      return meaningfulClass;
    }
  }

  // Fallback to tag name
  return element.tagName.toLowerCase();
}

/**
 * Generate a CSS selector for an element
 */
function generateSelector(element: HTMLElement): string {
  // Prefer ID
  if (element.id) {
    return `#${element.id}`;
  }

  // Build a path
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    // Add class if available
    if (current.className && typeof current.className === "string") {
      const classes = current.className.split(/\s+/).filter((c) => c && !c.includes(":"));
      if (classes[0]) {
        selector += `.${classes[0]}`;
      }
    }

    // Add nth-child if needed for uniqueness
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;

    // Stop at reasonable depth
    if (path.length >= 5) break;
  }

  return path.join(" > ");
}

/**
 * HoverTooltip - Shows component name and plus icon on hovered element
 */
function HoverTooltip({
  selector,
  componentName,
  feedbackType,
}: {
  selector: string;
  componentName: string;
  feedbackType: FeedbackType | null;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let element: Element | null = null;

    const isFullSelector = /^[\[#.]|[>\s~+]/.test(selector);

    if (isFullSelector) {
      try {
        element = document.querySelector(selector);
      } catch {
        // Invalid selector
      }
    } else {
      element = document.querySelector(`[data-radflow-id="${selector}"]`);
      if (!element) {
        try {
          element = document.querySelector(selector);
        } catch {
          // Invalid selector
        }
      }
    }

    if (element) {
      const bounds = element.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) {
        setRect(bounds);
      } else {
        setRect(null);
      }
    } else {
      setRect(null);
    }
  }, [selector]);

  if (!rect) return null;

  const isQuestion = feedbackType === "question";

  return (
    <>
      {/* Name tooltip - positioned at top-right of element */}
      <div
        data-comment-overlay="true"
        className="fixed z-50 pointer-events-none flex items-center gap-1"
        style={{
          left: rect.right - 8,
          top: rect.top - 28,
        }}
      >
        <div className={`px-2 py-1 rounded text-xs font-medium text-white ${
          isQuestion ? "bg-purple-500" : "bg-gray-900"
        }`}>
          {componentName}
        </div>
      </div>

      {/* Plus icon - positioned at center-right of element */}
      <div
        data-comment-overlay="true"
        className="fixed z-50 pointer-events-none"
        style={{
          left: rect.right + 4,
          top: rect.top + rect.height / 2 - 10,
        }}
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-lg ${
          isQuestion ? "bg-purple-500" : "bg-blue-500"
        }`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    </>
  );
}
