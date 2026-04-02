'use client';

import { useState } from 'react';
import { usePreferencesStore } from '@/store';
import { Button, Tooltip, Slider, Popover, PopoverTrigger, PopoverContent, Toolbar, Switch } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { StartMenu } from './StartMenu';

// ============================================================================
// Volume Popover — vertical slider above icon
// ============================================================================

function VolumeControl() {
  const { volume, setVolume } = usePreferencesStore();
  const isMuted = volume === 0;

  return (
    <Popover position="top">
      <PopoverTrigger asChild>
        <Button
          mode="text"
          size="md"
          iconOnly
          icon={<Icon name={isMuted ? 'volume-mute' : 'volume-high'} large />}
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
// Dark Mode Switch — custom switch with icon on thumb
// ============================================================================

function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = usePreferencesStore();

  return (
    <Tooltip content={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} position="top">
      <span aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
        <Switch
          checked={darkMode}
          onChange={() => toggleDarkMode()}
          size="lg"
        />
      </span>
    </Tooltip>
  );
}

function AmericaModeToggle() {
  const { americaMode, toggleAmericaMode } = usePreferencesStore();

  return (
    <Tooltip content={americaMode ? 'Disable America Mode' : 'America Mode'} position="top">
      <Button
        mode={americaMode ? 'flat' : 'text'}
        size="md"
        onClick={() => toggleAmericaMode()}
        aria-label={americaMode ? 'Disable America Mode' : 'Enable America Mode'}
        className="!px-1.5 !text-base"
      >
        {/* eslint-disable-next-line rdna/no-hardcoded-typography -- reason:emoji-button owner:design-system expires:2026-07-01 issue:DNA-000 */}
        <span className="leading-none" style={{ fontSize: '1.25rem' }}>🇺🇸</span>
      </Button>
    </Tooltip>
  );
}

// ============================================================================
// Taskbar — unified dock with Start button + utility icons
// ============================================================================

export function Taskbar({ className: _className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${_className}`}>
      <Toolbar.Root>
        {/* Start button */}
        <Button
          size="md"
          icon="menu"
          data-start-button
          onClick={() => setIsOpen(!isOpen)}
        >
          Start
        </Button>

        <Toolbar.Separator />

        {/* Social links */}
        <Tooltip content="Twitter" position="top">
          <Button
            quiet
            size="md"
            iconOnly
            icon={<Icon name="twitter" large />}
            onClick={() => window.open('https://twitter.com/radiants', '_blank', 'noopener,noreferrer')}
            aria-label="Twitter"
          />
        </Tooltip>

        <Tooltip content="Discord" position="top">
          <Button
            quiet
            size="md"
            iconOnly
            icon={<Icon name="discord" large />}
            onClick={() => window.open('https://discord.gg/radiants', '_blank', 'noopener,noreferrer')}
            aria-label="Discord"
          />
        </Tooltip>

        <Toolbar.Separator />

        {/* Settings controls */}
        <AmericaModeToggle />
        <VolumeControl />
        <DarkModeToggle />
      </Toolbar.Root>

      <StartMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
