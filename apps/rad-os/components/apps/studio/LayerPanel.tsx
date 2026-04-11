'use client';

import { type MutableRefObject, useCallback, useRef } from 'react';
import { type DottingRef, useLayers } from '@/lib/dotting';
import { Button, Separator, Tooltip, ScrollArea } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';

interface LayerPanelProps {
  dottingRef: MutableRefObject<DottingRef | null>;
}

export function LayerPanel({ dottingRef }: LayerPanelProps) {
  const {
    layers,
    currentLayer,
    addLayer,
    removeLayer,
    showLayer,
    hideLayer,
    setCurrentLayer,
    changeLayerPosition,
  } = useLayers(dottingRef);

  const counterRef = useRef(layers?.length ?? 1);

  const handleAddLayer = useCallback(() => {
    counterRef.current += 1;
    const id = `layer-${counterRef.current}`;
    const position = layers ? layers.length : 0;
    addLayer(id, position);
  }, [addLayer, layers]);

  const handleMoveUp = useCallback(
    (layerId: string) => {
      if (!layers) return;
      const idx = layers.findIndex((l) => l.id === layerId);
      if (idx < layers.length - 1) changeLayerPosition(layerId, idx + 1);
    },
    [layers, changeLayerPosition],
  );

  const handleMoveDown = useCallback(
    (layerId: string) => {
      if (!layers) return;
      const idx = layers.findIndex((l) => l.id === layerId);
      if (idx > 0) changeLayerPosition(layerId, idx - 1);
    },
    [layers, changeLayerPosition],
  );

  const displayLayers = layers ? [...layers].reverse() : [];
  const canDelete = (layers?.length ?? 0) > 1;

  return (
    <div className="flex flex-col w-44 shrink-0 border-l border-rule bg-page">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <span className="font-joystix text-xs text-sub uppercase tracking-wide select-none">
          Layers
        </span>
        <Tooltip content="Add layer" position="left">
          <Button
            mode="text"
            size="sm"
            iconOnly
            icon="plus"
            aria-label="Add layer"
            onClick={handleAddLayer}
          />
        </Tooltip>
      </div>

      <Separator />

      {/* Layer list */}
      <ScrollArea.Root className="flex-1 min-h-0">
        <div className="flex flex-col gap-px p-1">
          {displayLayers.map((layer, visualIdx) => {
            const isCurrent = currentLayer?.id === layer.id;
            const isVisible = layer.isVisible !== false;
            const isFirst = visualIdx === 0;
            const isLast = visualIdx === displayLayers.length - 1;

            return (
              <div
                key={layer.id}
                role="button"
                tabIndex={0}
                onClick={() => setCurrentLayer(layer.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setCurrentLayer(layer.id);
                }}
                className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors ${
                  isCurrent ? 'bg-active' : 'hover:bg-hover'
                }`}
              >
                {/* Layer name */}
                <span className="font-mondwest text-xs text-main flex-1 truncate select-none">
                  {layer.id.replace('layer-', 'Layer ').replace(/^default$/, 'Layer 1')}
                </span>

                {/* Reorder */}
                <Tooltip content="Move up" position="left">
                  <Button
                    mode="text"
                    size="sm"
                    iconOnly
                    icon={<span className="rotate-180 inline-flex"><Icon name="chevron-down" /></span>}
                    aria-label="Move up"
                    disabled={isFirst}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleMoveUp(layer.id);
                    }}
                  />
                </Tooltip>
                <Tooltip content="Move down" position="left">
                  <Button
                    mode="text"
                    size="sm"
                    iconOnly
                    icon="chevron-down"
                    aria-label="Move down"
                    disabled={isLast}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleMoveDown(layer.id);
                    }}
                  />
                </Tooltip>

                {/* Visibility */}
                <Tooltip content={isVisible ? 'Hide' : 'Show'} position="left">
                  <Button
                    mode="text"
                    size="sm"
                    iconOnly
                    icon={isVisible ? 'eye' : 'eye-hidden'}
                    aria-label={isVisible ? 'Hide layer' : 'Show layer'}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (isVisible) hideLayer(layer.id);
                      else showLayer(layer.id);
                    }}
                  />
                </Tooltip>

                {/* Delete */}
                <Tooltip content="Delete layer" position="left">
                  <Button
                    mode="text"
                    size="sm"
                    iconOnly
                    icon="trash"
                    aria-label="Delete layer"
                    disabled={!canDelete}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                  />
                </Tooltip>
              </div>
            );
          })}
        </div>
      </ScrollArea.Root>
    </div>
  );
}
