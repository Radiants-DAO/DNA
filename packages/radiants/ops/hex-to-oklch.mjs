import { converter } from 'culori';

const toOklch = converter('oklch');

// All hex values from tokens.css and dark.css
const hexValues = {
  // Brand palette (tokens.css)
  '--color-cream':        '#FEF8E2',
  '--color-ink':          '#0F0E0C',
  '--color-pure-black':   '#000000',
  '--color-sun-yellow':   '#FCE184',
  '--color-sky-blue':     '#95BAD2',
  '--color-sunset-fuzz':  '#FCC383',
  '--color-sun-red':      '#FF6B63',
  '--color-mint':         '#CEF5CA',
  '--color-pure-white':   '#FFFFFF',
  '--color-success-mint': '#22C55E',

  // Dark-only (dark.css)
  '--color-surface-tertiary-dark': '#3D2E1A',
};

// All rgba values from tokens.css and dark.css (unique base colors)
const rgbaValues = {
  'ink @ various alphas':       'rgb(15, 14, 12)',
  'cream @ various alphas':     'rgb(254, 248, 226)',
  'sun-yellow @ various alphas':'rgb(252, 225, 132)',
  'sun-red @ various alphas':   'rgb(255, 107, 99)',
  'mint @ various alphas':      'rgb(206, 245, 202)',
  'sky-blue @ various alphas':  'rgb(149, 186, 210)',
};

function fmt(oklch) {
  // Round: L to 4 decimals, C to 4, H to 2
  const l = oklch.l.toFixed(4);
  const c = oklch.c.toFixed(4);
  const h = oklch.h != null ? oklch.h.toFixed(2) : '0';
  return `oklch(${l} ${c} ${h})`;
}

console.log('=== HEX → OKLCH ===\n');
for (const [name, hex] of Object.entries(hexValues)) {
  const oklch = toOklch(hex);
  console.log(`${name.padEnd(38)} ${hex.padEnd(10)} → ${fmt(oklch)}`);
}

console.log('\n=== RGBA BASE COLORS → OKLCH (add " / alpha" suffix) ===\n');
for (const [name, rgb] of Object.entries(rgbaValues)) {
  const oklch = toOklch(rgb);
  console.log(`${name.padEnd(38)} → ${fmt(oklch)}`);
}
