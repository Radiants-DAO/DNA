'use client';

import React from 'react';
import { corner, px } from '@rdna/pixel';
import {
  AppWindow,
  Button,
  CompactRowButton,
  Slider,
  Switch,
} from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { usePreferencesStore } from '@/store';
import type {
  CornerShape,
  RadOSTheme,
} from '@/store/slices/preferencesSlice';

type DisplayMode = 'normal' | 'dark' | 'auto';

const THEMES: Array<{
  value: RadOSTheme;
  label: string;
  description: string;
}> = [
  { value: 'radiants', label: 'Radiants', description: 'Default RadOS skin' },
  { value: 'skr', label: 'SKR', description: 'Teal portal skin' },
  { value: 'monolith', label: 'MONOLITH', description: 'Lavender monolith skin' },
];

const CORNER_SHAPES: Array<{ value: CornerShape; label: string }> = [
  { value: 'circle', label: 'Round' },
  { value: 'chamfer', label: 'Chamfer' },
  { value: 'scallop', label: 'Scallop' },
];

const THEME_PREVIEWS: Record<RadOSTheme, {
  bg: string;
  panel: string;
  raised: string;
  line: string;
  accent: string;
  text: string;
}> = {
  radiants: {
    bg: '#fef8e2',
    panel: '#fffdf4',
    raised: '#fce184',
    line: '#0f0e0c',
    accent: '#fce184',
    text: '#0f0e0c',
  },
  skr: {
    bg: '#faf9f4',
    panel: '#f6f6f5',
    raised: '#cfe6e4',
    line: '#61afbd',
    accent: '#61afbd',
    text: '#10282c',
  },
  monolith: {
    bg: '#f7f3ff',
    panel: '#fffafe',
    raised: '#eadcff',
    line: '#b494f7',
    accent: '#6939ca',
    text: '#160e24',
  },
} as const;

function handleResetRadOS() {
  if (typeof window === 'undefined') return;
  const confirmed = window.confirm(
    'Reset RadOS? This clears preferences, window positions, and saved documents.',
  );
  if (!confirmed) return;

  try {
    window.localStorage.removeItem('rados-storage');
    window.localStorage.removeItem('rados-scratchpad-docs');
    window.localStorage.removeItem('rados-scratchpad-active');
  } catch {
    // Reload still gives a fresh in-memory session when storage is unavailable.
  }

  window.location.reload();
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-joystix text-sm uppercase text-main">{children}</h2>
  );
}

function ThemePreview({ theme }: { theme: RadOSTheme }) {
  const preview = THEME_PREVIEWS[theme];

  return (
    <div
      className="relative h-28 overflow-hidden border-2"
      style={
        {
          backgroundColor: preview.bg,
          borderColor: preview.line,
        } as React.CSSProperties
      }
    >
      <div
        className="absolute -left-2 -top-2 h-[72%] w-[82%] border-2"
        style={
          {
            backgroundColor: preview.panel,
            borderColor: preview.line,
          } as React.CSSProperties
        }
      >
        <div className="absolute left-3 top-6 flex gap-1">
          <span
            className="h-5 w-12 border-2"
            style={
              {
                backgroundColor: preview.raised,
                borderColor: preview.line,
              } as React.CSSProperties
            }
          />
          <span
            className="h-5 w-8 border-2"
            style={
              {
                backgroundColor: preview.panel,
                borderColor: preview.line,
              } as React.CSSProperties
            }
          />
          <span
            className="h-5 w-12 border-2"
            style={
              {
                backgroundColor: preview.accent,
                borderColor: preview.line,
              } as React.CSSProperties
            }
          />
        </div>
        <div
          className="absolute bottom-3 left-3 h-8 w-28 border-2"
          style={
            {
              backgroundColor: preview.panel,
              borderColor: preview.line,
            } as React.CSSProperties
          }
        />
        <div
          className="absolute bottom-3 right-4 h-8 w-20 border-2"
          style={
            {
              backgroundColor: preview.panel,
              borderColor: preview.line,
            } as React.CSSProperties
          }
        />
        <div className="absolute bottom-4 right-[-1.75rem] grid grid-cols-4 gap-px">
          {Array.from({ length: 20 }).map((_, index) => (
            <span
              key={index}
              className="size-1"
              style={{ backgroundColor: index % 3 === 0 ? preview.text : 'transparent' }}
            />
          ))}
        </div>
      </div>
      <div
        className="absolute bottom-0 right-0 h-full w-14"
        style={{
          backgroundColor: preview.raised,
          backgroundImage:
            'linear-gradient(45deg, transparent 25%, var(--color-line) 25%, var(--color-line) 50%, transparent 50%, transparent 75%, var(--color-line) 75%)',
          backgroundSize: '14px 14px',
        }}
      />
    </div>
  );
}

function CornerPreview({ shape, active }: { shape: CornerShape; active: boolean }) {
  const preview = px({
    corners: {
      tl: corner.fixed(shape, 14),
      tr: corner.flat,
      br: corner.flat,
      bl: corner.flat,
    },
  });

  return (
    <div
      className={[
        preview.className,
        'relative h-14 w-14 bg-page',
        active ? 'outline outline-2 outline-accent outline-offset-2' : '',
      ].join(' ')}
      style={preview.style as React.CSSProperties}
    >
      <span className="absolute left-3 top-3 h-2 w-8 bg-main" />
      <span className="absolute bottom-3 right-3 h-4 w-6 bg-accent" />
    </div>
  );
}

function CornerShapeStrip({
  value,
  onChange,
}: {
  value: CornerShape;
  onChange: (value: CornerShape) => void;
}) {
  return (
    <div>
      <SectionHeading>Corner Shape</SectionHeading>
      <div className="mt-4 flex flex-col gap-3">
        {CORNER_SHAPES.map((shape) => (
          <CompactRowButton
            key={shape.value}
            selected={value === shape.value}
            leading={<CornerPreview shape={shape.value} active={value === shape.value} />}
            onClick={() => onChange(shape.value)}
          >
            {shape.label}
          </CompactRowButton>
        ))}
      </div>
    </div>
  );
}

function DisplayModeControl({
  value,
  onChange,
  reduceMotion,
  onReduceMotionChange,
}: {
  value: DisplayMode;
  onChange: (value: DisplayMode) => void;
  reduceMotion: boolean;
  onReduceMotionChange: (value: boolean) => void;
}) {
  return (
    <div>
      <SectionHeading>Display</SectionHeading>
      <div className="mt-4 w-18">
        <div className="flex gap-2">
          <Button
            type="button"
            iconOnly
            size="lg"
            rounded="sm"
            mode="flat"
            active={value === 'normal'}
            icon={<Icon name="sun-rays" size={21} />}
            aria-label="Light display mode"
            aria-pressed={value === 'normal'}
            onClick={() => onChange('normal')}
          />
          <Button
            type="button"
            iconOnly
            size="lg"
            rounded="sm"
            mode="flat"
            active={value === 'dark'}
            icon={<Icon name="moon" size={21} />}
            aria-label="Dark display mode"
            aria-pressed={value === 'dark'}
            onClick={() => onChange('dark')}
          />
        </div>
        <Button
          type="button"
          size="sm"
          rounded="sm"
          mode="flat"
          fullWidth
          active={value === 'auto'}
          aria-pressed={value === 'auto'}
          onClick={() => onChange('auto')}
          className="mt-2 justify-center"
        >
          Auto
        </Button>
      </div>
      <div className="mt-5 flex w-18 flex-col gap-2">
        <span className="font-mondwest text-sm text-main">Reduce Motion</span>
        <Switch
          checked={reduceMotion}
          onChange={onReduceMotionChange}
          size="lg"
          aria-label="Reduce motion"
        />
      </div>
    </div>
  );
}

function VolumeControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading>Speaker</SectionHeading>
        <span className="font-joystix text-sm tabular-nums text-main">{value}%</span>
      </div>
      <div className="mt-4 flex h-36 items-center">
        <Slider
          value={value}
          onChange={onChange}
          min={0}
          max={100}
          step={1}
          size="lg"
          orientation="vertical"
          className="h-32"
          aria-label="Master volume"
        />
      </div>
    </div>
  );
}

function ThemeSelector({
  value,
  onChange,
}: {
  value: RadOSTheme;
  onChange: (value: RadOSTheme) => void;
}) {
  return (
    <div>
      <SectionHeading>Theme</SectionHeading>
      <div className="mt-4 grid grid-cols-1 gap-4 @md:grid-cols-3">
        {THEMES.map((themeOption) => {
          const active = value === themeOption.value;
          return (
            <Button
              key={themeOption.value}
              type="button"
              mode="flat"
              rounded="sm"
              textOnly
              fullWidth
              className={[
                'block overflow-hidden border-2 p-3 text-left transition-colors',
                active ? 'border-main bg-main text-page' : 'border-line bg-page text-main',
              ].join(' ')}
              active={active}
              aria-pressed={active}
              onClick={() => onChange(themeOption.value)}
            >
              <ThemePreview theme={themeOption.value} />
              <span className="mt-4 block text-center font-mondwest text-lg leading-tight">
                {themeOption.label}
              </span>
              <span className={['mt-1 block text-center font-mondwest text-xs', active ? 'text-page' : 'text-mute'].join(' ')}>
                {themeOption.description}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function PreferencesPane() {
  const {
    volume,
    setVolume,
    reduceMotion,
    setReduceMotion,
    darkMode,
    darkModeAuto,
    setDarkMode,
    setDarkModeAuto,
    theme,
    setTheme,
    cornerShape,
    setCornerShape,
  } = usePreferencesStore();

  const displayMode: DisplayMode = darkModeAuto
    ? 'auto'
    : darkMode
      ? 'dark'
      : 'normal';

  const setDisplayMode = (mode: DisplayMode) => {
    if (mode === 'auto') {
      setDarkModeAuto(true);
      return;
    }
    setDarkModeAuto(false);
    setDarkMode(mode === 'dark');
  };

  return (
    <AppWindow.Island corners="pixel" padding="none" className="min-h-0">
      <div className="grid grid-cols-1 gap-5 p-4 @md:grid-cols-[13rem_5rem_minmax(12rem,1fr)]">
        <CornerShapeStrip value={cornerShape} onChange={setCornerShape} />
        <DisplayModeControl
          value={displayMode}
          onChange={setDisplayMode}
          reduceMotion={reduceMotion}
          onReduceMotionChange={setReduceMotion}
        />
        <VolumeControl value={volume} onChange={setVolume} />

        <div className="@md:col-span-3">
          <div className="space-y-3 border-t border-line pt-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mondwest text-base text-main">Delete Data</span>
              <Button
                type="button"
                mode="flat"
                tone="danger"
                size="sm"
                onClick={handleResetRadOS}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-4 @md:col-span-3">
          <ThemeSelector value={theme} onChange={setTheme} />
        </div>
      </div>
    </AppWindow.Island>
  );
}

function PreferencesFooter() {
  return (
    <div
      className="group/konami shrink-0 border-t border-line bg-card px-4 py-2"
      tabIndex={0}
      aria-label="Preferences footer"
    >
      <p className="text-center font-mondwest text-xs uppercase text-mute opacity-0 transition-opacity duration-150 group-hover/konami:opacity-100 group-focus/konami:opacity-100">
        UP UP DOWN DOWN LEFT RIGHT LEFT RIGHT B A
      </p>
    </div>
  );
}

export function PreferencesApp() {
  return (
    <>
      <AppWindow.Content className="bg-brand-stage">
        <div className="flex min-h-0 flex-1 p-1">
          <PreferencesPane />
        </div>
      </AppWindow.Content>

      <PreferencesFooter />
    </>
  );
}

export default PreferencesApp;
