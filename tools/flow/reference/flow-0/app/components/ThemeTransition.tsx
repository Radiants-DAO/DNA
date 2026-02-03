import { useEffect, useState, useRef } from "react";

/**
 * ThemeTransition - Full-screen ASCII wipe animation when switching themes
 *
 * ASCII characters cascade across the screen (░▒▓█▓▒░ wipe left-to-right).
 * Old content fades out, wipe passes, new content fades in.
 * ~300ms duration, CSS-only animation overlay.
 */

const ASCII_CHARS = "░▒▓█▓▒░";

interface ThemeTransitionProps {
  /** Set to true to trigger the wipe animation */
  active: boolean;
  /** Called when animation completes */
  onComplete?: () => void;
}

export function ThemeTransition({ active, onComplete }: ThemeTransitionProps) {
  const [phase, setPhase] = useState<"idle" | "wipe-in" | "wipe-out">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      setPhase("wipe-in");

      timeoutRef.current = setTimeout(() => {
        setPhase("wipe-out");

        timeoutRef.current = setTimeout(() => {
          setPhase("idle");
          onComplete?.();
        }, 150);
      }, 150);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, onComplete]);

  if (phase === "idle") return null;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* ASCII wipe columns */}
      <div
        className={`absolute inset-0 flex ${
          phase === "wipe-in"
            ? "animate-wipe-in"
            : "animate-wipe-out"
        }`}
        style={{
          fontFamily: "monospace",
          fontSize: "14px",
          lineHeight: "1",
          color: "var(--color-content-primary, #fff)",
          opacity: phase === "wipe-in" ? 1 : 0.6,
        }}
      >
        {Array.from({ length: 80 }, (_, col) => (
          <div
            key={col}
            className="flex-shrink-0 overflow-hidden"
            style={{
              width: "calc(100vw / 80)",
              animationDelay: `${col * 3}ms`,
              animation: `ascii-col-${phase === "wipe-in" ? "in" : "out"} 200ms ease-out ${col * 3}ms both`,
            }}
          >
            {Array.from({ length: 60 }, (_, row) => (
              <span key={row} className="block text-center opacity-60">
                {ASCII_CHARS[(col + row) % ASCII_CHARS.length]}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes ascii-col-in {
          0% { opacity: 0; transform: scaleY(0); }
          50% { opacity: 1; transform: scaleY(1); }
          100% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes ascii-col-out {
          0% { opacity: 1; transform: scaleY(1); }
          100% { opacity: 0; transform: scaleY(0); }
        }
      `}</style>
    </div>
  );
}

export default ThemeTransition;
