'use client';

import React, { useState, useEffect } from 'react';
import { usePreferencesStore } from '@/store';
import { Divider } from '@rdna/radiants/components/core';
import {
  RadMarkIcon,
  TwitterIcon,
  DiscordIcon,
  DarkModeIcon,
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
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        w-8 h-8 flex items-center justify-center
        border border-edge-primary rounded-sm
        ${isActive ? 'bg-sun-yellow' : 'bg-surface-primary hover:bg-sun-yellow/50'}
        text-content-heading
      `}
    >
      {children}
    </button>
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
function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 1H8V2H9V3H10V5H11V9H10V11H9V12H8V13H6V12H5V11H4V10H3V8H2V6H3V5H4V4H5V3H6V2H5V1H6ZM6 3H5V4H4V5H3V8H4V9H5V11H6V12H8V11H9V9H10V5H9V3H8V2H6V3Z"/>
    </svg>
  );
}

export function Taskbar({ className = '' }: TaskbarProps) {
  const { invertMode, toggleInvertMode, darkMode, toggleDarkMode } = usePreferencesStore();

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
        fixed bottom-0 left-0 right-0 z-[150]
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

        {/* RadMark Icon */}
        <TaskbarIconButton title="Radiants">
          <RadMarkIcon size={ICON_SIZE.sm} />
        </TaskbarIconButton>

        {/* Divider */}
        <Divider orientation="vertical" className="h-6 mx-0.5" />

        {/* Dark Mode Toggle */}
        <TaskbarIconButton
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          isActive={darkMode}
        >
          <MoonIcon size={ICON_SIZE.sm} />
        </TaskbarIconButton>

        {/* Invert Mode Toggle */}
        <TaskbarIconButton
          onClick={toggleInvertMode}
          title={invertMode ? 'Disable invert mode' : 'Enable invert mode'}
          isActive={invertMode}
        >
          <DarkModeIcon size={ICON_SIZE.sm} />
        </TaskbarIconButton>
      </div>
    </div>
  );
}

export default Taskbar;
