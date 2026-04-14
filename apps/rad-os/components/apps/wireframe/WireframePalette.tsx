'use client';

import { useState } from 'react';
import { ASCII_COMPONENTS, COMPONENT_CATEGORIES } from './ascii-library';
import type { AsciiComponent } from './types';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface Props {
  selected: AsciiComponent | null;
  onSelect: (c: AsciiComponent | null) => void;
}

// ─────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────

export function WireframePalette({ selected, onSelect }: Props) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(COMPONENT_CATEGORIES)
  );
  const [search, setSearch] = useState('');

  function toggleCat(cat: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const filtered = ASCII_COMPONENTS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        width: 148,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-line)',
        backgroundColor: 'var(--color-page)',
        overflow: 'hidden',
      }}
    >
      {/* Search */}
      <div
        style={{
          padding: '6px 8px',
          borderBottom: '1px solid var(--color-line)',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            fontSize: 11,
            fontFamily: 'inherit',
            background: 'color-mix(in oklch, var(--color-line) 20%, transparent)',
            border: '1px solid var(--color-line)',
            borderRadius: 3,
            padding: '3px 6px',
            color: 'var(--color-main)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Component list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {COMPONENT_CATEGORIES.map((cat) => {
          const items = filtered.filter((c) => c.category === cat);
          if (items.length === 0) return null;
          const isOpen = expandedCats.has(cat);

          return (
            <div key={cat}>
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '4px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-main)',
                  opacity: 0.55,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                }}
              >
                {cat}
                <span style={{ fontSize: 8, opacity: 0.7 }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {/* Items */}
              {isOpen &&
                items.map((item) => {
                  const isSelected = selected?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelect(isSelected ? null : item)}
                      title={item.lines.join('\n')}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '5px 10px',
                        fontSize: 11,
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        background: isSelected
                          ? 'color-mix(in oklch, var(--color-accent) 18%, transparent)'
                          : 'none',
                        color: isSelected ? 'var(--color-accent)' : 'var(--color-main)',
                        border: 'none',
                        borderLeft: isSelected
                          ? '2px solid var(--color-accent)'
                          : '2px solid transparent',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
