'use client';

import { useState } from 'react';
import { Button, Slider, Switch, Collapsible } from '@rdna/radiants/components/core';

interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  inset: boolean;
}

const DEFAULT_LAYERS: ShadowLayer[] = [
  { x: 2, y: 4, blur: 8, spread: 0, inset: false },
  { x: 0, y: 1, blur: 3, spread: 0, inset: false },
];

function buildShadow(layers: ShadowLayer[]) {
  return layers
    .map(
      (l) =>
        `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px var(--color-line)`
    )
    .join(', ');
}

export function ShadowEditorShell() {
  const [layers, setLayers] = useState<ShadowLayer[]>(DEFAULT_LAYERS);

  const updateLayer = (idx: number, key: keyof ShadowLayer, val: number | boolean) => {
    setLayers((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [key]: val } : l))
    );
  };

  const addLayer = () => {
    setLayers((prev) => [
      ...prev,
      { x: 0, y: 2, blur: 6, spread: 0, inset: false },
    ]);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Section label */}
      <span className="font-heading text-xs uppercase tracking-wide text-mute">
        Shadow
      </span>

      {/* Preview */}
      <div className="h-16 pixel-rounded-sm bg-page border border-rule flex items-center justify-center">
        <div
          className="w-16 h-8 bg-card pixel-rounded-sm"
          style={{ boxShadow: buildShadow(layers) }}
        />
      </div>

      {/* Layers */}
      <div className="flex flex-col gap-1">
        {layers.map((layer, idx) => (
          <Collapsible.Root key={idx} defaultOpen={idx === 0}>
            <Collapsible.Trigger className="px-2 py-1.5 text-xs">
              <span className="flex items-center gap-2 font-mono text-xs text-mute">
                <span
                  className="w-2 h-2 rounded-full bg-accent shrink-0"
                />
                Layer {idx + 1}
              </span>
            </Collapsible.Trigger>
            <Collapsible.Content className="px-2 pb-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {(['x', 'y', 'blur', 'spread'] as const).map((prop) => (
                  <div key={prop} className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-mute uppercase">
                      {prop}
                    </span>
                    <Slider
                      size="sm"
                      value={layer[prop]}
                      onChange={(v) => updateLayer(idx, prop, v)}
                      min={prop === 'x' || prop === 'y' ? -20 : 0}
                      max={prop === 'spread' ? 20 : 40}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  size="sm"
                  checked={layer.inset}
                  onChange={(v) => updateLayer(idx, 'inset', v)}
                  label="Inset"
                />
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        ))}
      </div>

      {/* Add layer */}
      <Button mode="flat" size="sm" onClick={addLayer}>
        Add layer
      </Button>
    </div>
  );
}
