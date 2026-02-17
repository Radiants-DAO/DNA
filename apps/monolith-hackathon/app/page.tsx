'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

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

import { useDitherDissolve } from './hooks/useDitherDissolve';
import { ORBITAL_ITEMS } from './data/orbital-items';

const AUDIO_URL = '/audio/Joice x Fevra.mp3';
const VALID_PANELS = new Set(['hackathon', 'rules', 'prizes', 'judges', 'toolbox', 'faq', 'calendar', 'legal']);

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
  const [doorSettled, setDoorSettled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const settledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialTab = searchParams.get('tab');

  const ditherStyle = useDitherDissolve(doorSettled, { algorithm: 'bayer8x8', pixelScale: 3, duration: 800 });

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

  // Door animation state — react to window open/close transitions
  const prevOpen = useRef(false);
  useEffect(() => {
    if (isWindowOpen && !prevOpen.current) {
      setHasExpanded(true);
      setDoorSettled(false);
      if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
      settledTimerRef.current = setTimeout(() => setDoorSettled(true), 750);
    } else if (!isWindowOpen && prevOpen.current) {
      setDoorSettled(false);
      if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
    }
    prevOpen.current = isWindowOpen;
  }, [isWindowOpen]);

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

  // Escape closes the active InfoWindow.
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

    // Cancel any in-progress fade
    if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);

    const DURATION = 300;
    const TARGET = 0.5;
    const start = performance.now();
    const from = audio.volume;

    if (next) {
      // Fade out then mute
      const fade = (now: number) => {
        const t = Math.min((now - start) / DURATION, 1);
        audio.volume = Math.max(0, from * (1 - t));
        if (t < 1) { fadeRef.current = requestAnimationFrame(fade); }
        else { audio.muted = true; audio.volume = TARGET; fadeRef.current = null; }
      };
      fadeRef.current = requestAnimationFrame(fade);
    } else {
      // Unmute at 0 then fade in
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

  return (
    <>
      <ShaderBackground />
      <CRTShader />

      <main className={`section${isWindowOpen ? ' door-expanded' : ''}${doorSettled ? ' door-settled' : ''}`}>
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
              <img src="/assets/monolith_20.avif" alt="" className="portal door" style={ditherStyle} />
              {/* Mobile: render window inside door-wrapper */}
              {isMobile && activeWindow && (
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

        {/* Desktop: render draggable window */}
        {!isMobile && activeWindow && (
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

        {/* Backdrop (dimming overlay) */}
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

          <div className="hero-center" style={{ textAlign: 'center' }}>
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
            <AnimatedSubtitle />
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
          </div>

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
        </div>
      </main>

    </>
  );
}
