'use client';

import React, { Suspense } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { getApp, getDesktopLaunchers, getWindowChrome } from '@/lib/apps';
import { getAppMockStates } from '@/lib/mockStates';
import { useWalletStore, useRadRadioStore } from '@/store';
import { AppWindow } from './AppWindow';
import { MobileAppModal } from './MobileAppModal';
import { DesktopIcon } from './DesktopIcon';
import { Taskbar } from './Taskbar';
import { Button, Spinner } from '@rdna/radiants/components/core';
import { WordmarkLogo } from '@rdna/radiants/icons';
import { WebGLSun } from '@/components/background';
import { VideoPlayer, RadRadioWidget, RadRadioController, videos } from '@/components/apps/RadRadioApp';

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
// Mobile Icon Component (simplified for mobile)
// ============================================================================

function MobileIcon({ app, onClick }: { app: { id: string; label: string; icon: React.ReactNode }; onClick: () => void }) {
  return (
    <Button
      type="button"
      quiet
      size="sm"
      onClick={onClick}
      className="
        flex flex-col items-center gap-1
        p-2 pixel-rounded-xl
        hover:bg-hover active:bg-active
        cursor-pointer
        select-none
        w-20
        min-h-[44px]
      "
    >
      {/* Icon in black container */}
      <div className="w-10 h-10 flex items-center justify-center bg-inv pixel-rounded-sm text-accent">
        {app.icon}
      </div>

      {/* Label */}
      <span className="
        font-joystix text-sm text-main text-center
        leading-tight
        max-w-full
        break-words
        uppercase
      ">
        {app.label}
      </span>
    </Button>
  );
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
  const { openWindow, toggleWidget, windows } = useWindowManager();
  const { currentVideoIndex, prevVideo, nextVideo } = useRadRadioStore();
  const desktopApps = getDesktopLaunchers();

  // Detect widget mode — any open window that is in widget mode
  const widgetWindow = windows.find((w) => w.isOpen && w.isWidget);
  // RadRadio is open if its window exists and is open (either windowed or widget)
  const radRadioIsOpen = windows.some((w) => w.id === 'music' && w.isOpen);

  // Check if we're on mobile (client-side only)
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background Layer - Video wallpaper in widget mode, WebGL sun otherwise */}
      {widgetWindow ? (
        <div className="absolute inset-0 z-0 bg-inv">
          <VideoPlayer
            currentVideoIndex={currentVideoIndex}
            onPrevVideo={() => prevVideo(videos.length)}
            onNextVideo={() => nextVideo(videos.length)}
            wallpaperMode
          />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-accent dark:bg-page">
          <WebGLSun />
        </div>
      )}

      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center z-0 text-main pointer-events-none text-center">
        <div>
          <WordmarkLogo className="w-64 sm:w-80 md:w-96 mb-2 mx-auto" />
          <div className="font-mondwest text-lg sm:text-xl">RadOS v1.0</div>
          <div className="text-sm">
            all assets open-sourced<br />
            under the Rad public license
          </div>
        </div>
      </div>

      {/* App Icons — top center */}
      <div
        className={`
          absolute z-10 p-4
          ${isMobile
            ? 'top-0 left-0 right-0 flex flex-row flex-wrap gap-2 justify-center pt-4'
            : 'top-0 left-0 right-0 flex flex-row items-center justify-center gap-2 pt-4'
          }
        `}
      >
        {isMobile ? (
          desktopApps.map((app) => (
            <MobileIcon
              key={app.id}
              app={app}
              onClick={() => openWindow(app.id)}
            />
          ))
        ) : (
          desktopApps.map((app) => (
            <DesktopIcon
              key={app.id}
              appId={app.id}
              label={app.label}
              icon={app.icon}
            />
          ))
        )}
      </div>

      {/* Bottom bar — Start + Utility icons */}
      {!isMobile && (
        <div className="absolute bottom-0 left-0 right-0 z-[200] flex flex-row items-center justify-center pb-4">
          <Taskbar />
        </div>
      )}

      {/* Windows Container - sits above icons but below taskbar */}
      <div
        className="absolute inset-0 z-[100] pointer-events-none"
      >
        {/* Desktop: Render AppWindows - sorted by z-index so higher z-index renders later (on top) */}
        {!isMobile && [...windows]
          .filter((w) => w.isOpen)
          .sort((a, b) => (a.zIndex || 100) - (b.zIndex || 100))
          .map((windowState) => {
          if (!windowState.isOpen) return null;

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

        {/* Mobile: Render MobileAppModals - sorted by z-index so higher z-index renders later (on top) */}
        {isMobile && [...windows]
          .filter((w) => w.isOpen)
          .sort((a, b) => (a.zIndex || 100) - (b.zIndex || 100))
          .map((windowState) => {
          if (!windowState.isOpen) return null;

          const config = getWindowChrome(windowState.id);
          if (!config) return null;

          const appEntry = getApp(windowState.id);
          const AppComponent = appEntry?.component;

          return (
            <MobileAppModal
              key={windowState.id}
              id={windowState.id}
              title={config.windowTitle}
            >
              {AppComponent ? (
                <Suspense fallback={<AppLoadingFallback />}>
                  <AppComponent windowId={windowState.id} />
                </Suspense>
              ) : (
                <PlaceholderAppContent appId={windowState.id} />
              )}
            </MobileAppModal>
          );
        })}
      </div>

      {/* Floating widget panel (above everything when in widget mode) */}
      {widgetWindow && (
        <div className="fixed top-4 right-4 z-[900] pointer-events-auto">
          <RadRadioWidget onExitWidget={() => toggleWidget(widgetWindow.id)} />
        </div>
      )}

      {/* Persistent audio controller (mounted whenever RadRadio is open) */}
      {radRadioIsOpen && <RadRadioController />}

    </div>
  );
}

export default Desktop;
