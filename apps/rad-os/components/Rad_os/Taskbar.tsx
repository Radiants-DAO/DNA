'use client';

import React, { useCallback, useState } from 'react';
import { usePreferencesStore, useRadRadioStore } from '@/store';
import { useWindowManager } from '@/hooks/useWindowManager';
import { getDesktopLaunchers } from '@/lib/apps';
import { getTracksByChannel } from '@/lib/mockData/tracks';
import { Button, Tooltip, Slider, Popover, PopoverTrigger, PopoverContent, Toolbar, Switch } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { StartMenu } from './StartMenu';

const taskbarToolbarClassName = 'p-0.5 dark:bg-[color-mix(in_oklch,var(--color-ink),var(--color-accent)_15%)]';
const taskbarQuietButtonClassName = 'dark:!text-accent dark:hover:!text-ink dark:active:!text-ink dark:data-[state=selected]:!text-ink';

// ============================================================================
// Volume Popover — vertical slider above icon
// ============================================================================

function VolumeControl() {
  const { volume, setVolume } = usePreferencesStore();
  const { darkMode } = usePreferencesStore();
  const isMuted = volume === 0;

  return (
    <Popover position="bottom">
      <PopoverTrigger asChild>
        <Button
          mode="flat"
          size="md"
          iconOnly
          quiet
          tone={darkMode ? 'accent' : undefined}
          className={taskbarQuietButtonClassName}
          icon={<Icon name={isMuted ? 'volume-mute' : 'volume-high'} />}
          aria-label={`Volume: ${volume}%`}
        />
      </PopoverTrigger>
      <PopoverContent className="!p-1.5 flex flex-col items-center gap-1">
        <div className="h-24">
          <Slider
            value={volume}
            onChange={setVolume}
            min={0}
            max={100}
            step={1}
            size="md"
            orientation="vertical"
          />
        </div>
        <span className="font-mono text-xs text-mute tabular-nums leading-none">{volume}</span>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Radio Transport Strip — Prev / Play-Pause / Next + widget-open toggle.
// Always visible in the taskbar, so playback can be controlled without
// opening the drop-down Radio widget.
// ============================================================================

function RadioTransportStrip() {
  const { darkMode } = usePreferencesStore();
  const {
    isPlaying,
    currentChannel,
    togglePlay,
    prevTrack,
    nextTrack,
    widgetOpen,
    toggleWidget,
  } = useRadRadioStore();

  const trackCount = getTracksByChannel(currentChannel).length;
  const handlePrev = useCallback(() => prevTrack(trackCount), [prevTrack, trackCount]);
  const handleNext = useCallback(() => nextTrack(trackCount), [nextTrack, trackCount]);

  return (
    <>
      {/* When the widget is open, the Radio UI shows its own TransportPill —
          hide the taskbar transports to avoid duplication. The toggle button
          always stays visible so the user can collapse the widget. */}
      {!widgetOpen && (
        <>
          <Tooltip content="Previous track" position="bottom">
            <Button
              mode="flat"
              size="md"
              iconOnly
              quiet
              tone={darkMode ? 'accent' : undefined}
              className={taskbarQuietButtonClassName}
              icon={<Icon name="skip-back" />}
              onClick={handlePrev}
              aria-label="Previous track"
            />
          </Tooltip>
          <Tooltip content={isPlaying ? 'Pause' : 'Play'} position="bottom">
            <Button
              mode="flat"
              size="md"
              iconOnly
              quiet
              tone={darkMode ? 'accent' : undefined}
              className={taskbarQuietButtonClassName}
              icon={<Icon name={isPlaying ? 'pause' : 'play'} />}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            />
          </Tooltip>
          <Tooltip content="Next track" position="bottom">
            <Button
              mode="flat"
              size="md"
              iconOnly
              quiet
              tone={darkMode ? 'accent' : undefined}
              className={taskbarQuietButtonClassName}
              icon={<Icon name="skip-forward" />}
              onClick={handleNext}
              aria-label="Next track"
            />
          </Tooltip>
        </>
      )}
      <Tooltip content={widgetOpen ? 'Hide Radio' : 'Show Radio'} position="bottom">
        <Button
          mode="flat"
          size="md"
          iconOnly
          quiet
          tone={darkMode ? 'accent' : undefined}
          className={taskbarQuietButtonClassName}
          icon={<Icon name="broadcast-dish" />}
          active={widgetOpen}
          onClick={toggleWidget}
          aria-label={widgetOpen ? 'Hide Radio' : 'Show Radio'}
        />
      </Tooltip>
    </>
  );
}

// ============================================================================
// Dark Mode Switch — custom switch with icon on thumb
// ============================================================================

function DarkModeToggle() {
  const { darkMode, darkModeAuto, setDarkMode, setDarkModeAuto } = usePreferencesStore();

  const handleToggle = (next: boolean) => {
    if (darkModeAuto) setDarkModeAuto(false);
    setDarkMode(next);
  };

  return (
    <Tooltip content={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} position="bottom">
      <span className="inline-flex items-center" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
        <Switch
          checked={darkMode}
          onChange={handleToggle}
          size="lg"
        />
      </span>
    </Tooltip>
  );
}

// ============================================================================
// Taskbar — unified dock with Start button + utility icons
// ============================================================================

export function Taskbar({
  className: _className = '',
}: {
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { openWindowWithZoom, isWindowOpen } = useWindowManager();
  const { darkMode } = usePreferencesStore();
  const desktopApps = getDesktopLaunchers();

  return (
    <div
      className={`relative grid grid-cols-3 items-center gap-2 ${_className}`}
    >
      {/* Left dock — Start + social */}
      <div className="flex items-center justify-start">
      <Toolbar.Root className={taskbarToolbarClassName}>
        <Button
          mode="flat"
          size="md"
          quiet
          tone={darkMode ? 'accent' : undefined}
          className={taskbarQuietButtonClassName}
          icon="menu"
          data-start-button
          onClick={() => setIsOpen(!isOpen)}
        >
          Start
        </Button>

        <Toolbar.Separator />

        <Tooltip content="Twitter" position="bottom">
          <Button
            mode="flat"
            size="md"
            iconOnly
            quiet
            tone={darkMode ? 'accent' : undefined}
            className={taskbarQuietButtonClassName}
            icon={<Icon name="twitter" />}
            onClick={() => window.open('https://twitter.com/radiants', '_blank', 'noopener,noreferrer')}
            aria-label="Twitter"
          />
        </Tooltip>

        <Tooltip content="Discord" position="bottom">
          <Button
            mode="flat"
            size="md"
            iconOnly
            quiet
            tone={darkMode ? 'accent' : undefined}
            className={taskbarQuietButtonClassName}
            icon={<Icon name="discord" />}
            onClick={() => window.open('https://discord.gg/radiants', '_blank', 'noopener,noreferrer')}
            aria-label="Discord"
          />
        </Tooltip>
      </Toolbar.Root>
      </div>

      {/* Center — standalone app launcher buttons (always centered in the
          middle column regardless of left/right dock width). */}
      <div className="flex items-center justify-center gap-1 min-w-0">
        {desktopApps.map((app) => {
          const isActive = isWindowOpen(app.id);
          return (
            <Tooltip key={app.id} content={app.label} position="bottom">
              <Button
                mode="flat"
                size="lg"
                iconOnly
                icon={app.icon}
                tone={darkMode ? 'accent' : 'cream'}
                active={isActive}
                aria-label={app.label}
                onClick={(e: React.MouseEvent) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  openWindowWithZoom(app.id, {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                  });
                }}
              />
            </Tooltip>
          );
        })}
      </div>

      {/* Right dock — settings (pinned to the right edge of its column so
          transport-strip width changes don't reflow the center app icons). */}
      <div className="flex items-center justify-end">
      <Toolbar.Root className={taskbarToolbarClassName}>
        <RadioTransportStrip />
        <Toolbar.Separator />
        <VolumeControl />
        <DarkModeToggle />

        <Tooltip content="Preferences" position="bottom">
          <Button
            mode="flat"
            size="md"
            iconOnly
            quiet
            tone={darkMode ? 'accent' : undefined}
            className={taskbarQuietButtonClassName}
            icon={<Icon name="settings-cog" />}
            data-settings-button
            active={isWindowOpen('preferences')}
            onClick={(e: React.MouseEvent) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              openWindowWithZoom('preferences', {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              });
            }}
            aria-label="Preferences"
          />
        </Tooltip>
      </Toolbar.Root>
      </div>

      <StartMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
