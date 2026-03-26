import type { PatternPlaygroundState, CodeFormat } from './types';

/** Generate a JSX snippet for the configured pattern */
function generateJSX(s: PatternPlaygroundState): string {
  const props: string[] = [`pat="${s.pat}"`];
  props.push(`color="${s.color}"`);
  if (s.bg !== 'transparent') props.push(`bg="${s.bg}"`);
  if (s.scale !== 1) props.push(`scale={${s.scale}}`);

  const lines = [`<Pattern ${props.join(' ')} />`];

  lines.push('');
  lines.push('/* Hover state */');
  lines.push(`// color: "${s.hoverColor}"`);
  if (s.hoverBg !== 'transparent') lines.push(`// bg: "${s.hoverBg}"`);
  lines.push(`// transform: scale(${s.hoverScale})`);
  lines.push(`// opacity: ${s.hoverOpacity}`);

  lines.push('');
  lines.push('/* Pressed state */');
  lines.push(`// color: "${s.pressedColor}"`);
  if (s.pressedBg !== 'transparent') lines.push(`// bg: "${s.pressedBg}"`);
  lines.push(`// transform: scale(${s.pressedScale}) translateY(${s.pressedTranslateY}px)`);

  if (s.glowEnabled) {
    lines.push('');
    lines.push('/* Dark mode glow (set on element via style) */');
    lines.push(`// --pat-glow-center: ${s.glowCenter}`);
    lines.push(`// --pat-glow-spread: ${s.glowSpread}%`);
    lines.push(`// --pat-glow-fade: ${s.glowFade}%`);
  }

  return lines.join('\n');
}

/** Generate CSS custom properties for the configured pattern */
function generateCSS(s: PatternPlaygroundState): string {
  const lines: string[] = [
    '/* Pattern base */',
    `.my-pattern {`,
    `  --pat-color: ${s.color};`,
  ];
  if (s.bg !== 'transparent') lines.push(`  background-color: ${s.bg};`);
  if (s.scale !== 1) lines.push(`  /* scale: ${s.scale}x (${s.scale * 8}px) */`);
  lines.push(`  mask-image: var(--pat-${s.pat});`);
  lines.push('}');

  lines.push('');
  lines.push('.my-pattern:hover {');
  lines.push(`  --pat-color: ${s.hoverColor};`);
  if (s.hoverBg !== 'transparent') lines.push(`  background-color: ${s.hoverBg};`);
  lines.push(`  transform: scale(${s.hoverScale});`);
  lines.push(`  opacity: ${s.hoverOpacity};`);
  lines.push('}');

  lines.push('');
  lines.push('.my-pattern:active {');
  lines.push(`  --pat-color: ${s.pressedColor};`);
  if (s.pressedBg !== 'transparent') lines.push(`  background-color: ${s.pressedBg};`);
  lines.push(`  transform: scale(${s.pressedScale}) translateY(${s.pressedTranslateY}px);`);
  lines.push('}');

  if (s.glowEnabled) {
    lines.push('');
    lines.push('.dark .my-pattern {');
    lines.push(`  --pat-glow-center: ${s.glowCenter};`);
    lines.push(`  --pat-glow-spread: ${s.glowSpread}%;`);
    lines.push(`  --pat-glow-fade: ${s.glowFade}%;`);
    lines.push('}');
  }

  return lines.join('\n');
}

/** Generate Tailwind utility classes for the configured pattern */
function generateTailwind(s: PatternPlaygroundState): string {
  const base = [`rdna-pat rdna-pat--${s.pat}`];
  if (s.scale > 1) base.push(`rdna-pat--${s.scale}x`);

  const lines = [
    '/* Base classes */',
    `className="${base.join(' ')}"`,
    `style={{ '--pat-color': '${s.color}'${s.bg !== 'transparent' ? `, backgroundColor: '${s.bg}'` : ''} }}`,
  ];

  lines.push('');
  lines.push('/* Hover (via motion whileHover) */');
  lines.push(`whileHover={{ scale: ${s.hoverScale}, opacity: ${s.hoverOpacity} }}`);
  lines.push(`// swap --pat-color to: ${s.hoverColor}`);

  lines.push('');
  lines.push('/* Pressed (via motion whileTap) */');
  lines.push(`whileTap={{ scale: ${s.pressedScale}, y: ${s.pressedTranslateY} }}`);
  lines.push(`// swap --pat-color to: ${s.pressedColor}`);

  if (s.glowEnabled) {
    lines.push('');
    lines.push('/* Dark mode glow overrides (inline style) */');
    lines.push(`// --pat-glow-center: ${s.glowCenter}`);
    lines.push(`// --pat-glow-spread: ${s.glowSpread}%`);
    lines.push(`// --pat-glow-fade: ${s.glowFade}%`);
  }

  return lines.join('\n');
}

export function generateCode(format: CodeFormat, state: PatternPlaygroundState): string {
  switch (format) {
    case 'jsx': return generateJSX(state);
    case 'css': return generateCSS(state);
    case 'tailwind': return generateTailwind(state);
  }
}
