'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useScramble } from 'use-scramble';

// ============================================================================
// Types
// ============================================================================

export interface InfoWindowTab {
  id: string;
  label: string;
  icon: string;
  glowColor: string;
}

export interface InfoWindowProps {
  /** Window title displayed in the taskbar */
  title: string;
  /** Currently active tab ID */
  activeId: string;
  /** Available navigation tabs */
  tabs: InfoWindowTab[];
  /** Callback when tab changes */
  onTabChange: (id: string) => void;
  /** Callback when window closes */
  onClose: () => void;
  /** Window content */
  children: React.ReactNode;
  /** Footer actions - left side */
  footerLeft?: React.ReactNode;
  /** Footer actions - right side (CTA) */
  footerRight?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// Shared Components
// ============================================================================

function ScrambleText({
  text,
  speed = 1,
  onDone,
}: {
  text: string;
  speed?: number;
  onDone?: () => void;
}) {
  const { ref } = useScramble({
    text,
    speed,
    tick: 1,
    step: 5,
    seed: 1,
    chance: 0.9,
    overdrive: false,
    overflow: false,
    range: [33, 125],
    playOnMount: true,
    onAnimationEnd: onDone,
  });

  return <span ref={ref as React.RefObject<HTMLSpanElement>} />;
}

// ============================================================================
// Icons
// ============================================================================

const pxStyle = (size: number): React.CSSProperties => ({
  display: 'inline-block',
  verticalAlign: 'middle',
  flexShrink: 0,
  imageRendering: 'pixelated' as const,
});

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={pxStyle(size)}
    >
      <path d="M3,4H5V5H6V6H7V7H9V6H10V5H11V4H13V6H12V7H11V8H10V10H11V11H12V12H13V14H11V13H10V12H9V11H7V12H6V13H5V14H3V12H4V11H5V10H6V8H5V7H4V6H3V4Z" />
    </svg>
  );
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={pxStyle(size)}
    >
      <path d="M3,4H4V13H12V4H13V14H3V4ZM4,3H5V4H4V3ZM5,5H6V6H10V5H11V12H5V5ZM6,7V8H10V7H6ZM6,9V10H10V9H6ZM6,3H7V4H9V3H10V5H6V3ZM7,2H9V3H7V2ZM11,3H12V4H11V3Z" />
    </svg>
  );
}

function CopiedIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={pxStyle(size)}
    >
      <path d="M2,3H3V13H2V3ZM3,2H5V3H3V2ZM3,13H12V14H3V13ZM4,5H11V6H5V11H7V12H4V5ZM5,1H10V2H9V3H10V4H5V3H6V2H5V1ZM6,8H7V9H6V8ZM7,9H8V10H7V9ZM8,10H9V11H8V10ZM9,9H10V10H9V9ZM10,2H12V3H10V2ZM10,8H11V9H10V8ZM10,11H11V12H10V11ZM11,7H12V8H11V7ZM12,3H13V5H12V3ZM12,6H13V7H12V6ZM12,8H13V13H12V8ZM13,5H14V6H13V5Z" />
    </svg>
  );
}

// ============================================================================
// InfoWindow Component
// ============================================================================

export function InfoWindow({
  title,
  activeId,
  tabs,
  onTabChange,
  onClose,
  children,
  footerLeft,
  footerRight,
  className = '',
}: InfoWindowProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const prevIdRef = useRef(activeId);
  const [copied, setCopied] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [titleRevealed, setTitleRevealed] = useState(false);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 1000);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Swipe between panels
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.t;
      touchStartRef.current = null;

      // Must be horizontal, fast enough, and long enough
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7 || dt > 400) return;

      const ids = tabs.map((t) => t.id);
      const idx = ids.indexOf(activeId);
      if (dx < 0 && idx < ids.length - 1) {
        onTabChange(ids[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        onTabChange(ids[idx - 1]);
      }
    },
    [activeId, onTabChange, tabs]
  );

  // Comet tail on tab switch
  useEffect(() => {
    if (prevIdRef.current !== activeId && highlightRef.current) {
      prevIdRef.current = activeId;
      highlightRef.current.classList.add('moving');
      const t = setTimeout(() => highlightRef.current?.classList.remove('moving'), 450);
      return () => clearTimeout(t);
    }
  }, [activeId]);

  const handleCopy = useCallback(() => {
    const params = new URLSearchParams();
    params.set('panel', activeId);
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [activeId]);

  return (
    <div
      className={`info-window${isScrolling ? ' is-scrolling' : ''} ${className}`.trim()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header taskbar */}
      <div className="info-window__taskbar">
        <div className="info-window__title">
          <span className="info-window__title-text">
            {!titleRevealed ? (
              <ScrambleText text={title} onDone={() => setTitleRevealed(true)} />
            ) : (
              title
            )}
          </span>
        </div>
        <div className="info-window__lines">
          <div className="info-window__line" />
          <div className="info-window__line" />
        </div>
        <div className="info-window__buttons">
          <button
            className="info-window__button"
            aria-label={copied ? 'Copied' : 'Copy link'}
            onClick={handleCopy}
          >
            {copied ? <CopiedIcon size={20} /> : <CopyIcon size={20} />}
            <span className="info-window__tooltip">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
          <button className="info-window__button" onClick={onClose} aria-label="Close">
            <CloseIcon size={20} />
            <span className="info-window__tooltip">Close</span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div
        className="info-window__content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
      >
        {children}
      </div>

      {/* Footer taskbar */}
      {(footerLeft || footerRight) && (
        <div className="info-window__taskbar info-window__taskbar--bottom">
          {footerLeft}
          {footerRight}
        </div>
      )}

      {/* Tab strip - vertical icon bar on right edge */}
      <div className="info-window__tab-strip">
        <div
          ref={highlightRef}
          className="info-window__tab-highlight"
          style={
            {
              '--icon-glow': tabs.find((t) => t.id === activeId)?.glowColor,
              positionAnchor: `--tab-${tabs.findIndex((t) => t.id === activeId)}`,
            } as React.CSSProperties
          }
        />
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`info-window__tab-icon${activeId === tab.id ? ' info-window__tab-icon--active' : ''}`}
            style={{ '--icon-glow': tab.glowColor, anchorName: `--tab-${i}` } as React.CSSProperties}
            onClick={() => onTabChange(tab.id)}
          >
            <img src={tab.icon} alt={tab.label} />
            <span className="info-window__tab-tooltip">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default InfoWindow;
