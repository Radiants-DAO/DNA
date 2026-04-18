'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Button } from '../Button/Button';
import { ScrollArea } from '../ScrollArea/ScrollArea';

import { Tabs } from '../Tabs/Tabs';
import { Tooltip } from '../Tooltip/Tooltip';

type WindowDimension = number | string;
type AppWindowPresentation = 'window' | 'fullscreen' | 'mobile';
type AppWindowShellStyle = React.CSSProperties & {
  '--app-content-max-height': string;
};

export interface AppWindowPosition {
  x: number;
  y: number;
}

export interface AppWindowSize {
  width: WindowDimension;
  height: WindowDimension;
}

interface AppWindowActionButton {
  text: string;
  iconName?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
}

export interface AppWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  position?: AppWindowPosition;
  defaultPosition?: AppWindowPosition;
  size?: AppWindowSize;
  defaultSize?: AppWindowSize;
  resizable?: boolean;
  className?: string;
  icon?: React.ReactNode;
  contentPadding?: boolean;
  showWidgetButton?: boolean;
  widgetActive?: boolean;
  showCopyButton?: boolean;
  showCloseButton?: boolean;
  showFullscreenButton?: boolean;
  showActionButton?: boolean;
  actionButton?: AppWindowActionButton;
  focused?: boolean;
  zIndex?: number;
  presentation?: AppWindowPresentation;
  minSize?: { width: number; height: number };
  viewportBottomInset?: number;
  viewportMargin?: number;
  autoCenter?: boolean;
  cascadeIndex?: number;
  onWidget?: () => void;
  onClose?: () => void;
  onFocus?: () => void;
  onFullscreen?: () => void;
  onPositionChange?: (position: AppWindowPosition) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
}

export interface AppWindowBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  bgClassName?: string;
  noScroll?: boolean;
}

// --- Compound Children Types ---

export interface AppWindowNavProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

export interface AppWindowNavItemProps {
  value: string;
  icon?: React.ReactNode;
  /** Accessible label — required when children is not a plain string (e.g., icon-only tabs). */
  label?: string;
  children: React.ReactNode;
}

export interface AppWindowToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export interface AppWindowContentProps {
  children: React.ReactNode;
  className?: string;
  layout?: ContentLayout;
}

export type ContentLayout = 'single' | 'split' | 'sidebar' | 'three' | 'bleed';

export interface AppWindowIslandProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bgClassName?: string;
  noScroll?: boolean;
  /** Corner style. 'standard' = CSS rounded + border (default). 'pixel' = pixel-corner mask + border (no CSS border). 'none' = no corners or border. */
  corners?: 'standard' | 'pixel' | 'none';
  width?: string;
  className?: string;
}

export interface AppWindowBannerProps {
  children: React.ReactNode;
  className?: string;
}

const DEFAULT_MIN_SIZE = { width: 300, height: 200 };
const DEFAULT_BOTTOM_INSET = 48;
const DEFAULT_VIEWPORT_MARGIN = 8;
const TITLE_BAR_HEIGHT = 40;
const CHROME_PADDING = 16;
const DEFAULT_CASCADE_OFFSET = 30;

const PADDING_MAP: Record<NonNullable<AppWindowBodyProps['padding']>, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

// --- AppWindow context for compound children (state-registration) ---

interface AppWindowChromeContext {
  setNav: (content: React.ReactNode) => void;
  setToolbar: (content: { children: React.ReactNode; className: string } | null) => void;
  contentPadding: boolean;
}

const AppWindowChromeCtx = React.createContext<AppWindowChromeContext | null>(null);
const AppWindowContentDepthCtx = React.createContext(0);

function getMaxWindowSize(viewportBottomInset: number, viewportMargin: number): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1200, height: 800 };
  }

  return {
    width: Math.floor(window.innerWidth - viewportMargin * 2),
    height: Math.floor(window.innerHeight - viewportBottomInset),
  };
}

function dimensionToPx(value: WindowDimension | undefined): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (trimmed.endsWith('px')) {
    return Number.parseFloat(trimmed);
  }
  if (trimmed.endsWith('rem')) {
    const remValue = Number.parseFloat(trimmed);
    if (Number.isNaN(remValue) || typeof window === 'undefined') return undefined;
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
    return remValue * rootFontSize;
  }

  return undefined;
}

function getMaxContentHeight(viewportBottomInset: number): number {
  const maxWindow = getMaxWindowSize(viewportBottomInset, DEFAULT_VIEWPORT_MARGIN);
  return maxWindow.height - TITLE_BAR_HEIGHT - CHROME_PADDING;
}

function AppWindowTitleBar({
  id,
  title,
  icon: _icon,
  showCopyButton = true,
  showCloseButton = true,
  showFullscreenButton = true,
  showWidgetButton = false,
  showActionButton = false,
  actionButton,
  widgetActive = false,
  presentation,
  navContent,
  onClose,
  onFullscreen,
  onWidget,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  showCopyButton?: boolean;
  showCloseButton?: boolean;
  showFullscreenButton?: boolean;
  showWidgetButton?: boolean;
  showActionButton?: boolean;
  actionButton?: AppWindowActionButton;
  widgetActive?: boolean;
  presentation: AppWindowPresentation;
  navContent?: React.ReactNode;
  onClose?: () => void;
  onFullscreen?: () => void;
  onWidget?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${id}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      return;
    }
  }, [id]);

  return (
    <div
      className="relative"
      data-aw="titlebar"
      data-draggable={presentation === 'window' ? 'true' : 'false'}
      data-drag-handle={presentation === 'window' ? '' : undefined}
      style={presentation === 'window' ? { touchAction: 'none' } : undefined}
    >
      <div className="flex items-center gap-1 text-head pl-1.5">
        {showCloseButton && onClose ? (
          <Tooltip content="Close">
            <Button
              tone="danger"
              size="sm"
              rounded="sm"
              iconOnly
              icon="close"
              onClick={onClose}
              aria-label={`Close ${title}`}
            />
          </Tooltip>
        ) : null}

        {showFullscreenButton && onFullscreen ? (
          <Tooltip content={presentation === 'fullscreen' ? 'Exit fullscreen' : 'Enter fullscreen'}>
            <Button
              tone="accent"
              size="sm"
              rounded="sm"
              iconOnly
              icon={presentation === 'fullscreen' ? 'collapse' : 'expand'}
              onClick={onFullscreen}
              aria-label={`${presentation === 'fullscreen' ? 'Exit' : 'Enter'} fullscreen ${title}`}
            />
          </Tooltip>
        ) : null}

        {showCopyButton ? (
          <Tooltip content="Copy link">
            <Button
              tone="success"
              size="sm"
              rounded="sm"
              iconOnly
              icon={copied ? 'copied-to-clipboard' : 'copy-to-clipboard'}
              onClick={handleCopyLink}
              aria-label={`Copy link to ${title}`}
            />
          </Tooltip>
        ) : null}

        {showWidgetButton && onWidget ? (
          <Tooltip content={widgetActive ? 'Exit widget mode' : 'Widget mode'}>
            <Button
              size="sm"
              iconOnly
              icon="picture-in-picture"
              onClick={onWidget}
              aria-label={`${widgetActive ? 'Exit' : 'Enter'} widget mode for ${title}`}
            />
          </Tooltip>
        ) : null}

        {showActionButton && actionButton ? (
          actionButton.href ? (
            <Button
              mode="pattern"
              size="sm"
              icon={actionButton.iconName ?? undefined}
              className="shrink-0"
              href={actionButton.href}
              target={actionButton.target}
              rel={actionButton.target === '_blank' ? 'noopener noreferrer' : undefined}
              onClick={actionButton.onClick}
            >
              {actionButton.text}
            </Button>
          ) : (
            <Button
              mode="pattern"
              size="sm"
              icon={actionButton.iconName ?? undefined}
              className="shrink-0"
              onClick={actionButton.onClick}
            >
              {actionButton.text}
            </Button>
          )
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        {/* Registered nav content (positioned by Tabs align prop), or portal slot */}
        {navContent || <div id={`window-titlebar-slot-${id}`} className="contents" />}
      </div>

      <span
        id={`window-title-${id}`}
        className="shrink-0 font-joystix text-xs uppercase tracking-tight text-head whitespace-nowrap px-2 py-0.5"
      >
        {title}
      </span>
    </div>
  );
}

// --- Compound Sub-Components ---

function AppWindowNavItem({ value: _value, icon: _icon, label: _label, children: _children }: AppWindowNavItemProps) {
  // Data carrier — rendered by AppWindowNav, not standalone
  return null;
}
AppWindowNavItem.displayName = 'AppWindow.Nav.Item';

function AppWindowNav({ value, onChange, children }: AppWindowNavProps) {
  const chrome = React.useContext(AppWindowChromeCtx);

  const items: AppWindowNavItemProps[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === AppWindowNavItem) {
      items.push(child.props as AppWindowNavItemProps);
    }
  });

  const navContent = useMemo(
    () => (
      <Tabs value={value} onValueChange={onChange} mode="chrome" align="center">
        <Tabs.List>
          {items.map((item) => (
            <Tabs.Trigger key={item.value} value={item.value} icon={item.icon}>
              {item.children}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>
    ),
    [items, onChange, value],
  );

  // Register nav content with AppWindow via context; render nothing here
  useEffect(() => {
    chrome?.setNav(navContent);
    return () => chrome?.setNav(null);
  }, [chrome, navContent]);

  // Render inline if no AppWindow context (e.g., tests without AppWindow wrapper)
  if (!chrome) return navContent;
  return null;
}
AppWindowNav.displayName = 'AppWindow.Nav';
AppWindowNav.Item = AppWindowNavItem;

function AppWindowToolbar({ children, className = '' }: AppWindowToolbarProps) {
  const chrome = React.useContext(AppWindowChromeCtx);
  const toolbarContent = useMemo(() => ({ children, className }), [children, className]);

  // Register toolbar content with AppWindow via context; render nothing here
  useEffect(() => {
    chrome?.setToolbar(toolbarContent);
    return () => chrome?.setToolbar(null);
  }, [chrome, toolbarContent]);

  // Render inline if no AppWindow context (e.g., tests without AppWindow wrapper)
  if (!chrome) {
    return (
      <div
        className={className.trim()}
        data-aw="toolbar"
        data-window-toolbar=""
      >
        {children}
      </div>
    );
  }
  return null;
}
AppWindowToolbar.displayName = 'AppWindow.Toolbar';

function AppWindowBanner({ children, className = '' }: AppWindowBannerProps) {
  return (
    <div className={className.trim()} data-aw="banner">
      {children}
    </div>
  );
}
AppWindowBanner.displayName = 'AppWindow.Banner';

function AppWindowIsland({
  children,
  padding = 'lg',
  bgClassName = 'bg-card',
  noScroll = false,
  corners = 'standard',
  width,
  className = '',
}: AppWindowIslandProps) {
  const sizeClass = width ? `shrink-0 min-h-0 ${width}` : 'flex-1 min-w-0 min-h-0';
  const paddingClass = PADDING_MAP[padding];
  const cornerClass = corners === 'none' ? '' : 'border border-line rounded';

  if (corners === 'pixel') {
    const inner = noScroll
      ? <div className={`h-full ${paddingClass}`.trim()}>{children}</div>
      : (
        <ScrollArea.Root
          className="h-full"
          style={{ maxHeight: 'var(--app-content-max-height, none)' } as React.CSSProperties}
        >
          {paddingClass ? <div className={paddingClass}>{children}</div> : children}
        </ScrollArea.Root>
      );

    return (
      <div className={`pixel-rounded-sm ${bgClassName} ${sizeClass} min-h-0 ${className}`.trim()}>
        {inner}
      </div>
    );
  }

  if (noScroll) {
    return (
      <div
        className={`${sizeClass} ${cornerClass} ${bgClassName} ${className}`.trim()}
        data-aw="island"
      >
        <div
          className={paddingClass}
          data-aw="island-pad"
          data-fill="true"
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} ${cornerClass} ${bgClassName} ${className}`.trim()}
      data-aw="island"
    >
      <ScrollArea.Root className="" data-aw="island-scroll">
        <div className={paddingClass} data-aw="island-pad">
          {children}
        </div>
      </ScrollArea.Root>
    </div>
  );
}
AppWindowIsland.displayName = 'AppWindow.Island';

function AppWindowContent({ children, layout = 'single', className = '' }: AppWindowContentProps) {
  const chrome = React.useContext(AppWindowChromeCtx);
  const contentDepth = React.useContext(AppWindowContentDepthCtx);

  useEffect(() => {
    if (contentDepth > 0 && process.env.NODE_ENV !== 'production') {
      console.warn('AppWindow.Content should not be nested inside another AppWindow.Content. Use AppWindow.Island or a plain layout wrapper instead.');
    }
  }, [contentDepth]);

  // Separate Banner children from Islands/other content
  const banners: React.ReactNode[] = [];
  const rest: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === AppWindowBanner) {
      banners.push(child);
    } else {
      rest.push(child);
    }
  });

  return (
    <AppWindowContentDepthCtx.Provider value={contentDepth + 1}>
      <div
        className={className.trim()}
        data-aw="stage"
        data-layout={layout}
        data-content-padding={chrome?.contentPadding ? 'true' : 'false'}
      >
        {banners}
        <div data-aw="layout" data-layout={layout}>
          {rest}
        </div>
      </div>
    </AppWindowContentDepthCtx.Provider>
  );
}
AppWindowContent.displayName = 'AppWindow.Content';

function AppWindow({
  id,
  title,
  children,
  open = true,
  position,
  defaultPosition = { x: 100, y: 50 },
  size,
  defaultSize,
  resizable = true,
  className = '',
  icon,
  contentPadding = true,
  showWidgetButton = false,
  widgetActive = false,
  showCopyButton = true,
  showCloseButton = true,
  showFullscreenButton = true,
  showActionButton = false,
  actionButton,
  focused = false,
  zIndex = 100,
  presentation = 'window',
  minSize = DEFAULT_MIN_SIZE,
  viewportBottomInset = DEFAULT_BOTTOM_INSET,
  viewportMargin = DEFAULT_VIEWPORT_MARGIN,
  autoCenter = false,
  cascadeIndex = 0,
  onWidget,
  onClose,
  onFocus,
  onFullscreen,
  onPositionChange,
  onSizeChange,
}: AppWindowProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const lastCenteredSizeRef = useRef<{ width: number; height: number } | null>(null);

  // --- Context for compound children (state-registration) ---
  const [navContent, setNavContent] = useState<React.ReactNode>(null);
  const [toolbarContent, setToolbarContent] = useState<{ children: React.ReactNode; className: string } | null>(null);

  const chromeCtx = useMemo<AppWindowChromeContext>(
    () => ({ setNav: setNavContent, setToolbar: setToolbarContent, contentPadding }),
    [contentPadding],
  );

  // --- Toolbar height measurement via ref callback ---
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const toolbarObserverRef = useRef<ResizeObserver | null>(null);

  const toolbarRef = useCallback((node: HTMLDivElement | null) => {
    if (toolbarObserverRef.current) {
      toolbarObserverRef.current.disconnect();
      toolbarObserverRef.current = null;
    }
    if (!node) {
      setToolbarHeight(0);
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setToolbarHeight(entry.contentRect.height + /* border-b */ 1);
    });
    observer.observe(node);
    toolbarObserverRef.current = observer;
  }, []);
  const [internalPosition, setInternalPosition] = useState(defaultPosition);
  const [internalSize, setInternalSize] = useState<AppWindowSize | undefined>(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    positionX: 0,
    positionY: 0,
  });

  const effectivePosition = position ?? internalPosition;
  const effectiveSize = size ?? internalSize;
  const isPositionControlled = position !== undefined;
  const isSizeControlled = size !== undefined;
  const effectiveMax = useMemo(
    () => getMaxWindowSize(viewportBottomInset, viewportMargin),
    [viewportBottomInset, viewportMargin],
  );

  const commitPosition = useCallback(
    (next: AppWindowPosition) => {
      if (!isPositionControlled) {
        setInternalPosition(next);
      }
      onPositionChange?.(next);
    },
    [isPositionControlled, onPositionChange],
  );

  const commitSize = useCallback(
    (next: { width: number; height: number }) => {
      if (!isSizeControlled) {
        setInternalSize(next);
      }
      onSizeChange?.(next);
    },
    [isSizeControlled, onSizeChange],
  );

  useEffect(() => {
    if (open) return;
    setHasUserInteracted(false);
    setInternalPosition(defaultPosition);
    setInternalSize(defaultSize);
    lastCenteredSizeRef.current = null;
  }, [defaultPosition, defaultSize, open]);

  const handleFocus = useCallback(() => {
    if (focused) return;
    onFocus?.();
  }, [focused, onFocus]);

  const handleDragStop = useCallback(
    (_event: DraggableEvent, data: DraggableData) => {
      setHasUserInteracted(true);
      commitPosition({ x: data.x, y: data.y });
    },
    [commitPosition],
  );

  const handleResizeStart = useCallback(
    (event: React.PointerEvent, direction: string) => {
      event.preventDefault();
      event.stopPropagation();

      if (!nodeRef.current) return;

      const rect = nodeRef.current.getBoundingClientRect();

      setIsResizing(true);
      setHasUserInteracted(true);
      setResizeDirection(direction);
      setResizeStart({
        x: event.clientX,
        y: event.clientY,
        width: rect.width,
        height: rect.height,
        positionX: effectivePosition.x,
        positionY: effectivePosition.y,
      });

      handleFocus();
    },
    [effectivePosition.x, effectivePosition.y, handleFocus],
  );

  useEffect(() => {
    if (!isResizing || presentation !== 'window') return;

    const handlePointerMove = (event: PointerEvent) => {
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.positionX;
      let newY = resizeStart.positionY;

      const deltaX = event.clientX - resizeStart.x;
      const deltaY = event.clientY - resizeStart.y;

      if (resizeDirection.includes('e')) {
        newWidth = Math.min(Math.max(resizeStart.width + deltaX, minSize.width), effectiveMax.width);
      }
      if (resizeDirection.includes('w')) {
        newWidth = Math.min(Math.max(resizeStart.width - deltaX, minSize.width), effectiveMax.width);
        newX = resizeStart.positionX + (resizeStart.width - newWidth);
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.min(Math.max(resizeStart.height + deltaY, minSize.height), effectiveMax.height);
      }
      if (resizeDirection.includes('n')) {
        newHeight = Math.min(Math.max(resizeStart.height - deltaY, minSize.height), effectiveMax.height);
        newY = resizeStart.positionY + (resizeStart.height - newHeight);
      }

      commitSize({ width: Math.round(newWidth), height: Math.round(newHeight) });

      if (resizeDirection.includes('w') || resizeDirection.includes('n')) {
        commitPosition({ x: Math.round(newX), y: Math.round(newY) });
      }
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    commitPosition,
    commitSize,
    effectiveMax.height,
    effectiveMax.width,
    isResizing,
    minSize.height,
    minSize.width,
    presentation,
    resizeDirection,
    resizeStart,
  ]);

  useEffect(() => {
    if (!autoCenter || presentation !== 'window' || hasUserInteracted || effectiveSize || !nodeRef.current) {
      return;
    }

    const centerWindow = (width: number, height: number) => {
      if (typeof window === 'undefined') return;

      const clampedWidth = Math.min(Math.max(width, minSize.width), effectiveMax.width);
      const clampedHeight = Math.min(Math.max(height, minSize.height), effectiveMax.height);
      const desktopHeight = window.innerHeight - viewportBottomInset;

      let x = (window.innerWidth - clampedWidth) / 2 + cascadeIndex * DEFAULT_CASCADE_OFFSET;
      let y = (desktopHeight - clampedHeight) / 2 + cascadeIndex * DEFAULT_CASCADE_OFFSET;

      x = Math.max(0, Math.min(x, window.innerWidth - clampedWidth));
      y = Math.max(0, Math.min(y, desktopHeight - clampedHeight));

      commitPosition({ x: Math.round(x), y: Math.round(y) });
      lastCenteredSizeRef.current = { width: clampedWidth, height: clampedHeight };
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const lastSize = lastCenteredSizeRef.current;
      if (
        lastSize &&
        Math.abs(width - lastSize.width) < 10 &&
        Math.abs(height - lastSize.height) < 10
      ) {
        return;
      }

      centerWindow(width, height);
    });

    observer.observe(nodeRef.current);
    const rect = nodeRef.current.getBoundingClientRect();
    centerWindow(rect.width, rect.height);

    return () => observer.disconnect();
  }, [
    autoCenter,
    cascadeIndex,
    commitPosition,
    effectiveMax.height,
    effectiveMax.width,
    effectiveSize,
    hasUserInteracted,
    minSize.height,
    minSize.width,
    presentation,
    viewportBottomInset,
  ]);

  if (!open || widgetActive) {
    return null;
  }

  const actualWindowHeight = dimensionToPx(effectiveSize?.height);
  const maxContentHeight = actualWindowHeight
    ? actualWindowHeight - TITLE_BAR_HEIGHT - toolbarHeight - CHROME_PADDING
    : getMaxContentHeight(viewportBottomInset) - toolbarHeight;
  const hasExplicitWidth = effectiveSize?.width !== undefined;
  const isWindowPresentation = presentation === 'window';
  const isMobilePresentation = presentation === 'mobile';
  const shellStyle: AppWindowShellStyle = {
    zIndex,
    background: isMobilePresentation
      ? 'var(--color-page)'
      : 'linear-gradient(0deg, var(--color-window-chrome-from) 0%, var(--color-window-chrome-to) 100%)',
    '--app-content-max-height': `${maxContentHeight}px`,
  };

  if (isWindowPresentation) {
    shellStyle.width = effectiveSize?.width ?? 'fit-content';
    shellStyle.height = effectiveSize?.height ?? 'fit-content';
    shellStyle.minWidth = minSize.width;
    shellStyle.minHeight = minSize.height;
    shellStyle.maxWidth = effectiveMax.width;
    shellStyle.maxHeight = effectiveMax.height;
    shellStyle.boxShadow = 'var(--shadow-floating)';
  }

  const shell = (
    <div
      ref={nodeRef}
      role="dialog"
      aria-labelledby={`window-title-${id}`}
      className={`${isWindowPresentation ? 'pixel-rounded-md ' : ''}${hasExplicitWidth ? '@container ' : ''}${className}`.trim()}
      style={shellStyle}
      onPointerDown={handleFocus}
      onClick={handleFocus}
      tabIndex={-1}
      data-app-window={id}
      data-aw="window"
      data-presentation={presentation}
      data-fullscreen={presentation === 'fullscreen' ? 'true' : undefined}
      data-resizable={isWindowPresentation && resizable ? 'true' : undefined}
      data-focused={focused || undefined}
    >
      {!focused && isWindowPresentation ? (
        <div
          className="absolute inset-0 z-20 pointer-events-none rdna-pat rdna-pat--diagonal-dots"
          style={{ ['--pat-color' as string]: 'var(--color-ink)' }}
        />
      ) : null}

      <AppWindowTitleBar
        id={id}
        title={title}
        icon={icon}
        showCopyButton={isMobilePresentation ? false : showCopyButton}
        showCloseButton={showCloseButton}
        showFullscreenButton={isMobilePresentation ? false : showFullscreenButton}
        showWidgetButton={isMobilePresentation ? false : showWidgetButton}
        showActionButton={isMobilePresentation ? false : showActionButton}
        actionButton={actionButton}
        widgetActive={widgetActive}
        presentation={presentation}
        navContent={navContent}
        onClose={onClose}
        onFullscreen={onFullscreen}
        onWidget={onWidget}
      />

      {toolbarContent ? (
        <div
          ref={toolbarRef}
          className={toolbarContent.className.trim()}
          data-aw="toolbar"
          data-window-toolbar=""
        >
          {toolbarContent.children}
        </div>
      ) : null}

      <AppWindowChromeCtx.Provider value={chromeCtx}>
        {children}
      </AppWindowChromeCtx.Provider>

      {isWindowPresentation && resizable ? (
        <>
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-10"
            data-resize-handle="nw"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => handleResizeStart(event, 'nw')}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-10"
            data-resize-handle="ne"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => handleResizeStart(event, 'ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-10"
            data-resize-handle="sw"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => handleResizeStart(event, 'sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-10"
            data-resize-handle="se"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => handleResizeStart(event, 'se')}
          />
          <div
            className="absolute top-0 left-3 right-3 h-2 cursor-ns-resize z-10"
            data-resize-handle="n"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => handleResizeStart(event, 'n')}
          />
          <div
            className="absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize z-10"
            data-resize-handle="s"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => handleResizeStart(event, 's')}
          />
          <div
            className="absolute left-0 top-3 bottom-3 w-2 cursor-ew-resize z-10"
            data-resize-handle="w"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => handleResizeStart(event, 'w')}
          />
          <div
            className="absolute right-0 top-3 bottom-3 w-2 cursor-ew-resize z-10"
            data-resize-handle="e"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => handleResizeStart(event, 'e')}
          />
        </>
      ) : null}
    </div>
  );

  if (!isWindowPresentation) {
    return shell;
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      handle="[data-drag-handle]"
      position={effectivePosition}
      onStop={handleDragStop}
      bounds="parent"
      disabled={isResizing}
    >
      {shell}
    </Draggable>
  );
}

// Compound export — attaches sub-components as static properties
const AppWindowCompound = Object.assign(AppWindow, {
  Nav: Object.assign(AppWindowNav, { Item: AppWindowNavItem }),
  Toolbar: AppWindowToolbar,
  Content: AppWindowContent,
  Island: AppWindowIsland,
  Banner: AppWindowBanner,
});

export { AppWindowCompound as AppWindow };
export default AppWindowCompound;
