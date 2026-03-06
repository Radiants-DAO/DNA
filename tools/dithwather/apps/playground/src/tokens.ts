export const T = {
  surface: { primary: '#0F0E0C', elevated: '#1A1918', muted: '#252422', tertiary: '#3D2E1A' },
  content: { heading: '#FFFFFF', primary: '#FEF8E2', muted: 'rgba(254, 248, 226, 0.6)' },
  edge: { primary: '#FEF8E2', muted: 'rgba(254, 248, 226, 0.2)', focus: '#FCE184' },
  action: { primary: '#FCE184', accent: '#FCC383' },
  brand: {
    sunYellow: '#FCE184', skyBlue: '#95BAD2', sunsetFuzz: '#FCC383',
    sunRed: '#FF6B63', green: '#CEF5CA',
  },
  font: {
    heading: "'Joystix Monospace', monospace",
    body: "'Mondwest', system-ui, sans-serif",
    code: "'PixelCode', 'SF Mono', 'Fira Code', monospace",
  },
  shadow: { card: '2px 2px 0 0 #000000', btn: '0 1px 0 0 #000000', btnHover: '0 3px 0 0 #000000' },
} as const
