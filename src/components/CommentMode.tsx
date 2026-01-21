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
 * - Element IS an iframe: don't try fiber parsing on iframe element itself
 * - Detached nodes: treated as "not in iframe" (graceful fallback)
 */
function isIframeOrInIframe(element: HTMLElement): boolean {
  // Handle detached nodes (ownerDocument can be null)
  if (!element.ownerDocument) {
    return false;
  }

  // Element is inside an iframe
  if (element.ownerDocument !== document) {
    return true;
  }

  // Element IS an iframe (case-insensitive for robustness)
  if (element.tagName.toLowerCase() === "iframe") {
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
        try {
          const fiber = getFiberFromElement(element);
          if (fiber) {
            const debugSource = extractDebugSource(fiber);
            if (debugSource) {
              // Get component name from fiber.type:
              // - string: intrinsic elements ("div", "button") - enhance with element content
              // - function/class: components with .displayName or .name
              let componentName: string;
              let a11yWarning = "";

              if (typeof fiber.type === "string") {
                // Intrinsic element - include content to differentiate
                const { label, hasProperA11y } = getElementLabel(element);
                componentName = label
                  ? `${fiber.type} "${label}"`
                  : fiber.type;

                // Flag interactive elements that need proper a11y labeling
                if (!hasProperA11y && isInteractiveElement(element)) {
                  a11yWarning = ` [needs aria-label or title]`;
                }
              } else {
                componentName = fiber.type?.displayName || fiber.type?.name || "Component";
              }

              return {
                componentName: componentName + a11yWarning,
                source: fiberSourceToLocation(debugSource),
                selector: generateSelector(element),
                devflowId: null,
              };
            }
          }
        } catch (error) {
          // Fiber parsing can fail if React internals change - graceful fallback
          console.warn("[CommentMode] Fiber parsing failed, using fallback:", error);
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
  // Bubbles up from leaf elements to find meaningful interactive parents
  const findElementUnderCursor = useCallback(
    (x: number, y: number): HTMLElement | null => {
      const elements = document.elementsFromPoint(x, y);

      for (const el of elements) {
        // Skip our overlay elements
        if (el.closest("[data-comment-overlay]")) continue;
        // Skip the html and body elements
        if (el.tagName === "HTML" || el.tagName === "BODY") continue;

        // Found an element - now bubble up to find a meaningful parent
        // This handles cases where we hit a text node or icon inside a button
        const meaningful = findMeaningfulElement(el as HTMLElement);

        return meaningful;
      }
      return null;
    },
    []
  );

  /**
   * Walk up the DOM tree to find the most meaningful element to select.
   * Prefers interactive elements (button, a, input) over generic containers.
   * Stops at elements with data attributes or meaningful semantic tags.
   */
  function findMeaningfulElement(element: HTMLElement): HTMLElement {
    let current: HTMLElement | null = element;
    let bestCandidate = element;

    // Walk up max 5 levels looking for a better target
    let depth = 0;
    while (current && depth < 5) {
      // Skip overlay elements
      if (current.hasAttribute("data-comment-overlay")) {
        current = current.parentElement;
        depth++;
        continue;
      }

      // Stop at body/html/root - never select these top-level containers
      if (current.tagName === "HTML" || current.tagName === "BODY" || current.id === "root") break;

      // Interactive elements are great targets
      const tag = current.tagName.toLowerCase();
      if (["button", "a", "input", "select", "textarea", "label"].includes(tag)) {
        return current;
      }

      // Elements with meaningful attributes are good targets
      // Note: data-devflow-id is intentionally excluded - it's on high-level RadFlow panels
      if (
        current.hasAttribute("data-radflow-id") ||
        current.hasAttribute("data-testid") ||
        (current.hasAttribute("role") && current.getAttribute("role") !== "presentation") ||
        current.hasAttribute("tabindex") ||
        (current.id && !current.id.startsWith(":") && !current.id.includes("radix"))
      ) {
        return current;
      }

      // Semantic elements are good targets
      if (["section", "article", "nav", "aside", "header", "footer", "main", "form"].includes(tag)) {
        return current;
      }

      // If current element has click handlers or is focusable, prefer it
      if (current.onclick || current.hasAttribute("onclick")) {
        bestCandidate = current;
      }

      current = current.parentElement;
      depth++;
    }

    return bestCandidate;
  }

  // Handle mouse move to track hovered element
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!inCommentMode) return;

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
    [inCommentMode, findElementUnderCursor, getComponentInfoFromElement, setHoveredCommentElement, altPressed]
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

      // Format element name with line number if available
      const formatElementWithLine = (info: ElementInfo): string => {
        const line = info.source?.line;
        return line ? `${info.componentName}: line ${line}` : info.componentName;
      };

      // For multi-select, combine element names with their line numbers
      const combinedName = selectedElementInfos.length === 1
        ? formatElementWithLine(selectedElementInfos[0])
        : `${selectedElementInfos.length} elements: ${selectedElementInfos.map(formatElementWithLine).join(", ")}`;

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

  // Handle escape key to cancel popover (but stay in comment mode)
  useEffect(() => {
    if (!inCommentMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Only handle Escape if there's something to cancel (popover open)
        const hasPopoverOpen = editingComment || selectedCommentElements.length > 0;

        if (hasPopoverOpen) {
          // Prevent useKeyboardShortcuts from also handling this
          e.preventDefault();
          e.stopImmediatePropagation();

          if (editingComment) {
            setEditingComment(null);
            setClickPosition(null);
          } else {
            handleCancel();
          }
        }
        // If no popover open, let useKeyboardShortcuts handle Escape to exit comment mode
      }
    };

    // Use capture phase to handle before useKeyboardShortcuts
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
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
      />

      {/* Hover highlight with tooltip (show even during multi-select, but not for already-selected elements) */}
      {hoveredCommentElement && hoveredElementInfo && !selectedCommentElements.includes(hoveredCommentElement) && (
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

interface ElementLabelResult {
  label: string | null;
  hasProperA11y: boolean; // true only if has aria-label or title
}

/**
 * Check if element is interactive and should have a11y labeling
 */
function isInteractiveElement(element: HTMLElement): boolean {
  const tag = element.tagName.toLowerCase();
  const interactiveTags = ["button", "a", "input", "select", "textarea", "summary"];
  if (interactiveTags.includes(tag)) return true;

  // Check for role attribute
  const role = element.getAttribute("role");
  const interactiveRoles = ["button", "link", "checkbox", "radio", "tab", "menuitem", "option"];
  if (role && interactiveRoles.includes(role)) return true;

  // Check for tabindex (makes element focusable/interactive)
  if (element.hasAttribute("tabindex")) return true;

  // Check for click handler (data attribute pattern)
  if (element.hasAttribute("onclick") || element.hasAttribute("data-clickable")) return true;

  return false;
}

/**
 * Get a short label for an element (for differentiating intrinsic elements)
 * Prioritizes: title > aria-label > text content > data attributes > classes > position
 * hasProperA11y is true ONLY for title/aria-label (proper a11y for interactive elements)
 */
function getElementLabel(element: HTMLElement): ElementLabelResult {
  // 1. Check for title attribute - PROPER A11Y
  const title = element.getAttribute("title");
  if (title) return { label: title.slice(0, 30), hasProperA11y: true };

  // 2. Check for aria-label - PROPER A11Y
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return { label: ariaLabel.slice(0, 30), hasProperA11y: true };

  // 3. Check for aria-labelledby (proper a11y but need to resolve)
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl?.textContent) {
      return { label: labelEl.textContent.trim().slice(0, 30), hasProperA11y: true };
    }
  }

  // Below here: labels for display but NOT proper a11y for interactive elements

  // 4. Check for text content (only if short and meaningful)
  const text = element.textContent?.trim();
  if (text && text.length > 0 && text.length < 30 && !text.includes("\n")) {
    return { label: text, hasProperA11y: false };
  }

  // 5. Check for placeholder (for inputs) - not ideal a11y
  const placeholder = element.getAttribute("placeholder");
  if (placeholder) return { label: placeholder.slice(0, 30), hasProperA11y: false };

  // 6. Check for alt text (for images) - this IS proper a11y for images
  const alt = element.getAttribute("alt");
  if (alt) return { label: alt.slice(0, 30), hasProperA11y: element.tagName === "IMG" };

  // 7. Check for data-testid or data-id (common in testing)
  const testId = element.getAttribute("data-testid") || element.getAttribute("data-id");
  if (testId) return { label: testId.slice(0, 30), hasProperA11y: false };

  // 8. Check for name attribute (forms)
  const name = element.getAttribute("name");
  if (name) return { label: name.slice(0, 30), hasProperA11y: false };

  // 9. Check for id attribute
  const id = element.id;
  if (id && !id.includes("radix") && !id.startsWith(":")) {
    return { label: id.slice(0, 30), hasProperA11y: false };
  }

  // 10. Extract meaningful class name (skip utility classes)
  if (element.className && typeof element.className === "string") {
    const meaningfulClass = element.className
      .split(/\s+/)
      .find(c =>
        c.length > 2 &&
        !c.includes(":") && // skip hover:, focus:, etc.
        !/^(flex|grid|block|inline|hidden|absolute|relative|fixed|p-|m-|w-|h-|text-|bg-|border-|rounded|gap-|space-|overflow|cursor|transition|transform|opacity|z-|top-|left-|right-|bottom-|max-|min-|items-|justify-|self-|col-|row-)/.test(c)
      );
    if (meaningfulClass) return { label: meaningfulClass, hasProperA11y: false };
  }

  // 11. Last resort: position among siblings of same type
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      (c) => c.tagName === element.tagName
    );
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      return { label: `#${index} of ${siblings.length}`, hasProperA11y: false };
    }
  }

  return { label: null, hasProperA11y: false };
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

    // Add class if available (filter out Tailwind classes with special CSS chars: : / [ ])
    if (current.className && typeof current.className === "string") {
      const classes = current.className
        .split(/\s+/)
        .filter((c) => c && !/[:/\[\]]/.test(c));
      if (classes[0]) {
        selector += `.${classes[0]}`;
      }
    }

    // Add nth-of-type if needed for uniqueness (not nth-child, which counts ALL children)
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
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
    <div
      data-comment-overlay="true"
      className="fixed z-50 pointer-events-none"
      style={{
        left: rect.left,
        top: rect.top - 28,
      }}
    >
      <div className={`px-2 py-1 rounded text-xs font-medium text-white ${
        isQuestion ? "bg-purple-500" : "bg-gray-900"
      }`}>
        {componentName}
      </div>
    </div>
  );
}
