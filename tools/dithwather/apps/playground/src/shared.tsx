import { T } from './tokens'

// ============================================================================
// Shared Styles
// ============================================================================

export const sectionStyle: React.CSSProperties = {
  marginBottom: '64px',
}

export const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: T.font.heading,
  fontSize: '20px',
  fontWeight: 700,
  color: T.content.heading,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

export const sectionDescStyle: React.CSSProperties = {
  fontFamily: T.font.code,
  fontSize: '12px',
  color: T.content.muted,
  marginBottom: '24px',
  letterSpacing: '0.02em',
}

export const cellLabelStyle: React.CSSProperties = {
  fontFamily: T.font.code,
  fontSize: '8px',
  color: 'rgba(254, 248, 226, 0.4)',
  marginTop: '6px',
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

export const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: 'rgba(254, 248, 226, 0.1)',
  marginTop: '64px',
}

export const cardStyle: React.CSSProperties = {
  width: '100%',
  height: '120px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  border: `1px solid ${T.edge.muted}`,
  boxShadow: T.shadow.card,
}

export const cardLabelStyle: React.CSSProperties = {
  fontFamily: T.font.code,
  fontSize: '12px',
  fontWeight: 600,
  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
}

export const cpLabelStyle: React.CSSProperties = {
  fontFamily: T.font.code,
  fontSize: '10px',
  color: T.content.muted,
  display: 'block',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

export const cpInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: T.surface.primary,
  color: T.content.primary,
  border: `1px solid ${T.edge.muted}`,
  borderRadius: '3px',
  fontFamily: T.font.code,
  fontSize: '11px',
}

// ============================================================================
// Shared Components
// ============================================================================

export function Badge({ color }: { color: string }) {
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block',
      width: '8px',
      height: '8px',
      background: color,
      borderRadius: '2px',
      flexShrink: 0,
    }} />
  )
}

export function CPSlider(
  { label, value, onChange, min = 0, max = 1, step = 0.01 }:
  { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }
) {
  const display = step >= 1 ? String(value) : value.toFixed(2)
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
        <label style={cpLabelStyle}>{label}</label>
        <span style={{ ...cpLabelStyle, color: T.brand.sunYellow }}>{display}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{ width: '100%', accentColor: T.brand.sunYellow }}
      />
    </div>
  )
}

export function CPSelect<V extends string>(
  { label, value, onChange, options }:
  { label: string; value: V; onChange: (v: V) => void; options: { value: V; label: string }[] }
) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <label style={cpLabelStyle}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
        style={cpInputStyle}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
