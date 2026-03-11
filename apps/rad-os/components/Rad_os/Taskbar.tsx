'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePreferencesStore } from '@/store';
import { Button, Tooltip, Slider } from '@rdna/radiants/components/core';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { Icon } from '@/components/icons';
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
    <BasePopover.Root>
      <Tooltip content={`Volume: ${volume}%`} position="top">
        <BasePopover.Trigger
          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
          render={
            <Button
              variant="text"
              size="sm"
              iconOnly
              icon={<Icon name={isMuted ? 'volume-mute' : 'volume-high'} size={16} />}
              aria-label={`Volume: ${volume}%`}
            />
          }
        />
      </Tooltip>
      <BasePopover.Portal>
        <BasePopover.Positioner side="top" align="center" sideOffset={12}>
          <BasePopover.Popup
            className="
              z-50 bg-surface-primary border border-edge-primary rounded-sm shadow-raised
              px-3 py-4 flex flex-col items-center gap-2
              transition-[opacity,transform,filter] duration-150 ease-out
              data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1
              data-[ending-style]:opacity-0 data-[ending-style]:blur-sm
            "
            data-variant="popover"
          >
            {/* Vertical slider — rotated horizontal slider */}
            <div className="h-28 w-6 flex items-center justify-center">
              <div className="origin-center -rotate-90 w-28">
                <Slider
                  value={volume}
                  onChange={setVolume}
                  min={0}
                  max={100}
                  step={1}
                  size="sm"
                />
              </div>
            </div>
            <span className="font-mono text-xs text-content-muted tabular-nums">{volume}</span>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
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
          w-10 h-5 rounded-xs border cursor-pointer
          transition-[background-color,border-color] duration-150
          bg-surface-primary border-edge-primary
          hover:border-edge-focus
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1
        "
      >
        {/* Thumb with icon */}
        <span
          className={[
            'absolute top-0 -mt-px -ml-px flex items-center justify-center',
            'h-5 w-5 rounded-xs border border-edge-primary bg-surface-primary',
            'transition-[translate,border-color,background-color] duration-150',
            'shadow-none',
            'group-hover:-top-1 group-hover:shadow-lifted',
            'group-active:-top-0.5 group-active:shadow-resting',
            darkMode ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        >
          <Icon
            name={darkMode ? 'moon' : 'radiants-logo'}
            size={10}
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
        flex items-center gap-1
        bg-surface-primary/80 backdrop-blur-sm
        border border-edge-primary rounded-sm
        px-2 py-1
        ${className}
      `}
    >
      {/* Social links */}
      <Tooltip content="Twitter" position="top">
        <Button
          variant="text"
          size="sm"
          iconOnly
          icon={<Icon name="twitter" size={16} />}
          onClick={() => window.open('https://twitter.com/radiants', '_blank', 'noopener,noreferrer')}
          aria-label="Twitter"
        />
      </Tooltip>

      <Tooltip content="Discord" position="top">
        <Button
          variant="text"
          size="sm"
          iconOnly
          icon={<Icon name="discord" size={16} />}
          onClick={() => window.open('https://discord.gg/radiants', '_blank', 'noopener,noreferrer')}
          aria-label="Discord"
        />
      </Tooltip>

      {/* Divider */}
      <div className="w-px h-4 bg-edge-muted mx-0.5" />

      {/* Settings controls */}
      <VolumeControl />
      <DarkModeToggle />
    </div>
  );
}

export default StartButton;
