'use client';

import { Suspense, useMemo } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { useTypewriter } from '@/hooks/useTypewriter';
import { getApp, getActiveAmbientApp, getDesktopLaunchers, getWindowChrome } from '@/lib/apps';
import { AppWindow } from './AppWindow';
import { DesktopIcon } from './DesktopIcon';
import { Taskbar } from './Taskbar';
import { ZoomRects } from './ZoomRects';
import { Spinner } from '@rdna/radiants/components/core';
import { WordmarkLogo } from '@rdna/radiants/icons/runtime';
import { WebGLSun } from '@/components/background/WebGLSun';

// Loading fallback for lazy-loaded apps
function AppLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-page">
      <div className="text-center">
        <Spinner size={24} />
        <p className="mt-2">Loading...</p>
      </div>
    </div>
  );
}

// ============================================================================
// Types
// ============================================================================

interface DesktopProps {
  /** Additional className */
  className?: string;
}

// ============================================================================
// Placeholder App Content Component
// ============================================================================

function PlaceholderAppContent({ appId }: { appId: string }) {
  const app = getApp(appId);
  return (
    <div className="flex items-center justify-center h-full bg-page p-8">
      <div className="text-center">
        <p className="mb-2">
          {app?.windowTitle || appId}
        </p>
        <p>Coming soon...</p>
      </div>
    </div>
  );
}

// ============================================================================
// Desktop Component
// ============================================================================

const TAGLINES = [
  'Be kind, make rad sh*t',
  'Est. 2023',
  'From dawn to dusk',
  'be both alchemist & substance',
  'all assets open-sourced under the Rad public license',
];

export function Desktop({ className: _className = '' }: DesktopProps) {
  const { toggleWidget, windows } = useWindowManager();
  const desktopApps = getDesktopLaunchers();
  const taglines = useMemo(() => TAGLINES, []);
  const { displayed, cursorVisible } = useTypewriter(taglines);

  // Resolve ambient capability from catalog
  const ambient = getActiveAmbientApp(windows);
  const AmbientWallpaper = ambient?.ambient.wallpaper;
  const AmbientWidget = ambient?.ambient.widget;
  const AmbientController = ambient?.ambient.controller;

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background Layer - Ambient wallpaper in widget mode, WebGL sun otherwise */}
      {AmbientWallpaper ? (
        <div className="absolute inset-0 z-0 bg-inv">
          <AmbientWallpaper />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-accent dark:bg-page">
          <WebGLSun />
        </div>
      )}

      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center z-0 text-main pointer-events-none text-center">
        <div className="relative">
          {/* eslint-disable-next-line rdna/no-viewport-breakpoints-in-window-layout -- reason:desktop-watermark-scales-with-viewport owner:rad-os expires:2026-12-31 issue:DNA-001 */}
          <WordmarkLogo className="w-64 sm:w-80 md:w-96 mb-2 mx-auto dark-glow-logo" />
          {/* eslint-disable-next-line rdna/no-viewport-breakpoints-in-window-layout -- reason:desktop-watermark-scales-with-viewport owner:rad-os expires:2026-12-31 issue:DNA-001 */}
          <div className="font-mondwest text-lg sm:text-xl">RadOS v1.0</div>
          <div className="text-sm font-mono font-bold uppercase max-w-[40ch] ml-2">
            {displayed}
            <span className={cursorVisible ? 'opacity-100' : 'opacity-0'}>|</span>
          </div>
        </div>
      </div>

      {/* App Icons — top center */}
      <div className="absolute z-10 top-0 left-0 right-0 flex flex-row items-center justify-center gap-2 p-4 pt-4">
        {desktopApps.map((app) => (
          <DesktopIcon
            key={app.id}
            appId={app.id}
            label={app.label}
            icon={app.icon}
          />
        ))}
      </div>

      {/* Bottom bar — Start + Utility icons */}
      <div className="absolute bottom-0 left-0 right-0 z-[200] flex flex-row items-center justify-center pb-4">
        <Taskbar />
      </div>

      {/* Windows Container - sits above icons but below taskbar */}
      <div className="absolute inset-0 z-[100] pointer-events-none">
        {[...windows]
          .filter((w) => w.isOpen)
          .sort((a, b) => (a.zIndex || 100) - (b.zIndex || 100))
          .map((windowState) => {
            const config = getWindowChrome(windowState.id);
            if (!config) return null;

            const appEntry = getApp(windowState.id);
            const AppComponent = appEntry?.component;

            return (
              <AppWindow
                key={windowState.id}
                id={windowState.id}
                title={config.windowTitle}
                icon={config.windowIcon}
                resizable={config.resizable}
                defaultSize={config.defaultSize}
                contentPadding={config.contentPadding}
                showWidgetButton={Boolean(config.ambient)}
                onWidget={config.ambient ? () => toggleWidget(windowState.id) : undefined}
              >
                {AppComponent ? (
                  <Suspense fallback={<AppLoadingFallback />}>
                    <AppComponent windowId={windowState.id} />
                  </Suspense>
                ) : (
                  <PlaceholderAppContent appId={windowState.id} />
                )}
              </AppWindow>
            );
          })}
      </div>

      {/* Floating widget panel (above everything when in widget mode) */}
      {ambient && AmbientWidget && (
        <div className="fixed top-4 right-4 z-[950] pointer-events-auto">
          <AmbientWidget appId={ambient.app.id} onExit={() => toggleWidget(ambient.app.id)} />
        </div>
      )}

      {/* Persistent ambient controller (mounted when ambient app is active) */}
      {AmbientController && <AmbientController />}

      {/* System 7 zoom rectangles animation */}
      <ZoomRects />

    </div>
  );
}

export default Desktop;
