'use client';

import type { PixelGrid } from '@rdna/pixel';
import { BitmapIcon, getBitmapIcon } from '@rdna/pixel/icons';
import { PixelThumb } from '../PixelThumb';

interface IconPreviewProps {
  grid: PixelGrid | null;
  selectedEntry?: PixelGrid | null;
}

const RUNTIME_SIZES: ReadonlyArray<16 | 24> = [16, 24];

export function IconPreview({ grid, selectedEntry = null }: IconPreviewProps) {
  const isSourceMatch = Boolean(
    grid &&
      selectedEntry &&
      grid.name === selectedEntry.name &&
      grid.width === selectedEntry.width &&
      grid.height === selectedEntry.height &&
      grid.bits === selectedEntry.bits,
  );

  const runtimeName = isSourceMatch ? selectedEntry!.name : null;

  return (
    <>
      <span className="font-heading text-xs text-mute uppercase tracking-wide shrink-0">
        Icon preview
      </span>
      {grid ? (
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          <section className="pixel-rounded-6 border border-rule bg-depth p-3">
            <div className="flex items-start gap-3">
              <div className="pixel-rounded-6 flex h-24 w-24 shrink-0 items-center justify-center bg-page">
                <PixelThumb grid={grid} size={80} />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-heading text-[11px] uppercase tracking-wide text-mute">
                  Canvas source
                </p>
                <p className="font-mono text-sm text-main truncate">{grid.name}</p>
                <p className="font-mono text-xs text-mute">
                  {grid.width}x{grid.height} authored grid
                </p>
                <p className="text-xs text-mute">
                  This surface previews the editable bitmap currently on the canvas.
                </p>
              </div>
            </div>
          </section>

          <section className="min-h-0 flex-1 flex flex-col">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-heading text-[11px] uppercase tracking-wide text-mute">
                Converted runtime
              </p>
              {runtimeName ? (
                <p className="font-mono text-[11px] text-mute truncate">{runtimeName}</p>
              ) : null}
            </div>

            {runtimeName ? (
              <div className="grid grid-cols-2 gap-3">
                {RUNTIME_SIZES.map((size) => {
                  const runtimeEntry = getBitmapIcon(runtimeName, size);
                  return (
                    <div
                      key={size}
                      className="pixel-rounded-6 border border-rule bg-depth p-3"
                    >
                      <p className="mb-3 font-heading text-[11px] uppercase tracking-wide text-mute">
                        {size}px
                      </p>
                      <div className="pixel-rounded-6 flex h-20 items-center justify-center bg-page">
                        {runtimeEntry ? (
                          <BitmapIcon
                            name={runtimeName}
                            size={size}
                            aria-label={`${runtimeName} ${size}px runtime`}
                            className="text-main"
                          />
                        ) : (
                          <span className="text-xs text-mute text-center">
                            No baked {size}px runtime entry
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pixel-rounded-6 border border-rule bg-depth p-3 flex-1 flex items-center justify-center">
                <p className="text-sm text-mute text-center max-w-xs">
                  Re-select a converted icon from the registry to compare the current canvas
                  against its shipped 16px and 24px runtime masks.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <p className="text-sm text-mute text-center">
            Select or draw an icon to preview its canvas source and converted runtime output
          </p>
        </div>
      )}
    </>
  );
}
