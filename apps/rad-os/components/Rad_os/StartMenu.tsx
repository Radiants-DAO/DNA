'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { APP_IDS } from '@/lib/constants';
import { Button } from '@rdna/radiants/components/core';
import {
  RadMarkIcon,
  TwitterIcon,
  DiscordIcon,
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

// ============================================================================
// Menu Configuration
// ============================================================================

const CORE_APP_ITEMS: MenuItemConfig[] = [
  { id: APP_IDS.BRAND, label: 'Brand & Press', icon: <RadMarkIcon size={20} /> },
  { id: APP_IDS.MANIFESTO, label: 'Manifesto', icon: <Icon name="document" size={20} /> },
  { id: APP_IDS.ABOUT, label: 'About', icon: <Icon name="question" size={20} /> },
  { id: APP_IDS.MUSIC, label: 'Music', icon: <Icon name="music-8th-notes" size={20} /> },
  { id: APP_IDS.LINKS, label: 'Links', icon: <Icon name="globe" size={20} /> },
];

const WEB3_APP_ITEMS: MenuItemConfig[] = [
  { id: APP_IDS.STUDIO, label: 'Radiants Studio', icon: <Icon name="code-window" size={20} /> },
];

interface SocialLink {
  id: string;
  label: string;
  href: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  { id: 'twitter', label: 'Twitter', href: 'https://twitter.com/radiants' },
  { id: 'discord', label: 'Discord', href: 'https://discord.gg/radiants' },
];

// ============================================================================
// Start Menu Component
// ============================================================================

/**
 * Start Menu component:
 * - Desktop: Popup menu positioned above Start button
 * - Mobile: Full-screen overlay
 * - Lists all apps
 * - Connect section with social links
 */
export function StartMenu({ isOpen, onClose }: StartMenuProps) {
  const { openWindow } = useWindowManager();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Get all app configs for mobile view
  const allApps = [...CORE_APP_ITEMS, ...WEB3_APP_ITEMS];

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

  // Mobile: Full-screen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[300] bg-surface-primary animate-in fade-in duration-200">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-edge-muted">
          <span className="font-joystix text-lg text-content-heading">Menu</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="
              w-10 h-10
              flex items-center justify-center
              hover:bg-hover-overlay active:bg-active-overlay
              rounded-sm
            "
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
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAppClick(item.id)}
                  className="
                    flex flex-col items-center gap-2
                    p-3
                    rounded-lg
                    hover:bg-hover-overlay active:bg-active-overlay
                  "
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-surface-secondary rounded-sm text-action-primary">
                    {item.icon}
                  </div>
                  <span className="font-joystix text-sm text-content-primary text-center leading-tight uppercase">
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
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center gap-3
                    p-3
                    rounded-lg
                    hover:bg-hover-overlay active:bg-active-overlay
                    transition-colors
                  "
                >
                  <span className="font-mondwest text-sm text-content-primary">
                    {link.label}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                    className="ml-auto text-content-muted"
                  >
                    <path d="M10.5 10.5H1.5V1.5H6V0H1.5C0.675 0 0 0.675 0 1.5V10.5C0 11.325 0.675 12 1.5 12H10.5C11.325 12 12 11.325 12 10.5V6H10.5V10.5ZM7.5 0V1.5H9.44L3.09 7.85L4.15 8.91L10.5 2.56V4.5H12V0H7.5Z" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Desktop: Popup menu matching reference design
  return (
    <div
      ref={menuRef}
      className="
        absolute bottom-full left-0 mb-2
        w-64
        bg-surface-primary
        border border-edge-primary
        shadow-floating
        overflow-hidden
        rounded-sm
        z-10
      "
    >
      {/* Header with WordmarkLogo */}
      <div className="bg-surface-secondary px-3 py-3 flex items-center gap-3">
        <WordmarkLogo className="h-4 w-auto" color="cream" />
      </div>

      {/* Core Apps Section */}
      <div className="py-1">
        <div className="px-3 py-1">
          <span className="font-joystix text-sm text-content-muted uppercase">
            Apps
          </span>
        </div>
        {CORE_APP_ITEMS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleAppClick(item.id)}
            className="
              w-full flex items-center gap-3 px-3 py-2
              hover:bg-hover-overlay active:bg-active-overlay
              text-left
            "
          >
            <span className="w-5 h-5 flex items-center justify-center text-content-primary">
              {item.icon}
            </span>
            <span className="flex-1 font-joystix text-sm text-content-primary uppercase">
              {item.label}
            </span>
          </Button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-[1px] mx-2 my-1 bg-edge-muted" />

      {/* Web3 Apps Section */}
      <div className="py-1">
        <div className="px-3 py-1">
          <span className="font-joystix text-sm text-content-muted uppercase">
            Web3
          </span>
        </div>
        {WEB3_APP_ITEMS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleAppClick(item.id)}
            className="
              w-full flex items-center gap-3 px-3 py-2
              hover:bg-hover-overlay active:bg-active-overlay
              text-left
            "
          >
            <span className="w-5 h-5 flex items-center justify-center text-content-primary">
              {item.icon}
            </span>
            <span className="flex-1 font-joystix text-sm text-content-primary uppercase">
              {item.label}
            </span>
          </Button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-[1px] mx-2 my-1 bg-edge-muted" />

      {/* Connect Section */}
      <div className="py-1">
        <div className="px-3 py-1">
          <span className="font-joystix text-sm text-content-muted uppercase">
            Connect
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => window.open('https://twitter.com/radiants', '_blank')}
          className="
            w-full flex items-center gap-3 px-3 py-2
            hover:bg-hover-overlay active:bg-active-overlay
            text-left
          "
        >
          <span className="w-5 h-5 flex items-center justify-center text-content-primary">
            <TwitterIcon size={14} />
          </span>
          <span className="flex-1 font-joystix text-sm text-content-primary uppercase">
            Twitter
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => window.open('https://discord.gg/radiants', '_blank')}
          className="
            w-full flex items-center gap-3 px-3 py-2
            hover:bg-hover-overlay active:bg-active-overlay
            text-left
          "
        >
          <span className="w-5 h-5 flex items-center justify-center text-content-primary">
            <DiscordIcon size={16} />
          </span>
          <span className="flex-1 font-joystix text-sm text-content-primary uppercase">
            Discord
          </span>
        </Button>
      </div>

      {/* Footer */}
      <div className="bg-surface-muted px-3 py-2 border-t border-edge-muted flex items-center justify-between">
        <span className="font-mondwest text-sm text-content-muted">RadOS v1.0</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleAppClick(APP_IDS.TRASH)}
          className="flex items-center gap-1.5 text-content-muted hover:text-content-primary transition-colors"
        >
          <Icon name="trash" size={14} />
          <span className="font-mondwest text-sm">Trash</span>
        </Button>
      </div>
    </div>
  );
}

export default StartMenu;
