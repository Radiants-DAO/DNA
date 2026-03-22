'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { getStartMenuSections } from '@/lib/apps';
import { Button, Separator } from '@rdna/radiants/components/core';
import {
  WordmarkLogo,
  Icon,
} from '@rdna/radiants/icons';

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
  { id: 'twitter', label: 'Twitter', href: 'https://twitter.com/radiants', icon: <Icon name="twitter" size={14} /> },
  { id: 'discord', label: 'Discord', href: 'https://discord.gg/radiants', icon: <Icon name="discord" size={16} /> },
];

// ============================================================================
// Shared MenuItem
// ============================================================================

function MenuItem({ item, onClick }: { item: MenuItemConfig; onClick: () => void }) {
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
  const { openWindow } = useWindowManager();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const sections = getStartMenuSections();
  const allApps = [...sections.apps, ...sections.web3];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleAppClick = (appId: string) => {
    openWindow(appId);
    onClose();
  };

  if (!isOpen) return null;

  // ── Mobile: Full-screen overlay ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[300] bg-page animate-in fade-in duration-200">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-rule">
          <span className="font-joystix text-lg text-head">Menu</span>
          <Button
            type="button"
            quiet
            size="sm"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-hover active:bg-active pixel-rounded-sm"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M14 1.41L12.59 0 7 5.59 1.41 0 0 1.41 5.59 7 0 12.59 1.41 14 7 8.41 12.59 14 14 12.59 8.41 7 14 1.41z" />
            </svg>
          </Button>
        </header>

        {/* Content */}
        <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 60px)' }}>
          {/* Apps Section */}
          <section className="mb-6">
            <h2 className="mb-3">Apps</h2>
            <div className="grid grid-cols-3 gap-3">
              {allApps.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  quiet
                  size="sm"
                  onClick={() => handleAppClick(item.id)}
                  className="flex flex-col items-center gap-2 p-3 pixel-rounded-xl hover:bg-hover active:bg-active"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-inv pixel-rounded-sm text-accent">
                    {item.icon}
                  </div>
                  <span className="font-joystix text-sm text-main text-center leading-tight uppercase">
                    {item.label}
                  </span>
                </Button>
              ))}
            </div>
          </section>

          {/* Connect Section */}
          <section>
            <h2 className="mb-3">Connect</h2>
            <div className="space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <Button
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  quiet
                  size="sm"
                  className="w-full flex items-center gap-3 px-3 py-2"
                >
                  <span>{link.label}</span>
                </Button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ── Desktop: Win95-style two-column popup ────────────────────────────────
  return (
    <div
      ref={menuRef}
      className="
        absolute bottom-full left-0 mb-2
        flex flex-row
        bg-page
        pixel-shadow-floating
        pixel-rounded-sm
        z-10
        w-72
      "
      style={{ position: 'absolute' }}
    >
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
            <MenuItem key={item.id} item={item} onClick={() => handleAppClick(item.id)} />
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
            <MenuItem key={item.id} item={item} onClick={() => handleAppClick(item.id)} />
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
              type="button"
              quiet
              size="sm"
              onClick={() => window.open(link.href, '_blank')}
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
  );
}

export default StartMenu;
