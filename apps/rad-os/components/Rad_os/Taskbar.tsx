'use client';

import React, { useState, useEffect } from 'react';
import { usePreferencesStore } from '@/store';
import { useWindowManager } from '@/hooks/useWindowManager';
import { Divider, Button, Tooltip } from '@rdna/radiants/components/core';
import { Icon } from '@/components/icons';
import { APP_REGISTRY } from '@/lib/constants';
import { StartMenu } from './StartMenu';

// ============================================================================
// Types
// ============================================================================

interface TaskbarProps {
  className?: string;
}

// ============================================================================
// Start Button Component
// ============================================================================

function StartButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          h-8 px-3 gap-2 rounded-none
          ${isOpen ? 'bg-sun-yellow' : 'hover:bg-sun-yellow/50'}
        `}
      >
        <span className="font-joystix text-sm uppercase">
          Start
        </span>
        <Icon name="menu" size={12} />
      </Button>

      <StartMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

// ============================================================================
// Taskbar Icon Button
// ============================================================================

function TaskbarIconButton({
  icon,
  tooltip,
  onClick,
  href,
  isActive = false,
}: {
  icon: string;
  tooltip: string;
  onClick?: () => void;
  href?: string;
  isActive?: boolean;
}) {
  const handleClick = href
    ? () => window.open(href, '_blank', 'noopener,noreferrer')
    : onClick;

  return (
    <Tooltip content={tooltip}>
      <Button
        variant="ghost"
        size="md"
        iconOnly
        icon={<Icon name={icon} size={20} />}
        onClick={handleClick}
        className={isActive ? 'bg-sun-yellow' : ''}
      />
    </Tooltip>
  );
}

// ============================================================================
// Taskbar Component
// ============================================================================

export function Taskbar({ className = '' }: TaskbarProps) {
  const { darkMode, toggleDarkMode } = usePreferencesStore();
  const { openWindows, focusWindow } = useWindowManager();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-[200]
        flex items-center justify-between
        px-2 py-2
        ${className}
      `}
    >
      {/* Left: Start + Open Apps */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-surface-primary border border-edge-primary rounded-sm p-1">
          <StartButton />
        </div>

        {openWindows.length > 0 && (
          <div className="flex items-center bg-surface-primary border border-edge-primary rounded-sm p-1 gap-0.5">
            {openWindows.map((w) => {
              const config = APP_REGISTRY[w.id];
              if (!config) return null;
              return (
                <Tooltip key={w.id} content={config.title}>
                  <Button
                    variant="ghost"
                    size="md"
                    iconOnly
                    icon={config.icon}
                    onClick={() => focusWindow(w.id)}
                  />
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Utilities */}
      <div className="flex items-center bg-surface-primary border border-edge-primary rounded-sm p-1 gap-0.5">
        <TaskbarIconButton icon="twitter" tooltip="Twitter" href="https://twitter.com/radiants" />
        <TaskbarIconButton icon="discord" tooltip="Discord" href="https://discord.gg/radiants" />

        <Divider orientation="vertical" className="h-6 mx-0.5" />

        <TaskbarIconButton
          icon="radiants-logo"
          tooltip={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleDarkMode}
          isActive={darkMode}
        />
      </div>
    </div>
  );
}

export default Taskbar;
