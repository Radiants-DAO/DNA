'use client';

import React, { useState } from 'react';
import { Button, Badge, Card, CardBody, Divider } from '@rdna/radiants/components/core';
import { Icon, RadMarkIcon } from '@/components/icons';
import { WindowTitleBar } from '@/components/Rad_os/WindowTitleBar';
import { DesktopIcon } from '@/components/Rad_os/DesktopIcon';

// ============================================================================
// Helpers
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-joystix text-xs uppercase tracking-wide text-black mb-3">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      <code className="font-mono text-2xs text-black/50 uppercase">{label}</code>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  );
}

// ============================================================================
// WindowTitleBar Section
// ============================================================================

function WindowTitleBarSection() {
  return (
    <Section title="WindowTitleBar">
      <Row label="basic — title + close">
        <div className="w-full border border-black rounded-md overflow-hidden bg-gradient-to-t from-[rgba(252,225,132,1)] to-[rgba(254,248,226,1)]">
          <WindowTitleBar
            title="My App"
            windowId="demo-1"
            onClose={() => {}}
          />
        </div>
      </Row>
      <Row label="with icon + fullscreen">
        <div className="w-full border border-black rounded-md overflow-hidden bg-gradient-to-t from-[rgba(252,225,132,1)] to-[rgba(254,248,226,1)]">
          <WindowTitleBar
            title="Brand Assets"
            windowId="demo-2"
            icon={<RadMarkIcon size={16} />}
            onClose={() => {}}
            onFullscreen={() => {}}
            isFullscreen={false}
          />
        </div>
      </Row>
      <Row label="with help button">
        <div className="w-full border border-black rounded-md overflow-hidden bg-gradient-to-t from-[rgba(252,225,132,1)] to-[rgba(254,248,226,1)]">
          <WindowTitleBar
            title="Auctions"
            windowId="demo-3"
            iconName="coins"
            onClose={() => {}}
            showHelpButton
            helpContent={<p>Help content goes here.</p>}
            helpTitle="Auction Help"
          />
        </div>
      </Row>
      <Row label="with action button">
        <div className="w-full border border-black rounded-md overflow-hidden bg-gradient-to-t from-[rgba(252,225,132,1)] to-[rgba(254,248,226,1)]">
          <WindowTitleBar
            title="Studio"
            windowId="demo-4"
            iconName="code-window"
            onClose={() => {}}
            showActionButton
            actionButton={{
              text: 'Visit Site',
              iconName: 'globe',
            }}
          />
        </div>
      </Row>
      <Row label="minimal — no title, no copy">
        <div className="w-full border border-black rounded-md overflow-hidden bg-gradient-to-t from-[rgba(252,225,132,1)] to-[rgba(254,248,226,1)]">
          <WindowTitleBar
            title=""
            windowId="demo-5"
            onClose={() => {}}
            showTitle={false}
            showCopyButton={false}
            showFullscreenButton={false}
          />
        </div>
      </Row>
    </Section>
  );
}

// ============================================================================
// DesktopIcon Section
// ============================================================================

function DesktopIconSection() {
  return (
    <Section title="DesktopIcon">
      <Row label="app icons">
        <DesktopIcon
          appId="brand"
          label="Brand Assets"
          icon={<RadMarkIcon size={20} />}
        />
        <DesktopIcon
          appId="music"
          label="Rad Radio"
          icon={<Icon name="broadcast-dish" size={20} />}
        />
        <DesktopIcon
          appId="settings"
          label="Settings"
          icon={<Icon name="settings-cog" size={20} />}
        />
        <DesktopIcon
          appId="about"
          label="About"
          icon={<Icon name="question" size={20} />}
        />
      </Row>
    </Section>
  );
}

// ============================================================================
// Component Inventory
// ============================================================================

function InventorySection() {
  const components = [
    { name: 'AppWindow', description: 'Draggable, resizable window frame with z-index management', file: 'AppWindow.tsx' },
    { name: 'AppWindowContent', description: 'Scroll container for window content with max-height constraints', file: 'AppWindowContent.tsx' },
    { name: 'WindowTitleBar', description: 'Configurable title bar with help, action, fullscreen, copy, close buttons', file: 'WindowTitleBar.tsx' },
    { name: 'Desktop', description: 'Desktop grid layout with icon positioning', file: 'Desktop.tsx' },
    { name: 'DesktopIcon', description: 'Clickable app launcher icon', file: 'DesktopIcon.tsx' },
    { name: 'Taskbar', description: 'Bottom taskbar with start menu, social links, dark mode toggle, clock', file: 'Taskbar.tsx' },
    { name: 'StartMenu', description: 'App launcher menu with search and categorized app list', file: 'StartMenu.tsx' },
    { name: 'MobileAppModal', description: 'Full-screen modal for mobile viewport app display', file: 'MobileAppModal.tsx' },
    { name: 'RadOSDesktop', description: 'Top-level shell composing Desktop + Taskbar + window management', file: 'RadOSDesktop.tsx' },
    { name: 'InvertModeProvider', description: 'Context provider for global color inversion mode', file: 'InvertModeProvider.tsx' },
    { name: 'InvertOverlay', description: 'CSS filter overlay for invert mode', file: 'InvertOverlay.tsx' },
    { name: 'SunBackground', description: 'Animated sun background with WebGL/CSS fallback', file: 'SunBackground.tsx' },
  ];

  return (
    <Section title="Component Inventory">
      <div className="space-y-1">
        {components.map((c) => (
          <div key={c.name} className="flex items-start gap-3 py-1.5 border-b border-black/10 last:border-0">
            <code className="font-mono text-xs text-black font-bold whitespace-nowrap min-w-[140px]">{c.name}</code>
            <span className="font-mondwest text-sm text-black/60 flex-1">{c.description}</span>
            <code className="font-mono text-2xs text-black/40 whitespace-nowrap">{c.file}</code>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WindowSystemTab() {
  return (
    <div className="p-4 space-y-2">
      <div className="mb-4">
        <p className="font-mondwest text-sm text-black/60">
          Window system from <code className="text-xs bg-black/5 px-1 rounded">components/Rad_os/</code>
        </p>
      </div>
      <WindowTitleBarSection />
      <DesktopIconSection />
      <InventorySection />
    </div>
  );
}
