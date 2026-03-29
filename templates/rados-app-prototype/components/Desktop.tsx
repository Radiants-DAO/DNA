'use client';

import { Suspense } from 'react';
import { useWindowManager } from '../hooks/useWindowManager';
import { useHashRouting } from '../hooks/useHashRouting';
import { useThemeSync } from '../hooks/useThemeSync';
import { getApp, getDesktopLaunchers, getWindowChrome } from '../lib/catalog';
import { AppWindow } from './AppWindow';
import { DesktopIcon } from './DesktopIcon';
import { Taskbar } from './Taskbar';
import { Spinner } from '@rdna/radiants/components/core';
import { WordmarkLogo } from '@rdna/radiants/icons/runtime';

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

function PlaceholderAppContent({ appId }: { appId: string }) {
  const app = getApp(appId);
  return (
    <div className="flex items-center justify-center h-full bg-page p-8">
      <div className="text-center space-y-2">
        <p className="font-joystix text-sm text-head uppercase">
          {app?.windowTitle || appId}
        </p>
        <p className="text-sm text-sub">
          Edit <code className="text-accent">lib/catalog.tsx</code> to wire up your app component.
        </p>
      </div>
    </div>
  );
}

export function Desktop() {
  useHashRouting();
  useThemeSync();

  const { windows } = useWindowManager();
  const desktopApps = getDesktopLaunchers();

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background — CSS gradient, no WebGL */}
      <div className="absolute inset-0 z-0 bg-accent dark:bg-page" />

      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center z-0 text-main pointer-events-none text-center">
        <div>
          <WordmarkLogo className="w-64 sm:w-80 md:w-96 mb-2 mx-auto dark-glow-logo" />
          <div className="font-mondwest text-lg sm:text-xl">__APP_PASCAL_NAME__</div>
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="absolute z-10 top-0 left-0 right-0 flex flex-row items-center justify-center gap-2 p-4 pt-4">
        {desktopApps.map((app) => (
          <DesktopIcon key={app.id} appId={app.id} label={app.label} icon={app.icon} />
        ))}
      </div>

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 z-[200] flex flex-row items-center justify-center pb-4">
        <Taskbar />
      </div>

      {/* Windows */}
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
    </div>
  );
}
