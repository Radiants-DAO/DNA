import { useState, useEffect, lazy, Suspense } from 'react'
import { DitherProvider } from '@dithwather/react'
import { T } from './tokens'
import './styles.css'

// ============================================================================
// Lazy section imports (automatic code splitting)
// ============================================================================

const Gallery = lazy(() => import('./sections/Gallery'))
const UIPatterns = lazy(() => import('./sections/UIPatterns'))
const Interactive = lazy(() => import('./sections/Interactive'))
const Recipes = lazy(() => import('./sections/Recipes'))
const Sandbox = lazy(() => import('./sections/Sandbox'))

// ============================================================================
// Tab definitions
// ============================================================================

const TABS = [
  { id: 'gallery', label: 'Gallery', color: T.brand.sunYellow },
  { id: 'ui-patterns', label: 'UI Patterns', color: T.brand.skyBlue },
  { id: 'interactive', label: 'Interactive', color: T.brand.green },
  { id: 'recipes', label: 'Recipes', color: T.brand.sunsetFuzz },
  { id: 'sandbox', label: 'Sandbox', color: T.brand.sunRed },
] as const

type TabId = (typeof TABS)[number]['id']

function getInitialTab(): TabId {
  const hash = window.location.hash.slice(1)
  if (TABS.some(t => t.id === hash)) return hash as TabId
  return 'gallery'
}

// ============================================================================
// Tab Content
// ============================================================================

function TabContent({ activeTab }: { activeTab: TabId }) {
  switch (activeTab) {
    case 'gallery': return <Gallery />
    case 'ui-patterns': return <UIPatterns />
    case 'interactive': return <Interactive />
    case 'recipes': return <Recipes />
    case 'sandbox': return <Sandbox />
  }
}

// ============================================================================
// Loading fallback
// ============================================================================

function TabFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
      fontFamily: T.font.code,
      fontSize: 12,
      color: T.content.muted,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      loading...
    </div>
  )
}

// ============================================================================
// App
// ============================================================================

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab)

  // Sync hash → tab
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (TABS.some(t => t.id === hash)) {
        setActiveTab(hash as TabId)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Sync tab → hash
  useEffect(() => {
    window.location.hash = activeTab
  }, [activeTab])

  return (
    <DitherProvider defaults={{ algorithm: 'bayer4x4' }}>
      <div
        style={{
          minHeight: '100vh',
          background: T.surface.primary,
          color: T.content.primary,
          fontFamily: T.font.body,
          padding: '48px 24px',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        <header style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: T.font.heading,
              fontSize: '32px',
              fontWeight: 700,
              color: T.content.heading,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textShadow: `2px 2px 0 ${T.surface.tertiary}`,
              marginBottom: '8px',
            }}
          >
            dithwather
          </h1>
          <p
            style={{
              fontFamily: T.font.code,
              fontSize: '14px',
              color: T.content.muted,
              letterSpacing: '0.02em',
            }}
          >
            gradient dithering for react -- 5 gradient types, per-pixel bayer comparison
          </p>
          <div style={{
            marginTop: '24px',
            height: '1px',
            background: `linear-gradient(90deg, ${T.brand.sunYellow}, ${T.brand.sunsetFuzz}, ${T.brand.sunRed}, ${T.brand.skyBlue}, transparent)`,
          }} />
        </header>

        {/* TabBar */}
        <nav
          role="tablist"
          style={{
            display: 'flex',
            gap: '4px',
            marginBottom: 32,
            flexWrap: 'wrap',
            borderBottom: `1px solid ${T.edge.muted}`,
            paddingBottom: 0,
          }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: T.font.code,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isActive ? T.content.heading : T.content.muted,
                  textDecoration: 'none',
                  padding: '8px 14px',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  borderRadius: 0,
                  background: isActive ? T.surface.elevated : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: -1,
                }}
              >
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: 1,
                  background: tab.color,
                  display: 'inline-block',
                  opacity: isActive ? 1 : 0.5,
                }} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Tab content */}
        <div role="tabpanel" style={{ marginTop: 16 }}>
          <Suspense fallback={<TabFallback />}>
            <TabContent activeTab={activeTab} />
          </Suspense>
        </div>
      </div>
    </DitherProvider>
  )
}
