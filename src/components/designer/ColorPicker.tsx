import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "../../stores/appStore";

// ============================================================================
// Types
// ============================================================================

export type ColorMode = "token" | "custom";
export type InputMode = "hex" | "rgb" | "hsl";

export interface ColorValue {
  mode: ColorMode;
  tokenName?: string;
  hex: string;
  alpha: number;
}

export interface ColorToken {
  name: string;
  value: string;
  resolvedHex: string;
  category?: string;
}

export interface ColorPickerProps {
  /** Current color value */
  value: ColorValue;
  /** Called when color changes */
  onChange: (value: ColorValue) => void;
  /** Label for the picker */
  label?: string;
  /** Whether picker is disabled */
  disabled?: boolean;
  /** Show alpha slider */
  showAlpha?: boolean;
  /** Property name for CSS output (e.g., "background-color") */
  cssProperty?: string;
}

// ============================================================================
// Color Utilities
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/** Calculate Delta E (CIE76) color difference between two colors */
function colorDeltaE(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;

  // Convert to Lab (simplified approximation)
  const rgbToLab = (r: number, g: number, b: number) => {
    // Simplified RGB to Lab conversion
    r /= 255;
    g /= 255;
    b /= 255;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const a = 0.5 * (r - g);
    const bVal = 0.25 * (r + g - 2 * b);
    return { l: l * 100, a: a * 100, b: bVal * 100 };
  };

  const lab1 = rgbToLab(rgb1.r, rgb1.g, rgb1.b);
  const lab2 = rgbToLab(rgb2.r, rgb2.g, rgb2.b);

  return Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) +
      Math.pow(lab1.a - lab2.a, 2) +
      Math.pow(lab1.b - lab2.b, 2)
  );
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function parseColorValue(value: string): string | null {
  // Already a hex
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) {
    // Expand 3-digit hex
    const [, r, g, b] = value.match(/#(.)(.)(.)/) || [];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  // RGB format
  const rgbMatch = value.match(
    /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i
  );
  if (rgbMatch) {
    return rgbToHex(
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3])
    );
  }

  // HSL format
  const hslMatch = value.match(
    /hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i
  );
  if (hslMatch) {
    const { r, g, b } = hslToRgb(
      parseInt(hslMatch[1]),
      parseInt(hslMatch[2]),
      parseInt(hslMatch[3])
    );
    return rgbToHex(r, g, b);
  }

  return null;
}

// ============================================================================
// Recent Colors Hook
// ============================================================================

const RECENT_COLORS_KEY = "radflow-recent-colors";
const MAX_RECENT_COLORS = 8;

function useRecentColors() {
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_COLORS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecentColor = useCallback((hex: string) => {
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== hex);
      const updated = [hex, ...filtered].slice(0, MAX_RECENT_COLORS);
      try {
        localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return { recentColors, addRecentColor };
}

// ============================================================================
// Main ColorPicker Component
// ============================================================================

export function ColorPicker({
  value,
  onChange,
  label,
  disabled = false,
  showAlpha = true,
  cssProperty,
}: ColorPickerProps) {
  const tokens = useAppStore((s) => s.tokens);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("hex");
  const [showTokenSuggestion, setShowTokenSuggestion] = useState(false);
  const [suggestedToken, setSuggestedToken] = useState<ColorToken | null>(null);
  const { recentColors, addRecentColor } = useRecentColors();
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract color tokens from theme
  const colorTokens = useMemo((): ColorToken[] => {
    if (!tokens) return [];
    const result: ColorToken[] = [];

    const processTokens = (source: Partial<{ [key: string]: string }> | undefined) => {
      if (!source) return;
      for (const [name, val] of Object.entries(source)) {
        if (val && isColorToken(name, val)) {
          const resolved = parseColorValue(val);
          if (resolved) {
            result.push({
              name: `--${name}`,
              value: val,
              resolvedHex: resolved,
              category: getCategoryFromName(name),
            });
          }
        }
      }
    };

    processTokens(tokens.public);
    processTokens(tokens.inline);
    return result;
  }, [tokens]);

  // Check for matching tokens when using custom color
  useEffect(() => {
    if (value.mode === "custom" && isValidHex(value.hex)) {
      const match = colorTokens.find(
        (t) => colorDeltaE(t.resolvedHex, value.hex) < 3
      );
      if (match) {
        setSuggestedToken(match);
        setShowTokenSuggestion(true);
      } else {
        setSuggestedToken(null);
        setShowTokenSuggestion(false);
      }
    } else {
      setShowTokenSuggestion(false);
    }
  }, [value.hex, value.mode, colorTokens]);

  // Handle token selection
  const handleTokenSelect = useCallback(
    (token: ColorToken) => {
      onChange({
        mode: "token",
        tokenName: token.name,
        hex: token.resolvedHex,
        alpha: value.alpha,
      });
      setIsExpanded(false);
    },
    [onChange, value.alpha]
  );

  // Handle detach (convert token to custom)
  const handleDetach = useCallback(() => {
    onChange({
      mode: "custom",
      hex: value.hex,
      alpha: value.alpha,
    });
  }, [onChange, value]);

  // Handle custom color change
  const handleColorChange = useCallback(
    (hex: string) => {
      onChange({
        mode: "custom",
        hex,
        alpha: value.alpha,
      });
    },
    [onChange, value.alpha]
  );

  // Handle alpha change
  const handleAlphaChange = useCallback(
    (alpha: number) => {
      onChange({
        ...value,
        alpha,
      });
    },
    [onChange, value]
  );

  // Apply recent color
  const handleRecentColorSelect = useCallback(
    (hex: string) => {
      addRecentColor(hex);
      onChange({
        mode: "custom",
        hex,
        alpha: value.alpha,
      });
    },
    [onChange, value.alpha, addRecentColor]
  );

  // Use suggested token
  const handleUseSuggestedToken = useCallback(() => {
    if (suggestedToken) {
      handleTokenSelect(suggestedToken);
    }
  }, [suggestedToken, handleTokenSelect]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExpanded]);

  return (
    <div
      ref={containerRef}
      className={`relative ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Label */}
      {label && (
        <label className="text-xs font-medium text-text-muted block mb-1.5">
          {label}
        </label>
      )}

      {/* Collapsed State - Color Swatch + Name + Detach */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer
          ${isExpanded ? "border-accent bg-accent/10" : "border-edge bg-background hover:border-accent/50"}
        `}
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
      >
        {/* Color Swatch */}
        <div
          className="w-6 h-6 rounded border border-edge flex-shrink-0"
          style={{
            backgroundColor: value.hex,
            opacity: value.alpha / 100,
          }}
        />

        {/* Token Name or Hex Value */}
        <span className="flex-1 text-sm font-mono truncate text-text">
          {value.mode === "token" && value.tokenName
            ? value.tokenName
            : value.hex}
        </span>

        {/* Detach Button (only for token mode) */}
        {value.mode === "token" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDetach();
            }}
            className="p-1 rounded hover:bg-background text-text-muted hover:text-text transition-colors"
            title="Detach from token"
          >
            <DetachIcon />
          </button>
        )}

        {/* Expand Arrow */}
        <span className="text-text-muted text-xs">
          {isExpanded ? "\u25B2" : "\u25BC"}
        </span>
      </div>

      {/* Token Suggestion Warning */}
      {showTokenSuggestion && suggestedToken && (
        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-700">
            This looks like{" "}
            <code className="font-mono">{suggestedToken.name}</code>.{" "}
            <button
              onClick={handleUseSuggestedToken}
              className="underline hover:text-yellow-800"
            >
              Use token?
            </button>
          </p>
        </div>
      )}

      {/* Expanded Picker */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface border border-edge rounded-lg shadow-xl">
          {/* Saturation/Lightness Plane */}
          <SaturationLightnessPlane
            value={value}
            onChange={handleColorChange}
          />

          {/* Hue Slider */}
          <div className="px-3 py-2">
            <HueSlider
              value={value}
              onChange={handleColorChange}
            />
          </div>

          {/* Alpha Slider */}
          {showAlpha && (
            <div className="px-3 pb-2">
              <AlphaSlider
                value={value}
                onChange={handleAlphaChange}
              />
            </div>
          )}

          {/* Color Input Tabs */}
          <div className="px-3 pb-2">
            <ColorInputTabs
              value={value}
              onChange={handleColorChange}
              inputMode={inputMode}
              onModeChange={setInputMode}
            />
          </div>

          {/* Eyedropper */}
          <div className="px-3 pb-2">
            <EyedropperButton
              onColorPicked={(hex) => {
                handleColorChange(hex);
                addRecentColor(hex);
              }}
            />
          </div>

          {/* Token Suggestions */}
          <TokenSuggestions
            tokens={colorTokens}
            onSelect={handleTokenSelect}
          />

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <RecentColors
              colors={recentColors}
              onSelect={handleRecentColorSelect}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface SaturationLightnessPlaneProps {
  value: ColorValue;
  onChange: (hex: string) => void;
}

function SaturationLightnessPlane({
  value,
  onChange,
}: SaturationLightnessPlaneProps) {
  const planeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const rgb = hexToRgb(value.hex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 50, l: 50 };

  const handleInteraction = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!planeRef.current) return;
      const rect = planeRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      const s = Math.round(x * 100);
      const l = Math.round((1 - y) * 100);
      const { r, g, b } = hslToRgb(hsl.h, s, l);
      onChange(rgbToHex(r, g, b));
    },
    [hsl.h, onChange]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleInteraction(e);
    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleInteraction]);

  return (
    <div
      ref={planeRef}
      className="h-40 relative cursor-crosshair mx-3 mt-3 rounded-lg overflow-hidden"
      style={{
        background: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, hsl(${hsl.h}, 100%, 50%))
        `,
      }}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleInteraction(e);
      }}
    >
      {/* Cursor */}
      <div
        className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
        style={{
          left: `${hsl.s}%`,
          top: `${100 - hsl.l}%`,
          backgroundColor: value.hex,
        }}
      />
    </div>
  );
}

interface HueSliderProps {
  value: ColorValue;
  onChange: (hex: string) => void;
}

function HueSlider({ value, onChange }: HueSliderProps) {
  const rgb = hexToRgb(value.hex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 50, l: 50 };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value);
    const { r, g, b } = hslToRgb(h, hsl.s, hsl.l);
    onChange(rgbToHex(r, g, b));
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min="0"
        max="360"
        value={hsl.h}
        onChange={handleChange}
        className="flex-1 h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
        }}
      />
      <span className="text-xs text-text-muted w-8 text-right">{hsl.h}</span>
    </div>
  );
}

interface AlphaSliderProps {
  value: ColorValue;
  onChange: (alpha: number) => void;
}

function AlphaSlider({ value, onChange }: AlphaSliderProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min="0"
        max="100"
        value={value.alpha}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, transparent, ${value.hex})`,
        }}
      />
      <span className="text-xs text-text-muted w-10 text-right">
        {value.alpha}%
      </span>
    </div>
  );
}

interface ColorInputTabsProps {
  value: ColorValue;
  onChange: (hex: string) => void;
  inputMode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

function ColorInputTabs({
  value,
  onChange,
  inputMode,
  onModeChange,
}: ColorInputTabsProps) {
  const rgb = hexToRgb(value.hex) || { r: 0, g: 0, b: 0 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const [hexInput, setHexInput] = useState(value.hex);
  const [rgbInput, setRgbInput] = useState(rgb);
  const [hslInput, setHslInput] = useState(hsl);

  // Sync external value changes
  useEffect(() => {
    setHexInput(value.hex);
    const newRgb = hexToRgb(value.hex) || { r: 0, g: 0, b: 0 };
    setRgbInput(newRgb);
    setHslInput(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  }, [value.hex]);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (isValidHex(val)) {
      onChange(val);
    }
  };

  const handleRgbChange = (channel: "r" | "g" | "b", val: number) => {
    const newRgb = { ...rgbInput, [channel]: val };
    setRgbInput(newRgb);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHslChange = (channel: "h" | "s" | "l", val: number) => {
    const newHsl = { ...hslInput, [channel]: val };
    setHslInput(newHsl);
    const { r, g, b } = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    onChange(rgbToHex(r, g, b));
  };

  return (
    <div>
      {/* Mode Tabs */}
      <div className="flex gap-1 mb-2">
        {(["hex", "rgb", "hsl"] as InputMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`
              flex-1 px-2 py-1 text-xs rounded uppercase font-medium transition-colors
              ${inputMode === mode ? "bg-accent text-white" : "bg-background text-text-muted hover:text-text"}
            `}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* HEX Input */}
      {inputMode === "hex" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">#</span>
          <input
            type="text"
            value={hexInput.replace("#", "")}
            onChange={(e) => handleHexChange("#" + e.target.value)}
            maxLength={6}
            className="flex-1 px-2 py-1.5 text-sm font-mono bg-background border border-edge rounded focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {/* RGB Inputs */}
      {inputMode === "rgb" && (
        <div className="flex gap-2">
          {(["r", "g", "b"] as const).map((channel) => (
            <div key={channel} className="flex-1">
              <label className="text-[10px] text-text-muted uppercase block mb-0.5">
                {channel}
              </label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgbInput[channel]}
                onChange={(e) =>
                  handleRgbChange(channel, parseInt(e.target.value) || 0)
                }
                className="w-full px-2 py-1.5 text-sm font-mono bg-background border border-edge rounded focus:outline-none focus:border-accent"
              />
            </div>
          ))}
        </div>
      )}

      {/* HSL Inputs */}
      {inputMode === "hsl" && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-text-muted uppercase block mb-0.5">
              H
            </label>
            <input
              type="number"
              min="0"
              max="360"
              value={hslInput.h}
              onChange={(e) =>
                handleHslChange("h", parseInt(e.target.value) || 0)
              }
              className="w-full px-2 py-1.5 text-sm font-mono bg-background border border-edge rounded focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-text-muted uppercase block mb-0.5">
              S%
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={hslInput.s}
              onChange={(e) =>
                handleHslChange("s", parseInt(e.target.value) || 0)
              }
              className="w-full px-2 py-1.5 text-sm font-mono bg-background border border-edge rounded focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-text-muted uppercase block mb-0.5">
              L%
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={hslInput.l}
              onChange={(e) =>
                handleHslChange("l", parseInt(e.target.value) || 0)
              }
              className="w-full px-2 py-1.5 text-sm font-mono bg-background border border-edge rounded focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface EyedropperButtonProps {
  onColorPicked: (hex: string) => void;
}

function EyedropperButton({ onColorPicked }: EyedropperButtonProps) {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if EyeDropper API is supported
    setIsSupported("EyeDropper" in window);
  }, []);

  const handleClick = async () => {
    if (!isSupported) return;

    try {
      // @ts-expect-error EyeDropper API is not in TypeScript types yet
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        onColorPicked(result.sRGBHex);
      }
    } catch (err) {
      // User cancelled or error
      console.debug("EyeDropper cancelled:", err);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-text bg-background border border-edge rounded hover:border-accent/50 transition-colors"
    >
      <EyedropperIcon />
      <span>Pick from screen</span>
    </button>
  );
}

interface TokenSuggestionsProps {
  tokens: ColorToken[];
  onSelect: (token: ColorToken) => void;
}

function TokenSuggestions({ tokens, onSelect }: TokenSuggestionsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens.slice(0, 12);
    const query = searchQuery.toLowerCase();
    return tokens
      .filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query)
      )
      .slice(0, 12);
  }, [tokens, searchQuery]);

  if (tokens.length === 0) return null;

  return (
    <div className="border-t border-edge">
      <div className="px-3 py-2 border-b border-edge">
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-background border border-edge rounded focus:outline-none focus:border-accent"
        />
      </div>
      <div className="p-2">
        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1 px-1">
          Tokens
        </div>
        <div className="flex flex-wrap gap-1">
          {filteredTokens.map((token) => (
            <button
              key={token.name}
              onClick={() => onSelect(token)}
              className="flex items-center gap-1 px-2 py-1 rounded border border-edge hover:border-accent/50 bg-background text-xs transition-colors"
              title={`${token.name}: ${token.value}`}
            >
              <div
                className="w-3 h-3 rounded-sm border border-edge/50"
                style={{ backgroundColor: token.resolvedHex }}
              />
              <span className="truncate max-w-[80px] text-text">
                {token.name.replace("--", "")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface RecentColorsProps {
  colors: string[];
  onSelect: (hex: string) => void;
}

function RecentColors({ colors, onSelect }: RecentColorsProps) {
  return (
    <div className="border-t border-edge p-2">
      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1 px-1">
        Recent
      </div>
      <div className="flex gap-1">
        {colors.map((hex, i) => (
          <button
            key={`${hex}-${i}`}
            onClick={() => onSelect(hex)}
            className="w-6 h-6 rounded border border-edge hover:border-accent transition-colors"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function DetachIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function EyedropperIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function isColorToken(name: string, value: string): boolean {
  if (
    value.startsWith("#") ||
    value.startsWith("rgb") ||
    value.startsWith("hsl") ||
    value.startsWith("oklch") ||
    value.startsWith("oklab")
  ) {
    return true;
  }

  const colorKeywords = [
    "color",
    "background",
    "bg",
    "text",
    "border",
    "fill",
    "stroke",
    "accent",
    "primary",
    "secondary",
    "surface",
    "muted",
    "foreground",
  ];

  return colorKeywords.some((kw) => name.toLowerCase().includes(kw));
}

function getCategoryFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("background") || lower.includes("bg")) return "background";
  if (lower.includes("text") || lower.includes("foreground")) return "text";
  if (lower.includes("border") || lower.includes("edge")) return "border";
  if (lower.includes("accent") || lower.includes("primary")) return "accent";
  if (lower.includes("surface")) return "surface";
  if (lower.includes("muted")) return "muted";
  return "other";
}

// ============================================================================
// Default Export
// ============================================================================

export default ColorPicker;
