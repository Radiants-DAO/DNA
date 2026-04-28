'use client';

import { useEffect, useRef, useState } from 'react';

type Token = { var: string; util: string; desc: string };
type Group = { name: string; tokens: Token[] };

const GROUPS: Group[] = [
  {
    name: 'Surfaces',
    tokens: [
      { var: '--color-page', util: 'bg-page', desc: 'Main page background' },
      { var: '--color-card', util: 'bg-card', desc: 'Elevated surface' },
      { var: '--color-depth', util: 'bg-depth', desc: 'Sidebar / depth surface' },
      { var: '--color-inv', util: 'bg-inv', desc: 'Inverted surface (stays dark)' },
      { var: '--color-tinted', util: 'bg-tinted', desc: 'Warm amber tint' },
      { var: '--color-hover', util: 'bg-hover', desc: 'Hover overlay' },
      { var: '--color-active', util: 'bg-active', desc: 'Pressed overlay' },
    ],
  },
  {
    name: 'Text',
    tokens: [
      { var: '--color-main', util: 'bg-main', desc: 'Body text' },
      { var: '--color-head', util: 'bg-head', desc: 'Headings' },
      { var: '--color-sub', util: 'bg-sub', desc: 'Secondary text (85%)' },
      { var: '--color-mute', util: 'bg-mute', desc: 'Muted text (60%)' },
      { var: '--color-flip', util: 'bg-flip', desc: 'Text on inv surfaces' },
      { var: '--color-link', util: 'bg-link', desc: 'Links' },
    ],
  },
  {
    name: 'Borders',
    tokens: [
      { var: '--color-line', util: 'bg-line', desc: 'Primary border' },
      { var: '--color-rule', util: 'bg-rule', desc: 'Muted divider' },
      { var: '--color-focus', util: 'bg-focus', desc: 'Focus ring' },
    ],
  },
  {
    name: 'Accent & Status',
    tokens: [
      { var: '--color-accent', util: 'bg-accent', desc: 'Primary accent' },
      { var: '--color-accent-inv', util: 'bg-accent-inv', desc: 'Accent foreground' },
      { var: '--color-accent-soft', util: 'bg-accent-soft', desc: 'Soft accent' },
      { var: '--color-danger', util: 'bg-danger', desc: 'Errors' },
      { var: '--color-success', util: 'bg-success', desc: 'Success' },
      { var: '--color-warning', util: 'bg-warning', desc: 'Warnings' },
    ],
  },
];

function Swatch({ token }: { token: Token }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!ref.current) return;
    const resolved = getComputedStyle(ref.current)
      .getPropertyValue(token.var)
      .trim();
    setValue(resolved);
  }, [token.var]);

  return (
    <div ref={ref} className="flex items-center gap-3 min-w-0">
      <div
        className={`${token.util} rounded-sm border border-rule`}
        style={{ width: 40, height: 40, flexShrink: 0 }}
      />
      <div className="flex flex-col min-w-0">
        <code className="text-xs text-main truncate">{token.var}</code>
        <code className="text-xs text-mute truncate">{value || '—'}</code>
      </div>
    </div>
  );
}

function Row({ token }: { token: Token }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center py-3 border-b border-rule">
      <div className="text-sm text-sub col-span-full mb-1">
        <span className="text-main">{token.var}</span>
        <span className="text-mute"> — {token.desc}</span>
      </div>
      <div className="bg-page p-3 rounded-sm border border-line">
        <Swatch token={token} />
      </div>
      <span className="text-mute px-2" aria-hidden>
        →
      </span>
      <div className="dark bg-page p-3 rounded-sm border border-line">
        <Swatch token={token} />
      </div>
    </div>
  );
}

export default function ColorMappingPage() {
  return (
    <main className="bg-page text-main min-h-screen p-8">
      <div className="mx-auto" style={{ maxWidth: '64rem' }}>
        <header className="mb-8">
          <h1 className="text-3xl text-head mb-2">Color Mode Mapping</h1>
          <p className="text-sub">
            Every semantic color token and how it resolves in light vs. dark mode.
            The right column applies <code className="text-main">.dark</code> to
            force dark-mode overrides.
          </p>
        </header>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 pb-3 mb-4 border-b border-line">
          <h2 className="text-sm uppercase text-mute">Light</h2>
          <span aria-hidden />
          <h2 className="text-sm uppercase text-mute">Dark</h2>
        </div>

        {GROUPS.map((group) => (
          <section key={group.name} className="mb-10">
            <h2 className="text-xl text-head mb-4">{group.name}</h2>
            <div>
              {group.tokens.map((t) => (
                <Row key={t.var} token={t} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
