import type { WindowSizePreset } from '../lib/types';

interface TaskbarProps {
  windowId: string;
  presets: WindowSizePreset[];
  activePreset: string;
  controlSurfaceEnabled: boolean;
  onSelectPreset: (preset: WindowSizePreset) => void;
}

export function Taskbar({
  windowId,
  presets,
  activePreset,
  controlSurfaceEnabled,
  onSelectPreset
}: TaskbarProps) {
  return (
    <footer className="sticky bottom-0 z-10 border-t border-line bg-panel/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          Window {windowId}
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const isActive = preset.label === activePreset;
            return (
              <button
                key={preset.label}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? 'border-accent bg-accent text-slate-950'
                    : 'border-line text-main hover:border-main/60'
                }`}
                onClick={() => onSelectPreset(preset)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto text-[11px] uppercase tracking-[0.22em] text-muted">
          Control surface: {controlSurfaceEnabled ? 'stub enabled' : 'stub disabled'}
        </div>
      </div>
    </footer>
  );
}
