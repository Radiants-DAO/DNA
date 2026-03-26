import type { PatternPlaygroundState, CodeFormat } from './types';

/** Generate a JSX snippet for the configured pattern with mouse follower */
function generateJSX(s: PatternPlaygroundState): string {
  const props: string[] = [`pat="${s.pat}"`];
  props.push(`color="${s.color}"`);
  if (s.bg !== 'transparent') props.push(`bg="${s.bg}"`);
  if (s.scale !== 1) props.push(`scale={${s.scale}}`);

  const lines = [`<Pattern ${props.join(' ')} />`];

  if (s.glowEnabled) {
    lines.push('');
    lines.push('/* Dark mode mouse-follower glow');
    lines.push('   Set --mouse-x / --mouse-y on a parent via onMouseMove:');
    lines.push('   el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`)');
    lines.push('   el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`) */');
    lines.push('');
    lines.push('// Override glow per-instance via style:');
    lines.push(`// --pat-glow-color: ${s.glowCenter}`);
    lines.push(`// --pat-glow-radius: ${s.glowRadius}px`);
    lines.push(`// --pat-glow-base: ${s.glowBase}`);
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

  if (s.glowEnabled) {
    lines.push('');
    lines.push('/* Dark mode mouse-follower glow */');
    lines.push('.my-pattern-container {');
    lines.push('  /* Set via JS onMouseMove */');
    lines.push('  --mouse-x: -9999px;');
    lines.push('  --mouse-y: -9999px;');
    lines.push('');
    lines.push(`  --pat-glow-color: ${s.glowCenter};`);
    lines.push(`  --pat-glow-radius: ${s.glowRadius}px;`);
    lines.push(`  --pat-glow-base: ${s.glowBase};`);
    lines.push('}');
    lines.push('');
    lines.push('/* Click burst — add .rdna-pat--active on mousedown */');
    lines.push('/* (handled by dark.css — wider + brighter gradient) */');
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

  if (s.glowEnabled) {
    lines.push('');
    lines.push('/* Dark mode glow — set on parent container style */');
    lines.push(`// --pat-glow-color: ${s.glowCenter}`);
    lines.push(`// --pat-glow-radius: ${s.glowRadius}px`);
    lines.push(`// --pat-glow-base: ${s.glowBase}`);
    lines.push('');
    lines.push('/* Mouse tracking (on parent container) */');
    lines.push('// onMouseMove={(e) => {');
    lines.push('//   const rect = e.currentTarget.getBoundingClientRect();');
    lines.push('//   e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);');
    lines.push('//   e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);');
    lines.push('// }}');
    lines.push('// onMouseLeave={(e) => {');
    lines.push('//   e.currentTarget.style.setProperty("--mouse-x", "-9999px");');
    lines.push('//   e.currentTarget.style.setProperty("--mouse-y", "-9999px");');
    lines.push('// }}');
    lines.push('');
    lines.push('/* Click burst — toggle class on mousedown/mouseup */');
    lines.push('// Add "rdna-pat--active" to pattern element on mousedown');
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
