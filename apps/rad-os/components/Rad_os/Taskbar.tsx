'use client';

import React, { useState, useEffect } from 'react';
import { usePreferencesStore } from '@/store';
import { Divider, Button } from '@rdna/radiants/components/core';
import {
  RadMarkIcon,
  TwitterIcon,
  DiscordIcon,
  ICON_SIZE,
  Icon,
} from '@/components/icons';
import { StartMenu } from './StartMenu';

// ============================================================================
// Types
// ============================================================================

interface TaskbarProps {
  className?: string;
}

// ============================================================================
// Hamburger Menu Icon
// ============================================================================

function HamburgerIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 12" fill="currentColor">
      <rect y="0" width="16" height="2" />
      <rect y="5" width="16" height="2" />
      <rect y="10" width="16" height="2" />
    </svg>
  );
}

// ============================================================================
// Start Button Component
// ============================================================================

function StartButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3
          px-4 py-2
          border border-edge-primary border-b-2
          rounded-sm
          h-10
          ${isOpen
            ? 'bg-sun-yellow'
            : 'bg-sun-yellow hover:bg-sun-yellow/80'
          }
        `}
      >
        <span className="font-joystix text-xs text-content-heading uppercase">
          Start
        </span>
        <HamburgerIcon size={14} />
      </button>

      <StartMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

// ============================================================================
// Taskbar Icon Button Component
// ============================================================================

function TaskbarIconButton({
  children,
  onClick,
  title,
  isActive = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  isActive?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="md"
      iconOnly
      icon={children}
      onClick={onClick}
      title={title}
      className={isActive ? 'bg-sun-yellow' : ''}
    />
  );
}

// ============================================================================
// Taskbar Component
// ============================================================================

/**
 * Desktop taskbar with Start menu and quick actions
 *
 * Features:
 * - Start menu button (left)
 * - Quick launch icons (right)
 * - Matches Figma design with bordered icon bar
 * - Responsive: simplified on mobile
 */
export function Taskbar({ className = '' }: TaskbarProps) {
  const { darkMode, toggleDarkMode } = usePreferencesStore();

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
        flex items-center gap-2
        px-2 py-2
        ${className}
      `}
    >
      {/* Left Section: Start Button */}
      <StartButton />

      {/* Right Section: Quick Launch Icons */}
      <div className="flex items-center bg-surface-primary border border-edge-primary rounded-sm p-1 gap-0.5">
        {/* Home */}
        <TaskbarIconButton title="Home">
          <Icon name="home2" size={ICON_SIZE.sm} />
        </TaskbarIconButton>

        {/* Divider */}
        <Divider orientation="vertical" className="h-6 mx-0.5" />

        {/* Social & Utility Icons */}
        <a
          href="https://twitter.com/radiants"
          target="_blank"
          rel="noopener noreferrer"
          title="Twitter"
        >
          <TaskbarIconButton>
            <TwitterIcon size={ICON_SIZE.sm} />
          </TaskbarIconButton>
        </a>

        <a
          href="https://discord.gg/radiants"
          target="_blank"
          rel="noopener noreferrer"
          title="Discord"
        >
          <TaskbarIconButton>
            <DiscordIcon size={ICON_SIZE.sm} />
          </TaskbarIconButton>
        </a>

        {/* Divider */}
        <Divider orientation="vertical" className="h-6 mx-0.5" />

        {/* RadMark Icon - Dark/Light Mode Toggle */}
        <TaskbarIconButton
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          isActive={darkMode}
        >
          <RadMarkIcon size={ICON_SIZE.sm} />
        </TaskbarIconButton>
      </div>
    </div>
  );
}

export default Taskbar;
