/**
 * Tooltip - Hover tooltip with delay and fade animation
 *
 * Shows a tooltip near the children element after a delay.
 * Fades out quickly on mouse leave.
 */

import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  side?: "top" | "bottom" | "right" | "left";
}

export function Tooltip({ content, children, delay = 150, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShouldRender(true);
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
    setTimeout(() => {
      setShouldRender(false);
    }, 100);
  };

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
