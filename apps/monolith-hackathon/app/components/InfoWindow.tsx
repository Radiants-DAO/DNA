'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { ORBITAL_ITEMS } from '../data/orbital-items';
import { CONTENT, renderContent, useSequentialReveal, ScrambleText, DiscordIcon, CloseIcon } from './panels/content-renderers';
import type { WindowContent } from './panels/content-renderers';

// Re-export for backward compatibility
export { CONTENT, renderContent, useSequentialReveal };
export type { WindowContent };

interface InfoWindowProps {
  activeId: string;
  onTabChange: (id: string) => void;
  onClose: () => void;
  initialTab?: string | null;
}

// ============================================================================
// Local Icons (only used by InfoWindow shell)
// ============================================================================

const pxStyle = (size: number): React.CSSProperties => ({ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, imageRendering: 'pixelated' as const });

function TwitterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path d="M14.5998 0.00976562H12.8017V1.80777H11.0036V3.60577V5.40377H9.20546H7.40734H5.60921V3.60577H3.81109V1.80777H2.01297V0.00976562H0.214844V1.80777V3.60577V5.40377H2.01297V7.20177H0.214844V8.99977H2.01297H3.81109V10.7978H2.01297V12.5958H3.81109H5.60921V14.3938H3.81109V16.1918H2.01297V14.3938H0.214844V16.1918H2.01297V17.9898H3.81109H5.60921H7.40734H9.20546H11.0036V16.1918H12.8017H14.5998V14.3938H16.398V12.5958H18.1961V10.7978V8.99977H19.9942V7.20177V5.40377V3.60577H21.7923V1.80777V0.00976562H19.9942V1.80777H18.1961V0.00976562H16.398H14.5998Z"/>
    </svg>
  );
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path d="M3,4H4V13H12V4H13V14H3V4ZM4,3H5V4H4V3ZM5,5H6V6H10V5H11V12H5V5ZM6,7V8H10V7H6ZM6,9V10H10V9H6ZM6,3H7V4H9V3H10V5H6V3ZM7,2H9V3H7V2ZM11,3H12V4H11V3Z"/>
    </svg>
  );
}

function CopiedIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path d="M2,3H3V13H2V3ZM3,2H5V3H3V2ZM3,13H12V14H3V13ZM4,5H11V6H5V11H7V12H4V5ZM5,1H10V2H9V3H10V4H5V3H6V2H5V1ZM6,8H7V9H6V8ZM7,9H8V10H7V9ZM8,10H9V11H8V10ZM9,9H10V10H9V9ZM10,2H12V3H10V2ZM10,8H11V9H10V8ZM10,11H11V12H10V11ZM11,7H12V8H11V7ZM12,3H13V5H12V3ZM12,6H13V7H12V6ZM12,8H13V13H12V8ZM13,5H14V6H13V5Z"/>
    </svg>
  );
}

// ============================================================================
// InfoWindow Component
// ============================================================================

export default function InfoWindow({ activeId, onTabChange, onClose, initialTab }: InfoWindowProps) {
  const data = CONTENT[activeId];
  const highlightRef = useRef<HTMLDivElement>(null);
  const prevIdRef = useRef(activeId);
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<string | null>(initialTab ?? null);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 1000);
  }, []);

  // Reset sub-tab when switching panels
  useEffect(() => {
    setActiveSubTab(null);
  }, [activeId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
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

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.t;
    touchStartRef.current = null;

    // Must be horizontal, fast enough, and long enough
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7 || dt > 400) return;

    const ids = ORBITAL_ITEMS.map(i => i.id);
    const idx = ids.indexOf(activeId);
    if (dx < 0 && idx < ids.length - 1) {
      onTabChange(ids[idx + 1]);
    } else if (dx > 0 && idx > 0) {
      onTabChange(ids[idx - 1]);
    }
  }, [activeId, onTabChange]);

  // Comet tail on tab switch
  useEffect(() => {
    if (prevIdRef.current !== activeId && highlightRef.current) {
      prevIdRef.current = activeId;
      highlightRef.current.classList.add('moving');
      const t = setTimeout(() => highlightRef.current?.classList.remove('moving'), 450);
      return () => clearTimeout(t);
    }
  }, [activeId]);

  const { revealed, advance } = useSequentialReveal();

  if (!data) return null;

  return (
    <div
      className={`door-info-overlay${isScrolling ? ' is-scrolling' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="taskbar_wrap">
        <div className="taskbar_title">
          <span className="taskbar_text">
            {revealed >= 1 ? <ScrambleText text={data.title} onDone={advance} /> : '\u00A0'}
          </span>
        </div>
        <div className="taskbar_lines-wrap">
          <div className="taskbar_line" />
          <div className="taskbar_line" />
        </div>
        <div className="taskbar_button-wrap">
          <button
            className="close_button"
            aria-label={copied ? 'Copied' : 'Copy link'}
            onClick={() => {
              const params = new URLSearchParams();
              params.set('panel', activeId);
              if (activeSubTab) params.set('tab', activeSubTab);
              const url = `${window.location.origin}${window.location.pathname}?${params}`;
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <CopiedIcon size={20} /> : <CopyIcon size={20} />}
            <span className="close-button-tooltip">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
          <button className="close_button" onClick={onClose} aria-label="Close">
            <CloseIcon size={20} />
            <span className="close-button-tooltip">Close</span>
          </button>
        </div>
      </div>

      <div className="app_contents" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onScroll={handleScroll}>
        {renderContent(data, revealed, advance, initialTab, activeSubTab, setActiveSubTab)}
      </div>

      {/* Persistent CTA footer */}
      <div className="taskbar_wrap taskbar_wrap--bottom">
        <a
          href="https://discord.gg/radiants"
          target="_blank"
          rel="noopener noreferrer"
          className="close_button close_button--amber"
          aria-label="Discord"
          style={{ textDecoration: 'none' }}
        >
          <DiscordIcon size={20} />
          <span className="close-button-tooltip">Discord</span>
        </a>
        <a
          href="https://x.com/RadiantsDAO"
          target="_blank"
          rel="noopener noreferrer"
          className="close_button close_button--amber"
          aria-label="Twitter"
          style={{ textDecoration: 'none' }}
        >
          <TwitterIcon size={20} />
          <span className="close-button-tooltip">Twitter</span>
        </a>
        <a
          href="https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE"
          target="_blank"
          rel="noopener noreferrer"
          className="modal-cta-button modal-cta-magma"
          title="Register"
          style={{ textDecoration: 'none' }}
        >
          Register
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 127 2" fill="currentColor" className="svg-line">
            <rect y="0.5" width="127" height="1" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 8 10" fill="currentColor" className="icon-arrow">
            <path d="M0 5H1.00535V5.75536H0V5ZM1.00535 4.24465H2.0107V5H1.00535V4.24465ZM1.00535 5H2.0107V5.75536H1.00535V5ZM1.00535 8.00536H2.0107V8.74465H1.00535V8.00536ZM1.00535 8.74465H2.0107V9.5H1.00535V8.74465ZM2.0107 3.50536H2.99465V4.24465H2.0107V3.50536ZM2.0107 4.24465H2.99465V5H2.0107V4.24465ZM2.0107 5H2.99465V5.75536H2.0107V5ZM2.0107 6.49465H2.99465V7.25H2.0107V6.49465ZM2.0107 7.25H2.99465V8.00536H2.0107V7.25ZM2.0107 8.00536H2.99465V8.74465H2.0107V8.00536ZM2.99465 2.75H4V3.50536H2.99465V2.75ZM2.99465 3.50536H4V4.24465H2.99465V3.50536ZM2.99465 4.24465H4V5H2.99465V4.24465ZM2.99465 5H4V5.75536H2.99465V5ZM2.99465 5.75536H4V6.49465H2.99465V5.75536ZM2.99465 6.49465H4V7.25H2.99465V6.49465ZM2.99465 7.25H4V8.00536H2.99465V7.25ZM4 1.99465H5.00535V2.75H4V1.99465ZM4 2.75H5.00535V3.50536H4V2.75ZM4 3.50536H5.00535V4.24465H4V3.50536ZM4 4.24465H5.00535V5H4V4.24465ZM4 5H5.00535V5.75536H4V5ZM4 5.75536H5.00535V6.49465H4V5.75536ZM4 6.49465H5.00535V7.25H4V6.49465ZM5.00535 1.25536H5.9893V1.99465H5.00535V1.25536ZM5.00535 1.99465H5.9893V2.75H5.00535V1.99465ZM5.00535 2.75H5.9893V3.50536H5.00535V2.75ZM5.00535 4.24465H5.9893V5H5.00535V4.24465ZM5.00535 5H5.9893V5.75536H5.00535V5ZM5.00535 5.75536H5.9893V6.49465H5.00535V5.75536ZM5.9893 0.5H6.99465V1.25536H5.9893V0.5ZM5.9893 1.25536H6.99465V1.99465H5.9893V1.25536ZM5.9893 4.24465H6.99465V5H5.9893V4.24465ZM5.9893 5H6.99465V5.75536H5.9893V5ZM6.99465 4.24465H8V5H6.99465V4.24465Z" />
          </svg>
        </a>
      </div>

      {/* Tab strip — vertical icon bar on right edge */}
      <div className="modal-tab-strip">
        <div
          ref={highlightRef}
          className="tab-highlight"
          style={{
            '--icon-glow': ORBITAL_ITEMS.find(i => i.id === activeId)?.glowColor,
            positionAnchor: `--tab-${ORBITAL_ITEMS.findIndex(i => i.id === activeId)}`,
          } as React.CSSProperties}
        />
        {ORBITAL_ITEMS.map((item, i) => (
          <button
            key={item.id}
            className={`modal-tab-icon${activeId === item.id ? ' modal-tab-icon--active' : ''}`}
            style={{ '--icon-glow': item.glowColor, anchorName: `--tab-${i}` } as React.CSSProperties}
            onClick={() => onTabChange(item.id)}
          >
            <img src={item.icon} alt={item.label} />
            <span className="modal-tab-tooltip">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
