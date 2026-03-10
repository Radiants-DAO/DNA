"use client";

const PRESETS = [
  { id: "compact", label: "Compact", width: 320, height: 240 },
  { id: "desktop", label: "Desktop", width: 640, height: 480 },
  { id: "mobile", label: "Mobile", width: 375, height: 667 },
] as const;

interface ViewportPresetBarProps {
  activePreset: string;
  onSelect: (presetId: string, width: number, height: number) => void;
}

export function ViewportPresetBar({ activePreset, onSelect }: ViewportPresetBarProps) {
  return (
    <div className="flex items-center gap-1">
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset.id, preset.width, preset.height)}
          className={`rounded-sm px-2 py-1 text-xs transition-colors ${
            activePreset === preset.id
              ? "bg-action-primary text-content-inverted"
              : "text-content-secondary hover:bg-surface-secondary"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export { PRESETS };
