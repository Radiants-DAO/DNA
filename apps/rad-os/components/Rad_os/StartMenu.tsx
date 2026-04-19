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
  { id: 'twitter', label: 'Twitter', href: 'https://twitter.com/radiants', icon: <Icon name="twitter" large /> },
  { id: 'discord', label: 'Discord', href: 'https://discord.gg/radiants', icon: <Icon name="discord" large /> },
];

// ============================================================================
// Tile
// ============================================================================

const TILE_CLASSES = '!h-auto !flex-col !items-center !justify-start !gap-1 !py-2 !px-1';

function AppTile({ item, onClick }: { item: MenuItemConfig; onClick: (e: React.MouseEvent) => void }) {
  return (
    <Button
      type="button"
      quiet
      rounded="none"
      size="xl"
      textOnly
      onClick={onClick}
      className={TILE_CLASSES}
    >
      <span className="w-6 h-6 flex items-center justify-center shrink-0">
        {item.icon}
      </span>
      <span className="font-joystix text-xs uppercase text-center leading-tight w-full truncate">
        {item.label}
      </span>
    </Button>
  );
}

function SocialTile({ link }: { link: SocialLink }) {
  return (
    <Button
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      quiet
      rounded="none"
      size="xl"
      textOnly
      className={TILE_CLASSES}
    >
      <span className="w-6 h-6 flex items-center justify-center shrink-0">
        {link.icon}
      </span>
      <span className="font-joystix text-xs uppercase text-center leading-tight w-full truncate">
        {link.label}
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
      className="absolute bottom-full left-0 mb-2 z-10 w-80"
      style={{ position: 'absolute' }}
    >
      <div className="pixel-rounded-sm pixel-shadow-floating">
        <div className="flex flex-row bg-page">
          {/* Left sidebar — Win95 branding strip */}
          <div className="w-10 bg-inv flex items-end justify-center pb-3 shrink-0">
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              <WordmarkLogo className="h-3 w-auto" color="cream" />
            </div>
          </div>

          {/* Right column — tile grid content */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Core Apps Section */}
            <div className="pt-2 pb-2 px-2">
              <div className="px-1 pb-1">
                <span className="font-joystix text-sm text-mute uppercase">
                  Apps
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {sections.apps.map((item) => (
                  <AppTile
                    key={item.id}
                    item={item}
                    onClick={(e: React.MouseEvent) => handleAppClick(item.id, e)}
                  />
                ))}
              </div>
            </div>

            <Separator className="mx-2" />

            {/* Web3 Apps Section */}
            <div className="pt-2 pb-2 px-2">
              <div className="px-1 pb-1">
                <span className="font-joystix text-sm text-mute uppercase">
                  Web3
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {sections.web3.map((item) => (
                  <AppTile
                    key={item.id}
                    item={item}
                    onClick={(e: React.MouseEvent) => handleAppClick(item.id, e)}
                  />
                ))}
              </div>
            </div>

            <Separator className="mx-2" />

            {/* Connect Section */}
            <div className="pt-2 pb-2 px-2">
              <div className="px-1 pb-1">
                <span className="font-joystix text-sm text-mute uppercase">
                  Connect
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {SOCIAL_LINKS.map((link) => (
                  <SocialTile key={link.id} link={link} />
                ))}
              </div>
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
