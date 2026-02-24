'use client';

import React, { Suspense } from 'react';
import { useWindowManager } from '@/hooks/useWindowManager';
import { APP_REGISTRY, getAllAppConfigs, AppConfig } from '@/lib/constants';
import { getAppMockStates } from '@/lib/mockStates';
import { useWalletStore } from '@/store';
import { AppWindow } from './AppWindow';
import { MobileAppModal } from './MobileAppModal';
import { DesktopIcon, type IconVariant, ICON_VARIANTS, ICON_VARIANT_LABELS } from './DesktopIcon';
import { Spinner } from '@rdna/radiants/components/core';
import { WordmarkLogo } from '@/components/icons';
import { WebGLSun } from '@/components/background';

// Loading fallback for lazy-loaded apps
function AppLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-surface-primary">
      <div className="text-center">
        <Spinner size={24} />
        <p className="font-mondwest text-sm text-content-muted mt-2">Loading...</p>
      </div>
    </div>
  );
}

// ============================================================================
// Types
// ============================================================================

interface DesktopProps {
  /** Show taskbar area (reserve space at bottom) */
  showTaskbar?: boolean;
  /** Children to render (like Taskbar) */
  children?: React.ReactNode;
}

// ============================================================================
// Mobile Icon Component (simplified for mobile)
// ============================================================================

function MobileIcon({ config, onClick }: { config: AppConfig; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex flex-col items-center gap-1
        p-2 rounded-lg
        hover:bg-hover-overlay active:bg-active-overlay
        cursor-pointer
        select-none
        w-20
        min-h-[44px]
      "
    >
      {/* Icon in black container */}
      <div className="w-10 h-10 flex items-center justify-center bg-surface-secondary rounded-sm text-sun-yellow">
        {config.icon}
      </div>

      {/* Label */}
      <span className="
        font-joystix text-xs text-content-primary text-center
        leading-tight
        max-w-full
        break-words
        uppercase
      ">
        {config.title}
      </span>
    </button>
  );
}

// ============================================================================
// Placeholder App Content Component
// ============================================================================

function PlaceholderAppContent({ appId }: { appId: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-surface-primary p-8">
      <div className="text-center">
        <p className="font-joystix text-lg text-content-primary mb-2">
          {APP_REGISTRY[appId as keyof typeof APP_REGISTRY]?.title || appId}
        </p>
        <p className="font-mondwest text-sm text-content-muted">
          Coming soon...
        </p>
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
 * <Desktop showTaskbar>
 *   <Taskbar />
 * </Desktop>
 */
export function Desktop({ showTaskbar = true, children }: DesktopProps) {
  const { openWindow, windows } = useWindowManager();
  const { activeMockState, applyMockState } = useWalletStore();
  const allApps = getAllAppConfigs();

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

  // Icon style variant with localStorage persistence
  const [iconVariant, setIconVariant] = React.useState<IconVariant>('list');

  React.useEffect(() => {
    const saved = localStorage.getItem('rados-icon-variant');
    if (saved && ICON_VARIANTS.includes(saved as IconVariant)) {
      setIconVariant(saved as IconVariant);
    }
  }, []);

  const cycleVariant = (dir: 1 | -1) => {
    setIconVariant(prev => {
      const idx = ICON_VARIANTS.indexOf(prev);
      const next = ICON_VARIANTS[(idx + dir + ICON_VARIANTS.length) % ICON_VARIANTS.length];
      localStorage.setItem('rados-icon-variant', next);
      return next;
    });
  };

  // Layout classes for icon container per variant
  const iconLayoutClasses: Record<IconVariant, string> = {
    list: 'flex flex-col gap-2',
    macos: 'grid grid-cols-2 gap-px',
    win95: 'flex flex-col gap-px',
    neon: 'flex flex-col gap-2',
  };

  const handleIconClick = (appId: string) => {
    const config = APP_REGISTRY[appId as keyof typeof APP_REGISTRY];
    openWindow(appId, config?.defaultSize);
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background Layer - WebGL animated sun */}
      <div className="absolute inset-0 z-0 bg-sun-yellow dark:bg-surface-primary">
        <WebGLSun />
      </div>

      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center z-[5] text-content-primary pointer-events-none text-center">
        <div>
          <WordmarkLogo className="w-48 sm:w-64 md:w-80 mb-2 mx-auto" />
          <div className="font-mondwest text-lg sm:text-xl">RadOS v1.0</div>
          <div className="text-xs">
            all assets open-sourced<br />
            under the Rad public license
          </div>
        </div>
      </div>

      {/* Desktop Icons */}
      <div
        className={`
          absolute z-10 p-4 sm:p-6 md:p-8 pb-16
          ${isMobile
            ? 'top-0 left-0 right-0 flex flex-row flex-wrap gap-2 justify-center pt-4'
            : 'top-0 left-0 bottom-16 flex flex-col gap-2 w-fit'
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
          <>
            {/* Style Switcher */}
            <div className="flex items-center gap-1 mb-1">
              <button
                type="button"
                onClick={() => cycleVariant(-1)}
                className="w-5 h-5 flex items-center justify-center text-content-muted hover:text-sun-yellow transition-colors focus:outline-none"
                aria-label="Previous icon style"
              >
                <span className="font-joystix text-[10px]">&#9664;</span>
              </button>
              <span className="font-joystix text-[9px] text-content-muted uppercase w-16 text-center select-none">
                {ICON_VARIANT_LABELS[iconVariant]}
              </span>
              <button
                type="button"
                onClick={() => cycleVariant(1)}
                className="w-5 h-5 flex items-center justify-center text-content-muted hover:text-sun-yellow transition-colors focus:outline-none"
                aria-label="Next icon style"
              >
                <span className="font-joystix text-[10px]">&#9654;</span>
              </button>
            </div>

            {/* Icon Grid/List */}
            <div className={iconLayoutClasses[iconVariant]}>
              {allApps.map((config) => (
                <DesktopIcon
                  key={config.id}
                  appId={config.id}
                  label={config.title}
                  icon={config.icon}
                  variant={iconVariant}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Windows Container - sits above icons but below taskbar */}
      <div
        className={`
          absolute inset-0 z-[100] pointer-events-none
          ${showTaskbar ? 'bottom-12' : ''}
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

      {/* Taskbar and other children */}
      {children}
    </div>
  );
}

export default Desktop;
