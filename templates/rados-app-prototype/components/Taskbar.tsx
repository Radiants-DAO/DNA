import { Badge, Button } from '@rdna/radiants/components/core';
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
    <footer className="sticky bottom-0 z-10 border-t border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-mute">
          Window {windowId}
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const isActive = preset.label === activePreset;
            return (
              <Button
                key={preset.label}
                mode={isActive ? 'solid' : 'flat'}
                tone={isActive ? 'accent' : 'neutral'}
                size="sm"
                compact
                onClick={() => onSelectPreset(preset)}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            size="sm"
            variant={controlSurfaceEnabled ? 'success' : 'default'}
          >
            {controlSurfaceEnabled ? 'control live' : 'control stub'}
          </Badge>
        </div>
      </div>
    </footer>
  );
}
