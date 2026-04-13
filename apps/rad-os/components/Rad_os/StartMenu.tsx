'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { getStartMenuSections } from '@/lib/apps';
import { Button, Separator } from '@rdna/radiants/components/core';
import {
  WordmarkLogo,
  Icon,
} from '@rdna/radiants/icons/runtime';

// ============================================================================
// Types
// ============================================================================

interface StartMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Callback to close the menu */
  onClose: () => void;
}

interface MenuItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SocialLink {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const SOCIAL_LINKS: SocialLink[] = [
  { id: 'twitter', label: 'Twitter', href: 'https://twitter.com/radiants', icon: <Icon name="twitter" /> },
  { id: 'discord', label: 'Discord', href: 'https://discord.gg/radiants', icon: <Icon name="discord" /> },
];

// ============================================================================
// Shared MenuItem
// ============================================================================

function MenuItem({ item, onClick }: { item: MenuItemConfig; onClick: (e: React.MouseEvent) => void }) {
  return (
    <Button
      key={item.id}
      type="button"
      quiet
      size="sm"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-hover active:bg-active text-left"
    >
      <span className="w-5 h-5 flex items-center justify-center text-main shrink-0">
        {item.icon}
      </span>
      <span className="flex-1 font-joystix text-sm text-main uppercase">
        {item.label}
      </span>
    </Button>
  );
}

// ============================================================================
// Start Menu Component
// ============================================================================

/**
 * Start Menu component:
 * - Desktop: Win95-style two-column popup positioned above Start button
 * - Mobile: Full-screen overlay
 */
export function StartMenu({ isOpen, onClose }: StartMenuProps) {
  const { openWindowWithZoom } = useWindowManager();
  const menuRef = useRef<HTMLDivElement>(null);

  const sections = getStartMenuSections();

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Check if click was on the Start button (don't close in that case)
        const target = e.target as HTMLElement;
        if (target.closest('[data-start-button]')) return;
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleAppClick = (appId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openWindowWithZoom(appId, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    onClose();
  };

  if (!isOpen) return null;


  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 z-10 w-72"
      style={{ position: 'absolute' }}
    >
      <div className="pixel-rounded-sm pixel-shadow-floating">
        <div className="flex flex-row bg-page">
      {/* Left sidebar — Win95 branding strip */}
      <div
        className="w-10 bg-inv flex items-end justify-start pb-3 shrink-0"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        <WordmarkLogo className="h-3 w-auto" color="cream" />
      </div>

      {/* Right column — menu content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Core Apps Section */}
        <div className="py-1">
          <div className="px-3 py-1">
            <span className="font-joystix text-sm text-mute uppercase">
              Apps
            </span>
          </div>
          {sections.apps.map((item) => (
            <MenuItem key={item.id} item={item} onClick={(e: React.MouseEvent) => handleAppClick(item.id, e)} />
          ))}
        </div>

        <Separator className="mx-2" />

        {/* Web3 Apps Section */}
        <div className="py-1">
          <div className="px-3 py-1">
            <span className="font-joystix text-sm text-mute uppercase">
              Web3
            </span>
          </div>
          {sections.web3.map((item) => (
            <MenuItem key={item.id} item={item} onClick={(e: React.MouseEvent) => handleAppClick(item.id, e)} />
          ))}
        </div>

        <Separator className="mx-2" />

        {/* Connect Section */}
        <div className="py-1">
          <div className="px-3 py-1">
            <span className="font-joystix text-sm text-mute uppercase">
              Connect
            </span>
          </div>
              {SOCIAL_LINKS.map((link) => (
                <Button
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  quiet
                  size="sm"
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-hover active:bg-active text-left"
                >
                  <span className="w-5 h-5 flex items-center justify-center text-main shrink-0">
                    {link.icon}
              </span>
              <span className="flex-1 font-joystix text-sm text-main uppercase">
                {link.label}
              </span>
            </Button>
          ))}
        </div>

        {/* Footer — full width across right column */}
        <div className="bg-depth px-3 py-2 border-t border-rule flex items-center justify-between mt-auto">
          <span className="font-mondwest text-sm text-mute">RadOS v1.0</span>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}

export default StartMenu;
