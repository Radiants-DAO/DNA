'use client';

import { Suspense } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { getApp, getActiveAmbientApp, getWindowChrome } from '@/lib/apps';
import { AppWindow } from './AppWindow';
import { Taskbar } from './Taskbar';
import { ZoomRects } from './ZoomRects';
import { Spinner } from '@rdna/radiants/components/core';
import { WordmarkLogo } from '@rdna/radiants/icons/runtime';
import { WebGLSun } from '@/components/background/WebGLSun';
import { MonolithWallpaper } from '@/components/background/MonolithWallpaper';
import { MonolithThemeTuner } from '@/components/background/MonolithThemeTuner';
import { RadioWidget } from '@/components/apps/radio/RadioWidget';

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

export function Desktop({ className = '' }: DesktopProps) {
  const { toggleWidget, windows } = useWindowManager();

  // Resolve ambient capability from catalog
  const ambient = getActiveAmbientApp(windows);
  const AmbientWallpaper = ambient?.ambient.wallpaper;
  const AmbientWidget = ambient?.ambient.widget;
  const AmbientController = ambient?.ambient.controller;

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`.trim()}>
      {/* Background Layer - Ambient wallpaper in widget mode, WebGL sun otherwise */}
      {AmbientWallpaper ? (
        <div className="absolute inset-0 z-base bg-inv">
          <AmbientWallpaper />
        </div>
      ) : (
        <div className="rados-wallpaper absolute inset-0 z-base bg-accent dark:bg-page">
          <WebGLSun />
          <MonolithWallpaper />
        </div>
      )}

      {/* Background Watermark */}
      <div className="rados-watermark absolute inset-0 flex items-center justify-center z-base text-main pointer-events-none text-center">
        <div className="rados-watermark-lockup relative">
          <WordmarkLogo className="w-64 sm:w-80 md:w-96 mx-auto dark-glow-logo" />
        </div>
      </div>

      {/* Top bar — Start + app launchers, marquee slot, settings */}
      <div className="absolute top-0 left-0 right-0 z-chrome pt-2 px-2">
        <Taskbar />
      </div>

      {/* Radio drop-down widget — always mounted (audio continuity), sits
          behind the windows layer so opened windows can cover it. */}
      <RadioWidget />

      {/* Windows Container - sits above icons but below taskbar */}
      <div className="absolute inset-0 z-windows pointer-events-none">
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
                defaultSize={config.defaultSize}
                minSize={config.minSize}
                aspectRatio={config.aspectRatio}
                contentPadding={config.contentPadding}
                chromeless={config.chromeless}
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
        <div className="fixed top-4 right-4 z-system pointer-events-auto">
          <AmbientWidget appId={ambient.app.id} onExit={() => toggleWidget(ambient.app.id)} />
        </div>
      )}

      {/* Persistent ambient controller (mounted when ambient app is active) */}
      {AmbientController && <AmbientController />}

      {/* System 7 zoom rectangles animation */}
      <ZoomRects />
      <MonolithThemeTuner />

    </div>
  );
}
