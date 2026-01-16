import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "../stores/appStore";

interface ComponentInfo {
  name: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  props: Record<string, unknown>;
  parentChain: string[];
}

/**
 * DevModeOverlay - Self-referential dev mode for editing RadFlow itself
 *
 * Activated via Cmd+Shift+K. Click any element to get:
 * - Component name
 * - Source file path and line number
 * - Props
 * - Parent component chain
 * - Formatted output ready to paste into Claude
 */
export function DevModeOverlay() {
  const devMode = useAppStore((s) => s.devMode);
  const setDevMode = useAppStore((s) => s.setDevMode);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<ComponentInfo | null>(null);
  const [copied, setCopied] = useState(false);

  // Get React fiber from DOM element
  const getFiberFromElement = useCallback((element: HTMLElement): any => {
    const keys = Object.keys(element);
    const fiberKey = keys.find(
      (key) => key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")
    );
    return fiberKey ? (element as any)[fiberKey] : null;
  }, []);

  // Walk fiber tree to find component info
  const getComponentInfo = useCallback((element: HTMLElement): ComponentInfo | null => {
    let fiber = getFiberFromElement(element);
    if (!fiber) return null;

    const parentChain: string[] = [];
    let componentFiber = fiber;

    // Walk up to find function/class component (not DOM elements)
    while (componentFiber) {
      if (typeof componentFiber.type === "function") {
        const name = componentFiber.type.displayName || componentFiber.type.name || "Anonymous";

        // Get source location from _debugSource (available in dev builds)
        const source = componentFiber._debugSource;

        if (source?.fileName) {
          // Build parent chain
          let parent = componentFiber.return;
          while (parent && parentChain.length < 5) {
            if (typeof parent.type === "function") {
              const parentName = parent.type.displayName || parent.type.name;
              if (parentName && parentName !== "Anonymous") {
                parentChain.push(parentName);
              }
            }
            parent = parent.return;
          }

          return {
            name,
            filePath: source.fileName.replace(/^.*\/src\//, "src/"),
            lineNumber: source.lineNumber || 0,
            columnNumber: source.columnNumber || 0,
            props: componentFiber.memoizedProps || {},
            parentChain,
          };
        }
      }
      componentFiber = componentFiber.return;
    }

    return null;
  }, [getFiberFromElement]);

  // Format for Claude
  const formatForClaude = useCallback((info: ComponentInfo): string => {
    const propsStr = Object.entries(info.props)
      .filter(([key]) => !key.startsWith("__") && key !== "children")
      .map(([key, value]) => {
        const valueStr = typeof value === "function"
          ? "[Function]"
          : typeof value === "object"
          ? JSON.stringify(value, null, 2).slice(0, 100)
          : String(value);
        return `  ${key}: ${valueStr}`;
      })
      .join("\n");

    return `## Component: ${info.name}

**File:** \`${info.filePath}:${info.lineNumber}\`

**Parent chain:** ${info.parentChain.length > 0 ? info.parentChain.join(" → ") : "(root)"}

**Props:**
\`\`\`
${propsStr || "(none)"}
\`\`\`

---
*Click to read this file: ${info.filePath}*`;
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (info: ComponentInfo) => {
    const text = formatForClaude(info);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [formatForClaude]);

  // Handle click in dev mode
  const handleClick = useCallback((e: MouseEvent) => {
    if (!devMode) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    const info = getComponentInfo(target);

    if (info) {
      setSelectedInfo(info);
      copyToClipboard(info);
    }
  }, [devMode, getComponentInfo, copyToClipboard]);

  // Handle hover in dev mode
  const handleMouseOver = useCallback((e: MouseEvent) => {
    if (!devMode) return;
    setHoveredElement(e.target as HTMLElement);
  }, [devMode]);

  // Handle Escape to exit
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (devMode && e.key === "Escape") {
      e.preventDefault();
      setDevMode(false);
      setSelectedInfo(null);
      setHoveredElement(null);
    }
  }, [devMode, setDevMode]);

  useEffect(() => {
    if (devMode) {
      document.addEventListener("click", handleClick, true);
      document.addEventListener("mouseover", handleMouseOver, true);
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.cursor = "crosshair";
    }

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.cursor = "";
    };
  }, [devMode, handleClick, handleMouseOver, handleKeyDown]);

  if (!devMode) return null;

  // Get hover info for tooltip
  const hoverInfo = hoveredElement ? getComponentInfo(hoveredElement) : null;

  return (
    <>
      {/* Highlight overlay for hovered element */}
      {hoveredElement && (
        <div
          className="fixed pointer-events-none border-2 border-sky-blue bg-sky-blue/10 z-[9998]"
          style={{
            top: hoveredElement.getBoundingClientRect().top,
            left: hoveredElement.getBoundingClientRect().left,
            width: hoveredElement.getBoundingClientRect().width,
            height: hoveredElement.getBoundingClientRect().height,
          }}
        />
      )}

      {/* Hover tooltip */}
      {hoverInfo && hoveredElement && (
        <div
          className="fixed z-[9999] bg-black text-warm-cloud text-xs px-2 py-1 rounded shadow-card font-mono pointer-events-none"
          style={{
            top: hoveredElement.getBoundingClientRect().top - 28,
            left: hoveredElement.getBoundingClientRect().left,
          }}
        >
          {hoverInfo.name} ({hoverInfo.filePath}:{hoverInfo.lineNumber})
        </div>
      )}

      {/* Dev Mode indicator */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] bg-sun-red text-white px-3 py-1 rounded-full text-xs font-bold shadow-card">
        DEV MODE - Click to inspect (Esc to exit)
        {copied && <span className="ml-2 text-green">✓ Copied!</span>}
      </div>

      {/* Selected component panel */}
      {selectedInfo && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-black text-warm-cloud p-4 rounded shadow-card-lg max-w-md font-mono text-xs">
          <div className="font-bold text-sun-yellow mb-2">{selectedInfo.name}</div>
          <div className="text-sky-blue mb-1">
            {selectedInfo.filePath}:{selectedInfo.lineNumber}
          </div>
          <div className="text-warm-cloud/70 mb-2">
            {selectedInfo.parentChain.length > 0 && (
              <span>↳ {selectedInfo.parentChain.join(" → ")}</span>
            )}
          </div>
          <div className="border-t border-warm-cloud/20 pt-2 mt-2">
            <div className="text-warm-cloud/50 mb-1">Props:</div>
            {Object.entries(selectedInfo.props)
              .filter(([key]) => !key.startsWith("__") && key !== "children")
              .slice(0, 5)
              .map(([key, value]) => (
                <div key={key} className="truncate">
                  <span className="text-sun-yellow">{key}</span>:{" "}
                  <span className="text-warm-cloud/70">
                    {typeof value === "function" ? "ƒ" : JSON.stringify(value)?.slice(0, 30)}
                  </span>
                </div>
              ))}
          </div>
          <div className="text-green mt-2">✓ Copied to clipboard</div>
        </div>
      )}
    </>
  );
}
