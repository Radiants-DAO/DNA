'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { ScrollArea } from '../ScrollArea/ScrollArea';
import { Separator } from '../Separator/Separator';
import { Tooltip } from '../Tooltip/Tooltip';

type WindowDimension = number | string;
type AppWindowPresentation = 'window' | 'fullscreen' | 'mobile';

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

export interface AppWindowSplitViewProps {
  children: React.ReactNode;
  className?: string;
}

export interface AppWindowPaneProps extends AppWindowBodyProps {}

// --- Compound Children Types ---

export interface AppWindowNavProps {
  value: string;
  onChange: (value: string) => void;
  layout?: 'capsule';
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

export type ContentLayout = 'single' | 'split' | 'sidebar' | 'bleed';

export interface AppWindowIslandProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bgClassName?: string;
  noScroll?: boolean;
  /** Corner style. 'standard' = CSS rounded + border (default). 'pixel' = pixel-rounded-sm clip-path (no border). 'none' = no corners or border. */
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
  setToolbar: (content: React.ReactNode) => void;
}

const AppWindowChromeCtx = React.createContext<AppWindowChromeContext | null>(null);

function renderWindowBodyShell({
  children,
  padding = 'lg',
  bordered = true,
  bgClassName = 'bg-card',
  noScroll = false,
}: AppWindowBodyProps) {
  const shellClasses = [
    'h-full',
    bordered ? 'border border-line rounded' : '',
    bgClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const paddingClass = PADDING_MAP[padding];

  if (noScroll) {
    return (
      <div
        className={[shellClasses, paddingClass].filter(Boolean).join(' ')}
        style={{ maxHeight: 'var(--app-content-max-height, none)' }}
      >
        {children}
      </div>
    );
  }

  return (
    <ScrollArea.Root
      className={shellClasses}
      style={{ maxHeight: 'var(--app-content-max-height, none)' } as React.CSSProperties}
    >
      <ScrollArea.Viewport>
        {paddingClass ? <div className={paddingClass}>{children}</div> : children}
      </ScrollArea.Viewport>
    </ScrollArea.Root>
  );
}

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
      className="flex items-center gap-3 pl-1 pr-2 py-1.5 h-fit cursor-move select-none"
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

      <span
        id={`window-title-${id}`}
        className="absolute left-1/2 -translate-x-1/2 font-joystix text-xs uppercase tracking-tight text-head whitespace-nowrap pointer-events-none bg-page px-2 py-0.5"
      >
        {title}
      </span>

      <div className="flex-1">
        <Separator />
      </div>

      {/* Registered nav content, or portal slot for legacy apps */}
      {navContent || <div id={`window-titlebar-slot-${id}`} className="contents" />}
    </div>
  );
}

/**
 * @deprecated Use `<AppWindow.Content><AppWindow.Island>` instead.
 */
function AppWindowBody({
  children,
  className = '',
  padding = 'lg',
  bordered = true,
  bgClassName = 'bg-card',
  noScroll = false,
}: AppWindowBodyProps) {
  return (
    <div className={`flex-1 min-h-0 mx-2 ${className}`.trim()}>
      {renderWindowBodyShell({
        children,
        padding,
        bordered,
        bgClassName,
        noScroll,
      })}
    </div>
  );
}

/**
 * @deprecated Use `<AppWindow.Content layout="split">` with two `<AppWindow.Island>` children instead.
 */
function AppWindowSplitView({ children, className = '' }: AppWindowSplitViewProps) {
  return (
    <div
      className={`flex flex-1 min-h-0 gap-1 px-2 pb-2 ${className}`.trim()}
      data-window-layout="split"
    >
      {children}
    </div>
  );
}

/**
 * @deprecated Use `<AppWindow.Island>` inside `<AppWindow.Content layout="split">` instead.
 */
function AppWindowPane({
  children,
  className = '',
  padding = 'lg',
  bordered = true,
  bgClassName = 'bg-card',
  noScroll = false,
}: AppWindowPaneProps) {
  return (
    <div className={`flex-1 min-w-0 min-h-0 ${className}`.trim()}>
      {renderWindowBodyShell({
        children,
        padding,
        bordered,
        bgClassName,
        noScroll,
      })}
    </div>
  );
}

// --- Compound Sub-Components ---

function AppWindowNavItem({ value: _value, icon: _icon, label: _label, children: _children }: AppWindowNavItemProps) {
  // Data carrier — rendered by AppWindowNav, not standalone
  return null;
}
AppWindowNavItem.displayName = 'AppWindow.Nav.Item';

function AppWindowNav({ value, onChange, layout: _layout = 'capsule', children }: AppWindowNavProps) {
  const chrome = React.useContext(AppWindowChromeCtx);

  const items: AppWindowNavItemProps[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === AppWindowNavItem) {
      items.push(child.props as AppWindowNavItemProps);
    }
  });

  const navContent = (
    <div role="tablist" className="flex items-end gap-0.5 -mb-2">
      {items.map((item) => {
        const isActive = value === item.value;
        const accessibleName = item.label ?? (typeof item.children === 'string' ? item.children : undefined);
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-label={accessibleName}
            onClick={() => onChange(item.value)}
            className={`relative flex items-center justify-center cursor-pointer select-none pixel-rounded-t-sm h-8 px-2 transition-all duration-300 ease-out focus-visible:outline-none ${
              isActive
                ? 'gap-1.5 bg-card z-10'
                : 'bg-accent hover:bg-cream group translate-y-1 hover:translate-y-0.5'
            }`}
          >
            {item.icon && (
              <span className="shrink-0 flex items-center justify-center size-4">
                {item.icon}
              </span>
            )}
            <span
              className={`font-mono text-xs uppercase tracking-tight leading-none whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
                isActive ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              {item.children}
            </span>
            {!isActive && (
              <span
                className="absolute bottom-0 group-hover:-bottom-0.5 left-0 right-0 h-2 transition-all duration-300 ease-out"
                style={{
                  backgroundImage: 'var(--pat-spray-grid)',
                  backgroundRepeat: 'repeat',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  // Register nav content with AppWindow via context; render nothing here
  useEffect(() => {
    chrome?.setNav(navContent);
    return () => chrome?.setNav(null);
  });

  // Render inline if no AppWindow context (e.g., tests without AppWindow wrapper)
  if (!chrome) return navContent;
  return null;
}
AppWindowNav.displayName = 'AppWindow.Nav';
AppWindowNav.Item = AppWindowNavItem;

function AppWindowToolbar({ children, className = '' }: AppWindowToolbarProps) {
  const chrome = React.useContext(AppWindowChromeCtx);

  const toolbarContent = (
    <div
      className={`shrink-0 px-3 py-2 border-b border-ink bg-card flex items-center gap-3 ${className}`.trim()}
      data-window-toolbar=""
    >
      {children}
    </div>
  );

  // Register toolbar content with AppWindow via context; render nothing here
  useEffect(() => {
    chrome?.setToolbar(toolbarContent);
    return () => chrome?.setToolbar(null);
  });

  // Render inline if no AppWindow context (e.g., tests without AppWindow wrapper)
  if (!chrome) return toolbarContent;
  return null;
}
AppWindowToolbar.displayName = 'AppWindow.Toolbar';

function AppWindowBanner({ children, className = '' }: AppWindowBannerProps) {
  return <div className={`shrink-0 ${className}`.trim()}>{children}</div>;
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
  const sizeClass = width ? `shrink-0 ${width}` : 'flex-1 min-w-0';
  const paddingClass = PADDING_MAP[padding];
  const cornerClass = corners === 'pixel' ? 'pixel-rounded-sm' : corners === 'none' ? '' : 'border border-line rounded';

  if (noScroll) {
    return (
      <div className={`${sizeClass} min-h-0 ${cornerClass} ${bgClassName} ${className}`.trim()}>
        <div className={`h-full ${paddingClass}`.trim()}>{children}</div>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} min-h-0 ${cornerClass} ${bgClassName} ${className}`.trim()}>
      <ScrollArea.Root
        className="h-full"
        style={{ maxHeight: 'var(--app-content-max-height, none)' } as React.CSSProperties}
      >
        <ScrollArea.Viewport className="h-full overflow-x-hidden">
          {paddingClass ? <div className={paddingClass}>{children}</div> : children}
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    </div>
  );
}
AppWindowIsland.displayName = 'AppWindow.Island';

function AppWindowContent({ children, layout = 'single', className = '' }: AppWindowContentProps) {
  if (layout === 'bleed') {
    return <div className={`h-full flex flex-col ${className}`.trim()}>{children}</div>;
  }

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

  const isRow = layout === 'split' || layout === 'sidebar';
  const layoutClass = isRow ? 'flex gap-1.5' : 'flex flex-col';

  return (
    <div className={`h-full flex flex-col px-1.5 pb-1.5 ${className}`.trim()}>
      {banners}
      <div className={`flex-1 min-h-0 ${layoutClass}`}>{rest}</div>
    </div>
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
  const [toolbarContent, setToolbarContent] = useState<React.ReactNode>(null);

  const chromeCtx = useMemo<AppWindowChromeContext>(
    () => ({ setNav: setNavContent, setToolbar: setToolbarContent }),
    [],
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
    onFocus?.();
  }, [onFocus]);

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

      onFocus?.();
    },
    [effectivePosition.x, effectivePosition.y, onFocus],
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

  if (presentation === 'mobile') {
    return (
      <div
        ref={nodeRef}
        role="dialog"
        aria-labelledby={`window-title-${id}`}
        className={`fixed inset-0 bg-page flex flex-col pointer-events-auto ${className}`.trim()}
        style={{ zIndex }}
        data-app-window={id}
      >
        <header
          className="flex items-center justify-between px-4 py-3 bg-page border-b flex-shrink-0"
          style={{ borderBottomColor: 'var(--color-rule)' }}
        >
          <span id={`window-title-${id}`} className="font-joystix text-sm text-main uppercase">
            {title}
          </span>
          {onClose ? (
            <Button
              type="button"
              quiet
              size="sm"
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center hover:bg-hover active:bg-active pixel-rounded-sm -mr-2"
              aria-label={`Close ${title}`}
            >
              <Icon name="close" size={16} className="text-main" />
            </Button>
          ) : null}
        </header>
        {toolbarContent && <div ref={toolbarRef}>{toolbarContent}</div>}
        <main className="flex-1 overflow-auto @container">
          <AppWindowChromeCtx.Provider value={chromeCtx}>
            {children}
          </AppWindowChromeCtx.Provider>
        </main>
      </div>
    );
  }

  if (presentation === 'fullscreen') {
    return (
      <div
        ref={nodeRef}
        role="dialog"
        aria-labelledby={`window-title-${id}`}
        className={`
          fixed inset-0 pointer-events-auto border border-line overflow-hidden flex flex-col p-0
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${className}
        `.trim()}
        style={{
          zIndex,
          background: 'linear-gradient(0deg, var(--color-window-chrome-from) 0%, var(--color-window-chrome-to) 100%)',
        }}
        onPointerDown={handleFocus}
        onClick={handleFocus}
        tabIndex={-1}
        data-app-window={id}
        data-fullscreen="true"
        data-focused={focused || undefined}
      >
        <AppWindowTitleBar
          id={id}
          title={title}
          icon={icon}
          showCopyButton={showCopyButton}
          showCloseButton={showCloseButton}
          showFullscreenButton={showFullscreenButton}
          showWidgetButton={showWidgetButton}
          showActionButton={showActionButton}
          actionButton={actionButton}
          widgetActive={widgetActive}
          presentation={presentation}
          navContent={navContent}
          onClose={onClose}
          onFullscreen={onFullscreen}
          onWidget={onWidget}
        />
        {toolbarContent && <div ref={toolbarRef}>{toolbarContent}</div>}
        <div className="flex-1 min-h-0 @container">
          <AppWindowChromeCtx.Provider value={chromeCtx}>
            {children}
          </AppWindowChromeCtx.Provider>
        </div>
      </div>
    );
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
      <div
        ref={nodeRef}
        role="dialog"
        aria-labelledby={`window-title-${id}`}
        className={`
          absolute pointer-events-auto pixel-rounded-md flex flex-col p-0
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${className}
        `.trim()}
        style={{
          position: 'absolute',
          width: effectiveSize?.width ?? 'fit-content',
          height: effectiveSize?.height ?? 'fit-content',
          minWidth: minSize.width,
          minHeight: minSize.height,
          maxWidth: effectiveMax.width,
          maxHeight: effectiveMax.height,
          zIndex,
          background: 'linear-gradient(0deg, var(--color-window-chrome-from) 0%, var(--color-window-chrome-to) 100%)',
          boxShadow: 'var(--shadow-floating)',
        }}
        onPointerDown={handleFocus}
        onClick={handleFocus}
        tabIndex={-1}
        data-app-window={id}
        data-resizable={resizable}
        data-focused={focused || undefined}
      >
        {!focused && (
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ backgroundImage: 'var(--pat-diagonal-dots)', backgroundRepeat: 'repeat' }}
          />
        )}

        <AppWindowTitleBar
          id={id}
          title={title}
          icon={icon}
          showCopyButton={showCopyButton}
          showCloseButton={showCloseButton}
          showFullscreenButton={showFullscreenButton}
          showWidgetButton={showWidgetButton}
          showActionButton={showActionButton}
          actionButton={actionButton}
          widgetActive={widgetActive}
          presentation={presentation}
          navContent={navContent}
          onClose={onClose}
          onFullscreen={onFullscreen}
          onWidget={onWidget}
        />

        {toolbarContent && <div ref={toolbarRef}>{toolbarContent}</div>}

        <div
          className={`flex-1 min-h-0${hasExplicitWidth ? ' @container' : ''}${contentPadding ? ' pb-2' : ''}`}
          style={{ '--app-content-max-height': `${maxContentHeight}px` } as React.CSSProperties}
        >
          <AppWindowChromeCtx.Provider value={chromeCtx}>
            {children}
          </AppWindowChromeCtx.Provider>
        </div>

        {resizable ? (
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
  // Legacy — deprecated, use Content + Island instead
  Body: AppWindowBody,
  SplitView: AppWindowSplitView,
  Pane: AppWindowPane,
});

// Named exports: compound AppWindow + individual sub-components for backward compat
export { AppWindowCompound as AppWindow, AppWindowBody, AppWindowSplitView, AppWindowPane };
export default AppWindowCompound;
