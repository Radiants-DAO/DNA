'use client';

// =============================================================================
// StudioRightRail — Layers dock for the Studio editor.
//
// Hosts the add action + per-layer list (name, move up/down, visibility,
// delete). Canvas and export controls register as separate AppWindow control
// surfaces so each block gets its own parent island.
//
// Paired with:
//   - StudioLeftRail (tools) on the left
//   - StudioColorsRail (brush color swatches) on the right above this rail
//   - StudioBottomRail (status + canvas + history) in its own right-side island
// =============================================================================

import {
  ActionButton,
  LayerRow,
} from '@rdna/ctrl';
import {
  StudioRailDropdown,
  StudioRailSection,
} from './StudioRailSection';
import { Icon } from '@rdna/radiants/icons/runtime';

export interface StudioLayerOption {
  id: string;
  label: string;
  visible: boolean;
}

export interface StudioRightRailProps {
  layers: ReadonlyArray<StudioLayerOption>;
  currentLayerId?: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onMoveLayerUp: (id: string) => void;
  onMoveLayerDown: (id: string) => void;
  onRenameLayer: (id: string, label: string) => void;

  className?: string;
}

export function StudioRightRail({
  layers,
  currentLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleLayerVisibility,
  onMoveLayerUp,
  onMoveLayerDown,
  onRenameLayer,

  className = '',
}: StudioRightRailProps) {
  // Render the top-of-stack layer first (matches the visual order users
  // expect from traditional layer panels).
  const displayLayers = [...layers].reverse();
  const canDelete = layers.length > 1;

  return (
    <StudioRailSection className={className}>
      <StudioRailDropdown
        title="LAYERS"
        collapsedIcon={<Icon name="grid-3x3" />}
        collapsedTooltip="Layers"
      >
        <div className="flex max-h-[12rem] w-full min-w-0 max-w-full flex-col gap-px overflow-y-auto">
          {displayLayers.map((layer, visualIdx) => {
            const isFirst = visualIdx === 0;
            const isLast = visualIdx === displayLayers.length - 1;
            return (
              <LayerRow
                key={layer.id}
                label={layer.label}
                selected={layer.id === currentLayerId}
                visible={layer.visible}
                canMoveUp={!isFirst}
                canMoveDown={!isLast}
                canDelete={canDelete}
                chrome="flush"
                actionSize="md"
                className="w-full min-w-0 [&:has(input:focus)_[role=toolbar]]:hidden"
                onSelect={() => onSelectLayer(layer.id)}
                onToggleVisible={() => onToggleLayerVisibility(layer.id)}
                onMoveUp={() => onMoveLayerUp(layer.id)}
                onMoveDown={() => onMoveLayerDown(layer.id)}
                onDelete={() => onRemoveLayer(layer.id)}
                onRename={(next) => onRenameLayer(layer.id, next)}
              />
            );
          })}
        </div>
        <ActionButton
          label="Add layer"
          ariaLabel="Add layer"
          chrome="flush"
          onClick={onAddLayer}
          stretch
          className="justify-start px-1.5"
        />
      </StudioRailDropdown>
    </StudioRailSection>
  );
}
