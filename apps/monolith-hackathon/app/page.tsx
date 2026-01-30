'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

import type { WindowVariant } from './components/InfoWindow';

const VARIANTS: { key: WindowVariant; label: string }[] = [
  { key: 'glass', label: 'GLS' },
  { key: 'clear', label: 'CLR' },
  { key: 'magma', label: 'MGM' },
  { key: 'ultraviolet', label: 'ULV' },
  { key: 'amber', label: 'AMB' },
];

const AUDIO_URL = '/audio/Joice x Fevra.mp3';

export default function HomePage() {
  const [isMuted, setIsMuted] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [windowVariant, setWindowVariant] = useState<WindowVariant>('glass');
  const [hasExpanded, setHasExpanded] = useState(false);
  const [doorSettled, setDoorSettled] = useState(false);
  const settledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(AUDIO_URL);
    audio.volume = 0.5;
    audio.loop = true;
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
    setActiveWindow((prev) => (prev === id ? null : id));
    setHasExpanded(true);
    setDoorSettled(false);
    if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
    settledTimerRef.current = setTimeout(() => setDoorSettled(true), 4000);
  }, []);

  const handleWindowClose = useCallback(() => {
    setActiveWindow(null);
    setDoorSettled(false);
    if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      <ShaderBackground />
      <CRTShader />

      <main className={`section${activeWindow ? ' door-expanded' : ''}${doorSettled ? ' door-settled' : ''}${activeWindow && windowVariant === 'amber' ? ' variant-amber-active' : ''}`}>
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
              <img src="/assets/monolith_20.avif" alt="" className="portal door" />
              {activeWindow && (
                <InfoWindow
                  key={windowVariant}
                  id={activeWindow}
                  onClose={handleWindowClose}
                  variant={windowVariant}
                />
              )}
            </div>
          </div>
        </div>

        {/* Click-outside backdrop to close */}
        {activeWindow && (
          <div className="door-backdrop" onClick={handleWindowClose} />
        )}

        <OrbitalNav
          onSelect={handleOrbitalSelect}
          isWindowOpen={activeWindow !== null}
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
          </div>

          <a
            href="https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE"
            className={`button_mono hero-bottom${hasExpanded ? ' was-expanded' : ''}`}
          >
            Begin
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
              width="8"
              height="10"
              viewBox="0 0 8 10"
              fill="currentColor"
              className="icon-arrow"
            >
              <path d="M0 5H1.00535V5.75536H0V5ZM1.00535 4.24465H2.0107V5H1.00535V4.24465ZM1.00535 5H2.0107V5.75536H1.00535V5ZM1.00535 8.00536H2.0107V8.74465H1.00535V8.00536ZM1.00535 8.74465H2.0107V9.5H1.00535V8.74465ZM2.0107 3.50536H2.99465V4.24465H2.0107V3.50536ZM2.0107 4.24465H2.99465V5H2.0107V4.24465ZM2.0107 5H2.99465V5.75536H2.0107V5ZM2.0107 6.49465H2.99465V7.25H2.0107V6.49465ZM2.0107 7.25H2.99465V8.00536H2.0107V7.25ZM2.0107 8.00536H2.99465V8.74465H2.0107V8.00536ZM2.99465 2.75H4V3.50536H2.99465V2.75ZM2.99465 3.50536H4V4.24465H2.99465V3.50536ZM2.99465 4.24465H4V5H2.99465V4.24465ZM2.99465 5H4V5.75536H2.99465V5ZM2.99465 5.75536H4V6.49465H2.99465V5.75536ZM2.99465 6.49465H4V7.25H2.99465V6.49465ZM2.99465 7.25H4V8.00536H2.99465V7.25ZM4 1.99465H5.00535V2.75H4V1.99465ZM4 2.75H5.00535V3.50536H4V2.75ZM4 3.50536H5.00535V4.24465H4V3.50536ZM4 4.24465H5.00535V5H4V4.24465ZM4 5H5.00535V5.75536H4V5ZM4 5.75536H5.00535V6.49465H4V5.75536ZM4 6.49465H5.00535V7.25H4V6.49465ZM5.00535 1.25536H5.9893V1.99465H5.00535V1.25536ZM5.00535 1.99465H5.9893V2.75H5.00535V1.99465ZM5.00535 2.75H5.9893V3.50536H5.00535V2.75ZM5.00535 4.24465H5.9893V5H5.00535V4.24465ZM5.00535 5H5.9893V5.75536H5.00535V5ZM5.00535 5.75536H5.9893V6.49465H5.00535V5.75536ZM5.9893 0.5H6.99465V1.25536H5.9893V0.5ZM5.9893 1.25536H6.99465V1.99465H5.9893V1.25536ZM5.9893 4.24465H6.99465V5H5.9893V4.24465ZM5.9893 5H6.99465V5.75536H5.9893V5ZM6.99465 4.24465H8V5H6.99465V4.24465Z" />
            </svg>
          </a>
        </div>
      </main>

      <div className="variant-switcher">
        {VARIANTS.map((v) => (
          <button
            key={v.key}
            className={`variant-btn${windowVariant === v.key ? ' variant-btn--active' : ''}`}
            onClick={() => setWindowVariant(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <button className="mute-button" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
        <img
          src={isMuted ? '/icons/volume-mute.svg' : '/icons/volume-high.svg'}
          alt={isMuted ? 'Muted' : 'Sound on'}
          className="mute-icon"
        />
      </button>
    </>
  );
}
