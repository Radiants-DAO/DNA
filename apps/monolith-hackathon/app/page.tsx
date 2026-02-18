'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { OrderedAlgorithm } from '@dithwather/core';

const ShaderBackground = dynamic(() => import('./components/ShaderBackground'), {
  ssr: false,
  loading: () => <div className="shader-background" style={{ opacity: 0 }} />,
});

const CRTShader = dynamic(() => import('./components/CRTShader'), {
  ssr: false,
});

const AnimatedSubtitle = dynamic(() => import('./components/AnimatedSubtitle'), {
  ssr: false,
  loading: () => <h4 className="monolith-sub">Hackathon</h4>,
});

const OrbitalNav = dynamic(() => import('./components/OrbitalNav'), { ssr: false });
const InfoWindow = dynamic(() => import('./components/InfoWindow'), { ssr: false });

import DitherWipe from './components/DitherWipe';
import { ORBITAL_ITEMS } from './data/orbital-items';

const AUDIO_URL = '/audio/Joice x Fevra.mp3';
const VALID_PANELS = new Set(['hackathon', 'rules', 'prizes', 'judges', 'toolbox', 'faq', 'calendar', 'legal']);

/* =========================================================================
   Wipe config type + defaults per target
   ========================================================================= */

interface WipeConfig {
  type: 'linear' | 'radial';
  angle: number;
  centerX: number;
  centerY: number;
  direction: 'in' | 'out';
  duration: number;
  delay: number;
  algorithm: OrderedAlgorithm;
  pixelScale: number;
  edge: number;
}

const WIPE_TARGETS = ['top', 'title', 'sub', 'icons', 'btn', 'door'] as const;
type WipeTarget = (typeof WIPE_TARGETS)[number];

const DEFAULTS: Record<WipeTarget, WipeConfig> = {
  top:   { type: 'linear', angle: 0,   centerX: 0.5, centerY: 0.5, direction: 'out', duration: 400, delay: 0,   algorithm: 'bayer4x4', pixelScale: 3, edge: 0.15 },
  title: { type: 'radial', angle: 135, centerX: 0.5, centerY: 0.5, direction: 'out', duration: 700, delay: 100, algorithm: 'bayer4x4', pixelScale: 3, edge: 0.2 },
  sub:   { type: 'radial', angle: 135, centerX: 0.5, centerY: 0.5, direction: 'out', duration: 400, delay: 50,  algorithm: 'bayer4x4', pixelScale: 3, edge: 0.2 },
  icons: { type: 'radial', angle: 135, centerX: 0.5, centerY: 0.5, direction: 'out', duration: 400, delay: 75,  algorithm: 'bayer4x4', pixelScale: 3, edge: 0.2 },
  btn:   { type: 'linear', angle: 180, centerX: 0.5, centerY: 0.5, direction: 'out', duration: 400, delay: 0,   algorithm: 'bayer4x4', pixelScale: 3, edge: 0.15 },
  door:  { type: 'linear', angle: 135, centerX: 0.5, centerY: 0.5, direction: 'out', duration: 800, delay: 300, algorithm: 'bayer4x4', pixelScale: 3, edge: 0.15 },
};

/* ========================================================================= */

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}

function HomePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialTab = searchParams.get('tab');

  // Per-target wipe configs
  const [cfgs, setCfgs] = useState<Record<WipeTarget, WipeConfig>>({ ...DEFAULTS });
  const setCfg = useCallback((target: WipeTarget, fn: (c: WipeConfig) => WipeConfig) => {
    setCfgs(prev => ({ ...prev, [target]: fn(prev[target]) }));
  }, []);

  // Controls panel state
  const [showControls, setShowControls] = useState(false);
  const [hideInfoWindow, setHideInfoWindow] = useState(false);

  // Wipe phases — one boolean per target + settled
  const [wipePhase, setWipePhase] = useState<Record<WipeTarget | 'settled', boolean>>(() => {
    const init: Record<string, boolean> = { settled: false };
    for (const t of WIPE_TARGETS) init[t] = false;
    return init as Record<WipeTarget | 'settled', boolean>;
  });
  const wipeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isWindowOpen = activeWindow !== null;

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Sync mute state from localStorage after hydration
  useEffect(() => {
    setIsMuted(localStorage.getItem('monolith-muted') === 'true');
  }, []);

  // Read initial panel from URL on mount
  useEffect(() => {
    const panel = searchParams.get('panel');
    if (panel && VALID_PANELS.has(panel)) {
      setActiveWindow(panel);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startWipeSequence = useCallback(() => {
    wipeTimers.current.forEach(clearTimeout);
    wipeTimers.current = [];
    for (const t of WIPE_TARGETS) {
      wipeTimers.current.push(
        setTimeout(() => setWipePhase(p => ({ ...p, [t]: true })), cfgs[t].delay),
      );
    }
  }, [cfgs]);

  // Wipe orchestration
  const prevOpen = useRef(false);
  useEffect(() => {
    if (isWindowOpen && !prevOpen.current) {
      setHasExpanded(true);
      startWipeSequence();
    } else if (!isWindowOpen && prevOpen.current) {
      wipeTimers.current.forEach(clearTimeout);
      wipeTimers.current = [];
      const reset: Record<string, boolean> = { settled: false };
      for (const t of WIPE_TARGETS) reset[t] = false;
      setWipePhase(reset as Record<WipeTarget | 'settled', boolean>);
    }
    prevOpen.current = isWindowOpen;
  }, [isWindowOpen, startWipeSequence]);

  const handleRestart = useCallback(() => {
    wipeTimers.current.forEach(clearTimeout);
    wipeTimers.current = [];
    const reset: Record<string, boolean> = { settled: false };
    for (const t of WIPE_TARGETS) reset[t] = false;
    setWipePhase(reset as Record<WipeTarget | 'settled', boolean>);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        startWipeSequence();
      });
    });
  }, [startWipeSequence]);

  const updateURL = useCallback((panel: string | null, tab?: string | null) => {
    const params = new URLSearchParams();
    if (panel) params.set('panel', panel);
    if (tab) params.set('tab', tab);
    const query = params.toString();
    router.replace(query ? `?${query}` : '/', { scroll: false });
  }, [router]);

  // Audio setup
  useEffect(() => {
    const audio = new Audio(AUDIO_URL);
    audio.volume = 0.5;
    audio.loop = true;
    const persisted = localStorage.getItem('monolith-muted') === 'true';
    audio.muted = persisted;
    audioRef.current = audio;

    const handleClick = () => audio.play();

    audio.play().catch(() => {
      document.addEventListener('click', handleClick, { once: true, passive: true });
    });

    return () => {
      audio.pause();
      audio.src = '';
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleOrbitalSelect = useCallback((id: string) => {
    setActiveWindow(id);
    updateURL(id);
  }, [updateURL]);

  const handleTabChange = useCallback((id: string) => {
    setActiveWindow(id);
    updateURL(id);
  }, [updateURL]);

  const handleWindowClose = useCallback(() => {
    setActiveWindow(null);
    setWindowPosition({ x: 0, y: 0 });
    updateURL(null);
  }, [updateURL]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isWindowOpen) handleWindowClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isWindowOpen, handleWindowClose]);

  const fadeRef = useRef<number | null>(null);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem('monolith-muted', String(next));

    if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);

    const DURATION = 300;
    const TARGET = 0.5;
    const start = performance.now();
    const from = audio.volume;

    if (next) {
      const fade = (now: number) => {
        const t = Math.min((now - start) / DURATION, 1);
        audio.volume = Math.max(0, from * (1 - t));
        if (t < 1) { fadeRef.current = requestAnimationFrame(fade); }
        else { audio.muted = true; audio.volume = TARGET; fadeRef.current = null; }
      };
      fadeRef.current = requestAnimationFrame(fade);
    } else {
      audio.volume = 0;
      audio.muted = false;
      const fade = (now: number) => {
        const t = Math.min((now - start) / DURATION, 1);
        audio.volume = Math.min(TARGET, TARGET * t);
        if (t < 1) { fadeRef.current = requestAnimationFrame(fade); }
        else { fadeRef.current = null; }
      };
      fadeRef.current = requestAnimationFrame(fade);
    }
  };

  /** Helper: build DitherWipe props from a target config + phase */
  const wp = (target: WipeTarget, extra?: { onComplete?: () => void }) => ({
    active: wipePhase[target],
    type: cfgs[target].type,
    angle: cfgs[target].angle,
    center: [cfgs[target].centerX, cfgs[target].centerY] as [number, number],
    direction: cfgs[target].direction,
    duration: cfgs[target].duration,
    algorithm: cfgs[target].algorithm,
    pixelScale: cfgs[target].pixelScale,
    edge: cfgs[target].edge,
    ...extra,
  });

  return (
    <>
      <ShaderBackground />
      <CRTShader />

      <main className={`section${isWindowOpen ? ' door-expanded' : ''}${wipePhase.settled ? ' door-settled' : ''}`}>
        <div className="background blur">
          <div className="portal-container">
            <img src="/assets/portal_neb2.avif" alt="" className="portal bg" />
          </div>
          <div className="portal-container">
            <img src="/assets/portal_neb1.avif" alt="" className="portal mid" />
          </div>
          <div className="portal-container door-container">
            <img src="/assets/monolith_20.avif" alt="" className="portal door" />
          </div>
        </div>

        <div className="background">
          <div className="portal-container">
            <img src="/assets/portal_neb2.avif" alt="" className="portal bg" />
          </div>
          <div className="portal-container">
            <img src="/assets/portal_neb1.avif" alt="" className="portal mid" />
          </div>
          <div className="portal-container door-container">
            <div className="door-wrapper">
              <DitherWipe
                {...wp('door', {
                  onComplete: () => setWipePhase(p => ({ ...p, settled: true })),
                })}
              >
                <img src="/assets/monolith_20.avif" alt="" className="portal door" />
              </DitherWipe>
              {/* Mobile: InfoWindow inside door-wrapper */}
              {isMobile && activeWindow && !hideInfoWindow && (
                <InfoWindow
                  activeId={activeWindow}
                  onTabChange={handleTabChange}
                  onClose={handleWindowClose}
                  initialTab={initialTab}
                />
              )}
            </div>
          </div>
        </div>

        {/* Desktop: draggable InfoWindow */}
        {!isMobile && activeWindow && !hideInfoWindow && (
          <div className="window-container">
            <InfoWindow
              activeId={activeWindow}
              onTabChange={handleTabChange}
              onClose={handleWindowClose}
              initialTab={initialTab}
              draggable
              zIndex={50}
              position={windowPosition}
              onDragStop={(pos) => setWindowPosition(pos)}
            />
          </div>
        )}

        {/* Backdrop */}
        {isWindowOpen && (
          <div
            className="door-backdrop"
            onClick={isMobile ? handleWindowClose : undefined}
            style={!isMobile ? { cursor: 'default' } : undefined}
          />
        )}

        <OrbitalNav
          items={ORBITAL_ITEMS}
          onSelect={handleOrbitalSelect}
          isWindowOpen={isWindowOpen}
          activeId={activeWindow}
        />

        <div className="monolith_text">
          <DitherWipe {...wp('top')}>
            <div className="flex-center hero-top">
              <img
                src="/assets/Seeker-Isolated-White.svg"
                alt="Seeker"
                className="seeker-logo"
              />
              <div className="text-block">
                <a
                  href="https://x.com/solanamobile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="textlink"
                >
                  Solana Mobile
                </a>{' '}
                &amp;{' '}
                <a
                  href="https://x.com/RadiantsDAO"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="textlink"
                >
                  Radiants
                </a>{' '}
                Present:
              </div>
            </div>
          </DitherWipe>

          <div className="hero-center" style={{ textAlign: 'center' }}>
            <DitherWipe {...wp('title')}>
              <h1 className="monolith-text">
                {'MONOLITH'.split('').map((letter, i) => (
                  <span
                    key={i}
                    className="monolith-letter"
                    style={{ '--delay': `${0.6 + i * 0.07}s` } as React.CSSProperties}
                  >
                    {letter}
                  </span>
                ))}
              </h1>
            </DitherWipe>
            <DitherWipe {...wp('sub')}>
              <AnimatedSubtitle />
            </DitherWipe>
            <DitherWipe {...wp('icons')}>
              <div className="hero-icons">
                <a href="https://discord.gg/radiants" target="_blank" rel="noopener noreferrer" className="hero-icon-btn" aria-label="Discord" title="Discord">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 26 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0 7.79963H2.59998V2.59982H5.19995V-1.33514e-05H10.4V2.59982H7.79993V5.19966H18.2001V2.59982H15.6V-1.33514e-05H20.8V2.59982H23.4V7.79963H26V20.7989H23.4V23.3989H15.6V20.7989H10.4V23.3989H2.59998V20.7989H0V7.79963ZM15.6 10.3995H18.2001V15.5993H15.6V10.3995ZM10.4 10.3995H7.79993V15.5993H10.4V10.3995Z" />
                  </svg>
                </a>
                <a href="https://x.com/RadiantsDAO" target="_blank" rel="noopener noreferrer" className="hero-icon-btn" aria-label="Twitter" title="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 22 18" fill="currentColor">
                    <path d="M14.5998 0.00976562H12.8017V1.80777H11.0036V3.60577V5.40377H9.20546H7.40734H5.60921V3.60577H3.81109V1.80777H2.01297V0.00976562H0.214844V1.80777V3.60577V5.40377H2.01297V7.20177H0.214844V8.99977H2.01297H3.81109V10.7978H2.01297V12.5958H3.81109H5.60921V14.3938H3.81109V16.1918H2.01297V14.3938H0.214844V16.1918H2.01297V17.9898H3.81109H5.60921H7.40734H9.20546H11.0036V16.1918H12.8017H14.5998V14.3938H16.398V12.5958H18.1961V10.7978V8.99977H19.9942V7.20177V5.40377V3.60577H21.7923V1.80777V0.00976562H19.9942V1.80777H18.1961V0.00976562H16.398H14.5998Z" />
                  </svg>
                </a>
                <button className="hero-icon-btn" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} title={isMuted ? 'Unmute' : 'Mute'}>
                  <img
                    src={isMuted ? '/icons/volume-mute.svg' : '/icons/volume-high.svg'}
                    alt={isMuted ? 'Muted' : 'Sound on'}
                    className="hero-icon-img"
                  />
                </button>
              </div>
            </DitherWipe>
          </div>

          <DitherWipe {...wp('btn')}>
            <button
              onClick={() => handleOrbitalSelect('hackathon')}
              className={`button_mono hero-bottom${hasExpanded ? ' was-expanded' : ''}`}
            >
              Get Started
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                viewBox="0 0 127 2"
                fill="currentColor"
                className="svg-line"
              >
                <rect y="0.5" width="127" height="1" fill="currentColor" />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="12"
                viewBox="0 0 8 10"
                fill="currentColor"
                className="icon-arrow"
              >
                <path d="M0 5H1.00535V5.75536H0V5ZM1.00535 4.24465H2.0107V5H1.00535V4.24465ZM1.00535 5H2.0107V5.75536H1.00535V5ZM1.00535 8.00536H2.0107V8.74465H1.00535V8.00536ZM1.00535 8.74465H2.0107V9.5H1.00535V8.74465ZM2.0107 3.50536H2.99465V4.24465H2.0107V3.50536ZM2.0107 4.24465H2.99465V5H2.0107V4.24465ZM2.0107 5H2.99465V5.75536H2.0107V5ZM2.0107 6.49465H2.99465V7.25H2.0107V6.49465ZM2.0107 7.25H2.99465V8.00536H2.0107V7.25ZM2.0107 8.00536H2.99465V8.74465H2.0107V8.00536ZM2.99465 2.75H4V3.50536H2.99465V2.75ZM2.99465 3.50536H4V4.24465H2.99465V3.50536ZM2.99465 4.24465H4V5H2.99465V4.24465ZM2.99465 5H4V5.75536H2.99465V5ZM2.99465 5.75536H4V6.49465H2.99465V5.75536ZM2.99465 6.49465H4V7.25H2.99465V6.49465ZM2.99465 7.25H4V8.00536H2.99465V7.25ZM4 1.99465H5.00535V2.75H4V1.99465ZM4 2.75H5.00535V3.50536H4V2.75ZM4 3.50536H5.00535V4.24465H4V3.50536ZM4 4.24465H5.00535V5H4V4.24465ZM4 5H5.00535V5.75536H4V5ZM4 5.75536H5.00535V6.49465H4V5.75536ZM4 6.49465H5.00535V7.25H4V6.49465ZM5.00535 1.25536H5.9893V1.99465H5.00535V1.25536ZM5.00535 1.99465H5.9893V2.75H5.00535V1.99465ZM5.00535 2.75H5.9893V3.50536H5.00535V2.75ZM5.00535 4.24465H5.9893V5H5.00535V4.24465ZM5.00535 5H5.9893V5.75536H5.00535V5ZM5.00535 5.75536H5.9893V6.49465H5.00535V5.75536ZM5.9893 0.5H6.99465V1.25536H5.9893V0.5ZM5.9893 1.25536H6.99465V1.99465H5.9893V1.25536ZM5.9893 4.24465H6.99465V5H5.9893V4.24465ZM5.9893 5H6.99465V5.75536H5.9893V5ZM6.99465 4.24465H8V5H6.99465V4.24465Z" />
              </svg>
            </button>
          </DitherWipe>
        </div>
      </main>

      {/* Wipe Controls Toggle */}
      <button
        onClick={() => setShowControls(v => !v)}
        style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
          background: 'rgba(180,148,247,0.9)', color: '#000', border: 'none',
          borderRadius: 4, padding: '6px 12px', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
        }}
      >
        {showControls ? 'Hide' : 'Wipe'} Controls
      </button>

      {showControls && (
        <WipeControls
          cfgs={cfgs}
          setCfg={setCfg}
          onRestart={handleRestart}
          onReset={() => setCfgs({ ...DEFAULTS })}
          isWindowOpen={isWindowOpen}
          onOpen={() => handleOrbitalSelect('hackathon')}
          onClose={handleWindowClose}
          hideInfoWindow={hideInfoWindow}
          setHideInfoWindow={setHideInfoWindow}
        />
      )}
    </>
  );
}

/* =========================================================================
   Wipe Controls Panel
   ========================================================================= */

const ALGORITHMS: OrderedAlgorithm[] = ['bayer2x2', 'bayer4x4', 'bayer8x8'];

const TAB_LABELS: Record<WipeTarget, string> = {
  top: 'top', title: 'title', sub: 'sub', icons: 'icons', btn: 'btn', door: 'door',
};

function WipeControls({
  cfgs, setCfg,
  onRestart, onReset,
  isWindowOpen, onOpen, onClose,
  hideInfoWindow, setHideInfoWindow,
}: {
  cfgs: Record<WipeTarget, WipeConfig>;
  setCfg: (target: WipeTarget, fn: (c: WipeConfig) => WipeConfig) => void;
  onRestart: () => void;
  onReset: () => void;
  isWindowOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  hideInfoWindow: boolean;
  setHideInfoWindow: (v: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<WipeTarget>('door');

  const cfg = cfgs[activeTab];

  const update = <K extends keyof WipeConfig>(key: K, value: WipeConfig[K]) => {
    setCfg(activeTab, prev => ({ ...prev, [key]: value }));
  };

  const S: Record<string, React.CSSProperties> = {
    panel: {
      position: 'fixed', bottom: 48, right: 16, zIndex: 9999,
      background: 'rgba(10,8,15,0.95)', border: '1px solid rgba(180,148,247,0.4)',
      borderRadius: 8, padding: 16, width: 320, maxHeight: '80vh', overflowY: 'auto',
      fontFamily: 'monospace', fontSize: 11, color: '#e0dce8',
      backdropFilter: 'blur(12px)',
    },
    label: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 4, gap: 8,
    },
    input: { width: '100%', accentColor: '#b494f7', marginBottom: 6 },
    select: {
      background: '#1a1520', color: '#e0dce8', border: '1px solid rgba(180,148,247,0.3)',
      borderRadius: 3, padding: '2px 4px', fontSize: 11, fontFamily: 'monospace',
    },
    btn: {
      background: 'rgba(180,148,247,0.2)', color: '#b494f7',
      border: '1px solid rgba(180,148,247,0.4)', borderRadius: 4,
      padding: '5px 10px', cursor: 'pointer', fontFamily: 'monospace',
      fontSize: 11, fontWeight: 600,
    },
    val: { opacity: 0.6, minWidth: 36, textAlign: 'right' as const, fontSize: 10 },
  };

  const tabBtn = (t: WipeTarget): React.CSSProperties => ({
    ...S.btn,
    background: activeTab === t ? 'rgba(180,148,247,0.4)' : 'rgba(180,148,247,0.1)',
    padding: '4px 6px', flex: 1, fontSize: 10,
  });

  return (
    <div style={S.panel}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#b494f7' }}>Wipe Controls</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={S.btn} onClick={isWindowOpen ? onRestart : onOpen}>
            {isWindowOpen ? 'Restart' : 'Play'}
          </button>
          <button style={S.btn} onClick={isWindowOpen ? onClose : onReset}>
            {isWindowOpen ? 'Close' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Hide InfoWindow toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, cursor: 'pointer', fontSize: 11 }}>
        <input
          type="checkbox"
          checked={hideInfoWindow}
          onChange={e => setHideInfoWindow(e.target.checked)}
          style={{ accentColor: '#b494f7' }}
        />
        Hide InfoWindow
      </label>

      {/* Target tabs */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
        {WIPE_TARGETS.map(t => (
          <button key={t} style={tabBtn(t)} onClick={() => setActiveTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Type */}
      <div style={S.label}>
        <span>type</span>
        <select style={S.select} value={cfg.type} onChange={e => update('type', e.target.value as WipeConfig['type'])}>
          <option value="linear">linear</option>
          <option value="radial">radial</option>
        </select>
      </div>

      {/* Direction */}
      <div style={S.label}>
        <span>direction</span>
        <select style={S.select} value={cfg.direction} onChange={e => update('direction', e.target.value as 'in' | 'out')}>
          <option value="out">out</option>
          <option value="in">in</option>
        </select>
      </div>

      {/* Algorithm */}
      <div style={S.label}>
        <span>algorithm</span>
        <select style={S.select} value={cfg.algorithm} onChange={e => update('algorithm', e.target.value as OrderedAlgorithm)}>
          {ALGORITHMS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Angle */}
      <div style={S.label}><span>angle</span><span style={S.val}>{cfg.angle}&deg;</span></div>
      <input type="range" min={0} max={360} step={5} value={cfg.angle} onChange={e => update('angle', +e.target.value)} style={S.input} />

      {/* Center X */}
      <div style={S.label}><span>center X</span><span style={S.val}>{cfg.centerX.toFixed(2)}</span></div>
      <input type="range" min={0} max={1} step={0.05} value={cfg.centerX} onChange={e => update('centerX', +e.target.value)} style={S.input} />

      {/* Center Y */}
      <div style={S.label}><span>center Y</span><span style={S.val}>{cfg.centerY.toFixed(2)}</span></div>
      <input type="range" min={0} max={1} step={0.05} value={cfg.centerY} onChange={e => update('centerY', +e.target.value)} style={S.input} />

      {/* Duration */}
      <div style={S.label}><span>duration</span><span style={S.val}>{cfg.duration}ms</span></div>
      <input type="range" min={100} max={3000} step={50} value={cfg.duration} onChange={e => update('duration', +e.target.value)} style={S.input} />

      {/* Delay */}
      <div style={S.label}><span>delay</span><span style={S.val}>{cfg.delay}ms</span></div>
      <input type="range" min={0} max={2000} step={25} value={cfg.delay} onChange={e => update('delay', +e.target.value)} style={S.input} />

      {/* Pixel Scale */}
      <div style={S.label}><span>pixelScale</span><span style={S.val}>{cfg.pixelScale}</span></div>
      <input type="range" min={1} max={10} step={1} value={cfg.pixelScale} onChange={e => update('pixelScale', +e.target.value)} style={S.input} />

      {/* Edge */}
      <div style={S.label}><span>edge</span><span style={S.val}>{cfg.edge.toFixed(2)}</span></div>
      <input type="range" min={0} max={0.5} step={0.01} value={cfg.edge} onChange={e => update('edge', +e.target.value)} style={S.input} />
    </div>
  );
}
