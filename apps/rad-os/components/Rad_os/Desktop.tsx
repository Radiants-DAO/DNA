'use client';

import React, { Suspense } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { APP_REGISTRY, getAllAppConfigs, AppConfig, APP_IDS } from '@/lib/constants';
import { getAppMockStates } from '@/lib/mockStates';
import { useWalletStore, useRadRadioStore } from '@/store';
import { AppWindow } from './AppWindow';
import { MobileAppModal } from './MobileAppModal';
import { DesktopIcon } from './DesktopIcon';
import { StartButton, UtilityBar } from './Taskbar';
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

function MobileIcon({ config, onClick }: { config: AppConfig; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
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
        {config.icon}
      </div>

      {/* Label */}
      <span className="
        font-joystix text-sm text-main text-center
        leading-tight
        max-w-full
        break-words
        uppercase
      ">
        {config.title}
      </span>
    </Button>
  );
}

// ============================================================================
// Placeholder App Content Component
// ============================================================================

function PlaceholderAppContent({ appId }: { appId: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-page p-8">
      <div className="text-center">
        <p className="mb-2">
          {APP_REGISTRY[appId as keyof typeof APP_REGISTRY]?.title || appId}
        </p>
        <p>Coming soon...</p>
      </div>
    </div>
  );
}

// ============================================================================
// Desktop Component
// ============================================================================

/**
 * Desktop environment component that renders:
 * - Desktop icons (left side on desktop, top row on mobile)
 * - All open windows (AppWindow on desktop, MobileAppModal on mobile)
 * - Background layer with watermark
 *
 * @example
 * <Desktop />
 */
export function Desktop({ className = '' }: DesktopProps) {
  const { openWindow, toggleWidget, windows } = useWindowManager();
  const { activeMockState, applyMockState } = useWalletStore();
  const { currentVideoIndex, prevVideo, nextVideo } = useRadRadioStore();
  const allApps = getAllAppConfigs();

  // Detect widget mode — any open window that is in widget mode
  const widgetWindow = windows.find((w) => w.isOpen && w.isWidget);
  // RadRadio is open if its window exists and is open (either windowed or widget)
  const radRadioIsOpen = windows.some((w) => w.id === APP_IDS.MUSIC && w.isOpen);

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

  const handleIconClick = (appId: string) => {
    const config = APP_REGISTRY[appId as keyof typeof APP_REGISTRY];
    openWindow(appId, config?.defaultSize);
  };

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
          allApps.map((config) => (
            <MobileIcon
              key={config.id}
              config={config}
              onClick={() => handleIconClick(config.id)}
            />
          ))
        ) : (
          allApps.map((config) => (
            <DesktopIcon
              key={config.id}
              appId={config.id}
              label={config.title}
              icon={config.icon}
            />
          ))
        )}
      </div>

      {/* Bottom bar — Start + Utility icons */}
      {!isMobile && (
        <div className="absolute bottom-0 left-0 right-0 z-[200] flex flex-row items-center justify-center gap-2 pb-4">
          <StartButton />
          <UtilityBar />
        </div>
      )}

      {/* Windows Container - sits above icons but below taskbar */}
      <div
        className={`
          absolute inset-0 z-[100] pointer-events-none
        `}
      >
        {/* Desktop: Render AppWindows - sorted by z-index so higher z-index renders later (on top) */}
        {!isMobile && [...windows]
          .filter((w) => w.isOpen)
          .sort((a, b) => (a.zIndex || 100) - (b.zIndex || 100))
          .map((windowState) => {
          if (!windowState.isOpen) return null;

          const config = APP_REGISTRY[windowState.id as keyof typeof APP_REGISTRY];
          if (!config) return null;

          const AppComponent = config.component;

          return (
            <AppWindow
              key={windowState.id}
              id={windowState.id}
              title={config.title}
              icon={config.icon}
              resizable={config.resizable}
              defaultSize={config.defaultSize}
              showHelpButton={config.helpConfig?.showHelpButton}
              helpContent={config.helpConfig?.helpContent}
              helpTitle={config.helpConfig?.helpTitle}
              showMockStatesButton={config.mockStatesConfig?.showMockStatesButton}
              mockStates={getAppMockStates(windowState.id)?.definitions}
              mockStateCategories={getAppMockStates(windowState.id)?.categories}
              activeMockState={activeMockState ?? undefined}
              onSelectMockState={applyMockState}
              contentPadding={config.contentPadding}
              showWidgetButton={config.showWidgetButton}
              onWidget={config.showWidgetButton ? () => toggleWidget(windowState.id) : undefined}
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

          const config = APP_REGISTRY[windowState.id as keyof typeof APP_REGISTRY];
          if (!config) return null;

          const AppComponent = config.component;

          return (
            <MobileAppModal
              key={windowState.id}
              id={windowState.id}
              title={config.title}
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
