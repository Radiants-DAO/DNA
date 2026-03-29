/* eslint-disable */
'use client';

import { useState } from 'react';

const defaultLayers = [
  { x: 2, y: 4, blur: 8, spread: 0, color: 'rgba(0,0,0,0.15)', inset: false },
  { x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0,0,0,0.08)', inset: false },
];

export function ShadowEditorMock() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [layers, setLayers] = useState(defaultLayers);

  const compositeShadow = layers
    .map((l) => `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`)
    .join(', ');

  const toggleInset = (i: number) => {
    setLayers((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, inset: !l.inset } : l))
    );
  };

  const addLayer = () => {
    setLayers((prev) => [
      ...prev,
      { x: 0, y: 2, blur: 6, spread: 0, color: 'rgba(0,0,0,0.1)', inset: false },
    ]);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Preview */}
      <div className="flex h-20 items-center justify-center rounded border border-gray-200 bg-gray-50">
        <div
          className="h-12 w-24 rounded bg-white"
          style={{ boxShadow: compositeShadow }}
        />
      </div>

      {/* Layer Rows */}
      <div className="flex flex-col gap-1">
        {layers.map((layer, i) => (
          <div key={i} className="rounded border border-gray-200 bg-white">
            {/* Header */}
            <button
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-sans text-xs text-gray-700"
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
            >
              <span
                className="text-[10px] text-gray-400 transition-transform"
                style={{
                  display: 'inline-block',
                  transform: expandedIndex === i ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              >
                ▶
              </span>
              <span>Layer {i + 1}</span>
              <span
                className="ml-auto h-3 w-3 rounded-sm border border-gray-300"
                style={{ backgroundColor: layer.color }}
              />
              <span
                className={`rounded px-1 py-0.5 font-mono text-[9px] cursor-pointer select-none ${
                  layer.inset
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleInset(i);
                }}
              >
                inset
              </span>
            </button>

            {/* Expanded Detail */}
            {expandedIndex === i && (
              <div className="grid grid-cols-2 gap-1.5 border-t border-gray-100 px-2 py-2">
                {(['x', 'y', 'blur', 'spread'] as const).map((field) => (
                  <label key={field} className="flex flex-col gap-0.5">
                    <span className="font-sans text-[9px] text-gray-400 uppercase tracking-wide">
                      {field === 'x' ? 'X' : field === 'y' ? 'Y' : field.charAt(0).toUpperCase() + field.slice(1)}
                    </span>
                    <input
                      type="number"
                      className="h-6 w-full rounded border border-gray-200 bg-gray-50 px-1 font-mono text-xs text-gray-700"
                      value={layer[field]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLayers((prev) =>
                          prev.map((l, idx) =>
                            idx === i ? { ...l, [field]: val } : l
                          )
                        );
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add */}
      <button
        className="self-start font-sans text-xs text-blue-500 hover:text-blue-600"
        onClick={addLayer}
      >
        + Add Shadow
      </button>
    </div>
  );
}
