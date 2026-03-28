'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Pattern
} from '@rdna/radiants/components/core';
import { Icon, RadMarkIcon, WordmarkLogo } from '@rdna/radiants/icons/runtime';
import { PATTERN_GROUPS, patternRegistry } from '@rdna/radiants/patterns';
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

const featuredPatterns = patternRegistry.filter((_, index) => index % 7 === 0).slice(0, 6);
const patternGroups = PATTERN_GROUPS.map((group) => ({
  ...group,
  count: patternRegistry.filter((entry) => entry.group === group.key).length,
  sample: patternRegistry.find((entry) => entry.group === group.key)?.name ?? 'checkerboard'
}));

export function MyApp({ windowId }: AppProps) {
  const [preset, setPreset] = useState<WindowSizePreset>(presets[1]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-8">
        <div
          className="max-w-full transition-[width,height] duration-200 ease-out"
          style={{ width: preset.width, height: preset.height }}
        >
          <AppWindow
            title="__APP_PASCAL_NAME__"
            titleBarActions={
              <div className="flex items-center gap-2">
                <Badge size="sm">rdna live</Badge>
                <Icon name="sparkles" size={16} className="text-accent" />
              </div>
            }
          >
            <WindowContent mode="full-bleed">
              <div className="space-y-5 p-6">
                <Card variant="raised" className="overflow-hidden">
                  <CardHeader className="flex flex-wrap items-center justify-between gap-4 bg-depth/70">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center pixel-rounded-md border border-line bg-page">
                        <RadMarkIcon size={18} className="text-accent" />
                      </div>
                      <div className="space-y-1">
                        <Badge size="sm" variant="warning">
                          prototype shell
                        </Badge>
                        <div className="flex items-center gap-3">
                          <WordmarkLogo className="h-4 w-auto" color="cream" />
                          <span className="text-xs uppercase tracking-[0.22em] text-mute">
                            Fast-start window
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" mode="solid" tone="accent" icon="sparkles">
                        Sketch flow
                      </Button>
                      <Button size="sm" mode="flat" tone="neutral" icon="download">
                        Export frame
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">
                            RDNA starter
                          </p>
                          <h1 className="text-3xl font-heading text-head">
                            __APP_PASCAL_NAME__
                          </h1>
                          <p className="max-w-2xl text-sm leading-7 text-sub">
                            This scaffold pulls in the live RDNA package and wires up
                            components, runtime icons, and the pattern registry so
                            your prototype starts on the real system surface instead
                            of a local copy.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge size="sm" variant="warning">
                            {patternRegistry.length} patterns
                          </Badge>
                          <Badge size="sm" variant="info">
                            {PATTERN_GROUPS.length} groups
                          </Badge>
                          <Badge size="sm" variant="success">
                            one-window shell
                          </Badge>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        {presets.map((item) => (
                          <div
                            key={item.label}
                            className="pixel-rounded-md border border-line bg-depth/70 p-4"
                          >
                            <p className="text-sm font-medium text-head">{item.label}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-mute">
                              {item.width} x {item.height}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-mute">
                          <Icon name="record-player" size={16} className="text-accent" />
                          Pattern sampler
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {featuredPatterns.map((pattern) => (
                            <div
                              key={pattern.name}
                              className="pixel-rounded-md border border-line bg-depth/60 p-3"
                            >
                              <Pattern
                                pat={pattern.name}
                                color="var(--color-accent)"
                                bg="var(--color-depth)"
                                className="mb-3 h-20 w-full pixel-rounded-sm border border-line"
                              />
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-head">
                                    {pattern.name}
                                  </p>
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-mute">
                                    {pattern.group}
                                  </p>
                                </div>
                                <Badge size="sm">{pattern.fill}%</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-mute">
                          <Icon name="volume-faders" size={16} className="text-accent" />
                          Pattern groups
                        </div>
                        <div className="space-y-3">
                          {patternGroups.map((group) => (
                            <div
                              key={group.key}
                              className="pixel-rounded-md border border-line bg-page/30 p-3"
                            >
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-head">
                                    {group.label}
                                  </p>
                                  <p className="text-xs leading-5 text-sub">
                                    {group.desc}
                                  </p>
                                </div>
                                <Badge size="sm">{group.count}</Badge>
                              </div>
                              <Pattern
                                pat={group.sample}
                                color="var(--color-main)"
                                bg="var(--color-depth)"
                                className="h-10 w-full pixel-rounded-sm border border-line"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                  <CardFooter className="flex flex-wrap items-center gap-2 bg-depth/50">
                    <Icon name="sparkles" size={16} className="text-accent" />
                    <span className="text-xs uppercase tracking-[0.18em] text-mute">
                      Control surface seam stays in lib/controlSurface.ts for future package extraction.
                    </span>
                  </CardFooter>
                </Card>
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
