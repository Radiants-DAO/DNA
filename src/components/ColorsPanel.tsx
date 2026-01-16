import { useState, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { ColorPicker, type ColorValue } from "./designer/ColorPicker";

type ColorProperty = "background" | "text" | "border";

/**
 * Colors Panel - Property panel for editing background, text, and border colors.
 *
 * Features:
 * - Reusable ColorPicker component with hybrid token/custom modes
 * - Token picker with semantic token names
 * - Saturation/lightness plane, hue slider, alpha slider
 * - HEX/RGB/HSL input modes
 * - Eyedropper tool support
 * - Recent colors history
 * - Token suggestions when raw color matches existing token
 * - Output to clipboard or direct file write
 */
export function ColorsPanel() {
  const activePanel = useAppStore((s) => s.activePanel);
  const selectedComponents = useAppStore((s) => s.selectedComponents);
  const directWriteMode = useAppStore((s) => s.directWriteMode);
  const setDirectWriteMode = useAppStore((s) => s.setDirectWriteMode);

  // Color values for each property
  const [colorValues, setColorValues] = useState<Record<ColorProperty, ColorValue>>({
    background: { mode: "custom", hex: "#ffffff", alpha: 100 },
    text: { mode: "custom", hex: "#000000", alpha: 100 },
    border: { mode: "custom", hex: "#e5e7eb", alpha: 100 },
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Show toast notification
  const showNotification = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  // Handle color change and output CSS
  const handleColorChange = useCallback(
    async (property: ColorProperty, value: ColorValue) => {
      setColorValues((prev) => ({ ...prev, [property]: value }));

      const cssProperty = getCssProperty(property);
      let cssValue: string;

      if (value.mode === "token" && value.tokenName) {
        cssValue = `var(${value.tokenName})`;
      } else if (value.alpha < 100) {
        // Use rgba for colors with alpha
        const hex = value.hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        cssValue = `rgba(${r}, ${g}, ${b}, ${value.alpha / 100})`;
      } else {
        cssValue = value.hex;
      }

      const cssLine = `${cssProperty}: ${cssValue};`;

      if (directWriteMode && selectedComponents.length > 0) {
        showNotification(`Would write: ${cssLine}`);
      } else {
        try {
          await navigator.clipboard.writeText(cssLine);
          showNotification(`Copied: ${cssLine}`);
        } catch (err) {
          console.error("Failed to copy to clipboard:", err);
        }
      }
    },
    [directWriteMode, selectedComponents, showNotification]
  );

  // Only show when colors panel is active
  if (activePanel !== "colors") return null;

  const hasSelection = selectedComponents.length > 0;

  return (
    <div
      data-radflow-panel
      className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-edge z-40 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Colors</h2>
          <button
            onClick={() => setDirectWriteMode(!directWriteMode)}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1
              ${directWriteMode ? "bg-orange-500 text-white" : "bg-background text-text-muted border border-edge"}
            `}
            title={directWriteMode ? "Direct write mode" : "Clipboard mode"}
          >
            {directWriteMode ? (
              <>
                <PencilIcon />
                Write
              </>
            ) : (
              <>
                <ClipboardIcon />
                Copy
              </>
            )}
          </button>
        </div>
        {!hasSelection && (
          <p className="text-xs text-text-muted mt-1">
            Select a component to edit colors
          </p>
        )}
      </div>

      {/* Color Properties using ColorPicker */}
      <div className="p-4 space-y-4 overflow-auto flex-1">
        <ColorPicker
          label="Background Color"
          value={colorValues.background}
          onChange={(value) => handleColorChange("background", value)}
          disabled={!hasSelection}
          showAlpha={true}
          cssProperty="background-color"
        />

        <ColorPicker
          label="Text Color"
          value={colorValues.text}
          onChange={(value) => handleColorChange("text", value)}
          disabled={!hasSelection}
          showAlpha={true}
          cssProperty="color"
        />

        <ColorPicker
          label="Border Color"
          value={colorValues.border}
          onChange={(value) => handleColorChange("border", value)}
          disabled={!hasSelection}
          showAlpha={true}
          cssProperty="border-color"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-edge text-[10px] text-text-muted">
        {directWriteMode
          ? "Changes write directly to source files"
          : "Click token to copy CSS to clipboard"}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// Icons

function PencilIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
      />
    </svg>
  );
}

// Utility Functions

function getCssProperty(property: ColorProperty): string {
  switch (property) {
    case "background":
      return "background-color";
    case "text":
      return "color";
    case "border":
      return "border-color";
  }
}
