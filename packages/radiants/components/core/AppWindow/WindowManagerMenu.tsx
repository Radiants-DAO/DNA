'use client';

import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Button } from '../Button/Button';
import { Icon } from '../../../icons/Icon';

export type SnapRegion =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface WindowManagerMenuProps {
  title: string;
  isFullscreen: boolean;
  canRestore: boolean;
  onFullscreen?: () => void;
  onCenter?: () => void;
  onSnap?: (region: SnapRegion) => void;
  onRestore?: () => void;
}

const itemClass = `
  w-full px-4 py-1.5
  flex items-center gap-3
  text-left font-sans text-sm
  text-main
  hover:bg-inv hover:text-flip
  data-[disabled]:opacity-50 data-[disabled]:pointer-events-none
  focus-visible:outline-none
  cursor-pointer
`.trim();

const labelClass = `
  px-4 pt-2 pb-1
  font-heading text-xs uppercase tracking-tight text-mute
`.trim();

const gridItemClass = `
  w-8 h-8 flex items-center justify-center
  text-main hover:bg-inv hover:text-flip
  focus-visible:outline-none cursor-pointer
  data-[disabled]:opacity-50 data-[disabled]:pointer-events-none
`.trim();

function RegionGlyph({ region }: { region: SnapRegion }) {
  const cells: Record<SnapRegion, Array<[number, number, number, number]>> = {
    left: [[0, 0, 4, 8]],
    right: [[4, 0, 4, 8]],
    top: [[0, 0, 8, 4]],
    bottom: [[0, 4, 8, 4]],
    'top-left': [[0, 0, 4, 4]],
    'top-right': [[4, 0, 4, 4]],
    'bottom-left': [[0, 4, 4, 4]],
    'bottom-right': [[4, 4, 4, 4]],
  };
  return (
    <svg width="14" height="14" viewBox="0 0 8 8" aria-hidden>
      <rect x="0" y="0" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="0.5" />
      {cells[region].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="currentColor" />
      ))}
    </svg>
  );
}

export function WindowManagerMenu({
  title,
  isFullscreen,
  canRestore,
  onFullscreen,
  onCenter,
  onSnap,
  onRestore,
}: WindowManagerMenuProps) {
  return (
    <BaseMenu.Root modal={false}>
      <BaseMenu.Trigger
        openOnHover
        delay={120}
        closeDelay={150}
        render={(props) => (
          <Button
            {...props}
            tone="accent"
            size="sm"
            rounded="sm"
            iconOnly
            icon={isFullscreen ? 'collapse' : 'expand'}
            aria-label={`Window options for ${title}`}
          />
        )}
      />
      <BaseMenu.Portal>
        <BaseMenu.Positioner side="bottom" align="start" sideOffset={4}>
          <BaseMenu.Popup
            className={`
              z-50 min-w-[13rem]
              transition-[opacity,transform,filter] duration-[var(--duration-base)] ease-out
              data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
              data-[ending-style]:opacity-0 data-[ending-style]:blur-sm
            `.trim()}
          >
            <div className="pixel-rounded-6 bg-page pixel-shadow-raised">
              <div className="py-1">
                {onCenter ? (
                  <BaseMenu.Item className={itemClass} onClick={onCenter}>
                    <Icon name="align-center" size={16} className="shrink-0" />
                    <span>Center</span>
                  </BaseMenu.Item>
                ) : null}
                {onFullscreen ? (
                  <BaseMenu.Item className={itemClass} onClick={onFullscreen}>
                    <Icon name={isFullscreen ? 'collapse' : 'expand'} size={16} className="shrink-0" />
                    <span>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                  </BaseMenu.Item>
                ) : null}

                {onSnap ? (
                  <>
                    <div className={labelClass}>Move &amp; Resize</div>
                    <div className="px-3 pb-2 grid grid-cols-4 gap-1">
                      <SnapGridButton region="left" label="Left" onSnap={onSnap} />
                      <SnapGridButton region="right" label="Right" onSnap={onSnap} />
                      <SnapGridButton region="top" label="Top" onSnap={onSnap} />
                      <SnapGridButton region="bottom" label="Bottom" onSnap={onSnap} />
                      <SnapGridButton region="top-left" label="Top Left" onSnap={onSnap} />
                      <SnapGridButton region="top-right" label="Top Right" onSnap={onSnap} />
                      <SnapGridButton region="bottom-left" label="Bottom Left" onSnap={onSnap} />
                      <SnapGridButton region="bottom-right" label="Bottom Right" onSnap={onSnap} />
                    </div>
                  </>
                ) : null}

                {onRestore ? (
                  <>
                    <BaseMenu.Separator className="border-t border-rule my-1" />
                    <BaseMenu.Item
                      className={itemClass}
                      disabled={!canRestore}
                      onClick={() => {
                        if (canRestore) onRestore();
                      }}
                    >
                      Return to Previous Size
                    </BaseMenu.Item>
                  </>
                ) : null}
              </div>
            </div>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

function SnapGridButton({
  region,
  label,
  onSnap,
}: {
  region: SnapRegion;
  label: string;
  onSnap: (region: SnapRegion) => void;
}) {
  return (
    <BaseMenu.Item
      className={gridItemClass}
      aria-label={label}
      onClick={() => onSnap(region)}
    >
      <RegionGlyph region={region} />
    </BaseMenu.Item>
  );
}
