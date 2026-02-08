/**
 * ModeToolbar — Top-level mode selector and design sub-mode grid
 *
 * Reads from modeSlice, sends mode change requests to content script
 * via the content bridge. When Design mode is active, shows a 3x3
 * grid of sub-mode buttons with number key labels.
 */

import { useAppStore } from '../stores/appStore';
import {
  TOP_LEVEL_MODES,
  DESIGN_SUB_MODES,
  type TopLevelMode,
  type DesignSubMode,
  type ModeConfig,
  type DesignSubModeConfig,
} from '@flow/shared';
import {
  MousePointer2,
  Palette,
  MessageSquare,
  Search,
  Eye,
  Type,
  Hand,
} from './ui/icons';
import { Tooltip } from './ui/Tooltip';
import { DogfoodBoundary } from './ui/DogfoodBoundary';

// ── Icon mapping for top-level modes ──

const MODE_ICONS: Partial<Record<TopLevelMode, React.ReactNode>> = {
  select: <MousePointer2 className="w-4 h-4" />,
  design: <Palette className="w-4 h-4" />,
  annotate: <MessageSquare className="w-4 h-4" />,
  search: <Search className="w-4 h-4" />,
  inspector: <Eye className="w-4 h-4" />,
  editText: <Type className="w-4 h-4" />,
};

// Modes to show in the toolbar (skip 'default' — that's Escape)
const TOOLBAR_MODES = (TOP_LEVEL_MODES as readonly ModeConfig[]).filter(
  (m) => m.id !== 'default'
);

export function ModeToolbar() {
  const mode = useAppStore((s) => s.mode);
  const requestModeChange = useAppStore((s) => s.requestModeChange);
  const requestSubModeChange = useAppStore((s) => s.requestSubModeChange);

  const handleModeClick = (modeId: TopLevelMode) => {
    if (mode.topLevel === modeId) {
      // Toggle off — return to default
      requestModeChange('default');
    } else {
      requestModeChange(modeId);
    }
  };

  const handleSubModeClick = (subModeId: DesignSubMode) => {
    requestSubModeChange(subModeId);
  };

  return (
    <DogfoodBoundary name="ModeToolbar" file="ModeToolbar.tsx" category="mode">
      <div className="bg-neutral-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-700/50">
        {/* Top-level mode buttons */}
        <div className="flex items-center gap-0.5 px-2 py-1">
          {TOOLBAR_MODES.map((config) => {
            const isActive = mode.topLevel === config.id;
            const icon = MODE_ICONS[config.id] ?? <Hand className="w-4 h-4" />;
            const hotkeyLabel = config.hotkey
              ? config.hotkey.charAt(0).toUpperCase() + config.hotkey.slice(1)
              : '';

            return (
              <Tooltip
                key={config.id}
                content={
                  <span className="flex items-center gap-1.5">
                    <span>{config.label}</span>
                    {hotkeyLabel && (
                      <kbd className="bg-neutral-700 px-1 rounded text-[10px] font-mono">
                        {hotkeyLabel}
                      </kbd>
                    )}
                  </span>
                }
                side="bottom"
              >
                <button
                  onClick={() => handleModeClick(config.id)}
                  className={`
                    p-1.5 rounded transition-colors
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
                    }
                  `}
                  aria-label={config.label}
                  aria-pressed={isActive}
                >
                  {icon}
                </button>
              </Tooltip>
            );
          })}

          {/* Escape / reset button */}
          {mode.topLevel !== 'default' && (
            <Tooltip
              content={
                <span className="flex items-center gap-1.5">
                  <span>Exit Mode</span>
                  <kbd className="bg-neutral-700 px-1 rounded text-[10px] font-mono">Esc</kbd>
                </span>
              }
              side="bottom"
            >
              <button
                onClick={() => requestModeChange('default')}
                className="ml-auto p-1.5 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50 transition-colors"
                aria-label="Exit mode"
              >
                <XSmall />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Design sub-mode grid — only visible when Design mode is active */}
        {mode.topLevel === 'design' && (
          <div className="px-2 pb-1.5">
            <div className="grid grid-cols-3 gap-0.5">
              {(DESIGN_SUB_MODES as readonly DesignSubModeConfig[]).map((sub) => {
                const isActive = mode.designSubMode === sub.id;
                return (
                  <Tooltip
                    key={sub.id}
                    content={
                      <span className="flex items-center gap-1.5">
                        <span>{sub.label}</span>
                        <kbd className="bg-neutral-700 px-1 rounded text-[10px] font-mono">
                          {sub.key}
                        </kbd>
                        <span className="text-neutral-400 text-[10px]">
                          {sub.tooltip}
                        </span>
                      </span>
                    }
                    side="bottom"
                  >
                    <button
                      onClick={() => handleSubModeClick(sub.id)}
                      className={`
                        flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors
                        ${isActive
                          ? 'bg-blue-600/80 text-white'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
                        }
                      `}
                      aria-label={sub.label}
                      aria-pressed={isActive}
                    >
                      <span className="text-[10px] font-mono opacity-50">{sub.key}</span>
                      <span className="truncate">{sub.label}</span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DogfoodBoundary>
  );
}

function XSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default ModeToolbar;
