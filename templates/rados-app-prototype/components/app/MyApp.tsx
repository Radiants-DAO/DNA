'use client';

import { useState } from 'react';
import { AppWindow } from '../AppWindow';
import { Taskbar } from '../Taskbar';
import { WindowContent } from '../WindowContent';
import { defaultControlSurface } from '../../lib/controlSurface';
import type { AppProps, WindowSizePreset } from '../../lib/types';

const presets: WindowSizePreset[] = [
  { label: 'Compact', width: 760, height: 520 },
  { label: 'Desktop', width: 920, height: 640 },
  { label: 'Wide', width: 1120, height: 700 }
];

export function MyApp({ windowId }: AppProps) {
  const [preset, setPreset] = useState<WindowSizePreset>(presets[1]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-8">
        <div
          className="max-w-full transition-[width,height] duration-200 ease-out"
          style={{ width: preset.width, height: preset.height }}
        >
          <AppWindow title="__APP_PASCAL_NAME__">
            <WindowContent mode="single-column">
              <div className="space-y-4 rounded-[22px] border border-line bg-panel/70 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">
                  Prototype shell
                </p>
                <h1 className="text-3xl font-semibold text-main">
                  __APP_PASCAL_NAME__
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted">
                  This scaffold gives you a standalone RadOS-style app shell with
                  one window, one taskbar, and a clean seam for a future control
                  surface package.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {presets.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-line bg-background/60 p-4"
                    >
                      <p className="text-sm font-medium text-main">{item.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                        {item.width} x {item.height}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </WindowContent>
          </AppWindow>
        </div>
      </main>
      <Taskbar
        windowId={windowId}
        presets={presets}
        activePreset={preset.label}
        controlSurfaceEnabled={defaultControlSurface.enabled}
        onSelectPreset={setPreset}
      />
    </div>
  );
}
