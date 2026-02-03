'use client';

import dynamic from 'next/dynamic';

const ShaderBackground = dynamic(() => import('../components/ShaderBackground'), {
  ssr: false,
  loading: () => <div className="shader-background" style={{ opacity: 0 }} />,
});

const CRTShader = dynamic(() => import('../components/CRTShader'), {
  ssr: false,
});

const AnimatedSubtitle = dynamic(() => import('../components/AnimatedSubtitle'), {
  ssr: false,
  loading: () => <h4 className="monolith-sub">Hackathon</h4>,
});

export default function EmbedPage() {
  return (
    <>
      <ShaderBackground />
      <CRTShader />

      <main className="section">
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
            <img src="/assets/monolith_20.avif" alt="" className="portal door" />
          </div>
        </div>

        <div className="monolith_text monolith_text--minimal">
          <div style={{ textAlign: 'center' }}>
            <h1 className="monolith-text">
              {'MONOLITH'.split('').map((letter, i) => (
                <span
                  key={i}
                  className="monolith-letter"
                  style={{ '--delay': `${0.6 + i * 0.1}s` } as React.CSSProperties}
                >
                  {letter}
                </span>
              ))}
            </h1>
            <AnimatedSubtitle />
          </div>
        </div>
      </main>
    </>
  );
}
