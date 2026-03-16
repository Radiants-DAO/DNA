'use client';

import React, { useState } from 'react';
import { usePreferencesStore } from '@/store';
import { Button, Tooltip, Slider, Popover, PopoverTrigger, PopoverContent } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons';
import { StartMenu } from './StartMenu';

// ============================================================================
// Start Button Component (exported for use in Desktop dock)
// ============================================================================

export function StartButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="primary"
        size="md"
        icon={<Icon name="menu" size={16} />}
        onClick={() => setIsOpen(!isOpen)}
      >
        Start
      </Button>

      <StartMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

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
          variant="text"
          size="md"
          iconOnly
          icon={<Icon name={isMuted ? 'volume-mute' : 'volume-high'} size={20} />}
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
      <button
        type="button"
        role="switch"
        aria-checked={darkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleDarkMode}
        className="
          group relative inline-flex items-center
          w-14 h-7 rounded-xs border cursor-pointer
          transition-[background-color,border-color] duration-150
          bg-page border-line
          hover:border-focus
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
        "
      >
        {/* Thumb with icon */}
        <span
          className={[
            'absolute top-0 -mt-px -ml-px flex items-center justify-center',
            'h-7 w-7 rounded-xs border border-line bg-page',
            'transition-[translate,border-color,background-color] duration-150',
            'shadow-none',
            'group-hover:-top-1 group-hover:shadow-lifted',
            'group-active:-top-0.5 group-active:shadow-resting',
            darkMode ? 'translate-x-7' : 'translate-x-0',
          ].join(' ')}
        >
          <Icon
            name={darkMode ? 'moon' : 'radiants-logo'}
            size={16}
            className="text-main"
          />
        </span>
      </button>
    </Tooltip>
  );
}

// ============================================================================
// Utility Bar Component (exported for bottom bar)
// ============================================================================

export function UtilityBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        flex items-center gap-0.5
        bg-page/80 backdrop-blur-sm
        border border-line rounded-sm
        px-0.5 py-0.5
        ${className}
      `}
    >
      {/* Social links */}
      <Tooltip content="Twitter" position="top">
        <Button
          variant="text"
          size="md"
          iconOnly
          icon={<Icon name="twitter" size={20} />}
          onClick={() => window.open('https://twitter.com/radiants', '_blank', 'noopener,noreferrer')}
          aria-label="Twitter"
        />
      </Tooltip>

      <Tooltip content="Discord" position="top">
        <Button
          variant="text"
          size="md"
          iconOnly
          icon={<Icon name="discord" size={20} />}
          onClick={() => window.open('https://discord.gg/radiants', '_blank', 'noopener,noreferrer')}
          aria-label="Discord"
        />
      </Tooltip>

      {/* Divider */}
      <div className="w-px h-5 bg-rule mx-0.5" />

      {/* Settings controls */}
      <VolumeControl />
      <DarkModeToggle />
    </div>
  );
}

export default StartButton;
